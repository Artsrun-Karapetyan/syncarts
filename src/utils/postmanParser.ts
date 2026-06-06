import { Collection, Folder, HeaderItem, SavedRequest } from '../contexts/WorkspaceContext';

export function importPostmanCollection(jsonString: string): Omit<Collection, 'id'> {
  const data = JSON.parse(jsonString);
  if (!data.info || !data.info.name) {
    throw new Error('Invalid Postman Collection format');
  }

  const parseItem = (item: any): Folder | SavedRequest => {
    if (item.item) {
      // It's a folder
      return {
        type: 'folder',
        id: crypto.randomUUID(),
        name: item.name || 'Untitled Folder',
        items: item.item.map(parseItem)
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
          headers: [{ key: '', value: '' }],
          body: ''
        };
      }
      
      const method = req.method || 'GET';
      let url = '';
      if (typeof req.url === 'string') {
        url = req.url;
      } else if (req.url && req.url.raw) {
        url = req.url.raw;
      }

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

      let body = '';
      if (req.body && req.body.raw) {
        body = req.body.raw;
      }

      return {
        type: 'request',
        id: crypto.randomUUID(),
        name: item.name || 'Untitled Request',
        method,
        url,
        headers,
        body
      };
    }
  };

  const parsedItems = Array.isArray(data.item) ? data.item.map(parseItem) : [];

  return {
    name: data.info.name,
    items: parsedItems
  };
}

export function exportToPostmanCollection(collection: Collection): string {
  const exportItem = (item: Folder | SavedRequest): any => {
    if (item.type === 'folder') {
      return {
        name: item.name,
        item: item.items.map(exportItem)
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
        request: {
          method: item.method,
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
            path
          }
        },
        response: []
      };
    }
  };

  const postmanFormat = {
    info: {
      name: collection.name,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    },
    item: collection.items.map(exportItem)
  };

  return JSON.stringify(postmanFormat, null, 2);
}
