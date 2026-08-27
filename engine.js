// ============================================================================
// NDC v3.0 — Multi-leg master-data engine (Class A/B/D/F field model)
// ============================================================================
// Extracted into its own file (later session, "engine.js split") — this used
// to live inline at the top of v3.0-rlh-design-base.jsx, directly above
// `class NDCApp`. Moved out because it's pure JS with zero React/JSX/with(B)
// coupling: nothing here needs Babel's JSX transform, so it's loaded as a
// plain <script src="engine.js"> in index.html, BEFORE the main app file is
// fetched/compiled/eval'd. Classic (non-module) <script> tags on the same
// page share one global lexical scope, so every const/function declared here
// is visible to v3.0-rlh-design-base.jsx exactly as it was before the split
// — no `this.`, no import, no namespace, same bare-identifier calls
// (`monthIsPast(...)`, `setClassDField(...)`, etc.) as always.
//
// Verified safe to split (checked programmatically, not just by inspection):
// zero name collisions between anything declared here and anything declared
// in the rest of the app file; every identifier declared here is referenced
// either from class NDCApp / View() or from another function inside this
// same file (no orphaned exports introduced by the split).
//
// This file has NO module.exports — that's browser-only. The Node test
// harness (tooling/dataLayerHarness.js) runs against a SEPARATE copy,
// tooling/dataLayer.js, which is this same source with module.exports
// appended. Keep the two in sync; re-copy this file into tooling/dataLayer.js
// (plus the exports line) whenever the engine changes — this is now a
// straight file copy instead of carving a substring out of a 15K-line file.
// ============================================================================

const LEGS = ['fm', 'nlh', 'rlh'];

// ---------------------------------------------------------------------------
// Cycle-month utilities. Months are 'YYYY-MM' strings, which sort correctly
// with plain string comparison -- monthCompare below just makes that explicit
// rather than relying on callers to remember it.
// ---------------------------------------------------------------------------

function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function addMonths(monthStr, n) {
  const [y, m] = monthStr.split('-').map(Number);
  const d = new Date(y, (m - 1) + n, 1);
  return monthKey(d);
}

function currentMonthKey(now = new Date()) {
  return monthKey(now);
}

// Rolling window: 6 past + current + 6 future, chronological order.
function cycleWindow(centerMonth = currentMonthKey()) {
  const out = [];
  for (let i = -6; i <= 6; i++) out.push(addMonths(centerMonth, i));
  return out;
}

function monthCompare(a, b) { return a < b ? -1 : a > b ? 1 : 0; }
function monthIsPast(m, centerMonth = currentMonthKey()) { return monthCompare(m, centerMonth) < 0; }
function monthIsFuture(m, centerMonth = currentMonthKey()) { return monthCompare(m, centerMonth) > 0; }

// Deep-clones `obj`, replacing every occurrence of the source month's abbreviation/full-name
// strings with the target month's, in every string value found (recursively through arrays and
// plain objects). Used to derive May/Jun/Aug/Sep's seeded transactional data from the one
// canonical (July-dated) dataset buildSeed() produces -- see the retargeting note in the
// constructor for why this was chosen over regenerating each month independently.
function retargetMonthStrings(obj, fromAbbr, toAbbr, fromFull, toFull) {
  if (typeof obj === 'string') {
    let s = obj.split(fromFull).join(toFull);
    s = s.split(fromAbbr).join(toAbbr);
    return s;
  }
  if (Array.isArray(obj)) return obj.map(v => retargetMonthStrings(v, fromAbbr, toAbbr, fromFull, toFull));
  if (obj && typeof obj === 'object') {
    const out = {};
    Object.keys(obj).forEach(k => { out[k] = retargetMonthStrings(obj[k], fromAbbr, toAbbr, fromFull, toFull); });
    return out;
  }
  return obj;
}

const RLH_TRANSACTIONAL_KEYS = ['runs', 'plans', 'schedulerPlans', 'autodml', 'autodmlDetails', 'autodmlNodes', 'volumeFiles', 'nodeAdditions', 'nodeClosures', 'migrations', 'nodeChangesUnified'];
const RLH_MASTER_KEYS = ['scs', 'VEH', 'scVehAvail', 'lmdcs', 'totals'];

function extractRlhTransactional(data) {
  const out = {};
  RLH_TRANSACTIONAL_KEYS.forEach(k => { out[k] = data[k]; });
  return out;
}

// Suffixes every plan/run/schedulerPlan id with the month it belongs to, AFTER date-string
// retargeting -- ids like 'GGN01-HW1' or 'RUN-GGN01-03' don't contain "Jul" so the string
// retargeting above leaves them untouched, which would otherwise make the same id collide
// across all 5 seeded months (and, worse, let auxiliary per-id state like schedFeedback bleed
// between cycles the same way the original bug did). parentPlanId is remapped through an id map
// so schedulerPlans still resolve to the correct (same-month) parent plan.
function suffixRlhIdsForMonth(bucket, month) {
  const suf = '-' + month;
  const idMap = {};
  const plans = (bucket.plans || []).map(p => {
    const np = Object.assign({}, p, { id: p.id + suf, runId: p.runId ? p.runId + suf : p.runId });
    idMap[p.id] = np.id;
    return np;
  });
  const schedulerPlans = (bucket.schedulerPlans || []).map(sp => Object.assign({}, sp, {
    id: sp.id + suf,
    parentPlanId: sp.parentPlanId ? (idMap[sp.parentPlanId] || (sp.parentPlanId + suf)) : sp.parentPlanId,
  }));
  const runs = (bucket.runs || []).map(r => Object.assign({}, r, { runId: r.runId ? r.runId + suf : r.runId }));
  return Object.assign({}, bucket, { plans, schedulerPlans, runs });
}

