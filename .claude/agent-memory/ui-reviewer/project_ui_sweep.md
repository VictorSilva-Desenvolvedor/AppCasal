---
name: project-ui-sweep
description: AppCasal is undergoing a proactive full-system UI/UX sweep, one screen per /loop call, started 2026-08-24
metadata:
  type: project
---

The user asked for a proactive screen-by-screen UI/UX sweep of the whole AppCasal
web app (no triggering bug or feature). A `/loop` drives it, one route per call,
each call returning a short report that feeds a progress checklist. Started
2026-08-24 with `/login` (+ `AuthHeroPanel`), then `/register`. **Encerrada em
2026-08-25 com `/app/configuracoes`, a última tela da lista.**

**Why:** the frontend was recently ported wholesale from vanilla JS to React/Vite/
Tailwind, so screens carry migration-era drift rather than a single deliberate pass.

**How to apply:** stay strictly inside the route named in the call — adjacent
screens get their own call. When a fix belongs to a shared auth/layout component,
implement it in the shared place with a generic class name so the next screen's
call can reuse it verbatim, and say so in the report. See
[[auth-screens-conventions]].
