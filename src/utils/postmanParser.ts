import { Collection, Environment, EnvironmentVariable, Folder, HeaderItem, SavedRequest, SavedExample, BodyType } from '../contexts/WorkspaceContext';
import { buildPostmanPathVariables, parsePostmanPathVariables } from './postmanPathVariables';

export function importPostmanCollection(jsonString: string): Omit<Collection, 'id'> {
  const data = JSON.parse(jsonString);
  if (!data.info || !data.info.name) {
    throw new Error('Invalid Postman Collection format');
  }
  const parseEvents = (events?: any[]) => {
    let preRequestScript = '';
    let testScript = '';
    if (Array.isArray(events)) {
      events.forEach(e => {
        if (e.listen === 'prerequest' && e.script && Array.isArray(e.script.exec)) {
          preRequestScript = e.script.exec.join('\n');
        } else if (e.listen === 'test' && e.script && Array.isArray(e.script.exec)) {
          testScript = e.script.exec.join('\n');
        }
      });
    }
    return { preRequestScript, testScript };
  };

  const parseAuth = (auth?: any): { authType: 'inherit' | 'none' | 'bearer', bearerToken: string } => {
    let authType: 'inherit' | 'none' | 'bearer' = 'inherit';
    let bearerToken = '';
    if (auth) {
      if (auth.type === 'noauth') authType = 'none';
      if (auth.type === 'bearer') {
        authType = 'bearer';
        if (Array.isArray(auth.bearer)) {
          const tokenObj = auth.bearer.find((b: any) => b.key === 'token');
          if (tokenObj) bearerToken = tokenObj.value;
        }
      }
    }
    return { authType, bearerToken };
  };

  const parseItem = (item: any): Folder | SavedRequest => {
    const { preRequestScript, testScript } = parseEvents(item.event);
    const { authType, bearerToken } = parseAuth(item.auth);
    const description = typeof item.description === 'string' ? item.description : (item.request?.description || '');

    if (item.item) {
      // It's a folder
      return {
        type: 'folder',
        id: crypto.randomUUID(),
        name: item.name || 'Untitled Folder',
        items: item.item.map(parseItem),
        preRequestScript,
        testScript,
        authType,
        bearerToken,
        description
      };
    } else {
      // It's a request
      const req = item.request || {};
      
      if (typeof req === 'string') {
        return {
          type: 'request',
          id: crypto.randomUUID(),
          name: item.name || 'Untitled Request',
          method: 'GET',
          url: req,
          pathVariables: parsePostmanPathVariables(undefined, req),
          headers: [{ key: '', value: '' }],
          body: '',
          preRequestScript,
          testScript,
          authType,
          bearerToken,
          description
        };
      }
      
      const method = req.method || 'GET';
      let url = '';
      if (typeof req.url === 'string') {
        url = req.url;
      } else if (req.url && req.url.raw) {
        url = req.url.raw;
      }
      const pathVariables = parsePostmanPathVariables(req.url, url);

      let headers: HeaderItem[] = [{ key: '', value: '' }];
      if (Array.isArray(req.header) && req.header.length > 0) {
        headers = req.header.map((h: any) => ({
          key: h.key || '',
          value: h.value || ''
        }));
        if (headers[headers.length - 1].key !== '' || headers[headers.length - 1].value !== '') {
          headers.push({ key: '', value: '' });
        }
      }

      const parseBody = (postmanBody: any) => {
        let body = '';
        let bodyType: BodyType | undefined = undefined;
        let formData: any[] = [];
        
        if (postmanBody) {
          if (postmanBody.mode === 'raw') {
            bodyType = 'raw';
            body = postmanBody.raw || '';
          } else if (postmanBody.mode === 'formdata') {
            bodyType = 'form-data';
            if (Array.isArray(postmanBody.formdata)) {
              formData = postmanBody.formdata.map((f: any) => ({
                id: crypto.randomUUID(),
                key: f.key || '',
                value: f.value || '',
                type: f.type === 'file' ? 'file' : 'text',
                enabled: f.disabled !== true
              }));
            }
          } else if (postmanBody.mode === 'urlencoded') {
            bodyType = 'x-www-form-urlencoded';
            if (Array.isArray(postmanBody.urlencoded)) {
              formData = postmanBody.urlencoded.map((f: any) => ({
                id: crypto.randomUUID(),
                key: f.key || '',
                value: f.value || '',
                type: 'text',
                enabled: f.disabled !== true
              }));
            }
          } else if (postmanBody.raw) {
            body = postmanBody.raw;
          }
        }
        
        return { body, bodyType, formData: formData.length > 0 ? formData : undefined };
      };

      const parsedMainBody = parseBody(req.body);

      let examples: SavedExample[] = [];
      if (Array.isArray(item.response)) {
        examples = item.response.map((res: any) => {
          let resHeaders: HeaderItem[] = [];
          if (Array.isArray(res.header)) {
            resHeaders = res.header.map((h: any) => ({
              key: h.key || '',
              value: h.value || ''
            }));
          }
          let reqHeaders: HeaderItem[] = [];
          if (res.originalRequest && Array.isArray(res.originalRequest.header)) {
             reqHeaders = res.originalRequest.header.map((h: any) => ({
              key: h.key || '',
              value: h.value || ''
            }));
          }
          let parsedOrigBody = { body: '', bodyType: undefined as BodyType | undefined, formData: undefined as any[] | undefined };
          if (res.originalRequest?.body) {
            parsedOrigBody = parseBody(res.originalRequest.body);
          }
          
          return {
            id: crypto.randomUUID(),
            name: res.name || 'Example',
            code: res.code || 200,
            status: res.status || 'OK',
            body: res.body || '',
            headers: resHeaders,
            originalRequest: res.originalRequest ? {
              method: res.originalRequest.method || 'GET',
              url: typeof res.originalRequest.url === 'string' ? res.originalRequest.url : (res.originalRequest.url?.raw || ''),
              pathVariables: parsePostmanPathVariables(res.originalRequest.url, typeof res.originalRequest.url === 'string' ? res.originalRequest.url : (res.originalRequest.url?.raw || '')),
              headers: reqHeaders,
              body: parsedOrigBody.body,
              bodyType: parsedOrigBody.bodyType,
              formData: parsedOrigBody.formData
            } : undefined
          };
        });
      }

      return {
        type: 'request',
        id: crypto.randomUUID(),
        name: item.name || 'Untitled Request',
        method,
        url,
        pathVariables,
        headers,
        body: parsedMainBody.body,
        bodyType: parsedMainBody.bodyType,
        formData: parsedMainBody.formData,
        preRequestScript,
        testScript,
        authType,
        bearerToken,
        description,
        examples: examples.length > 0 ? examples : undefined
      };
    }
  };

  const parsedItems = Array.isArray(data.item) ? data.item.map(parseItem) : [];
  
  const { preRequestScript, testScript } = parseEvents(data.event);
  const { authType, bearerToken } = parseAuth(data.auth);
  const description = typeof data.info.description === 'string' ? data.info.description : '';
  
  const variables: EnvironmentVariable[] = [];
  if (Array.isArray(data.variable)) {
    data.variable.forEach((v: any) => {
      if (v.key) {
        variables.push({
          id: crypto.randomUUID(),
          key: v.key,
          value: v.value || '',
          enabled: v.disabled !== true
        });
      }
    });
  }

  return {
    name: data.info.name,
    items: parsedItems,
    preRequestScript,
    testScript,
    authType,
    bearerToken,
    description,
    variables
  };
}

