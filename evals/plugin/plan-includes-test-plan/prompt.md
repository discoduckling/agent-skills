---
description: A planning request with a short spec inline and no mention of tests. The skill should fire (through the plan command or directly) and every task in the plan should carry a numbered test plan whose steps pair an action with its expected result.
expected_outcome: An ordered task breakdown where each task has acceptance criteria and numbered steps (action → expected result) covering specific tests including an edge case, a fail-first run, a passing rerun, and the build or full suite; planning-and-task-breakdown is invoked.
max_turns: 12
allowed_tools: [Read, Glob, Grep, Skill]
---

Break this spec into tasks I can hand to an engineer one at a time. Don't write any code yet.

Spec: per-user rate limiting for our public REST API (Express + Redis, tests run with `npm test`, build with `npm run build`).

- Each API key gets 100 requests per rolling 60-second window.
- Over the limit, respond 429 with a `Retry-After` header in seconds.
- Every response carries `X-RateLimit-Remaining`.
- Keys on an allowlist in config are never limited.
- If Redis is unreachable, fail open: serve the request and log a warning.
