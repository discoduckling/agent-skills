# Implementation Plan: Diff Explainer Skill (`explaining-diffs`)

Spec: [`SPEC.md`](../SPEC.md). Branch: `feat/diff-explainer`. Tasks: `tasks/todo.md`.

## Overview

Add a new `explaining-diffs` skill that writes a plain-language explainer of a finished diff as two files: `.md` with Mermaid diagrams, and `.html` with inline SVG. Wire it into `/build` (per task, and once before the PR under `/build auto`) and the PR step, and expose it as a standalone `/explain-diff` command. Evals come first, so the baseline proves the expectations discriminate. A sample explainer goes to the user for review before anything is wired in.

## Architecture Decisions

- **Evals before the skill.** The Tier 3 runner (`run-evals.js --behavioral`) injects `skills/<name>/SKILL.md` as the system prompt, so a new skill has no "unmodified" version to baseline against. The baseline is a **frontmatter-plus-Overview skeleton** with the final description and no process. It goes through the same pipeline and carries no instructions. The plugin eval (`claude plugin eval`) adds a true with-versus-without-plugin comparison.
- **The fixture carries the diff as a patch.** The runner commits fixture files as a clean baseline, so the fixture ships a `change.patch` and a `TASK.md` that holds the requirement (which makes the "why" traceable). The eval prompt applies and commits the patch, then asks for the explainer. The fixture's own `node --test` suite lets "How this was checked" be honest: the agent either runs it or says it wasn't run.
- **Eval output stays in the throwaway repo.** Headless `claude -p` loads `~/.claude/CLAUDE.md`, which (after Task 10) points explainers at the vault. Every eval prompt names an in-repo output directory explicitly, so eval runs never write to the vault.
- **Pointers, not copies.** `git-workflow-and-versioning` already has a short "Change Summaries" block. The explainer is its long-form, human-facing counterpart: the new skill references it, and the existing skills get one-line pointers only.
- **Commands live in three directories.** `validate-commands.js` requires every command in `.claude/commands/*.md`, `.gemini/commands/*.toml` and `commands/*.toml`, with identical descriptions. `/explain-diff` and the `/build` edits touch all three.

## Task List

### Phase 1: Evals and baseline

