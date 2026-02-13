#!/usr/bin/env python3

import argparse
import html
import json
import os
import re
import sqlite3
import sys
import tempfile
import zipfile
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Set, Tuple


ROOT_COL_CANDIDATES = (
    "broot",
    "root",
    "root_key",
    "key",
    "entry_key",
    "buckwalter",
    "bw",
    "headword",
    "hw",
    "word",
)

TEXT_COL_CANDIDATES = (
    "entry",
    "text",
    "html",
    "xml",
    "body",
    "definition",
    "content",
    "data",
)

ARABIC_COL_CANDIDATES = (
    "rootArabic",
    "root_arabic",
    "arabic_root",
    "arabic",
    "root_ar",
    # Common in Lane SQLite: root is Arabic and broot is Buckwalter.
    "root",
)


LOCATION_RE = re.compile(r"^\((\d+):(\d+):(\d+):(\d+)\)\t([^\t]*)\t([^\t]*)\t(.+)$")


def _strip_html(value: str) -> str:
    if not value:
        return ""
    text = value
    text = re.sub(r"(?i)<br\\s*/?>", "\n", text)
    text = re.sub(r"(?s)<style.*?>.*?</style>", "", text)
    text = re.sub(r"(?s)<script.*?>.*?</script>", "", text)
    text = re.sub(r"(?s)<[^>]+>", "", text)
    text = html.unescape(text)
    text = text.replace("\u00a0", " ")
    return text


def _normalize_text(value: str) -> str:
    text = _strip_html(value)
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n[ \t]+", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _split_definitions(value: str, max_defs: int) -> List[str]:
    text = _normalize_text(value)
    if not text:
        return []
    parts = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    if not parts:
        parts = [text]
    if max_defs > 0:
        parts = parts[:max_defs]
    return parts


def _read_zip_to_temp(zip_path: Path) -> Path:
    with zipfile.ZipFile(zip_path, "r") as zf:
        names = zf.namelist()
        sqlite_candidates = [n for n in names if n.lower().endswith(".sqlite")]
        if sqlite_candidates:
            target = sqlite_candidates[0]
        else:
            # Fall back to the first file. We'll error later if it isn't a SQLite DB.
            target = (
                next((n for n in names if not n.endswith("/")), "") if names else ""
            )
        if not target:
            raise RuntimeError(f"No files found inside zip: {zip_path}")
        data = zf.read(target)

    fd, tmp_path = tempfile.mkstemp(prefix="lane_lexicon_", suffix=".sqlite")
    os.close(fd)
    Path(tmp_path).write_bytes(data)
    return Path(tmp_path)


def _connect_sqlite(sqlite_path: Path) -> Tuple[sqlite3.Connection, Optional[Path]]:
    tmp_path: Optional[Path] = None
    path = sqlite_path
    if path.suffix.lower() == ".zip":
        tmp_path = _read_zip_to_temp(path)
        path = tmp_path

    conn = sqlite3.connect(str(path))
    conn.row_factory = sqlite3.Row
    return conn, tmp_path


def _list_tables(conn: sqlite3.Connection) -> List[str]:
    rows = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    ).fetchall()
    return [r[0] for r in rows]


def _table_columns(conn: sqlite3.Connection, table: str) -> List[str]:
    rows = conn.execute(f"PRAGMA table_info({table})").fetchall()
    return [r[1] for r in rows]  # 2nd column is name


