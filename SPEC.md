# Spec: Diff Explainer Skill (`explaining-diffs`)

## Objective

When an agent finishes a code change and asks the human to verify it, the human gets a raw diff and a short summary of how the agent worked. That's hard to review and harder to explain to someone else. This skill has the agent produce a **diff explainer** that explains the *final diff* in plain language. It covers what changed, where (file and line numbers), why each change was needed, how the changed pieces relate, and how the agent checked its work. The explainer comes in two forms with the same content: a self-contained **HTML page** (inline SVG diagrams) and a **Markdown note** (Mermaid diagrams) that reads well in Obsidian or GitHub.

**User:** the engineer reviewing the agent's change who needs to understand it well enough to explain it themselves, to a reviewer, a junior engineer or a non-technical stakeholder. They don't want the agent's process narrative, only the end state.

**Trigger points:**

1. **`/build` (one task at a time):** at the end of each task, where the agent stops and asks for verification. Each explainer covers that task's commit(s).
2. **`/build auto` (no per-task confirmation):** once, at the end of the run, *before the PR is created*. It covers the whole branch (`<base>...HEAD`), with one section per task, and the PR description links to it. A run that stops partway through (a blocker or a hard gate) makes no explainer at that stop; the user can run `/explain-diff` for the work so far.
3. **On demand:** a standalone `/explain-diff [range]` command, plus natural-language triggers ("explain this diff", "explain what changed on this branch"). With no range it defaults to the current branch versus its base, including uncommitted changes.

**Target:** the user's fork (`discoduckling/agent-skills`) on branch `feat/diff-explainer`. It isn't an upstream PR, but it follows upstream conventions so it stays upstreamable.

### Pre-flight (CONTRIBUTING.md)

- **Catalog:** no existing skill explains a diff for a human reader. `code-review-and-quality` *judges* a diff, `git-workflow-and-versioning` covers commit messages, and `documentation-and-adrs` records decisions in long-lived docs. This skill references them and doesn't duplicate them.
- **Open upstream PRs:** none overlap. #593 (`HUMAN.md` review checkpoints for TDD) is closest. It tells the human *what to inspect during* a run, while this skill explains the *finished* diff. No conflict.
- **Rejection ledger (`evals/skill-impact.md`):** no prior proposal on diff explanation.

### Acceptance criteria

The new skill `skills/explaining-diffs/SKILL.md` exists. Its process tells the agent to:

1. **Pin the diff.** Name the exact range (the task's commit(s), or `<base>...HEAD`) and the commit SHA, so the line numbers stay meaningful.
2. **Group hunks into "changes" by purpose, not by file.** One change can span files, and one file can hold two changes.
3. **For each change:**
   - a one-to-two-sentence plain-language *what*;
   - a *why*, traced to the task's acceptance criterion, spec section or bug, never "to implement the feature";
   - **file:line locations** for every hunk (new-file line numbers for additions and edits, old-file line numbers for pure deletions);
   - a **red/green diff snippet** of its hunks: removed lines in red with `-`, added lines in green with `+`, a little unchanged context, and new-file line numbers in the gutter. Color is never the only marker. In the `.md` this is a ` ```diff ` block. Long hunks show the key lines and say where the rest is.
4. **Draw a relationship diagram when one is needed.** That means changes that span more than one function or file, or that alter a call path, a dependency, or a data flow. The diagram shows the call or dependency graph with changed nodes visually distinct from unchanged context, and gets a one-line caption saying what to notice. Skip it for single-function changes.
5. **Write a "How this was checked" section.** It lists the specific commands that were run and their observed results (e.g. `npm test -- prefs → 14 passed, 0 failed`), plus manual checks with their concrete input and result. It lists only checks that actually ran in this session, and states plainly what was *not* checked. No process narrative: no dead ends, no "first I tried".
6. **Write in plain language for a junior engineer or a non-technical reader.** Short sentences, define each technical term on first use (inline or in a small glossary), and no unexplained acronyms. The skill gives a short good-versus-bad example, not prose rules.
7. **Write two files with the same content and the same basename** (`<YYYY-MM-DD>-<task-id-or-branch>`):
   - **`.html`:** self-contained, with inline CSS, inline SVG diagrams, no network requests, and readable in light and dark mode.
   - **`.md`:** the full text explanation plus Mermaid diagrams (` ```mermaid ` blocks), with a link to the sibling `.html`. It needs no plugins beyond Obsidian's or GitHub's built-in Mermaid rendering.

   Save both to the location the user's or project's instructions designate. With no designation, save them to `tasks/explainers/`. If the host can publish or render pages, the agent may publish the HTML, but the skill describes that as a capability and never names a vendor tool.
