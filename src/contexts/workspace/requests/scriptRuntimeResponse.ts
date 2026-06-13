export function createScriptResponseBody(args: {
  body: string;
  headers: Record<string, string>;
  responseTime: number;
  status: number;
  stringStatusMode?: "okCreated" | "statusText";
  statusText: string;
}) {
  const headers = createHeadersReader(args.headers || {});
  return {
    json: () => JSON.parse(args.body),
    text: () => args.body,
    responseTime: args.responseTime,
    code: args.status,
    status: args.statusText,
    headers,
    to: {
      have: {
        status: (code: number | string) => {
          if (typeof code === "number" && args.status !== code) {
            throw new Error(`Expected status ${code} but got ${args.status}`);
          }
          if (
            typeof code === "string" &&
            args.stringStatusMode === "okCreated" &&
            args.status !== 200 &&
            args.status !== 201
          ) {
            throw new Error(`Expected status to match ${code}`);
          }
          if (
            typeof code === "string" &&
            args.stringStatusMode !== "okCreated" &&
            args.statusText !== code
          ) {
            throw new Error(`Expected status to match ${code}`);
          }
        },
        body: (text: string) => {
          if (args.body !== text)
            throw new Error(`Expected body to be ${text}`);
        },
        header: (key: string) => {
          if (!headers.has(key)) throw new Error(`Header ${key} not found`);
        },
      },
    },
  };
}

export function createHeadersReader(headers: Record<string, string>) {
  return {
    all: () => headers,
    get: (key: string) => {
      const found = Object.entries(headers).find(
        ([headerKey]) => headerKey.toLowerCase() === key.toLowerCase(),
      );
      return found?.[1];
    },
    has: (key: string) =>
      Object.keys(headers).some(
        (headerKey) => headerKey.toLowerCase() === key.toLowerCase(),
      ),
  };
}