// Field-appropriate empty defaults for a genuinely brand-new RLH cycle (e.g. October, or any
// month started later via "start new cycle") -- NOT carried forward from a prior month, since
// transactional data (unlike masters) shouldn't inherit: a new cycle starts with nothing
// generated until the user actually triggers Design Creation for it. Shapes checked against the
// actual buildSeed() return (autodmlDetails is an object map, everything else is an array).
function emptyRlhTransactional() {
  return { runs: [], plans: [], schedulerPlans: [], autodml: [], autodmlDetails: {}, autodmlNodes: [], volumeFiles: [], nodeAdditions: [], nodeClosures: [], migrations: [], nodeChangesUnified: [] };
}

const MONTH_ABBR_FULL = { Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April', May: 'May', Jun: 'June', Jul: 'July', Aug: 'August', Sep: 'September', Oct: 'October', Nov: 'November', Dec: 'December' };
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function monthLabel(m) {
  const [y, mo] = m.split('-').map(Number);
  return `${MONTH_NAMES[mo - 1]} ${y}`;
}

// ---------------------------------------------------------------------------
// Field classification registry. This is the single source of truth the rest
// of the engine consults -- adding a field later is a one-line entry here,
// not a schema migration.
// ---------------------------------------------------------------------------

const FIELD_CLASS = {
  // Class A -- true global identity. Lives in scRegistry, not scCycleFields.
  'sc.name': { class: 'A' },
  'sc.lat': { class: 'A' },
  'sc.lng': { class: 'A' },
  'sc.zone': { class: 'A' },

  // Class B -- cross-leg, cycle-versioned.
  'sc.type': { class: 'B' },
  // 2026-08-26 — real dispatch-role facts (which leg(s) this SC actually dispatches), replacing
  // the old cosmetic "Hybrid/LMSC/FMSC" label that was really just a dcCount-size threshold with
  // nothing behind it. An FMSC receives from FM Hubs and dispatches NLH; an LMSC receives from
  // NLH and dispatches RLH; a Hybrid node does both. SC Type (above) is now DERIVED from these
  // two flags at display time, not seeded independently.
  'sc.dispatchesRLH': { class: 'B' },
  'sc.dispatchesNLH': { class: 'B' },
  'sc.sortCap': { class: 'B' },
  'sc.volCap': { class: 'B' },
  'sc.htp': { class: 'B' },

  // Class D -- fully local. `leg` fixed = single-leg-only module (e.g. RLH's
  // own Local/Non-Local Speed, RLH Docks, LMDC Master). `leg: null` = present
  // on every leg but each leg owns its own independent copy (Vehicle Master,
  // SC Vehicle Availability).
  'rlh.localSpeed': { class: 'D', leg: 'rlh' },
  'rlh.nonLocalSpeed': { class: 'D', leg: 'rlh' },
  'rlh.docks': { class: 'D', leg: 'rlh' },
  'lmdc.capacity': { class: 'D', leg: 'rlh' }, // LMDC Master (RLH-only module); location field intentionally kept OUT of this shared engine per product decision -- stays inside RLH's own local screen state, not even class-D-registered here, revisit later.
  'vehicleMaster.type': { class: 'D', leg: null },
  'vehicleMaster.capacity': { class: 'D', leg: null },
  'scVehicleAvail.override': { class: 'D', leg: null },
  'nlh.dock': { class: 'D', leg: 'nlh' },
  'nlh.lane': { class: 'D', leg: 'nlh' },
  'fm.hub': { class: 'D', leg: 'fm' },

  // ---- Added during the real RLH SC-editor wire-up (2026-08-25) ----
  // These came out of the ACTUAL edit-SC form fields, not the earlier abstract
  // matrix discussion -- classified here as judgment calls, flagged for visibility:
  'rlh.nlhDocks': { class: 'D', leg: 'rlh' },  // true home is NLH's own scMaster table once it exists; stays under RLH for now since RLH's edit form is the only UI that writes it
  'rlh.localTp': { class: 'D', leg: 'rlh' },
  'rlh.nonLocalTp': { class: 'D', leg: 'rlh' },
  'rlh.openTime': { class: 'D', leg: 'rlh' },
  'rlh.closeTime': { class: 'D', leg: 'rlh' },
  'rlh.holdTimeOn': { class: 'D', leg: 'rlh' },
  'rlh.maxHoldLocal': { class: 'D', leg: 'rlh' },
  'rlh.maxHoldNonLocal': { class: 'D', leg: 'rlh' },
  'rlh.pocs': { class: 'D', leg: 'rlh' }, // judgment call -- contacts kept RLH-local rather than global; revisit if NLH/FM need their own reviewer pools
};

function classOf(fieldKey) {
  const entry = FIELD_CLASS[fieldKey];
  if (!entry) throw new Error(`Unknown field key: ${fieldKey} -- add it to FIELD_CLASS before use.`);
  return entry;
}

// ---------------------------------------------------------------------------
// Storage shape
// ---------------------------------------------------------------------------

function makeEmptyStore() {
  return {
    // Class A -- { [code]: { name, lat, lng, zone, statusLog: [{status, effectiveMonth}] } }
    scRegistry: {},
    // Class B -- { [code]: { [cycleMonth]: { scType, sortCap, volCap, htp, _clonedFrom } } }
    scCycleFields: {},
    // Class D -- { [leg]: { [table]: { [cycleMonth]: { [entityCode]: {...fields, _clonedFrom} } } } }
    localMaster: {},
    // Class F -- { [leg]: { [cycleMonth]: { [slot]: { fileMeta, rows } } } } -- never cloned.
    uploads: {},
    uploadHistory: {},
    lmdcRegistry: {},
    // NLH's ingested (not-yet-finalised) plans, referenced by RLH's Route Scheduler picker.
    // { [cycleMonth]: [ { planId, fileMeta, ingestedAt, rows } ] }
    nlhIngestedPlans: {},
    // Which (leg, cycleMonth) combos have actually been "started" by a user --
    // distinguishes "never touched" from "touched, all fields still default".
    cyclesCreated: { fm: [], nlh: [], rlh: [] },
  };
}

// ---------------------------------------------------------------------------
// Row existence (Class A lifecycle: add / delete / deactivate)
// ---------------------------------------------------------------------------

function ensureScRegistryRow(store, code) {
  if (!store.scRegistry[code]) {
    store.scRegistry[code] = { name: '', lat: null, lng: null, zone: null, statusLog: [] };
  }
  return store.scRegistry[code];
}

// status: 'active' | 'deleted' | 'deactivated'
function setSCStatus(store, code, status, effectiveMonth) {
  const row = ensureScRegistryRow(store, code);
  row.statusLog.push({ status, effectiveMonth });
  row.statusLog.sort((a, b) => monthCompare(a.effectiveMonth, b.effectiveMonth));
}

function addSC(store, code, identity, effectiveMonth) {
  const row = ensureScRegistryRow(store, code);
  Object.assign(row, identity);
  setSCStatus(store, code, 'active', effectiveMonth);
}

// What was true for this code as of cycleMonth -- independent of which leg is asking.
function resolveExistence(store, code, cycleMonth) {
  const row = store.scRegistry[code];
  if (!row || !row.statusLog.length) return 'not-yet-added';
  let best = null;
  for (const entry of row.statusLog) {
    if (monthCompare(entry.effectiveMonth, cycleMonth) <= 0) {
      // >= (not >) is deliberate: when two statusLog entries share the exact same
      // effectiveMonth (e.g. a delete immediately followed by an "undo" re-activation
      // within the same month), the most-recently-pushed one must win, not the first.
      // statusLog is sorted stably by effectiveMonth, so for ties this walk visits them
      // in push order -- >= lets each later same-month entry override the earlier one.
      if (!best || monthCompare(entry.effectiveMonth, best.effectiveMonth) >= 0) best = entry;
    }
  }
  return best ? best.status : 'not-yet-added';
}

function isVisible(store, code, cycleMonth) {
  return resolveExistence(store, code, cycleMonth) === 'active';
}

// 2026-08-26 — the deactivate/delete distinction: a deactivated row STAYS visible/displayable
// (shown in the master list, tagged Inactive) but is excluded from active SELECTION anywhere
// downstream (Route Planner's SC picker, SC Vehicle Availability's SC picker). A deleted row is
// excluded from both. isDisplayable() is the broader check; isVisible() (above, unchanged) stays
// the stricter "is this genuinely active" check, used wherever selection/eligibility matters.
function isDisplayable(store, code, cycleMonth) {
  const status = resolveExistence(store, code, cycleMonth);
  return status === 'active' || status === 'deactivated';
}

// ---------------------------------------------------------------------------
// LMDC existence registry (2026-08-26, #11) -- a parallel registry to scRegistry, one entry per
// individual DC code, with the SAME effective-month statusLog mechanism SC identity uses. LMDC
// Master is RLH-only (no other leg references individual DCs), so unlike scRegistry this never
// needs a Class-A "shared across legs" layer -- existence is the only thing that needs its own
// registry; every actual field (capacity, RLH Mode, MDC/Lane, Cutoff, TAT, etc.) lives as
// ordinary Class D under leg='rlh', table='lmdc', keyed by DC code, exactly like every other
// per-entity Class D record elsewhere in this engine.
// ---------------------------------------------------------------------------

function ensureLmdcRegistryRow(store, code) {
  store.lmdcRegistry = store.lmdcRegistry || {};
  if (!store.lmdcRegistry[code]) store.lmdcRegistry[code] = { statusLog: [] };
  return store.lmdcRegistry[code];
}

function setLmdcStatus(store, code, status, effectiveMonth) {
  const row = ensureLmdcRegistryRow(store, code);
  row.statusLog.push({ status, effectiveMonth });
  row.statusLog.sort((a, b) => monthCompare(a.effectiveMonth, b.effectiveMonth));
}

function addLmdc(store, code, effectiveMonth) {
  ensureLmdcRegistryRow(store, code);
  setLmdcStatus(store, code, 'active', effectiveMonth);
}

// Same tie-break logic as resolveExistence() (>= not >, so a same-month undo correctly wins).
function resolveLmdcExistence(store, code, cycleMonth) {
  const row = (store.lmdcRegistry || {})[code];
  if (!row || !row.statusLog.length) return 'not-yet-added';
  let best = null;
  for (const entry of row.statusLog) {
    if (monthCompare(entry.effectiveMonth, cycleMonth) <= 0) {
      if (!best || monthCompare(entry.effectiveMonth, best.effectiveMonth) >= 0) best = entry;
    }
  }
  return best ? best.status : 'not-yet-added';
}

function isLmdcDisplayable(store, code, cycleMonth) {
  const status = resolveLmdcExistence(store, code, cycleMonth);
  return status === 'active' || status === 'deactivated';
}

// Seeds every DC in `lmdcArray` as its own Class D entity (not one giant blob) -- 12,607 rows at
// current scale, each getting its own addLmdc() + ensureClassDMaterialized() call. One-time
// constructor cost; fine at this scale for a browser.
function seedLmdcEntities(store, leg, genesisMonth, lmdcArray) {
  lmdcArray.forEach(dc => {
    addLmdc(store, dc.code, genesisMonth);
    ensureClassDMaterialized(store, leg, 'lmdc', genesisMonth, dc.code, dc);
  });
}

function materializeLmdcEntities(store, leg, cycleMonth) {
  const codes = Object.keys(store.lmdcRegistry || {}).filter(code => isLmdcDisplayable(store, code, cycleMonth));
  return codes.map(code => peekClassD(store, leg, 'lmdc', cycleMonth, code)).filter(Boolean);
}

// ---------------------------------------------------------------------------
// Class B -- cross-leg, cycle-versioned
// ---------------------------------------------------------------------------

function nearestEarlierMonth(monthsAvailable, cycleMonth) {
  const earlier = monthsAvailable.filter(m => monthCompare(m, cycleMonth) < 0).sort(monthCompare);
  return earlier.length ? earlier[earlier.length - 1] : null;
}

// Read-through, non-mutating: what WOULD this resolve to, without materializing it.
function peekClassB(store, code, cycleMonth) {
  const rec = store.scCycleFields[code];
  if (!rec) return null;
  if (rec[cycleMonth]) return rec[cycleMonth];
  const from = nearestEarlierMonth(Object.keys(rec), cycleMonth);
  return from ? rec[from] : null;
}

// Materializing = the act of a leg "touching" this cycleMonth for the first
// time -- clones forward from the nearest earlier month with data (or seeds
// blank if none exists yet), then this month is independently editable from
// that point on without touching any other month.
function ensureClassBMaterialized(store, code, cycleMonth) {
  if (!store.scCycleFields[code]) store.scCycleFields[code] = {};
  const rec = store.scCycleFields[code];
  if (rec[cycleMonth]) return rec[cycleMonth];
  const from = nearestEarlierMonth(Object.keys(rec), cycleMonth);
  rec[cycleMonth] = from
    ? { ...rec[from], _clonedFrom: from }
    : { scType: null, sortCap: null, volCap: null, htp: null, _clonedFrom: null };
  return rec[cycleMonth];
}

function setClassBField(store, code, cycleMonth, field, value) {
  const rec = ensureClassBMaterialized(store, code, cycleMonth);
  rec[field] = value;
  return rec;
}

// ---------------------------------------------------------------------------
// Class D -- fully local (per leg, per table, per cycle, per entity)
// ---------------------------------------------------------------------------

function peekClassD(store, leg, table, cycleMonth, entityCode) {
  const byMonth = (store.localMaster[leg] || {})[table] || {};
  if (byMonth[cycleMonth] && byMonth[cycleMonth][entityCode]) return byMonth[cycleMonth][entityCode];
  const from = nearestEarlierMonth(Object.keys(byMonth), cycleMonth);
  return from && byMonth[from][entityCode] ? byMonth[from][entityCode] : null;
}

function ensureClassDMaterialized(store, leg, table, cycleMonth, entityCode, defaults) {
  store.localMaster[leg] = store.localMaster[leg] || {};
  store.localMaster[leg][table] = store.localMaster[leg][table] || {};
  const byMonth = store.localMaster[leg][table];
  byMonth[cycleMonth] = byMonth[cycleMonth] || {};
  if (byMonth[cycleMonth][entityCode]) return byMonth[cycleMonth][entityCode];

  const priorMonths = Object.keys(byMonth).filter(m => m !== cycleMonth);
  const from = nearestEarlierMonth(priorMonths.filter(m => byMonth[m][entityCode]), cycleMonth);
  byMonth[cycleMonth][entityCode] = from
    ? { ...byMonth[from][entityCode], _clonedFrom: from }
    : { ...defaults, _clonedFrom: null };
  return byMonth[cycleMonth][entityCode];
}

function setClassDField(store, leg, table, cycleMonth, entityCode, field, value, defaults) {
  const rec = ensureClassDMaterialized(store, leg, table, cycleMonth, entityCode, defaults || {});
  rec[field] = value;
  return rec;
}

// ---------------------------------------------------------------------------
// Cycle creation -- the explicit "start a cycle for this leg" action.
// Eagerly snapshots every currently-visible SC's class-D local tables (per
// the product decision: "by default carry forward the masters as is" --
// no inherit/fresh prompt anymore). Class A/B need no per-cycle action here;
// they resolve live through the functions above regardless of whether a
// cycle was ever explicitly "created".
// ---------------------------------------------------------------------------

function createCycle(store, leg, cycleMonth, { tables = [] } = {}) {
  if (!store.cyclesCreated[leg].includes(cycleMonth)) {
    store.cyclesCreated[leg].push(cycleMonth);
    store.cyclesCreated[leg].sort(monthCompare);
  }
  const visibleCodes = Object.keys(store.scRegistry).filter(code => isVisible(store, code, cycleMonth));
  tables.forEach(({ table, defaults }) => {
    visibleCodes.forEach(code => {
      ensureClassDMaterialized(store, leg, table, cycleMonth, code, defaults);
    });
  });
  return { cycleMonth, scCount: visibleCodes.length };
}

function isCycleCreated(store, leg, cycleMonth) {
  return store.cyclesCreated[leg].includes(cycleMonth);
}

// ---------------------------------------------------------------------------
// Unified field resolver -- routes any FIELD_CLASS key to the right store.
// ---------------------------------------------------------------------------

function resolveField(store, fieldKey, { code, leg, table, cycleMonth, entityCode } = {}) {
  const { class: cls } = classOf(fieldKey);
  if (cls === 'A') {
    const row = store.scRegistry[code];
    const prop = fieldKey.split('.')[1];
    return row ? row[prop] : null;
  }
  if (cls === 'B') {
    const rec = peekClassB(store, code, cycleMonth);
    if (!rec) return null;
    const prop = fieldKey.split('.')[1];
    const map = { type: 'scType', sortCap: 'sortCap', volCap: 'volCap', htp: 'htp' };
    return rec[map[prop] || prop];
  }
  if (cls === 'D') {
    const rec = peekClassD(store, leg, table, cycleMonth, entityCode || code);
    return rec ? rec[fieldKey.split('.')[1]] : null;
  }
  throw new Error(`resolveField: unhandled class ${cls}`);
}

// ---------------------------------------------------------------------------
// Output snapshotting -- freeze whatever A/B values a plan actually used at
// generation/finalise time, so the plan stays historically accurate even if
// the live globals move on afterward.
// ---------------------------------------------------------------------------

function snapshotForOutput(store, cycleMonth, codes) {
  const snap = {};
  codes.forEach(code => {
    const identity = store.scRegistry[code];
    const b = peekClassB(store, code, cycleMonth);
    snap[code] = {
      name: identity ? identity.name : null,
      lat: identity ? identity.lat : null,
      lng: identity ? identity.lng : null,
      zone: identity ? identity.zone : null,
      scType: b ? b.scType : null,
      sortCap: b ? b.sortCap : null,
      volCap: b ? b.volCap : null,
      htp: b ? b.htp : null,
      _snapshotMonth: cycleMonth,
    };
  });
  return snap;
}

// ---------------------------------------------------------------------------
// RLH master-table seeding + materialization (2026-08-25 wire-up)
// -- Generates fresh, large-scale demo data directly into the engine's store
// shapes (identity=A, capacity/type/htp=B, everything RLH-specific=D), then
// materializes it back into the exact flat shapes RLH's existing screens and
// formulas already expect -- so Route Planner/Route Scheduler/validation
// don't need to change at all, they just consume a differently-sourced array
// of the same shape. Per product decision, this REPLACES the old seed data
// rather than trying to preserve it (it was test data, not production data).
// ---------------------------------------------------------------------------

const RLH_GENESIS_MONTH = '2020-01'; // safely before any realistic cycle window, so seeded rows are visible everywhere by default

function rngFactory(seed) {
  let s = seed;
  const R = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  return { R, ri: (a, b) => a + Math.floor(R() * (b - a + 1)), rf: (a, b) => a + R() * (b - a) };
}

const RLH_ZONES = [
  { z: 'North', cities: [['Delhi', 'DEL'], ['Gurugram', 'GGN'], ['Noida', 'NOI'], ['Jaipur', 'JAI'], ['Lucknow', 'LKO'], ['Kanpur', 'KNP'], ['Chandigarh', 'CHD'], ['Ludhiana', 'LDH'], ['Agra', 'AGR'], ['Meerut', 'MRT'], ['Amritsar', 'ASR'], ['Dehradun', 'DDN']], lat: [26.5, 30.8], lng: [74.5, 80.5] },
  { z: 'West', cities: [['Mumbai', 'BOM'], ['Pune', 'PNQ'], ['Ahmedabad', 'AMD'], ['Surat', 'STV'], ['Nagpur', 'NAG'], ['Nashik', 'ISK'], ['Rajkot', 'RAJ'], ['Vadodara', 'BDQ'], ['Indore', 'IDR'], ['Bhopal', 'BHO'], ['Thane', 'TNA'], ['Gwalior', 'GWL'], ['Ujjain', 'UJN']], lat: [18.4, 23.6], lng: [70.0, 77.2] },
  { z: 'South', cities: [['Bengaluru', 'BLR'], ['Chennai', 'MAA'], ['Hyderabad', 'HYD'], ['Coimbatore', 'CJB'], ['Kochi', 'COK'], ['Madurai', 'IXM'], ['Mysuru', 'MYS'], ['Vijayawada', 'VGA'], ['Vizag', 'VTZ'], ['Trichy', 'TRZ'], ['Salem', 'SXV']], lat: [9.5, 17.6], lng: [75.5, 83.2] },
  { z: 'East', cities: [['Kolkata', 'CCU'], ['Patna', 'PAT'], ['Bhubaneswar', 'BBI'], ['Ranchi', 'IXR'], ['Guwahati', 'GAU'], ['Siliguri', 'IXB'], ['Cuttack', 'CTC'], ['Durgapur', 'RDP'], ['Asansol', 'ASN'], ['Raipur', 'RPR'], ['Jabalpur', 'JLR'], ['Bilaspur', 'PAB']], lat: [21.5, 27.2], lng: [83.5, 92.0] },
];

// Returns the list of SC codes seeded (mostly for test/inspection convenience).
function seedRLHMasterData(store, opts = {}) {
  const genesisMonth = opts.genesisMonth || RLH_GENESIS_MONTH;
  const count = opts.count || 80;
  const { R, ri, rf } = rngFactory(opts.seed || 20260825);
  const NAMES = ['Aarti Nair', 'Rahul Sharma', 'Imran Khan', 'Deepa Rao', 'Suresh Menon', 'Neha Tiwari', 'Vivek Pillai', 'Karthik Varma', 'Pooja Gupta', 'Sandeep Lal', 'Megha Bose', 'Arjun Desai'];

  const generated = [];
  let zi = 0, ci = 0, guard = 0;
  while (generated.length < count && guard < 800) {
    guard++;
    const zone = RLH_ZONES[zi % RLH_ZONES.length];
    const cityArr = zone.cities;
    const city = cityArr[ci % cityArr.length];
    const variant = generated.filter(x => x.cityCode === city[1]).length;
    if (variant === 0 || (variant < 2 && R() < 0.45)) {
      const code = variant === 0 ? city[1] + 'S' : city[1] + (variant + 1);
      const dcCount = ri(95, 205);
      const volume = Math.round(dcCount * rf(230, 420));
      const lat = +rf(zone.lat[0], zone.lat[1]).toFixed(3);
      const lng = +rf(zone.lng[0], zone.lng[1]).toFixed(3);
      const h = code.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 0);
      const zeroVolDc = (variant + city[1].charCodeAt(0)) % 5 === 0 ? ri(1, 4) : 0;
      const missRaw = (variant + city[1].charCodeAt(1)) % 4 === 0 ? ri(2, 9) : 0;
      generated.push({
        code, name: city[0], cityCode: city[1], zone: zone.z, lat, lng, dcCount, volume,
        sortCap: Math.min(250, dcCount + ri(10, 40)),
        volCap: Math.round(volume * rf(0.96, 1.3) / 1000) * 1000,
        docks: ri(3, 9), rlhDocks: 2 + ((h >> 3) % 6), nlhDocks: 3 + (h % 7),
        localTp: 4 + (h % 3), nonLocalTp: 2 + ((h >> 2) % 3),
        localSpeed: 22 + (h % 8), nonLocalSpeed: 32 + ((h >> 5) % 10),
        openTime: String(5 + (h % 3)).padStart(2, '0') + ':00',
        closeTime: String(21 + ((h >> 4) % 3)).padStart(2, '0') + ':00',
        holdTimeOn: true, maxHoldLocal: 30, maxHoldNonLocal: 120,
        hasRef: R() < 0.82, htp: 40 + ri(0, 60),
        farDist: (generated.length % 17 === 7) || (generated.length % 19 === 6) || (generated.length % 23 === 1)
          ? Math.round(270 + rf(0, 1) * 250) : Math.round(150 + rf(0, 1) * 85),
        zeroVolDc, missVolDc: Math.min(missRaw, Math.max(0, 6 - zeroVolDc)),
        pocs: Array.from({ length: ri(2, 4) }, () => NAMES[Math.floor(R() * NAMES.length)]),
        nodeKind: 'SC',
      });
    }
    ci++;
    if (ci % cityArr.length === 0) zi++;
  }

  const MDC_NAMES = [['Panvel MDC', 'PNVL'], ['Sonipat MDC', 'SNPT'], ['Hosur MDC', 'HSUR']];
  const MDC_ZONES = ['West', 'North', 'South'];
  MDC_NAMES.forEach((mn, mi) => {
    const zone = MDC_ZONES[mi];
    const near = generated.find(s => s.zone === zone) || generated[0];
    generated.push({
      code: 'MDC-' + (mi + 1), name: mn[0], cityCode: mn[1], zone,
      dcCount: 0, volume: 0, lat: near ? +(near.lat + 0.15).toFixed(3) : 20, lng: near ? +(near.lng + 0.15).toFixed(3) : 77,
      sortCap: 60, volCap: 40000, docks: ri(3, 5), rlhDocks: ri(3, 5), nlhDocks: 0,
      localTp: 4, nonLocalTp: 2, localSpeed: 24, nonLocalSpeed: 36,
      openTime: '05:00', closeTime: '23:00', holdTimeOn: true, maxHoldLocal: 30, maxHoldNonLocal: 120,
      hasRef: false, htp: 60, farDist: 0, zeroVolDc: 0, missVolDc: 0,
      pocs: Array.from({ length: ri(2, 3) }, () => NAMES[Math.floor(R() * NAMES.length)]),
      nodeKind: 'MDC',
    });
  });

  // 2026-08-26 — real dispatch-role assignment, replacing the old placeholder ('LMSC' for every
  // non-MDC node). Ratio per product decision: ~75:100:7.5 (LMSC-only : FMSC-only : Hybrid) on a
  // full ~180-node network, applied proportionally to however many SCs are actually seeded here
  // (not a literal node count to hit) -- works out to roughly 41% / 55% / 4% on 80 SCs.
  const nonMdc = generated.filter(s => s.nodeKind !== 'MDC');
  const lmscOnlyCount = Math.round(nonMdc.length * 0.41);
  const fmscOnlyCount = Math.round(nonMdc.length * 0.548);
  nonMdc.forEach((sc, idx) => {
    if (idx < lmscOnlyCount) { sc.dispatchesRLH = true; sc.dispatchesNLH = false; sc.scType = 'LMSC'; }
    else if (idx < lmscOnlyCount + fmscOnlyCount) { sc.dispatchesRLH = false; sc.dispatchesNLH = true; sc.scType = 'FMSC'; }
    else { sc.dispatchesRLH = true; sc.dispatchesNLH = true; sc.scType = 'Hybrid'; }
  });
  generated.filter(s => s.nodeKind === 'MDC').forEach(sc => { sc.dispatchesRLH = true; sc.dispatchesNLH = false; sc.scType = 'MDC'; });

  generated.forEach(sc => {
    addSC(store, sc.code, { name: sc.name, lat: sc.lat, lng: sc.lng, zone: sc.zone }, genesisMonth);
    setClassBField(store, sc.code, genesisMonth, 'scType', sc.scType);
    setClassBField(store, sc.code, genesisMonth, 'dispatchesRLH', sc.dispatchesRLH);
    setClassBField(store, sc.code, genesisMonth, 'dispatchesNLH', sc.dispatchesNLH);
    setClassBField(store, sc.code, genesisMonth, 'sortCap', sc.sortCap);
    setClassBField(store, sc.code, genesisMonth, 'volCap', sc.volCap);
    setClassBField(store, sc.code, genesisMonth, 'htp', sc.htp);
    const dFields = {
      cityCode: sc.cityCode, dcCount: sc.dcCount, volume: sc.volume, docks: sc.docks,
      rlhDocks: sc.rlhDocks, nlhDocks: sc.nlhDocks, localTp: sc.localTp, nonLocalTp: sc.nonLocalTp,
      localSpeed: sc.localSpeed, nonLocalSpeed: sc.nonLocalSpeed, openTime: sc.openTime, closeTime: sc.closeTime,
      holdTimeOn: sc.holdTimeOn, maxHoldLocal: sc.maxHoldLocal, maxHoldNonLocal: sc.maxHoldNonLocal,
      hasRef: sc.hasRef, farDist: sc.farDist, zeroVolDc: sc.zeroVolDc, missVolDc: sc.missVolDc,
      pocs: sc.pocs, nodeKind: sc.nodeKind,
    };
    ensureClassDMaterialized(store, 'rlh', 'scMaster', genesisMonth, sc.code, dFields);
  });

  return generated.map(s => s.code);
}

