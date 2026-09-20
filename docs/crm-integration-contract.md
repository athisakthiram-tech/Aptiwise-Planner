# Aptiwise CRM ↔ Aptiwise Planner Integration Contract (Planner Side)

**Status: DESIGN ONLY. Nothing in this document is implemented as a live
integration.** No network call, Supabase client, cookie, auth flow, or
production API route exists yet for this integration. This document and
the accompanying pure TypeScript types under `lib/integration/crm/` are
the Planner-side half of a contract to be agreed with the Aptiwise CRM
repository (developed separately by the Codex agent) before either side
builds real transport.

Every claim below is tagged:

- `[VERIFIED CRM FACT]` — supplied directly by the CRM-side audit for this
  task; not independently re-verified by this repository.
- `[EXISTING PLANNER]` — traced directly from this repository's actual
  code, with file references.
- `[PROPOSED CONTRACT]` — a design proposal for the two repositories to
  agree on. Not implemented.
- `[SECURITY REQUIREMENT]` — a hard constraint the design must satisfy.
- `[OPEN QUESTION]` — something only the CRM side (or a joint decision)
  can resolve; flagged rather than guessed.

---

## 0. Verified CRM contract facts (as supplied, not re-audited here)

`[VERIFIED CRM FACT]`

- Framework: React/TypeScript, Vinext Next.js App Router compatibility.
- Auth: Supabase Auth, server-validated user, cookie sessions.
- Canonical advisor identity: `auth.users.id`.
- Customer model: `leads` table. Converted customers remain lead records.
- Canonical customer identity: `leads.id`.
- Ownership: `leads.advisor_id = auth.users.id`.
- RLS: advisor-scoped access; activity writes additionally validate
  parent-lead ownership.
- Customer detail route: `/leads/[id]`.
- Production domain: `https://aptiwise.org`. Cloudflare Worker: `aptiwise`.
  Production deployment/version not reverified during the CRM audit.
- Supabase access: server-side cookie-aware client; a privileged
  (service-role) client is restricted to server-only code.
- CRM customer fields available today: `name`, `phone`, `DOB`,
  `occupation`, `address`, `family size`, `monthly income`, `policy
  notes`.
- CRM does **not** currently structure: existing insurance coverage,
  goals, liabilities, investments, planning budget, risk preferences.
- CRM audit's stated security requirements: no auth/access tokens in
  URLs; no customer PII in URLs; no browser service-role access; browser-
  provided customer/advisor IDs cannot be trusted; advisor/customer
  ownership must be independently revalidated.
- CRM audit's recommended integration direction: a short-lived,
  single-use handoff exchanged server-to-server. Future `CustomerPlan`
  persistence: immutable/versioned snapshot with ownership metadata and
  idempotency.

Everything past this section is Planner-side design built on top of
these facts. Nothing below invents additional CRM schema.

---

## 1. Audit: current Planner input model

`[EXISTING PLANNER]`

Planner today has **two** input models, at two different ages of the
codebase, and this document is careful not to conflate them:

### 1a. Superseded: `GoalInput` (`types/index.ts`)

```ts
export interface GoalInput {
  age: number;
  monthlyBudget: number;
  goalType: GoalType;
  targetAmount: number;
  yearsToGoal: number;
  existingLifeCover: number;
  riskComfort: RiskComfort;
}
```

This is the original wizard's step-by-step collection type. It is
**non-nullable** because the old wizard forced an answer for every
field. It still exists and still feeds `Step1Goal`–`Step7Family`
(steps 1–11 of the wizard) and the pre-engine `lib/recommendations/`
module, but it is **not** the canonical planning model any more — see
the header comment on `lib/planning/customerProfile.ts` and the
integration-audit session that retired the old "Step 12" screen built
on top of it.

### 1b. Canonical: `CustomerFinancialProfile` (`lib/planning/customerProfile.ts`)

```ts
export interface CustomerFinancialProfile {
  age: number | null;
  monthlyBudget: number | null;
  annualIncome: number | null;
  goalType: GoalType | null;
  targetGoalAmount: number | null;
  yearsToGoal: number | null;
  existingLifeCover: number | null;
  existingInvestments: number | null;
  outstandingLiabilities: number | null;
  numberOfDependants: number | null;
  annualFamilyExpenses: number | null;
  riskComfort: RiskComfort | null;
  liquidityPreference: LiquidityPreference | null;
}
```

Every field is nullable — `null` always means "unknown", never a
fabricated zero. `buildProfileFromGoalInput(goal: GoalInput)` bridges the
old wizard's non-nullable fields into this model; every field the old
wizard doesn't collect (`annualIncome`, `existingInvestments`,
`outstandingLiabilities`, `numberOfDependants`, `annualFamilyExpenses`,
`liquidityPreference`) stays `null`. This is the model
`calculateProtectionNeed` (`lib/planning/protectionNeeds.ts`),
`calculateGoalNeed` (`lib/planning/goalNeeds.ts`), and
`generateStrategies` (`lib/planning/strategyGenerator.ts`) actually
consume. **This is the canonical Planner input model this integration
contract targets.**

There is no separate canonical "customer" type distinct from this
profile — Planner does not have a customer database record of its own
(see §14, local drafts). Customer *identity* (name/phone) is held
separately, only inside `CustomerPlan.customer`
(`lib/customerPlan/types.ts`), because it is never needed for
calculation — see `lib/customerPlan/createCustomerPlan.ts`'s
`CreateCustomerPlanInput.customer?: { name?; phone? }`.

### 1c. Product configuration