- [x] Task 1: Fixture repo with a multi-file, call-path-changing patch (uses the runner's `.eval/working-tree.patch` convention, applied as uncommitted changes)
- [x] Task 2: Tier 3 eval case, skill skeleton, and baseline run (baseline 3/9)
- [x] Task 3: Plugin eval pair (fires / stays quiet) and baseline run (content 0/3 both arms; quiet 6/6)

### Checkpoint A: Baseline discriminates

- [x] Tier 1 green, and Tier 2 rank-1 ≥ 95
- [x] The Tier 3 baseline fails ≥1 expectation, the plugin `explainer-content` grader fails in the without-plugin arm, and both are recorded in `tasks/explaining-diffs-eval-results.md`
- [ ] Human glances at the expectations and baseline before the skill is written

### Phase 2: Skill and sample

- [x] Task 4: Write the full `explaining-diffs` SKILL.md and re-run the evals (Tier 3 9/9; plugin Δ +0.33)
- [x] Task 5: Generate a sample explainer into the vault for review **(gate)**

### Checkpoint B: Sample approved

- [x] User has reviewed `Diff Explainers/SAMPLE Bulk-order discount/2026-10-14 task-3 Bulk-order discount.{md,html}` and approved the shape (or Task 4 was revised and re-sampled)

### Phase 3: Wiring

- [x] Task 6: `/explain-diff` command (three directories)
- [x] Task 7: `/build` wiring (three directories) and `incremental-implementation` pointer
- [ ] Task 8: Pre-PR pointer in `git-workflow-and-versioning`
- [ ] Task 9: Catalog listings in README.md and CLAUDE.md
- [ ] Task 10: Catalog listings in `docs/`

### Phase 4: Local config and release

- [ ] Task 11: Point the user's `~/.claude/CLAUDE.md` at the vault folder **(ask first)**
- [ ] Task 12: Bump manifests to 0.6.15

### Checkpoint: Complete

- [ ] All Tier 1 validators pass, and Tier 2 rank-1 ≥ 95 with no new collision warning
- [ ] Tier 3 with the skill passes every expectation, and the plugin eval content grader is higher with the plugin than without
- [ ] All results are recorded in `tasks/explaining-diffs-eval-results.md`
- [ ] After merge and local reinstall (CLAUDE.md fork-PR steps): `/build` on a scratch task produces both files in `Diff Explainers/`, their line numbers match `git show`, and the Mermaid renders in Obsidian
- [ ] Dogfood: before opening this branch's PR, follow `skills/explaining-diffs/SKILL.md` from this repo to write a branch explainer for `feat/diff-explainer` into `Diff Explainers/feat-diff-explainer/` (no Linear ticket, so the folder is named after the branch), and link it in the PR description
- [ ] Ready for PR

---

## Task 1: Fixture repo with a multi-file, call-path-changing patch

**Description:** Create `evals/fixtures/explaining-diffs/`, a tiny Node project (`src/pricing.js`, `src/tax.js`, `src/checkout.js`, `test/checkout.test.js`, `package.json` with `"test": "node --test"`). It includes `TASK.md` ("Orders over $100 get 10% off, applied before tax") and `change.patch`. The patch adds `applyDiscount()` in `pricing.js`, changes `checkout.js` to call it before `addTax()`, and adds two test cases ($150 → discounted, $100 exactly → not discounted). It's multi-file, and it alters the call path `checkout → pricing → tax`.

**Acceptance criteria:**
- [ ] The patch applies cleanly to the fixture and touches ≥3 files, including one call-path change
- [ ] The fixture's tests pass before and after the patch, and the new edge case ($100 exactly) is in the patch

**Test plan:**
1. Copy the fixture to the scratchpad, `git init && git add -A && git commit -m base`, then `node --test` → existing tests pass
2. `git apply --check change.patch` → no output, exit 0
3. `git apply change.patch && node --test` → all tests pass, including the 2 new cases
4. `git diff --stat` → 4 files changed (`pricing.js`, `checkout.js`, the test, plus `tax.js` signature or import)
5. `node scripts/validate-artifact-paths.js && git diff --check` → pass, no whitespace errors

**Dependencies:** None

**Files likely touched:** `evals/fixtures/explaining-diffs/{package.json,TASK.md,change.patch,src/*.js,test/*.js}`

**Estimated scope:** Small (one fixture directory)

## Task 2: Tier 3 eval case, skill skeleton, and baseline run

**Description:** Add `evals/cases/explaining-diffs.json` with:
- **Positive triggers (≥3):** "explain this diff so I can walk my PM through it", "explain what changed on this branch before I review it", "write up an explainer for the last commit".
- **Negative triggers (≥2):** "review this PR for bugs" → `code-review-and-quality`; "write a commit message for these changes" → `git-workflow-and-versioning`.
- **One execution eval** using the fixture. The prompt is: apply and commit `change.patch`, then explain that commit for review, saving the files to `explainers/` in this repo.

The expectations are:
- (a) both a `.md` and a `.html` are written;
- (b) every file:line cited matches a hunk in the commit;
- (c) each change has a why tied to `TASK.md`;
- (d) the `.md` has a Mermaid diagram of `checkout → pricing → tax` with the new call distinguished, and the `.html` has an equivalent inline SVG;
- (e) the "How this was checked" section lists only commands visible in the trace with their results, or says nothing was run;
- (f) the `.html` makes no network requests;
- (g) no process narrative;
- (h) technical terms are defined for a non-technical reader.

Create `skills/explaining-diffs/SKILL.md` as a skeleton (final frontmatter description plus Overview only), then run the baseline and record it.

**Acceptance criteria:**
- [ ] The case file meets the CONTRIBUTING counts, and its validators pass
- [ ] The baseline fails ≥1 expectation (or expectations are tightened until one does), recorded expectation by expectation with date, Claude Code version and model

**Test plan:**
1. `node scripts/validate-skills.js` → 0 errors (the skeleton may warn on missing anatomy sections; note the warning text)
2. `node scripts/run-evals.js --min-rank1 95` → the 3 new positives rank `explaining-diffs` first, the 2 negatives rank their owners first, and the overall rate is ≥ 95
3. `node scripts/run-evals.js --behavioral explaining-diffs --dry-run` → the plan shows 1 execution eval with the fixture materialized
4. `node scripts/run-evals.js --behavioral explaining-diffs` → ≥1 expectation FAIL (expected: (b), (d) or (e))
5. Write the baseline table to `tasks/explaining-diffs-eval-results.md` → the file lists all 8 expectations with ✓ or ✗ and a one-line reason

**Dependencies:** Task 1

**Files likely touched:** `evals/cases/explaining-diffs.json`, `skills/explaining-diffs/SKILL.md`, `tasks/explaining-diffs-eval-results.md`

**Estimated scope:** Small–Medium (3 files)

## Task 3: Plugin eval pair (fires / stays quiet) and baseline run

**Description:** Add two plugin eval cases:

- `evals/plugin/explaining-diffs-fires/`: the fixture's patch pasted inline with "Explain this diff so I can walk my non-technical PM through it." Graders:
  - `tool_used: Skill` matching `explaining-diffs|explain-diff`;
  - an `llm` judge (`explainer-content.md`) that passes only with plain language, file:line for each hunk, a why per change, a call-path diagram, and no invented test results.
- `evals/plugin/explaining-diffs-stays-quiet-on-review/`: "Review this diff for bugs before I merge" with a diff. Grader: `explaining-diffs` must *not* fire.

Run the baseline with `--runs 3 --model claude-opus-5-5`.

**Acceptance criteria:**
- [ ] Both cases follow the existing `evals/plugin/*` layout and load without errors
- [ ] Baseline recorded: the without-plugin arm's content grader is < 3/3 (or the judge is tightened until it is)

**Test plan:**
1. `claude plugin eval . --case explaining-diffs-fires --runs 1 --model claude-opus-5-5 --no-publish` (smoke) → the case loads, and graders report a result
2. `claude plugin eval . --case explaining-diffs-fires --runs 3 --model claude-opus-5-5 --no-publish` → the without-plugin content grader is < 3/3
3. `claude plugin eval . --case explaining-diffs-stays-quiet-on-review --runs 3 --model claude-opus-5-5 --no-publish` → `explaining-diffs` fires 0/3
4. Append both tables and the cost to `tasks/explaining-diffs-eval-results.md` → it includes the Claude Code version and the pinned model

**Dependencies:** Task 2 (the skill directory must exist for the plugin to expose it)

**Files likely touched:** `evals/plugin/explaining-diffs-fires/{prompt.md,graders/*.md}`, `evals/plugin/explaining-diffs-stays-quiet-on-review/{prompt.md,graders/*.md}`, `tasks/explaining-diffs-eval-results.md`

**Estimated scope:** Medium (2 case directories)

## Task 4: Write the full `explaining-diffs` SKILL.md and re-run the evals

**Description:** Fill in the skill per spec acceptance criteria 1–8:
- When to Use;
- a Process covering: pin the diff → group by purpose → per-change what, why, file:line and snippet → diagram when needed → "How this was checked" → plain language → write `.md` and `.html` → hand over;
- one good/bad example;
- Mermaid-safety notes (quote labels, and style the changed nodes with `classDef`);
- the HTML skeleton (inline if ≤100 lines, otherwise `references/html-skeleton.md`);
- Common Rationalizations, Red Flags, and Verification (the self-check).

Reference `git-workflow-and-versioning` "Change Summaries" rather than restating it. Use no vendor or tool names. Don't edit the eval files written in Tasks 2–3.

**Acceptance criteria:**
- [ ] Standard anatomy, < 500 lines, 0 validator warnings, and no vendor tool names
- [ ] Tier 3 passes 8/8, and the plugin eval content grader is higher with the plugin than without
- [ ] Tier 2 rank-1 is ≥ 95, with no new ≥50% collision warning against `code-review-and-quality` or `git-workflow-and-versioning`

**Test plan:**
1. `node scripts/validate-skills.js && node scripts/validate-reference-links.js` → 0 errors, 0 warnings
2. `wc -l skills/explaining-diffs/SKILL.md` → < 500; `grep -niE "artifact tool|claude|anthropic" skills/explaining-diffs/SKILL.md` → no matches
3. `node scripts/run-evals.js --min-rank1 95` → pass, with no collision warning naming `explaining-diffs`
4. `node scripts/run-evals.js --behavioral explaining-diffs` → 8/8 PASS
5. `claude plugin eval . --case explaining-diffs-fires --runs 3 --model claude-opus-5-5 --no-publish` → the with-plugin content grader beats without-plugin (Δ > 0); the stays-quiet case still fires 0/3
6. `git diff <task-3-commit> -- evals/cases/explaining-diffs.json evals/plugin/` → empty (eval files untouched since the baseline)
7. Append the "After" section to `tasks/explaining-diffs-eval-results.md` → before/after tables side by side

**Dependencies:** Tasks 2, 3

**Files likely touched:** `skills/explaining-diffs/SKILL.md`, possibly `skills/explaining-diffs/references/html-skeleton.md`, `tasks/explaining-diffs-eval-results.md`

**Estimated scope:** Small–Medium (2–3 files)

## Task 5: Generate a sample explainer into the vault for review (gate)

**Description:** Follow the finished skill against the fixture in a scratchpad copy (apply and commit the patch, run `node --test`). Write the sample `.md` and `.html` to `/Users/mitaleedesai/Documents/New World Work Notes/Diff Explainers/SAMPLE Bulk-order discount/` (ticket-folder layout). Then **stop** and ask the user to review both. Any feedback becomes a revision of Task 4 (re-run Task 4's test plan) and a fresh sample.

**Acceptance criteria:**
- [ ] Both files exist in the vault folder, with matching content and diagrams
- [ ] User has approved the sample, or the requested revisions are applied and re-approved

**Test plan:**
1. `ls "…/Diff Explainers/"` → both files present
2. `grep -nE "(src|href)=\"https?:|@import|<script src" …sample.html` → no matches
3. Compare every cited `file:line` with `git show --stat` and `git show -U0` in the scratch repo → all match
4. Open the `.html` in a browser, then toggle the OS dark mode → readable in both, SVG diagram visible
5. Open the `.md` in Obsidian → the Mermaid diagram renders, the changed nodes are visually distinct, and the link to the `.html` works
6. User review → explicit approval recorded in `tasks/todo.md`

**Dependencies:** Task 4

**Files likely touched:** the two vault files only (outside the repo)

**Estimated scope:** Small

## Task 6: `/explain-diff` command (three directories)

**Description:** Add `.claude/commands/explain-diff.md`, `.gemini/commands/explain-diff.toml` and `commands/explain-diff.toml`, all with an identical description. The body invokes `explaining-diffs` for `$ARGUMENTS` (a commit, range or PR number). With no argument it uses the current branch versus its base, including uncommitted changes. The output location follows the user's or project's instructions, defaulting to `tasks/explainers/`.

**Acceptance criteria:**
- [ ] The command exists in all three directories, with identical descriptions and valid frontmatter
- [ ] The no-argument and explicit-range behavior is stated in the body

**Test plan:**
1. `node scripts/validate-commands.js` → pass, and `explain-diff` is listed in all three
2. `grep -c "explaining-diffs" .claude/commands/explain-diff.md .gemini/commands/explain-diff.toml commands/explain-diff.toml` → ≥1 in each
3. Manual (post-merge, final checkpoint): `/agent-skills:explain-diff HEAD~1..HEAD` in a scratch repo → both files written

**Dependencies:** Task 5 (gate)

**Files likely touched:** the 3 command files

**Estimated scope:** Small

## Task 7: `/build` wiring (three directories) and `incremental-implementation` pointer

**Description:**
- **Default mode:** step 8 becomes "Mark the task complete, generate a diff explainer for this task (`explaining-diffs`), and stop".
- **Autonomous mode:** add a step before the end summary: "Before any PR is created, generate one diff explainer for the whole branch (`<base>...HEAD`), with one section per task". The summary links it.
- Mirror both changes in `.gemini/commands/build.toml` and `commands/build.toml`.
- Add a one-line pointer in `skills/incremental-implementation/SKILL.md` where a finished task is handed to the human.

**Acceptance criteria:**
- [ ] All three `build` files carry both changes, and their descriptions are unchanged
- [ ] The `incremental-implementation` change is a single pointer line, with no duplicated content

**Test plan:**
1. `node scripts/validate-commands.js && node scripts/validate-skills.js` → pass
2. `grep -n "explaining-diffs" .claude/commands/build.md .gemini/commands/build.toml commands/build.toml` → 2 hits per file (default + autonomous)
3. `git diff --stat skills/incremental-implementation/SKILL.md` → 1 insertion
4. `node scripts/run-evals.js --min-rank1 95` → still pass (routing for `incremental-implementation` unchanged)

**Dependencies:** Task 6

**Files likely touched:** `.claude/commands/build.md`, `.gemini/commands/build.toml`, `commands/build.toml`, `skills/incremental-implementation/SKILL.md`

**Estimated scope:** Medium (4 files, small edits)

## Task 8: Pre-PR pointer in `git-workflow-and-versioning`

**Description:** In "Change Summaries", add one or two lines. The structured summary stays the in-chat default. For a branch built without per-task verification, the agent generates a diff explainer (`explaining-diffs`) before opening the PR and links it in the PR description.

**Acceptance criteria:**
- [ ] The pointer is ≤2 lines, and the description and other sections are unchanged

**Test plan:**
1. `git diff --stat skills/git-workflow-and-versioning/SKILL.md` → ≤2 insertions, 0 deletions
2. `node scripts/validate-skills.js && node scripts/validate-reference-links.js` → pass
3. `node scripts/run-evals.js --min-rank1 95` → pass, with `git-workflow-and-versioning` positives still rank 1

**Dependencies:** Task 5 (gate)

**Files likely touched:** `skills/git-workflow-and-versioning/SKILL.md`

**Estimated scope:** XS

## Task 9: Catalog listings in README.md and CLAUDE.md

**Description:**
- Add a row to README's skill table under "Verify – Prove it works", and add `/explain-diff` wherever README lists commands.
- In `CLAUDE.md`, add the skill to "Skills by Phase → Verify" and `/explain-diff` to the `.claude/commands/` line in Project Structure.

**Acceptance criteria:**
- [ ] The skill and command appear in both files, matching the existing row and line formats

**Test plan:**
1. `grep -n "explaining-diffs\|explain-diff" README.md CLAUDE.md` → skill row, command listing, phase list, structure line
2. `node scripts/validate-reference-links.js` → pass (the README link resolves)

**Dependencies:** Tasks 6, 8

**Files likely touched:** `README.md`, `CLAUDE.md`

**Estimated scope:** XS

## Task 10: Catalog listings in `docs/`

**Description:** Add `/explain-diff` (and the skill, where skills are listed) to every doc that enumerates commands: `docs/getting-started.md`, `docs/gemini-cli-setup.md`, `docs/antigravity-setup.md`, `docs/copilot-setup.md`, and `docs/comparison.md` if it lists commands. Use `grep -l "/webperf" docs/` as the discovery check.

**Acceptance criteria:**
- [ ] Every doc that lists `/webperf` also lists `/explain-diff`

**Test plan:**
1. `for f in $(grep -l "/webperf" docs/*.md); do grep -q "/explain-diff" "$f" || echo "MISSING $f"; done` → no output
2. `node scripts/validate-reference-links.js` → pass

**Dependencies:** Task 9

**Files likely touched:** up to 5 files in `docs/`

**Estimated scope:** Small (mechanical)

## Task 11: Point the user's `~/.claude/CLAUDE.md` at the vault folder (ask first)

**Description:** Show the exact block and get approval, then add it under "Work Tracking". It holds the ticket-folder layout from SPEC.md's user-local configuration: the folder `Diff Explainers/<TICKET-ID> <title>/`, the files `<date> task-<N> <title>` and `<date> PR <title>`, and the ticket-ID lookup order. This file is outside the repo and isn't committed.

**Acceptance criteria:**
- [ ] The user approved the exact line before the edit, and the line is present

**Test plan:**
1. `grep -n "Diff Explainers" ~/.claude/CLAUDE.md` → the block is present, with folder, file and ticket-lookup lines
2. Manual (final checkpoint): `/explain-diff` on a branch named `mitalee/app-1234-test` → files land in `Diff Explainers/APP-1234 <title>/` with the dated task or PR names

**Dependencies:** Task 5

**Files likely touched:** `~/.claude/CLAUDE.md` (outside the repo)

**Estimated scope:** XS

## Task 12: Bump manifests to 0.6.15

**Description:** Set the version to `0.6.15` in `plugin.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `.codex-plugin/plugin.json` and `.agents/plugins/marketplace.json`. Commit this alone as `chore(release): bump plugin manifests to 0.6.15`.

**Acceptance criteria:**
- [ ] All five manifests read 0.6.15, in a standalone commit

**Test plan:**
1. `node scripts/validate-versions.js` → `All plugin manifests use version 0.6.15`
2. `git show --stat HEAD` → exactly the 5 manifest files

**Dependencies:** Tasks 1–10

**Files likely touched:** the 5 manifests

**Estimated scope:** Small (mechanical)

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| The baseline already passes the expectations (the model explains diffs well unaided) | High | Expectations target what the skill adds (verified line numbers, traced whys, honest checks, both formats, Mermaid with distinguished nodes). Tighten them until the baseline fails one, before Task 4. |
| Eval runs write into the vault through `~/.claude/CLAUDE.md` | Med | Every eval prompt names an in-repo output dir, and Task 11 lands after the evals. |
| The new description steals routing from `code-review-and-quality` or `git-workflow-and-versioning` | Med | Negative triggers with owners, plus the stays-quiet plugin case and the Tier 2 collision check run in Tasks 2, 4, 7 and 8. |
| Hand-drawn inline SVG is inconsistent or illegible | Med | The skill gives a minimal SVG pattern (boxes plus arrows, a changed-node style), and the Task 5 sample review catches problems before wiring. |
| Mermaid syntax that GitHub accepts but Obsidian rejects (labels with parentheses or colons) | Low | The skill says to quote all labels, and Task 5 step 5 checks rendering in Obsidian. |
| The skill-invocation rate is stochastic in the plugin eval | Low | Read Δ and the report, not the exit code, and pin the model while recording the CLI version. |
| The 0.6.14 test-plans branch merges after this one | Low | This branch ships as 0.6.15 regardless, and test-plans re-bumps when it rebases. |
| `/build auto` runs past the Task 5 sample review or the Task 11 approval | High | Both are **hard human gates**: under `/build auto`, the agent stops at Task 5 and at Task 11 as a "decision the spec doesn't cover", and the user re-invokes `/build auto` to resume. |

## Open Questions

None. Resolved: the spec was renamed to `SPEC.md`, replacing the test-plans spec, and Task 3 (the plugin eval pair) is kept at the user's request.