// Flat shape matches what buildSeed()'s downstream plan/route generation already expects --
// field names (open/close, not openTime/closeTime) deliberately mirror the existing form's
// `patch` object in submitAddSc() so both directions (materialize <-> save) agree.
function materializeRLHScs(store, cycleMonth) {
  const codes = Object.keys(store.scRegistry).filter(code => isDisplayable(store, code, cycleMonth));
  return codes.map(code => {
    const identity = store.scRegistry[code];
    const b = peekClassB(store, code, cycleMonth) || {};
    const d = peekClassD(store, 'rlh', 'scMaster', cycleMonth, code) || {};
    return {
      code, name: identity.name, cityCode: d.cityCode || code.slice(0, 3), zone: identity.zone,
      lat: identity.lat, lng: identity.lng,
      dcCount: d.dcCount || 0, volume: d.volume || 0,
      sortCap: b.sortCap != null ? b.sortCap : 0, volCap: b.volCap != null ? b.volCap : 0,
      htp: b.htp != null ? b.htp : 0,
      docks: d.docks || 0, rlhDocks: d.rlhDocks, nlhDocks: d.nlhDocks,
      localTp: d.localTp, nonLocalTp: d.nonLocalTp, localSpeed: d.localSpeed, nonLocalSpeed: d.nonLocalSpeed,
      open: d.openTime, close: d.closeTime, holdTimeOn: d.holdTimeOn, maxHoldLocal: d.maxHoldLocal, maxHoldNonLocal: d.maxHoldNonLocal,
      hasRef: !!d.hasRef, farDist: d.farDist || 0, zeroVolDc: d.zeroVolDc || 0, missVolDc: d.missVolDc || 0,
      pocs: d.pocs || [], nodeKind: d.nodeKind || 'SC',
      // 2026-08-26 — real dispatch-role facts, exposed for the SC Master screen's SC TYPE column
      // (now derived from these, not a dcCount-size guess) and for filtering RLH/NLH's own SC
      // Vehicle Availability screens to the SCs that actually dispatch that leg.
      dispatchRoleType: b.scType || 'LMSC', dispatchesRLH: b.dispatchesRLH !== false, dispatchesNLH: !!b.dispatchesNLH,
      // 2026-08-26 — deactivate/delete distinction: isActive=false means "deactivated, shown but
      // not selectable anywhere downstream" -- isDisplayable() above already excludes true
      // deletes entirely, so anything reaching this point is either active or deactivated.
      isActive: resolveExistence(store, code, cycleMonth) === 'active',
    };
  });
}