`[EXISTING PLANNER]` — `LicCalculationContext`
(`types/insurance.ts`) is the shape every registered LIC engine accepts:
`age`, `gender`, `basicSumAssured`, `policyTermYears`,
`premiumPayingTermYears`, `premiumMode`, `annualPremium`,
`monthlyBudget`, `goalAmount`, `goalHorizonYears`, `existingLifeCover`,
`taxContext`, and a per-plan `productSpecificInputs` bag. The
integration-audit session added `TermConfigurationOverride`
(`lib/planning/strategyGenerator.ts`) — an optional, additive
`{ basicSumAssured?, policyTermYears?, premiumPayingTermYears? }` an
advisor can supply for the primary term-protection component, re-run
through the exact same registered engine (never a duplicate calculation
implementation). This is unrelated to CRM prefill — it is a
Planner-internal advisor action taken *after* strategies already exist —
and this contract does not change it.

### 1d. Frozen output: `CustomerPlan`

`[EXISTING PLANNER]` — `lib/customerPlan/types.ts`'s `CustomerPlan` is
the immutable, versioned snapshot (`CURRENT_CUSTOMER_PLAN_SCHEMA_VERSION
= 1`) produced by `createCustomerPlan()`. It already has exactly the
shape this contract needs to attach CRM provenance to (§8) without
touching how it is calculated.

---

## 2. CRM → Planner field mapping

`[PROPOSED CONTRACT]`

| CRM field | Planner field | Mapping type | Validation | Used in calculation? | Prefill only? | Required? |
|---|---|---|---|---|---|---|
| `name` | `CustomerPlan.customer.name` (display only) | DIRECT | non-empty, ≤200 chars | No — no `name` field exists anywhere in `CustomerFinancialProfile` | Yes | No |
| `phone` | `CustomerPlan.customer.phone` (display only) | DIRECT | non-empty, ≤32 chars | No | Yes | No |
| `DOB` | `CustomerFinancialProfile.age` | DERIVED (see §2a) | valid past ISO calendar date, implies age 0–119 | Yes (protection/goal-need math) | No — feeds calculation, so REQUIRES_USER_CONFIRMATION at first display | No (Planner still works with an unknown age) |
| `occupation` | *(no Planner field)* | NOT_USED | n/a | No | Yes, display context for the advisor only | No |
| `address` | *(none — excluded)* | NOT_USED | n/a | No | **No — never sent** (see §7) | No |
| `family size` | *(no direct field — see §2b)* | REQUIRES_USER_CONFIRMATION | finite integer, 1–30 | Only after confirmation, into `numberOfDependants` | Shown as a suggested starting value | No |
| `monthly income` | `CustomerFinancialProfile.annualIncome` | DERIVED (`× 12`) | finite, ≥ 0, sane ceiling | Only indirectly — `annualIncome` itself is not read by `calculateProtectionNeed`/`calculateGoalNeed` today (see §2c) | Yes | No |
| `policy notes` | *(none — excluded)* | NOT_USED | n/a | No | **No — never sent** (see §7) | No |

### 2a. Age must always be derived from DOB, never trusted as sent

`[SECURITY REQUIREMENT]` / `[PROPOSED CONTRACT]` — Planner never accepts
a bare `age` number from CRM, even hypothetically. It is always derived
from `dateOfBirth` at an explicit, caller-supplied planning date
(`deriveAgeFromDateOfBirth(dateOfBirthIso, asOfIso)` in
`lib/integration/crm/prefill.ts`). Rationale: a DOB is a stable fact; an
"age" field is a snapshot that silently rots the day after it's sent,
and a stale sent age could quietly understate a customer's real age by a
year in exactly the range where it matters (entry-age eligibility
bands). This function is pure and takes `asOfIso` explicitly rather than
reading `new Date()` internally, so:

- it is deterministic and unit-testable (see
  `tests/integration-crm-prefill.test.ts`'s boundary cases),
- the birthday boundary is explicit: someone born `2000-09-20` is `25`
  on `2026-09-19` and turns `26` on `2026-09-20` — the exact calendar
  day of the birthday counts as the new age,
- a DOB in the future, or implying an age over 119, returns `null`
  (unknown) rather than a fabricated number.

### 2b. `family size` is not blindly `numberOfDependants`

`[OPEN QUESTION]` — CRM's "family size" likely counts the customer (and
possibly a spouse), while Planner's `numberOfDependants` means people
financially dependent on the customer, excluding the customer. These
are not the same number without a definition from the CRM side.
`mapPrefillToProfileSeed` (`lib/integration/crm/prefill.ts`) therefore
**does not** auto-populate `numberOfDependants` from `familySize` at
all — it is surfaced to the advisor as a suggested starting value to
confirm or correct in the wizard step that already asks for it, never
silently substituted for a calculation input.

### 2c. `monthly income` today

`[EXISTING PLANNER]` — `CustomerFinancialProfile.annualIncome` exists in
the type but is not currently read by `calculateProtectionNeed` (which
uses `outstandingLiabilities` + `futureFamilySupport` — itself driven by
`annualFamilyExpenses` × a caller-supplied `incomeReplacementYears`, not
income directly — + `goalObligations`) or by `calculateGoalNeed`. Mapping
`monthlyIncome × 12` into `annualIncome` is therefore safe to prefill
today (§2c's DERIVED mapping is a pure, reversible unit conversion, not
a judgment call) precisely *because* it does not yet feed any formula —
if a future protection-need methodology starts consuming
`annualIncome`, this mapping should be re-reviewed for a
REQUIRES_USER_CONFIRMATION treatment.

---

## 3. Fields Planner must still collect

`[PROPOSED CONTRACT]`

