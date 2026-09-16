// Official source lookup keyed by exact product identity (planNumber +
// UIN). Built entirely from evidence already present on catalogue
// entries (lib/insurance/providers/lic/catalogue.ts) — no new research,
// no internet access, no invented sources.

import { OfficialProductSource } from "@/types/insurance";
import { LIC_CATALOGUE } from "@/lib/insurance/providers/lic/catalogue";

function key(planNumber: string, uin: string): string {
  return `${planNumber}::${uin}`;
}

const REGISTRY = new Map<string, OfficialProductSource[]>(
  LIC_CATALOGUE.map((product) => [
    key(product.planNumber, product.uin),
    product.officialSources ?? [],
  ])
);

export function getOfficialSources(planNumber: string, uin: string): OfficialProductSource[] {
  return REGISTRY.get(key(planNumber, uin)) ?? [];
}
