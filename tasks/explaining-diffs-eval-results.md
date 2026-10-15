# Eval Results: `explaining-diffs`

Environment: Claude Code 2.1.300, 2026-10-14 (local). The Tier 3 runner reported `executor_model: claude-opus-5-5[1m]` (it has no model pin). The plugin evals pin `--model claude-opus-5-5`.

## Baseline (skeleton skill: final description, placeholder sections, no process)

Commit under test: the skeleton in Task 2's commit.

### Tier 3: `node scripts/run-evals.js --behavioral explaining-diffs`

Overall: **3/9 (33%)**

| # | Expectation | Result | Why |
|---|---|---|---|
| 1 | `.md` and `.html` written under `explainers/`, same changes | ✓ | Both written, with the same sections and file/line table |
| 2 | Pins the diff (base SHA, uncommitted on top) | ✗ | Says only "uncommitted change … on main"; never looked up a SHA |
| 3 | Every file:line matches a hunk; no hunk unexplained | ✗ | Lines correct, but the import change (`checkout.js:3`) and export change (`pricing.js:17`) are unexplained |
| 4 | Each why traced to a TASK.md requirement | ✗ | Most traced; the reason for the constants at `pricing.js:3–4` was made up rather than taken from TASK.md |
| 5 | Mermaid with changed nodes distinguished + equivalent inline SVG | ✗ | Labels say "(new)" but there's no `classDef`; the HTML uses CSS boxes, not SVG |
| 6 | Checks section lists only checks that ran, plus what wasn't checked | ✗ | Claims "changing > to >= would make this test fail", a mutation that never ran; no not-checked list |
| 7 | HTML self-contained | ✓ | Inline `<style>`, system fonts, no external refs |
| 8 | No process narrative | ✓ | End state only |
| 9 | Technical terms explained plainly | ✗ | "function", "test", "test suite" and "field" used without explanation |
