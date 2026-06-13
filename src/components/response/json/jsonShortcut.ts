export function getShortcutLabel() {
  if (typeof navigator === "undefined") return "cmd/ctrl";
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform) ? "cmd" : "ctrl";
}
