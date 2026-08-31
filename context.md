# context.md — Network Design Central (RLH Design Central), v3.0

This file is the one place to read before changing anything — either
yourself, or by pasting this whole file to an AI assistant along with your
question. It covers: what this project is, how the 4 files fit together,
how to view it, and what to know before editing.

---

## The 4 files

| File | What it is | Do you edit it? |
|---|---|---|
| `v3.0-rlh-design-base.jsx` | Nearly all the app's code — UI + logic | **Yes** — this is the one you change most often |
| `engine.js` | The multi-leg master-data engine (Class A/B/D/F field model) — split out of the jsx file (later session) since it's pure JS with no JSX in it | Yes, but rarer — only when the underlying data model changes |
| `index.html` | Loads React, the Babel compiler, `engine.js`, and the jsx file into a browser page, in that order | Rarely — only if you need to change fonts/CDN/page title/script order |
| `context.md` | This file | Update the changelog at the bottom when you make notable changes |

That's it. No build step, no `npm install`, nothing to compile ahead of
time. `engine.js` is loaded as a plain script (needs no compiling — it's
already plain JS); `index.html` then reads `v3.0-rlh-design-base.jsx` fresh
every time the page loads, compiles it with Babel, and turns it into a
working app right there in the browser. Classic (non-module) `<script>`
tags on one page share a single global scope, so `engine.js`'s functions
are available to the jsx file exactly as if they were still in the same
file — no import, no `this.`, no namespace, same bare calls as before.

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

## For whoever (or whatever AI) edits `v3.0-rlh-design-base.jsx` next

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