CRM has no structured fields for: **existing insurance coverage,
goals, liabilities, investments, planning budget, risk preferences.**
This contract does **not** ask the CRM to add schema for any of these
to launch integration. The flow is explicitly additive:

```
  CRM-known information (name, phone, DOB→age, occupation*, income*)
  +
  Planner-collected planning information (goal, target amount, years,
    existing life cover, existing investments, liabilities, monthly
    planning budget, risk comfort, liquidity preference)
  =
  the SAME CustomerFinancialProfile Planner already builds today
```

\* display/prefill only, per §2.

Concretely: a CRM-originated Planner session still walks the SAME wizard
steps that collect goal/coverage/liabilities/investments/budget/risk
today — it only starts with `age` (and, cosmetically, name/phone)
already filled in, exactly like `buildProfileFromGoalInput` already
seeds `CustomerFinancialProfile` from whatever `GoalInput` supplies and
leaves the rest `null`. No new "planning fields" schema is required on
the CRM side for this stage of integration.

---

## 4. Integration context: untrusted vs. verified

`[PROPOSED CONTRACT]` — implemented as pure types in
`lib/integration/crm/types.ts`.

This is the single most important distinction in the whole contract.
**Two separate types exist on purpose, and they must never be
confused:**

### 4a. `CrmHandoffReference` — untrusted, may appear in a URL

```ts
export interface CrmHandoffReference {
  contractVersion: number;
  handoffId: string; // opaque, single-use, short-lived — nothing else
}
```

This is the *only* CRM-integration shape a Planner client component may
ever read from a URL/query string. It carries **no identity** — not
`advisorId`, not `leadId`, not a name, not a phone number, not a token.
A client component must treat this as "a claim to be verified", never as
proof of anything.

### 4b. `VerifiedCrmContext` — only exists after a future server exchange

```ts
export interface VerifiedCrmContext {
  contractVersion: number;
  advisorId: string;    // = auth.users.id, trusted only via the exchange
  leadId: string;       // = leads.id, ownership already checked
  issuedAt: string;
  verifiedAt: string;
  returnDestination: CrmReturnDestination;
}
```

`VerifiedCrmContext` must never be constructed by a Planner client
component. It only comes into existence after a *future* Planner server
route exchanges a `CrmHandoffReference` with the CRM's server, and the
CRM has independently reverified (server-to-server, per §5):

- the advisor's own Supabase session is still valid,
- `leads.advisor_id = auth.users.id` for the named lead,
- the handoff has not expired,
- the handoff has not already been consumed.

No Planner code today constructs a `VerifiedCrmContext` — there is no
validator for it in `lib/integration/crm/validation.ts`, deliberately:
validating a shape that claims to already be "verified" from
client-reachable code would be a lie. The type exists purely so both
repositories can agree on what a *future* server hands to Planner's
*own* server-rendered/server-actioned code after the exchange completes.

---

## 5. Handoff security model (design only — not implemented)

`[PROPOSED CONTRACT]` following the CRM audit's own recommended
direction.

```
CRM (aptiwise.org, advisor already signed in)
  │
  │  advisor clicks "Open in Planner" on /leads/[id]
  ▼
CRM server route (future)
  - reads the advisor's own server-validated Supabase session
  - reverifies leads.advisor_id = auth.users.id for this lead
  - creates a short-lived, single-use handoff record
      (opaque id, expiry, consumed=false, leadId, advisorId — server-side only)
  - redirects the browser to Planner carrying ONLY the opaque handoffId
  ▼
Planner (may be a different origin)
  - browser lands with ?handoff=<opaque id> (or an equivalent opaque param)
  - a Planner SERVER route (future) reads that id and calls the CRM's
    server-to-server exchange endpoint — never the browser calling CRM directly
  ▼
CRM server (future exchange endpoint)
  - looks up the handoff by its opaque id
  - checks: not expired, not already consumed, still tied to a lead the
    advisor session (still validated at issue time) actually owns
  - marks it consumed (single use)
  - returns advisorId + leadId + whatever prefill fields it chooses to share
  ▼
Planner server (future)
  - constructs a VerifiedCrmContext from the exchange RESPONSE, never
    from the original URL
  - hands the browser only what it needs to render (never advisorId/
    leadId as freestanding trusted browser state — see §6)
```

Design requirements this flow must satisfy:

- **Handoff lifetime**: short (CRM decides the exact TTL; this document
  does not fix a number, since it's the CRM's record to own — but it
  should be short enough that a leaked/logged URL is useless within
  minutes, not hours).
- **One-time consumption**: the CRM marks a handoff consumed atomically
  with the exchange lookup, so a second exchange attempt with the same
  `handoffId` fails even if it races the first.
- **Replay protection**: consumption state lives server-side on the CRM
  (Planner never re-derives or re-validates "has this been used" itself
  — it has no database of its own for this). A captured/replayed
  `handoffId` after first use must be rejected by the CRM's exchange
  endpoint, not by Planner guessing.
- **Ownership verification**: happens twice — once when the CRM *issues*
  the handoff (the advisor's session is valid *then*), and again when
  the CRM's exchange endpoint *consumes* it (defends against a session
  that was revoked in between).
- **Malformed/expired handoff**: the exchange returns a clear failure;
  Planner shows a "This link is no longer valid — please reopen the
  customer from Aptiwise CRM" state (see §13), never a partially-filled
  wizard pretending the exchange half-worked.
- **Already-consumed handoff**: same failure family as expired — Planner
  cannot and must not distinguish "expired" from "already used" from
  "forged" in a way that leaks which one it was (that distinction is
  useful to an attacker probing the endpoint, not to a legitimate
  advisor); a single generic "handoff invalid" state covers all three.

---

## 6. Cross-domain auth

