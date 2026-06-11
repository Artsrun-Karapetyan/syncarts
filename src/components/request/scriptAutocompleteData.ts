export type ScriptSuggestionKind = 'function' | 'method' | 'property' | 'class' | 'variable';

export interface ScriptSuggestion {
  detail: string;
  insertText: string;
  kind: ScriptSuggestionKind;
  label: string;
  typeText: string;
}

const ROOT_SUGGESTIONS: ScriptSuggestion[] = [
  item('pm', 'pm', 'variable', 'Postman sandbox API', 'Postman'),
  item('console', 'console', 'variable', 'Console logging API', 'Console'),
  item('crypto', 'crypto', 'variable', 'Web Crypto API', 'Crypto'),
  item('fetch', 'fetch()', 'function', 'Fetch HTTP resource', '(input, init?) => Promise<Response>'),
  item('JSON', 'JSON', 'class', 'JSON parse/stringify helpers', 'JSON'),
  item('Math', 'Math', 'class', 'Math constants and functions', 'Math'),
  item('Date', 'Date', 'class', 'Date constructor', 'DateConstructor'),
  item('Object', 'Object', 'class', 'Object constructor', 'ObjectConstructor'),
  item('Array', 'Array', 'class', 'Array constructor', 'ArrayConstructor'),
  item('String', 'String', 'class', 'String constructor', 'StringConstructor'),
  item('Number', 'Number', 'class', 'Number constructor', 'NumberConstructor'),
  item('Boolean', 'Boolean', 'class', 'Boolean constructor', 'BooleanConstructor'),
  item('parseInt', 'parseInt(value, 10)', 'function', 'Parse string to integer', '(string, radix?) => number'),
  item('parseFloat', 'parseFloat(value)', 'function', 'Parse string to number', '(string) => number'),
  item('setTimeout', 'setTimeout(function () {\n    \n}, 0)', 'function', 'Run callback after delay', '(handler, timeout) => number'),
  item('clearTimeout', 'clearTimeout(id)', 'function', 'Clear timeout', '(id) => void'),
  item('encodeURIComponent', 'encodeURIComponent(value)', 'function', 'Encode URL component', '(value) => string'),
  item('decodeURIComponent', 'decodeURIComponent(value)', 'function', 'Decode URL component', '(value) => string'),
];