// Vehicle Master / SC Vehicle Availability -- own table per leg (per product decision), no
// row-existence lifecycle modeled yet (nothing deletes a vehicle type today), so materialize
// just unions every code ever seen up to cycleMonth and resolves each through peekClassD.
function seedVehicleMasterLeg(store, leg, genesisMonth, vehArray) {
  vehArray.forEach(v => { ensureClassDMaterialized(store, leg, 'vehicleMaster', genesisMonth, v.name, { ...v }); });
}
function materializeVehicleMasterLeg(store, leg, cycleMonth) {
  const byMonth = (store.localMaster[leg] || {})['vehicleMaster'] || {};
  const codes = new Set();
  Object.keys(byMonth).filter(m => monthCompare(m, cycleMonth) <= 0).forEach(m => Object.keys(byMonth[m]).forEach(c => codes.add(c)));
  // 2026-08-26 (#6) — .filter(v => !v._removed) added so a delete (setting _removed:true on the
  // record for this cycle month, via setClassDField) actually excludes it going forward. Vehicle
  // Master had no delete mechanism at all before this -- an entity, once seeded, was permanent.
  return Array.from(codes).map(name => peekClassD(store, leg, 'vehicleMaster', cycleMonth, name)).filter(Boolean).filter(v => !v._removed);
}