`[SECURITY REQUIREMENT]`

Planner may be hosted on an origin other than `https://aptiwise.org`.
**Supabase's own auth cookies are scoped to the domain that set them and
do not automatically travel to a different origin.** This contract does
not assume otherwise anywhere:

- Planner never expects to read a Supabase session cookie set by the
  CRM.
- Planner never expects `document.cookie` sharing, iframe-based cookie
  tricks, or a shared parent-domain cookie (e.g. relying on both being
  under `*.aptiwise.org`) unless a future decision explicitly puts both
  apps on the same registrable domain — and even then, this contract
  would still prefer the handoff-exchange model over ambient cookie
  trust, because RLS ownership must be reverified per §5 regardless of
  how the advisor got there.
- The entire handoff model in §5 is deliberately origin-agnostic: it
  works whether Planner is a subpath of `aptiwise.org`, a subdomain, or
  a fully separate domain, because identity crosses the boundary
  exactly once, server-to-server, during the exchange — never via a
  shared browser cookie jar.

`[OPEN QUESTION]` — if Planner and CRM are ultimately deployed under the
same top-level domain, a shared-cookie session *could* be proposed
later, but that is a separate, larger authentication-sharing design this
task explicitly excludes ("DO NOT implement authentication sharing").

---

## 7. Prefill model — data minimization

`[PROPOSED CONTRACT]` — `PlannerPrefill` in `lib/integration/crm/prefill.ts`:

```ts
export interface PlannerPrefill {
  customerName?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null; // ISO calendar date only
  occupation?: string | null;
  familySize?: number | null;
  monthlyIncome?: number | null;
}
```

Field-by-field decision:

| CRM field | Decision | Rationale |
|---|---|---|
| `name` | **SEND** | Needed to personalize the proposal/PDF (`CustomerPlan.customer.name`); already optional and display-only in Planner today. |
| `phone` | **SEND** | Needed for the existing WhatsApp-share flow (`components/customerPlan/export/WhatsAppSummary.tsx`); already optional in Planner today. |
| `DOB` | **SEND** | The only CRM field that maps to an actual calculation input (age), via §2a's derivation — never sent as a bare age. |
| `occupation` | **OPTIONAL — SEND, display only** | Harmless context for the advisor's own reference; not used in any calculation; small enough to not be a meaningful data-minimization concern. |
| `address` | **DO NOT SEND** | No planning use whatsoever, and a physical address is more sensitive PII than anything Planner otherwise handles — it appears in no wizard step, no CustomerPlan field, no proposal. Sending it would be pure exposure with zero benefit. |
| `family size` | **OPTIONAL — SEND as a suggestion only** | Useful as a *starting point* for the wizard's dependants question, but per §2b it must be advisor-confirmed before it becomes `numberOfDependants` — never silently trusted. |
| `monthly income` | **OPTIONAL — SEND** | Not currently used in any calculation (§2c), but low sensitivity relative to its planning relevance, and pre-filling it saves the advisor a redundant question if/when income-based methodologies are added later. |
| `policy notes` | **DO NOT SEND** | Free-text, unbounded, and likely to contain exactly the kind of sensitive/ad-hoc advisor commentary (other insurers, family circumstances, negotiation notes) that has no defined structure and no legitimate Planner use — the highest-risk, lowest-value field in the set. |

---

## 8. `CustomerPlan` CRM provenance

`[PROPOSED CONTRACT]` — **not yet added to `lib/customerPlan/types.ts`**
(see §21/§24 — this task is documentation + a standalone pure module,
not a change to the production `CustomerPlan` schema). The proposed
shape, for the CRM/Planner teams to agree on before it is actually added:

```ts
// PROPOSED — not part of lib/customerPlan/types.ts today.
export interface CustomerPlanCrmProvenance {
  source: "aptiwise_crm";
  contractVersion: number;       // integration contract version — see §15
  advisorRef: string;            // = auth.users.id at creation time
  customerRef: string;           // = leads.id at creation time
  createdViaHandoffAt: string;   // ISO-8601 — when the verified context was established
}

// PROPOSED addition to CustomerPlan:
interface CustomerPlan {
  // ...all existing fields, unchanged...
  sourceContext?: CustomerPlanCrmProvenance; // absent for standalone plans
}
```

Requirements this design satisfies:

- **Standalone plans keep working unmodified.** `sourceContext` is
  optional; every existing `createCustomerPlan()` call site
  (`components/customerPlan/CreatePlanAction.tsx` and all 51 existing
  `CustomerPlan`-related tests) produces a plan with `sourceContext`
  absent, and that must remain a fully valid `CustomerPlan` forever —
  the field is add-only, not a breaking schema change, and would not by
  itself require a `CURRENT_CUSTOMER_PLAN_SCHEMA_VERSION` bump.
- **CRM provenance never touches a calculation.** `advisorRef`/
  `customerRef` are pure metadata copied in *after* `createCustomerPlan`
  has already produced a snapshot from `CustomerFinancialProfile` +
  `ProtectionNeedResult` + `GoalNeedResult` + `StrategyResult` — none of
  which know or care whether the profile originated from CRM prefill or
  manual entry (see the "CRM provenance never affects financial
  calculation" test group in
  `tests/integration-crm-prefill.test.ts`, which proves a CRM-seeded
  profile and a manually-entered profile with the same values produce
  byte-identical `calculateProtectionNeed`/`calculateGoalNeed` output).