export function exportToPostmanCollection(collection: Collection): string {
  const exportItem = (item: Folder | SavedRequest): any => {
    const buildEvents = (pre: string | undefined, test: string | undefined) => {
      const events = [];
      if (pre) events.push({ listen: 'prerequest', script: { type: 'text/javascript', exec: pre.split('\n') } });
      if (test) events.push({ listen: 'test', script: { type: 'text/javascript', exec: test.split('\n') } });
      return events.length > 0 ? events : undefined;
    };

    const buildAuth = (type: 'inherit' | 'none' | 'bearer' | undefined, token: string | undefined) => {
      if (type === 'none') return { type: 'noauth' };
      if (type === 'bearer' && token) return { type: 'bearer', bearer: [{ key: 'token', value: token, type: 'string' }] };
      return undefined; // inherit
    };

    if (item.type === 'folder') {
      return {
        name: item.name,
        description: item.description,
        item: item.items.map(exportItem),
        event: buildEvents(item.preRequestScript, item.testScript),
        auth: buildAuth(item.authType, item.bearerToken)
      };
    } else {
      const cleanHeaders = item.headers.filter(h => h.key.trim() !== '');
      
      let host: string[] = [];
      let path: string[] = [];
      
      try {
        const parsedUrl = new URL(item.url);
        host = parsedUrl.host.split('.');
        path = parsedUrl.pathname.split('/').filter(Boolean);
      } catch (e) {
        // Fallback if URL is invalid/empty
      }
      
      return {
        name: item.name,
        event: buildEvents(item.preRequestScript, item.testScript),
        request: {
          method: item.method,
          description: item.description,
          auth: buildAuth(item.authType, item.bearerToken),
          header: cleanHeaders.map(h => ({
            key: h.key,
            value: h.value,
            type: 'text'
          })),
          body: {
            mode: 'raw',
            raw: item.body
          },
          url: {
            raw: item.url,
            host,
            path,
            variable: buildPostmanPathVariables(item.pathVariables)
          }
        },
        response: []
      };
    }
  };

  const postmanFormat: any = {
    info: {
      name: collection.name,
      description: collection.description,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    },
    item: collection.items.map(exportItem)
  };

  const colEvents = [];
  if (collection.preRequestScript) colEvents.push({ listen: 'prerequest', script: { type: 'text/javascript', exec: collection.preRequestScript.split('\n') } });
  if (collection.testScript) colEvents.push({ listen: 'test', script: { type: 'text/javascript', exec: collection.testScript.split('\n') } });
  if (colEvents.length > 0) postmanFormat.event = colEvents;

  if (collection.authType === 'none') postmanFormat.auth = { type: 'noauth' };
  else if (collection.authType === 'bearer' && collection.bearerToken) postmanFormat.auth = { type: 'bearer', bearer: [{ key: 'token', value: collection.bearerToken, type: 'string' }] };

  if (collection.variables && collection.variables.length > 0) {
    postmanFormat.variable = collection.variables.map(v => ({
      key: v.key,
      value: v.value,
      type: 'string',
      disabled: !v.enabled
    }));
  }

  return JSON.stringify(postmanFormat, null, 2);
}

export function importPostmanEnvironment(jsonString: string): Omit<Environment, 'id'> {
  const data = JSON.parse(jsonString);
  if (!data.name || !Array.isArray(data.values)) {
    throw new Error('Invalid Postman Environment format');
  }

  const variables: EnvironmentVariable[] = data.values.map((v: any) => ({
    id: crypto.randomUUID(),
    key: v.key || '',
    value: v.value || '',
    enabled: v.enabled !== false // Postman uses 'enabled', defaulting to true
  })).filter((v: EnvironmentVariable) => v.key);

  return {
    name: data.name,
    variables
  };
}
