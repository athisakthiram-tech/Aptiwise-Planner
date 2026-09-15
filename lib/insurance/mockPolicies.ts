import { MockProduct } from "@/types";

// Placeholder products only — not real insurer offerings or guarantees.
// Real Aptiwise/insurer product data will replace this later.
export const MOCK_PROTECTION_PRODUCTS: MockProduct[] = [
  {
    id: "sample-protection-plan",
    category: "protection",
    name: "Sample Protection Plan",
    provider: "Sample Insurer",
    summary: "Illustrative term-style cover for family protection discussions.",
    isGuaranteed: true,
  },
  {
    id: "sample-savings-plan",
    category: "savings",
    name: "Sample Savings Plan",
    provider: "Sample Insurer",
    summary: "Illustrative plan combining a savings element with cover.",
    isGuaranteed: false,
  },
];
