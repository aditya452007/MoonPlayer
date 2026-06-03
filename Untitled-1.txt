# `react-doctor/role-has-required-aria-props`



- **Category:** Accessibility
- **Severity:** error
- **Source:** oxlint-builtin:jsx-a11y
- **Framework:** global
- **Enabled when:** always (unless customRulesOnly=true)
- **Documentation:** <https://oxc.rs/docs/guide/usage/linter/rules/jsx_a11y/role-has-required-aria-props>

## Validation prompt

Use this to decide whether a fired diagnostic is real or a false positive.

Fires on a JSXOpeningElement whose 'role' is one of a fixed set and is missing ANY of that role's required aria-* (checkbox/radio/switch/menuitemcheckbox/menuitemradio -> 'aria-checked'; option -> 'aria-selected'; heading -> 'aria-level'; combobox/scrollbar -> 'aria-controls' AND ('aria-expanded' | 'aria-valuenow'); slider/meter -> 'aria-valuenow'). It reports each individually missing prop, so a role with SOME (e.g. combobox with only 'aria-expanded', missing 'aria-controls') still fires legitimately. Confirm whenever the role sits on a non-semantic element (div, span, custom component, or button) that has no implicit state. THE ONE FALSE POSITIVE: the role overrides a NATIVE element whose implicit HTML semantics already expose that exact state to the a11y tree -- role='switch'/'checkbox' on '<input type=checkbox checked={...}>', role='radio' on '<input type=radio>', role='option' on '<option>'. There the native 'checked'/'selected' DOM property supplies the state and explicit aria-* is redundant (and can desync). Suppress only that native-backing case. Imperative aria-* added in a useEffect/ref the static JSX can't see is also a (rarer) suppress.

## Fix prompt

Use this once validation confirms the diagnostic is real.

Principle: every role in this rule's set is a state-bearing widget; assistive tech needs the value, so SUPPLY THE MISSING STATE, do not just silence the lint. (A) Best: drop the explicit role and use the native element that owns the semantics -- '<input type=checkbox checked={on}>' for switch/checkbox, '<input type=radio>' for radio, native '<option>' for option, real '<h1..h6>' for heading; the browser then exposes checked/selected/level automatically. (B) If a custom role must stay (styling, headless lib), bind the required aria-* to the live state, never a constant: 'aria-checked={isOn}' for checkbox/radio/switch, 'aria-selected={isHighlighted}' for option, 'aria-valuenow={value}' (add valuemin/valuemax for usable sliders) for slider/meter, 'aria-level={2}' for heading, and BOTH 'aria-controls={listId}' and 'aria-expanded={open}' for combobox -- the rule wants every listed prop, so add all it names. Anti-pattern: hardcoding 'aria-checked={false}' or 'aria-selected={true}' to mute the rule -- that lies to screen readers; wire it to the same prop/state driving the visual (the 'checked'/'value'/'open' already in scope). See https://oxc.rs/docs/guide/usage/linter/rules/jsx_a11y/role-has-required-aria-props
