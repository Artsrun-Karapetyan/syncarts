import { mock } from "bun:test";

export function createContainer(rowCount: number, includeInput = false) {
  const container = document.createElement("div");
  if (includeInput) {
    container.appendChild(document.createElement("input"));
  }
  const rows: HTMLElement[] = [];
  for (let i = 0; i < rowCount; i++) {
    const row = document.createElement("div");
    row.className = "sidebar-row";
    row.tabIndex = 0;
    container.appendChild(row);
    rows.push(row);
  }
  document.body.appendChild(container);
  return { container, rows };
}

export function fireKey(target: HTMLElement, key: string) {
  const event = new KeyboardEvent("keydown", { key, bubbles: true });
  Object.defineProperty(event, "preventDefault", { value: mock() });
  target.dispatchEvent(event);
  return event;
}
