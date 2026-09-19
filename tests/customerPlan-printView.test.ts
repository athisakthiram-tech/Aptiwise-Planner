import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

const globalsCss = readFileSync(path.resolve(__dirname, "../app/globals.css"), "utf-8");
const proposalDocSrc = readFileSync(path.resolve(__dirname, "../components/customerPlan/export/ProposalDocument.tsx"), "utf-8");
const proposalActionsSrc = readFileSync(path.resolve(__dirname, "../components/customerPlan/export/ProposalActions.tsx"), "utf-8");

describe("Printable proposal view (Section 11)", () => {
  it("hides everything except the proposal document when printing", () => {
    expect(globalsCss).toMatch(/@media print/);
    expect(globalsCss).toMatch(/\.proposal-print-root/);
    expect(globalsCss).toMatch(/visibility:\s*hidden/);
  });

  it("declares an A4-friendly print page size", () => {
    expect(globalsCss).toMatch(/@page\s*{[^}]*size:\s*A4/);
  });

  it("uses page-break rules so the document isn't one continuous unbroken sheet", () => {
    expect(globalsCss).toMatch(/page-break-after/);
  });

  it("protects product identity / financial-picture blocks from splitting across a page break", () => {
    expect(globalsCss).toMatch(/proposal-avoid-break[^}]*\{[^}]*(break-inside|page-break-inside):\s*avoid/);
    expect(proposalDocSrc).toMatch(/proposal-avoid-break/);
  });

  it("has a `.no-print` escape hatch for anything that must never appear in printed output", () => {
    expect(globalsCss).toMatch(/\.no-print/);
  });

  it("the proposal document itself renders no interactive controls (buttons/links)", () => {
    // The printable content is pure presentation — actions (Download,
    // Share, WhatsApp) live in ProposalActions.tsx, never inside the
    // print-only tree itself.
    expect(proposalDocSrc).not.toMatch(/<button/);
    expect(proposalDocSrc).not.toMatch(/<a\s/);
  });

  it("the print-only container is marked aria-hidden so screen readers don't announce the hidden duplicate", () => {
    expect(proposalActionsSrc).toMatch(/proposal-print-root[\s\S]*aria-hidden/);
  });

  it("action buttons carry real, non-emoji-only accessible text", () => {
    // Every button in ProposalActions.tsx pairs an emoji with a
    // translated text label rather than relying on the emoji alone.
    const buttonBlocks = proposalActionsSrc.match(/<button[\s\S]*?<\/button>/g) ?? [];
    expect(buttonBlocks.length).toBeGreaterThan(0);
    for (const block of buttonBlocks) {
      expect(block).toMatch(/t\(/);
    }
  });
});