- **Never a token/secret.** `CustomerPlanCrmProvenance` holds identifiers
  only — no access token, refresh token, service-role key, or handoff
  secret is ever placed inside a `CustomerPlan`, which is (today) stored
  in the advisor's own browser `localStorage`
  (`lib/customerPlan/customerPlanStorage.ts`) and is explicitly designed
  to be exported to PDF/WhatsApp — anything placed in it should be
  assumed eventually visible to the customer, not just the advisor.

---

## 9. Immutability

`[EXISTING PLANNER PRINCIPLE, reaffirmed]`

`CustomerPlan` is already documented (see `createCustomerPlan.ts`'s
header comment) as "a future update to a product's rate table, or to
the strategy generator's own logic, must never silently change an
already-created plan." CRM provenance must follow the same rule:
`sourceContext` is metadata **attached to** the frozen plan at creation
time, never a live pointer used to *rebuild* it. If the LIC catalogue,
engine formulas, tax wording, or the CustomerPlan schema itself changes
later, an already-saved proposal — CRM-linked or standalone — must
remain interpretable exactly as it was created. `sourceContext` records
*where a plan came from*, not *how to regenerate it*.

---

## 10. Planner → CRM completion contract

`[PROPOSED CONTRACT]` — `CrmPlanCompletionAcknowledgement` in
`lib/integration/crm/types.ts`:

```ts
export interface CrmPlanCompletionAcknowledgement {
  contractVersion: number;
  leadId: string;
  advisorId: string;
  planId: string;            // = CustomerPlan.id
  planSchemaVersion: number; // = CustomerPlan.schemaVersion
  createdAt: string;         // = CustomerPlan.createdAt
  status: "created";
}
```

### Plan snapshot vs. completion acknowledgement

These are deliberately different things:

- **Plan snapshot** = the full `CustomerPlan` — every financial figure,
  every LIC product identity, every status, every disclosure. This is
  large, detailed, and entirely Planner's own concern.
- **Completion acknowledgement** = "a proposal now exists for this
  lead", plus just enough identifiers to look it up later. The CRM does
  not need to parse 31 LIC engines' worth of internal detail merely to
  record that Planner produced a proposal — it needs a `planId` it can
  store next to the lead, and enough version metadata to know which
  schema that `planId` refers to if/when it ever asks Planner for the
  full plan back (a future, separate concern — likely a
  `GET`-by-`planId` boundary once `CustomerPlan` persistence exists
  server-side, which does not exist today; see §20).

The acknowledgement travels **server-to-server** in the target
architecture (Planner's future server → CRM's future
`POST /api/planner/plans`-shaped endpoint), never through the browser
URL — the browser only ever needs to see a success/failure UI state and
an eventual "← Return to Customer" link (§12).

---

## 11. Idempotency

`[PROPOSED CONTRACT]`

`planId` (`CustomerPlan.id`, already a `crypto.randomUUID()` assigned
once inside `createCustomerPlan()` and never regenerated for the same
plan — see `lib/customerPlan/createCustomerPlan.ts`) is the natural
idempotency key for the completion acknowledgement:

- **Advisor double-clicks Save** → the same in-memory `CustomerPlan`
  object is used for both clicks, so both acknowledgements would carry
  the same `planId`; a future CRM endpoint should treat a repeated
  `planId` as an upsert/no-op, never a duplicate row.
- **Network retry** → same reasoning; the client retries the exact same
  acknowledgement payload, `planId` unchanged.
- **Browser refresh** → if the advisor reloads after a plan was already
  created and re-triggers "Create Customer Plan", `createCustomerPlan()`
  generates a genuinely **new** `planId` (it is a fresh snapshot of
  potentially-recalculated strategies) — this is correctly a *new* plan,
  not a duplicate of the old one, and is not something idempotency
  should suppress.
- **Planner retries its own completion callback** → same `planId`,
  same-outcome guarantee as the double-click case.

`validateCrmPlanCompletionAcknowledgement` in
`lib/integration/crm/validation.ts` treats an acknowledgement as a pure,
re-verifiable value — validating the same payload twice produces the
identical parsed result (see the "round-trips unchanged" test), which
is the property a future idempotent endpoint needs to build on.

---

## 12. Return to CRM

`[PROPOSED CONTRACT]` — `CrmReturnDestination` +
`buildCrmReturnUrl()` in `lib/integration/crm/types.ts` /
`validation.ts`:

```ts
export type CrmOrigin = "https://aptiwise.org"; // literal allowlist, today exactly one value
export interface CrmReturnDestination {
  crmOrigin: CrmOrigin;
  leadId: string;
}
```

`"← Return to Customer"` must resolve to `/leads/[id]` on the CRM — but
the destination is **never** built from arbitrary browser input. It is
only ever constructed from a `CrmReturnDestination` that itself only
ever comes from an already-verified `VerifiedCrmContext.returnDestination`
(§4b), which in turn only exists after the future server-side exchange
in §5. `buildCrmReturnUrl()` has no overload accepting a raw string —
the only way to get a return URL out of this module is to already hold
a value the type system proves passed through `crmOrigin`'s literal
allowlist and a leadId shape check.

**Standalone Planner mode never shows a "Return to Customer" action at
all** — the UI's future decision to render that button must be gated on
"a `VerifiedCrmContext` exists for this session", not on "a query
parameter happened to look CRM-shaped."

---

## 13. Failure states

`[PROPOSED CONTRACT]`