function seedScVehAvailLeg(store, leg, genesisMonth, groups) {
  groups.forEach(g => { ensureClassDMaterialized(store, leg, 'scVehicleAvail', genesisMonth, g.code, { name: g.name, zone: g.zone, rows: g.rows }); });
}
function materializeScVehAvailLeg(store, leg, cycleMonth) {
  const byMonth = (store.localMaster[leg] || {})['scVehicleAvail'] || {};
  const codes = new Set();
  Object.keys(byMonth).filter(m => monthCompare(m, cycleMonth) <= 0).forEach(m => Object.keys(byMonth[m]).forEach(c => codes.add(c)));
  return Array.from(codes).map(code => {
    const rec = peekClassD(store, leg, 'scVehicleAvail', cycleMonth, code);
    return rec ? { code, name: rec.name, zone: rec.zone, rows: rec.rows } : null;
  }).filter(Boolean);
}

// LMDC Master -- deliberately a thin passthrough this phase (see build notes): the DC-pool
// generation algorithm itself (Co-Loading/MDC assignment, hold-time draws, etc.) is NOT
// rewritten here, just given a home inside the engine's per-cycle storage shape so it's
// structurally ready for real per-cycle editing later, without risking that complex logic now.
function seedLmdcRawLeg(store, leg, genesisMonth, lmdcArray) {
  ensureClassDMaterialized(store, leg, 'lmdc', genesisMonth, 'ALL', { rows: lmdcArray });
}
function materializeLmdcRawLeg(store, leg, cycleMonth) {
  const rec = peekClassD(store, leg, 'lmdc', cycleMonth, 'ALL');
  return rec ? rec.rows : [];
}

