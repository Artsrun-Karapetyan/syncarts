export function cleanClickedUrl(text: string) {
  let url = text.trim();
  if (url.startsWith('"')) url = url.slice(1);
  if (url.endsWith('"')) url = url.slice(0, -1);
  if (url.endsWith('",')) url = url.slice(0, -2);
  return url;
}
