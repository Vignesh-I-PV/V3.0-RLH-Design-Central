# context.md — Network Design Central (RLH Design Central), v2.0

This file is the one place to read before changing anything — either
yourself, or by pasting this whole file to an AI assistant along with your
question. It covers: what this project is, how the 3 files fit together,
how to view it, and what to know before editing.

---

## The 3 files

| File | What it is | Do you edit it? |
|---|---|---|
| `v2.0-rlh-design-base.jsx` | All the app's code — UI + logic | **Yes** — this is the one you change |
| `index.html` | Loads React and this jsx file into a browser page | Rarely — only if you need to change fonts/CDN/page title |
| `context.md` | This file | Update the changelog at the bottom when you make notable changes |

That's it. No build step, no `npm install`, nothing to compile ahead of
time. `index.html` reads `v2.0-rlh-design-base.jsx` fresh every time the
page loads and turns it into a working app right there in the browser.

---

## Viewing it

**On the web (recommended):** put both files in a GitHub repo and turn on
GitHub Pages — see the walkthrough your assistant gave you, or ask again any
time with "how do I put this on GitHub Pages" and it'll give you the
click-by-click version (no terminal needed — GitHub's website lets you
create a repo and drag-and-drop upload files directly).

**Locally, before pushing:** double-clicking `index.html` will show an error
message — this is expected, not broken. Browsers block a local page from
reading a second local file the way this app needs to (same reason the
original prototype needed this too). The friendliest option if you want to
preview a change before pushing to GitHub:
- In **VS Code**: install the free "Live Server" extension, then
  right-click `index.html` → "Open with Live Server". One click, no typing.
- Otherwise, just push to GitHub and check the Pages URL — it only takes
  about a minute per change.

---

## What this project is

A **V1 internal desktop ops panel** for Valmo/Meesho **RLH (Regional
Linehaul) network planning** — replacing a Google-Sheets-based process. A
planner sets inputs, generates optimized route plans per Sort Centre,
reviews them, pushes them to regional Ops Leads for row-by-row alignment,
freezes, and finalises.

