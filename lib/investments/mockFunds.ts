import { MockProduct } from "@/types";

// Placeholder products only — not real fund performance data.
export const MOCK_INVESTMENT_PRODUCTS: MockProduct[] = [
  {
    id: "sample-equity-fund",
    category: "equity",
    name: "Sample Equity Fund",
    provider: "Sample AMC",
    summary: "Illustrative market-linked fund used for education purposes only.",
    isGuaranteed: false,
  },
];
