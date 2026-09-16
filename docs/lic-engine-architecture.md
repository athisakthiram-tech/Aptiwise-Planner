# LIC Product Engine + Verification Framework

Developer documentation. Not shown to customers.

## Why this exists

The catalogue holds 40 active LIC products (`docs/lic-catalogue-audit.md`)
but only one, Plan 733 (Jeevan Lakshya), has a verified calculation
engine. Building 40 bespoke calculators does not scale and does not match
reality — most products have no verified premium/benefit rules yet. This
framework lets a new product join the system by adding **data +
registration**, not a new bespoke calculator, and lets every other
catalogue-only product report its capabilities honestly (unavailable)
automatically, with zero per-product code.

## Pipeline

```
Catalogue (identity, status, official sources)
   -> Official Source Registry   (lib/insurance/providers/lic/sourceRegistry.ts)
   -> Engine Registry            (lib/insurance/providers/lic/engines.ts)
   -> Capability Resolver        (lib/insurance/capabilities.ts)
   -> EngineResult<T>            (types/insurance.ts)
   -> Generic Comparison Adapter (lib/comparison/genericLicComparison.ts)
   -> Customer UI                (existing components, unchanged)
```

- **Catalogue** (`lib/insurance/providers/lic/catalogue.ts`): identity and
  status only, unchanged by this framework.
- **Official Source Registry**: exact `(planNumber, uin)` lookup of the
  `OfficialProductSource[]` already attached to each catalogue entry — no
  new research, no internet access.
- **Engine Registry** (`LicProductEngine`, `getLicProductEngine`): exact
  `(planNumber, uin)` lookup of an optional set of calculation methods
  plus a declared `ProductCapabilities` snapshot. A product with no entry
  simply isn't in the map — never a name/plan-number fallback.
- **Capability Resolver** (`resolveProductCapabilities`): for any
  product, returns the registered engine's declared capabilities, or all
  seven dimensions as `"unavailable"` when no engine is registered. This
  is the single place capability truth is decided — nothing else declares
  it independently.
- **`EngineResult<T>`**: the wrapper new engine dimensions
  (familyProtection/tax/costs/liquidity) return. `value` is `T | null`;
  unknown is always `null`, never `0`/`NaN`/`Infinity`.
  Eligibility/premium/benefits keep their existing, already-tested result
  shapes (`EligibilityResult`/`PremiumCalculationResult`/
  `BenefitCalculationResult`) unchanged — registering an existing engine
  never requires rewriting it.
- **Generic Comparison Adapter** (`buildLicProductComparison`): builds a
  `ProtectionAdjustedComparison` from any registered engine's output,
  using the exact same guaranteed-vs-unavailable logic the Plan
  733-specific adapter (`buildPlan733Comparison`) already used — that
  adapter is untouched and both remain available.

## One status vocabulary

`ValueStatus` (`types/insurance.ts`) is used everywhere: engine
capabilities, `EngineResult`, and the comparison layer
(`lib/comparison/protectionAdjustedComparison.ts` re-exports the same
type for its existing importers). There is no second, incompatible
vocabulary and no confidence-upgrading mapping function between layers —
converting an `EngineResult` into a `ComparisonValue` is a direct
passthrough of the same status.

| Status | Meaning |
|---|---|
| `verified` | Confirmed against an official source for this exact input. |
| `partial` | Verified for some inputs/components but not the full picture (e.g. Plan 733's premium: only exact published sample-table points; benefits: guaranteed components only, no bonus). |
| `illustrative` | An explicitly-labeled scenario (e.g. SIP projections), never claimed as guaranteed or expected. |
| `conditional` | Depends on policy/customer specifics not yet supplied. |
| `not_applicable` | Structurally doesn't apply to this product (e.g. expense ratio for a non-market-linked plan). |
| `unavailable` | Not verified/implemented yet. Distinct from `0` (a real known value) and `not_applicable`. |

Customer-facing labels reuse the existing `comparison.status.*`
translation keys (EN/TA/HI) — `partial` was added as
`comparison.status.partial` alongside them; no other customer-facing
change was needed since no UI currently surfaces the generic comparison
output (Plan 733 is still shown through the tested, unchanged
`Plan733Configurator`/`StepFullPicture` path).

## Registering a new product engine

1. Add verified facts/rules to a new `lib/insurance/providers/lic/plans/planXXX.ts`
   (see `plan733.ts` for the pattern: every figure cited to an official
   source, premium/benefit functions that report `missingInputs`/
   `available: false` rather than estimating).
2. Declare its `ProductCapabilities` honestly in
   `lib/insurance/providers/lic/engines.ts` — only mark a dimension
   `verified`/`partial` if the module actually computes it for at least
   some inputs.
3. Add the entry to `LIC_PRODUCT_ENGINES`. It is now automatically:
   - resolvable via `getLicProductEngine`/`resolveProductCapabilities`,
   - included in `getLicVerificationSummary()`'s counts,
   - usable with `buildLicProductComparison` with no new adapter code.
4. The existing `lib/insurance/engineRegistry.ts` (`getPlanEngine`,
   consumed directly by `Plan733Configurator.tsx`/`LicProductDetailSheet.tsx`/
   `StepFullPicture.tsx`) is separate and unaffected — it is not required
   to route through this framework, and this task does not migrate it.

## What deliberately has no implementation yet

`AgeRule`/`TermRule`/`SumAssuredRule`/`DeathBenefitRule`/
`MaturityBenefitRule`/`SurvivalBenefitRule`/`BonusRule`/
`GuaranteedAdditionRule`/`LoanRule`/`SurrenderRule`/`TaxRule`/`ChargeRule`
(all in `types/insurance.ts`) are interfaces only, for a future product
family to implement once it needs them. Plan 733 is not refactored onto
them, to avoid touching its verified behaviour for no functional gain.
