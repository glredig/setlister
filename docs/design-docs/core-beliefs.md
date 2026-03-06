# Core Beliefs

Principles that guide every decision in this project. When in doubt, refer here.

## Coding Principles

### Test-Driven Development
Write the failing test first. Then write the minimum code to make it pass. Then refactor. No exceptions. Tests are not an afterthought — they drive the design.

### YAGNI (You Aren't Gonna Need It)
Don't build for hypothetical future requirements. Solve the problem in front of you. It's cheaper to add a feature later than to maintain one you don't need yet.

### DRY, But Not At The Cost Of Readability
Duplication is cheaper than the wrong abstraction. Three similar lines of code are better than a premature helper. Extract only when a clear, stable pattern emerges.

### Simplicity Over Cleverness
Prefer boring, obvious code over clever tricks. If a solution requires a comment to explain why it's not a bug, it's too clever. Prefer well-documented, battle-tested libraries and tools over new and poorly documented alternatives — proven solutions with active communities and good docs save time and reduce risk.

### Convention Over Configuration
Lean into the defaults of Rails and Next.js. Fight the framework only when there's a clear, justified reason. Conventions reduce decisions and onboarding friction.

## Product Principles

### The Band's Repertoire Is The Core
Everything flows from the songs a band actually knows and plays. Not a music catalog, not a discovery tool — a working musician's toolkit.

### Edit Fast, Perform Clean
The editing experience should minimize friction: drag, drop, type, done. The performance experience should minimize distraction: show only what you need, nothing more.

### Trust The User
Musicians know their craft. Provide useful defaults and structured fields, but always allow free-text overrides. Don't force workflows that don't match how bands actually work.

## Process Principles

### Regressions Are Blockers
A feature is not merge-ready until existing tests pass alongside new ones. Regressions are caught before they reach main, not after.

### Small Commits, Descriptive PRs
Commit messages are one line. PR descriptions carry the context: what changed, why, how to test it. The commit log tells you what happened; the PR tells you why.