### `engine.js` — the multi-leg master-data engine (separate file, later session)
Was originally a self-contained block at the top of the jsx file, directly
above `class NDCApp`; split into its own file since it's pure JS with zero
JSX/React/`with(B)` coupling — nothing in it needs Babel's transform.
`index.html` loads it as a plain `<script src="engine.js">` before the jsx
file is fetched/compiled/eval'd, and classic `<script>` tags on one page
share a single global scope, so every function/const it declares
(`monthIsPast`, `setClassDField`, `resolveExistence`, `seedRLHMasterData`,
etc.) is available to `class NDCApp`'s methods exactly as before the split —
same bare-identifier calls, no `this.`, no import. See its own header
comment for the verification that was run before splitting it out (zero
name collisions with the rest of the app; every identifier it declares is
referenced from somewhere, either in `class NDCApp`/`View()` or by another
engine function). Edit it the same way you'd edit any part of the old
inline block — just in its own file now.

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
- **2026-08-03** — Session covering four areas: Route Scheduler's Design
  Review/Ops Alignment rebuilt for structural parity with Route Planner,
  a Slot-Wise Dispatch metric replacing an aggregate Dock Utilisation
  figure, a real per-plan (not per-SC) push-status bug fixed on both
  RLH and Route Scheduler, and a zone-filter/status-filter consistency
  pass across the whole app.
  1. **Route Scheduler's Design Review rebuilt to match Route Planner
     1:1** (previously flat: one rail row per `schedulerPlans` record,
     no SC grouping, no full-screen detail, navy Push/Finalise buttons
     despite the app's own teal-for-Scheduler design-system rule). Rail
     now groups **by SC** (`schedReviewList`, one row per SC, "N runs"
     subtitle), mirroring `reviewList`'s shape — this matters because an
     SC *can* have more than one Route Scheduler run (re-triggered later),
     and the old flat rail would have shown that as two disconnected rows
     for the same SC rather than one grouped entry. Main pane gained an
     SC header card + one card per run (`schedRunCards`, via
     `buildSchedCard`) with identity/HW-HTF tag, download + expand icons,
     an inputs strip, a colored metrics grid, a flag chip, and Push/
     Finalise actions — plus a full-screen detail overlay
     (`reviewSchedDetail`) with Cutoff Plan Inputs/Outputs/Validation
     Flags sections, all in teal (`#0D7377`), fixing the stray navy
     buttons along the way. Verified in jsdom by injecting a genuine
     second run onto one SC and confirming it collapses into one rail
     row ("2 runs") with 2 cards, not two duplicate rows.
  2. **Ops Alignment's Cutoff Plan card rebuilt to mirror Route Planner's
     actual L3 card** — breadcrumb, identity header (SC coords + "Route
     Scheduler" module tag + status badge), reviewer chips (`opsLeads`,
     same shape as RLH's — added `reviewerNames`/`submittedReviewers`
     read-through to `buildSchedCard`), a download icon, and status-aware
     lifecycle banners (awaiting / acknowledged / finalised / finalised-
     without-alignment). Applied identically to both the Planner-persona
     and Ops Lead-persona copies of this block. Still deliberately
     read-only/list-level — no Needs-Change/Accept-Reject mechanics added;
     that scope cut from the prior session stands.
  3. **New metric: Slot-Wise Dispatch + Dock Utilisation**, added to
     `computeSchedulerMetricsFor`. Per-slot: groups every route into its
     30-min dispatch slot and shows `HH:MM · used/docks · pct%` — the
     point being that a single network-wide utilisation average can't
     distinguish honest tail-end slack (finite volume, nothing wrong)
     from a genuinely idle early slot while a later one is full; the
     per-slot list is what lets a reviewer actually see which shape
     they're looking at. Went through two iterations: first added an
     aggregate "Dock Utilisation" tile (`routes / (slots × docks)`)
     alongside the slot list; second pass removed that aggregate tile
     per product feedback and moved the percentage inline onto each slot
     chip instead, and also removed the now-redundant Connection Start
     Time / Connection Slots tiles everywhere (that info is implicit in
     the slot list's first entry / entry count). Verified against real
     seed data: slot-used sum matches total routes, and a manual
     recompute of the utilisation formula matches the function's output
     exactly.
  4. **Fixed: push/finalise status was tracked per-SC, not per-plan** —
     on both RLH and Route Scheduler. An SC can have multiple runs (RLH)
     or, over time, multiple scheduler runs, but only ever one thing is
     actually "the pushed one" at a time; the old code stamped a blanket
     per-SC flag (`pushedSCs[code]`) onto *every* run card for that SC,
     so all of an SC's run cards showed the same "Pushed" tag even when
     only one run's data had actually been promoted. Fixed by having
     `doPush()` record `sourceRunId` on the RLH plan object (which run is
     currently the promoted one) and `planCards` matching each run
     against it — only the actually-chosen run's card gets a status tag
     now. Verified against SC DELS (5 completed runs): pushing one run
     tags only that run's card; the other 4 stay untagged.
     - Also removed the SC-level "Pushed to alignment" header badge in
       both Design Review modes (RLH and Scheduler) for the same reason —
       misleading at SC granularity once multiple runs/plans are possible.
     - Also added: a plan/run Finalised via **Finalise Directly** is now
       tracked distinctly (`finalisedDirect` flag, set in `doPush()` and
       `doSchedPush()`) from one that went through the full alignment
       loop — the card reads **"Pushed Without Alignment"** (violet)
       instead of a plain green "Finalised" that would wrongly imply Ops
       actually reviewed it. Applies to both RLH and Route Scheduler.
     - Also changed: "Finalise Directly" now stays available at every
       non-terminal status ("retain push directly irrespective" — it used
       to disappear for Route Scheduler runs the moment they left Draft).
       "Push to Alignment" still only makes sense pre-push, so that one
       stays Draft-only.
  5. **Zone-filter gap: "Central" was missing from 7 of 9 zone-chip
     lists app-wide**, not just the two screens flagged. `Central` is a
     genuine zone in the seed data (`Z` array) with 7 real SCs (JLRS,
     GWLS, PABS, UJNS, PAB2, UJN2, RPRS) — all reachable via "All" but
     with no dedicated chip anywhere except Route Scheduler's Design
     Review (already correct from the prior session). The hardcoded
     4-zone literal (`['North','South','East','West']`) had been
     copy-pasted into Design Inputs' zone filter, SC Master's filter
     dropdown, Design Creation, RLH Ops Alignment (both personas), the
     Network Map, and RLH Design Review. Fixed all 7 rather than just
     the two screenshotted, since it was the identical bug everywhere.
     Verified programmatically post-fix (chip presence checked across
     all the above, not just eyeballed).
  6. **Ops Alignment's 4-stage status filter restyled from a cramped
     1-row-of-4 strip to a 2×2 icon grid** (Pending Feedback + Received
     Feedback on top, Acknowledged + Finalised below) — the old
     `flex:1` strip forced every label through `text-overflow:ellipsis`
     ("Pendin...", "Receive...", "Acknow...", "Finalise..."). Each stage
     now carries a small icon (clock / inbox / lock / checkmark — reusing
     shapes already established elsewhere in the app, not new
     iconography) so labels never truncate regardless of rail width.
     Applied identically to all 4 places this filter exists — RLH
     Planner, RLH Ops Lead, and both persona copies of Route Scheduler's
     Ops Alignment — navy for RLH, teal for Scheduler, matching the
     existing branding split. RLH's two personas keep their own existing
     label wording (`Pending Feedback`/`Feedback Received` for the
     Planner vs. `To Review`/`Submitted` for Ops Lead) — that asymmetry
     predates this session and wasn't flagged as a problem, only the
     layout/truncation was.
  - Companion docs (`01_Complete_Context.md`, `02_Logics_and_Formulae.md`,
    `03_Validation_Rules.md`, `04_Rule_Engine.md`, `05_Core_Flows.md`,
    `PROJECT_CONTEXT.md`) have **not** been updated to reflect any of the
    above yet — flagged to the user twice this session, still open.
- **2026-08-04** —
  1. **Route Scheduler Operating Mode: RLH Docks / Local Speed / Non-Local
     Speed removed from the overall-defaults tier.** These are SC-level
     physical facts, not plan-level scheduling choices — the "set for
     everyone selected" cards for these three were removed from Step 3;
     the per-SC override table (unchanged) is now the *only* way to move
     them away from the SC's own default. HW/HTF/D0 Cutoff stayed as
     overall defaults since they genuinely are plan-level choices.
  2. **"Central" zone corrected — it was a data error, not a real zone,
     reversing the 2026-08-03 entry above.** Re-verifying against the
     actual `.jsx` (not the last summary) turned up the tell: a DC
     migration entry (`IDRS→BHOS`, i.e. Indore→Bhopal — both objectively
     West-zone cities) had been mislabeled `zone: 'Central'`. The business
     has four zones — North/South/East/West. Fixed by reassigning the 5
     SCs (Gwalior, Ujjain → West, alongside Indore/Bhopal already there;
     Raipur, Jabalpur, Bilaspur → East) and stripping `'Central'` from all
     10 zone-chip/filter arrays app-wide (the 7 from 08-03, plus Route
     Scheduler's own 3). If `'Central'` turns up anywhere again, it's
     stale data or a stale export, not a reintroduced requirement.
  3. **Slot-Wise Dispatch converted from inline pill-chips to a dropdown**
     (`<details>/<summary>`, one slot per row: time · docks used · pct%)
     in Design Review's card, its full detail overlay, and (once built
     later this session) Ops Alignment's detail overlay.
  4. **Ops Alignment's Route Scheduler rail rebuilt to group by SC**,
     matching Route Planner's own Ops Alignment rail — was a flat list of
     individual runs with no zone filter and a literal "Cutoff Plans"
     header (both removed); now has zone-chip filtering and an "N SCs"
     count label.
  5. **Ops Alignment's card unified with Design Review's card** — both
     now render through the exact same `buildSchedCard()` output and JSX
     template (verdict pill, inputs strip, 3-tile metric grid, Slot-Wise
     Dispatch dropdown); Ops Alignment's copy just drops the Push/
     Finalise-Direct buttons (read-only there) and adds reviewer chips +
     a lifecycle status line in their place.
  - **New: Plan Details / Route View / Dock Schedule**, a three-tab
    detail view behind Route Scheduler's "view detail," in both Design
    Review's overlay and a new matching overlay in Ops Alignment (shared,
    not duplicated per persona, since it's read-only either way). Built
    from the `_Template__Route_Scheduler_Plan_Output_.xlsx` DS Output
    template, with a handful of ambiguities resolved via direct Q&A
    before building (documented inline). New shared helper
    `schedulerRouteDcInfo()` factors the per-route/per-DC synthesis out of
    `computeSchedulerMetricsFor()` — **hold time is now drawn per-DC, not
    once per route** (it happens at the destination LMDC while it
    unloads, so it has no bearing on dispatch and genuinely varies stop-
    to-stop; a route's hold time is just the sum of its DCs'). Dock
    Schedule assigns routes sequentially (Dock-1, Dock-2… round-robin
    *within* each dispatch slot) — confirmed with the user that vehicle-
    to-dock assignment isn't DS-driven and "not as important." A mock was
    built first via the Visualizer tool and approved before the real
    build. `round_trip_tat` is shown as `—` deliberately — the real
    formula (travel + hold + service time per DC + return leg) isn't
    defined yet; don't invent a number for it.
  - `buildSchedCard()`'s `onOpenReviewDetail`/`onOpenAlignDetail` handlers
    are now always present regardless of `includeActions` — viewing
    detail is a read action, unlike Push/Finalise-Direct.
  - Companion docs (`01_Complete_Context.md`, `02_Logics_and_Formulae.md`,
    `03_Validation_Rules.md`, `04_Rule_Engine.md`, `05_Core_Flows.md`,
    `PROJECT_CONTEXT.md`) regenerated to catch up on **both** this session
    and the 2026-08-03 session above (which had never been written up in
    them at all).

- **2026-08-05** —
  1. **SC Master split into Core Node Data vs. RLH-Specific Data**, after
     discussing three layout options (sub-tabs / toggle-to-expand-columns
     / always-visible grouped headers) — picked toggle-to-expand. First
     built as a single toolbar toggle button; per follow-up feedback,
     rebuilt as **inline horizontal `+`/`−` expander cells in the header
     row itself** (one for RLH columns, a second independent one for NLH
     columns, both positioned just before Ops Leads) — a mock was shown
     via the Visualizer tool and approved before building either version.
     NLH Docks got its own expander rather than being folded into RLH,
     since it isn't an RLH parameter — just one field for now, reserved
     for whenever NLH gets its own module. The Add/Edit SC modal mirrors
     the same three-section split (Core / RLH-Specific / NLH-Specific),
     reusing the existing precedent of a labeled Contacts section.
  2. **Fixed a real persistence bug found while building the above**: RLH
     Docks, NLH Docks, Local/Non-Local TP Limit, and Open/Close were
     cosmetic-only — the Add/Edit SC form had inputs for them, but the
     table (and Route Scheduler's own `resolveSchedulerParamsFor`) always
     regenerated a synthetic value and silently ignored whatever was
     typed; only Local/Non-Local Speed actually persisted. Added
     `resolveScFields(sc)` as the single source of truth (persisted
     value if set, else the same deterministic synthetic default),
     used by the table, the Edit-SC prefill, and
     `resolveSchedulerParamsFor()` alike so the three can never show three
     different numbers for the same SC again.
  3. **Added editable Latitude/Longitude to SC Master** (Core section) —
     these aren't decorative: `computeHypotheticalPlan()` (RLH's own Ops-
     feedback recompute engine) already uses a SC's real `lat`/`lng` in
     genuine haversine distance calculations, so editing them changes
     computed round-trip distances for plans that get revalidated. Softly
     validated against India's rough bounding box (warns, doesn't block).
  4. **Built LMDC Master (v1)** under Node & Vehicle Master — a new
     sub-tab listing every LMDC across the network (thousands of rows,
     generated once at seed time), core fields read-only (Code, Location,
     Capacity, LMSC Active Status), 5 fields editable inline (Open/Close,
     D0 Cutoff, Max Vehicle Size, Unloading Time) with a working CSV
     download/upload (the first genuinely functional file-upload/parse
     flow in the app — every other "Upload CSV" button elsewhere was a
     stub). This version derived the DC list's identity from codes
     already used inside existing routes — turned out to be backwards;
     corrected on 08-08 below.

- **2026-08-06 / 2026-08-07** —
  1. **LMDC Master's 4 editable fields converted to fixed dropdown
     options**, following discussion: Open/Close → 30-min grid, default
     05:00/21:00 (was free time input, default 06:00/22:00). D0 Cutoff →
     `Default` sentinel + the same 09:00–12:00 range Route Scheduler's own
     Operating Mode offered at the time (widened again on 08-09 below).
     Unloading Time → 15–60 in steps of 5, default 15 (was a random
     10–30min synthetic spread). Max Vehicle Size → restricted to
     RLH-feasible Vehicle Master types only, defaulting to the largest by
     capacity (22ft/LCV, 8,000 — the 14ft and 32ft trailers are NLH-only).
  2. **Rule 5 — LMDC-level D0 Cutoff override wins outright over the
     SC-level value for that one DC**, confirmed via a worked example
     (SXV2 at 10:00 SC-level, two DCs explicitly set to 09:00/11:00 keep
     their own values; the other ~98 inherit 10:00) — no min/max
     clamping, despite the rule's own wording initially suggesting
     "minimum." Wired into `schedulerRouteDcInfo()`'s D0 Landing % check
     via a new `resolveDcCutoffMin()` lookup against LMDC Master.
  3. **CSV upload validation added** for all 4 now-fixed-option fields —
     an uploaded value that doesn't match a valid option flags the whole
     row (nothing from it applied), shown in a dismissible banner with
     row number/code/reason, capped at 20 with a "+N more" tail. Mirrors
     the existing volume-file uploader's own error-row convention rather
     than inventing a new pattern.

- **2026-08-08** —
  - **Root-cause fix to LMDC Master's identity model.** Working through
    how Route Scheduler should actually consume LMDC data surfaced that
    the whole approach had been backwards: LMDC Master should be an
    independent source (AutoDML's full active-node set + Node Additions,
    same code format AutoDML already natively uses — `cityCode-N`, no
    special-casing needed for Migrations since they're LMSC-mapping
    changes, not node-parameter changes) — and it's **Route Planner's own
    route generation** that should draw its DC codes from that shared
    pool, not the other way around. Previously routes drew independent
    random codes (`cityCode` + random 3-digit, no hyphen) while AutoDML/
    LMDC Master used a different numbering scheme entirely, so the two
    could never actually refer to the same DC — meaning a per-DC match
    (like Rule 5's override) could only ever fire on coincidence.
  - **Seeded one canonical DC pool per SC** in `buildSeed()`, *before* any
    plan/route generation — `dcPoolBySC`, deterministically shuffled with
    a running per-SC pointer (`nextPoolDcCode()`) so routes draw a real,
    non-repeating subset instead of inventing new codes.
  - **Node Inputs' AutoDML tab is now a genuine filtered view of this
    pool** (`autodmlDetails` derives from `linkStatus` flags on real pool
    DCs), not a disconnected hand-authored list — same fixed 14 inactive /
    6 zero-capacity / 9 multi-mapped counts as before, now backed by real
    data instead of arbitrary strings.
  - **LMDC Master rebuilt from the same pool** + mapped Node Additions
    (unmapped Additions still show up, LMSC column reads "Pending,"
    excluded from any SC's route-generation pool until actually mapped).
    Closures and Migrations excluded — confirmed with the user that
    LMDC-level parameters are node properties, independent of which LMSC
    a DC is currently tagged to.
  - **Preview & Trigger restructured: rows are now per selected *plan*,
    never unioned at the SC level** — if two plans of the same SC were
    both checked in Step 1, they show as two fully independent rows,
    matching that Route Scheduler triggers one `schedulerPlans` row per
    plan, not per SC. Each row expands to show that specific plan's real
    DC list (matched against LMDC Master by code — reliably now, since
    routes and LMDC Master finally share the same identity), flagging
    "Customized" DCs (any LMDC Master override present) with a tooltip
    listing which fields — no new blocking logic added anywhere.

- **2026-08-09 / 2026-08-10** —
  1. **HTP removed entirely** from SC Master — no longer a modeled
     parameter anywhere in the app.
  2. **HTF removed entirely from Route Scheduler** (~18 touch points:
     Operating Mode's card/table, all 3 card badges, both detail
     overlays, CSV exports, seed generation, `resolveSchedulerParamsFor`,
     and the hold-time formula itself) — **replaced with Hold Time On/Off
     + Max Hold Time (Local) + Max Hold Time (Non-Local)**, now an
     SC-level fact (SC Master's RLH-specific section, same treatment as
     RLH Docks/Local Speed/Non-Local Speed — no plan-wide default tier,
     per-SC override only in Operating Mode). Off means the DS algorithm
     isn't modeling/minimising hold time for that SC at all (every DC's
     hold time is 0); On scales and caps each DC's hold draw to whichever
     Local/Non-Local ceiling applies, a real operating policy instead of
     an abstract multiplier.
  3. **D0 Cutoff range widened to 07:00–15:00** (was 09:00–12:00),
     default still 09:00 — synced everywhere it appears: Operating
     Mode's global and per-SC steppers, and LMDC Master's dropdown/CSV
     upload validator, both now generated programmatically from the
     range instead of a hardcoded list so they can't drift apart again.
  4. **Route Scheduler's wizard reduced from 4 steps to 3.** NLH Plan
     Selection is merged into Step 1 (mirrors Route Planner's own Step 1
     shape — pick the file first, then the list below reveals). Step 1's
     SC/Plan selection rebuilt as a rail (empty "Pick a SC" default,
     mirroring Design Review's own rail+cards pattern) + cards, with two
     one-shot bulk actions — **Select All Plans** (every Finalised plan,
     every SC, every version) and **Select All SCs** (exactly one plan
     per SC: whichever is most recently finalised) — plus Clear All,
     distinct from the existing "select all visible" (zone/search-scoped
     only). Operating Mode is now Step 2; Preview & Trigger is now Step 3,
     reached via a simulated DS-generation loading state (spinner +
     progress bar, reusing the existing Run Queue ticker pattern) rather
     than an instant step change.
  5. **New: Start-Time vs. D0% simulation graph.** A chart icon on every
     Preview & Trigger row opens a popup showing a real swept curve
     (candidate dispatch start time, 03:00–23:00 on a 30-min grid, vs.
     resulting D0 Landing %) — computed via the same per-DC travel-time
     logic `schedulerRouteDcInfo()` already uses, just parameterised by
     the swept start time instead of a cutoff-relative window. The DS's
     own recommendation (whichever point maximises D0%) is marked
     separately from the user's currently-chosen point; clicking anywhere
     on the curve previews an alternate start time, with a one-click
     "Use DS recommendation" to revert.
  - Companion docs have **not** been updated to reflect this session
    (08-04 through 08-10) — a recurring gap flagged after nearly every
    session so far; worth a dedicated pass before it drifts any further.

- **2026-08-11** — **Fixed a real runtime bug the user hit live**: opening Route Scheduler's
  Design Creation threw `ReferenceError: nlhPicked is not defined`. Root cause, and a real lesson
  for this codebase: the app resolves everything the render function references via a `with(B)`
  block over the object `renderVals()` returns — there's no explicit destructuring list, so a
  variable computed inside `schedulerVals()` but never added to its own `return {...}` is `undefined`
  at best and a hard `ReferenceError` at worst, and **no Babel/syntax compile check can catch this
  class of bug** — only an actual render does. `nlhPicked` was computed to build `canNextScheduler1`
  but never itself exposed, even though Step 1's JSX gated the whole SC/Plan rail on it directly.
  Fixed, then went back and found **four more instances of the exact same bug** from the same
  wizard-restructuring work: `curRailGroup`, `onSelectAllPlans`, `onSelectAllScsLatest`,
  `onClearAllPlans` — all computed, none returned. All five now properly exposed. Given a plain
  compile check can't catch this, a real render/click-through pass is the only reliable guard
  against it recurring.

- **2026-08-12** — Two fixes from user testing:
  1. **Step 1's SC/Plan rail is no longer gated on picking an NLH Plan first** — it was hidden
     behind `{(nlhPicked) ? ... : null}`, which the user explicitly didn't want (list should
     always be visible; NLH selection stays *mandatory to advance*, just doesn't hide the list).
     Un-gated the rail, added a small amber inline note under it when NLH isn't picked yet,
     explaining what's still blocking "Next" — `canNextScheduler1` itself is unchanged (still
     requires both a plan selection and an NLH pick).
  2. Began investigating a report that clicking HW = 0 in Operating Mode "applies but doesn't
     highlight — 0.5 stays shown as active." Traced the read/write logic thoroughly (correct) but
     couldn't reproduce a concrete bug from static reading alone this session; asked for more
     specific repro detail before guessing a fix (resolved the next day — see below).

- **2026-08-13** — 
  1. **Found and fixed the HW highlight bug.** Real root cause: **Route Planner's own Design
     Creation has a completely separate HW control that also returns a property literally named
     `hwGlobal`** (defaulting to 0.5), and — since `...this.creationVals()` is spread *after*
     `...this.schedulerVals()` into the combined render object — Route Planner's `hwGlobal` was
     silently overwriting Route Scheduler's for display purposes everywhere the bare identifier
     was referenced. Route Scheduler's actual *state* (`st.schedulerHwGlobal`) was always being
     set correctly (which is why triggering worked despite the icon not visually responding) — only
     the *read-back-for-display* was pointed at the wrong value. Renamed Route Scheduler's exposed
     key to `schedHwGlobal` to end the collision.
  2. Also fixed a smaller, related miss found while in there: the "N SCs overridden" badge still
     referenced `htfOverridden`, a field deleted along with HTF on 2026-08-09 — it was silently
     under-counting (not erroring) rather than including Hold Time's new override flags.
  3. **Start-Time vs. D0% graph redesigned** — now plots **Time of Day (X) vs. Volume % (Y)** with
     two curves: **Ready to Ship %** (a seeded logistic S-curve rising through the day — this
     prototype has no real sort-completion telemetry to draw from) and **D0 Landing %** (falling,
     same per-DC travel-time logic as before). The DS "suggested" start time is now genuinely the
     curves' **crossing point** (found by scanning for the sign change and linearly interpolating
     between the two straddling 30-min points), not simply whichever point maximises D0% on its
     own.
  4. **Preview & Trigger's expanded per-plan DC list gained 4 columns**: Open, Close, D0 Cutoff,
     Unloading Time — each showing the LMDC Master value with overridden ones in teal/bold and a
     tooltip distinguishing "Overridden in LMDC Master" from "Default."
  5. **New: an inline Start Time stepper on every Preview & Trigger row** — defaults to the DS's
     suggested (crossing-point) time, +/- buttons move it in 30-min increments without opening the
     graph popup, and a live D0% readout underneath updates by reading straight off that plan's
     already-computed curve (no recomputation). A small "reset" link appears once moved off the
     default.

- **2026-08-14** — **Built a full 3-persona Ops Alignment feedback loop for Route Scheduler**, per
  a product-defined table of User Type × Feedback Parameter × Reason Bucket × Remarks-mandatory-
  ness:
  - **SC User** (Ops Lead at the originating SC) — Dispatch Cutoff, route level.
  - **LH User** (linehaul/vehicle owner) — Dispatch Cutoff *and* TAT, both route/DC level.
  - **LM User** (receiving DC) — Landing Time, DC level, gated on Stage 1 being fully decided.
  - **3-stage flow, confirmed with the user**: Stage 1 (SC + LH simultaneous) → Stage 2 (Planner
    decides Stage 1) → Stage 3 (LM, only once Stage 1 is fully resolved for that route — since
    Landing Time's only lever, TAT, is locked by then, LM's request back-solves to an *implied*
    Dispatch Cutoff rather than needing fresh TAT/Cutoff reconciliation).
  - **Hold Time redefined as a REAL formula, replacing the synthetic capped-draw from 2026-08-09**:
    `Hold = max(0, DC's next Open time − Arrival)`, same-day or next-day depending on when the
    vehicle actually arrives vs. that DC's own Open/Close hours (LMDC Master) — not a random draw.
    **Landing Time = Arrival + Hold** everywhere (D0 Landing %'s check, the Start-Time curve's
    sweep, Plan Details' `landing_time` column) — the time a shipment is actually usable, not just
    when the truck shows up.
  - **Hold Time On/Off + Max Hold Local/Non-Local (SC Master) kept, but their role changed**: per
    explicit correction from the user, these aren't a cap applied after the fact — they're now a
    constraint fed to the dispatch-time *generator itself*. When On, a bounded local search (30-min
    steps, up to 8 hrs later) looks for a dispatch time keeping every DC's real computed hold under
    its applicable ceiling, "minimising hold time and keeping it within the limit," rather than
    capping a random draw.
  - **Cutoff disambiguated**: "Dispatch Cutoff" (the route's own `cutoff_time`/`dispatchMin`) vs.
    "D0 Cutoff" (the existing SLA threshold, Operating Mode/LMDC Master) — always were two
    different fields in the code, just needed the naming pulled apart for the feedback UI.
  - **Validation rules**, confirmed with the user: Dispatch Cutoff proposals must sit within the
    *originating SC's* own Open/Close hours; TAT proposals ≥ 0 (warned, not blocked, if wildly
    inconsistent with breakdown distance); Landing Time proposals back-solve to an implied Dispatch
    Cutoff via the (by-then-locked) TAT and the *target DC's* Open/Close hours, flagged infeasible
    (never silently clamped) if no cutoff satisfies it or it would violate the SC-hours rule; one
    pending proposal per (persona, field, route/DC); "Others" always requires Remarks, every named
    reason stays optional; **and new — a hard dock-capacity block** (not a warning): before any
    Accept that would move a route into a different 30-min dispatch slot, recomputes that slot's
    route count against the SC's dock count and blocks the Accept outright if it would be exceeded
    (e.g. an already-full 4/5 slot taking on a 5th and 6th route in the same batch).
  - First built as its **own dedicated "Feedback" tab** (4th tab alongside Plan Details/Route
    View/Dock Schedule) with inline flag-forms — **superseded three days later (2026-08-17, see
    below) once the user clarified the UI should match Route Planner's existing pattern instead**.
  - Mid-build, hit **the exact same `with(B)`-scope bug class as 2026-08-11**: the new Feedback
    tab bare-referenced `planner` in 4 places, but only the derived `isAlignPlanner`/`isAlignOps`
    flags were ever actually returned from `alignVals()` — `planner` itself never was. Fixed all 4
    (`isAlignPlanner`), then did a full sweep of the surrounding JSX confirming no further instances.

- **2026-08-17** — **Rebuilt the whole feedback loop's UI to match Route Planner's own existing
  Needs-Change/Review-Changes pattern exactly**, per explicit direction: *"I want the feedback
  modal to look similar with only functional changes where needed... do not create a dedicated
  feedback tab... show it at route level with Needs Change/Aligned for Ops Lead and Review
  Changes/Accept/Reject for the Planner."* Concretely:
  - **Removed the dedicated "Feedback" tab entirely** — Route Scheduler is back to Route Planner's
    exact 3-tab shape (Plan Details / Route View / Dock Schedule) in both Design Review and Ops
    Alignment. Verified with a full div/fragment balance check after the deletion (not just a
    compile check), given the earlier session's near-miss with silently dropped closing tags.
  - **Feedback now lives at route level, inside Ops Alignment's own Plan Details table** — each
    route gets a bordered header box above its DC rows (`buildSchedRouteHeaders()`), matching
    Route Planner's `dcGroupHeaders` box pixel-for-pixel. Design Review's own Plan Details is
    untouched (confirmed Route Planner's equivalent never shows these controls there either —
    feedback review is exclusively an Ops Alignment concern).
  - **Data model simplified to one shared status per route** (`Aligned` / `Needs Change`, derived
    from whether any item is still Pending — never separately stored, so it can't drift), matching
    Route Planner's own single `r.ops` model, replacing the earlier per-persona-per-field
    bookkeeping.
  - **Ops Lead view**: Aligned/Needs-Change toggle buttons on the route header (same green/amber
    as Route Planner); a role selector (SC/LH/LM) added to the overlay's top bar. Clicking "Needs
    Change" opens a **"Flag changes" modal that mirrors `ncOpen` exactly** — 600px card, one
    toggle-pill per flaggable field (SC: Cutoff only; LH: Cutoff + one TAT row per DC; LM: one
    Landing Time row per DC) that reveals an amber-bordered input + its own reason dropdown when
    clicked, one shared Remark box at the bottom (mandatory only if any flagged reason is
    "Others").
  - **Planner view**: a plain status pill on Aligned routes; a "Review Changes" button on routes
    with pending items, opening a **modal that mirrors `aSel.alignReviewRoute` exactly** — 640px
    card, items bucketed by field type with a divider line, "Accept all remaining"/"Reject all
    remaining," 26px Accept/Reject icons, plain-text decided-state (no pill background, matching
    Route Planner exactly), and the submitted remark shown as an italic quoted callout.
  - New methods matching Route Planner's own naming 1:1: `openSchedNc`/`closeSchedNc`/
    `toggleSchedNcFlag`/`submitSchedNc` (propose), `openSchedReview`/`closeSchedReview`/
    `schedAcceptAllRemaining`/`schedRejectAllRemaining` (decide), `withdrawSchedOwnOpen` (the
    "Aligned" quick-action for withdrawing one's own pending item).
  - Flagged as unverified: `schedAcceptAllRemaining`/`schedRejectAllRemaining` iterate calling
    `decideSchedFeedback` per item, each running its own dock-capacity check independently — later
    items in the same batch see already-updated dock counts from earlier ones in the *same* batch,
    which is the intended behaviour but hasn't been exercised by an actual render/click-through.
  - Companion docs (`01_Complete_Context.md` through `05_Core_Flows.md`, `PROJECT_CONTEXT.md`)
    remain un-updated through this entire 2026-08-11 → 08-17 span — the gap flagged after nearly
    every session continues to widen and would benefit from a dedicated pass.

- **2026-08-19** — Large session covering four areas: the `with(B)`-scope bug recurring a third
  time, a full rebuild of Route Scheduler's Ops Alignment lifecycle, the end-to-end Co-Loading &
  MDC module, and a systemic seed-data bug found via a new execution-harness technique. This entry
  reconstructs what should have been written up at the time — drafted from the handover note plus
  a direct check against the shipped `.jsx`, not from a session transcript, so treat specifics here
  as verified-against-code rather than a first-hand account.
  - **The `with(B)`-scope bug bit a third time.** Same class as 2026-08-11 and 2026-08-14: a bare
    identifier referenced in JSX/render logic but never added to its owning `*Vals()`/`buildSchedCard()`
    method's own `return {...}`. This time it was a rename — `stageSub` was split into `stage1Sub`/
    `stage2Sub` inside `buildSchedCard()` (now present at lines ~8587-8588, feeding `canSubmitFeedback`
    at ~8611), and one leftover reference to the old `stageSub` name was missed in the rename sweep.
    Caught by the user's own deploy-test, not by anything in-session — reinforcing the standing rule
    that any rename touching a `*Vals()`/`buildSchedCard`-style method needs a full-body grep for the
    old name, not just a check of the lines that were intentionally touched. Compile checks
    (`@babel/preset-react` transform) remain necessary but structurally cannot catch this bug class.
  - **Route Scheduler's Ops Alignment rebuilt into a real, working 2-stage lifecycle**, replacing the
    2026-08-17 rebuild (which got the visual shape right per Route Planner's own Needs-Change/
    Review-Changes pattern, but whose underlying status machinery didn't actually work — Acknowledged
    inverted to *lock* rather than unlock the Planner's Review action, and there was no real path to
    reach Acknowledged outside of seed data). New `schedStage` field on `schedulerPlans` drives it:
    **Stage 1** (SC + LH propose Cutoff/TAT) → Submit → Acknowledge & Freeze → Planner decides
    (contradicting proposals resolve to a new **Superseded** status rather than being silently
    overwritten) → Push to LM Alignment → **Stage 2** (LM proposes Landing Time) → same
    submit/decide cycle → Finalise. By design, the SC/LH persona's own status tab pins to
    "Acknowledged" through the entirety of Stage 2 (their part is done; the stage has simply moved
    on to LM). Full mechanics live in `04_Rule_Engine.md` — that file, like the others, still needs
    its own pass to actually reflect this (see gap below).
  - **Co-Loading & MDC built end-to-end** — a new concept for DCs/routes that occupy real dock
    capacity but aren't planned by this tool's own DS algorithm, or are planned from a different
    origin node entirely:
    - LMDC Master gained 5 new columns: **RLH Mode** (Valmo RLH / MDC / Co-Loading), **MDC Code**,
      **Lane Name**, **Cutoff**, **TAT**.
    - An **MDC** is a full SC-Master-schema entity — routable exactly like a real SC once added.
      Exclusion of an MDC-routed DC from its *originating* SC's own draw pool is enforced structurally,
      before that SC's DC draw-queue is even built (`isMdc`/`rlhMode` checks feeding pool construction
      around the SC/LMDC generation logic) — not just a display-time label applied after the fact.
    - **Co-Loading lanes are frozen into their originating SC's RLH plan at generation time** and
      never touch the DS algorithm at all. They're explicitly guarded out of
      `computeHypotheticalPlan()`'s own re-clustering engine via `isCoLoadLane` checks (e.g. the
      `rt.isCoLoadLane && prior` short-circuit around line 9445) — flagged as the single highest-risk
      spot in this build, since without that guard a lane's real DCs could have been silently
      reassigned by the clustering logic on any Validate/Simulate pass.
    - **Route Scheduler treats a Co-Loading lane as a fixed occupant**: no dispatch-time search runs
      for it (`isCoLoadLane` branches in the scheduler's dispatch/hold logic, ~9599-9622), and real
      routes' own dispatch search now actively avoids dock slots a lane already occupies
      (`laneCounts` tracked alongside `counts` per slot, ~6789).
    - Dock-capacity breaches from lane occupancy are flagged at 4 surfaces (consistent with how RLH's
      own dock breaches are already surfaced elsewhere in the app).
    - Full mechanics: `02_Logics_and_Formulae.md` and `04_Rule_Engine.md` (both still pending their
      own update pass).
  - **Local/Non-Local reclassified as a real, permanent per-DC attribute** — `isLocal = haversine(SC,
    DC) ≤ 100km` (line ~5748), replacing the old per-route hash coin-flip. Real routes now generate
    **Locality-homogeneous** by construction; Ops Alignment feedback can still override the classification
    afterward, by design — the change is to how it's *generated*, not a removal of override capability.
  - **A systemic seed-data bug found via a new execution-harness technique, not by reading the
    generator.** `buildSeed()` plus its one dependency (`resolveScFields()`) were extracted into a
    standalone Node harness and actually run, with automated cross-reference assertions against the
    real output (plan/run/`schedulerPlan` → SC references, route/DC ownership, locality homogeneity,
    RLH-mode leakage, lane consistency, duplicate codes). This surfaced a real, previously invisible
    bug: DC codes were generated as `cityCode + '-' + N`, but 68 of the 80 seeded SCs share a city
    with a second SC, so codes collided across entirely unrelated SCs' pools — quantified at **4,764
    duplicate LMDC codes out of 12,547 (38% of the pool)**. This was the actual root cause of a
    previously-reported, previously-unexplained bug ("GGNS shows missing SC Master inputs"). **Fixed
    at the source** (line ~5719, explicitly commented in the code as a 2026-08-19 fix): codes now key
    off `sc.code` (guaranteed-unique) instead of `sc.cityCode`. Re-validated against the harness at
    zero collisions afterward. This pattern — extract the pure generator, run it for real, assert
    against real output — is now the recommended approach any time seed-data consistency needs
    checking again; reasoning about the generator by re-reading it missed this bug entirely.
  - **Smaller, related fixes bundled into the same session:**
    - **TAT is hours everywhere now** (was minutes, briefly a fixed dropdown) — free numeric input,
      step 0.25, always rounds up to the display grid.
    - **Grid rounding** (30-min Dispatch Cutoff, 15-min Travel/Hold, always rounding **up**, never
      down or nearest) centralised into one shared `roundUp(min, step)` helper (~line 9541) and used
      at every computation site that previously had its own inline rounding.
    - **Multi-select filters** (Zone, RLH Mode, SC Type) replaced single-select chip rows via one
      reusable `buildMultiSelect(selected, allOptions, stateKey, extraResetKeys, allLabel)` (~line
      5571), with the pre-existing zone-chip helper now delegating to it rather than duplicating logic.
  - **Compile-check command, unchanged, still the standing first-pass gate** (not sufficient alone —
    see the `with(B)` note above):
    ```
    node -e "const babel=require('@babel/core'); const fs=require('fs');
    const code=fs.readFileSync('app.jsx','utf8');
    babel.transformSync(code,{presets:[['@babel/preset-react',{runtime:'classic'}]],sourceType:'script',filename:'app.jsx'});
    console.log('COMPILE OK');"
    ```
  - **No live render/browser test has been done at any point in this project, still true as of this
    session.** The user deploy-tests separately and reports back. The execution-harness pattern above
    is a genuinely strong complement for seed-data specifically, but it is not a substitute for an
    actual render/click-through, and nothing in this session changes that standing limitation.
  - **Still open / explicitly flagged, unchanged from the handover:**
    - `schedAcceptAllRemaining`/`schedRejectAllRemaining`'s batch dock-capacity interaction (later
      items in a batch seeing already-updated counts from earlier ones in the *same* batch — intended,
      but never exercised by an actual click-through; flagged 2026-08-17, still open here).
    - Map Visualization's arrowhead-drawing logic assumes one endpoint per route; a Co-Loading lane
      with multiple DCs likely draws one arrowhead instead of one per line — cosmetic, not fixed.
    - SC-DC Mapping ("Node Mapping" tier) remains an unbuilt "Coming Soon" stub, explicitly unrelated
      to the new MDC concept despite the similar-sounding name — see `06_Future_Scope_SC-DC_Mapping.md`
      for the disambiguation note added this session.
    - **The companion docs (`01_Complete_Context.md` through `05_Core_Flows.md`, `PROJECT_CONTEXT.md`)
      are now stale across two full build sessions** (still dated 2026-08-04 in the project's
      knowledge base as of this write-up) — they predate the entire 2026-08-11 → 08-19 span: the
      3-stage-then-2-stage feedback loop rebuilds, the Co-Loading/MDC module, the Local/Non-Local
      reclassification, and the DC-code collision fix are not reflected there at all. This is the
      single most valuable next piece of housekeeping if picking this up fresh — everything above
      is verified against the `.jsx`, but the companion docs still describe an earlier version of
      the app.

- **2026-08-25** — Large session: the app split from a single RLH tool into three independent
  design legs (FM Carting / NLH / RLH), each with its own monthly design cycle, sitting on top of
  a new shared multi-leg data-layer engine. **Written up at the time this build happened, not
  reconstructed later** — but flagging plainly: this entry describes what compiled, unit-tested,
  and binding-audited correctly. **No live render/click-through has been done on any of it.** The
  user deploy-tests separately; treat everything below as "built and internally verified," not
  "confirmed working in the browser," until that happens.
  - **New top-level landing screen** — three cards, in order: FM Hub Mapping & FM Carting Design /
    SC-SC and NLH Design / LM Mapping & RLH Design. No access-gating between them this session
    (deliberately deferred — the product intent is eventually to restrict each card to specific
    users, but that's not built). Picking RLH goes straight into the existing full app, unchanged.
    Picking NLH/FM Carting goes to a new "leg stub" shell.
  - **Per-leg design cycles, finally real, not cosmetic.** The sidebar cycle selector existed
    before this session but did nothing — switching it just relabeled a toast, no data was
    partitioned by cycle at all. It's now backed by real per-(leg, cycle-month) state: each of the
    3 legs runs its own independent rolling window (6 months back, 6 forward, default current
    month), switching cycles actually re-materializes that leg's masters.
  - **New multi-leg data-layer engine** (added as its own clearly-bannered, initially-inert section
    directly above `class NDCApp`, ~370 lines) implementing a 4-way field classification that
    replaces the old "one flat seeded array, edited via session overlays" model:
    - **Class A (true global)** — SC identity (name/lat/lng/zone). One value, forever, shared by
      every leg, no cycle dimension at all.
    - **Class B (cross-leg, cycle-versioned)** — SC Type, Sort/Volume Capacity, HTP. One value per
      (SC code, calendar month), shared live by whichever legs are "in" that month. First touch of
      a new month clones forward from the nearest earlier month that has data — a genuine
      chronological chain, not "always clone from current."
    - **Class D (fully local)** — everything leg-specific (RLH's Local/Non-Local Speed, RLH Docks,
      LMDC Master; each leg's own independent Vehicle Master and SC Vehicle Availability — explicit
      product decision: no shared fleet across legs, even though the table shape is identical;
      NLH's own Dock Capacity/Lane Name). Cloned forward the same way as B, but scoped to one
      (leg, table) — invisible to, and unaffected by, every other leg.
    - **Row existence (add/delete/deactivate)** is its own effective-month mechanic layered on the
      Class A registry, independent of which leg's clock is running: a status log per SC code,
      walked to find "what was true as of this cycle-month." This is what makes "RLH adds an SC
      effective October, NLH (still in September) doesn't see it yet, but sees it the moment NLH's
      own October cycle exists" work correctly without any special-casing per leg.
    - **Output snapshotting** — `snapshotForOutput()` freezes whatever Class A/B values a plan
      actually used at generation time, so a Finalised plan stays historically accurate even after
      the live global fields move on. Resolves the tension flagged mid-design: Class B fields have
      no cycle-scoped history of their own (editing this month's Sort Capacity doesn't touch any
      other month's), so without a snapshot a past Finalised plan's inputs could appear to change
      after the fact purely because someone edited a *different* month's value elsewhere.
    - A real bug caught before it ever reached a screen: the original `resolveExistence()` tie-break
      (delete followed by same-month "undo") picked the *first*-pushed status among same-month
      entries instead of the most recent — fixed to `>=` before any UI touched it, with a
      regression assertion added.
  - **RLH's SC Master fully rewired onto the engine.** `buildSeed()`'s old 80-SC generation loop +
    the `scEdits`/`addedScs`/`scRemoved` session-overlay pattern are gone — replaced by
    `seedRLHMasterData()` + `materializeRLHScs()`, called once at construction and again on every
    cycle switch or edit. Per explicit product decision, **this replaced the seed data outright**
    rather than trying to preserve old values (test data, not production data) — regenerated at
    similar or larger scale (80 SCs + 3 MDC nodes, ~12,000+ DCs total) so the UI still demonstrates
    real scale. `submitAddSc()`/`openScEdit()`/the delete handler now write through
    `resolveField()`/`setClassBField()`/`setClassDField()`/`setSCStatus()` and re-materialize,
    instead of patching a session overlay. Vehicle Master, SC Vehicle Availability, and LMDC Master
    data all now live in the engine's storage shape too (materialized into the same flat arrays
    every existing formula already consumed, so Route Planner/Route Scheduler/validation needed
    zero changes) — **but their own edit UIs are not yet rewired**: SC Vehicle Availability's
    inline edit still writes to the old `availEdits` overlay, and LMDC Master's generation
    algorithm (Co-Loading/MDC assignment, hold-time draws) is deliberately untouched this session,
    just given a home in the new per-cycle shape. Flagged explicitly, not silently inconsistent.
  - **NLH's Design Inputs built for real** — masters (shared columns read-only from the network-
    wide registry; NLH-local Dock Capacity + Lane Name, inline-editable), two manifestation uploads
    (FMSC Manifestation, LMSC Landing — Class F, never cloned), and a Design Ingestion tab (bring in
    an externally-built NLH plan; no DS solver for NLH exists, this is the only way an NLH "plan"
    exists at all this session). **FM Carting's Design Inputs came free from the same generic
    build** — same masters/upload pattern, just no Design Ingestion tab (nothing references FM's
    output yet, per product decision) and no FM-local columns defined yet (content deliberately
    left open).
  - **RLH's Route Scheduler Step 2 rewired to reference NLH instead of owning its own upload.**
    Previously: an "NLH Landing Plan" file uploaded directly inside RLH's own Design Ingestion.
    Now: a picker with its own NLH-cycle-month selector (independent of RLH's own active cycle,
    since NLH runs its own clock), listing whatever's been ingested on the NLH card for that month.
    Two knock-on lookups (`buildSchedCard()`'s NLH-plan-name display, `triggerSchedulerRuns()`'s
    defensive coverage re-check) also read the old `st.ingestedNlhPlans` array by run ID — both
    caught and rewired to a new `findNlhIngestedPlanById()` cross-month lookup before they could
    silently break triggering (the picker would have shown engine-sourced plans with IDs the old
    array never contained, so the trigger's re-check would have blocked every run). The now-dead
    RLH-side "NLH Plan" ingestion tab is marked disabled/redirecting rather than left silently
    inert. **Known simplification, stated plainly:** the engine's lightweight ingestion record
    carries no real per-DC volume/coverage data, so NLH-sourced plans are stubbed as "covers every
    currently-selected RLH SC, at that SC's own RLH volume" — the two Layer-5 validation rules (NLH
    coverage / volume variance) won't meaningfully fire against an NLH-sourced plan until NLH has
    an actual solver producing real per-DC landing data.
  - **Past-cycle enforcement, action-level.** A new `isRlhCyclePast()` check (based on the real
    per-leg `activeCycleMonth`, deliberately NOT unified with the older cosmetic
    `designCycle`/`isPastCycle` that still separately drives sidebar nav — flagged as two
    coexisting "past cycle" concepts, not reconciled this session) blocks `submitAddSc()`, the SC
    Master delete/undo handler, and a real (non-Finalise-Direct) `doPush()`/`doSchedPush()` when
    the active RLH cycle is in the past. Finalise Directly stays available at any cycle age, per
    product decision. A banner surfaces the read-only state on the SC Master screen itself, not
    just as a toast at save time.
  - **Verification discipline used throughout:** every new engine function was unit-tested in a
    standalone Node harness (grown from 44 → 74 assertions across the session) before being spliced
    into the `.jsx`; after each splice, the exact block living inside the final file was
    re-extracted and re-run against the same harness to catch drift between "what was tested" and
    "what shipped." Every new JSX binding was individually checked against `renderVals()`'s actual
    returned keys — the specific discipline that would catch a `with(B)` scope bug — with one real
    field-usage gap caught this way (`s.scType` collided in name, though not in behavior, with an
    unrelated pre-existing display-label concept; confirmed harmless, flagged for future clarity).
    Compile-checked clean at every step, final file **~14,150 lines**. None of this substitutes for
    an actual render/click-through, which has still never been done on any part of this project.
  - **Deployment note:** only `v3.0-rlh-design-base.jsx` changed this session. `index.html` is
    untouched (no new CDN/font/dependency needs). The data-layer test harness and its standalone
    copy of the engine code are tooling artifacts from this session's build process, not part of
    the shipped app — they were never intended for the repo.
  - **Still open / explicitly flagged from this session, for whoever picks this up next:**
    - SC Vehicle Availability's inline edit and LMDC Master's generation logic are not yet rewired
      onto the engine (data lives there, editing doesn't go through it yet).
    - The old cosmetic `designCycle`/`isPastCycle` (sidebar nav) and the new real
      `activeCycleMonth`/`isRlhCyclePast()` (enforcement) are two separate, unreconciled "past
      cycle" concepts.
    - No access-gating between the 3 landing cards yet (explicitly deferred, not forgotten).
    - NLH/FM Carting have no Design Creation solver, no Design Review, no Ops Alignment — Design
      Inputs only, by design, this session.
    - **Companion docs (`01_Complete_Context.md` through `PROJECT_CONTEXT.md`) are now three full
      sessions stale** (still describing the pre-multi-leg, single-RLH-tool app) — the gap flagged
      after the 2026-08-19 entry has only widened.

- **2026-08-26** — Very large session, entirely deploy-test-driven: three rounds of user click-
  through on the 2026-08-25 multi-leg build surfaced real bugs and real scope gaps, fixed in
  sequence, followed by a deliberate "what did we skip" audit that closed out most of the
  remaining list. Written up as one entry since it was one continuous working session, organized
  by theme rather than strict chronological order.
  - **Root-cause bug, found via screen recording: a header-level mechanism nobody had leg-gated.**
    When NLH's screens were reported as "broken" (RLH's own Design Inputs tab strip and 5-stage
    lifecycle rail rendering on top of NLH's content, fully functional but completely disconnected
    from what was underneath), the actual cause wasn't the content-level guards (`isInputs` etc.,
    already correctly gated to `st.activeLeg === 'rlh'`) — it was `railViewActive`, a *separate*
    construct living in the page header that drives both the visual stage-rail and the Volume
    Inputs/Node Inputs/Node & Vehicle Master/Design Ingestion sub-tab strip, checked only
    `st.view`, never `activeLeg`. Fixed with one added condition
    (`st.activeLeg === 'rlh' && (...)`), which correctly cascaded to both things it drives. Worth
    remembering: leg-gating the *obvious* guards doesn't guarantee every rendering path is caught —
    this file has more than one mechanism keyed off `st.view` alone.
  - **Cycle-flow UX rebuilt end to end**, after the first round of testing showed the sidebar
    appearing regardless of leg, "start a new cycle" doing nothing real for RLH, and no way to
    switch leg or cycle without a hard refresh:
    - Every leg (including RLH, which previously skipped straight to content) now stops at an
      explicit `view: 'cyclepick'` screen — a real custom dropdown (not a native `<select>`, to
      match the app's own established dropdown pattern) with two groups: existing cycles for that
      leg, and "start new cycle" for every other month in the rolling window. Nothing is
      pre-selected.
    - The sidebar's navy band is now **always present** (previously hidden during
      landing/cyclepick, which read as "the app just went plain white") — only the nav items and
      cycle switcher are conditionally shown, once `activeLeg` and a real content view exist.
    - RLH's own sidebar cycle switcher — a pre-existing but entirely cosmetic control, hardcoded to
      `['July 2026', 'June 2026']` — is now wired to real `engineStore.cyclesCreated.rlh` data and
      the real current date, reusing the same UI shell.
    - The sidebar logo/brand block is now clickable (`goLanding()`), resets `activeLeg` to null,
      and doubles as the "switch leg" affordance that didn't exist before.
  - **RLH's plans/runs/schedulerPlans made genuinely per-cycle** (previously generated once in the
    constructor and shared identically across every cycle month — the literal bug report was
    "I select June, but the plan says triggered in July, and July/August show the exact same
    plans"). Full-correctness approach, not a display-only patch:
    - `componentDidUpdate(prevProps, prevState)` transparently persists whatever's in
      `this.state.data` (every field except the 4 engine-driven master fields — `scs`/`VEH`/
      `scVehAvail`/`lmdcs`) into a per-(leg, cycle-month) bucket (`engineStore.rlhCycleData`)
      whenever it changes, or whenever the cycle switches away from a month. **Zero changes to any
      existing mutation site** in Design Creation/Review/Alignment/Route Scheduler — none of that
      code needed to learn the engine exists.
    - `pickCycle()` loads the target month's bucket (or field-appropriate empty defaults —
      `emptyRlhTransactional()`, checked against the real shapes: `autodmlDetails` is an object
      map, everything else is an array) instead of always showing whatever the constructor
      happened to generate.
    - Seeded May/Jun/Jul/Aug/Sep 2026 with real (not empty) data; October created but genuinely
      empty, ready for the user to trigger into; everything else (Feb–Apr, Nov onward)
      deliberately left un-created.
    - **Known, stated simplification**: rather than independently regenerating each of the 5
      seeded months (would have meant rewriting ~440 lines of tightly-coupled, sequential
      generation logic — high risk, unverifiable without a browser), May/Jun/Aug/Sep were derived
      from the one July dataset via `retargetMonthStrings()` (a generic deep-clone + find/replace
      of month abbreviation/full-name strings) plus `suffixRlhIdsForMonth()` (appends `-<month>`
      to every plan/run/schedulerPlan id and remaps `parentPlanId` accordingly). The id-suffixing
      was necessary, not cosmetic: ids like `'GGN01-HW1'` don't contain "Jul", so without
      suffixing, the 5 retargeted months would share identical ids — which would have let
      auxiliary per-id state (`schedFeedback`/`schedSubmitted`, seeded via
      `seedSchedDemoFeedback()`, now re-run once per newly-visited month, guarded by
      `this._seedFeedbackDone[month]` so revisiting a month doesn't stomp on real edits) bleed
      across months the exact same way the original bug did, just one layer deeper. The 5 seeded
      months therefore share identical underlying route/plan *structure* — only dates and ids
      differ — rather than being independently generated; the isolation architecture going forward
      is genuinely correct, the seed *content* is a derived clone.
  - **Landing cards redesigned** — side-by-side (3 columns) instead of stacked, each with a
    navy/blue icon badge and centered content, matching the app's existing accent language.
  - **RLH's Volume Inputs tab trimmed to LMDC Landing only** — was still showing all 4 upload
    types (LMDC/LMSC/FMSC/FM Hub) from before the leg split existed; `VF`, `volTypeMap`,
    `volTypeChips`, `VSHORT`, and `allVol`'s filter all correspondingly cut down to RLH's own type.
  - **A real dispatch-role model, replacing a fake one.** RLH's SC Master "SC TYPE" column
    (Hybrid/LMSC/FMSC) had always been a `dcCount`-size threshold guess with nothing behind it —
    confirmed by finding the SC Type *dropdown already sitting in the edit form*, wired to nothing:
    `openScEdit()` hardcoded it to `'LMSC'` on every open, `submitAddSc()` never read it back.
    - New Class B fields `dispatchesRLH`/`dispatchesNLH` — the real fact of which leg(s) a
      physical SC actually dispatches (an FMSC receives from FM Hubs and dispatches NLH; an LMSC
      receives from NLH and dispatches RLH; a Hybrid node does both — "focus on what the node
      dispatches," per the product decision that unlocked this). SC Type is now *derived* from
      these two flags everywhere it's displayed or filtered, not seeded as its own independent
      guess.
    - Seeded at the product-specified ratio (~75:100:7.5 LMSC-only:FMSC-only:Hybrid on a full
      ~180-node network, applied proportionally — not literally — to the 80 SCs actually seeded
      here: ~41%/~55%/~4%).
    - **Now genuinely editable**, cycle-versioned like every other Class B field (an edit only
      takes effect from that cycle month onward, never retroactive) — with an MDC-node guard so
      saving an MDC's edit form can't silently downgrade it to `'LMSC'` (MDC isn't one of the 3
      dropdown options).
    - **Governing-rule cascade, not just a label change**: Route Planner's own SC-selection list
      (Design Creation Step 1) now filters to `dispatchesRLH` SCs — changing an SC to FMSC
      genuinely removes it from RLH's Design Creation pool, matching the exact worked example from
      the product conversation. The same filter was applied to RLH's own SC Vehicle Availability
      (previously unfiltered; NLH's analogous screen already filtered to `dispatchesNLH`, so this
      closes a real inconsistency between the two).
    - Also fixed: `scTypeOf()` (the SC Master screen's own type-filter predicate) was reading the
      same fake `dcCount` threshold as the display column, so the filter dropdown was already
      silently broken before this — now reads the real field. Filter keeps all 4 options
      (LMSC/FMSC/Hybrid/MDC) for browsing, per product decision — SC Master always shows every SC
      regardless of leg; "RLH relevant only" scoping applies to selection screens, not this filter.
  - **NLH rebuilt to genuinely mirror RLH's shape**, not the simpler 3-tab version from
    2026-08-25: Volume Inputs (real "ACTIVE THIS CYCLE" cards + a **full** file library — see
    upload-history note below, not just the single current-active file per type from before),
    Node Inputs (tab exists, deliberately blank), Node & Vehicle Master (3 sub-tabs: Sort Centre
    Master showing global + NLH-local columns; SC Vehicle Availability, scoped to
    `dispatchesNLH` SCs, **now with full add/edit/delete**, not read-only; Vehicle Master, NLH's
    own seeded linehaul-scale fleet, **also full add/edit/delete**, no LH Feasibility column at
    all), Design Ingestion (unchanged, already matched the pattern). CRUD is functional-first, not
    matched pixel-for-pixel to RLH's own polish, per explicit product decision.
    - `materializeVehicleMasterLeg()` gained an actual delete mechanism (`_removed` flag, filtered
      at materialize time) — Vehicle Master had never had one at all before this; a seeded vehicle
      type was permanent.
  - **FM Carting's Design Inputs now shows the same 4 tabs** (structural parity, per product
    decision) with every panel rendering a plain "not built yet" message — no real content
    anywhere for FM this session, deliberately.
  - **Volume file library, actually full now.** The engine's Class-F upload storage kept exactly
    one file per (leg, cycle-month, slot) — fine for "what's currently active," useless for a
    library. Added `uploadHistory` (a running, never-overwritten list, appended to on every
    `setUpload()` call) and `listUploadHistory()`; NLH's library now shows every upload made this
    cycle, newest first, with a working search box — not just the current file per type.
  - **RLH's Vehicle Master lost its "LH Feasibility" column** (the add/edit toggle-chips and the
    table column) — every vehicle in a leg's own Vehicle Master is now implicitly that leg's only,
    so there was nothing left to toggle. The underlying `feas: ['RLH']` **data field was
    deliberately left untouched** — Route Planner's own filtering (`rlhFeasibleVehNames`, a
    `VEH_SET` lookup) and a validation message both still read it, and rewiring those was outside
    what this fix needed to touch.
  - **SC Master: real Deactivate/Reactivate, not Delete.** Per product decision, SC Master's row
    action is deactivate-only (every *other* master's delete stays exactly as it was). A
    deactivated row **stays visible** in the table (tagged "Inactive", grayed) rather than
    disappearing the way a delete would — excluded from Route Planner/SC Vehicle Availability
    selection, but the row persists for continuity, with a real persistent Reactivate action, not
    a 5-second undo toast (deactivating is a considered decision, not an accidental click).
    - `isDisplayable()` added alongside the existing `isVisible()` — the broader check (active OR
      deactivated) used for display; `isVisible()` stays the strict "genuinely active" check used
      for selection eligibility everywhere downstream.
    - **A real bug caught mid-build**: the SC Master row's *actual* wired delete button went
      through a confirm-dialog flow (`rowDeleteConfirm` → `delConfirm` state → `confirmDelete()`)
      that was a **completely different code path** from the `rowDelete` handler fixed back in the
      original Phase 2 engine migration — meaning that earlier "fix" had never actually been
      reachable through the UI at all; the button was still writing to the old `scRemoved` session
      overlay the entire time. Found only by tracing the literal onClick chain, not by re-reading
      the handler that seemed obviously responsible. Fixed `confirmDelete()`'s `'sc'` branch
      directly.
  - **LMDC Master rewritten to real per-DC entities** — the largest single piece this session.
    Previously one giant blob (all ~12,607 rows keyed under a single `'ALL'` entity) that never
    persisted edits across a cycle switch at all (`saveLmdcEdit()` and the CSV bulk-upload handler
    both wrote to a session-only `lmdcEdits` overlay, same class of bug as SC Master's original
    `scEdits` before its Phase 2 migration — confirmed by tracing the actual write paths, not
    assumed).
    - New `lmdcRegistry` — a parallel registry to `scRegistry`, same effective-month `statusLog`
      mechanism, scoped to individual DC codes. No Class-A "shared across legs" layer needed
      (LMDC Master is RLH-only) — existence tracking was the only genuinely new piece; every field
      (capacity, RLH Mode, MDC/Lane, Cutoff, TAT, etc.) already fit as ordinary Class D.
    - `seedLmdcEntities()`/`materializeLmdcEntities()` replace `seedLmdcRawLeg()`/
      `materializeLmdcRawLeg()` — each of the ~12,607 DCs gets its own `addLmdc()` +
      `ensureClassDMaterialized()` call at genesis.
    - `saveLmdcEdit()` and `handleLmdcCsvUpload()` both rewired to write straight through
      `setClassDField()` per DC, then `refreshLmdcs()` (same re-materialize pattern as
      `refreshScs()`). The lane-sibling cutoff-correction logic (Co-Loading rows sharing a Lane
      Name must show the same Cutoff) now reads `d.lmdcs` directly instead of merging against the
      old overlay, since `d.lmdcs` is always fresh post-edit.
    - Three *other* consumers of the old `lmdcEdits` overlay (two Route-Scheduler-timing sweep
      functions, `lmdcEditsOverlaySweep`/`lmdcEditsOverlayS4`) were deliberately **not** individually
      rewired — confirmed they degrade safely now that the overlay is permanently empty (their
      `patch && patch.field` lookups just fall through to the base row, which is already correct
      post-migration), the same reasoning that made the original SC Master Phase 2 migration safe
      without touching every downstream reader.
    - Added Deactivate/Reactivate per DC row, same pattern and same UI language as SC Master, now
      that real existence tracking backs it.
    - **Verified at actual scale, not just in the small**: the harness seeds and materializes
      12,000 synthetic entities, checks a specific one deep in the set resolves its own correct
      field value (not a neighbor's, the classic per-entity bug class), edits one without
      disturbing its neighbor, and deactivates one without affecting the other 11,999 — not just
      unit-level correctness on 2-3 rows.
  - **Two unreconciled past-cycle concepts, reconciled.** The old cosmetic `designCycle`/
    `isPastCycle`/`pastNav`/`cyclesummary` machinery (flagged, not fixed, in the 2026-08-25 entry)
    is now retired rather than merged — RLH's nav always shows normally regardless of cycle age,
    since past-cycle restriction was already correctly handled at the action level (the Design
    Inputs banner, blocked Push-to-Alignment) and didn't need a second, nav-level mechanism.
    `pastNav`/`isPastCycle`/`cyclesummary` left as inert dead code rather than torn out, to avoid
    risk to anything still referencing them.
  - **A real grid-alignment bug, root-caused precisely**: SC Master's edit/delete icons were
    wrapping onto a new row. Traced to an exact cell-count mismatch introduced during the earlier
    NLH-Docks-removal fix — the header lost 2 cell slots (a toggle button + a conditional column)
    but the body rows only lost 1 (a leftover unconditional placeholder `<div/>` was never
    removed), so every body row had one more grid cell than the header. Fixed by removing the
    stray placeholder; the grid's `grid-template-columns` count and the actual rendered cell count
    now agree again.
  - **Verification discipline, same standard as every prior session, scaled up with it**: the
    standalone harness grew from 74 → **109 assertions** across this session (new coverage for the
    deactivate/`isDisplayable` distinction, `retargetMonthStrings()`/`suffixRlhIdsForMonth()`,
    `extractRlhTransactional()`/`emptyRlhTransactional()` against the real shapes, upload history,
    and the LMDC entity registry at both small and 12,000-row scale). Every harness run this
    session was performed twice where it mattered — once standalone, once against the exact block
    re-extracted from the final shipped file — to catch drift between what was tested and what
    shipped; none was ever found. Compile-checked clean after every individual edit, not just at
    the end. Final file **~15,030 lines**. No live render/browser test has been done on any of
    this — the user's own deploy-testing is what surfaced the `railViewActive`, cycle-scoping, and
    grid-alignment bugs in the first place, and remains the only way anything in this app gets
    genuinely confirmed working.
  - **Deployment note**: only `v3.0-rlh-design-base.jsx` changed this session, same as every prior
    one. `index.html` untouched.
  - **Still open / explicitly flagged, for whoever picks this up next:**
    - No access-gating between the 3 landing cards (parked by explicit product decision, revisit
      later).
    - Delete vs. Deactivate as two genuinely separate functions across *every* master (only SC
      Master and LMDC Master got the real deactivate treatment this session; other masters'
      existing delete actions were explicitly left as-is per product decision).
    - The "future cycle already created before a deletion happens" cross-cycle edge case (parked,
      "we will define more as we move further").
    - Who can add a brand-new SC to the shared global registry — decentralized vs. admin-only
      (parked, "I will rethink this").
    - NLH's ingestion-sourced plans still carry stubbed SC coverage/volume for RLH's Route
      Scheduler picker (unchanged from 2026-08-25 — no real per-DC data flows from NLH's own
      solver, which still doesn't exist).
    - NLH/FM Carting still have no Design Creation solver, Design Review, or Ops Alignment — Design
      Inputs only, by design, every time this has come up.
    - LMDC Master has no "Add new DC" flow of its own — DC creation still goes through Node
      Inputs' AutoDML additions, a separate, untouched existing mechanism.
    - **Companion docs are now four full sessions stale** — the gap flagged after 2026-08-19,
      widened after 2026-08-25, has widened again.

- **2026-08-26 (later session)** — Picked up the two items flagged at the top of the handover:
  NLH had zero past-cycle enforcement anywhere, and SC Master's/SC Vehicle Availability's own
  "Upload CSV" buttons were silently firing Design Ingestion's simulated ingest instead of doing
  anything to the masters. Both fixed; written up here since the companion docs already lag by a
  round and this shouldn't widen that gap further.
  1. **NLH past-cycle enforcement, built from scratch.** New `isLegCyclePast(leg)` — a generic
     counterpart to `isRlhCyclePast()` — wired into every NLH-mutating method: `setLegField`
     (Dock Cap / Lane Name), `legVehAddSubmit`/`legVehEditSave`/`legVehDelete` (Vehicle Master),
     `legAvailAddScSubmit`/`legAvailRowAddSubmit`/`legAvailRowEditSave`/`legAvailRowDelete` (SC
     Vehicle Availability), `submitLegIngest` (Design Ingestion), and `onLegUploadFile` (Volume
     Inputs upload) — the last of which is shared with FM Carting's own real upload slot, so FM
     picked up the same protection for free, gated by whichever leg is actually active rather than
     hardcoded to `'nlh'`.
     - Unlike RLH, there's no Finalise-Directly-style bypass to preserve — NLH has no Push/
       Finalise concept at all, so every guard is a flat block, no partial-exception logic needed.
       This matches the scoping the handover itself suggested rather than a blind port of RLH's
       (more complex) rules.
     - Added the same read-only banner RLH's Design Inputs shows, reusing the already-computed
       `legCycleIsPast` binding, placed once beneath the 4-tab strip so it covers Volume Inputs /
       Node Inputs / Node & Vehicle Master / Design Ingestion without repeating it per tab.
     - Went straight to full visual disabling (`disabled` + grayed styling on every affected
       button/input — dock/lane inputs, +Add SC, +Add Vehicle, per-row edit/delete/save icons,
       the volume upload label, the ingest field+button) rather than shipping action-level-only
       and waiting for a second round, per the standing lesson from RLH's own three-round history
       of this exact gap (block-on-click → banner → actually disabled).
  2. **Fixed the `uploadFile` naming collision** (flagged, not fixed, at the end of the prior
     session). Root cause confirmed precisely: SC Master's and SC Vehicle Availability's "Upload
     CSV" buttons were both wired to the same `uploadFile` render binding, which actually resolves
     to `ingestRlhPlan()`/`ingestNlhPlan()` — the pre-multi-leg Design Ingestion tab's simulated-
     ingest handlers (fabricate a fake ingested-plan record; touch nothing on either master).
     Predates the multi-leg work, per the prior session's note.
     - Built two genuinely real handlers, `handleScMasterCsvUpload(e)` and
       `handleAvailCsvUpload(e)`, mirroring LMDC Master's own already-working
       parse/validate/apply-through-engine/flag-the-row pattern rather than inventing a new one:
       match rows by SC Code against the real registry (bulk **edit** of known SCs — like LMDC's
       uploader, this does not create brand-new SCs; "+ Add SC" still owns that), validate every
       provided column against its real constraint (Zone ∈ North/South/East/West, SC Type ∈
       LMSC/FMSC/Hybrid with the same MDC-node guard `submitAddSc()` uses, numeric fields parse
       cleanly, Open/Close match `HH:MM`, Hold Time is On/Off, Vehicle Type is RLH-feasible), and
       flag the *whole* row (apply nothing from it) if anything fails — same convention as every
       other uploader in this app. SC Master's upload writes through Class A (name/zone), Class B
       (sortCap/volCap/scType + derived `dispatchesRLH`/`dispatchesNLH`), and Class D (docks,
       TP limits, speeds, hold-time fields, open/close, Ops Leads) exactly the way `submitAddSc()`
       does; Availability's upload updates an existing (SC, Vehicle Type) row in place or adds a
       new one, matching `legAvailRowAddSubmit`'s own add-or-update shape.
     - Each button now triggers its own hidden `<input type="file">` via its own ref
       (`triggerScMasterUpload`/`scMasterFileInputRef`, `triggerAvailUpload`/`availFileInputRef`)
       instead of sharing Design Ingestion's — same pattern LMDC Master already established. Both
       gated by the existing `isRlhCyclePast()`, and each has its own dismissible flagged-rows
       banner (`scMasterUploadErrors`/`availUploadErrors`), styled identically to LMDC's.
     - **Two real bugs caught by the standing compile-check discipline, not by re-reading the
       diff**: rewiring each button's `onClick` accidentally swallowed a sibling wrapper `<div>`
       in the process (the search/filter row's own opening tag, dropped in both the SC Master and
       SC Vehicle Availability edits) — invisible in isolation, but Babel's JSX balance check
       failed immediately on the next compile pass, pointing at a `</div>` seven levels away in
       the SC Master pager instead of the actual drop site, matching this project's own recurring
       lesson that a JSX structural error's reported line is rarely where the real cause is.
       Found by diffing the pre/post block manually, not by pattern alone. Both restored; compile
       passed clean on the next check.
  - **Verification**: compiled clean (`@babel/preset-react`) after every edit, not just at the
    end. Every new render binding introduced this session (`isLegCyclePast`'s consumers,
    `triggerScMasterUpload`/`scMasterFileInputRef`/`onScMasterFileChange`/
    `hasScMasterUploadErrors`/`scMasterUploadErrors`/`closeScMasterUploadErrors` and their
    Availability-side counterparts) individually confirmed present in `renderVals()`'s own
    returned object — the specific discipline that catches a `with(B)` scope bug, which has now
    bitten this project three separate times on unrelated work; none introduced here. The
    standalone engine harness was re-run for drift-safety even though this session touched no
    engine code — still 109 passed, 0 failed.
  - **No live render/browser test has been done on any of this** — same standing caveat as every
    session before it. This compiles clean and matches traced code paths; it is not yet confirmed
    working by an actual click-through.
  - **Still open, unchanged from before this session:**
    - No access-gating between the 3 landing cards (parked by explicit product decision).
    - Delete vs. Deactivate as separate functions on masters other than SC Master/LMDC Master
      (parked by explicit product decision).
    - The "future cycle already created before a deletion happens" cross-cycle edge case (parked).
    - Who can add a brand-new SC to the shared global registry (parked).
    - NLH's ingestion-sourced plans still carry stubbed SC coverage/volume for RLH's Route
      Scheduler picker (no real NLH solver exists).
    - NLH/FM Carting still have no Design Creation solver, Design Review, or Ops Alignment.
    - LMDC Master has no "Add new DC" flow of its own.
    - **Companion docs are now five full sessions stale** (last genuinely updated for the
      phase15/LMDC-rewrite state) — this session's two fixes are not reflected in
      `01_Complete_Context.md` through `PROJECT_CONTEXT.md` yet. Flagged again, same as every
      session since 2026-08-19.

- **2026-08-26 (third session)** — File-size optimization pass, split into two parts: a genuine
  code split (multi-leg engine → its own file) and one confirmed-dead single-line deletion. No
  behavior change anywhere; the point of this session was purely reorganizing/shrinking the file,
  not building anything new.
  1. **The multi-leg master-data engine moved to its own file, `engine.js`.** Previously a
     ~730-line block sitting directly above `class NDCApp` inside `v3.0-rlh-design-base.jsx`.
     It's pure JS — zero JSX, zero React, zero `with(B)` coupling — so it doesn't need Babel's
     transform at all; it's now loaded via a plain `<script src="engine.js">` in `index.html`,
     positioned after the React/Babel CDN tags and before the main file is fetched/compiled/
     eval'd. Classic (non-module) `<script>` tags on one page share a single global lexical
     scope, so `engine.js`'s functions/consts (`monthIsPast`, `setClassDField`,
     `resolveExistence`, `seedRLHMasterData`, all 63 of them) remain available to `class
     NDCApp`'s methods exactly as before — same bare-identifier calls, no imports, no `this.`,
     nothing in `class NDCApp` itself changed.
     - **Verified safe before touching anything, not just after**: checked programmatically (not
       by inspection) that none of the 63 top-level names `engine.js` declares collide with
       anything declared elsewhere in the app file, and that every one of those 63 is referenced
       from somewhere (either `class NDCApp`/`View()`, or another function inside `engine.js`
       itself) — so the split introduces zero orphaned exports and zero silent shadowing.
     - **Then verified again after the split, by actually running it**, not just compiling it:
       a Node `vm`-based simulation reproduces index.html's real load sequence — `engine.js`
       runs first in a shared context (stubbing just enough of `React`/`document`/`window` for
       the class definition and mount lines to execute), then the Babel-compiled main file runs
       via indirect eval in that SAME context, exactly like the browser's `(0, eval)(compiled)`
       call does. All 63 engine identifiers resolved correctly as bare globals, and the compiled
       main file executed against them with zero `ReferenceError`. This is the strongest
       confirmation available without an actual browser render — full end-to-end proof of the
       shared-scope mechanism, not just "it typechecks."
     - The standalone verification harness (`tooling/dataLayerHarness.js`) was re-run against a
       fresh copy of the new `engine.js` (plus its `module.exports` line, Node-only, absent from
       the browser file) — still 109 passed, 0 failed, confirming zero functional drift from the
       extraction.
     - **Side benefit**: the harness's own extraction step (previously: manually carve a
       substring out of a 15,000+-line file by line-number markers) is now a straight file copy
       of `engine.js` plus the exports line — simpler and less error-prone going forward.
     - `index.html` updated: new `<script src="engine.js">` tag, plus updated inline comments
       explaining the load order. `context.md`'s own "The 3 files" section became "The 4 files."
  2. **Deleted one confirmed-dead line**: `'rlh.rlhDocks2': { class: 'D', leg: 'rlh' }` in
     `FIELD_CLASS` — a single-line leftover whose own inline comment already said
     `// (kept distinct key name unused; rlh.docks above already covers RLH Docks)`. Confirmed
     zero references anywhere in the app (`FIELD_CLASS` is only ever looked up by exact key,
     never enumerated, so nothing could have been reading this entry). This is the one item from
     this session's "what's stale" review that was a genuine accidental leftover rather than a
     deliberately-preserved decision — see item 3 below for what was explicitly left alone and
     why.
  3. **Explicitly NOT touched, on purpose** — several other things surfaced as "stale-looking"
     during this same review turned out to be *deliberately* preserved dead code with their own
     documented "don't remove without a product decision" reasoning already on record in this
     file's own prior entries, which is a different category from an accidental leftover:
     `pastNav`/`isPastCycle`/`cyclesummary` (the retired cosmetic past-cycle nav mode, ~13
     references), `remindedPlans`/`onNudge` (the removed "Nudge reviewers" plumbing, 6
     references), the whole Command Center module (hidden, not deleted, "retrieve it later"),
     and the `feas: ['RLH']` Vehicle Master field (still read by Route Planner's own filtering).
     None of these were removed this session — flagging here so a future pass doesn't assume
     "stale code cleanup" already covered them.
  - **No live render/browser test has been done on any of this** — same standing caveat as every
    session before it. The `vm`-based shared-scope simulation above is a genuinely strong proxy
    for "the split doesn't break the loading mechanism," but it stubs React/DOM rather than using
    the real thing, so it cannot catch a rendering-level issue — only a scope/reference issue.
    Deploy-testing the actual page load is still the real confirmation.
  - **Files changed this session**: `v3.0-rlh-design-base.jsx` (engine block removed, replaced
    with a pointer comment; `rlhDocks2` line was already gone since it lived inside that removed
    block), `engine.js` (new file), `index.html` (new script tag + updated comments),
    `context.md` (this entry + the "4 files" table update + a new section on `engine.js`'s
    relationship to the rest of the app).

- **2026-08-27 — SC-DC Mapping (Node Mapping), Phase 0.** First build session against
  `08_Handover_SC-DC_Mapping.md`'s spec — a build spec, not a record of prior work, so everything
  below is genuinely new. Preceded by a discussion pass that meaningfully re-scoped several parts
  of the original spec before any code was written; recording the outcomes here since the
  original handover doc itself doesn't reflect them.

  **Decisions made this session (supersede the equivalent open items in the handover doc):**
  1. **Step 1 (Cluster Definition) — no distance hint at all.** Plain SC multi-select, hard
     minimum of 2 SCs before advancing (matches the handover's own "redirect to RLH v3 Route
     Planner instead" rule for a would-be 1-SC cluster). The handover's proposed 2–16km/42km
     coloring heuristic was explicitly rejected as over-claiming precision the source paper's own
     two data points don't support.
  2. **Step 2 (Eligibility & Consolidation Preview) — the entire eligibility-COMPUTATION step is
     deferred, not just its override UI.** No nearest-SC-within-50km logic, no Tier-3
     pincode-split-fallback detection, no "read-only system-computed table" — V1 instead has the
     planner directly, manually specify which DCs go into the run alongside the SCs picked in
     Step 1. This is a bigger scope cut than the handover anticipated (it only asked "what should
     the override UI look like," assuming the computation itself would exist) — flagging clearly
     so a future session doesn't assume eligibility computation is quietly still in scope.
  3. **ρ (cross-SC migration penalty) — a slider, hard-bounded 0–1, default 0.2.** The handover
     flagged that the source paper gives a default but no stated bounds; 0–1 was chosen as a
     product decision, not derived from the paper.
  4. **The hilly-terrain / cross-SC distance-accuracy caveat (§4) is dropped entirely, not
     deferred.** Confirmed the reason directly: **production runs on real Google distances, not
     the paper's Haversine×1.3 approximation** — the underestimation problem the paper's own
     Guwahati-cluster benchmark found (+9.3% regression) is specific to that approximation method
     and doesn't apply to how this actually gets built. The *other* §4 caveat (dock scheduling not
     yet integrated into the v4 DS pipeline — arrival time, D0 flag, hold time, TAT are unreliable
     in this run's results) is unrelated to distance methodology and **stays in scope**.
  5. **Pincode-chaining in the reassignment diff table (§7) — explicitly parked, not decided.**
     Raised as a real open question (does the "chain pincode-grouped DCs so they can't be
     independently accepted/rejected" constraint from the handover still make sense once
     eligibility computation itself — decision #2 above — is deferred, since that's where
     pincode groups would normally get identified in the first place?) and deliberately left
     unresolved rather than guessed at. Revisit when Phase 4 (the diff screen) actually gets
     built — don't assume either answer in the meantime.
  6. **Module accent color: forest green** (distinct from Route Planner's navy `#003F98` and
     Route Scheduler's teal `#0D7377`; exact hex not yet chosen — pending Phase 1's actual UI
     work). Considered and rejected: amber/gold (too close to the app's existing `#C77B00`
     warning color), deep purple/violet (already carries a *status* meaning elsewhere — "Pushed
     Without Alignment" — reusing it for a module identity risked blurring that distinction).

  **Phase 0 build — data-model scaffolding only, no UI yet:**
  - New transactional key `mappingRuns`, added to `engine.js`'s `RLH_TRANSACTIONAL_KEYS` array.
    Node Mapping is nested inside RLH's own tier strip (not a peer leg the way NLH/FM are), so
    this rides the exact same per-cycle sync mechanism (`componentDidUpdate()` →
    `extractRlhTransactional()`/`rlhCycleData[month]`) every other RLH transactional field
    already uses — zero new plumbing, same mechanism proven since the 2026-08-26 cycle-scoping
    work.
  - `emptyRlhTransactional()` updated to default `mappingRuns: []` for a brand-new cycle.
  - `buildSeed()` (in the main jsx file) updated to return `mappingRuns: []` in its output object
    — necessary so the 5 historical seeded months (May–Sep, derived from the one July dataset via
    `retargetMonthStrings()`/`suffixRlhIdsForMonth()`) capture a real empty array rather than
    `undefined` when `extractRlhTransactional()` runs against them at construction time.
  - Documented the intended `mappingRun` record shape as a comment in `engine.js` (id, name,
    status, `scCodes`, `dcCodes`, `params` — `rho`/`hw`/`refRunId`/`spanCostOn`/
    `baselineSource`/`baselinePlanId` — `createdAt`, `committedAt`, `results`) — not yet wired
    into any UI or write path; this is the target shape Phase 1+ will build against.
  - **Status lifecycle: `Draft → Running → Completed → Committed`.** Deliberately not reusing
    "Finalised" as the terminal state name — that word means "went through RLH's full
    Push→Alignment→Acknowledge→Finalise lifecycle" everywhere else in this app, which this module
    has no equivalent of (per the handover's own framing: diff-review-and-commit, not
    Ops-Alignment).
  - **Commit target confirmed**: a committed mapping will write into LMDC Master's existing
    per-DC `scCode` field (`materializeLmdcEntities()` already exposes this as `lmscCode:
    dc.scCode`) via the same `setClassDField()` mechanism every other LMDC Master edit already
    uses — not a new parallel structure. Not yet wired (Phase 5's own work); confirmed as the
    target now so Phase 0's entity shape doesn't need to change later.
  - **A real architecture limitation, checked directly rather than assumed**: traced
    `triggerRuns()` (the mechanism behind Design Creation's "Trigger" button) and confirmed it's
    a pure `setInterval` ticker — it does not regenerate route/DC composition from live pool
    membership; RLH's actual routes come from data fixed at `buildSeed()` time (or cloned across
    the 5 seeded months). This means a committed SC-DC Mapping reassignment will correctly update
    LMDC Master and everywhere else that reads a DC's owning SC, but will **not** cause a
    subsequent Route Planner trigger to visibly place that DC on a different SC's routes, since
    Design Creation doesn't recompute from scratch today. Flagging this now, plainly, rather than
    letting Phase 5's commit-confirmation copy silently overclaim — matches this app's own
    established "state gaps plainly, don't invent" convention (same treatment as `round_trip_tat`
    showing `—`).
  - **Verification**: added 3 new assertions to the standalone harness (`RLH_TRANSACTIONAL_KEYS`
    includes `mappingRuns`; `emptyRlhTransactional()` defaults it correctly; `extractRlhTransactional()`
    captures it alongside every other field) — harness now **112 passed, 0 failed** (up from 109).
    Re-ran the full `vm`-based shared-scope simulation (the one built during the `engine.js` split
    session) against the updated files — still passes clean. Compiled the main file via Babel
    after the edit. **One caveat, stated plainly**: the `buildSeed()` edit itself (adding
    `mappingRuns: []` to its return object) was verified by direct inspection plus the harness's
    coverage of the exact mechanism it feeds into (`extractRlhTransactional`/
    `emptyRlhTransactional`), not by an end-to-end simulation of `buildSeed()` actually running —
    that would require a full React render, which no session on this project has ever done. Same
    standing limitation as everything else here.
  - **Nothing user-visible changed this session** — no new screen, no new nav entry, no new
    button. Phase 0 is purely the data-model foundation Phase 1 (the wizard's first two steps)
    will build against next.
  - **Next up**: Phase 1 — Step 1 (SC multi-select, min 2) and the re-scoped Step 2 (manual DC
    group input) of the wizard, per the decisions above.

- **2026-08-27 — SC-DC Mapping, skeletal build (all remaining phases).** Full data flow and
  navigable UI, end to end: entry landing → 4-step wizard → run queue → results (Cluster Summary
  / Reassignment Diff / Unserved DCs). Real state machine and real writes; visual polish and the
  simulated-solve formula are deliberately simpler than a fully-tuned version, per the explicit
  "skeleton first, then guide refinement" framing this session was built under. Preceded by a
  fourth round of open-item resolution (below) before any code was written.

  **New decisions this round (supersede/extend the prior session's list):**
  1. **Real end-to-end flow, grounded in existing app machinery.** The actual design: (a) the
     module starts from AutoDML's current state, (b) the planner selects SCs + a DC group
     (including DCs AutoDML has never mapped), (c) the planner accepts/rejects suggested
     mappings and the accepted ones become real migrations, (d) committing a migration updates
     AutoDML's own record so the *next* SC-DC Mapping run — and Design Creation's existing
     "Additions, closures & migrations — resolve before planning" pre-plan gate — see it. This
     mapped cleanly onto data structures that already existed and were already wired into a real
     screen (`migrations`/`nodeAdditions`/`nodeChangesUnified`, feeding `nodeStepMeta` in Node
     Inputs) rather than needing anything invented.
  2. **Unserved DCs (§8) simplified to coverage-only.** No retry/reassign/exclude actions in this
     UI — the DS solver handles resolution; this screen just flags which DCs from the input group
     didn't get mapped. Confirms and narrows the "manual reassignment only" option discussed
     previously.
  3. **Commit timing — cycle-versioned write, confirmed with a worked example** (DC `GGN01-455`
     reassigned in August; July's view stays unaffected; September inherits the change once
     touched) — the same mechanism every other engine field already uses, not a new concept.
  4. **No explicit "Revert this commit" action in V1** — since commits are cycle-versioned like
     everything else, correcting a bad mapping is just "run another mapping (or edit LMDC Master
     directly) in the current or a later cycle," the same way there's no dedicated undo for a
     mis-set Sort Capacity today.
  5. **Real many-to-many Pincode field added to LMDC Master**, feeding a genuine constraint (same-
     pincode DCs always land on the same suggested SC) rather than a UI-only "chaining" concept.
     A DC can list several pincodes; a pincode can appear on several DCs. Implemented via
     Union-Find (`groupDcsBySharedPincode()` in `engine.js`) so the relationship is correctly
     transitive — DC-A and DC-C sharing no pincode directly, but both connecting through DC-B,
     still end up grouped together. This is the one piece of "real DS logic" this skeleton
     actually implements faithfully rather than stubbing, since the product conversation was
     specific about the mechanism.

  **What got built:**
  - **LMDC Master gained a real Pincodes column** — many-to-many, comma/semicolon-separated free
    text (matching the existing `pocs` CSV-parsing convention), inline-editable and CSV
    upload/download-able, same pattern as every other LMDC field. Required extending the table's
    `grid-template-columns` (both header and body rows, kept in exact sync — the specific class of
    bug flagged in this project's own history) and the CSV template/upload/export logic.
  - **`groupDcsBySharedPincode()`** — pure Union-Find helper in `engine.js`, harness-tested
    including the explicit transitive-bridge case (6 new assertions; harness now **118 passed, 0
    failed**, up from 112).
  - **The full class-method layer**: `goMapping()`, wizard navigation (`mapToggleSc`/`mapAddDc`/
    `mapRemoveDc`/`mapSetParam`/`mapNext`/`mapBack`), `mapTriggerRun()` (real blocking validation
    on missing SC Sort/Volume Capacity/HTP — a deliberate exception to this app's usual warn-
    don't-block convention, matching the build spec's own explicit call-out), `computeMappingResult()`
    (the simulated solve — deterministic, haversine/hash-based like everything else in this app,
    reuses `NDC_haversineKm`/`NDC_costPerKmFor` rather than inventing new distance/cost math),
    `mapDecideLane()`, `mapOpenResults()`, and the two commit paths (`mapAcceptAllAsSolved()`,
    `mapCommitSubset()`) both routing through `mapCommitLanes()` — the shared write-through that
    appends real `migrations` entries (or resolves a pending `nodeAdditions` row) and updates LMDC
    Master's `scCode`.
  - **The render-bindings method is `scDcMapVals()`, not `mapVals()`.** A real collision was
    caught and avoided before it happened: `mapVals()` already exists and is the bindings method
    for RLH's own Network Map feature, already spread into `renderVals()`. Defining a second
    method with that name would have silently overwritten Network Map's entire rendering logic —
    the exact class of naming-collision bug this project has hit before (`uploadFile`, `stageSub`,
    `hwGlobal`). Caught by checking every planned method name against the file *before* writing
    any of them, not after — all 15 other new method names (`mapToggleSc`, `mapTriggerRun`,
    `computeMappingResult`, etc.) were confirmed collision-free the same way.
  - **The full JSX**: entry landing, 4-step wizard (Cluster Definition / DC Group / Baseline &
    Parameters / Preview & Trigger, with a working stepper and Back/Next/Trigger nav), run queue
    (reusing RLH's own ticker pattern), and the results screen's three tabs (Cluster Summary with
    CPS delta — reusing RLH's own existing `Cost/Volume` CPS formula rather than inventing a new
    one; Reassignment Diff with per-lane Accept/Reject and a pincode-chained-DC visual flag; a
    coverage-only Unserved DCs list). Wired into Design Creation's Node Mapping tier; NLH/FM
    Carting's own Node Mapping tiers are untouched and still show "Coming Soon."
  - **A real bug introduced and caught mid-session, not shipped**: an early class-method insertion
    accidentally consumed `submitAddVeh()`'s own method-signature line (the str_replace's anchor
    text matched more broadly than intended). Caught immediately by the standing compile-check-
    after-every-edit discipline — Babel's error pointed at a syntax break several hundred lines
    away from the actual cause, requiring a short trace to find where the signature had gone
    missing, not just where the parser first complained. Fixed, then explicitly re-verified
    `submitAddVeh()`'s signature was back to exactly one occurrence before continuing.
  - **A second, harder bug, same session, worth recording precisely**: wiring the module into
    Design Creation's Node Mapping tier initially produced "Expected corresponding JSX closing tag
    for `<>`" pointing at a `</div>` far from the real cause. Root cause: the original code had ONE
    outer fragment wrapping two siblings (a subfork-row ternary + an unconditional coming-soon
    div); the fix needed to turn that into "the real module OR the original coming-soon content,"
    but the first attempt *replaced* the outer fragment's shape entirely instead of *nesting*
    inside it — silently changing the closing-tag count needed at the end without any single line
    looking wrong in isolation. Diagnosed with a purpose-built stack-based bracket-balance script
    (tracks `<div>`/`</div>`/fragment-open/fragment-close as a LIFO stack, correctly ignoring
    self-closing `<div .../>` tags) run from a known-good anchor far above the edit, which pinpointed
    the exact line where the OUTER fragment was left open. This is now the standing tool for any
    future JSX-nesting problem in this file — faster and more precise than eyeballing indentation
    or trusting Babel's own error line, which (as here) can be many lines away from the actual
    defect. **After the real fix, the same script was re-run from the true outer anchor
    (`{(isCreation) ? (<>` at line 1634) all the way through this entire new module — zero
    mismatches, stack ends empty** — the strongest confirmation available short of an actual
    render that the nesting is genuinely correct, not just passing Babel by coincidence.
  - **Full `with(B)` binding audit, done programmatically, not by inspection**: every one of the
    56 new bare identifiers used across the new JSX (`mapStep`, `onMapTrigger`, `mapLaneRows`,
    etc.) was extracted via script and individually checked against `scDcMapVals()`'s actual
    returned object — all 56 confirmed present, zero missing. This is the specific discipline that
    catches the `with(B)` scope-bug class that has bitten this project multiple times on unrelated
    work (most recently the `nlhPicked`/`stageSub`/`hwGlobal` incidents) — none introduced here.
  - **Verification, final state**: full-file Babel compile clean; harness 118/118; LMDC's two
    `grid-template-columns` strings confirmed still in sync (16 tokens each); `submitAddVeh()` and
    `mapVals()` (Network Map) confirmed present exactly once each, untouched in substance.
  - **No live render/browser test has been done on any of this** — same standing caveat as every
    session before it, and more load-bearing than usual here given how much new surface area this
    session added. The stack-based balance check and the binding audit are both strong proxies for
    "this won't throw a JSX or ReferenceError on load," but neither substitutes for actually seeing
    the wizard render, clicking through a run, and checking the diff table's numbers look sane.
    Deploy-testing this module specifically is the natural next step before trusting it further.
  - **Explicitly deferred / not built this session, unchanged from the discussion**: Step 2's
    eligibility computation (nearest-SC-within-50km, Tier-3 pincode-split detection) — DCs are a
    pure manual input; the "Review DCs" per-DC drill-down inside a lane (only lane-level
    Accept/Reject exists so far); a real re-solve on "Commit accepted subset" (this skeleton
    commits the accepted subset directly rather than re-triggering the queue a second time — see
    `mapCommitSubset()`'s own comment); any visual/UX polish pass (hover states, loading
    transitions, empty states beyond the basics).
  - **Files changed**: `v3.0-rlh-design-base.jsx` (LMDC Master's Pincodes column; the full
    SC-DC Mapping state, class methods, and JSX), `engine.js` (`groupDcsBySharedPincode()`),
    `context.md` (this entry).

- **2026-08-28 — Cosmetic cleanup, Phase A (sidebar badges + sub-tab counts).** Grounded in a
  direct screenshot comparison against a reference design (same app, cleaner chrome) rather than
  guessing at scope — the reference kept every count that's genuinely content-navigation-relevant
  (Design Review's own "RLH Route Plan (18)" tab, its rail's "7 of 7" header) and removed only two
  specific things: sidebar nav badges, and the count-in-parens on Design Inputs' 4 sub-tabs. Scope
  narrowed to exactly that, not a blanket "remove every number in the app."
  1. **Sidebar badges removed** — Design Inputs' `inputChecks` count (amber), Ops Alignment's
     `needsDecision`/`awaitingFeedback` count (blue, both Planner and Ops Lead nav), and Network
     Map's static `NEW` tag (green). All three were pure presentation (`badge`/`tone` keys on the
     nav item objects); `hasBadge: !!it.badge` already degrades cleanly to "don't render" when the
     key is absent, so no defensive changes needed elsewhere.
     - Two now-orphaned local variables cleaned up as a direct consequence: `inputChecks` (was
       computed solely to feed the removed badge, no other reader anywhere) and `inputsTabCount`
       (same story, and existed as two separate near-duplicate declarations in two different
       methods per an existing comment explaining why — both removed, not just one).
  2. **Design Inputs' 4 sub-tab labels lost their `(N)` count** — `Volume Inputs (4)` →
     `Volume Inputs`, etc. — but the existing (ⓘ) hover-tooltip next to each label was **left
     completely untouched**, both the mechanism (`.ndc-tip`/`.ndc-tip-pop`, already built and
     already used in three other places in the app — `mastersTabs`, `nodeSteps`, `ingTabs`) and
     its content (`IT_TIP`, already reasonable, e.g. "AutoDML-sourced node list for this cycle.
     Review any flagged nodes before proceeding."). This wasn't something to build — it already
     existed and already matches the "quick one-line hover hint" half of the definition-box
     design confirmed this session; only the numeric count needed to go.
  3. **Investigated, found already correct, left alone**: the "Masters — shared across all design
     cycles" banner, suspected from a screenshot comparison to be mis-styled as a warning. Checked
     the actual rendered JSX directly — it's already neutral-styled (gray `#F2F5FA` background,
     gray icon, not amber) — the only occurrence of this text in the whole file. Concluded the
     apparent warning-vs-info difference between the two screenshots was most likely a rendering/
     export artifact (design-mockup export vs. live browser screenshot), not a real code bug, and
     did not change anything here rather than "fixing" something that wasn't actually broken.
  - **Verification**: compiled clean; harness still 118/118 (untouched this pass); confirmed via
    direct JSX inspection that the badge `<span>` conditionals (`{(item.hasBadge) ? (<>...</>) :
    null}`) render nothing at all now rather than leaving an empty pill artifact.
  - **Still to come, per this session's discussion**: a much larger pass — sweeping decorative/
    explanatory text added across the app's history (not just this module) per an agreed rubric
    (keep: validation messages, confirmation-dialog copy, column/status labels, mandatory build-
    spec caveats, functional hints; remove: descriptive subtitles, tour-guide-style narration),
    and replacing it with one consistent "definition box" component per page/tab (relevance +
    action, styled like the Masters banner above) — confirmed this session to sit ALONGSIDE the
    existing (ⓘ) tooltips, not replace them: tooltip = quick one-line hint, box = the fuller
    context. Not yet started; scope is confirmed but the sweep itself hasn't begun.

- **2026-08-28 (later same day) — Cosmetic cleanup, Phase A extended app-wide.** Requested
  explicitly as "perform the same across this app, not just the tabs we discussed" — Phase A's
  count/badge removal, done comprehensively rather than only on Design Inputs. Searched the whole
  file systematically (every `_tab()`-shaped construction, every ` (' + n + ')'` label
  concatenation, every `.count` render) rather than guessing which screens might have the same
  pattern, and found **8 more instances** beyond the 3 already fixed earlier today:
  - **Label-concatenation instances** (count baked directly into the tab's label string):
    `mastersTabs` (Node & Vehicle Master's 4 sub-tabs — "Sort Center Master (80)" → "Sort Center
    Master", etc.) and `nodeSteps` (Node Inputs' own internal step tabs).
  - **Separate-`count`-property instances** (rendered as `{label} {count}` or `{label} · {count}`
    next to the label): `alignFilterSeg` and `opsFilterSeg` (Ops Alignment's 2×2 status-filter
    grid, both personas), `schedAlignFilterSeg` and `schedOpsFilterSeg` (Route Scheduler's own
    equivalent), and 4 separate zone-chip constructions (`zoneChipsStep1` on Design Creation,
    `reviewSchedZoneChips`/`schedAlignZoneChips`/`schedOpsZoneChips` on Route Scheduler's Design
    Review and Ops Alignment). Fixed at the render layer (stopped displaying `{x.count}`), left
    the underlying `count:` computation in each object untouched — same conservative "strip from
    display, don't risk touching data" approach as the sidebar badges, and harmless to leave since
    nothing else reads that specific property once it's not being rendered.
  - **A genuinely useful discovery made along the way**: Ops Alignment's own zone chips
    (`alignZoneChips`/`opsZoneChips`) were *already* rendering with no count at all
    (`{z.label}`, nothing else) — meaning the "plain label, no count" style wasn't something being
    invented here, it already existed as the more common pattern in this exact codebase. This
    round brings the remaining 8 spots in line with that, rather than introducing a new style
    from scratch.
  - **Checked and explicitly did NOT touch**: the CTIER/RTIER tier-strip "SOON" tags (Node
    Mapping, etc.) — those are status flags ("this isn't built yet"), not decorative counts, and
    the reference screenshot that prompted this whole cleanup pass showed an equivalent tag kept,
    not removed. Also checked NLH/FM Carting's own `legTabs` (mirrors RLH's 4-tab Design Inputs
    shape) — already had no count to begin with, confirmed clean by inspection rather than assumed.
  - **One assumption from the earlier same-day entry turned out to be wrong, corrected here**: that
    entry expected Design Review's tab strip to have a kept `"RLH Route Plan (18)"`-style count
    that needed preserving as an exception. Checked the actual `RTIER` construction directly — our
    real code's Design Review tab label is plain `'RLH'`, no count baked in at all. The `(18)` in
    the reference screenshot was from a different mockup than what's actually in this codebase, so
    there was never an exception to carve out here — good that this got verified against the real
    code rather than assumed correct from the earlier entry.
  - **Verification**: compiled clean; harness still 118/118 (untouched, engine-layer work); a
    final grep confirmed zero remaining `.count` renders and zero remaining label-concatenated
    counts anywhere in the file; confirmed the sidebar's `hasBadge` mechanism itself is harmless to
    leave in place structurally (evaluates to `false` for every nav item now, same "leave the
    plumbing, remove the usage" approach as the rest of this pass).
  - **Still not started**: the decorative-text sweep and the definition-box component itself (both
    scoped and confirmed earlier today, per the discussion log above) — this entry is scope-limited
    to finishing the count/badge removal comprehensively before that larger piece begins.

- **2026-08-29 — SC-DC Mapping re-architected: Node Inputs restructuring + real Design Review
  Stage 1/Stage 2.** A significant product-direction revision, discussed thoroughly before any
  code was touched — this explicitly **reverses** the original build spec's framing that SC-DC
  Mapping should avoid RLH's own Ops-Alignment-style lifecycle. It now gets a real Design Review
  → Ops Alignment flow, much closer to RLH's own shape than originally scoped. Recording that
  reversal here plainly, per this project's own standing convention, rather than silently
  overwriting the earlier framing.

  **Decisions confirmed before building (condensed):**
  - Node Inputs renamed "SC-DC Connections"; "AutoDML node view" renamed "AutoDML Actions"; the
    combined Additions/Closures/Migrations tab splits into two: Additions & Closures, and a
    separate Migrations tab.
  - SC-DC Mapping's Step 2 (DC Group) is no longer a manual picker — it's auto-computed: active
    AutoDML links (LMDC Master's own `lmscCode`) for the selected SCs, plus unmapped
    `nodeAdditions`, minus anything in `nodeClosures`.
  - Results move out of SC-DC Mapping's own screen entirely and into Design Review, organized at
    **plan level** (not per-SC), as a flat DC-level list showing old SC → new SC per row.
  - Accept/Reject granularity is **per-DC**, with optional remarks. Unserved DCs get a third
    outcome: one that had a prior SC shows old-SC/blank-new-SC with a single "Keep on Old SC"
    action (no Accept option, since there's no proposed SC to accept); a genuinely new unserved DC
    shows both blank with no action at all — just flagged.
  - Once every flagged DC is decided, the view reorganizes to **SC level** — Total/Unchanged/
    Removed/Added per SC, live-updating as decisions are made (not just after commit).
  - Full flow confirmed as **two stages**: **Stage 1** (per run, pre-commit) = DC-Level Changes →
    SC Pivot Summary → Finalise preview (SC-level view + a new SC×SC movement matrix) → Commit.
    **Stage 2** (per SC, post-commit) = one plan **card** per SC (mirrors RLH's own Design Review
    card convention), each independently pushable to Ops Alignment — matching RLH/Scheduler's own
    per-SC push convention, not a whole-run push.
  - Rejected changes flowing back into the Migrations tab as a "pending pipeline," and the exact
    Ops Alignment table/feedback-field format, are both **explicitly deferred** — "we will frame
    this in the next step." Nothing built here should be read as a design decision on either.

  **What got built:**
  1. **Node Inputs restructuring** — `nodeStepMeta`'s three steps relabeled/split
     ("AutoDML Actions", "Additions & Closures", "Migrations"); the previously-unified
     `nodeChangesUnified`-derived table now filters into `nodeChangesAC` (flag ≠ Migration) and
     `nodeChangesMig` (flag = Migration), each with its own tab — no data-model change needed,
     `nodeChangesUnified` already carried a per-row `flag` field. NLH/FM's own "Node Inputs" tab
     deliberately left as-is (still a blank stub, no AutoDML concept behind it).
  2. **`mapComputeEligibleDcs(scCodes)`** — new shared method, used by both Step 2's preview and
     `mapTriggerRun()`'s actual stored DC list, so the two can't drift apart. Replaces the entire
     manual add/remove picker UI and its backing state (`mapDcPicker`, `mapAddDc`/`mapRemoveDc`,
     the unmapped-candidate chip row) — all removed cleanly, confirmed zero orphaned references.
  3. **`computeMappingResult()` rebuilt around a `dcRows` array** (one row per DC: `oldSc`,
     `newSc`, `isUnserved`, `isUnchanged`, `needsDecision`) instead of lane-first grouping — lanes,
     unserved lists, and per-SC aggregates are now *derived* from `dcRows`, not computed
     separately, so they can't disagree with each other. `needsDecision` correctly excludes
     unchanged rows and new-unserved rows (nothing to decide) while including moved rows and
     unserved-with-prior-SC rows (the "Keep on Old SC" case).
  4. **The old lane-based decide/commit mechanism replaced wholesale**: `mapDecideLane`/
     `mapAcceptAllAsSolved`/`mapCommitSubset`/`mapCommitLanes` are gone; replaced by
     `mapDecideDc()` (per-DC, with remark), `mapAllDecided()` (the gate), `mapGoFinalise()`/
     `mapBackToDecide()` (Stage 1 sub-navigation), `mapCommitRun()` (the real write-through —
     same migrations/nodeAdditions/LMDC-update logic as before, now iterating decided DC rows
     instead of accepted lanes), and `mapPushScToAlignment()` (Stage 2's per-SC push). State
     renamed `mapDecisions` → `mapDcDecisions`, now `{ [runId]: { [dcCode]: {decision, remark} } }`
     instead of a bare per-lane string.
  5. **SC-DC Mapping's own "results" screen (Design Creation) trimmed to a redirect** — the old
     Cluster Summary/Reassignment Diff/Unserved DCs tabs are gone from there; it now just confirms
     the run completed and links to Design Review, where all of that content actually lives now.
  6. **New `reviewMapVals()` render-bindings method** for Design Review's Node Mapping tier —
     every single key deliberately prefixed `reviewMap`, not `map`, specifically to avoid
     colliding with the *pre-existing* `mapVals()` (Network Map's own bindings, already spread
     into `renderVals()`, already using short names like `mapHasResults`). Checked this
     explicitly before writing a single key, same discipline as the `scDcMapVals()`-vs-`mapVals()`
     near-miss a few sessions back — this is now the third time this exact collision class has
     been checked for proactively in this module alone.
     - `effectiveSc(r)` — a small shared resolver folding current decisions into each DC row's
       real outcome (accepted → new SC; rejected/undecided/kept → stays put). Both the live SC
       Pivot Summary and the Finalise-stage SC×SC matrix read through this one function, so they
       can never show inconsistent numbers for the same decisions.
  7. **Full Design Review JSX**: run picker → Stage 1 (tab strip: DC-Level Changes / SC Pivot
     Summary, each fully wired; "Keep on Old SC" rendered as a single button in place of the
     Accept/Reject pair specifically for unserved-with-prior-SC rows) → gated "Proceed to
     Finalise" (disabled with an explanatory label until every flagged DC is decided) → Finalise
     preview (SC-level table reused from the pivot, plus the new SC×SC matrix, rendered as a real
     grid) → Commit → Stage 2 (one card per SC, Total/Unchanged/Removed/Added, independent Push to
     Alignment button per card, already-pushed cards show a status pill instead).
  - **Two of the same self-inflicted mistake caught this session, both immediately, both fixed**:
     a `str_replace` anchored on a bare method name (`finaliseVals() {`) consumed the signature
     line twice across two separate edits in this session — once while removing the old lane-based
     commit block, once while inserting `reviewMapVals()`. Both caught by the very next
     compile-check (a missing method definition throws immediately), both fixed by restoring the
     line. Same class of mistake as the `submitAddVeh()` incident two sessions ago — worth stating
     plainly that this is now a recurring failure mode of large `str_replace` edits specifically
     around adjacent method boundaries, not a one-off.
  - **Verification, full discipline applied throughout, not just at the end**: compiled clean
    after every individual piece (Node Inputs split, `mapComputeEligibleDcs`, the results-screen
    trim, `reviewMapVals()`, the full JSX insert); ran the purpose-built stack-based bracket-
    balance script (built two sessions ago for exactly this) across the *entire* `isCreation` block
    and the *entire* `isReview` block after the respective edits — zero mismatches, stack empty,
    both times; extracted and cross-checked all 20 new `reviewMap`-prefixed identifiers used in
    the new JSX against `reviewMapVals()`'s actual returned keys — all present, nothing missing.
    Harness held at 118/118 throughout (no engine-layer changes this session).
  - **No live render/browser test has been done on any of this** — same standing caveat as every
    session before it, more load-bearing than usual given the size of what changed. The stack
    check and binding audit are strong proxies for "won't throw on load," not "renders and behaves
    correctly" — deploy-testing this flow specifically (trigger a run, decide some DCs, finalise,
    commit, check the LMDC Master/Node Inputs write-through) is the real next confirmation.
  - **Explicitly not built this session, by design — see "explicitly deferred" above**: Ops
    Alignment's own real content for the Node Mapping tier (still the original "Coming Soon" stub
    — a minimal per-SC push acknowledgment is the natural next piece, table/feedback format still
    deferred); the Migrations tab's "pending pipeline" view of rejected changes (the decision data
    already exists in `mapDcDecisions`, just not yet surfaced there).

- **2026-08-31 — Real `with(B)` scope bug, found by the user's own deploy-testing, fixed
  immediately.** Clicking the new "Additions & Closures" tab (from the previous session's Node
  Inputs split) threw `ReferenceError: nodeChangesAC is not defined`, crashing the whole render —
  the exact bug class this project has hit repeatedly (`nlhPicked`, `stageSub`, `hwGlobal`, and
  now this): a local variable computed inside a `*Vals()` method and used directly in JSX, but
  never added to that method's own returned object, so `with(B)` has nothing to resolve it
  against. **Root cause, precisely**: when `nodeChanges` was split into `nodeChangesAC` and
  `nodeChangesMig` last session, only `nodeChangesMig` got added to `inputsVals()`'s return
  object — `nodeChangesAC` was computed and used in the "Additions & Closures" table's own JSX
  but silently dropped from the export, a straightforward oversight during a two-variable
  addition where only one half was carried through. Fixed with one line
  (`nodeChanges, nodeChangesAC, nodeChangesMig` in the return object).
  - **This is exactly the bug class no compile check can catch** — Babel doesn't know
    `nodeChangesAC` is supposed to be a render binding vs. a typo; it only throws at the moment
    `with(B)` actually tries to resolve the bare identifier during a real render. The prior
    session's binding audits (checking `reviewMap*` and `scDcMap*` identifiers against their own
    methods' returns) were real and thorough, but this specific miss was in `inputsVals()` — a
    pre-existing method touched only incidentally as part of the Node Inputs split — which never
    got the same explicit audit pass the newer methods did.
  - **Did a full audit of `inputsVals()`'s return object against every `node`/`nstep`/`autodml`-
    prefixed identifier used in the Node Inputs JSX region after fixing the immediate bug**, not
    just patching the one reported symptom — confirmed no second miss lurking nearby
    (`nodeChangeUploadedBy`/`nodeChangeUploadedDate` and all three `nstep*` flags were already
    correctly exported; one apparent gap, `'nodes'`, turned out to be a false positive from plain
    JSX text content, not a binding reference).
  - **Verification**: full-file compile clean, harness 118/118 (untouched — this was a pure JSX/
    render-binding fix, no engine-layer change).
  - **Standing lesson, worth restating plainly**: any time an existing `*Vals()` method is
    extended with a new local variable that JSX will reference — even a "small" two-line addition
    like this split — the new variable needs the same explicit "is it in the return object?"
    check as a brand-new method gets. This session's miss happened specifically because the check
    was applied rigorously to new methods (`reviewMapVals`, `scDcMapVals`) but not re-applied to
    an old one being lightly touched. The audit discipline needs to trigger on *any* new binding
    introduced, regardless of whether the method itself is old or new.

- **2026-09-01 — Route Scheduler fixes + Ops Alignment restructure, three phases.** Large,
  multi-part session; discussed thoroughly before building (distance-model scope narrowed
  significantly mid-discussion — no haversine/node-to-node reconstruction needed, since Route
  Scheduler operates on an already-static plan and distance/speed on the existing values is
  sufficient — this simplified several downstream items).

  **Phase 1 — data foundations:**
  - LMDC Master gained a real `pocs` field (same shape/editing pattern as `pincodes`: column,
    inline edit, CSV template/upload/export), seeded 5-6 deterministic names per SC shared across
    that SC's whole DC pool (matches the real-world fact that ~100-150 DCs under one SC only have
    5-6 LM points of contact).
  - `deriveLmPocs(sp)` — unions POCs across every DC a plan touches, resolving the plan via
    `sp.parentPlanId` (not a wrong field initially guessed). `schedPersonaName()`'s LM branch now
    resolves to a real name instead of the old generic "LM Ops Lead" placeholder.
  - NLH plans reshaped as real per-SC records (`{id, scCode, status:'Finalised', trailers, ...}`)
    instead of generic uploaded-file records — `genNlhTrailers()` generates 10-15 deterministic
    trailers (landing time + volume) per SC. Seeded for all 5 months RLH already has data.
  - Route Scheduler's Step 1 manual "pick an NLH plan" UI removed entirely — each RLH SC now
    automatically pairs with its own same-code NLH plan for the current month. Traced through
    every consumer (Step 4 validation, the trigger-time defensive check, `buildSchedCard()`'s
    display, `step4NlhLabel`) rather than just the picker UI itself.

  **Phase 2 — Route Scheduler computation fixes:**
  - Dock-capacity search made genuinely hard-capped: converted per-route processing from
    independent (`routes.map`) to sequential (`routes.forEach`, tracking `realRouteSlotCounts` as
    it goes), so each route's dock-avoidance search checks both static Co-Loading lanes *and*
    every real route already assigned in the same pass — previously only lanes were checked, a
    gap the code's own comments had already documented. Proved out mathematically (if every slot
    ≤ capacity, total routes ≤ slots × capacity, so `dockUtilPct` can never exceed 100%) and this
    also fixes Dock Schedule's round-robin as a side effect.
  - Hold time restructured: avg (across routes with hold only, per direct confirmation) + max +
    lane count, merged into one boxed section.
  - Rollover % and LMSC-in→LMDC-out days — both built on one shared `connectionTimeFor()`
    resolver (next route dispatch at/after a trailer's ready-to-ship time, wrapping to tomorrow's
    earliest dispatch if missed). Caught and fixed a real bug in the first draft (a broken JS
    comma-expression that would have silently returned the wrong value) before it shipped, then
    verified the corrected version by hand-tracing the user's own worked example in Node:
    landing 31 Aug 20:00 → connects exactly 1 Sept 06:00, bit for bit.
  - Round-trip TAT — the actual fix for the long-standing `—` placeholder (`round_trip_tat` had no
    formula, per Vignesh). Confirmed no haversine needed; reuses the already-correct per-DC
    `breakdownTatHrs`, doubled for the return leg.
  - **A scoping correction caught by the user, not by me**: the initial pass removed Slot-Wise
    Dispatch from both the compact plan cards AND the detail pages. Only the detail-page removal
    was actually requested ("Dock Schedule tab already covers this" — true only where Dock
    Schedule exists as an alternative tab, which is the detail view, not the card). Restored
    `slotBreakdown` computation and the dropdown on all 3 cards; the 2 detail pages correctly
    keep it removed. Found and fixed a 5th block during this pass (`schedAlignDetail`, the shared
    Ops Alignment overlay) that the original 4-block survey had missed — caught by a `grep` sweep
    for leftover references rather than assuming the first pass was complete.
  - All of this replicates onto Ops Alignment's cards "for free" — `buildSchedCard()` is
    genuinely the single shared builder for Design Review and both Ops Alignment personas
    (confirmed by checking call sites directly, not assumed), so fixing the metrics there once
    covers all three screens.

  **Phase 3 — Ops Alignment restructure:**
  - Split into two genuinely separate, hard-scoped tabs (Stage 1 · SC/LH, Stage 2 · LM) on both
    the Planner's and Ops Lead's rails — a plan can never appear under the wrong stage's tab.
    Along the way, found and fixed `schedOpsStatusOf()`'s actual bug: it used to keep a stage2
    plan visible to SC/LH (pinned to "Acknowledged") instead of excluding it once pushed — this
    was corrected to return `null` for SC/LH once `schedStage === 'stage2'`, matching "cards move
    from Stage 1 to Stage 2," not "stay visible in both."
  - **This directly resolves the reported seed-data bug** ("stage 2 plans show pending feedback
    from SC & LH") — traced to its root: `schedStage`/`status` are set atomically in one place in
    the whole file (the push-to-LM action itself), so they were never actually out of sync at the
    source; the bug was purely that the Planner's OLD rail bucketed by `sp.status` alone with zero
    stage awareness, so a freshly-pushed stage2 plan (status: 'Pushed') showed under "Pending
    Feedback" with nothing indicating whose turn it actually was. Proved the fix with a real
    Node simulation reproducing the exact scenario before declaring it done, not just by reasoning
    about the code — the old logic really did show "Acknowledged"/no stage distinction; the new
    logic really does exclude it from Stage 1 and correctly surfaces it under Stage 2 · LM.
  - Removed the manual SC/LH/LM toggle entirely (both copies — the rail's own and a second one
    found inside the detail overlay's header that would have been missed by only checking the
    rail). Role is now derived via three new methods: `schedRoleForPersona(sp, name)` (POC
    membership lookup), `schedActiveRoleFor(sp)` (resolves the current top-right "Acting as" name
    to a role for one specific plan, with a sensible fallback if that name isn't a POC on this
    SC), and `schedGlobalRoleForStage(stage)` (a stated approximation for rail-level bucketing
    across many plans at once, since different SCs have different POC pools — checks the acting
    persona against every plan in the stage, first match wins). Converted all 8 functional call
    sites individually, checking in each case whether `sp` was already in scope rather than
    applying one blind find-replace. Cleaned up the now-orphaned `schedOpsRole` initial state and
    stale comments once nothing read it anymore.
  - SC can now propose TAT (previously Cutoff-only), with its own reason list distinct from LH's
    traffic/geography framing. Added live speed validation (distance ÷ proposed TAT < 20km/h) for
    both SC and LH's TAT proposals — recomputes as the value changes, before submission.
  - Accept All / Reject All added, plan-wide (iterates every route's pending items), with confirm
    modals matching RLH's own Accept-All styling exactly. Worth recording plainly: RLH itself only
    has an Accept-All (confirmed by search — no Reject-All exists there), so "replicate the RLH
    pattern" was itself asymmetric; both were built for Route Scheduler regardless, since both
    were explicitly requested.
  - **Files changed**: `v3.0-rlh-design-base.jsx` only — no `engine.js` changes this session.
  - **Verification, applied at every phase boundary, not just at the end**: compiled clean after
    every individual piece across all three phases; ran the stack-based bracket-balance script
    across the full Design Creation, Design Review, and Ops Alignment regions multiple times as
    edits landed — zero mismatches, stack empty, every time; harness held at 118/118 throughout
    (no engine-layer changes this session); did a real `with(B)` binding audit on every new
    identifier introduced, not just a compile-check, given this project's own history with that
    exact bug class; proved the point-7 fix with an actual before/after Node simulation of the
    reported scenario rather than resting on code-reading alone.
  - **Two more instances of the same self-inflicted mistake this session** (a `str_replace`
    dropping a boundary line it should have preserved in both old_str and new_str) — one while
    restructuring a card block, one caught immediately by the very next compile check both times.
    Continuing to be a real, recurring failure mode of large edits near shared boundaries, not a
    one-off — worth treating as a standing risk on any future edit of this shape, not something
    that gets "fixed" by having happened before.
  - **No live render/browser test has been done on any of this** — same standing caveat as every
    session before it. The verification performed (compile, stack-balance, binding audit, and this
    session's Node-simulation trace of the actual bug scenario) are strong, specific proxies, not
    a substitute for deploy-testing the real flow: trigger a scheduler run, propose SC/LH feedback
    including a TAT with a low implied speed, accept/reject in bulk, push to LM, and confirm the
    stage-2 tab and role labels look right end to end.

- **2026-09-01 (later same day) — Pre-deploy recheck, two real issues found and fixed.**
  1. **Seeded `schedulerPlans` had a stale `nlhPlanId`.** Every seeded scheduler plan carried a
     hardcoded placeholder (`'NLH-ING-DEMO'`) left over from before NLH plans became real per-SC/
     per-month records earlier the same day. `retargetMonthStrings()` can't fix this on its own —
     it only rewrites month-NAME strings ("Jul"→"Aug"), not cycle-key IDs like "2026-08" — so every
     seeded demo plan's rollover%/LMSC-in-out days/NLH-plan display would have silently shown
     zero/empty despite real NLH data existing. Fixed with a direct post-pass, patching each
     month's own `rlhCycleData[month].schedulerPlans[].nlhPlanId` to `'NLH-PLAN-' + scCode +
     '-' + month` right after both the RLH retargeting loop and the NLH seeding loop finish.
     Verified the exact string match in Node before trusting it, not just by reading the code.
     Also checked for other stale references: a second `'NLH-ING-DEMO'` in `this.state.
     ingestedNlhPlans` (the old pre-multi-leg RLH-internal tab) and a `'NLH-ING-' + n` generator —
     both confirmed dead/legacy, write to a completely different storage location
     (`this.state.ingestedNlhPlans`, not the engine's `nlhIngestedPlans`) that nothing in the
     current flow reads, already documented elsewhere as superseded. Left alone, not a live risk.
  2. **The actual root cause of the user's last two deployment failures, found and fixed**:
     `index.html` loaded `@babel/standalone` from unpkg with **no version pin**
     (`unpkg.com/@babel/standalone/babel.min.js`), unlike React/ReactDOM which are pinned to
     `@18`. Queried the npm registry directly rather than guessing: `dist-tags.latest` for
     `@babel/standalone` is now `8.0.4` — a new major version (Babel 8), with `next` still showing
     `8.0.0-rc.6`, meaning it only recently graduated from release-candidate to "latest." An
     unpinned CDN reference to a library that just had a breaking major-version release, hit
     independently of any code change, is exactly the kind of thing that produces "it worked
     before, now it doesn't" with nothing in the diff to explain it. Pinned to
     `@babel/standalone@7.29.8` (the newest stable 7.x release, confirmed via the registry) —
     matching the version line this app has actually always been built and tested against.
     **Caveat, stated plainly**: `unpkg.com` is not on this sandbox's allowed domain list (only
     `registry.npmjs.org` is), so the exact pinned URL couldn't be fetch-tested from here — the
     URL follows the same well-established `unpkg.com/@scope/pkg@version/path` pattern already
     used for React, and the registry confirms `7.29.8` is a real published version, but a quick
     manual check after deploying is worth doing.
     Also checked the app's own code for syntax that Babel 7 vs. 8 might disagree on (optional
     chaining, nullish coalescing, numeric separators, async/await) — none found; the only
     `**` (exponentiation) usage is the pre-existing haversine formula, present long before this
     session and would have failed immediately on first use if unsupported, so it isn't a
     contributor to the recent failures either.
  - **Files changed**: `v3.0-rlh-design-base.jsx` (the `nlhPlanId` patch) and `index.html` (the
    version pin) — no `engine.js` changes.
  - **Verification**: compiled clean, harness 118/118, exact-string-match confirmed in Node for
    the `nlhPlanId` fix.
