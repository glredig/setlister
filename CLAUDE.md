# Setlister — Claude Code Guide

## What is this?
Setlist creation, management, and performance tool for bands.

## Tech Stack
- Frontend: Next.js (Pages Router) + styled-components
- Backend: Rails 7 API-mode + PostgreSQL
- Infra: Heroku (shared Postgres with marketing site)

## Key Docs
- [Architecture](ARCHITECTURE.md) — system design and key decisions
- [Core Beliefs](docs/design-docs/core-beliefs.md) — coding and product principles
- [Design Docs Index](docs/design-docs/index.md) — all design documents
- [Active Plans](docs/exec-plans/active/) — implementation plans in progress

## Project Structure
```
backend/         — Rails API app
frontend/        — Next.js app (not yet created)
docs/
  design-docs/   — designs and specifications
  exec-plans/    — implementation plans (active/ and completed/)
  generated/     — auto-generated docs (schema, etc.)
  product-specs/ — product requirements
  references/    — external reference docs for LLMs
```

## Conventions
- **Commits:** One-line messages. Context goes in PR descriptions.
- **Branching:** Feature branches off main.
- **Testing:** TDD. Write failing test first, then implement.
- **Merge readiness:** All tests pass. Regressions tested before merge to main.
- **Libraries:** Prefer battle-tested, well-documented tools over new/unproven ones.

## Commands
```bash
# Backend
cd backend && bundle exec rspec                    # run all tests
cd backend && bundle exec rspec spec/path -v       # run specific test
cd backend && rails server -p 3001                 # start API server

# Frontend (not yet set up)
cd frontend && npm run dev                         # start dev server
cd frontend && npm test                            # run tests
```

## Do Not
- Skip tests or mark them pending to unblock a feature
- Add gems/packages without checking for existing solutions first
- Autosave or auto-commit — always explicit
- Over-engineer: solve the current problem, not hypothetical future ones
