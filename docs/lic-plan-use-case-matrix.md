# LIC Plan Use-Case Matrix — Phase 1

Internal engineering/planning documentation. NOT a customer-facing ranking. Every cell is generated from `lib/planning/planIntelligence/needSuitability.ts`'s deterministic, mechanics-driven `assessNeedFit()` function — the same function every plan profile calls, never a per-product special case.

STRONG / POSSIBLE / WEAK / N/A

| Plan | Child Education | Child Marriage | Retirement | Wealth Creation | Regular Income | Long-Term Savings | Legacy | Home Goal | Market Growth | Scheduled Liquidity |
|---|---|---|---|---|---|---|---|---|---|---|
| Single Premium Endowment Plan (717) | STRONG | STRONG | POSSIBLE | POSSIBLE | POSSIBLE | STRONG | POSSIBLE | POSSIBLE | POSSIBLE | WEAK |
| New Endowment Plan (714) | STRONG | STRONG | POSSIBLE | POSSIBLE | POSSIBLE | STRONG | STRONG | POSSIBLE | POSSIBLE | WEAK |
| New Jeevan Anand (715) | STRONG | STRONG | POSSIBLE | POSSIBLE | POSSIBLE | STRONG | STRONG | POSSIBLE | POSSIBLE | WEAK |
| Jeevan Lakshya (733) | STRONG | STRONG | POSSIBLE | POSSIBLE | POSSIBLE | STRONG | STRONG | POSSIBLE | POSSIBLE | WEAK |
| Jeevan Labh (736) | STRONG | STRONG | POSSIBLE | POSSIBLE | POSSIBLE | STRONG | STRONG | POSSIBLE | POSSIBLE | WEAK |
| Amritbaal (774) | STRONG | STRONG | POSSIBLE | POSSIBLE | POSSIBLE | STRONG | STRONG | POSSIBLE | POSSIBLE | WEAK |
| Nav Jeevan Shree (912) | STRONG | STRONG | POSSIBLE | POSSIBLE | POSSIBLE | STRONG | STRONG | POSSIBLE | POSSIBLE | WEAK |
| Bima Lakshmi (881) | STRONG | STRONG | POSSIBLE | POSSIBLE | POSSIBLE | STRONG | STRONG | POSSIBLE | POSSIBLE | STRONG |
| New Jeevan Sathi - Single Premium (888) | STRONG | STRONG | POSSIBLE | POSSIBLE | POSSIBLE | STRONG | POSSIBLE | POSSIBLE | POSSIBLE | WEAK |
| New Jeevan Sathi - Limited Premium (889) | STRONG | STRONG | POSSIBLE | POSSIBLE | POSSIBLE | STRONG | STRONG | POSSIBLE | POSSIBLE | WEAK |
| New Bima Jyoti (890) | STRONG | STRONG | POSSIBLE | POSSIBLE | POSSIBLE | STRONG | STRONG | POSSIBLE | POSSIBLE | WEAK |
| Bima Platinum (770) | STRONG | STRONG | POSSIBLE | POSSIBLE | POSSIBLE | STRONG | STRONG | POSSIBLE | POSSIBLE | WEAK |
| Jeevan Umang (745) | WEAK | WEAK | STRONG | WEAK | STRONG | STRONG | STRONG | WEAK | WEAK | WEAK |
| Jeevan Utsav (771) | WEAK | WEAK | STRONG | WEAK | STRONG | STRONG | STRONG | WEAK | WEAK | WEAK |
| Jeevan Utsav Single Premium (883) | STRONG | STRONG | POSSIBLE | POSSIBLE | POSSIBLE | STRONG | POSSIBLE | POSSIBLE | POSSIBLE | WEAK |
| Bima Shree (748) | STRONG | STRONG | POSSIBLE | POSSIBLE | POSSIBLE | STRONG | STRONG | POSSIBLE | POSSIBLE | STRONG |
| Jeevan Tarun (734) | STRONG | STRONG | POSSIBLE | POSSIBLE | POSSIBLE | STRONG | STRONG | POSSIBLE | POSSIBLE | STRONG |
| New Money Back Plan - 20 Years (720) | STRONG | STRONG | POSSIBLE | POSSIBLE | POSSIBLE | STRONG | STRONG | POSSIBLE | POSSIBLE | STRONG |
| New Money Back Plan - 25 Years (721) | STRONG | STRONG | POSSIBLE | POSSIBLE | POSSIBLE | STRONG | STRONG | POSSIBLE | POSSIBLE | STRONG |
| New Children's Money Back Plan (732) | STRONG | STRONG | POSSIBLE | POSSIBLE | POSSIBLE | STRONG | STRONG | POSSIBLE | POSSIBLE | STRONG |
| New Pension Plus (867) | POSSIBLE | POSSIBLE | WEAK | STRONG | WEAK | POSSIBLE | STRONG | WEAK | STRONG | WEAK |
| Jeevan Akshay-VII (857) | WEAK | WEAK | STRONG | WEAK | STRONG | STRONG | WEAK | WEAK | WEAK | WEAK |
| New Jeevan Shanti (758) | WEAK | WEAK | STRONG | WEAK | STRONG | STRONG | WEAK | WEAK | WEAK | WEAK |
| Saral Pension (862) | WEAK | WEAK | STRONG | WEAK | STRONG | STRONG | WEAK | WEAK | WEAK | WEAK |
| Smart Pension (879) | WEAK | WEAK | STRONG | WEAK | STRONG | STRONG | WEAK | WEAK | WEAK | WEAK |
| Index Plus (873) | POSSIBLE | POSSIBLE | WEAK | STRONG | WEAK | POSSIBLE | STRONG | WEAK | STRONG | WEAK |
| Nivesh Plus (749) | POSSIBLE | POSSIBLE | WEAK | STRONG | WEAK | POSSIBLE | POSSIBLE | WEAK | STRONG | WEAK |
| Protection Plus (886) | POSSIBLE | POSSIBLE | WEAK | STRONG | WEAK | POSSIBLE | STRONG | WEAK | STRONG | WEAK |
| SIIP (752) | POSSIBLE | POSSIBLE | WEAK | STRONG | WEAK | POSSIBLE | STRONG | WEAK | STRONG | WEAK |
| Micro Bachat (751) | STRONG | STRONG | POSSIBLE | POSSIBLE | POSSIBLE | STRONG | STRONG | POSSIBLE | POSSIBLE | WEAK |
| Jan Suraksha (880) | STRONG | STRONG | POSSIBLE | POSSIBLE | POSSIBLE | STRONG | STRONG | POSSIBLE | POSSIBLE | WEAK |

