export function formatStatusText(status: number, text: string) {
  const statusStr = status.toString();
  return text.startsWith(statusStr)
    ? text.substring(statusStr.length).trim()
    : text;
}

export function getStatusClass(status: number) {
  if (status >= 200 && status < 300) return "success";
  if (status >= 300 && status < 400) return "redirect";
  return "error";
}
