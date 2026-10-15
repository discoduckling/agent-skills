---
type: llm
---

PASS if every task in the plan has its own numbered, step-by-step test plan, and every step pairs a concrete action (a specific test to write, a command to run, a manual request to send) with its expected result (for example "send the 101st request in 60s → 429 with Retry-After"). Across the plan, the steps must include at least one edge or failure case from the spec (the 101st request, an allowlisted key, or Redis being unreachable), and tasks that add behavior must have the new tests run and expected to fail before the implementation, then rerun and expected to pass.

FAIL if any task's verification is a generic checklist such as "tests pass", "build succeeds" or "manually verify it works" without the specific test or the expected result, or if no task's steps cover an edge or failure case, or if no task runs its new tests to see them fail before implementing.