const MEMBERS: Record<string, ScriptSuggestion[]> = {
  pm: [
    item('collectionVariables', 'collectionVariables', 'property', 'Collection variables', 'PostmanVariableScope'),
    item('cookies', 'cookies', 'property', 'Cookie helpers', 'PostmanCookies'),
    item('datasets', 'datasets', 'property', 'Dataset helpers', 'PostmanDatasets'),
    item('environment', 'environment', 'property', 'Environment variables', 'PostmanVariableScope'),
    item('execution', 'execution', 'property', 'Execution metadata', 'PostmanExecution'),
    item('expect', 'expect(value)', 'function', 'Assertion helper', 'Chai.expect'),
    item('globals', 'globals', 'property', 'Global variables', 'PostmanVariableScope'),
    item('info', 'info', 'property', 'Request and script metadata', 'PostmanInfo'),
    item('iterationData', 'iterationData', 'property', 'Iteration data variables', 'PostmanVariableScope'),
    item('message', 'message', 'property', 'Current execution message', 'PostmanMessage'),
    item('request', 'request', 'property', 'Current request', 'PostmanRequest'),
    item('require', 'require("module")', 'function', 'Load sandbox package', '(module) => any'),
    item('response', 'response', 'property', 'Current response', 'PostmanResponse'),
    item('sendRequest', 'sendRequest("https://example.com", function (err, response) {\n    \n})', 'function', 'Send HTTP request', '(request, callback?) => Promise<Response>'),
    item('test', 'test("name", function () {\n    \n})', 'function', 'Create a test', '(name, fn) => void'),
    item('vault', 'vault', 'property', 'Vault secrets', 'PostmanVault'),
    item('variables', 'variables', 'property', 'Scoped variables', 'PostmanVariableScope'),
    item('visualizer', 'visualizer', 'property', 'Response visualizer', 'PostmanVisualizer'),
  ],
  console: [
    item('log', 'log()', 'method', 'Write a log line', '(...args) => void'),
    item('warn', 'warn()', 'method', 'Write a warning', '(...args) => void'),
    item('error', 'error()', 'method', 'Write an error', '(...args) => void'),
    item('info', 'info()', 'method', 'Write info log', '(...args) => void'),
    item('debug', 'debug()', 'method', 'Write debug log', '(...args) => void'),
    item('table', 'table()', 'method', 'Print tabular data', '(data) => void'),
    item('time', 'time("label")', 'method', 'Start timer', '(label) => void'),
    item('timeEnd', 'timeEnd("label")', 'method', 'End timer', '(label) => void'),
  ],
  JSON: [
    item('parse', 'parse()', 'method', 'Parse JSON string', '(text) => any'),
    item('stringify', 'stringify()', 'method', 'Convert value to JSON string', '(value) => string'),
  ],
  Math: [
    item('abs', 'abs()', 'method', 'Absolute value', '(x) => number'),
    item('random', 'random()', 'method', 'Random number from 0 to 1', '() => number'),
    item('floor', 'floor()', 'method', 'Round down', '(x) => number'),
    item('ceil', 'ceil()', 'method', 'Round up', '(x) => number'),
    item('round', 'round()', 'method', 'Round to nearest integer', '(x) => number'),
    item('max', 'max()', 'method', 'Largest number', '(...values) => number'),
    item('min', 'min()', 'method', 'Smallest number', '(...values) => number'),
    item('pow', 'pow()', 'method', 'Power', '(base, exponent) => number'),
    item('sqrt', 'sqrt()', 'method', 'Square root', '(x) => number'),
  ],
  Object: [
    item('keys', 'keys()', 'method', 'Object keys', '(object) => string[]'),
    item('values', 'values()', 'method', 'Object values', '(object) => any[]'),
    item('entries', 'entries()', 'method', 'Object entries', '(object) => [key, value][]'),
    item('assign', 'assign()', 'method', 'Copy object values', '(target, ...sources) => object'),
    item('fromEntries', 'fromEntries()', 'method', 'Create object from entries', '(entries) => object'),
  ],
  Array: [
    item('isArray', 'isArray()', 'method', 'Check if value is array', '(value) => boolean'),
    item('from', 'from()', 'method', 'Create array from iterable', '(value) => any[]'),
    item('of', 'of()', 'method', 'Create array from arguments', '(...items) => any[]'),
  ],
  Date: [
    item('now', 'now()', 'method', 'Current timestamp in ms', '() => number'),
    item('parse', 'parse()', 'method', 'Parse date string', '(value) => number'),
  ],
  'pm.environment': variableStoreSuggestions('Environment variable store'),
  'pm.collectionVariables': variableStoreSuggestions('Collection variable store'),
  'pm.globals': variableStoreSuggestions('Global variable store'),
  'pm.variables': variableStoreSuggestions('Scoped variable store'),
  'pm.iterationData': variableStoreSuggestions('Iteration data store'),
  'pm.cookies': [
    item('get', 'get("name")', 'method', 'Get cookie', '(name) => string | undefined'),
    item('has', 'has("name")', 'method', 'Check cookie exists', '(name) => boolean'),
    item('toObject', 'toObject()', 'method', 'Convert cookies to object', '() => object'),
    item('jar', 'jar()', 'method', 'Get cookie jar', '() => CookieJar'),
  ],
  'pm.info': [
    item('eventName', 'eventName', 'property', 'Script event name', 'string'),
    item('iteration', 'iteration', 'property', 'Current iteration', 'number'),
    item('requestId', 'requestId', 'property', 'Request id', 'string'),
    item('requestName', 'requestName', 'property', 'Request name', 'string'),
    item('collectionId', 'collectionId', 'property', 'Collection id', 'string'),
  ],
  'pm.execution': [
    item('location', 'location', 'property', 'Execution location', 'object'),
    item('skipRequest', 'skipRequest()', 'method', 'Skip current request', '() => void'),
    item('setNextRequest', 'setNextRequest(null)', 'method', 'Set next request', '(name | null) => void'),
  ],
  'pm.response': [
    item('json', 'json()', 'method', 'Parse response body as JSON', '() => any'),
    item('text', 'text()', 'method', 'Read response body as text', '() => string'),
    item('code', 'code', 'property', 'HTTP status code', 'number'),
    item('status', 'status', 'property', 'HTTP status text', 'string'),
    item('responseTime', 'responseTime', 'property', 'Response time in ms', 'number'),
    item('headers', 'headers', 'property', 'Response headers', 'HeaderList'),
    item('cookies', 'cookies', 'property', 'Response cookies', 'CookieList'),
    item('size', 'size()', 'method', 'Response size info', '() => object'),
    item('to', 'to', 'property', 'Postman-style assertions', 'ResponseAssertion'),
  ],
  'pm.request': [
    item('url', 'url', 'property', 'Request URL', 'string'),
    item('method', 'method', 'property', 'Request method', 'string'),
    item('headers', 'headers', 'property', 'Request headers', 'HeaderList'),
    item('body', 'body', 'property', 'Request body', 'any'),
    item('auth', 'auth', 'property', 'Request auth', 'any'),
    item('addHeader', 'addHeader({ key: "Header-Name", value: "value" })', 'method', 'Add request header', '(header) => void'),
    item('getHeaders', 'getHeaders()', 'method', 'List request headers', '() => Header[]'),
    item('removeHeader', 'removeHeader("Header-Name")', 'method', 'Remove request header', '(key) => void'),
  ],
  'pm.request.headers': headerSuggestions('Request header'),
  'pm.response.headers': headerSuggestions('Response header'),
  'pm.response.to': [item('have', 'have', 'property', 'Response assertions', 'ResponseHaveAssertion')],
  'pm.response.to.have': [
    item('status', 'status(200)', 'method', 'Assert status code', '(code) => void'),
    item('body', 'body("text")', 'method', 'Assert body text', '(text) => void'),
    item('header', 'header("Header-Name")', 'method', 'Assert header exists', '(key) => void'),
  ],
};