- **V1 scope = 3 modules only:** Design Inputs → Design Creation → Design
  Review & Ops Alignment, plus a Network Map. (A parent "5-module NDC
  vision" — OCF Simulator, Network Simulator, Change Management — is **out
  of V1**. Don't add them without a product decision.) **Command Center is
  currently hidden** from the nav and default view (product decision —
  "retrieve it later"); the code and data behind it are still intact, just
  not linked from the sidebar. See Changelog.
- **Platform:** Desktop-first, expert internal ops users.
- **Owner (design):** Pranita Sapkal · **Product owner:** Vignesh Iyer ·
  **Org:** Meesho / Valmo.
- **Figma remains the source of truth for visual design.** This app
  demonstrates interaction and flow; where visual polish conflicts, defer
  to Figma.

### Personas
| Persona | Role | What they see |
|---|---|---|
| **Central Network Planner** (primary) | Owns inputs, creates designs, pushes for alignment, finalises | Full panel |
| **Ops Lead / Regional PoC** (secondary) | Reviews pushed plans row-by-row, gives structured feedback | Stripped shell — Ops Alignment + Map only |

In production this is a real per-user login. The app fakes it with a
**"View as: Planner / Ops Lead"** toggle — shown **only on the Ops
Alignment screen** (top-right), not on other screens.

### Domain glossary
| Term | Meaning |
|---|---|
| **LMSC** | Last-Mile Sort Centre — the origin hub (~80 in scope) |
| **LMDC** | Last-Mile Delivery Centre — destination nodes (~10–13k, avg ~150/SC) |
| **RLH** | Regional Linehaul — the LMSC → LMDC routing problem (V1 scope) |
| **NLH** | National Linehaul — out of scope here |
| **CPS** | Cost Per Shipment — the primary cost metric |
| **Design Cycle / Plan Group** | A named planning cycle (e.g. "July 2026"); one upload + trigger = one group; all creation & alignment scoped to it; ≤80 SCs |
| **HW (Historical Weight)** | 0 / 0.5 / 1 — penalty for changing routes vs preserving last month's design. HW > 0 needs a reference plan per SC |
| **Run** | One triggered DS solver job = one SC × one HW value (async, Gurobi VRPTW) |
| **AutoDML** | Read-only source of truth for active network nodes; the panel surfaces only flagged warnings as a pre-plan gate |
| **Design Review** | Per-run metrics review (Coverage / CPS / Utilisation / Routes / Vehicles / Distance / Cost). No reject — un-pushed runs are discarded |
| **Ops Alignment** | The feedback loop: Ops Lead reviews route rows and flags cells with suggested corrections; Planner **Simulates** (metric delta only), Accepts/Rejects, then **Acknowledges** (freeze) → **Finalises** |
| **Acknowledge** | Freeze — locks Ops-Lead editing. A first-class guarded action with a confirm dialog. As of 2026-07-15, reversible via **Unfreeze** (Planner-only, Received tab or plan detail): reopens Ops-Lead editing, resets the Planner's own Accept/Reject decisions, keeps all submitted feedback intact. Guarded by its own confirm dialog warning that decisions reset |
| **Simulate** | Shows metric movement (Δ km/cost/time/vehicles) for a proposed change — NOT a full re-plan |
| **Lifecycle** | Draft → Running → Created → In Review → Pushed → In Alignment → Acknowledged → Finalised → (RFQ handoff) |
| **L1→L4 pattern** | The navigation shape shared by Design Review and Ops Alignment: **L1** status/zone chips (rail header) → **L2** SC list (rail body) → **L3** a compact plan **card** in the main pane (one per plan; click a card's icon to drill in) → **L4** the full plan detail (Plan Details / Route View tabs). See "L3/L4 card pattern" below before touching either screen. |

**Flaggable cells (Ops Lead):** Vehicle Type · Touchpoint · Route Code · Lat
· Lng · Round-Trip Distance · Breakdown TAT · Out Cutoff. (Non-flaggable: SC
location, node volume.)

### Locked decisions — don't relitigate without design/product sign-off
1. **V1 = 3 modules only** (Inputs · Creation · Review/Alignment + Map).
2. Persona split via **real login** in production (this app uses the demo toggle).
3. **Design Cycle** scopes all runs; cap ≤80 per group (not 240 stacked).
4. Persistence = **2 versions only** (published baseline + finalised). No per-edit audit log.
5. **Simulate = metric delta only**, wired per-row inline (not a footer button).
6. **Acknowledge = freeze**, guarded action with a confirm dialog naming who's locked. As of 2026-07-15, reversible via Unfreeze (Planner-only) — see Domain glossary.
7. **3-HW comparison is mandatory for V1** (not deferred). Un-pushed runs are discarded (no reject button).
8. **Reference-plan smart defaults** — carry forward last cycle's finalised plan; only manually pick for new SCs.
9. **No inline field-level validation on inputs** — "showing a file error is good enough" (shallow validation).
10. **No month-over-month comparison in V1.**
11. **Map is high priority** (arc map; benchmark Locus / Kepler.gl).
12. **All buttons/filters must be wired** — no dead controls; backend-dependent ones show "coming soon" toasts.
13. **FTUX is sparing** — 4-step dismissible coachmark + contextual ⓘ tooltips + two dismissible banners.

**ADR-001** — Ops Alignment review grain = **ROUTE level** (one
Aligned/Needs-Change verdict per route, not per DC). Node-level params are
edited inside a route's drill-down.
**ADR-002** — Navigation = left-sidebar only; Ops Alignment = master-detail;
Design Creation carries a network-tier placeholder (RLH/NLH/FM).

### Design system
**Meesho Crystal v1.1.1 with a Valmo navy override.**

| Token | Value |
|---|---|
| Shell sidebar | `#0B1430` (dark navy) |
| Primary CTA | `#003F98` (Valmo navy — do **not** switch to Crystal indigo `#3C29B7`) |
| Accent | `#2F4FC6` |
| Surface | `#F4F5F8` / `#FFFFFF` |
| Ink | `#14171F` / `#4A4F5E` / `#7A8094` |
| Neutrals | `#272829` / `#5A5E66` / `#8E96A3` / `#C3C9D4` / `#E6EBF2` / `#F2F5FA` |
| Success `#128A3E` · Warning `#C77B00` · Danger `#D14B4B` · Info `#1E6FB8` | |

**Typography:** Mier B02 (400 / 600-Demi / 700), 13px base — see "Fonts"
below; currently falls back to system fonts.

### Open / pending product items (unchanged from original handoff)
- Wire real backend for CSV upload/export/replace/delete (currently toasts / session-only state).
- Real ~80-SC list + zones, DS-job output contract, final input templates, Planner/Ops access lists.
- Free-text global search (top bar) is stubbed to a "coming soon" toast.
- "Open in new tab" is stubbed to a toast.
- Ops-Lead two-snapshot diff; phased-release option — under discussion.

### Pending fixes (as of the last session — ask before assuming these are resolved)
The UI was signed off as "largely good" with **a few specific fixes still
to come**, but they weren't itemized before the session ended. **If you're
an AI picking this up: ask the person what those fixes are before doing
unrelated work** — don't guess and don't assume silence means it's all
settled. Once you get the list, replace this paragraph with the actual items.

---

## Fonts

The brand font (Mier B02) isn't loaded anywhere yet — its `.woff2` files
weren't part of the original handoff to this project. The app runs fully
functional on system fonts in the meantime (this was already the original
prototype's documented offline fallback, not a new gap).

If you get the 3 files later (`Mier_B02-Book.woff2`, `Mier_B02-Demi.woff2`,
`Mier_B02-Bold.woff2`), the easiest path with only these 3 project files is
to host them somewhere with a public URL (e.g. add them to the same GitHub
repo and reference the "raw" GitHub URL) and add `@font-face` rules
pointing at that URL inside `index.html`'s `<style>` block.

## If the CDN is blocked

`index.html` loads React, ReactDOM, and the Babel compiler from `unpkg.com`.
If you're on a corporate network that blocks or breaks CDN scripts (some
proxies re-compress responses in a way that breaks browser security
checks), the app will fail to load with a blank page and console errors
about React not being defined. Two options: try it from a different network
(e.g. home wifi, or your phone's hotspot) to confirm that's the cause, or
ask your assistant to rebuild the "bundled locally" version (no CDN
dependency) — that variant exists, it just trades "3 files" for "3 files
plus a `vendor/` folder."

---

## For whoever (or whatever AI) edits `v2.0-rlh-design-base.jsx` next

### Where this code came from
The very first version of this app was built with a design tool that
exported a custom template format (`{{ binding }}`, `<sc-if>`, `<sc-for>`
tags) that only ran inside that tool's own runtime script. It was
mechanically converted into this plain React file — same state, same logic,
same look — using an automated script (kept separately, ask your assistant
if you want it) rather than by hand, since the original was about 7,200
lines. The conversion was verified by actually rendering every module in a
real browser and comparing it against the original before being handed
over — this is not a rough draft.

### The file's 3 sections (see the banner comments inside it)
1. **Helpers** — `css()` turns a CSS-text string into the object React's
   `style` prop needs; `hoverOn()`/`hoverOff()` handle a couple hundred
   hover-color effects that the original implemented in a non-standard way.
   If you're writing brand-new UI, prefer a real `style={{...}}` object and
   a real CSS `:hover` rule instead of extending these — they exist for
   compatibility with code ported from the original, not as the preferred
   pattern going forward.
2. **`View()`** — all the markup. Notice it's wrapped in `with (B) { ... }`
   — this is intentional, not a mistake. Every value used in the markup
   (like `{cycleName}` or `{item.label}`) comes from one big object built
   fresh on every render by `NDCApp.renderVals()`; `with` is what lets the
   markup use short names like `cycleName` directly instead of
   `B.cycleName` everywhere. Don't "clean this up" into strict-mode code
   without also restructuring the whole file — the two changes have to
   happen together.
3. **`NDCApp`** — the component: state, the fake/sample data generator, and
   every button/action's logic. The last two lines mount it onto the page.

### The L3/L4 card pattern (Design Review + Ops Alignment)
Both screens follow the same shape: selecting an SC in the left rail (L2)
doesn't jump straight to the full plan — it shows a compact **card** (L3)
in the main pane first. The card's top-right icons (eye = view detail, map,
download CSV) are the only way into the full plan (L4: metrics + Plan
Details / Route View tabs). A "Back to plans" control returns from L4 to L3.

- State: `st.opsDetailOpen` (Ops Lead) / a plan is "open" once its detail
  view is entered — look for `showCard` / `detailOpen` / `openDetail` /
  `backToCards` (or the align-side equivalents) in `oSel`/`aSel` if you need
  to trace it.
- Each SC currently has exactly **one** plan, so L3 always renders a single
  card today — it's still written as a mapped list/stack on purpose so
  adding multiple plans per SC later doesn't require restructuring, just a
  longer array.
- Card layout convention (apply this to any new plan/run card): identity +
  status pills top-left, **view/map/download icons top-right**, compact
  metrics strip in the middle, **primary actions (Push/Simulate/Acknowledge/
  Finalise) bottom-right**. Keep cards as short as possible — full summary,
  minimum height.
- Ops Alignment's three Planner states (Pending/Received/Finalised) and
  four Ops-Lead states (To Review/Submitted/Acknowledged/Finalised) each
  have their own card content (see the card markup directly above each
  `isPushed`/`isFinal`/etc. condition) but all share this same layout
  convention and icon/action placement.
- The "Received" filter tab intentionally includes **both** `In Alignment`
  and `Acknowledged` plans (comment: "gives every plan exactly one home
  across the 3 tabs") — an Acknowledged plan showing under "Received" is
  correct, not a bug.
- **L4 (full plan detail) now opens as a full-screen overlay everywhere**
  (Design Review and both Ops Alignment personas, in every state) — see
  "Unified L4 full-screen detail" below.

### Unified L4 full-screen detail (Design Review + Ops Alignment, both personas)
As of 2026-07-08, the L4 "click the eye icon" plan detail uses **one shared
visual template** across Design Review and Ops Alignment (Planner and Ops
Lead, every status). Previously Design Review opened L4 as a full-screen
fixed overlay while Ops Alignment expanded it inline in the same layout —
these are now the same shape:

- **Full-screen overlay** (`position:fixed; inset:0`) with a top bar (Back,
  identity + status tags, context actions — Simulate/Map/Download as
  applicable — and a Close `✕`) and a scrollable body below it.
- **Two tabs inside the body: "Plan Detail" and "Route View."** Nothing
  else is a top-level tab.
  - **Plan Detail** = the summary: inputs strip, output metrics grid,
    vehicle mix/vehicles-by-type, status banners (awaiting feedback /
    acknowledged-locked / finalised / needs-acknowledge-to-decide), and
    reviewer/co-reviewer info. Nothing route-by-route lives here.
  - **Route View** = the route-level content: Design Review's read-only
    route breakdown (still has its own inner Detail-View-by-DC / Route-View
    toggle — that's a second, narrower choice nested *inside* this tab, not
    a competing top-level tab); Ops Alignment Planner's per-route
    Accept/Reject change cards; Ops Alignment Ops Lead's per-route
    Aligned/Needs-Change decision table. This fixes a prior bug where the
    Ops-Lead's tab was labelled "Route View" but actually rendered the
    vehicle-mix summary — vehicle mix now lives under Plan Detail, where it
    belongs.
- Each context (`reviewDetail`, `aSel`, `oSel`) still computes its own data
  shape and keeps its own state key for which one is open — this was a
  visual/structural unification, not a data-model merge. Don't assume
  `reviewDetail`/`aSel`/`oSel` share fields beyond the tab-name convention
  (`secDetails`/`secRoute` or equivalent).
- Any sticky bottom action bar for a given context (Ops Alignment's
  Validate/Accept-all/Acknowledge/Finalise bar, Ops Lead's Validate/Mark-
  all-Aligned/Simulate/Submit bar) now lives **inside** that context's
  full-screen overlay (sibling to the scrollable body, at the bottom of the
  same fixed-position flex column) — not at the page layout level like
  before.

### Ops Alignment: Accept/Reject now gated on Acknowledge & Freeze
As of 2026-07-08, the **Planner** can no longer Accept/Reject a flagged
change while a plan is still `In Alignment`. They can review what Ops
flagged (read-only), run Simulate, and Acknowledge & Freeze — but the
Accept/Reject buttons on each flagged route/DC change only unlock once the
plan is `Acknowledged`. This reverses the prior "decide before freezing"
flow (see the old inline comment that used to read "Accept/Reject unlocks
the moment feedback is received (In Alignment), per row, BEFORE
Acknowledge" — that's no longer true). Acknowledge itself still only
depends on Ops feedback having been submitted, not on any rows being
decided — an Acknowledge with pending rows now leads *into* the
decide-every-row-then-Finalise step rather than skipping it. Reflect this if
you touch `alignVals()`'s `canDecide`/`decideLocked` computation or the
`In Alignment` banner copy. This does **not** touch the Ops Lead's own
Aligned/Needs-Change flagging — that's a different, still-immediate
mechanism (it's Ops proposing changes, not Planner deciding on them).

### "Nudge reviewers" removed from Ops Alignment (Planner side)
As of 2026-07-08, the "Nudge reviewers" button (bell icon + label, shown on
a `Pushed`-status plan card and in that state's sticky action bar) has been
removed from the Planner's Ops Alignment view, per product decision. The
underlying `remindedPlans` state, `onNudge` handler, and the Ops-Lead-side
"Reminder from planner" chip in their rail list were left in place (now
functionally unreachable/dead, matching this file's convention of leaving
superseded logic intact rather than deleting it — see the Command Center
precedent above) rather than torn out, in case nudging comes back in a
different form. Don't re-wire that dead code without a product decision.

### Volume upload validation (Design Inputs)
Uploading a volume CSV now runs through `validateVolCsv()` (a deterministic
fake validator — see its comment for the naming escape-hatches to force
pass/fail while testing/demoing). A file that fails is added to the library
with its errors visible but is **never** set active — whatever was active
for that type stays active until a corrected re-upload passes. `volEdits`
(state, keyed by file name) overlays corrections from a "Replace" re-upload
onto either a seeded or session-uploaded row, the same pattern `scEdits`
uses for SC Master. `activeNameOf()` will never fall back to a file that
has errors — double-check that invariant if you touch it.

### SC Master "Ops Leads" dropdown
The 8 old per-role email columns were replaced with one "N leads" column;
`pocList` (name + role + a derived email) drives a `position:fixed`
dropdown anchored to the clicked button's bounding rect (not
`position:absolute` — the table scrolls, and `fixed` avoids clipping).


- A couple of `<select>`s have an `<option selected={...}>` ported as-is
  from the original — React may log a console note about this; harmless.
- Repeated list rows use their position in the list as their React "key"
  (fine for filtering/searching; if you ever add drag-to-reorder to a list,
  switch that list to a stable key like an SC code first).

### If something looks different from the original design
Treat it as a bug in the port, not an intentional redesign, and flag it —
nothing about the product behavior was meant to change in the conversion.

---

### Ops Feedback recompute engine (2026-07-09)
Ops Alignment's Needs-Change feedback, Validate, Simulate, and Finalise are now backed by one
real engine — `NDCApp.computeHypotheticalPlan(plan, effectiveFbByIdx)` — instead of the previous
RNG-based approximation. Read the method's own comment block first; the short version:

- **Field model.** Route-level feedback is Vehicle Type only. Everything else — Lat, Lng, Touch
  Point, Route Code, Distance — is DC-level. A DC's Route Code can point at an existing route
  (move) or at **Split this route**, which auto-names a new code (`<original>-A/B/C…`) and
  requires its own manually-picked vehicle (never carried over from the source route).
- **Distance.** Each DC's "Distance" is the breakdown leg *into* it from whichever node precedes
  it (another DC, or the SC itself for the first DC). The return leg (last DC → SC) is **always**
  system-calculated via `NDC_haversineKm()` — never user-editable, no matter what. If a user-given
  leg differs from the calculated one by more than 25%, that's a warning surfaced to both the Ops
  user (at Validate) and the Planner — but only while it's still unresolved by the time feedback is
  submitted (fixed-before-submit issues don't carry forward).
- **Cost.** `NDC_COST_PER_KM` is a hardcoded Rs/km table (ACE 12, Bolero 14, 407 18 — product-
  provided). Any other RLH-feasible vehicle type without a listed rate falls back to a capacity-
  scaled placeholder in `NDC_costPerKmFor()` — flagged in a comment, swap in real rates whenever
  product has them. `routeCost = distance × costPerKm; routeCPS = cost / volume; SC CPS = Σcosts /
  Σvolumes`.
- **Merge across reviewers.** `effectiveFbFor(plan)` merges every reviewer's already-*submitted*
  feedback (`plan.rows[i].fb`) with the current browser session's in-progress edits
  (`st.opsRowFb`), current session taking priority per row. Validate and Simulate always run
  against this merged view — "expected metrics post all changes proposed until this point," per
  product — regardless of how many reviewers or rounds are involved.
- **No live reordering during review.** Validate and Simulate compute real numbers from the
  hypothetical reordered structure, but **never render it** — the route list, DC breakdown, and
  map stay in the existing diff-overlay presentation (original structure + proposed changes
  annotated inline, same pattern as the changeList). Simulate is preview-only; it does not mutate
  `plan.rows`.
- **Finalise is the only commit point.** `confirmFin()` calls `effectiveFbForFinalise(plan)` —
  the accepted-only counterpart of `effectiveFbFor` (a rejected change, including a rejected
  split, reverts to its original value) — recomputes via the same engine, and this time actually
  rewrites `plan.rows`/`plan.metrics` to the reordered structure. This is the one place Details/
  Route View show the new order.
- **Known scope boundary:** post-Finalise, the aggregate numbers per route (distance, CPS,
  vehicle, DC membership, TP order) are exactly what the engine computed. The *fine-grained*
  per-DC lat/lng/leg-distance table you see in Design Review / Route View still comes from
  `genDcRows()`'s existing deterministic-jitter distribution of the route's total distance across
  its DCs — it was not rebuilt to carry the engine's exact per-leg figures. If per-DC precision in
  that table matters later, `genDcRows()` needs a real rework to accept engine output directly
  instead of re-deriving it.
- **Route-level CPS comparison tables** (Simulate, both personas) were simplified to a reference
  table — original vehicle/distance/CPS plus a "N DCs moving" badge — rather than a fabricated
  per-route "proposed CPS," since a route can split or gain DCs from elsewhere under merged
  feedback, so "this original route's new CPS" isn't always a well-defined 1:1 number. The SC-level
  CPS card is the real, product-confirmed number to look at.

## Changelog
- **2026-07-07** — Converted from the original Claude-Design DSL prototype
  (`ndc.dc.html`) to plain React/JSX; removed dead code flagged in the
  original design handoff (unused volume-library "set active" machinery,
  an always-off `mapNational` flag); simplified from a multi-file project
  down to these 3 files.
- **2026-07-08** —
  - **Volume Inputs validation gating**: uploads are now actually
    validated (`validateVolCsv()`); a failing file shows row-level errors
    and is never set active; added a "Replace" re-upload flow that
    re-validates in place (`volEdits` overlay).
  - **SC Master**: collapsed 8 per-role email columns into one "Ops Leads"
    column with a `position:fixed` dropdown (name/role/email per lead).
  - **Ops-Lead Ops Alignment tabs** renamed *Overall Summary → Plan
    Details*, *Vehicle Plan → Route View*; *Node Details* tab removed.
    Same two-tab pattern added to the Planner's Ops Alignment read-only
    state; Design Review already had this exact pattern.
  - **Design Review**: run cards converted from a 2-column grid to a
    full-width list (one per row); "Finalise directly" now shows the
    confirm-dialog copy: *"Bypassing Ops Alignment... This action cannot
    be undone."*; the Runs-bar "Planned" bubble and "In Flight" section
    were removed; Detail View / Route View toggle moved to the left with
    Detail View shown first and the "Route Breakdown" label removed.
  - **Command Center hidden** from the sidebar and as the default view
    (now defaults to Design Inputs) — product decision to bring it back
    later; code/data left intact.
  - **"View as" toggle** scoped to the Ops Alignment screen only (was
    showing on every screen).
  - **Design Review Detail View (DC × Route)**: rows for the same route are
    now visually boxed together (outside border around the group), matching
    how the source planning spreadsheet groups a route's rows.
  - **Ops Alignment rebuilt to the same L1→L4 pattern as Design Review**
    (status/zone → SC → plan card → full detail) for both personas —
    Planner's Pending/Received/Finalised and Ops Lead's To Review/
    Submitted/Acknowledged/Finalised each get their own card content
    (metrics, reviewer status, Simulate/Acknowledge, lock banners) per spec.
    Plan cards across Design Review and Ops Alignment now consistently put
    view/map/download icons top-right and primary actions bottom-right.
  - Read (but did not yet build against) a sample plan-output spreadsheet
    (`DS Output`/`Ops Feedback` × `Details`/`Route View`, plus `Metrics`)
    establishing: the Details↔Route View pivot relationship (conceptual,
    not literal formulas), route rows visually grouped with an outside
    border, and that a route-code/touch-point re-sort + Route View
    recompute only happens on **Simulate or Finalise**, not on every edit.
  - Signed off as "largely good" — a handful of further fixes are planned
    but weren't itemized before the session ended; see "Pending fixes" above.
  - **L4 plan detail unified across Design Review + Ops Alignment (both
    personas, every state)**: same full-screen overlay chrome, same
    "Plan Detail" / "Route View" two-tab body. Fixed the Ops-Lead tab
    mislabel where "Route View" rendered the vehicle-mix summary instead of
    a route table — vehicle mix moved to Plan Detail, Route View now shows
    the actual per-route Aligned/Needs-Change table. See "Unified L4
    full-screen detail" above.
  - **"Nudge reviewers" removed** from the Planner's Ops Alignment view
    (card action + sticky bar); see "'Nudge reviewers' removed" above.
  - **Planner Accept/Reject now gated on Acknowledge & Freeze**: a flagged
    change can no longer be decided while a plan is `In Alignment`; the
    Planner must Acknowledge & Freeze first. See "Accept/Reject now gated
    on Acknowledge & Freeze" above.
- **2026-07-09** — Ops Feedback rebuilt around a real recompute engine
  (see "Ops Feedback recompute engine" above). Concretely:
  - Needs-Change modal restructured: route-level is Vehicle Type only;
    Route Code and Distance moved to DC-level. Route Code is now a
    dropdown (existing routes + **Split this route**, which auto-names
    `-A/B/C…` and requires a manual vehicle pick for the new route — never
    inherited from the source route).
  - Added `NDC_COST_PER_KM` (hardcoded ACE/Bolero/407 rates + a flagged
    capacity-scaled fallback for other types), `NDC_haversineKm()`, and
    `NDCApp.computeHypotheticalPlan()` — the one function Validate,
    Simulate, and Finalise all read from now.
  - `effectiveFbFor()` merges every reviewer's submitted + in-progress
    feedback for a plan; `effectiveFbForFinalise()` is the accepted-only
    variant used solely by Finalise.
  - Validate (both personas) now runs the real engine and shows actual
    errors/warnings instead of a canned checklist; Simulate is gated on
    zero errors and shows real SC-level CPS/distance before-after instead
    of an RNG nudge. The per-route "CPS comparison" tables were simplified
    to a reference table (no fabricated per-route proposed CPS — see the
    engine section above for why).
  - The >25% distance-variance warning surfaces to the Ops user at
    Validate and, if still unresolved at submission, to the Planner too
    (new banner above "Changes to review" in Ops Alignment · Planner).
  - Finalise (`confirmFin()`) now actually reorders: it commits the
    accepted-changes-only hypothetical structure into `plan.rows`/
    `plan.metrics` for real — the only point in the whole flow where the
    reordered structure is committed or shown.
  - No live reordering during review, by design — Validate/Simulate
    compute against the hypothetical structure but keep rendering the
    original diff-overlay view; only Finalise's output actually changes.
  - **Post-build QA pass (same day)** caught and fixed four real gaps
    before this went out for deployment sign-off — noted here since none
    of them showed up as a compile error, only as incorrect behavior:
    - `confirmFin()` was recomputing route/vehicle/distance/cps but
      leaving the plan-level `util` and `avgTat` metrics stale (carried
      over from before the reorder). Now recomputed as the average across
      the new `plan.rows`.
    - `buildSeed()`'s demo "Needs Change" rows (both the general seeding
      loop and the two hand-scripted Ravi Kumar demo rows) were still
      writing feedback in the **old** shape (`fb.cells.touchpoint`,
      `fb.cells.roundTripDistance` — route-level). The new engine only
      reads `fb.cells.vehicleType` at route level and everything else
      from `fb.dcCells`, so this demo data was silently a no-op under the
      new model. Rewritten to seed touchpoint/distance under `dcCells`.
    - The planner's route-card summary line (`mlTpChg`/`mlDistChg`, the
      amber "this changed" highlight) was still checking for the old
      route-level `cells.touchpoint`/`cells.roundTripDistance` keys, which
      can never be set anymore — so a real DC-level touch-point or
      distance change would show with no highlight. Now checks
      `dcCells` for any DC with a `tp`/`distance` override.
    - Left-over dead entries in the planner's `FIELD` label lookup
      (`routeCode`, `roundTripDistance`, `touchpoint`) removed — they
      referenced keys that can no longer appear in `cells`.
- **2026-07-10** — two fixes/changes reported after the above went out:
  - **Blank-screen bug on "Split this route" (fixed).** Root cause: the
    split-vehicle `<select>` I added to the Needs-Change modal referenced
    a bare `vehPool` identifier directly in JSX. `vehPool` is a local
    `const` inside `opsVals()`, never included in that function's return
    object — so it's not a property of the `with(B)` bindings object
    `View()` renders against, and referencing it there throws a
    `ReferenceError` the instant that dropdown tries to render, which
    blanks the whole screen. This class of bug (a *Vals() local used
    directly in JSX without being returned) is invisible to a Babel/
    syntax check — it only surfaces at runtime. Fixed by passing
    `splitVehicleOptions: vehPool` through each `ncDcList` item instead
    of referencing the bare variable. Worth grep-checking for this pattern
    (`grep` for a bare identifier used in JSX that isn't `st.`/`d.`/a
    `.map()` callback var/an object property) after any future edit that
    introduces a brand-new bare variable into a *Vals() function.
  - **Ops Lead L4 (the "eye" expand icon) restructured** to match Design
    Review's own Detail View / Route View pattern instead of the earlier
    ad-hoc per-route decision table:
    - Metrics moved out of any tab — now always visible above the tabs.
    - **Details** (first tab): a flat DC × Route list, same 10-column
      layout as Design Review's Detail View (LMDC, Design Vol, Route Code,
      TP, Zone, Out Cutoff, TAT, In Cutoff, Vehicle Type, RT Dist), built
      from this plan's real rows/DCs rather than synthesized. Each route's
      DCs are visually boxed together (same outside-border grouping as
      Design Review), with the route's Aligned/Needs-Change actions in
      that group's header row, live whenever the plan isn't locked yet
      (`editable: !planLocked` — same gate as before, which in practice
      covers "To Review" and "Submitted" alike, since Ops can keep
      editing/resubmitting right up until the Planner Acknowledges &
      Freezes, per the earlier partial-submission decision).
    - **Route View** (second tab): a real read-only pivot, one row per
      route, same 12-column layout as Design Review's Route View (LMDC,
      Route, Vehicle, Count, Freq, Dist, CPS, TPs, Util, Volume, Cap,
      Lat/Long). The vehicle-mix strip that used to be a standalone block
      now sits as a small summary above this table.
    - The old per-route table with inline DC-expand (TP-order editing)
      was removed — decisions now happen from the Details tab's route
      group headers, and actual field edits (lat/lng/TP/route code/
      distance) still go through the Needs-Change modal, unchanged.
    - Known gap carried over from Design Review's own version: several
      columns (Zone, In Cutoff) aren't tracked as real per-DC data in this
      app's model. Zone repeats the SC's own zone for every row (not
      fabricated per-DC); In Cutoff is derived as Out Cutoff + Breakdown
      TAT (a real calculation, not a random fill) rather than left blank.
- **2026-07-10, second pass** — four more changes, same session:
  1. **Planner's L4 mirrors the Ops Lead/Design Review pattern too.**
     Metrics moved above the tabs (always visible). **Details** is now
     the same flat DC × Route table, but with Ops's proposed changes
     overlaid inline (original struck through, proposed in amber) and
     Accept/Reject controls right in the row/route-group header — reusing
     the *existing* `changeList` entries (and the per-DC `enrichedDcRows`
     they're built from) rather than a re-derivation, so decision state
     stays single-sourced with everywhere else that reads it. **Route
     View** is the same real read-only pivot as Ops Lead's. The old
     routeCards-based "Changes to review" list is gone.
     - Fixed a real gap found while doing this: `enrichedDcRows` (and the
       `changeList` it feeds) never tracked `routeCode`/`distance`
       DC-level changes at all — only lat/lng/TP — meaning a DC-only
       route-split or distance proposal was silently invisible to the
       planner's decision UI and never counted toward "all decided."
       Both now include these fields properly.
  2. **Finalise gating reworked into the full state machine** (product
     spec): Acknowledge & Freeze unlocks on feedback received; Simulate
     is available immediately after Acknowledge (previewing everything
     proposed, `effectiveFbFor`) but turns OFF the moment any Accept/
     Reject decision is made; it turns back on once Validate on the
     *current* decisions comes back with zero errors (now previewing only
     the accepted subset, `effectiveFbForFinalise` — the exact same
     accepted-only view Finalise itself will commit); Finalise itself now
     also requires that zero-errors state, not just "everything decided."
     `validatedClean` is derived on every render (not a stateful "did
     they click Validate" flag), so it can never go stale if decisions
     change after a prior Validate pass. A `simStateLabel` next to the
     progress counter tells the planner which of these states they're in.
  3. **Finalised view shows no remarks — automatically**, since
     `confirmFin()` already nulls every row's `fb` on commit; the new
     Details table's diff-overlay and remark line are conditioned on
     `fb`/`changeList` existing, so a Finalised plan just renders clean by
     construction. Added one thing beyond that: `finalWarnings` re-runs
     the recompute engine against the committed structure (no feedback)
     purely to surface any residual advisory warning (util, distance vs
     vehicle limit) — errors shouldn't exist post-Finalise, but this
     catches anything still worth a heads-up.
  4. **"Map view" opens an independent tab instead of navigating away**,
     for the Planner's and Ops Lead's Ops Alignment map buttons. New
     mechanism: `openStandaloneMap(scCode, mode)` opens THIS SAME page in
     a new tab with `?standaloneMap=<code>&mapMode=<label>`; the
     constructor detects that param and `render()` branches to
     `renderStandaloneMap()` instead of the normal app shell. Because
     `buildSeed()` is fully deterministic, the new tab reconstructs the
     identical plan/route data independently — **no cross-tab state
     channel exists or is needed**, but that cuts both ways: the map tab
     shows the seeded/committed structure, not the original tab's
     in-progress unsaved edits (pending Ops feedback, undecided Accept/
     Reject calls). It's an independent read-only view, not a live
     mirror. Reuses `buildMiniMap()`'s existing arc geometry scaled up via
     SVG viewBox rather than re-deriving Network Map's own filter/search
     UI from scratch.
     - **Scoped deliberately to the two Ops Alignment map buttons only.**
       Design Review's `openRunMap` (the per-run map modal) was left
       unchanged: it's keyed to a specific HW-variant *run*, and this
       app's standalone-map reconstruction only has access to the
       committed *plan* (`plan.rows`), not historical run-level geometry —
       converting it would have shown the wrong routes for any run other
       than the latest. Flagging this rather than silently shipping an
       inaccurate map.
- **2026-07-10, third pass** — reference sheet provided (`_Sample__Plan_
  Output.xlsx`, DS Output / Ops Feedback Route View + Details + Metrics
  sheets); four fixes against it and against reported bugs:
  1. **Route View columns corrected everywhere** (Design Review, Ops
     Lead, Planner) to exactly match the reference sheet: Route Code,
     Count of Nodes, Total Volume, Total Distance (km), Vehicle Type,
     Utilisation, Capacity. Dropped **LMDC, Frequency, CPS, and
     Lat/Long** — the last one was flagged directly: a route spans
     multiple nodes, so a single lat/long at route grain never made
     sense; only nodes (DCs) have coordinates, which is exactly why
     Details view carries lat/long per-DC and Route View never should.
     The Design Review CSV export was updated to match.
  2. **Planner no longer sees flagged changes on a Pushed (pending-
     feedback) plan.** Root cause: `buildSeed()`'s `demoPushed` block
     seeds `r.ops = 'Needs Change'` + `r.fb` on one row of a Pushed-status
     plan on purpose — but only to demo Ops-Lead-side "co-reviewer
     visibility" (a second reviewer seeing what a first one already
     proposed, before the whole plan is submitted). The Planner's own row
     computation read `r.ops`/`r.fb` unconditionally, with no gate on
     plan status, so that demo data leaked into the Planner's Details
     view as a real flagged change. Fixed by gating every read of
     `r.fb`/`r.ops`/`r.proposedBy` in the Planner's row construction
     (`needsAttn`, `cells`, `dcCellsObj`, the `op` colour lookup, and the
     final `ops`/`opsChip`/`hasFb`/`fbText` fields) behind `ps !==
     'Pushed'`. Ops Lead's own view is untouched — the co-reviewer demo
     still works there, which is its actual intended audience.
  3. **Standalone map tab rebuilt** to actually have filters and to stop
     using a second, disconnected synthetic geometry. It previously
     called `buildMiniMap()` (a small preview-card generator with its own
     separate scatter, no filters, tiny 280×174 canvas — the wrong tool
     for this). Now: node positions come from `genDcRows()`, the *exact*
     same source every Details table reads, so a DC on this map is the
     same DC in the same place as in whichever Details view you opened it
     from. Rendering borrows Network Map's visual language (muted canvas,
     white-cased colored arcs, SC-origin marker, legend) and its filter
     set (Route dropdown, Vehicle dropdown, LMDC search, Clear all,
     "Showing X of Y routes") as real, wired controls — not static
     decoration. Built with `React.createElement` rather than JSX/`with
     (B)` since it renders outside `View()` entirely (see
     `renderStandaloneMap()`).
  4. **Sort Centre Master's Bulk Upload restored.** It was simply never
     added to that tab's toolbar (SC Vehicle Availability has one; SC
     Master didn't) — added the same Template/Upload CSV bar, with a
     dedicated `scMasterTemplate` handler covering the SC Master's own
     15 columns.
- **2026-07-10, fourth pass** — three small-fix requests:
  1. **Volume Inputs library only ever shows valid files.** Invalid
     uploads (route through `pickVolFile`/`replaceVolFile`) are validated
     immediately, same as before, but a failed validation no longer adds
     a record to the library at all — only the error modal shows, the
     file itself isn't persisted. Also added a defensive filter on
     `allVol` so this holds regardless of source, catching two seeded
     demo rows that had `validated:false`. The VALIDATION column is
     removed from the table (nothing left to show there), and the Delete
     action is removed from the row actions — files can no longer be
     deleted once uploaded, only replaced.
  2. **Vehicle TP limits: warn instead of block, everywhere.**
     - Vehicle Master: setting an RLH-feasible vehicle's TP limit above 7
       used to hard-block the save (`submitAddVeh`); now it saves and
       shows a warning toast, plus a persistent "⚠ over 7 (RLH)" badge
       on that row's Touch Point Limit cell going forward.
     - SC Vehicle Availability and Design Creation Step 2: found this was
       already mostly built (a `vmTp`/`exceeds` comparison against
       Vehicle Master's configured TP already existed), but it was
       styled and gated as a hard *error* (red, and — at the Design
       Creation summary level — actually blocked plan triggering via
       `sev:'danger'`). Split the "TP exceeds master" case out from the
       (unrelated, and correctly still-blocking) "vehicle count exceeds
       max" case: TP-over-master is now `sev:'warning'` (orange, doesn't
       block triggering), count-over-max is untouched. Matches the
       worked example directly: Vehicle Master's own TP field at 6 shows
       no warning there (6 ≤ 7); a route configured at 8 TPs against that
       same 6-limit type warns at Design Creation, compared against the
       Master's 6, not a hardcoded 7.
  3. **Guidelines popup on a fresh Design Creation start.** New
     `showCreationGuidelines` flag, set whenever `go('creation')` fires
     from a different view or `goCreateMore()` runs (both are genuine
     "starting fresh" entry points — distinguished from the "resume to
     fix a specific SC" flows elsewhere, which set a specific
     `focusSC`/`fixReturnStep` and intentionally don't re-show this).
     Modal lists the six guideline lines verbatim, dismissible via "Got
     it" or the close icon, same visual pattern as the existing Push
     modal.
- **2026-07-10, fifth pass** — Ops Alignment tab, five requested fixes,
  plus a zone-filter request from a screenshot. Discussed the approach
  before building per the request; decisions below reflect what was
  agreed (inline over modal for both validation results and the
  Needs-Change diff view; TP reordering computed backend-only for now).
  1. **Zone filters mirrored from Design Review onto both Ops Alignment
     personas**, and **"Central" removed as a selectable option
     everywhere** (Design Inputs, Design Creation, Network Map, Design
     Review, the Add-SC form, and the Cycle Summary's zone breakdown).
     Deliberately left untouched: the underlying SC-zone seed data and
     Design Creation's SC-grouping array — removing "Central" there would
     have made real Central-zone SCs (Raipur, Jabalpur, Gwalior, etc.)
     disappear from selection entirely rather than just removing a
     filter chip, which reads as a bigger, riskier change than "remove
     the option."
  2. **Submit is now gated on validation, not always visible.** Root
     cause: `canSubmit: !planLocked` had zero relationship to validation
     state. Fixed so Submit stays available immediately when nothing's
     flagged, but requires the current proposed state to validate clean
     (zero errors, derived fresh each render off the same engine
     Validate uses — not a stateful "did they click Validate" flag)
     once anything is.
  3. **Validation results are now persistent and inline, not a 3.5s
     toast.** Every error/warning `computeHypotheticalPlan` produces is
     now tagged with the `routeCode` (and `dcCode` where relevant) it
     belongs to. Validate sets a flag that reveals: (a) a small dismissible
     summary next to the Validate button, and (b) the actual errors/
     warnings inline in each affected route's group header in the
     Details tab — both personas, same pattern.
  4. **Re-opening Needs Change on an already-flagged route shows what
     was actually proposed**, instead of a blank form (`openNc()`
     previously reset unconditionally). Also upgraded the Ops Lead's own
     Details tab to show the same original-struck-through → proposed
     diff style the Planner sees (it previously just silently displayed
     the overridden value with no visual distinction), with a per-field
     revert icon so a change can be undone directly inline, not only by
     reopening the modal. Available any time the plan isn't locked yet.
  5. **Touch points auto-reorder on move, computed in the recompute
     engine.** A DC's `tp` is now treated as insertion intent rather than
     a literal final label: routes sort DCs by (tp, then "the just-edited
     DC wins a tie" so an inserted node displaces whatever was already at
     that slot), then reassign a clean 1..N sequence over the result.
     This replaces the old "broken sequence" hard error entirely — there
     no longer is a broken-sequence state, since a valid order is always
     derived rather than demanded from raw input. Matches the Rt-2/Rt-4
     example directly. Live in-modal preview of the reordering was
     explicitly deferred; this is backend-only for now.
  6. **Split routes persist as dropdown options going forward.** The
     Route Code dropdown previously only listed `plan.rows` — a plan's
     committed routes — so a split created in one session (e.g. RT-02_A)
     never appeared for a different DC afterward. Now scans every route's
     current effective feedback (submitted + in-progress) for any
     routeCode not in `plan.rows` and offers those too, plan-wide, any
     session.
- **2026-07-10, sixth pass** — field-level decision granularity for the
  Planner, discussed before building. Three explicit refinements folded
  in per your follow-up.
  1. **DC-level decisions are now per field, not bundled per DC.**
     Route Code, Touch Point, Lat/Lng (decided together as one
     "position" — splitting them wouldn't be meaningful), and Distance
     each get their own independent Accept/Reject, right at that field's
     cell in the Details table. `alignDcDecisions` changed shape from
     `{ [dcCode]: 'Accept'|'Reject' }` to `{ [dcCode]: { [field]:
     'Accept'|'Reject' } }` — touched `decideDcRow`, `enrichedDcRows`,
     `changeList` (now pushes one entry per field instead of one bundled
     entry per DC), `effectiveFbForFinalise` (filters per field), the
     plan-level "all decided" rollup, and both `acceptRowChanges`
     (per-route accept-all) and `decideAllFlagged` (plan-wide accept-all)
     — the latter was still writing the old bundled shape and is now
     fixed to match.
  2. **Accept/Reject converted to tick/cross icon buttons** (small
     circular ✓/✕, colour-filled on the current decision) everywhere a
     decision is made — route-level vehicle change and all four per-field
     DC-level controls — replacing the old "Accept"/"Reject" text
     buttons, for the space reasons discussed.
  3. **Lat/Lng added as real columns** to all three Details tables
     (Design Review, Planner, Ops Lead) — previously absent even though
     it's an editable Ops Feedback field and appears in the reference
     plan-output sheet. Design Review's own synthetic demo data didn't
     generate lat/lng at all; added that too so the read-only reference
     table isn't missing a column its own header would've implied.
  4. **Distance recalculation confirmed to use the actually-decided
     state.** The recompute engine already always derives a system leg
     distance via haversine and flags >25% mismatches; the real fix here
     was upstream — `effectiveFbForFinalise`'s per-field rewrite means
     that once a planner accepts a Distance correction but rejects the
     paired Lat/Lng change (or vice versa), Validate's recalculation now
     correctly reflects exactly that decided combination, not the whole
     DC's raw proposal. No separate distance-specific code was needed;
     it falls out of the field-level fix.
  5. **New Finalise preview**, shown in the (now much larger) Finalise
     confirmation modal before commit: real metrics (Routes, Distance, SC
     CPS — current vs. what finalising will produce, both directions,
     colour-coded) and the actual derived route table (route code,
     vehicle, TP count, distance, volume, CPS, capacity — new/split
     routes flagged), computed from the exact same
     `computeHypotheticalPlan(plan, effectiveFbForFinalise(plan))` call
     `confirmFin()` itself uses — what's previewed is guaranteed to be
     what gets committed, not a separate approximation.
  - **Verification pass, same day**: re-checked the sixth pass end to
    end before calling it done, and caught two real leftovers:
    - The Finalise modal's "X accepted, Y rejected" summary was still
      counting only route-level (`alignDecisions`) decisions — a holdover
      from before the per-field rewrite — silently undercounting every
      DC-level field decision. Rebuilt it to tally across both
      `alignDecisions`/`alignFieldDec` (route-level) and
      `alignDcDecisions` (per DC, per field), matching what `changeList`
      itself counts as decided.
    - The Finalise preview showed metrics and the derived route table but
      no warnings — so a lingering distance-variance (or any other
      warning-level) issue on the structure about to be committed could
      go unseen at the one point it matters most. Added a warnings panel
      reading `computeHypotheticalPlan`'s own `warnings` array for the
      preview, shown directly in the modal.
- **2026-07-10, seventh pass** — the fully-inline per-field view (every
  route, every DC, every tick/cross icon visible at once) read as too
  light/cluttered in practice — icons got lost. Restructured into a
  summary-plus-popup pattern:
  1. **Amber summary bar** on any route with a change, in the Details
     table's route-group header — background now genuinely amber (not
     just italic text), with a quick description built by grouping that
     route's `changeList` by field type and counting affected DCs, e.g.
     "Vehicle Type · Route Code (2 DCs) · Distance (1 DC)", plus an X/Y
     decided count.
  2. **Accept All / Reject All at route level.** Found and fixed a real
     bug while extending the existing accept-all: it wrote `lat`/`lng` as
     two separate decision keys, but every read site (`enrichedDcRows`,
     `effectiveFbForFinalise`) expects one combined `latLng` key (lat/lng
     are decided together as one "position") — Accept All was silently
     failing to register position changes as decided. Replaced
     `acceptRowChanges` with a generalized `decideRouteChanges(...,
     decision)` used for both directions, fixed the key, kept the
     existing "fill undecided only, never clobber an explicit opposite
     decision" guard for both Accept All and Reject All.
  3. **Click-to-review popup.** The Details table's per-row inline
     diff+icons (the cluttered part) are gone — cells now just show the
     effective value with a subtle amber tint on changed ones. Clicking
     the route code (or a "Review changes" button, same action) opens a
     focused modal listing every route- and DC-level change for that one
     route with full tick/cross controls — reusing the exact same
     `changeList` entries the old inline view read, just relocated and
     scoped to one route at a time instead of all of them simultaneously.
- **2026-07-10, eighth pass** — two real bugs from the seventh pass, plus
  a column-removal request.
  1. **Bug: the Review Changes popup never rendered.** It had been
     inserted right before the Push Modal comment without checking what
     block that comment actually lives in — turned out to be inside
     Design Review's exclusive `isReview` block, which is never active
     while on the Ops Alignment screen. Moved it inside `isAlignPlanner`
     (next to the working Finalise modal, confirmed by line-number
     position relative to `isAlignPlanner`/`isAlignOps`'s boundaries)
     where it's actually reachable.
  2. **Bug: Accept All / Reject All silently did nothing.**
     `decideRouteChanges` (and, found by inspection, the older
     `decideAllFlagged` plan-wide accept-all) read the change data from
     raw `row.fb` / `r.fb` — the single seeded/submitted record — instead
     of `effectiveFbFor(plan)`, the merged, session-aware feedback that
     `enrichedDcRows`/`changeList` actually display and decide against.
     When the real proposed changes only existed in the merged view (a
     co-reviewer's submission, or an in-progress session edit), `row.fb`
     was empty, so the click computed against nothing — the button
     registered, `setState` fired, but there was nothing to decide.
     Fixed both functions to read the merged feedback.
  3. **Out Cutoff, TAT, and In Cutoff columns removed** from all three
     Details tables (Design Review, Planner, Ops Lead) — never editable,
     never decided on, pure clutter per the request. While removing them
     from Design Review's table, also fixed a pre-existing, unrelated bug
     found in passing: that table's header row's `grid-template-columns`
     only had 10 values for 12 header cells (a stale template predating
     the Lat/Lng columns being added), while the data row correctly had
     12 — headers and data were silently misaligned. Rebuilt both to
     match. Shrunk all three tables' `min-width` wrappers to fit the
     now-narrower column set.

- **2026-07-14** — two fixes reported after moving to the new repo/chat.
  1. **Favicon not showing (reported on Mac).** The filename actually matched
     (`favicon.svg` / `index.html` both correct — the historical
     `fevicon.svg` typo was already fixed before this repo). The real cause:
     a single SVG `<link rel="icon">` isn't enough cross-browser — Safari
     (desktop and iOS) does not render SVG favicons in the tab at all, and
     browsers request `/favicon.ico` directly on first load regardless of
     `<link>` tags. Fixed by generating a full icon set from the existing
     mark (navy rounded square, white "N") and wiring all of it into
     `index.html`: `favicon.ico` (multi-res 16/32/48, universal fallback —
     covers Safari), `favicon.svg` (kept, crisp upgrade for browsers that
     support it), `favicon-16.png` / `favicon-32.png` (explicit PNG
     fallback), `apple-touch-icon.png` (180×180, Safari bookmarks/iOS/macOS
     "Add to Dock"), `android-chrome-192.png` / `-512.png` +
     `site.webmanifest` (Android/Chrome home-screen). All `<link>` hrefs
     cache-busted with `?v=2` — favicons are cached very aggressively
     per-origin, so a same-URL swap can keep showing the old/missing icon
     until the query string changes or the cache is cleared. If it still
     doesn't show after pushing: hard-refresh, or open the page in a
     private/incognito window first to rule out a stale cached favicon.
  2. **Distance-variance warnings had no planner action.** The >25%
     entered-vs-calculated distance warning was real and correctly computed
     in `computeHypotheticalPlan`, but the banner showing it to the planner
     was pure text — no link to any decision, and it was computed from raw
     `effectiveFbFor(plan)` every render regardless of what the planner had
     already decided, so it would have kept showing forever even after a
     decision. Distance was already one of the four independently
     decidable per-DC fields (`decideDcRow(planId, idx, dcCode, 'distance',
     'Accept'|'Reject')`, feeding `effectiveFbForFinalise`) — the gap was
     that this specific banner wasn't wired to it. Fixed: each flagged DC
     in the banner now gets its own "Accept anyway" (keeps the entered
     distance, tags it "Accepted with warning") / "Revert to calculated"
     (drops the override — `userDistance` goes back to `null`, the engine
     falls back to the haversine leg, and the entry disappears from the
     list since there's no longer a mismatch) — both calling the same
     `decideDcRow` the rest of Details/Finalise already read, so nothing
     new to keep in sync. Actions are only live once Acknowledged (matches
     every other per-field decision in the app); pre-Acknowledge it's still
     shown read-only with a note that it becomes decidable after Acknowledge
     & Freeze. Does not block Finalise (still a warning, not an error) —
     same precedent as the other advisory warnings (util over/under, TP >7).

- **2026-07-14, second pass** — Ops Lead view was hardcoded to a single
  persona ("Rahul Sharma") everywhere: proposed-change attribution, the
  submission record, the co-reviewer roster/label, even the top-bar
  avatar. There was no way to actually simulate a second (or third)
  reviewer submitting feedback on the same plan — you could only ever be
  Rahul Sharma. Fixed:
  1. **Unified the reviewer-name pool.** The random seed loop had its own
     abbreviated pool (`'Rahul S.'`, `'Megha B.'`, ...) for
     `reviewerNames`/`proposedBy`, completely disjoint from the full-name
     hardcoded persona (`'Rahul Sharma'`) and from `NAMES` (the same
     full-name pool SC POCs already draw from). Replaced it with `NAMES`
     directly — one consistent name space everywhere, and it's now
     possible for the acting persona to genuinely be one of a plan's
     assigned reviewers on ordinary seeded plans, not just the two
     hand-built demo ones.
  2. **`opsPersonaName()`** — a real switchable "who am I acting as"
     concept (`st.opsActingPersona`, defaults to Rahul Sharma so nothing
     changes until you touch it). Replaced every hardcoded `'Rahul
     Sharma'` reference that represented "the current live actor" (change
     attribution, submission provenance, co-reviewer filtering, the
     top-bar avatar name/initials) with this — seed data / demo-plan
     literals that represent already-happened history were deliberately
     left alone.
  3. **"Acting as" switcher** in the top bar, next to "View as" (Ops Lead
     only). Lists the open plan's actual `reviewerNames` when a plan is
     selected (falls back to a general reviewer pool otherwise), and
     always pins the current persona into the list even if the open
     plan's roster doesn't include them. Switching clears that plan's
     not-yet-submitted draft (`opsRowFb`/`opsRowDec`/`opsTpOrder`) so an
     in-progress edit made as one reviewer can't get silently submitted
     under a different name — real submitted history
     (`plan.submittedReviewers`, `opsSubmitted[planId]`) is untouched.
     Now you can: open a plan as Rahul Sharma, propose a change, submit;
     switch to Megha Bose, propose something different, submit; open the
     planner view and see both reviewers' submissions/co-reviewer
     attribution show up correctly.

- **2026-07-14, third pass** — the change-flag taxonomy (Vehicle Change /
  DC Movement / Route Order Change / Distance Change / New Route·Split),
  plus two smaller fixes reported alongside it.
  1. **Flag taxonomy, computed once, used in three places.** Built off the
     exact same raw-submitted-feedback data the amber bar/Details view
     already reads (never a parallel computation) — a per-DC pass detects
     "departures" (this row's own DCs reassigned elsewhere), a second
     pass folds in "arrivals" (a DC landing on this route FROM another,
     which needs every row's data so it runs after the main map), and a
     dedicated submitted-only `computeHypotheticalPlan` call gives the
     real post-proposal distance to diff against `r.rtDist` for Distance
     Change (any non-zero difference counts, per instruction — no
     threshold). All 5 flags are independent (a route can carry all 5 at
     once, no mutual exclusivity, no "Multiple Changes" catch-all bucket).
     - **Amber bar (Planner, Details view):** all 5 as bubbles on the
       route-group header.
     - **Route View (both personas):** only Vehicle Change and New
       Route/Split — replaces the old ad-hoc "NEW" badge with the same
       bubble component so there's one rendering path, not two.
     - **Review Changes popup:** the flat change list is now grouped into
       the same named buckets (plus an "Other" bucket for lat/lng-only
       corrections and remark-only rows that don't fit one of the 5),
       same Accept/Reject controls, just organised.
  2. **Acknowledge & Freeze reviewer-status wording** — re-confirmed the
     honest per-reviewer tracking from the previous pass is still intact
     (it is — `confirmAck()` never touches `submittedReviewers`), and
     renamed the pending-reviewer label from "Awaiting" to "Not-Submitted"
     to match the exact wording asked for.
  3. **Removed the two canned Ops-feedback remarks that referenced
     cutoff/TAT** ("Out-cutoff too tight for NLH landing", "TAT not
     achievable during monsoon") from the seed data's random remark pool —
     these fields were already removed from every Details table, so a
     remark citing them was pure leftover clutter. Replaced with two
     remarks that reference fields that actually still exist. The
     `outCutoff`/`breakdownTat` fields themselves stay in the data model
     (still carried forward for internal use, e.g. the Finalise-preview
     TAT fallback) — only the user-facing feedback text was in scope here.
- **2026-07-15** — Design Review L4 layout, plus a batch of Ops Alignment ·
  Planner fixes, discussed and scoped before building.
  1. **Design Review L4 now matches Ops Alignment's layout exactly**:
     output metrics and the validation-flags panel were hoisted out of the
     Plan Detail tab to sit right under the tab bar, always visible
     regardless of which tab is active (Plan Detail or Route View) — same
     "tabs → metrics → warnings → tab-gated content" stacking `aSel`/`oSel`
     already used. Inputs strip and vehicles-by-type stay inside Plan
     Detail (Ops Alignment has no equivalent of these, so there was
     nothing to mirror there).
  2. **Reviewer attribution tag on every proposed change** (Planner side):
     `changeList` entries already carried the data (`fb.by`, surfaced as
     `propBy`) but never rendered it. Added a small name tag next to each
     entry in the Review Changes popup, and one on the route-group header's
     change summary.
  3. **Distance-variance (>25% entered vs. calculated) moved into the
     route's own feedback stage.** The old plan-wide banner had its own
     bespoke "Accept anyway / Revert to calculated" buttons; that decision
     was always just the ordinary per-DC Distance field's Accept/Reject
     under a different name (`decideDcRow(..., 'distance', ...)` either
     way). Removed the special buttons — a flagged DC's Distance entry in
     Review Changes now just carries a small ⚠ variance note alongside its
     normal tick/cross, and the flat Details table shows a ⚠ next to the
     value. The plan-wide banner still exists but is now pure information
     (errors/warnings only, no action controls) and only lists what's
     still unresolved — once decided at the route level, it drops off the
     banner automatically.
  4. **Finalised plans no longer show a clickable "Review changes"
     trigger.** `onOpenReview` was wired unconditionally on every route's
     code in the Details table, including Finalised ones (where `fb` is
     already null and there's nothing to review — it would just open an
     empty popup). Route code now renders as plain text once `aSel.isFinal`.
  5. **Unfreeze** — new Planner-only action reversing Acknowledge & Freeze.
     Available on the Received-tab card and inside the plan's L4 detail,
     only once a plan is `Acknowledged`. Guarded by its own confirm dialog
     (warns that decisions reset). `confirmUnfreeze()` reverts status to
     `In Alignment` — **not** back to `Pushed`/"Pending": that status is
     one the Planner's own row-computation deliberately blinds itself to
     (built to stop seeded co-reviewer demo data leaking pre-submission),
     so reusing it here would have hidden real, already-submitted feedback
     from the Planner until Ops resubmitted — the opposite of the ask.
     `In Alignment` is the status that already means "Ops can edit,
     feedback stays visible, nothing decided yet," which is exactly what
     Unfreeze needs. Only the Planner's own `alignDecisions` /
     `alignDcDecisions` / `alignFieldDec` entries for that plan are
     cleared; `plan.rows[i].fb` and `plan.submittedReviewers` are
     untouched. See the updated Domain-glossary "Acknowledge" entry — this
     is a real reversal of what was previously documented as an
     irreversible action, by explicit product decision.
     - **Found and fixed a real bug while wiring this up**: the Ops Lead's
       own "Submitted" vs "To Review" status (`opsStatusOf` in `opsVals()`)
       was reading a single plan-level `opsSubmitted[planId]` flag —
       whoever submitted first — instead of checking whether *this acting
       persona* had submitted. Under the Acting-persona switcher (added
       2026-07-14), this meant every reviewer saw the same "Submitted"
       state regardless of whether they personally had submitted.
       Necessary for Unfreeze to correctly show each Ops Lead their own
       real state afterward, but fixes the general multi-reviewer case
       too. Switched every read (the rail list, the selected-plan view,
       the "plan stays visible" filter, and the Command Center stage-rail
       counts) to check `plan.submittedReviewers` for the current
       `opsPersonaName()` instead.
  6. **Finalise preview is now a full-screen page, not a modal.** Clicking
     "Finalise plan" (once eligible) opens the same full-screen overlay
     chrome used everywhere else in this app, with a top bar titled
     "Finalise this plan?" that doubles as the confirmation step itself —
     Confirm commits (`confirmFin()`), Back/Cancel returns to the
     Acknowledged detail with nothing committed; no second nested "are you
     sure" on top of it. Body shows the same always-visible
     metrics-then-warnings pattern, then real Plan Detail (flat DC × Route
     table) / Route View (per-route pivot, touch-point reorder ripple
     inline) tabs — built from the exact same pseudo-row construction
     `confirmFin()` itself commits into `plan.rows`, so what's previewed
     here is byte-for-byte what Finalise will produce, not a separate
     approximation.
- **2026-07-15 (second pass)** — Ops Alignment · Ops Lead fixes, plus two
  cross-cutting bugs found while building them.
  1. **Eye icon landed on a blank screen** — root cause: `opsSection`
     initialised to `'summary'`, a value left over from before the tabs
     were renamed to "Plan Detail"/"Route View" (2026-07-08). It matched
     neither `'details'` nor `'route'`, so the content area rendered
     nothing until a tab was clicked. Default is now `'details'`.
  2. **REVIEW column now shows the reviewer's name** instead of the
     generic "Feedback pending" text, so a plan with more than one
     reviewer shows who proposed what. Falls back to the acting persona
     for an in-progress (not-yet-submitted) edit of your own.
  3. **Auto TP-reorder ripple is now visible before Finalise** — scoped
     exception to "no live reordering during review": when a DC leaves or
     joins a route, the OTHER DCs left behind get silently renumbered by
     the recompute engine, but that ripple was never shown until Finalise
     actually committed it. Built a `routeCode -> {dcCode: newTp}` lookup
     from the same hypothetical each view already computes (Ops Lead:
     `opsHypTop`, submitted + in-progress; Planner: `flagsHyp`,
     submitted-only, matching how the rest of that row loop already reads
     data) and render it as a strikethrough old-TP -> new-TP, same visual
     language as an explicit edit but in blue rather than amber to signal
     "consequence of another change, not something to accept/reject on
     its own." Display-only — doesn't reorder rows, touch distances, or
     mutate anything early. Built for both Planner and Ops Lead.
  4. **Mandatory + reset TP for a DC moving into a new/pending route.**
     Previously the TP input's placeholder always showed the DC's OLD
     touch-point as a fallback, and it was never required — so moving a
     second DC into an already-pending split route (e.g. DC24 into
     RT-02_A, which DC1 split off into earlier) gave no signal that its
     position in that new route was undecided. Rule: whenever a DC's
     target Route Code is **not yet a committed row in `plan.rows`** —
     covers both a fresh split via the "Split this route" sentinel AND
     selecting an already-pending split code created by an earlier DC's
     proposal — its TP is cleared (no carried-over placeholder) and
     required to submit. Moving into an existing, already-committed route
     is unaffected. `setNcDcRouteCode()` now clears the DC's `tp` in the
     same state update as the route-code change (avoided a two-setState
     race that could otherwise clobber the just-set route code with stale
     `ncDcCells`).
  5. **Needs Change view shows the destination route at a glance** — a
     DC's collapsed row header previously only showed its ORIGINAL
     lat/lng/TP/leg; you had to expand it and check the Route Code
     dropdown to see where a move was headed. Added a small tag next to
     the DC name ("Moving to RT-05" / "Split \u2192 RT-02-A") whenever a
     route-code change is proposed, visible without expanding.
  6. **The screen-jump bug** (Planner and Ops Lead both) — an action like
     Submit, Acknowledge, or Finalise changes a plan's status without the
     user switching tabs. On the very next render, the "is my open plan
     still in view" check was matching against the *tab-filtered* list
     (`listPlans` / `filteredAssigned`), and a plan that just moved to a
     different status tab no longer appeared there — so the code silently
     fell back to "the first plan in the current filter," landing the
     user on an unrelated plan. Fixed by checking membership against the
     full plan set instead (`plans` for the Planner, `assigned` for Ops
     Lead) — the detail view now survives a status change and only resets
     when the user actually navigates (clicking a filter tab or zone chip
     already explicitly clears `alignPlanId`/`opsPlanId`, untouched by
     this fix). The list itself was never the problem — it already
     recomputes from live status every render, so once the user does
     navigate, the plan correctly shows up wherever it now belongs.
- **2026-07-16** — L4 detail page restructured to a unified 4-section
  order across all three views (Design Review, Ops Alignment · Planner,
  Ops Alignment · Ops Lead), plus four follow-up gaps and a Simulate
  enhancement, all discussed and scoped before building.
  1. **Unified L4 structure**: every plan/run detail page now reads, top
     to bottom, **Plan Inputs** (SC details + vehicles used) → **Plan
     Outputs** (metric views) → **Validation Flags** → **Plan Details**
     (tabs: "Plan Details" / "Route View", now gating only the two actual
     tables — no more nested inner toggle on the Design Review side, which
     used to bury the DC × Route table one level deeper than Route View).
     - Design Review: inputs strip + "Vehicles by type" (renamed "Vehicles
       used") hoisted out of the old Plan Detail tab to the new Plan
       Inputs section; the old outer "Route View" tab's nested Detail
       View/Route View toggle is now flattened into the two outer tabs
       directly.
     - Ops Alignment (Planner + Ops Lead): Plan Inputs is genuinely new —
       neither view had an equivalent section before. Nodes/volume/SC
       coordinates are derived from `plan.rows` (there's no stored
       "input" on an Ops Alignment plan the way Design Review's `run`
       object has one). Vehicle mix is tallied straight off `plan.rows`,
       **never** merged with in-progress/proposed feedback — a deliberate
       product decision (see this session's Q1): this makes it read as
       the *original* plan pre-Finalise and the *final, aligned* mix
       post-Finalise automatically, since `plan.rows` only changes at the
       moment `confirmFin()` commits, with zero extra "which state to
       show" branching needed. Ops Lead's existing "Vehicle Mix Across
       Routes" panel (previously living inside the Route View tab) was
       hoisted up into Plan Inputs, not duplicated.
     - Validation Flags groups structural errors/warnings (from the same
       `computeHypotheticalPlan` result each view already reads — filtered
       to exclude the dcCode-tagged distance-variance ones, which keep
       their own dedicated banner with route-scoped decision context) with
       the distance-variance notice and the submission-gap reminder.
       Lifecycle status messaging (Pending/Acknowledged-locked/Finalised
       banners) deliberately stays near the top bar rather than folding
       into this section — see this session's Q2.
     - Tab label renamed "Plan Detail" → "Plan Details" everywhere
       (Design Review, Planner, Ops Lead, and the Finalise-preview
       screen), matching the exact wording asked for.
  2. **Finalised plans were still showing Review Changes / accepted-
     rejected feedback / reviewer tags.** Root cause: the 7 seed plans
     built straight into `Finalised` status never passed through
     `confirmFin()` — they kept whatever random Needs-Change/`fb`/
     `proposedBy` the generic seeded-journey logic assigned on the way
     there, since only `confirmFin()` itself ever nulls that data. A
     *real* Finalised plan (reached via the actual Acknowledge → Finalise
     flow) was already clean; only the seeded demo ones weren't. Fixed the
     seed builder to reset `ops`/`fb`/`proposedBy` to exactly what
     `confirmFin()` produces for any row seeded straight into Finalised,
     and added belt-and-suspenders guards on both the Planner
     (`needsAttn` now explicitly excludes Finalised) and Ops Lead (per-DC
     change detection short-circuits to "no feedback" when Finalised) so
     this class of bug can't resurface even if seed data drifts again.
     This same fix is what makes Ops Lead's Finalised view "clean, no
     tags, no flags" — it was the identical root cause, not a second bug.
  3. **Finalise-preview Route View tab was showing diff artifacts** (the
     "NEW" route badge and the touch-point reorder breakdown) even though
     the whole point of this screen is to preview the *clean, final*
     structure. Removed both — Route View here now shows only the plain
     final table (route code, vehicle, TPs, dist, volume, cps, cap),
     matching the "clean version of the finalised plan" principle behind
     fix #2 above.
  4. **TP auto-reorder tie-break was direction-blind.** In
     `computeHypotheticalPlan`'s route sort, a moved DC always won a tie
     at its target TP against whatever was already sitting there — correct
     when moving to an EARLIER position (insert-before: resident shifts
     forward), wrong when moving LATER (should insert-after: only the
     resident at-and-before the target shifts back, and the mover lands
     cleanly on the target slot — real remove-then-insert list semantics).
     Concretely: moving a DC from TP3 to TP6 in a 7-node route used to
     produce TP4→3, TP5→4, mover→5, TP6→6 (mover jumping in front of the
     TP6 occupant); it now produces TP4→3, TP5→4, TP6→5, mover→6 — matches
     the reported expectation exactly, verified against both this case and
     the pre-existing "moving earlier" case (TP5→TP2), which still works
     unchanged. Direction is determined per-DC by comparing its own
     original TP (within its original route) against its target TP — only
     applies to same-route moves; cross-route arrivals keep their existing
     tie-break behavior, which wasn't reported as broken.
  5. **Simulate impact now shows a vehicle-mix comparison** (original vs.
     suggested), alongside its existing plan-level metrics comparison, on
     both the Planner and Ops Lead sides — per this session's Q1: Plan
     Inputs itself stays single-state (always `plan.rows`, never dual),
     and the "show me both" behavior lives specifically in Simulate, where
     an original-vs-hypothetical comparison already exists for other
     metrics.

- **2026-07-17** — Ops Alignment rail: Planner now has a real 4th stage,
  plus a shared filter-segment style across both personas. Discussed and
  scoped before building.
  1. **Planner rail split into 4 stages** (`Pending Feedback` /
     `Feedback Received` / `Acknowledged` / `Finalised`), matching the Ops
     Lead's own 4-stage rail (`To Review` / `Submitted` / `Acknowledged` /
     `Finalised`) that already existed. Previously `Feedback Received` was
     a catch-all special-cased to match both `In Alignment` AND
     `Acknowledged` status (`FILTERS` only had 3 entries) — the plan
     status model itself already had all 4 real values (`Pushed` →
     `In Alignment` → `Acknowledged` → `Finalised`); this was purely
     narrowing `Feedback Received` back to `In Alignment` only and giving
     `Acknowledged` its own tab, in `FILTERS`/`fmap`/`PSEG`/`segCount`/
     `listPlans` — no change to the underlying status transitions,
     `confirmAck()`, or Unfreeze.
  2. **Ops Lead's filter rail restyled to match the Planner's shared-track
     segmented-control look** — a single light-grey (`#F2F5FA`) track
     container holding `flex:1` buttons, transparent when inactive, solid
     navy (`#003F98`) block on the active one — replacing the older
     free-floating pill-per-segment style (each its own grey pill,
     `flex-wrap`, no shared track). Both rails are now visually identical;
     with the Planner's new 4th segment they line up 1:1.
