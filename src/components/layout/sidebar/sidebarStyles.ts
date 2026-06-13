import type { CSSProperties } from "react";

export const SIDEBAR_ROOT_STYLE: CSSProperties = {
  width: "100%",
  height: "100%",
  background: "var(--bg-secondary)",
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 20,
  position: "relative",
};

export const SIDEBAR_SCROLL_STYLE: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  flex: 1,
  overflow: "auto",
  minHeight: 0,
  paddingRight: 4,
};