## Reasoning excerpts (Child Education and Retirement columns)

### CHILD_EDUCATION
- **Single Premium Endowment Plan (717)** — STRONG: Produces a lump-sum (or scheduled) benefit at/near a chosen horizon, matching how education/marriage costs are typically funded — a single or staggered payout rather than ongoing income.
- **New Endowment Plan (714)** — STRONG: Produces a lump-sum (or scheduled) benefit at/near a chosen horizon, matching how education/marriage costs are typically funded — a single or staggered payout rather than ongoing income.
- **New Jeevan Anand (715)** — STRONG: Produces a lump-sum (or scheduled) benefit at/near a chosen horizon, matching how education/marriage costs are typically funded — a single or staggered payout rather than ongoing income.
- **Jeevan Lakshya (733)** — STRONG: Produces a lump-sum (or scheduled) benefit at/near a chosen horizon, matching how education/marriage costs are typically funded — a single or staggered payout rather than ongoing income.
- **Jeevan Labh (736)** — STRONG: Produces a lump-sum (or scheduled) benefit at/near a chosen horizon, matching how education/marriage costs are typically funded — a single or staggered payout rather than ongoing income.
- **Amritbaal (774)** — STRONG: Produces a lump-sum (or scheduled) benefit at/near a chosen horizon, matching how education/marriage costs are typically funded — a single or staggered payout rather than ongoing income.
- **Nav Jeevan Shree (912)** — STRONG: Produces a lump-sum (or scheduled) benefit at/near a chosen horizon, matching how education/marriage costs are typically funded — a single or staggered payout rather than ongoing income.
- **Bima Lakshmi (881)** — STRONG: Produces a lump-sum (or scheduled) benefit at/near a chosen horizon, matching how education/marriage costs are typically funded — a single or staggered payout rather than ongoing income.
- **New Jeevan Sathi - Single Premium (888)** — STRONG: Produces a lump-sum (or scheduled) benefit at/near a chosen horizon, matching how education/marriage costs are typically funded — a single or staggered payout rather than ongoing income.
- **New Jeevan Sathi - Limited Premium (889)** — STRONG: Produces a lump-sum (or scheduled) benefit at/near a chosen horizon, matching how education/marriage costs are typically funded — a single or staggered payout rather than ongoing income.
- **New Bima Jyoti (890)** — STRONG: Produces a lump-sum (or scheduled) benefit at/near a chosen horizon, matching how education/marriage costs are typically funded — a single or staggered payout rather than ongoing income.
- **Bima Platinum (770)** — STRONG: Produces a lump-sum (or scheduled) benefit at/near a chosen horizon, matching how education/marriage costs are typically funded — a single or staggered payout rather than ongoing income.
- **Jeevan Umang (745)** — WEAK: Produces ongoing recurring income after a deferment point rather than a lump sum at the goal horizon — less directly useful for a one-time large expense.
- **Jeevan Utsav (771)** — WEAK: Produces ongoing recurring income after a deferment point rather than a lump sum at the goal horizon — less directly useful for a one-time large expense.
- **Jeevan Utsav Single Premium (883)** — STRONG: Produces a lump-sum (or scheduled) benefit at/near a chosen horizon, matching how education/marriage costs are typically funded — a single or staggered payout rather than ongoing income.
- **Bima Shree (748)** — STRONG: Produces a lump-sum (or scheduled) benefit at/near a chosen horizon, matching how education/marriage costs are typically funded — a single or staggered payout rather than ongoing income.
- **Jeevan Tarun (734)** — STRONG: Produces a lump-sum (or scheduled) benefit at/near a chosen horizon, matching how education/marriage costs are typically funded — a single or staggered payout rather than ongoing income.
- **New Money Back Plan - 20 Years (720)** — STRONG: Produces a lump-sum (or scheduled) benefit at/near a chosen horizon, matching how education/marriage costs are typically funded — a single or staggered payout rather than ongoing income.
- **New Money Back Plan - 25 Years (721)** — STRONG: Produces a lump-sum (or scheduled) benefit at/near a chosen horizon, matching how education/marriage costs are typically funded — a single or staggered payout rather than ongoing income.
- **New Children's Money Back Plan (732)** — STRONG: Produces a lump-sum (or scheduled) benefit at/near a chosen horizon, matching how education/marriage costs are typically funded — a single or staggered payout rather than ongoing income.
- **Jeevan Akshay-VII (857)** — WEAK: Produces ongoing recurring income after a deferment point rather than a lump sum at the goal horizon — less directly useful for a one-time large expense.
- **New Jeevan Shanti (758)** — WEAK: Produces ongoing recurring income after a deferment point rather than a lump sum at the goal horizon — less directly useful for a one-time large expense.
- **Saral Pension (862)** — WEAK: Produces ongoing recurring income after a deferment point rather than a lump sum at the goal horizon — less directly useful for a one-time large expense.
- **Smart Pension (879)** — WEAK: Produces ongoing recurring income after a deferment point rather than a lump sum at the goal horizon — less directly useful for a one-time large expense.
- **Micro Bachat (751)** — STRONG: Produces a lump-sum (or scheduled) benefit at/near a chosen horizon, matching how education/marriage costs are typically funded — a single or staggered payout rather than ongoing income.
- **Jan Suraksha (880)** — STRONG: Produces a lump-sum (or scheduled) benefit at/near a chosen horizon, matching how education/marriage costs are typically funded — a single or staggered payout rather than ongoing income.

