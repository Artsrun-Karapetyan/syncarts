import type { Collection, TabData } from './types';

export const DEFAULT_COLLECTIONS: Collection[] = [
  {
    id: 'col-1',
    name: 'JSONPlaceholder API',
    items: [
      {
        type: 'folder',
        id: 'folder-1',
        name: 'Posts',
        items: [
          {
            type: 'request',
            id: 'req-1',
            name: 'Get All Posts',
            method: 'GET',
            url: 'https://jsonplaceholder.typicode.com/posts',
            headers: [],
            bodyType: 'none',
            formData: [],
            body: ''
          },
          {
            type: 'request',
            id: 'req-2',
            name: 'Create Post',
            method: 'POST',
            url: 'https://jsonplaceholder.typicode.com/posts',
            headers: [{ key: 'Content-type', value: 'application/json; charset=UTF-8' }],
            bodyType: 'raw',
            formData: [],
            body: '{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}'
          }
        ]
      },
      {
        type: 'request',
        id: 'req-3',
        name: 'Get Users',
        method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/users',
        headers: [],
        bodyType: 'none',
        formData: [],
        body: ''
      }
    ]
  }
];

export function createEmptyRequestTab(): TabData {
  return {
    id: crypto.randomUUID(),
    name: 'Untitled Request',
    method: 'GET',
    url: '',
    headers: [{ key: '', value: '' }],
    authType: 'inherit',
    bodyType: 'raw',
    formData: [{ id: crypto.randomUUID(), key: '', value: '', enabled: true, type: 'text' }],
    body: '',
    response: null
  };
}
