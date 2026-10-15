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

### Plugin eval: `claude plugin eval . --case 'explaining-diffs-*' --runs 3 --model claude-opus-5-5 --no-publish`

| Case | Arm | skill-fired (indicator) | Scored grader | Score |
|---|---|---|---|---|
| `explaining-diffs-fires` | with plugin | 3/3 | `explainer-content` 0/3 (all judges FAIL) | 0.00 |
| `explaining-diffs-fires` | without plugin | — | `explainer-content` 0/3 | 0.00 |
| `explaining-diffs-stays-quiet-on-review` | with plugin | — | `not-fired` 3/3 | 1.00 |
| `explaining-diffs-stays-quiet-on-review` | without plugin | — | `not-fired` 3/3 | 1.00 |

Δ 0.00 on both · cost $1.44 (plus $0.25 for the smoke run). Even the skeleton's description makes the skill fire every time, so routing works. Without the process, the content still fails. The stays-quiet case confirms a review request with a diff doesn't pull in `explaining-diffs`.

## After (full skill)

Same commands as the baseline. **One eval file changed after the baseline:** criterion 3 of `evals/plugin/explaining-diffs-fires/graders/explainer-content.md`. It described a chain `checkout -> applyDiscount -> addTax`, but `applyDiscount` never calls `addTax`, so correctly drawn call graphs were failing. It now reads "`checkout` now calls the new `applyDiscount` and then passes the discounted amount to `addTax`". Every plugin run re-runs the without-plugin arm, which stayed at 0/3 under the corrected wording. No Tier 3 expectation changed.

### Tier 3

Overall: **9/9 (100%)**, up from 3/9. It was 9/9 on the first full draft and again on the final skill. Executor `claude-opus-5-5[1m]`.

### Plugin eval (final skill)

| Case | Arm | skill-fired | Scored grader | Score |
|---|---|---|---|---|
| `explaining-diffs-fires` | with plugin | 3/3 | `explainer-content` 1/3 | 0.33 |
| `explaining-diffs-fires` | without plugin | — | `explainer-content` 0/3 | 0.00 |
| `explaining-diffs-stays-quiet-on-review` | both arms | — | `not-fired` 6/6 | 1.00 |

Δ **+0.33** on `fires` · cost $1.57.

### Skill changes driven by the plugin eval

Intermediate runs were with 0/3 · without 0/3 at each step, and the judge's reasons came from re-grading one reply by hand with `claude -p`:

1. **No-file fallback.** Sessions that can't write files left out the diagram. The skill now says to put the full Markdown note in the reply.
2. **`classDef` required.** One reply styled its diagram with label text only.
3. **Arrows mean "calls".** Replies drew a step pipeline (`subtotal → applyDiscount → addTax`), which read as a call graph and was wrong. The skill's own example had the same flaw, and it's fixed too.
4. **Label changed calls.** The `checkout → addTax` arrow looked unchanged, though its input changed. That's the point of the fix, so new calls and changed-input calls are now labelled.

The two with-plugin runs that still fail passed when re-graded by hand without the diff, so the eval's judge (which does see the diff) may be catching line-number detail. They're left as failures, and the skill wasn't tuned further to the grader.
