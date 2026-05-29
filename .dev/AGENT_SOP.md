# MoonPlayer -- Agent Standard Operating Procedure (SOP)

> **Version**: 1.0
> **Applies to**: All AI agents working on this project
> **Last Updated**: 2026-05-28

---

## 1. Source of Truth Hierarchy

When making ANY decision, consult these documents in this exact order:

| Priority | Document | Location | Purpose |
|:---|:---|:---|:---|
| P0 | Decisions Digest | `.dev/DECISIONS_DIGEST.md` | Final resolved architectural decisions |
| P1 | Context Files | `context/*.md` | Detailed specifications per domain |
| P2 | Spec File | `specs/001-moon-player/spec.md` | User stories, FRs, entities |
| P3 | AGENTS.md | `AGENTS.md` | Project conventions, tech stack, commands |
| P4 | UI Coding Rules | `.dev/UI_CODING_RULES.md` | CSS architecture, component patterns |
| P5 | API Schema | `api-1.json` | Live API response structure |
| P6 | Q&A Archive | `new.md` | Raw Q&A with project owner (read-only reference) |

> [!CAUTION]
> If ANY context file contradicts `DECISIONS_DIGEST.md`, the digest wins. Report the contradiction and update the context file.

---

## 2. Development Workflow

### Before Writing ANY Code

1. **Read the relevant context file(s)** for the feature you are building
2. **Read `DECISIONS_DIGEST.md`** to verify your understanding
3. **Check `PROGRESS.md`** to confirm this task is the next in sequence
4. **Read `UI_CODING_RULES.md`** before touching any CSS or components

### While Writing Code

1. **Update `PROGRESS.md`** -- mark your current task as `[/]` (in progress)
2. **Follow the phase order** in `DEVELOPMENT_PHASES.md` -- never skip ahead
3. **Create component CSS file** alongside the component (co-located)
4. **Use CSS custom properties** for ALL visual values -- zero hardcoded colors, fonts, sizes
5. **Run `npm run dev`** after significant changes to verify

### After Completing a Task

1. **Mark task as `[x]`** in `PROGRESS.md`
2. **Run relevant tests** (`npx vitest` for unit, `npx playwright test` for E2E)
3. **Verify no regressions** in the dev server
4. **Update `PROGRESS.md`** with the next task

---

## 3. Code Quality Gates

### Every Pull / Commit MUST Pass

- [ ] Zero hardcoded color values (grep for `#` in component files)
- [ ] Zero hardcoded font values (grep for `font-family:` without `var()`)
- [ ] All interactive elements have unique IDs
- [ ] All images have alt text
- [ ] No `dangerouslySetInnerHTML` anywhere
- [ ] No `console.log` in committed code (use proper logging)
- [ ] Component CSS co-located with component file
- [ ] Zustand store actions are properly typed
- [ ] Service layer calls go through `MusicService`, never direct API calls
- [ ] Error boundaries wrap all route-level components

---

## 4. Communication Rules

### What to Report to the User

- Completion of each phase in `DEVELOPMENT_PHASES.md`
- Any blocker that requires a decision not covered by `DECISIONS_DIGEST.md`
- Test results (pass/fail counts)
- Breaking changes to existing functionality

### What NOT to Report

- Routine file creation/editing (just do it)
- Minor CSS adjustments within the design system
- Dependency version choices (unless they conflict with the tech stack)

### How to Ask Questions

- Only ask if the answer is NOT in `DECISIONS_DIGEST.md` or context files
- Provide options with impact analysis (never open-ended questions)
- Batch related questions together (never ask one at a time)

---

## 5. File Operations Rules

### Creating New Files

| File Type | Location | Naming Convention |
|:---|:---|:---|
| React component | `src/components/[ComponentName]/` | `ComponentName.jsx` |
| Component CSS | `src/components/[ComponentName]/` | `ComponentName.css` |
| Zustand store | `src/stores/` | `camelCaseStore.js` |
| Service | `src/services/` | `camelCaseService.js` |
| Adapter | `src/adapters/` | `camelCaseAdapter.js` |
| Utility | `src/utils/` | `camelCase.js` |
| Hook | `src/hooks/` | `useCamelCase.js` |
| View/Page | `src/views/` | `PascalCaseView.jsx` |
| Test (unit) | `src/__tests__/` | `camelCase.test.js` |
| Test (E2E) | `e2e/` | `kebab-case.spec.js` |
| Global CSS | `src/styles/` | `kebab-case.css` |

### Modifying Existing Files

- NEVER modify `DECISIONS_DIGEST.md` without explicit user approval
- NEVER modify `context/*.md` without updating `PROGRESS.md`
- NEVER delete files without documenting in `PROGRESS.md`

### File Size Limits

- Single component file: < 300 lines (split if larger)
- Single CSS file: < 200 lines
- Single store file: < 150 lines
- Single service file: < 200 lines

---

## 6. Testing Requirements

### Unit Tests (Vitest)
- Audio engine functions
- Queue management logic
- Recommendation engine logic
- Store actions and selectors
- Service layer transformations
- Utility functions

### Integration Tests (Vitest + Testing Library)
- Search flow (input -> debounce -> API -> results)
- Queue auto-population
- Playlist CRUD operations
- Settings persistence

### E2E Tests (Playwright)
- Onboarding flow (splash -> username -> preferences -> home)
- Full playback lifecycle (search -> play -> queue -> next)
- Library management (create playlist, add songs, reorder)

### Test File Convention
- Test files live in `src/__tests__/` (unit/integration) or `e2e/` (E2E)
- Name matches source: `musicService.test.js` tests `musicService.js`
- Use `describe`/`it` blocks with human-readable descriptions

---

## 7. Git Workflow

### Branch Naming
```
feature/phase-XX-short-description
fix/issue-description
refactor/area-description
```

### Commit Message Format
```
type(scope): description

feat(onboarding): add username input step
fix(queue): resolve auto-queue not triggering at 3 remaining
refactor(service): extract MusicService from direct API calls
style(design): update accent colors to moon palette
docs(context): update user_flows.md with pet interaction
test(queue): add unit tests for auto-queue logic
```

### Commit Frequency
- Commit after each completed sub-task in `PROGRESS.md`
- Never commit broken code
- Never commit with failing tests

---

## 8. Dependency Management

### Approved Dependencies (from DECISIONS_DIGEST.md)

| Package | Purpose | Load Strategy |
|:---|:---|:---|
| react, react-dom | UI library | Eager |
| react-router-dom | Routing (HashRouter) | Eager |
| zustand | State management | Eager |
| dexie | IndexedDB wrapper | Eager |
| @phosphor-icons/react | Icons | Tree-shaken |
| framer-motion | Page transitions, gestures | Lazy |
| gsap | VibeTune visualizer | Lazy |
| @rive-app/react-canvas | Pet system | Lazy |
| @capacitor/core | Android wrapper | Conditional |
| @capacitor/local-notifications | System notifications | Conditional |
| @capacitor/filesystem | File download | Conditional |
| @capacitor/share | Native share | Conditional |

### Adding New Dependencies

1. Check if the functionality can be achieved with existing deps or vanilla JS
2. Verify the package is actively maintained (last publish < 6 months)
3. Check bundle size impact (bundlephobia.com)
4. Document the addition in `PROGRESS.md`
5. Update `AGENTS.md` if it is a core dependency

### Forbidden Dependencies

- Tailwind CSS (project uses vanilla CSS)
- styled-components, emotion, or any CSS-in-JS
- axios (use native fetch)
- moment.js (use native Date or dayjs if needed)
- lodash (use native JS methods)
- jQuery (obviously)
