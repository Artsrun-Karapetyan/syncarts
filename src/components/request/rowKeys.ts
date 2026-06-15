export function syncRowKeys(keys: string[], length: number) {
  while (keys.length < length) keys.push(crypto.randomUUID());
  if (keys.length > length) keys.length = length;
  return keys;
}
