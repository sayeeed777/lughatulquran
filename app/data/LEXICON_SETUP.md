# Lane Lexicon Setup

To enable root meanings/definitions in Study Mode, add a JSON file at:

- `app/data/lane-lexicon.json`

A starter file is already included. Expand it with more roots as needed.

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
