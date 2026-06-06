import { invoke } from '@tauri-apps/api/core';
import { createContext, ReactNode, useContext, useState } from 'react';
import useSWRMutation from 'swr/mutation';

export interface HeaderItem {
  key: string;
  value: string;
}

export interface HttpResponse {
  status: number;
  status_text: string;
  headers: Record<string, string>;
  body: string;
  time_ms: number;
}

interface RequestContextState {
  url: string;
  setUrl: (url: string) => void;
  method: string;
  setMethod: (method: string) => void;
  headers: HeaderItem[];
  setHeaders: (headers: HeaderItem[]) => void;
  body: string;
  setBody: (body: string) => void;
  response: HttpResponse | null;
  isMutating: boolean;
  error: unknown;
  sendRequest: () => Promise<void>;
}

const RequestContext = createContext<RequestContextState | undefined>(undefined);

export function RequestProvider({ children }: { children: ReactNode }) {
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/todos/1');
  const [method, setMethod] = useState('GET');
  const [headers, setHeaders] = useState<HeaderItem[]>([{ key: '', value: '' }]);
  const [body, setBody] = useState('');
  const [response, setResponse] = useState<HttpResponse | null>(null);

  const { trigger, isMutating, error } = useSWRMutation(
    'api-request',
    async () => {
      const headerMap: Record<string, string> = {};
      headers.forEach((h) => {
        if (h.key && h.value) headerMap[h.key] = h.value;
      });

      const reqPayload = {
        url,
        method,
        headers: headerMap,
        body: body.trim() === '' ? null : body,
      };

      const res: HttpResponse = await invoke('make_request', { request: reqPayload });
      return res;
    }
  );

  const sendRequest = async () => {
    try {
      const result = await trigger();
      if (result) setResponse(result);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <RequestContext.Provider
      value={{
        url,
        setUrl,
        method,
        setMethod,
        headers,
        setHeaders,
        body,
        setBody,
        response,
        isMutating,
        error,
        sendRequest,
      }}
    >
      {children}
    </RequestContext.Provider>
  );
}

export function useRequest() {
  const context = useContext(RequestContext);
  if (!context) throw new Error('useRequest must be used within RequestProvider');
  return context;
}
