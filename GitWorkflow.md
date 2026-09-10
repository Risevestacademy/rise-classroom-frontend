# Git Workflow Conventions

**Platform:** GitHub

This document defines how our team branches, opens PRs, reviews code, and merges changes. Everyone on the team is expected to follow these conventions; propose changes via PR to this file.

---

## 1. Branching strategy

Two permanent branches, plus short-lived working branches for everything else.

| Branch             | Type        | Purpose                                                                                                                                                   |
| ------------------ | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `main`           | Permanent   | Production. Only merges from`dev` via a reviewed PR, or a `hotfix/*` branch in an emergency. Always deployable.                                       |
| `dev`            | Permanent   | Integration/staging. All feature and contributor branches merge here first. This is what QA and staging point to.                                         |
| `john`           | Contributor | John's personal working branch. Used for review work, spikes, or anything not yet tied to a single feature ticket. Reviewer for PRs into`dev`/`main`. |
| `jane`           | Contributor | Jane's personal working branch, same role as above — general or exploratory work not scoped to one feature.                                              |
| `feature/<slug>` | Temporary   | Any specific feature, fix, or general adjustment. Branches off`dev`, PRs back into `dev`, then deleted after merge.                                   |

### 1.1 Naming rules for `feature/*` branches

All lowercase, words separated by hyphens, no spaces or underscores, short enough to read in a PR list.

```
feature/search-filters    → advanced search/filter UI
feature/task-reminders    → due-date reminder notifications
feature/team-invites      → invite teammates to a workspace
feature/export-csv        → export report data to CSV
```

### 1.2 Additional prefixes

