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

// Supplemental sources for the actual rule-bearing document behind a
// product's engine (e.g. a locally-supplied sales brochure), kept
// separate from the catalogue's own identity-only source so neither
// list has to change shape for the other. `url` stays a real, already
// -verified LIC page (never a fabricated link for a local PDF); `title`
// + `id` identify the specific supplied document being cited.
const SUPPLEMENTAL_SOURCES: Record<string, OfficialProductSource[]> = {
  [key("736", "512N304V03")]: [
    {
      id: "lic-plan736-sales-brochure-current",
      sourceType: "sales_brochure",
      url: "https://www.licindia.in/en/web/guest/endowment-plans",
      title: "LIC's Jeevan Labh Sales Brochure (doc ref LIC/P1/2024-25/18/Eng/SB)",
      checkedAt: "2026-09-16",
    },
  ],
};

export function getOfficialSources(planNumber: string, uin: string): OfficialProductSource[] {
  const catalogueSources = REGISTRY.get(key(planNumber, uin)) ?? [];
  const supplementalSources = SUPPLEMENTAL_SOURCES[key(planNumber, uin)] ?? [];
  return [...catalogueSources, ...supplementalSources];
}