def _pick_best_table(conn: sqlite3.Connection) -> Tuple[str, str, str, Optional[str]]:
    best: Optional[Tuple[int, str, str, str, Optional[str]]] = None

    for table in _list_tables(conn):
        cols = _table_columns(conn, table)
        col_lut = {c.lower(): c for c in cols}

        root_col = next((col_lut[c] for c in ROOT_COL_CANDIDATES if c in col_lut), "")
        text_col = next((col_lut[c] for c in TEXT_COL_CANDIDATES if c in col_lut), "")
        arabic_col = next(
            (col_lut[c] for c in ARABIC_COL_CANDIDATES if c in col_lut), None
        )

        if root_col.lower() == "broot" and not arabic_col and "root" in col_lut:
            arabic_col = col_lut["root"]

        score = 0
        if root_col:
            score += 3
        if text_col:
            score += 3
        if arabic_col:
            score += 1

        if not root_col or not text_col:
            continue

        # Lightweight existence check.
        try:
            conn.execute(f"SELECT 1 FROM {table} LIMIT 1").fetchone()
            score += 1
        except sqlite3.Error:
            continue

        if best is None or score > best[0]:
            best = (score, table, root_col, text_col, arabic_col)

    if not best:
        tables = _list_tables(conn)
        preview = []
        for table in tables[:14]:
            cols = _table_columns(conn, table)
            preview.append(
                f"- {table}: {', '.join(cols[:18])}{' ...' if len(cols) > 18 else ''}"
            )
        raise RuntimeError(
            "Could not auto-detect a table/columns for root + entry text.\n\n"
            "Tables found:\n"
            + "\n".join(preview)
            + ("\n- (more tables omitted)" if len(tables) > 14 else "")
            + "\n\nRe-run with --table --root-col --text-col to override."
        )

    _, table, root_col, text_col, arabic_col = best
    return table, root_col, text_col, arabic_col


