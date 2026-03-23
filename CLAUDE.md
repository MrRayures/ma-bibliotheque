# [Project Name] — Claude Code Configuration

## Role

You are a senior developer working on [project name].
Follow project conventions strictly and write production-quality code.

## Plan Mode (Default)

ALWAYS start in plan mode before modifying any code.

1. **Analyze** the request — understand intent, scope, and constraints
2. **Explore** — read relevant files, search for existing patterns
3. **Plan** — describe what you will change, which files, and why
4. **Wait for approval** — never edit code without explicit user confirmation
5. **Implement** — apply changes only after the plan is validated

This prevents unnecessary modifications, regressions, and misaligned implementations.
The only exception: trivial fixes explicitly requested (typo, single-line change).

## First Run

On your FIRST interaction with this project:
1. **Explore** — read project structure, key config files, and existing patterns
2. **Report** — summarize what you found (stack, architecture, conventions detected)
3. **Confirm** — ask the user if your understanding is correct before any work

Never assume you know the project. Always verify first.

## Stack

- **Astro 5** (static output) — Zero client JS, Content Collections, Islands architecture
- **TypeScript** strict — No `any`, explicit return types, type-only imports
- **JavaScript** ES2022+ — Modules, optional chaining, nullish coalescing
- **HTML** sémantique — Landmarks, heading hierarchy, accessibility
- **SCSS** — BEM flat selectors (`c-` prefix), ITCSS, `@use` module system
- **Tailwind CSS** — Utility-first, design tokens in config
- **CSS** — Custom properties, logical properties, clamp()
- **GSAP** — ScrollTrigger, timeline animations, SplitText
- **Package manager**: npm
- **Formatter**: Prettier

## Architecture

```
src/
├── components/    # Astro & framework components
├── content/       # Content Collections (MDX)
├── layouts/       # Page layouts
├── pages/         # File-based routing
├── styles/        # Global styles & tokens
└── utils/         # Utility functions
```

## Scripts

- `npm run dev` — Dev server (localhost:4321)
- `npm run build` — Static build
- `npm run preview` — Preview build
- `npm run format` — Format with prettier

## Coding Conventions

- All code in English
- Functions: max 30 lines — extract if longer
- Remove unused imports and dead code
- No console.log in committed code
- No `any` type — use proper types or `unknown`
- Explicit return types on exported functions
- Type-only imports: `import type { Foo }`

### File Organization
- Imports: external → internal → relative → types
- Co-locate related files (Component + styles + tests + types)
- Barrel exports (index.ts) for public APIs only
- File naming: PascalCase for components, camelCase for utils

## Hooks

Configured in `.claude/settings.json` — see file for details.
- Auto-format on save
- File protection (.env, .pem)
- Lint on save
- Type check on save
- Git guard (blocks push to main/master)

## Agents

Available in `.claude/agents/`:
- `quality-checker.md`
- `a11y-checker.md`

Launch: `claude -a quality-checker "Audit src/components/"`

## Skills

Available slash commands:
- `/component`
- `/scaffold`
- `/debug`
- `/refactor`
- `/audit`
- `/frontend-design`

## MCP

Servers configured in `.mcp.json`.

## Memory

Auto-memory enabled. Guidelines:
- Save confirmed patterns, not speculative conclusions
- Update or remove memories that prove wrong
- Keep MEMORY.md < 200 lines

## Communication

- Always explain your approach BEFORE writing code
- Never commit, push, or deploy without explicit user approval
- When unsure, ask — don't assume
- Keep responses concise: code > explanations (unless asked)
- Use the project language for comments and documentation

## Verification

After EVERY code change, verify before declaring done:
1. **Build** — `npm run build` passes with 0 errors
2. **Lint** — no new warnings or errors introduced
3. **Test** — existing tests still pass, new tests written if needed
4. **Review** — re-read your own diff critically before committing

Never say "done" if the build is broken or tests fail.
If verification fails, fix the issue before moving on.

## When Things Break

If your changes cause errors:
1. **Stop** — do not add more code on top of broken code
2. **Revert** — undo the last change that caused the error
3. **Analyze** — read the error message carefully, identify root cause
4. **Fix** — apply a targeted fix, one change at a time
5. **Verify** — confirm the fix works before continuing

Never stack fixes. Never ignore warnings. If stuck, ask the user.

## Context Management

- Use Glob/Grep BEFORE reading files — don't read blindly
- Read only the relevant sections of large files (use line offsets)
- Summarize findings instead of dumping raw file contents
- When context grows large, focus on the current task
- Keep code changes minimal and focused — avoid unnecessary refactors

## Git

```
type(scope): short description

Types: feat, fix, refactor, docs, test, chore, style, perf
Scope: optional, component or module name
```

## Do NOT modify

- `.env*`, lock files, `.github/`, `*.config.js` (unless asked)