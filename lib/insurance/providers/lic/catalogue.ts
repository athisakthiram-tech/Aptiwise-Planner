import { GoalType } from "@/types";
import { InsuranceCategory, InsuranceProduct } from "@/types/insurance";

// Product identity/category metadata only. Deliberately excludes premium,
// maturity value, bonus, IRR, sum assured, surrender value, loan value,
// tax benefit, and age/term eligibility limits — none of that has been
// verified against official LIC documents. Do not add such fields here
// without a verified source.
const PROVIDER = "LIC";
const OFFICIAL_SOURCE_URL = "https://licindia.in/";
const SOURCE_CHECKED_DATE = "2026-09-15";

// Reflects the goal → category mapping used by the matching engine, kept
// here so each catalogue entry can declare which goals it is relevant to.
const GOAL_TAGS_BY_CATEGORY: Record<InsuranceCategory, GoalType[]> = {
  term_protection: ["family_protection"],
  savings_endowment: ["wealth", "home", "marriage", "child_education"],
  market_linked_ulip: ["wealth"],
  money_back_child: ["child_education", "marriage"],
};

function licProduct(
  planNumber: string,
  productName: string,
  uin: string,
  category: InsuranceCategory
): InsuranceProduct {
  return {
    id: `lic-${planNumber}`,
    provider: PROVIDER,
    productName,
    planNumber,
    uin,
    category,
    goalTags: GOAL_TAGS_BY_CATEGORY[category],
    marketLinked: category === "market_linked_ulip",
    protectionAvailable: true,
    status: "ACTIVE",
    officialSourceUrl: OFFICIAL_SOURCE_URL,
    sourceCheckedDate: SOURCE_CHECKED_DATE,
  };
}

export const LIC_CATALOGUE: InsuranceProduct[] = [
  // Savings / Endowment
  licProduct("714", "LIC's New Endowment Plan", "512N277V03", "savings_endowment"),
  licProduct("715", "LIC's New Jeevan Anand", "512N279V03", "savings_endowment"),
  licProduct("733", "LIC's Jeevan Lakshya", "512N297V03", "savings_endowment"),
  licProduct("736", "LIC's Jeevan Labh", "512N304V03", "savings_endowment"),
  licProduct("774", "LIC's Amritbaal", "512N365V02", "savings_endowment"),
  licProduct("912", "LIC's Nav Jeevan Shree", "512N387V02", "savings_endowment"),
  licProduct("881", "LIC's Bima Lakshmi", "512N389V01", "savings_endowment"),
  licProduct("888", "LIC's New Jeevan Sathi - Single Premium", "512N393V01", "savings_endowment"),
  licProduct("889", "LIC's New Jeevan Sathi - Limited Premium", "512N394V01", "savings_endowment"),
  licProduct("890", "LIC's New Bima Jyoti", "512N395V01", "savings_endowment"),
  licProduct("770", "LIC's Bima Platinum", "512N397V01", "savings_endowment"),

  // Term / Protection
  licProduct("876", "LIC's Digi Term", "512N356V02", "term_protection"),
  licProduct("875", "LIC's Yuva Term", "512N355V02", "term_protection"),
  licProduct("954", "LIC's New Tech-Term", "512N351V02", "term_protection"),
  licProduct("955", "LIC's New Jeevan Amar", "512N350V02", "term_protection"),
  licProduct("859", "LIC's Saral Jeevan Bima", "512N341V01", "term_protection"),
  licProduct("887", "LIC's Bima Kavach", "512N360V01", "term_protection"),
  licProduct("894", "LIC's Jeevan Raksha", "512N368V01", "term_protection"),

  // Market-linked / ULIP
  licProduct("873", "LIC's Index Plus", "512L354V01", "market_linked_ulip"),
  licProduct("749", "LIC's Nivesh Plus", "512L317V02", "market_linked_ulip"),
  licProduct("752", "LIC's SIIP", "512L334V02", "market_linked_ulip"),
  licProduct("886", "LIC's Protection Plus", "512L361V01", "market_linked_ulip"),

  // Money Back / Child-oriented
  licProduct("748", "LIC's Bima Shree", "512N316V03", "money_back_child"),
  licProduct("720", "LIC's New Money Back Plan - 20 Years", "512N280V03", "money_back_child"),
  licProduct("721", "LIC's New Money Back Plan - 25 Years", "512N278V03", "money_back_child"),
  licProduct("732", "LIC's New Children's Money Back Plan", "512N296V03", "money_back_child"),
  licProduct("734", "LIC's Jeevan Tarun", "512N299V03", "money_back_child"),
];
