---
description: "Stage, update changelog, commit with conventional messages, and push"
name: "git-push"
argument-hint: "Optional note to include in changelog entry"
---

Follow the commit workflow defined in [AGENTS.md](../../AGENTS.md#commit-workflow) and update [docs/changelog.md](../../docs/changelog.md) as part of the commit. Steps:

1. Run `git status --short` to list all modified/untracked files.
2. Run `git diff` across all changed files to review the actual changes.
3. **Update `docs/changelog.md`**:
   - Add a new dated section at the top (under `## <YYYY-MM-DD>`) if today's date isn't already there.
   - Write one bullet per logical change group using the format `**type(scope):** description`.
   - If the user provided an argument, incorporate it as an additional note.
4. Group the changed files into one or more logical commits. For each group:
   - Propose a commit message: `<type>(<scope>): <short description>`
   - Types: `feat`, `fix`, `refactor`, `docs`, `style`, `chore`
5. Present the full plan (files per commit + messages + changelog preview) and ask the user to confirm.
6. After confirmation:
   - `git add` each group's files (always include `docs/changelog.md` in the last or most relevant commit).
   - `git commit -m "<message>"` for each group.
   - `git push`
   - Show `git log --oneline -5`.
