import { BodyType, FormDataItem, HeaderItem, TabData } from '../contexts/WorkspaceContext';

interface ParsedBody {
  body: string;
  bodyType: BodyType;
  formData?: FormDataItem[];
}

export function parseCurlCommand(curlCommand: string): Partial<TabData> | null {
  const args = tokenizeShell(curlCommand.trim().replace(/\\\s*\n/g, ' '));
  if (args[0]?.toLowerCase() !== 'curl') return null;

  let url = '';
  let method = 'GET';
  let hasExplicitMethod = false;
  const headers: HeaderItem[] = [];
  const dataParts: string[] = [];

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    const next = () => args[++i] || '';

    if (arg === '-X' || arg === '--request') {
      method = next().toUpperCase();
      hasExplicitMethod = true;
    } else if (arg.startsWith('-X') && arg.length > 2) {
      method = arg.slice(2).toUpperCase();
      hasExplicitMethod = true;
    } else if (arg === '-H' || arg === '--header') {
      addHeader(headers, next());
    } else if (arg.startsWith('--header=')) {
      addHeader(headers, arg.slice('--header='.length));
    } else if (arg === '-d' || arg === '--data' || arg === '--data-raw' || arg === '--data-binary' || arg === '--data-ascii') {
      dataParts.push(next());
      if (!hasExplicitMethod && method === 'GET') method = 'POST';
    } else if (arg.startsWith('--data-raw=')) {
      dataParts.push(arg.slice('--data-raw='.length));
      if (!hasExplicitMethod && method === 'GET') method = 'POST';
    } else if (arg.startsWith('--data=')) {
      dataParts.push(arg.slice('--data='.length));
      if (!hasExplicitMethod && method === 'GET') method = 'POST';
    } else if (arg === '-F' || arg === '--form') {
      dataParts.push(formFlagToMultipartPart(next()));
      setHeaderIfMissing(headers, 'content-type', 'multipart/form-data; boundary=----SyncartsCurlFormBoundary');
      if (!hasExplicitMethod && method === 'GET') method = 'POST';
    } else if (arg === '-A' || arg === '--user-agent') {
      headers.push({ key: 'User-Agent', value: next() });
    } else if (arg === '-b' || arg === '--cookie') {
      headers.push({ key: 'Cookie', value: next() });
    } else if (arg === '-u' || arg === '--user') {
      headers.push({ key: 'Authorization', value: `Basic ${btoa(next())}` });
    } else if (arg === '--url') {
      url = next();
    } else if (!arg.startsWith('-') && isLikelyUrl(arg)) {
      url = arg;
    }
  }

  if (!url) return null;

  const parsedBody = parseBody(dataParts.join(''), headers);

  return {
    url: normalizeCurlUrl(url),
    method,
    headers: headers.length > 0 ? headers : [{ key: '', value: '' }],
    body: parsedBody.body,
    bodyType: parsedBody.bodyType,
    formData: parsedBody.formData
  };
}

function tokenizeShell(input: string): string[] {
  const tokens: string[] = [];
  let i = 0;

  while (i < input.length) {
    while (/\s/.test(input[i])) i++;
    if (i >= input.length) break;

    let token = '';
    while (i < input.length && !/\s/.test(input[i])) {
      if (input[i] === '$' && input[i + 1] === "'") {
        const parsed = readQuoted(input, i + 2, "'", true);
        token += parsed.value;
        i = parsed.nextIndex;
      } else if (input[i] === "'") {
        const parsed = readQuoted(input, i + 1, "'", false);
        token += parsed.value;
        i = parsed.nextIndex;
      } else if (input[i] === '"') {
        const parsed = readQuoted(input, i + 1, '"', true);
        token += parsed.value;
        i = parsed.nextIndex;
      } else if (input[i] === '\\') {
        token += input[i + 1] || '';
        i += 2;
      } else {
        token += input[i++];
      }
    }

    if (token) tokens.push(token);
  }

  return tokens;
}

function readQuoted(input: string, start: number, quote: string, decodeEscapes: boolean) {
  let value = '';
  let i = start;

  while (i < input.length) {
    if (input[i] === quote) return { value, nextIndex: i + 1 };
    if (decodeEscapes && input[i] === '\\') {
      const decoded = decodeEscape(input, i);
      value += decoded.value;
      i = decoded.nextIndex;
    } else {
      value += input[i++];
    }
  }

  return { value, nextIndex: i };
}

function decodeEscape(input: string, index: number) {
  const next = input[index + 1];
  const map: Record<string, string> = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v', '\\': '\\', "'": "'", '"': '"' };
  if (next && map[next] !== undefined) return { value: map[next], nextIndex: index + 2 };
  return { value: next || '', nextIndex: index + 2 };
}