// Generic per-leg SC-master view -- used by NLH/FM Carting (RLH keeps its own richer
// materializeRLHScs() since it carries many more RLH-specific generation fields). Returns each
// visible SC's shared A+B fields plus whichever leg-local D fields the caller asks for.
function materializeLegScMasterView(store, leg, cycleMonth, dFieldNames) {
  const codes = Object.keys(store.scRegistry).filter(code => isDisplayable(store, code, cycleMonth));
  return codes.map(code => {
    const identity = store.scRegistry[code];
    const b = peekClassB(store, code, cycleMonth) || {};
    const d = peekClassD(store, leg, 'scMaster', cycleMonth, code) || {};
    const row = {
      code, name: identity.name, zone: identity.zone, lat: identity.lat, lng: identity.lng,
      sortCap: b.sortCap != null ? b.sortCap : 0, volCap: b.volCap != null ? b.volCap : 0, htp: b.htp != null ? b.htp : 0,
      // 2026-08-26 — real dispatch-role facts, shared across legs (same underlying SC, same
      // physical fact) -- used to filter NLH's own SC Vehicle Availability to FMSC/Hybrid nodes.
      dispatchRoleType: b.scType || 'LMSC', dispatchesRLH: b.dispatchesRLH !== false, dispatchesNLH: !!b.dispatchesNLH,
      isActive: resolveExistence(store, code, cycleMonth) === 'active',
    };
    (dFieldNames || []).forEach(f => { row[f] = d[f] != null ? d[f] : null; });
    return row;
  });
}

