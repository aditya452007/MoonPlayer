# MoonPlayer -- Agent Guardrails (Allowed / Forbidden)

> **Purpose**: Clear boundaries for what AI agents can and cannot do on this project.
> **Enforcement**: Every agent MUST read this before starting work.

---

## ALLOWED (Do These Freely)

### Code Operations
- Create new files following the folder structure in `context/essentials.md`
- Edit existing source files in `src/`
- Create and run tests
- Install approved dependencies (see `AGENT_SOP.md` Section 8)
- Run `npm run dev`, `npm run build`, `npx vitest`, `npx playwright test`
- Create CSS files with design tokens from `UI_CODING_RULES.md`
- Refactor code for clarity (without changing behavior)
- Fix lint errors and warnings
- Add comments explaining non-obvious logic

### Documentation Operations
- Update `PROGRESS.md` (mark tasks, add notes)
- Create scratch files in `.dev/scratch/` for debugging
- Add inline code comments
- Update test files

### Decision Making
- Choose variable names, function names, file organization within conventions
- Decide code-splitting boundaries (which components to lazy-load)
- Choose between CSS custom properties that are semantically equivalent
- Select specific Phosphor icon variants (within Light weight)
- Determine animation timing within the ranges defined in `UI_CODING_RULES.md`

---

## FORBIDDEN (Never Do These)

### Architecture Violations
- **NEVER** call JioSaavn API directly from components -- use `MusicService` only
- **NEVER** hardcode color values -- use CSS custom properties
- **NEVER** hardcode font families or sizes -- use CSS custom properties
- **NEVER** use `dangerouslySetInnerHTML`
- **NEVER** use inline styles (except dynamic CSS custom property values)
- **NEVER** use `!important` in CSS
- **NEVER** use Tailwind CSS, styled-components, emotion, or any CSS-in-JS
- **NEVER** use default exports -- named exports only
- **NEVER** use `var` keyword -- use `const` or `let`
- **NEVER** import entire icon library (`import * from '@phosphor-icons/react'`)
- **NEVER** skip a development phase (Phase N must complete before Phase N+1)

### File Operations
- **NEVER** modify `DECISIONS_DIGEST.md` without explicit user approval
- **NEVER** modify `new.md` (read-only architectural contract)
- **NEVER** modify `api-1.json` (read-only API schema)
- **NEVER** delete context files without user approval
- **NEVER** create files outside the project directory
- **NEVER** write to `/tmp`, Desktop, or any path outside `c:\Users\Hp\MoonPlayer\`

### Dependency Management
- **NEVER** install unapproved dependencies without documenting the reason
- **NEVER** install: axios, moment.js, lodash, jQuery, Tailwind
- **NEVER** install CSS-in-JS libraries (styled-components, emotion, etc.)
- **NEVER** install multiple state management libraries (only Zustand)

### Design Violations
- **NEVER** use neon colors (cyan, magenta, electric blue, etc.)
- **NEVER** use purple or indigo tinted backgrounds
- **NEVER** add a light mode or theme toggle
- **NEVER** use placeholder images -- generate or use real album art from API
- **NEVER** create generic/bland UI -- every component must feel premium

### Data & Security
- **NEVER** store audio blobs in IndexedDB (stream-only architecture)
- **NEVER** expose JioSaavn API URLs in component code
- **NEVER** use `eval()` or `Function()` constructor
- **NEVER** store sensitive data in localStorage (use Dexie.js/IndexedDB)
- **NEVER** make API calls without going through the rate limiter

---

## REQUIRES APPROVAL (Ask Before Doing)

### These actions need explicit user confirmation:
- Adding a new dependency not in the approved list
- Changing the color palette or design tokens
- Modifying the onboarding flow
- Changing the API provider or base URL
- Altering the folder structure significantly
- Changing the tech stack (React, Vite, Zustand, etc.)
- Modifying `AGENTS.md` content
- Skipping or reordering development phases
- Removing a feature listed in `DECISIONS_DIGEST.md`
- Adding a feature NOT listed in `DECISIONS_DIGEST.md`

---

## ESCALATION RULES

### When to Stop and Ask the User

1. **Contradiction found**: Two source-of-truth documents disagree
2. **API limitation**: The JioSaavn API cannot support a planned feature
3. **Performance concern**: A feature will degrade performance below acceptable levels
4. **Dependency risk**: An approved dependency is deprecated or has security vulnerabilities
5. **Design ambiguity**: The design system does not cover a specific UI element
6. **Phase blocker**: Cannot complete current phase due to external dependency

### How to Escalate

1. Document the issue clearly with context
2. Provide 2-3 options with trade-offs
3. Recommend one option with rationale
4. Wait for user decision before proceeding
