// Minimal render/interaction helpers for the .tsx integration tests —
// deliberately not @testing-library/react (not an existing project
// dependency); a thin wrapper over react-dom/client + native DOM events
// is enough to prove a real button click reaches real production code.

import { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { ReactElement } from "react";

export interface RenderedComponent {
  container: HTMLElement;
  root: Root;
  unmount: () => void;
}

export function renderComponent(node: ReactElement): RenderedComponent {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(node);
  });
  return {
    container,
    root,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

export function rerender(rendered: RenderedComponent, node: ReactElement) {
  act(() => {
    rendered.root.render(node);
  });
}

// Finds a button/element whose visible text contains `text` (case-
// sensitive substring match) — good enough for these integration tests,
// which only need to prove a specific labeled control exists/works.
export function findByText(container: HTMLElement, text: string): HTMLElement | null {
  const all = container.querySelectorAll<HTMLElement>("button, a, p, span, div, li");
  for (const el of Array.from(all)) {
    if (el.children.length === 0 && el.textContent?.includes(text)) return el;
  }
  for (const el of Array.from(all)) {
    if (el.textContent?.includes(text)) return el;
  }
  return null;
}

export function clickText(container: HTMLElement, text: string) {
  const el = findByText(container, text);
  if (!el) throw new Error(`No element found containing text "${text}"`);
  act(() => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}
