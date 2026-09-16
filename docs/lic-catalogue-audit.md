# LIC Catalogue Audit

**Audit date:** 2026-09-16
**Auditor:** User-supplied, independently checked against the official LIC
website (this session's sandbox cannot reach `licindia.in` directly).

This is developer documentation. It is not shown to customers and must
not be treated as financial/product advice.

## Official sources checked

- Master insurance page — `https://licindia.in/en/web/guest/insurance-plan`
- Endowment — `https://www.licindia.in/en/web/guest/endowment-plans`
- Whole Life — `https://www.licindia.in/en/web/guest/whole-life-plans`
- Money Back — `https://www.licindia.in/en/web/guest/money-back-plans`
- Term Assurance — `https://licindia.in/term-assurance-plans`
- Pension — `https://licindia.in/en/web/guest/pension-plan`
- Unit Linked — `https://www.licindia.in/en/web/guest/unit-linked-plans`
- Micro Insurance — `https://www.licindia.in/en/web/guest/micro-insurance-plans`
- Withdrawn plans — `https://licindia.in/en/web/guest/withdrawn-plans`

## Homepage vs. category-page count discrepancy

LIC's homepage currently reports:

> 27 Insurance Plans, 5 Pension Schemes, 4 Unit Linked Plans, 2 Micro
> Insurance Plans → **38 total**

The individual category pages, read explicitly, list:

> Endowment 12 + Whole Life 3 + Money Back 5 + Term 9 = **29 Insurance
> Plans**, plus Pension 5 + Unit Linked 4 + Micro 2 → **40 total**

This is **not resolved or explained** — no product was removed to force
either number. Aptiwise's canonical catalogue follows the **explicit
identities listed on the individual category pages (40 entries)**, since
those are itemized and independently checkable, whereas the homepage
figure is an unbroken summary count. This discrepancy should be
re-checked on a future audit.

## Result: 40 ACTIVE products

Verified against category-page identity only. See
[Verification scope](#verification-scope) below for what "verified"
does and does not mean here.

### Endowment (12)

| Official name | Plan | UIN |
|---|---|---|
| LIC's Single Premium Endowment Plan | 717 | 512N283V03 |
| LIC's New Endowment Plan | 714 | 512N277V03 |
| LIC's New Jeevan Anand | 715 | 512N279V03 |
| LIC's Jeevan Lakshya | 733 | 512N297V03 |
| LIC's Jeevan Labh | 736 | 512N304V03 |
| LIC's Amritbaal | 774 | 512N365V02 |
| LIC's Nav Jeevan Shree | 912 | 512N387V02 |
| LIC's Bima Lakshmi | 881 | 512N389V01 |
| LIC's New Jeevan Sathi - Single Premium | 888 | 512N393V01 |
| LIC's New Jeevan Sathi - Limited Premium | 889 | 512N394V01 |
| LIC's New Bima Jyoti | 890 | 512N395V01 |
| LIC's Bima Platinum | 770 | 512N397V01 |

### Whole Life (3)

| Official name | Plan | UIN |
|---|---|---|
| LIC's Jeevan Umang | 745 | 512N312V03 |
| LIC's Jeevan Utsav | 771 | 512N363V02 |
| LIC's Jeevan Utsav Single Premium | 883 | 512N392V01 |

### Money Back (5)

| Official name | Plan | UIN |
|---|---|---|
| LIC's Bima Shree | 748 | 512N316V03 |
| LIC's New Money Back Plan - 20 Years | 720 | 512N280V03 |
| LIC's New Money Back Plan - 25 Years | 721 | 512N278V03 |
| LIC's New Children's Money Back Plan | 732 | 512N296V03 |
| LIC's Jeevan Tarun | 734 | 512N299V03 |

### Term Assurance (9)

| Official name | Plan | UIN |
|---|---|---|
| LIC's Digi Term | 876 | 512N356V02 |
| LIC's Digi Credit Life | 878 | 512N358V01 |
| LIC's Yuva Credit Life | 877 | 512N357V01 |
| LIC's Yuva Term | 875 | 512N355V02 |
| LIC's New Tech-Term | 954 | 512N351V02 |
| LIC's New Jeevan Amar | 955 | 512N350V02 |
| LIC's Saral Jeevan Bima | 859 | 512N341V01 |
| LIC's Bima Kavach | 887 | 512N360V01 |
| LIC's Jeevan Raksha | 894 | 512N368V01 |

### Pension (5)

| Official name | Plan | UIN | Market-linked |
|---|---|---|---|
| LIC's New Pension Plus | 867 | 512L347V01 | Yes (unit-linked pension; category stays PENSION per LIC's own site) |
| LIC's Jeevan Akshay-VII | 857 | 512N337V07 | No |
| LIC's New Jeevan Shanti | 758 | 512N338V08 | No |
| LIC's Saral Pension | 862 | 512N342V05 | No |
| LIC's Smart Pension | 879 | 512N386V01 | No |

### Unit Linked / ULIP (4)

| Official name | Plan | UIN |
|---|---|---|
| LIC's Index Plus | 873 | 512L354V01 |
| LIC's Nivesh Plus | 749 | 512L317V02 |
| LIC's SIIP | 752 | 512L334V02 |
| LIC's Protection Plus | 886 | 512L361V01 |

### Micro Insurance (2)

| Official name | Plan | UIN |
|---|---|---|
| LIC's Micro Bachat | 751 | 512N329V03 |
| LIC's Jan Suraksha | 880 | 512N388V01 |

## Products added in this audit (13)

Single Premium Endowment Plan (717); Jeevan Umang (745), Jeevan Utsav
(771), Jeevan Utsav Single Premium (883); Digi Credit Life (878), Yuva
Credit Life (877); New Pension Plus (867), Jeevan Akshay-VII (857), New
Jeevan Shanti (758), Saral Pension (862), Smart Pension (879); Micro
Bachat (751), Jan Suraksha (880).

## Products already present (27)

The full prior catalogue (Endowment ×9 excluding the new addition, Term
×7, Money Back ×5, ULIP ×4, plus Nav Jeevan Shree/Jeevan Lakshya/etc.)
carried over unchanged — no plan number/UIN needed correcting; all were
already on their current active version.

## Withdrawn/replaced versions

Not all historical LIC products were imported — only a small, targeted
set that shares a plan number with a product we carry ACTIVE, added
specifically to prove version safety (a stale UIN must never resolve to
the current product):

| Official name | Plan | UIN | Status |
|---|---|---|---|
| LIC's Nav Jeevan Shree | 912 | 512N387V01 | WITHDRAWN (current: 512N387V02) |
| LIC's Jeevan Akshay-VII | 857 | 512N337V06 | WITHDRAWN (current: 512N337V07) |
| LIC's New Jeevan Shanti | 758 | 512N338V07 | WITHDRAWN (current: 512N338V08) |

Other officially confirmed withdrawn versions (Bima Jyoti Plan 760/
512N339V03; old New Endowment Plan 914/512N277V02; old New Jeevan Anand
915/512N279V02; old Micro Bachat 951/512N329V02; Nav Jeevan Shree -
Single Premium 911/512N390V01) were **not** imported into the catalogue,
since none of them share an identity with a currently-active entry and
importing "all historical products" was explicitly out of scope for
this audit.

## Entries needing additional verification

None of the 40 active entries have unresolved status — all are backed by
an explicit category-page listing. The homepage-count discrepancy above
remains unexplained and should be re-checked on the next audit pass.

## Verification scope

Catalogue presence verifies **product identity and current
active/withdrawn status only** — via the official category-page listing.
It does **not** verify eligibility rules, premiums, benefits, family
protection amounts, tax treatment, costs/charges, or liquidity for any
product. Every new/updated entry's `ProductVerification` keeps
`eligibilityRulesVerified`, `premiumEngineAvailable`,
`benefitEngineAvailable`, `familyProtectionVerified`,
`taxTreatmentVerified`, `costStructureVerified` and `liquidityVerified`
at `false`.

**LIC's Jeevan Lakshya (Plan 733, UIN 512N297V03)** keeps its existing,
separately-verified eligibility/benefit engine
(`lib/insurance/providers/lic/plans/plan733.ts` +
`lib/insurance/engineRegistry.ts`) exactly as before — this audit did not
touch its formulas, and its catalogue-level verification flags are
unchanged (that engine is deliberately not reflected as a blanket
"verified" flag at the catalogue level; see that module for why).

## Matching engine

`whole_life`, `pension` and `micro_insurance` are new catalogue
categories but are **not yet wired into any goal in
`GOAL_CATEGORY_ORDER`** (`lib/insurance/matching.ts`) — they exist as
verified catalogue identities today, ready for a future matching-engine
update, but adding that wiring was out of scope for this identity/status
audit. The active matcher continues to filter strictly on
`status === "ACTIVE"`.
