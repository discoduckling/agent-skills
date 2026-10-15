# Todo: Diff Explainer Skill (`explaining-diffs`)

Plan and per-task test plans: [`tasks/plan.md`](plan.md). Spec: [`SPEC.md`](../SPEC.md).

## Phase 1: Evals and baseline
- [x] Task 1: Fixture repo with a multi-file, call-path-changing patch (uses the runner's `.eval/working-tree.patch` convention, applied as uncommitted changes)
- [x] Task 2: Tier 3 eval case, skill skeleton, and baseline run (baseline 3/9)
- [x] Task 3: Plugin eval pair (fires / stays quiet) and baseline run (content 0/3 both arms; quiet 6/6)

## Checkpoint A: Baseline discriminates
- [x] Tier 1 green, Tier 2 rank-1 ≥ 95
- [x] Tier 3 baseline fails ≥1 expectation; plugin content grader < 3/3 without the plugin; recorded in `tasks/explaining-diffs-eval-results.md`
- [ ] Human glanced at the expectations and baseline

## Phase 2: Skill and sample
- [x] Task 4: Write the full `explaining-diffs` SKILL.md and re-run the evals (Tier 3 9/9; plugin Δ +0.33)
- [x] Task 5: Generate a sample explainer into the vault for review (HARD GATE: stop even under `/build auto`) — sample written 2026-10-14; revised with red/green diff snippets per user feedback; approved by user 2026-10-14

## Checkpoint B: Sample approved
- [x] User approved `Diff Explainers/SAMPLE Bulk-order discount/2026-10-14 task-3 Bulk-order discount.{md,html}`

## Phase 3: Wiring
- [x] Task 6: `/explain-diff` command (three directories)
- [x] Task 7: `/build` wiring (three directories) and `incremental-implementation` pointer
- [x] Task 8: Pre-PR pointer in `git-workflow-and-versioning`
- [x] Task 9: Catalog listings in README.md and CLAUDE.md
- [x] Task 10: Catalog listings in `docs/`

## Phase 4: Local config and release
- [ ] Task 11: Point `~/.claude/CLAUDE.md` at the vault folder (HARD GATE: ask first, even under `/build auto`)
- [x] Task 12: Bump manifests to 0.6.15

## Checkpoint: Complete
- [ ] All Tier 1 validators pass; Tier 2 rank-1 ≥ 95 with no new collision warning
- [ ] Tier 3 8/8 with the skill; plugin content grader Δ > 0; results recorded
- [ ] Post-merge reinstall: `/build` on a scratch task produces both files in `Diff Explainers/`, line numbers match `git show`, Mermaid renders in Obsidian
- [ ] Dogfood: before opening this branch's PR, follow `skills/explaining-diffs/SKILL.md` from this repo to write a branch explainer for `feat/diff-explainer` into `Diff Explainers/feat-diff-explainer/` (no Linear ticket, so the folder is named after the branch), and link it in the PR description
- [ ] Ready for PR