8. **Include the plan, collapsed.** When a plan covers the change, add a section that is collapsed by default (`<details>` in the HTML; a folded callout or `<details>` in the `.md`). It holds the plan steps that produced the changes, each tied to its change, and the task's test plan with every step marked as run (with the observed result) or not run. Without a plan, one line says none was found.
9. **Hand it over.** The verification ask, or the PR description under `/build auto`, includes both paths (or a published link) and a two-to-three-line summary.

The skill also includes a **self-check before handing over** (its Verification section): every cited line range matches a hunk in the pinned diff, every *why* traces to a requirement, every listed check has observed evidence, no hunk in the diff is left unexplained, and the `.md` and `.html` carry the same changes and diagrams.

It has the standard anatomy (Overview, When to Use, Process, Common Rationalizations, Red Flags, Verification) and fits the line budget. The HTML skeleton (≈ structure and CSS) lives in `skills/explaining-diffs/references/` only if it exceeds 100 lines; otherwise it stays inline.

**Wiring:**

- `.claude/commands/build.md`:
  - default step 8 becomes "Mark the task complete, generate a diff explainer for this task (agent-skills:explaining-diffs), and stop";
  - autonomous mode gets a step before its end summary: "generate one diff explainer for the whole branch before any PR is created", and the summary links it.
- `.claude/commands/explain-diff.md` (new): invokes `agent-skills:explaining-diffs` for `$ARGUMENTS` (a commit, range or PR number). With no argument it uses the current branch versus its base, including uncommitted changes.
- `skills/git-workflow-and-versioning/SKILL.md`: a one-line pointer saying that before opening a PR for a branch built without per-task verification, the agent generates an explainer and links it in the PR description. Only a pointer, with no duplicated content.
- `skills/incremental-implementation/SKILL.md`: a one-line pointer to `explaining-diffs` at the point where the agent hands a finished task to the human.
- `README.md` skill list, `CLAUDE.md` "Skills by Phase" (under **Verify**) and the `CLAUDE.md` commands list (`/explain-diff`).
- `evals/cases/explaining-diffs.json`:
  - ≥3 positive triggers, including the standalone "explain this diff" phrasing;
  - ≥2 negative triggers with owners (e.g. "review this PR for bugs" → `code-review-and-quality`, "write a commit message" → `git-workflow-and-versioning`);
  - ≥1 execution eval backed by a real fixture under `evals/fixtures/explaining-diffs/`: a small repo with a multi-file change that alters a call path. Its expectations check for line numbers that match the diff, a why per change, a diagram of the changed call path in *both* files (SVG in the HTML, Mermaid in the `.md`), a checks section with real results, and no process narrative.

