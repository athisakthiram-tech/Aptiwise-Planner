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
const ENDOWMENT_CATEGORY_URL = "https://www.licindia.in/en/web/guest/endowment-plans";
const TERM_CATEGORY_URL = "https://licindia.in/term-assurance-plans";
const PENSION_CATEGORY_URL = "https://licindia.in/en/web/guest/pension-plan";

const SUPPLEMENTAL_SOURCES: Record<string, OfficialProductSource[]> = {
  [key("736", "512N304V03")]: [
    {
      id: "lic-plan736-sales-brochure-current",
      sourceType: "sales_brochure",
      url: ENDOWMENT_CATEGORY_URL,
      title: "LIC's Jeevan Labh Sales Brochure (doc ref LIC/P1/2024-25/18/Eng/SB)",
      checkedAt: "2026-09-16",
    },
  ],
  [key("717", "512N283V03")]: [
    {
      id: "lic-plan717-sales-brochure-current",
      sourceType: "sales_brochure",
      url: ENDOWMENT_CATEGORY_URL,
      title: "LIC's Single Premium Endowment Plan Sales Brochure",
      checkedAt: "2026-09-16",
    },
  ],
  [key("714", "512N277V03")]: [
    {
      id: "lic-plan714-sales-brochure-current",
      sourceType: "sales_brochure",
      url: ENDOWMENT_CATEGORY_URL,
      title: "LIC's New Endowment Plan Sales Brochure",
      checkedAt: "2026-09-16",
    },
  ],
  [key("715", "512N279V03")]: [
    {
      id: "lic-plan715-sales-brochure-current",
      sourceType: "sales_brochure",
      url: ENDOWMENT_CATEGORY_URL,
      title: "LIC's New Jeevan Anand Sales Brochure",
      checkedAt: "2026-09-16",
    },
  ],
  [key("774", "512N365V02")]: [
    {
      id: "lic-plan774-sales-brochure-current",
      sourceType: "sales_brochure",
      url: ENDOWMENT_CATEGORY_URL,
      title: "LIC's Amritbaal Sales Brochure",
      checkedAt: "2026-09-16",
    },
  ],
  [key("912", "512N387V02")]: [
    {
      id: "lic-plan912-sales-brochure-current",
      sourceType: "sales_brochure",
      url: ENDOWMENT_CATEGORY_URL,
      title: "LIC's Nav Jeevan Shree Sales Brochure",
      checkedAt: "2026-09-16",
    },
  ],
  [key("734", "512N299V03")]: [
    {
      id: "lic-plan734-sales-brochure-current",
      sourceType: "sales_brochure",
      url: ENDOWMENT_CATEGORY_URL,
      title: "LIC's Jeevan Tarun Sales Brochure",
      checkedAt: "2026-09-16",
    },
  ],
  [key("881", "512N389V01")]: [
    {
      id: "lic-plan881-sales-brochure-current",
      sourceType: "sales_brochure",
      url: ENDOWMENT_CATEGORY_URL,
      title: "LIC's Bima Lakshmi Sales Brochure",
      checkedAt: "2026-09-16",
    },
  ],
  [key("748", "512N316V03")]: [
    {
      id: "lic-plan748-sales-brochure-current",
      sourceType: "sales_brochure",
      url: ENDOWMENT_CATEGORY_URL,
      title: "LIC's Bima Shree Sales Brochure",
      checkedAt: "2026-09-16",
    },
  ],
  [key("770", "512N397V01")]: [
    {
      id: "lic-plan770-sales-brochure-current",
      sourceType: "sales_brochure",
      url: ENDOWMENT_CATEGORY_URL,
      title: "LIC's Bima Platinum Sales Brochure",
      checkedAt: "2026-09-16",
    },
  ],
  [key("889", "512N394V01")]: [
    {
      id: "lic-plan889-sales-brochure-current",
      sourceType: "sales_brochure",
      url: ENDOWMENT_CATEGORY_URL,
      title: "LIC's New Jeevan Sathi - Limited Premium Sales Brochure",
      checkedAt: "2026-09-16",
    },
  ],
  [key("890", "512N395V01")]: [
    {
      id: "lic-plan890-sales-brochure-current",
      sourceType: "sales_brochure",
      url: ENDOWMENT_CATEGORY_URL,
      title: "LIC's New Bima Jyoti Sales Brochure",
      checkedAt: "2026-09-17",
    },
  ],
  [key("888", "512N393V01")]: [
    {
      id: "lic-plan888-sales-brochure-current",
      sourceType: "sales_brochure",
      url: ENDOWMENT_CATEGORY_URL,
      title: "LIC's New Jeevan Sathi - Single Premium Sales Brochure",
      checkedAt: "2026-09-17",
    },
  ],
  [key("876", "512N356V02")]: [
    {
      id: "lic-plan876-sales-brochure-current",
      sourceType: "sales_brochure",
      url: TERM_CATEGORY_URL,
      title: "LIC's Digi Term Sales Brochure",
      checkedAt: "2026-09-18",
    },
  ],
  [key("875", "512N355V02")]: [
    {
      id: "lic-plan875-sales-brochure-current",
      sourceType: "sales_brochure",
      url: TERM_CATEGORY_URL,
      title: "LIC's Yuva Term Sales Brochure",
      checkedAt: "2026-09-18",
    },
  ],
  [key("954", "512N351V02")]: [
    {
      id: "lic-plan954-sales-brochure-current",
      sourceType: "sales_brochure",
      url: TERM_CATEGORY_URL,
      title: "LIC's New Tech-Term Sales Brochure",
      checkedAt: "2026-09-18",
    },
  ],
  [key("877", "512N357V01")]: [
    {
      id: "lic-plan877-sales-brochure-current",
      sourceType: "sales_brochure",
      url: TERM_CATEGORY_URL,
      title: "LIC's Yuva Credit Life Sales Brochure",
      checkedAt: "2026-09-18",
    },
  ],
  [key("878", "512N358V01")]: [
    {
      id: "lic-plan878-sales-brochure-current",
      sourceType: "sales_brochure",
      url: TERM_CATEGORY_URL,
      title: "LIC's Digi Credit Life Sales Brochure",
      checkedAt: "2026-09-18",
    },
  ],
  [key("887", "512N360V01")]: [
    {
      id: "lic-plan887-sales-brochure-current",
      sourceType: "sales_brochure",
      url: TERM_CATEGORY_URL,
      title: "LIC's Bima Kavach Sales Brochure",
      checkedAt: "2026-09-19",
    },
  ],
  [key("894", "512N368V01")]: [
    {
      id: "lic-plan894-sales-brochure-current",
      sourceType: "sales_brochure",
      url: TERM_CATEGORY_URL,
      title: "LIC's Jeevan Raksha Sales Brochure",
      checkedAt: "2026-09-19",
    },
  ],
  [key("859", "512N341V01")]: [
    {
      id: "lic-plan859-sales-brochure-current",
      sourceType: "sales_brochure",
      url: TERM_CATEGORY_URL,
      title: "LIC's Saral Jeevan Bima Sales Brochure",
      checkedAt: "2026-09-19",
    },
  ],
  [key("955", "512N350V02")]: [
    {
      id: "lic-plan955-sales-brochure-current",
      sourceType: "sales_brochure",
      url: TERM_CATEGORY_URL,
      title: "LIC's New Jeevan Amar Sales Brochure",
      checkedAt: "2026-09-19",
    },
  ],
  [key("867", "512L347V01")]: [
    {
      id: "lic-plan867-sales-brochure-current",
      sourceType: "sales_brochure",
      url: PENSION_CATEGORY_URL,
      title: "LIC's New Pension Plus Sales Brochure",
      checkedAt: "2026-09-19",
    },
  ],
  [key("857", "512N337V07")]: [
    {
      id: "lic-plan857-sales-brochure-current",
      sourceType: "sales_brochure",
      url: PENSION_CATEGORY_URL,
      title: "LIC's Jeevan Akshay-VII Sales Brochure",
      checkedAt: "2026-09-20",
    },
  ],
  [key("758", "512N338V08")]: [
    {
      id: "lic-plan758-sales-brochure-current",
      sourceType: "sales_brochure",
      url: PENSION_CATEGORY_URL,
      title: "LIC's New Jeevan Shanti Sales Brochure",
      checkedAt: "2026-09-20",
    },
  ],
  [key("862", "512N342V05")]: [
    {
      id: "lic-plan862-sales-brochure-current",
      sourceType: "sales_brochure",
      url: PENSION_CATEGORY_URL,
      title: "LIC's Saral Pension Sales Brochure",
      checkedAt: "2026-09-20",
    },
  ],
  [key("879", "512N386V01")]: [
    {
      id: "lic-plan879-sales-brochure-current",
      sourceType: "sales_brochure",
      url: PENSION_CATEGORY_URL,
      title: "LIC's Smart Pension Sales Brochure",
      checkedAt: "2026-09-20",
    },
  ],
  [key("873", "512L354V01")]: [
    {
      id: "lic-plan873-sales-brochure-current",
      sourceType: "sales_brochure",
      url: "https://www.licindia.in/en/web/guest/unit-linked-plans",
      title: "LIC's Index Plus Sales Brochure",
      checkedAt: "2026-09-20",
    },
  ],
};

export function getOfficialSources(planNumber: string, uin: string): OfficialProductSource[] {
  const catalogueSources = REGISTRY.get(key(planNumber, uin)) ?? [];
  const supplementalSources = SUPPLEMENTAL_SOURCES[key(planNumber, uin)] ?? [];
  return [...catalogueSources, ...supplementalSources];
}
