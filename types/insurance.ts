// Insurance product domain types.
// Provider-agnostic so additional insurers (HDFC Life, SBI Life, ...) can be
// added later as sibling folders under lib/insurance/providers without any
// changes to this shape, the matching engine, or the UI.

import { GoalType } from "@/types";

export type InsuranceCategory =
  | "term_protection"
  | "savings_endowment"
  | "market_linked_ulip"
  | "money_back_child";

export type ProductStatus = "ACTIVE" | "WITHDRAWN" | "UNKNOWN";

export interface InsuranceProduct {
  id: string;
  provider: string;
  productName: string;
  planNumber: string;
  uin: string;
  category: InsuranceCategory;
  goalTags: GoalType[];
  marketLinked: boolean;
  protectionAvailable: boolean;
  status: ProductStatus;
  officialSourceUrl: string;
  sourceCheckedDate: string;
}
