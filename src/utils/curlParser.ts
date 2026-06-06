import { HeaderItem, TabData } from '../contexts/WorkspaceContext';

export function parseCurlCommand(curlCommand: string): Partial<TabData> | null {
  const text = curlCommand.trim();
  if (!text.toLowerCase().startsWith('curl ')) {
    return null;
  }

  // Remove trailing slashes that denote newlines in bash
  const cleanedText = text.replace(/\\\s*\n/g, ' ');

  // A basic regex to extract arguments respecting single and double quotes
  // This matches words, or strings in single/double quotes.
  const regex = /"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'|([^\s]+)/g;
  const args: string[] = [];
  let match;
  while ((match = regex.exec(cleanedText)) !== null) {
    if (match[1] !== undefined) args.push(match[1]);
    else if (match[2] !== undefined) args.push(match[2]);
    else if (match[3] !== undefined) args.push(match[3]);
  }

  let url = '';
  let method = 'GET';
  const headers: HeaderItem[] = [];
  let body = '';

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];

    if (arg === '-X' || arg === '--request') {
      method = args[++i].toUpperCase();
    } else if (arg === '-H' || arg === '--header') {
      const headerStr = args[++i];
      const colonIndex = headerStr.indexOf(':');
      if (colonIndex > 0) {
        const key = headerStr.substring(0, colonIndex).trim();
        const value = headerStr.substring(colonIndex + 1).trim();
        headers.push({ key, value });
      }
    } else if (arg === '-d' || arg === '--data' || arg === '--data-raw' || arg === '--data-binary') {
      body = args[++i];
      if (method === 'GET') method = 'POST'; // curl defaults to POST if --data is present without -X
    } else if (arg === '-A' || arg === '--user-agent') {
      headers.push({ key: 'User-Agent', value: args[++i] });
    } else if (arg === '-b' || arg === '--cookie') {
      headers.push({ key: 'Cookie', value: args[++i] });
    } else if (arg === '-u' || arg === '--user') {
      const auth = args[++i];
      headers.push({ key: 'Authorization', value: `Basic ${btoa(auth)}` });
    } else if (arg.startsWith('http')) {
      url = arg;
    }
  }

  if (!url) return null;

  return {
    url,
    method,
    headers: headers.length > 0 ? headers : [{ key: '', value: '' }],
    body
  };
}
