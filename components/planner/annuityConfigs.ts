// Small, data-only config objects that drive AnnuityConfigurator for each
// of the 4 annuity ("Pension") plans — mirrors pureTermConfigs.ts's
// pattern. Defaults default to each plan's own published illustration
// point so the configurator shows a real annuity amount on first render.

import { PLAN_857_RULES, PLAN_857_UIN } from "@/lib/insurance/providers/lic/plans/plan857";
import { PLAN_862_RULES, PLAN_862_UIN } from "@/lib/insurance/providers/lic/plans/plan862";
import { PLAN_879_RULES, PLAN_879_UIN } from "@/lib/insurance/providers/lic/plans/plan879";
import { PLAN_758_RULES, PLAN_758_UIN } from "@/lib/insurance/providers/lic/plans/plan758";
import { AnnuityConfig } from "@/components/planner/AnnuityConfigurator";

export const PLAN_857_CONFIG: AnnuityConfig = {
  planNumber: "857",
  uin: PLAN_857_UIN,
  minEntryAge: PLAN_857_RULES.minEntryAge,
  maxEntryAge: PLAN_857_RULES.maxEntryAge,
  defaultPurchasePrice: 1000000,
  purchasePriceSliderMin: 100000,
  purchasePriceSliderMax: 10000000,
  options: PLAN_857_RULES.options.map((o) => ({ code: o.code, isJointLife: o.isJointLife })),
  defaultAge: 60,
  defaultSecondaryAge: 55,
};

export const PLAN_862_CONFIG: AnnuityConfig = {
  planNumber: "862",
  uin: PLAN_862_UIN,
  minEntryAge: PLAN_862_RULES.minEntryAge,
  maxEntryAge: PLAN_862_RULES.maxEntryAge,
  defaultPurchasePrice: 1000000,
  purchasePriceSliderMin: 150000,
  purchasePriceSliderMax: 10000000,
  options: PLAN_862_RULES.options.map((o) => ({ code: o.code, isJointLife: o.isJointLife })),
  defaultAge: 60,
  defaultSecondaryAge: 55,
};

export const PLAN_879_CONFIG: AnnuityConfig = {
  planNumber: "879",
  uin: PLAN_879_UIN,
  minEntryAge: PLAN_879_RULES.minEntryAge,
  maxEntryAge: PLAN_879_RULES.maxEntryAge,
  defaultPurchasePrice: 1000000,
  purchasePriceSliderMin: 100000,
  purchasePriceSliderMax: 10000000,
  options: PLAN_879_RULES.options.map((o) => ({ code: o.code, isJointLife: o.isJointLife })),
  defaultAge: 60,
  defaultSecondaryAge: 55,
};

export const PLAN_758_CONFIG: AnnuityConfig = {
  planNumber: "758",
  uin: PLAN_758_UIN,
  minEntryAge: PLAN_758_RULES.minEntryAge,
  maxEntryAge: PLAN_758_RULES.maxEntryAge,
  defaultPurchasePrice: 1000000,
  purchasePriceSliderMin: 150000,
  purchasePriceSliderMax: 10000000,
  options: PLAN_758_RULES.options.map((o) => ({ code: o.code, isJointLife: o.isJointLife })),
  defaultAge: 45,
  defaultSecondaryAge: 35,
  hasDefermentPeriod: true,
  minDefermentPeriodYears: 1,
  maxDefermentPeriodYears: 5,
  defaultDefermentPeriodYears: 5,
};