const OBJECT_MEMBERS = [
  item('constructor', 'constructor', 'property', 'Object constructor', 'Function'),
  item('hasOwnProperty', 'hasOwnProperty()', 'method', 'Check own property', '(key) => boolean'),
  item('propertyIsEnumerable', 'propertyIsEnumerable()', 'method', 'Check enumerable property', '(key) => boolean'),
  item('isPrototypeOf', 'isPrototypeOf()', 'method', 'Check prototype chain', '(object) => boolean'),
  item('toLocaleString', 'toLocaleString()', 'method', 'Localized string', '() => string'),
  item('toString', 'toString()', 'method', 'Convert to string', '() => string'),
  item('valueOf', 'valueOf()', 'method', 'Primitive value', '() => any'),
];

const FUNCTION_MEMBERS = [
  ...OBJECT_MEMBERS,
  item('apply', 'apply()', 'method', 'Call function with this and args array', '(thisArg, args?) => any'),
  item('arguments', 'arguments', 'property', 'Function arguments', 'any'),
  item('bind', 'bind()', 'method', 'Bind function this/context', '(thisArg, ...args) => Function'),
  item('call', 'call()', 'method', 'Call function with this and args', '(thisArg, ...args) => any'),
  item('caller', 'caller', 'property', 'Caller function', 'Function'),
  item('length', 'length', 'property', 'Argument count', 'number'),
  item('name', 'name', 'property', 'Function name', 'string'),
  item('prototype', 'prototype', 'property', 'Function prototype', 'object'),
  item('toString', 'toString()', 'method', 'Function source string', '() => string'),
];

export function getScriptSuggestions(path: string, query: string) {
  const list = path === ''
    ? ROOT_SUGGESTIONS
    : MEMBERS[path] || (path.split('.').length > 1 ? FUNCTION_MEMBERS : OBJECT_MEMBERS);
  const normalizedQuery = query.toLowerCase();
  return list
    .filter(item => item.label.toLowerCase().startsWith(normalizedQuery))
    .slice(0, 30);
}

function variableStoreSuggestions(detailPrefix: string): ScriptSuggestion[] {
  return [
    item('get', 'get("variable_key")', 'method', `${detailPrefix}: get value`, '(key) => string | undefined'),
    item('set', 'set("variable_key", "variable_value")', 'method', `${detailPrefix}: set value`, '(key, value) => void'),
    item('unset', 'unset("variable_key")', 'method', `${detailPrefix}: remove value`, '(key) => void'),
  ];
}

function headerSuggestions(detailPrefix: string): ScriptSuggestion[] {
  return [
    item('get', 'get("Header-Name")', 'method', `${detailPrefix}: get value`, '(key) => string | undefined'),
    item('has', 'has("Header-Name")', 'method', `${detailPrefix}: check exists`, '(key) => boolean'),
    item('all', 'all()', 'method', `${detailPrefix}: list all`, '() => Header[]'),
    item('add', 'add({ key: "Header-Name", value: "value" })', 'method', `${detailPrefix}: add`, '(header) => void'),
    item('upsert', 'upsert({ key: "Header-Name", value: "value" })', 'method', `${detailPrefix}: add or update`, '(header) => void'),
    item('remove', 'remove("Header-Name")', 'method', `${detailPrefix}: remove`, '(key) => void'),
  ];
}

function item(label: string, insertText: string, kind: ScriptSuggestionKind, detail: string, typeText: string): ScriptSuggestion {
  return { detail, insertText, kind, label, typeText };
}