def _parse_quran_roots(morphology_path: Path) -> Set[str]:
    def iter_lines() -> Iterable[str]:
        if morphology_path.suffix.lower() == ".zip":
            with zipfile.ZipFile(morphology_path, "r") as zf:
                # Quranic corpus zip generally contains a single text file.
                names = zf.namelist()
                target = next((n for n in names if n.lower().endswith(".txt")), "")
                if not target:
                    target = (
                        next((n for n in names if not n.endswith("/")), "")
                        if names
                        else ""
                    )
                if not target:
                    return []
                with zf.open(target, "r") as f:
                    for raw in f:
                        yield raw.decode("utf-8", errors="ignore")
            return
        with morphology_path.open("r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                yield line

    roots: Set[str] = set()
    for line in iter_lines():
        if not line or line[0] == "#" or line.startswith("LOCATION\t"):
            continue
        match = LOCATION_RE.match(line.rstrip("\n"))
        if not match:
            continue
        features = match.group(7) or ""
        if "STEM|" not in features:
            continue
        root_match = re.search(r"(?:^|\|)ROOT:([^|\t]+)", features)
        if not root_match:
            continue
        root = root_match.group(1).strip()
        if root:
            roots.add(root)
    return roots


def _default_morphology_candidates(repo_root: Path) -> List[Path]:
    return [
        repo_root / "app" / "data" / "quranic-corpus-morphology-0.4.txt",
        repo_root / "app" / "data" / "quranic-corpus-morphology-0.4.zip",
        Path.home() / "Downloads" / "quranic-corpus-morphology-0.4.txt",
        Path.home() / "Downloads" / "quranic-corpus-morphology-0.4.zip",
    ]


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Convert a Lane Lexicon SQLite database into app/data/lane-lexicon.json."
    )
    parser.add_argument(
        "--sqlite",
        required=True,
        help="Path to lexicon.sqlite or a zip containing it (e.g. lexicon.sqlite.zip).",
    )
    parser.add_argument(
        "--out",
        default="app/data/lane-lexicon.json",
        help="Output JSON path (default: app/data/lane-lexicon.json).",
    )
    parser.add_argument("--table", help="Override the source table name.")
    parser.add_argument("--root-col", help="Override the root key column name.")
    parser.add_argument("--text-col", help="Override the entry text column name.")
    parser.add_argument(
        "--arabic-col", help="Optional: override the Arabic root column name."
    )
    parser.add_argument(
        "--max-defs",
        type=int,
        default=18,
        help="Max definition paragraphs per root (default: 18). Use 0 for unlimited.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Limit processed rows for quick testing (default: 0 = no limit).",
    )
    parser.add_argument(
        "--only-quran-roots",
        action="store_true",
        help="Filter to roots that appear in the Qur'an morphology corpus file.",
    )
    parser.add_argument(
        "--morphology",
        help="Path to quranic-corpus-morphology-0.4.zip|.txt (used with --only-quran-roots).",
    )

    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[1]
    sqlite_path = Path(args.sqlite).expanduser()
    out_path = Path(args.out).expanduser()

    if not sqlite_path.exists():
        print(f"SQLite file not found: {sqlite_path}", file=sys.stderr)
        return 2

    quran_roots: Optional[Set[str]] = None
    if args.only_quran_roots:
        morph_path: Optional[Path] = (
            Path(args.morphology).expanduser() if args.morphology else None
        )
        if not morph_path:
            for candidate in _default_morphology_candidates(repo_root):
                if candidate.exists():
                    morph_path = candidate
                    break
        if not morph_path or not morph_path.exists():
            print(
                "Morphology file not found. Provide --morphology or place it at app/data/quranic-corpus-morphology-0.4.zip",
                file=sys.stderr,
            )
            return 2
        print(f"Scanning Qur'an roots from: {morph_path}", file=sys.stderr)
        quran_roots = _parse_quran_roots(morph_path)
        print(
            f"Found {len(quran_roots)} unique roots in morphology corpus.",
            file=sys.stderr,
        )

    conn, tmp = _connect_sqlite(sqlite_path)
    try:
        if args.table and args.root_col and args.text_col:
            table = args.table
            root_col = args.root_col
            text_col = args.text_col
            arabic_col = args.arabic_col
        else:
            table, root_col, text_col, arabic_col = _pick_best_table(conn)

        if args.table and not (args.root_col and args.text_col):
            print(
                "If you pass --table, also pass --root-col and --text-col (or omit --table to auto-detect).",
                file=sys.stderr,
            )
            return 2

        select_cols = [root_col, text_col]
        if arabic_col:
            select_cols.append(arabic_col)

        cols = _table_columns(conn, table)
        col_lut = {c.lower(): c for c in cols}
        page_col = col_lut.get("page")
        nodenum_col = col_lut.get("nodenum")

        print(
            f"Using table={table} root_col={root_col} text_col={text_col}"
            + (f" arabic_col={arabic_col}" if arabic_col else ""),
            file=sys.stderr,
        )

        query = f"SELECT {', '.join(select_cols)} FROM {table}"
        order_cols: List[str] = []
        if page_col:
            order_cols.append(page_col)
        if nodenum_col:
            order_cols.append(nodenum_col)
        if order_cols:
            query += f" ORDER BY {root_col} ASC, {', '.join(order_cols)} ASC"
        if args.limit and args.limit > 0:
            query += f" LIMIT {int(args.limit)}"

        out_map: Dict[str, Dict[str, object]] = {}
        cursor = conn.execute(query)
        for row in cursor:
            raw_root = row[root_col]
            if raw_root is None:
                continue
            root = str(raw_root).strip()
            if not root:
                continue
            if quran_roots is not None and root not in quran_roots:
                continue
            if root in out_map:
                # Keep only the earliest entry for this root (ordered by page/nodenum when available).
                continue

            raw_entry = row[text_col]
            entry_text = _normalize_text(
                str(raw_entry) if raw_entry is not None else ""
            )
            if not entry_text:
                continue

            root_arabic = ""
            if arabic_col:
                raw_ar = row[arabic_col]
                root_arabic = str(raw_ar).strip() if raw_ar is not None else ""

            definitions = _split_definitions(entry_text, args.max_defs)
            if not definitions:
                continue

            out_map[root] = {
                "rootArabic": root_arabic or None,
                "coreMeanings": [],
                "definitions": definitions,
            }

        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(
            json.dumps(out_map, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
            encoding="utf-8",
        )

        print(f"Wrote {len(out_map)} roots to: {out_path}", file=sys.stderr)
        return 0
    finally:
        conn.close()
        if tmp and tmp.exists():
            try:
                tmp.unlink()
            except OSError:
                pass


if __name__ == "__main__":
    raise SystemExit(main())