// Generic per-leg local-field writer -- reads the existing D record (if any) as the clone
// base, then writes the one field. Reused by NLH/FM's own masters screens so they don't each
// need their own bespoke setter, the way RLH's submitAddSc() has its own richer one.
function setLegScLocalField(store, leg, cycleMonth, code, field, value) {
  const existing = peekClassD(store, leg, 'scMaster', cycleMonth, code) || {};
  setClassDField(store, leg, 'scMaster', cycleMonth, code, field, value, existing);
}

// ---------------------------------------------------------------------------
// Uploads (Class F) -- thin, deliberately un-clever. Never cloned.
// ---------------------------------------------------------------------------

function setUpload(store, leg, cycleMonth, slot, payload) {
  store.uploads[leg] = store.uploads[leg] || {};
  store.uploads[leg][cycleMonth] = store.uploads[leg][cycleMonth] || {};
  store.uploads[leg][cycleMonth][slot] = payload;
  // 2026-08-26 (#7) — also append to a running per-(leg,cycleMonth) history, so the volume
  // library can show every upload ever made this cycle (matching RLH's own fuller library),
  // not just the single current-active file per slot the way it worked before.
  store.uploadHistory = store.uploadHistory || {};
  store.uploadHistory[leg] = store.uploadHistory[leg] || {};
  store.uploadHistory[leg][cycleMonth] = store.uploadHistory[leg][cycleMonth] || [];
  store.uploadHistory[leg][cycleMonth].push(Object.assign({ slot }, payload));
}

