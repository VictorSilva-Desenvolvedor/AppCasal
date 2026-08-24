---
name: auth-screens-conventions
description: Non-obvious constraints when reviewing AppCasal's /login and /register screens
metadata:
  type: project
---

Facts about the AppCasal auth screens that are not obvious from a quick read:

- `/login` and `/register` are **always light + indigo**, on purpose. `ThemeContext`
  resets `theme`/`colorTheme` to the defaults whenever `isAuthenticated` is false,
  because settings only load after login and the SPA would otherwise leak the
  previous session's theme onto the auth screens. Do not file "dark mode broken on
  login" — there is no dark login.
- The hero photo is a **random real cat** from `cataas.com` per mount, so no two
  screenshots match and the underlying tones are unpredictable. Anything drawn over
  it must survive an arbitrary photo; the scrim carries the contrast, not luck.
- `AuthHeroPanel` renders both the desktop photo panel and the mobile compact brand
  header, so anything added there lands on both auth screens at once.

**Why:** I wasted a screenshot round assuming dark mode was reachable on `/login`,
and the random photo makes visual diffing across runs meaningless.

**How to apply:** skip dark-mode and screenshot-diff checks on the auth routes;
judge the scrim/text contrast against the worst-case photo instead. Part of
[[project-ui-sweep]].
