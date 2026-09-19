// Stage C: "why this structure is shown" for a saved plan — a thin
// reuse of the existing StrategyReasons component/logic rather than a
// second reason-code renderer. Never says "we recommend".

import { CustomerPlan } from "@/lib/customerPlan/types";
import { StrategyReasons } from "@/components/planner/results/StrategyReasons";
import { Locale } from "@/lib/i18n/types";

export function PlanReasons({ plan, locale }: { plan: CustomerPlan; locale: Locale }) {
  return <StrategyReasons reasonCodes={plan.selectedStrategy.reasonCodes} locale={locale} />;
}
