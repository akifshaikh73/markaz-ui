// PreToolUse hook (Bash / PowerShell): a `feat` commit must include the functional manual.
// The manual is split by role (docs/functional-manual-user.md, docs/functional-manual-admin.md,
// indexed by docs/functional-manual.md). Blocks `git commit` when the message starts with
// feat / feat(scope) / feat! and none of them is staged, telling Claude to update the manual
// for the affected role(s) first. Everything else passes through.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const MANUAL = 'docs/functional-manual.md';
const MANUALS = [MANUAL, 'docs/functional-manual-user.md', 'docs/functional-manual-admin.md'];
const FEAT_RE = /^feat(\([^)]*\))?!?:/;

let input = '';
for await (const chunk of process.stdin) input += chunk;

let payload;
try { payload = JSON.parse(input); } catch { process.exit(0); }
const command = String(payload?.tool_input?.command ?? '');
if (!/\bgit\b[^\n;|&]*\bcommit\b/.test(command)) process.exit(0);

// Repo the commit runs in: `git -C <dir> commit` or the session's working directory.
const dashC = command.match(/\bgit\s+-C\s+("([^"]+)"|'([^']+)'|(\S+))[^\n;|&]*\bcommit\b/);
const repoDir = dashC ? (dashC[2] ?? dashC[3] ?? dashC[4]) : (payload.cwd || process.cwd());

let top;
try {
    top = execFileSync('git', ['-C', repoDir, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
} catch { process.exit(0); }
if (!existsSync(path.join(top, MANUAL))) process.exit(0); // not the markaz-ui repo

// Commit subject from -m "..." / -m '...' or from -F <file>.
let subject = null;
const m = command.match(/(?:^|\s)-m\s*(?:"([^"]*)"|'([^']*)'|(\S+))/);
if (m) subject = m[1] ?? m[2] ?? m[3];
const f = command.match(/(?:^|\s)(?:-F|--file)[\s=]+(?:"([^"]+)"|'([^']+)'|(\S+))/);
if (subject === null && f) {
    const file = f[1] ?? f[2] ?? f[3];
    try {
        const resolved = path.isAbsolute(file) ? file : path.resolve(repoDir, file);
        subject = readFileSync(resolved, 'utf8').split(/\r?\n/)[0];
    } catch { process.exit(0); }
}
if (subject === null || !FEAT_RE.test(subject.trim())) process.exit(0);

// Staged already, or staged in the same command (`git add docs/functional-manual-user.md && git commit ...`).
let staged = '';
try {
    staged = execFileSync('git', ['-C', top, 'diff', '--cached', '--name-only'], { encoding: 'utf8' });
} catch { process.exit(0); }
const stagedFiles = staged.split(/\r?\n/);
if (MANUALS.some(f => stagedFiles.includes(f)) || /functional-manual(-user|-admin)?\.md/.test(command)) process.exit(0);

process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason:
            `This is a feat commit ("${subject.trim()}") but no functional manual is staged. ` +
            `Update docs/functional-manual-user.md (screens every role uses) and/or ` +
            `docs/functional-manual-admin.md (Masjid Admin / Markaz Admin only) to describe the new or ` +
            `changed behavior (screens, steps, troubleshooting), add a docs/changelog.md entry, stage ` +
            `them, then commit again. ` +
            `If the feature has no user-visible effect, say so to the user and ask before committing without it.`,
    },
}));