### RETIREMENT
- **Jeevan Umang (745)** — STRONG: Directly produces recurring income (deferred or immediate), matching the core requirement of a retirement/regular-income goal.
- **Jeevan Utsav (771)** — STRONG: Directly produces recurring income (deferred or immediate), matching the core requirement of a retirement/regular-income goal.
- **New Pension Plus (867)** — WEAK: Cash-flow mechanics do not produce recurring income.
- **Jeevan Akshay-VII (857)** — STRONG: Directly produces recurring income (deferred or immediate), matching the core requirement of a retirement/regular-income goal.
- **New Jeevan Shanti (758)** — STRONG: Directly produces recurring income (deferred or immediate), matching the core requirement of a retirement/regular-income goal.
- **Saral Pension (862)** — STRONG: Directly produces recurring income (deferred or immediate), matching the core requirement of a retirement/regular-income goal.
- **Smart Pension (879)** — STRONG: Directly produces recurring income (deferred or immediate), matching the core requirement of a retirement/regular-income goal.
- **Index Plus (873)** — WEAK: Cash-flow mechanics do not produce recurring income.
- **Nivesh Plus (749)** — WEAK: Cash-flow mechanics do not produce recurring income.
- **Protection Plus (886)** — WEAK: Cash-flow mechanics do not produce recurring income.
- **SIIP (752)** — WEAK: Cash-flow mechanics do not produce recurring income.