function addHeader(headers: HeaderItem[], headerStr: string) {
  const colonIndex = headerStr.indexOf(':');
  if (colonIndex <= 0) return;
  headers.push({
    key: headerStr.substring(0, colonIndex).trim(),
    value: headerStr.substring(colonIndex + 1).trim()
  });
}

function setHeaderIfMissing(headers: HeaderItem[], key: string, value: string) {
  if (!headers.some(header => header.key.toLowerCase() === key.toLowerCase())) {
    headers.push({ key, value });
  }
}

function parseBody(body: string, headers: HeaderItem[]): ParsedBody {
  if (!body) return { body: '', bodyType: 'none' };

  const contentType = getHeader(headers, 'content-type');
  const normalizedContentType = contentType.toLowerCase();
  if (normalizedContentType.includes('multipart/form-data')) {
    const boundary = getBoundary(contentType);
    const formData = boundary ? parseMultipartBody(body, boundary) : [];
    return { body: '', bodyType: 'form-data', formData };
  }

  if (normalizedContentType.includes('application/x-www-form-urlencoded')) {
    return { body: '', bodyType: 'x-www-form-urlencoded', formData: parseUrlEncodedBody(body) };
  }

  return { body, bodyType: 'raw' };
}

function parseMultipartBody(body: string, boundary: string): FormDataItem[] {
  const delimiter = `--${boundary}`;
  return body
    .split(delimiter)
    .map(part => part.replace(/^\r?\n/, '').replace(/\r?\n$/, ''))
    .filter(part => part && part !== '--')
    .map(parseMultipartPart)
    .filter((item): item is FormDataItem => Boolean(item));
}

function parseMultipartPart(part: string): FormDataItem | null {
  const separator = part.includes('\r\n\r\n') ? '\r\n\r\n' : '\n\n';
  const separatorIndex = part.indexOf(separator);
  if (separatorIndex < 0) return null;

  const rawHeaders = part.slice(0, separatorIndex).split(/\r?\n/);
  const value = part.slice(separatorIndex + separator.length).replace(/\r?\n$/, '');
  const disposition = rawHeaders.find(header => header.toLowerCase().startsWith('content-disposition:')) || '';
  const name = disposition.match(/name="([^"]+)"/)?.[1];
  if (!name) return null;

  const filename = disposition.match(/filename="([^"]*)"/)?.[1];
  if (filename !== undefined) {
    return { id: crypto.randomUUID(), key: name, value: '', description: '', enabled: true, type: 'file', files: filename ? [filename] : [] };
  }

  return { id: crypto.randomUUID(), key: name, value, description: '', enabled: true, type: 'text' };
}

function parseUrlEncodedBody(body: string): FormDataItem[] {
  return body.split('&').filter(Boolean).map(pair => {
    const [rawKey, ...rawValue] = pair.split('=');
    return {
      id: crypto.randomUUID(),
      key: safeDecode(rawKey.replace(/\+/g, ' ')),
      value: safeDecode(rawValue.join('=').replace(/\+/g, ' ')),
      description: '',
      enabled: true,
      type: 'text'
    };
  });
}

function formFlagToMultipartPart(flag: string) {
  const [key, ...valueParts] = flag.split('=');
  const value = stripWrappingQuotes(valueParts.join('='));
  return [
    '------SyncartsCurlFormBoundary',
    `Content-Disposition: form-data; name="${key}"`,
    '',
    value,
    '------SyncartsCurlFormBoundary--',
    ''
  ].join('\r\n');
}

function stripWrappingQuotes(value: string) {
  if (value.length < 2) return value;
  const first = value[0];
  const last = value[value.length - 1];
  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    return value.slice(1, -1);
  }
  return value;
}

function getHeader(headers: HeaderItem[], key: string) {
  return headers.find(header => header.key.toLowerCase() === key.toLowerCase())?.value || '';
}

function getBoundary(contentType: string) {
  return contentType.match(/boundary="?([^";]+)"?/)?.[1] || '';
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeCurlUrl(value: string) {
  const queryStart = value.indexOf('?');
  if (queryStart < 0) return value;

  const baseUrl = value.slice(0, queryStart);
  const query = value.slice(queryStart + 1).replace(/\\([\[\]])/g, '$1');
  return `${baseUrl}?${query}`;
}

function isLikelyUrl(value: string) {
  return /^https?:\/\//i.test(value) || value.startsWith('/') || value.startsWith('{{');
}
