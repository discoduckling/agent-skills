# Todo: Diff Explainer Skill (`explaining-diffs`)

Plan and per-task test plans: [`tasks/plan.md`](plan.md). Spec: [`SPEC.md`](../SPEC.md).

## Phase 1: Evals and baseline
- [x] Task 1: Fixture repo with a multi-file, call-path-changing patch (uses the runner's `.eval/working-tree.patch` convention, applied as uncommitted changes)
- [x] Task 2: Tier 3 eval case, skill skeleton, and baseline run (baseline 3/9)
- [ ] Task 3: Plugin eval pair (fires / stays quiet) and baseline run

## Checkpoint A: Baseline discriminates
- [ ] Tier 1 green, Tier 2 rank-1 ≥ 95
- [ ] Tier 3 baseline fails ≥1 expectation; plugin content grader < 3/3 without the plugin; recorded in `tasks/explaining-diffs-eval-results.md`
- [ ] Human glanced at the expectations and baseline

## Phase 2: Skill and sample
- [ ] Task 4: Write the full `explaining-diffs` SKILL.md and re-run the evals
- [ ] Task 5: Generate a sample explainer into the vault for review (HARD GATE: stop even under `/build auto`)

## Checkpoint B: Sample approved
- [ ] User approved `Diff Explainers/2026-10-14-explaining-diffs-sample.{md,html}`

## Phase 3: Wiring
- [ ] Task 6: `/explain-diff` command (three directories)
- [ ] Task 7: `/build` wiring (three directories) and `incremental-implementation` pointer
- [ ] Task 8: Pre-PR pointer in `git-workflow-and-versioning`
- [ ] Task 9: Catalog listings in README.md and CLAUDE.md
- [ ] Task 10: Catalog listings in `docs/`

## Phase 4: Local config and release
- [ ] Task 11: Point `~/.claude/CLAUDE.md` at the vault folder (HARD GATE: ask first, even under `/build auto`)
- [ ] Task 12: Bump manifests to 0.6.15

## Checkpoint: Complete
- [ ] All Tier 1 validators pass; Tier 2 rank-1 ≥ 95 with no new collision warning
- [ ] Tier 3 8/8 with the skill; plugin content grader Δ > 0; results recorded
- [ ] Post-merge reinstall: `/build` on a scratch task produces both files in `Diff Explainers/`, line numbers match `git show`, Mermaid renders in Obsidian
- [ ] Ready for PR