| Situation | Planner behavior |
|---|---|
| Invalid handoff (malformed `handoffId`/`contractVersion`) | Generic "This link isn't valid" state; offer to continue in standalone mode. |
| Expired handoff | Same generic invalid-link state (§5 — never distinguished from "already used" in the UI). |
| Already-used handoff | Same generic invalid-link state. |
| CRM unavailable (future exchange endpoint times out/errors) | Planner still lets the advisor use the wizard standalone (no CRM context) — CRM being down must never block Planner's own calculations, which need no CRM data at all. |
| Ownership verification failure | Same generic invalid-link state — Planner never learns *why* ownership failed, only that it did. |
| Customer (lead) deleted after handoff was issued but before exchange | The exchange itself fails (the CRM's own lookup fails) — same generic invalid-link state on the Planner side. |
| Malformed prefill payload | Rejected field-by-field by `validateCrmPrefillPayload` (§17) — Planner proceeds with whatever subset of fields *did* validate, and leaves the rest as the standalone-mode "unknown" default. A malformed `dateOfBirth` must never fall back to age `0` or any other guess. |
| Unsupported contract version | Rejected outright by every validator in `lib/integration/crm/validation.ts` (checked against `SUPPORTED_CRM_CONTRACT_VERSIONS`) — Planner refuses to *guess* at an unknown contract shape rather than partially trusting it. |
| Planner standalone mode (no handoff at all) | The default, fully-supported mode today — see §21. |
| Plan created but CRM persistence/acknowledgement fails | **The frozen `CustomerPlan` is never lost.** It already exists as an in-memory object and can already be saved as a local draft via the existing `SaveDraftAction`/`customerPlanStorage.ts` regardless of CRM outcome. The advisor sees a clear "saved locally; couldn't notify Aptiwise CRM yet" state and can retry the acknowledgement later (idempotently, per §11) without recreating the plan. |
| CRM save succeeds but acknowledgement fails | Same recovery path as above from Planner's point of view — Planner cannot know the CRM-side save succeeded if the acknowledgement round-trip itself failed, so it must retry the *acknowledgement*, not recreate the plan (the `planId` idempotency in §11 makes a resend safe either way). |

The unifying rule: **no failure mode may ever destroy a frozen
`CustomerPlan` the advisor already has in front of them.** Local draft
storage is always the fallback net.

---

## 14. Local drafts vs. CRM-linked plans

`[EXISTING PLANNER, preserved]` / `[PROPOSED CONTRACT]`

Local drafts (`lib/customerPlan/customerPlanStorage.ts`,
`components/customerPlan/DraftPlans.tsx`) are **not removed or
weakened** by this design. Going forward, two kinds of saved plan exist
conceptually:

- **Standalone/local draft** — a `CustomerPlan` with no `sourceContext`,
  saved only in the advisor's own browser `localStorage`. It already
  carries an explicit, localized "Draft saved on this device." notice
  (`customerPlan.draftSavedOnDevice`) — this notice must remain accurate
  and must **not** be shown, or must be supplemented with a clearer
  statement, once a plan is also CRM-linked, so an advisor never
  mistakes "saved in this browser" for "safely stored in Aptiwise CRM."
- **CRM-linked persisted proposal** — a `CustomerPlan` with
  `sourceContext` present *and* a successful completion acknowledgement
  round-trip (§10/§11). Until CRM-side `CustomerPlan` persistence
  actually exists (it doesn't yet — see the CRM audit's own "Future
  CustomerPlan persistence" note), a CRM-linked plan is still only
  physically stored in the advisor's browser, same as a local draft —
  the distinction today would only be "this plan is *associated* with a
  CRM lead", not "this plan is durably stored server-side." The future
  UI must not overstate this before real CRM-side persistence exists.

`[OPEN QUESTION]` — the exact future UI treatment (a badge, a separate
list, a filter) is not designed here; only the underlying data
distinction (`sourceContext` present/absent) is specified, since that is
what the UI would need to exist first.

---

## 15. Versioning — two independent numbers

`[PROPOSED CONTRACT]`

| | Integration contract version | `CustomerPlan` schema version |
|---|---|---|
| Constant | `CRM_INTEGRATION_CONTRACT_VERSION` (`lib/integration/crm/types.ts`) | `CURRENT_CUSTOMER_PLAN_SCHEMA_VERSION` (`lib/customerPlan/types.ts`) |
| Governs | The shape of handoff/prefill/completion payloads exchanged between the two repositories | The shape of a saved `CustomerPlan` snapshot |
| Owned by | Joint CRM+Planner agreement | Planner alone |
| Bumped when | A handoff/prefill/completion field is added, removed, or reinterpreted | `CustomerPlan`'s own internal shape changes in a way old drafts can't be read as-is |
| Today's value | `1` | `1` |

These are equal today purely by coincidence of project stage. **Nothing
in this design assumes they move together.** `CustomerPlanCrmProvenance`
(§8) carries its own `contractVersion` field specifically so a CRM-linked
plan records *which contract* produced it, independent of which
`CustomerPlan` schema version it also happens to be. A future
`CustomerPlan` schema v2 must not require an integration contract v2,
and vice versa.

---

## 16–17. Pure types and validation added in this repository

`[EXISTING PLANNER — added by this task]`

```
lib/integration/crm/
  types.ts       — contract version constants, CrmHandoffReference,
                    VerifiedCrmContext, CrmReturnDestination,
                    CrmOrigin/ALLOWED_CRM_ORIGINS,
                    CrmPlanCompletionAcknowledgement
  prefill.ts     — PlannerPrefill, RawCrmPrefillPayload,
                    deriveAgeFromDateOfBirth, mapPrefillToProfileSeed
  validation.ts  — validateCrmHandoffReference, validateCrmPrefillPayload,
                    validateCrmReturnDestination, buildCrmReturnUrl,
                    validateCrmPlanCompletionAcknowledgement
```

No file in this module imports `fetch`, `next/server`, any Supabase
package, or anything cookie-related — confirmed by inspection (there is
no such dependency anywhere in this repository today for this module to
accidentally import) and by this being pure, side-effect-free TypeScript
throughout.

Every validator follows the same convention as the existing
`lib/customerPlan/customerPlanValidation.ts`: it **reports** problems
via a `{ valid, errors, value }` result and never repairs, coerces,
truncates, or invents a value to make invalid external data pass.
Rejected inputs include: unknown contract versions; missing identifiers;
malformed UUIDs for `leadId`/`advisorId`/handoff-adjacent identifiers
(assuming the standard Supabase UUID convention — see the `[OPEN
QUESTION]` in `validation.ts`'s `UUID_PATTERN` comment, since the CRM
audit did not explicitly restate "and these are UUID-formatted"); a
future/implausible date of birth; a non-integer or out-of-range family
size; `NaN`/`Infinity` for any numeric field; and oversized strings for
every free-text field (`name`, `phone`, `occupation`, `handoffId`).

---

## 18. Tests

`[EXISTING PLANNER — added by this task]`

- `tests/integration-crm-prefill.test.ts` — DOB→age boundary behavior
  (before/on/after the birthday, future DOB, implausible age, malformed
  date), `mapPrefillToProfileSeed` never setting a planning-specific
  field CRM doesn't provide, `numberOfDependants` never auto-filled from
  `familySize`, unknown staying `null` (never `0`) after merging with
  `UNKNOWN_CUSTOMER_PROFILE`, a CRM-seeded profile producing byte-
  identical `calculateProtectionNeed`/`calculateGoalNeed` output to the
  same values entered manually, and `validateCrmPrefillPayload`
  accepting valid/empty payloads while rejecting future DOBs, `NaN`/
  `Infinity` income, invalid family size, and oversized strings.
- `tests/integration-crm-contract.test.ts` — valid/invalid handoff
  references (including rejecting a handoff id that looks like a raw
  UUID, since an opaque reference must never double as a real
  identifier), the handoff reference type never containing an identity/
  token-shaped field, return-destination validation rejecting a
  non-allowlisted origin and a malformed leadId, a compile-time proof
  that `buildCrmReturnUrl` has no string-accepting overload, completion-
  acknowledgement validation (valid/invalid contract version/ids/
  timestamp/status), the acknowledgement never containing any
  `CustomerPlan`-shaped field, `planId`-based idempotent round-tripping,
  and the two version constants being independently declared.
- No fake network integration tests were added — every test here calls
  a pure function directly with an in-memory object, per this task's
  explicit instruction.
- The full existing suite (EN/TA/HI translations, all 31 LIC engines,
  the Strategy Generator, `CustomerPlan` creation/validation/storage, the
  Proposal export layer, and the wizard integration tests added in the
  prior integration-audit session) was re-run unchanged and untouched by
  this task — see the VALIDATION section below.

---

## 19. Security review

`[SECURITY REQUIREMENT]`

1. **What data can cross CRM → Planner?** Only what `PlannerPrefill`
   models after passing `validateCrmPrefillPayload`: name, phone, date
   of birth, occupation, family size, monthly income — and, separately,
   only what `VerifiedCrmContext` models after a future server-side
   exchange: `advisorId`, `leadId`, timestamps, and a return destination.
2. **What data should not cross?** `address` and `policyNotes` (§7) —
   never sent, not even optionally. No access token, refresh token,
   service-role key, or handoff secret is ever represented in any type
   in `lib/integration/crm/*` (verified by the "no tokens/secrets
   representable" test, which checks the actual key sets).
3. **What may appear in the browser URL?** Only an opaque
   `CrmHandoffReference` (`contractVersion` + `handoffId`). Never
   `advisorId`, `leadId`, phone, name, income, DOB, or any Supabase
   token.
4. **What must only exist server-side?** The handoff's consumption
   state (expired/used tracking), the actual advisor-session
   revalidation, the `leads.advisor_id` ownership check, and the
   privileged Supabase client the CRM audit already restricts to
   server-only code. Planner's own future exchange call is also
   server-to-server, never issued from a client component.
5. **What does Planner trust before handoff verification?** Nothing
   identity-related. A `CrmHandoffReference` is a claim to be checked,
   not a fact.
6. **What does Planner trust after verification?** Only the fields on
   `VerifiedCrmContext`, and only because a future server-to-server
   exchange — not the original browser redirect — produced them.
7. **How is advisor ownership expected to be revalidated?** Twice, per
   §5: once when the CRM issues the handoff (session valid at that
   moment) and again when the CRM's exchange endpoint consumes it
   (`leads.advisor_id = auth.users.id` rechecked at consumption time,
   not assumed still true from issuance time).
8. **Why can `leadId` alone never authorize access?** A `leadId` is
   (per §17's open question) very likely a predictable-shape UUID with
   no secrecy property of its own — RLS on the CRM side already keys
   access off `advisor_id`, not off knowledge of a lead's id, precisely
   because *knowing* an id is not the same as *owning* the record it
   names. Planner treating a bare `leadId` as sufficient would bypass
   exactly the ownership check the CRM's own RLS exists to enforce.
9. **What happens across separate domains?** Covered in full in §6 —
   no ambient cookie sharing is assumed; the handoff-exchange model is
   origin-agnostic by design.
10. **Where would future rate limiting/replay protection live?** On the
    CRM's handoff-issuance and handoff-exchange endpoints (§20) — a
    single-use, expiring, server-tracked handoff record is itself the
    primary replay defense; endpoint-level rate limiting on top of that
    is the CRM/Planner server infrastructure's concern, not something
    representable in these pure client-safe types.

---

## 20. Future server endpoints — design only, not implemented

`[PROPOSED CONTRACT]` — names are illustrative, not final.

### CRM: `POST /api/planner/handoff`
- **Caller**: CRM's own server, triggered by an advisor action on
  `/leads/[id]` (e.g. clicking "Open in Planner").
- **Authority**: the advisor's existing server-validated Supabase
  session.
- **Input**: `leadId` (from the CRM's own trusted route context, not
  client input), implicitly `advisorId` from the session.
- **Output**: a `CrmHandoffReference`-shaped `{ contractVersion,
  handoffId }`, plus a redirect/URL to Planner carrying only that.
- **Ownership check**: `leads.advisor_id = auth.users.id` before issuing.
- **Idempotency**: not required to be idempotent itself — each click may
  mint a fresh handoff; the *consumption* side is what must be
  single-use.
- **Failure behavior**: 401/403 if the session or ownership check fails;
  no handoff is created.

### Planner: `POST /api/integration/crm/exchange`
- **Caller**: Planner's own server (never a Planner client component),
  immediately after the browser lands with a `CrmHandoffReference`.
- **Authority**: none of its own — it is a pass-through that presents
  the `handoffId` to the CRM's exchange endpoint below and trusts only
  that response.
- **Input**: a validated `CrmHandoffReference` (via
  `validateCrmHandoffReference`).
- **Output**: a `VerifiedCrmContext` (built only from a successful CRM
  response) or a generic failure.
- **Ownership check**: none performed by Planner itself — Planner
  relies entirely on the CRM's own check in the next endpoint; Planner's
  job is only to not fabricate a `VerifiedCrmContext` if that check
  fails.
- **Idempotency**: a repeated exchange attempt with an already-consumed
  `handoffId` must fail (enforced by the CRM side, per single-use
  consumption).
- **Failure behavior**: any CRM-side rejection (expired/used/invalid/
  ownership failure) collapses to the single generic "handoff invalid"
  state in Planner (§13) — never a distinguishing error surfaced to the
  browser.

### CRM: `POST /api/planner/handoff/exchange` (server-to-server, called by the endpoint above)
- **Caller**: Planner's server only — never a browser.
- **Authority**: none from the caller besides possessing the
  `handoffId`; the CRM's own stored handoff record is the source of
  truth.
- **Input**: `handoffId`.
- **Output**: `{ advisorId, leadId, issuedAt }` plus whatever
  `RawCrmPrefillPayload` fields the CRM chooses to share (§7's SEND set).
- **Ownership check**: `leads.advisor_id = auth.users.id` reverified at
  this moment, not assumed from issuance.
- **Idempotency**: explicitly NOT idempotent — a second call with the
  same `handoffId` must fail (already consumed). This is the one
  boundary in this design that must NOT be idempotent, by design (§11's
  idempotency guarantee is for the *completion* direction, not the
  handoff-consumption direction).
- **Failure behavior**: `410 Gone`-shaped response for expired/consumed;
  `404`-shaped for unknown; `403`-shaped for an ownership mismatch found
  at this moment. Planner does not need to see which one.

### CRM: `POST /api/planner/plans` (completion acknowledgement)
- **Caller**: Planner's server, after a `CustomerPlan` has been created
  (and, in a future stage, persisted).
- **Authority**: the `advisorId`/`leadId` from the `VerifiedCrmContext`
  established during exchange — not re-derived from client input at
  this point either.
- **Input**: a `CrmPlanCompletionAcknowledgement` (§10).
- **Output**: acknowledgement of receipt (e.g. `{ status: "recorded" }`).
- **Ownership check**: the CRM independently reverifies
  `leadId`/`advisorId` still match before recording anything against the
  lead.
- **Idempotency**: keyed on `planId` (§11) — a repeated call with the
  same `planId` must be a safe no-op.
- **Failure behavior**: Planner retries the acknowledgement (idempotent)
  without recreating the `CustomerPlan`; the frozen plan is never lost
  regardless of this endpoint's availability (§13).

---

## 21. Standalone Planner mode is unaffected

`[EXISTING PLANNER, reaffirmed]`

Direct visit → fill the wizard manually → `generateStrategies` →
`StrategyDetails` → `createCustomerPlan()` → `CustomerPlanPreview` →
`SaveDraftAction` (local draft) → `ProposalActions` (browser print/PDF,
WhatsApp/Web Share) continues to work exactly as it does today, with
zero code paths in this repository currently touched by anything under
`lib/integration/crm/`. No component imports that module. No existing
function signature changed. CRM integration is, and must remain,
strictly additive and optional — Planner's own 1269+ pre-existing tests
pass unmodified (see VALIDATION below), and nothing in this task made
CRM context a precondition for any calculation.

---

## Open questions for the CRM side (Codex)

1. Are `leads.id` and `auth.users.id` guaranteed UUID-formatted? This
   contract's validators assume so (§17); please confirm or correct.
2. What TTL should a handoff carry, and where is "already consumed"
   state stored (a `handoffs` table? a Redis-style cache?) — this
   document deliberately doesn't guess CRM-side storage.
3. Exact semantics of "family size" (§2b) — does it include the
   customer? A spouse? This determines what the wizard's confirmation
   prompt should suggest as a starting value.
4. Should `occupation`/`monthlyIncome` ever feed a future Planner
   calculation (e.g. an income-replacement methodology)? If so, revisit
   their REQUIRES_USER_CONFIRMATION status in §2.
5. Where will `CustomerPlan` persistence for CRM-linked plans actually
   live — a new CRM-side table, a Planner-side database this repository
   doesn't have today, or both? This affects whether "CRM-linked
   persisted proposal" (§14) is ever more durable than a local draft in
   practice, and is explicitly out of scope for this task.
