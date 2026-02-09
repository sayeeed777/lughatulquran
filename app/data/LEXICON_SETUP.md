# Lane Lexicon Setup

To enable root meanings/definitions in Study Mode, add a JSON file at:

- `app/data/lane-lexicon.json`

A starter file is already included. Expand it with more roots as needed, or generate it from a Lane Lexicon SQLite database.

Schema:

```json
{
  "rHm": {
    "rootArabic": "ر ح م",
    "coreMeanings": ["mercy", "compassion"],
    "definitions": ["Definition sentence 1", "Definition sentence 2"]
  }
}
```

Notes:

- Key must be the Buckwalter root (e.g. `rHm`, `Hmd`, `qwm`).
- `coreMeanings` and `definitions` are arrays of strings.
- An example file is provided at `app/data/lane-lexicon.example.json`.

## Generate From SQLite

If you have a Lane Lexicon SQLite file (often named `lexicon.sqlite` or `lexicon.sqlite.zip`), you can convert it to the JSON format used by this app:

```bash
python3 scripts/convert_lane_sqlite_to_json.py --sqlite /path/to/lexicon.sqlite
```

Optional: generate only roots that appear in the Qur'an morphology corpus (keeps the JSON much smaller):

```bash
python3 scripts/convert_lane_sqlite_to_json.py --sqlite /path/to/lexicon.sqlite --only-quran-roots
```

If your SQLite schema is different, the script will ask you to pass `--table`, `--root-col`, and `--text-col`.