A few additions worth adopting now (not urgent, but you'll want them once the codebase grows):

| Prefix                | When to use                                                                                                                                           |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fix/<slug>`        | Bug fix that isn't urgent enough to skip the normal dev → main flow.                                                                                 |
| `hotfix/<slug>`     | Urgent production bug. Branches off`main`, PRs directly back into `main`, then back-merged into `dev` immediately after.                        |
| `release/<version>` | Optional — only needed once you're cutting versioned releases (e.g. mobile app store builds). Branches off`dev`, used to stabilize before tagging. |
| `chore/<slug>`      | Non-feature work: dependency bumps, CI config, tooling.                                                                                               |
| `docs/<slug>`       | Documentation-only changes.                                                                                                                           |

**Examples:**

```
fix/date-picker-timezone-bug
hotfix/login-500-error
release/2.1.0
chore/upgrade-react-18
docs/api-onboarding-guide
```

### 1.3 Flow

```
feature/search-filters ──┐
john ─────────────────────┼──► dev ──► main (production)
jane ──────────────────┘         ▲
hotfix/login-500-error ──────────┘ (urgent, then back-merge into dev)
```

**Example walkthrough — a normal feature:**

```bash
git checkout dev
git pull origin dev
git checkout -b feature/search-filters
# ... work, commit ...
git push -u origin feature/search-filters
# open PR: feature/search-filters → dev, John reviews, CI passes, squash-merge
# branch auto-deletes
```

**Example walkthrough — a hotfix:**

```bash
git checkout main
git pull origin main
git checkout -b hotfix/login-500-error
# ... fix, commit, push ...
# open PR: hotfix/login-500-error → main, expedited review, merge
git checkout dev
git pull origin dev
git merge main   # back-merge so dev doesn't drift from what's in prod
git push origin dev
```

### 1.4 Branch protection (recommended)

- `main`: no direct pushes; requires an approved PR (John as reviewer) and passing CI.
- `dev`: no direct pushes; requires PR + at least one review; CI required.
- Personal (`john`, `jane`) and `feature/*` branches: unprotected, push freely, delete after merge.

---

## 2. Repository naming convention

All lowercase, words separated by a dash, prefixed with `rise-classroom-`.

```
rise-classroom-api
rise-classroom-web
rise-classroom-mobile-app
rise-classroom-admin-tools
```

---

## 3. Commit messages

Recommend adopting [Conventional Commits](http://conventionalcommits.org/) so history stays scannable and you can auto-generate changelogs later:

```
feat: add saved search filters to task list
fix: correct timezone offset in due-date display
chore: bump react to 18.3
docs: update API onboarding guide
```

**Common types:**

| Type         | Use for                                                 |
| ------------ | ------------------------------------------------------- |
| `feat`     | A new feature                                           |
| `fix`      | A bug fix                                               |
| `chore`    | Tooling, deps, config — no source behavior change      |
| `docs`     | Documentation only                                      |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test`     | Adding or correcting tests                              |

**More examples:**

```
feat: add CSV export for weekly reports
fix: prevent duplicate reminder notifications on retry
fix: handle null workspace_id in team invite flow
refactor: extract reminder scheduling into shared service
test: add coverage for invite-link expiry edge cases
chore: rotate staging API keys
```

For a multi-line commit, keep the summary line under ~72 chars and add detail in the body:

```
feat: add rate limit to team invite endpoint

Caps invites at 20 per workspace per hour to prevent abuse.
Adds a scheduled job to reset the counter at midnight UTC.
```

---

## 4. Pull requests

- PR title mirrors the branch: `feature/search-filters` → `Feature: Search filters`.
- PR into `dev` or `main` requires review — John as the standing reviewer per the roles above.
- Delete the branch after merge (`feature/`, `fix/`, `chore/`, `docs/` branches are disposable; `john` and `jane` persist as ongoing personal branches).

**Title examples:**

```
feature/team-invites        → Feature: Team invites
fix/date-picker-timezone-bug → Fix: Date picker timezone bug
hotfix/login-500-error      → Hotfix: Login 500 error
chore/upgrade-react-18      → Chore: Upgrade React to 18.3
docs/api-onboarding-guide   → Docs: API onboarding guide
```

**Example PR description:**

```markdown
## What
Adds a rate limit on team invites (20/workspace/hour) and a
midnight UTC reset job.

## Why
Prevents invite-spam abuse flagged in a support ticket (#118).

## How to test
1. Send 20 invites in an hour via `/workspace/invite`
2. Confirm the 21st invite is rejected with `INVITE_LIMIT_REACHED`
3. Advance clock past midnight UTC, confirm counter resets

Closes #118
```

### 4.1 CI requirements

All PRs must pass automated tests, lint/static analysis, and the build check before merge is allowed.

### 4.2 Approvals

- **PRs into `dev`:** at least 1 approval.
- **PRs into `main`:** 1 approval required even for hotfixes (expedited, not skipped).

---

## 5. Code review

### 5.1 What reviewers check

- **Correctness** — does it do what it claims, including edge cases?
- **Readability** — would a teammate understand this in six months?
- **Tests** — is new/changed behavior covered?
- **Scope** — does the PR do one thing, or is it mixing concerns?
- **Consistency** — does it follow existing patterns/conventions in the codebase?
- **Security/performance** — anything obviously risky?

### 5.2 Review etiquette

- Be specific and kind: explain *why*, suggest an alternative, don't just say "this is wrong."
- Distinguish blocking issues from nice-to-haves:
  - `blocking:` must be fixed before merge
  - `nit:` minor, non-blocking style preference
  - `question:` genuinely asking, not requesting a change

**Example comment:**

```
blocking: this query isn't scoped to workspace_id — will leak
cross-tenant data. Add a where clause here.

nit: prefer `const` over `let` since this never reassigns.
```

### 5.3 Author response

Address every comment — either with a code change or a reply explaining why not. Re-request review after addressing feedback.

---

## 6. Merging

**Squash and merge** is the default, both `feature/* → dev` and `dev → main`. Keeps history clean, one commit per PR.

Use the squashed commit message as a mini changelog entry, following the Conventional Commits format from §3:

```
feat: add rate limit to team invite endpoint (#142)

- Cap invites at 20/workspace/hour
- Add midnight UTC reset job
- Add tests for rate-limit edge cases
```

`hotfix/* → main` also squash-merges, then back-merge `main → dev` as a regular merge commit (not squash) so the fix's history is preserved in `dev` too — see the hotfix example in §1.3.

---

## 7. Environments & config naming

To keep this consistent with the `main` = production / `dev` = development split:

```
.env.development   → used with the dev branch / staging deploy
.env.production    → used with the main branch / production deploy
```

**Example:**

```bash
# .env.development
API_BASE_URL=https://staging-api.rise-classroom.com
LOG_LEVEL=debug
FEATURE_FLAGS_ENABLED=true

# .env.production
API_BASE_URL=https://api.rise-classroom.com
LOG_LEVEL=warn
FEATURE_FLAGS_ENABLED=false
```

CI should select the file based on target branch: `dev` deploys load `.env.development`, `main` deploys load `.env.production`.

---

## 8. Quick reference

| Step               | Action                                                                            |
| ------------------ | --------------------------------------------------------------------------------- |
| Start work         | Branch from latest`dev` (or `main` for a hotfix), name it `type/slug`       |
| While working      | Commit using Conventional Commits, keep commits focused                           |
| Ready for feedback | Open PR, title mirrors branch, fill out What/Why/How to test                      |
| Review             | John (or Jane as backup) reviews; use`blocking:`/`nit:`/`question:`         |
| Merge              | Squash and merge into`dev` (or `main` for hotfix); delete disposable branches |
| Hotfix only        | After merging to`main`, merge `main` back into `dev`                        |

---