**User-local configuration (outside this repo):** the user's `~/.claude/CLAUDE.md` gets a short block designating where explainers go and how they're named. Work arrives as Linear tickets in one repo, so explainers are grouped by ticket:
  - Folder: `/Users/mitaleedesai/Documents/New World Work Notes/Diff Explainers/<TICKET-ID> <ticket title>/`
  - Files: `<YYYY-MM-DD> task-<N> <task title>.{md,html}` per task, and `<YYYY-MM-DD> PR <short title>.{md,html}` for the whole-branch explainer before a PR
  - Ticket ID: from the branch name (Linear's `user/app-1234-slug` format), then commit messages or the plan, else ask. The title comes from Linear if connected, else the branch slug. With no ticket, the folder is the branch name.

  The skill itself stays location-agnostic. It only gains optional frontmatter (`ticket`, `kind`, `task`, `branch`, `commit`, `date`) in the `.md`.

**Sample review gate:** once the skill is drafted, and *before* any wiring into `/build` or git-workflow, the agent runs the skill on the eval fixture. It writes the sample `.md` and `.html` to `Diff Explainers/` and stops so the user can review both. Wiring proceeds only after the user approves the sample's shape.

## Tech Stack

Markdown skill with YAML frontmatter, a JSON eval case, a fixture repo under `evals/fixtures/`, and Node.js validation scripts. The generated output is plain HTML, CSS and SVG with no dependencies.

## Commands

```bash
# Tier 1 — structural (free, CI)
node scripts/validate-skills.js
node scripts/validate-commands.js
node scripts/validate-artifact-paths.js
node scripts/validate-reference-links.js
node scripts/validate-versions.js
node scripts/run-evals.js --min-rank1 95        # trigger/routing evals, all skills

# Tier 2 — behavioral (graded, costs tokens)
node scripts/run-evals.js --behavioral explaining-diffs

# Hygiene
git diff --check
```

## Project Structure

```
skills/explaining-diffs/SKILL.md               → new skill
skills/explaining-diffs/references/            → HTML skeleton, only if >100 lines
evals/cases/explaining-diffs.json              → trigger + behavioral evals
evals/fixtures/explaining-diffs/               → fixture repo with a multi-file, call-path-changing diff
.claude/commands/build.md                      → step 8 + autonomous pre-PR wiring
.claude/commands/explain-diff.md               → new standalone command
skills/incremental-implementation/SKILL.md     → one-line pointer
skills/git-workflow-and-versioning/SKILL.md    → one-line pre-PR pointer
tasks/explaining-diffs-eval-results.md         → baseline vs with-skill eval record
README.md, CLAUDE.md                           → catalog + command listings
plugin manifests (×5)                          → bump to 0.6.15 (separate commit)
```

## Code Style

Follow the existing skill conventions. The frontmatter description is third person, and it states what the skill does before saying when to use it:

```yaml
---
name: explaining-diffs
description: Explains a finished code change in plain language as a self-contained HTML page — what changed, where (file and line), why, how the pieces relate, and how it was checked. Use when handing a completed task or branch to a human for verification, or when asked to explain a diff for someone else.
---
```

Good versus bad, as the skill should show it:

```
BAD:  Refactored the auth middleware and updated tests.
GOOD: src/auth/session.ts:42-58 — Sessions now expire after 30 minutes of
      inactivity. Before, a forgotten logged-in laptop stayed logged in
      forever (task 3, "idle sessions must expire").
```

## Testing Strategy

- **Structural:** all Tier 1 validators pass, and the trigger evals hit rank-1 ≥ 95% across the whole catalog. The new skill must not steal routing from `code-review-and-quality` or `git-workflow-and-versioning`.
- **Behavioral evals are required, not optional.** Write the eval case and fixture *before* the skill, then:
  1. run `--behavioral explaining-diffs` against a baseline (no skill), which should fail at least one expectation, proving the expectations discriminate;
  2. run it again with the skill, which should pass every expectation;
  3. record both runs (expectation-by-expectation pass/fail, date, commit) in `tasks/explaining-diffs-eval-results.md`, matching how the test-plans work was evaluated.

  If an expectation passes in the baseline, tighten it before trusting the with-skill result.
- **Manual:** run `/build` on a small real task in a scratch repo. Confirm the explainer is generated at the designated location, opens offline in a browser, renders in light and dark mode, and that its line numbers match `git show`.

## Boundaries

- **Always:** keep the skill agent-agnostic (no vendor tool names), pin line numbers to a commit SHA, report only checks that actually ran, and reference other skills rather than restating them.
- **Ask first:** editing `~/.claude/CLAUDE.md`, changing any existing skill beyond the two one-line pointers, and wiring explainers into flows beyond `/build`, the pre-PR step and `/explain-diff` (e.g. `/ship`).
- **Never:** have the explainer narrate the agent's process, invent a "why" that doesn't trace to a requirement, load external scripts or fonts in the HTML, or write the explainer into a location that lands it in the diff it explains, unless the user chose that location.

## Success Criteria

- [ ] `skills/explaining-diffs/SKILL.md` meets every acceptance criterion above, with standard anatomy and within the line budget.
- [ ] `/build` default mode ends with explainer paths in the verification ask.
- [ ] `/build auto` produces one explainer for the whole branch before any PR is created, and the PR description links it.
- [ ] `/explain-diff` works standalone on the current branch and on an explicit range.
- [ ] The user has reviewed and approved a sample `.md` and `.html` explainer generated from the fixture.
- [ ] The behavioral eval fails at least one expectation without the skill and passes all of them with it, and both runs are recorded in `tasks/explaining-diffs-eval-results.md`.
- [ ] All Tier 1 validators and the routing eval pass.
- [ ] A manual run produces both files in `New World Work Notes/Diff Explainers/`. Their line numbers match `git show`, and the Mermaid diagrams render in Obsidian.
- [ ] Manifests are bumped to **0.6.15** in all five files, committed separately as `chore(release): bump plugin manifests to 0.6.15`.

## Open Questions

None blocking.

- **Version:** 0.6.15 assumes `feat/plan-test-plans` (0.6.14) merges first. If this branch merges first, it still ships as 0.6.15, and test-plans needs a re-bump when it rebases.