function getUpload(store, leg, cycleMonth, slot) {
  return ((store.uploads[leg] || {})[cycleMonth] || {})[slot] || null;
}

function listUploadHistory(store, leg, cycleMonth) {
  return (((store.uploadHistory || {})[leg] || {})[cycleMonth] || []).slice().reverse();
}

// ---------------------------------------------------------------------------
// NLH ingested plans (referenced by RLH's Route Scheduler picker)
// ---------------------------------------------------------------------------

function ingestNlhPlan(store, cycleMonth, planRecord) {
  store.nlhIngestedPlans[cycleMonth] = store.nlhIngestedPlans[cycleMonth] || [];
  store.nlhIngestedPlans[cycleMonth].push(planRecord);
  return planRecord;
}

function listNlhIngestedPlans(store, cycleMonth) {
  return store.nlhIngestedPlans[cycleMonth] || [];
}

// Looks up an ingested NLH plan by planId across EVERY cycle-month, not just one -- needed
// because a schedulerPlans row only stores the planId (set at trigger time from whichever
// month the Step 2 picker was browsing), not which month it came from. planIds are
// timestamp-based (effectively unique), so a full scan across the (small) set of months that
// have ever had anything ingested is correct and cheap enough for this prototype's scale.
function findNlhIngestedPlanById(store, planId) {
  for (const month of Object.keys(store.nlhIngestedPlans)) {
    const found = (store.nlhIngestedPlans[month] || []).find(p => p.planId === planId);
    if (found) return found;
  }
  return null;
}

