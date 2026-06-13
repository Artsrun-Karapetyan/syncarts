export type ScriptSuggestionKind =
  | "function"
  | "method"
  | "property"
  | "class"
  | "variable";

export interface ScriptSuggestion {
  detail: string;
  insertText: string;
  kind: ScriptSuggestionKind;
  label: string;
  typeText: string;
}

export function item(
  label: string,
  insertText: string,
  kind: ScriptSuggestionKind,
  detail: string,
  typeText: string,
): ScriptSuggestion {
  return { detail, insertText, kind, label, typeText };
}

export function variableStoreSuggestions(
  detailPrefix: string,
): ScriptSuggestion[] {
  return [
    item(
      "get",
      'get("variable_key")',
      "method",
      `${detailPrefix}: get value`,
      "(key) => string | undefined",
    ),
    item(
      "set",
      'set("variable_key", "variable_value")',
      "method",
      `${detailPrefix}: set value`,
      "(key, value) => void",
    ),
    item(
      "unset",
      'unset("variable_key")',
      "method",
      `${detailPrefix}: remove value`,
      "(key) => void",
    ),
  ];
}

export function headerSuggestions(detailPrefix: string): ScriptSuggestion[] {
  return [
    item(
      "get",
      'get("Header-Name")',
      "method",
      `${detailPrefix}: get value`,
      "(key) => string | undefined",
    ),
    item(
      "has",
      'has("Header-Name")',
      "method",
      `${detailPrefix}: check exists`,
      "(key) => boolean",
    ),
    item(
      "all",
      "all()",
      "method",
      `${detailPrefix}: list all`,
      "() => Header[]",
    ),
    item(
      "add",
      'add({ key: "Header-Name", value: "value" })',
      "method",
      `${detailPrefix}: add`,
      "(header) => void",
    ),
    item(
      "upsert",
      'upsert({ key: "Header-Name", value: "value" })',
      "method",
      `${detailPrefix}: add or update`,
      "(header) => void",
    ),
    item(
      "remove",
      'remove("Header-Name")',
      "method",
      `${detailPrefix}: remove`,
      "(key) => void",
    ),
  ];
}

export const OBJECT_MEMBERS = [
  item(
    "constructor",
    "constructor",
    "property",
    "Object constructor",
    "Function",
  ),
  item(
    "hasOwnProperty",
    "hasOwnProperty()",
    "method",
    "Check own property",
    "(key) => boolean",
  ),
  item(
    "propertyIsEnumerable",
    "propertyIsEnumerable()",
    "method",
    "Check enumerable property",
    "(key) => boolean",
  ),
  item(
    "isPrototypeOf",
    "isPrototypeOf()",
    "method",
    "Check prototype chain",
    "(object) => boolean",
  ),
  item(
    "toLocaleString",
    "toLocaleString()",
    "method",
    "Localized string",
    "() => string",
  ),
  item("toString", "toString()", "method", "Convert to string", "() => string"),
  item("valueOf", "valueOf()", "method", "Primitive value", "() => any"),
];

export const FUNCTION_MEMBERS = [
  ...OBJECT_MEMBERS,
  item(
    "apply",
    "apply()",
    "method",
    "Call function with this and args array",
    "(thisArg, args?) => any",
  ),
  item("arguments", "arguments", "property", "Function arguments", "any"),
  item(
    "bind",
    "bind()",
    "method",
    "Bind function this/context",
    "(thisArg, ...args) => Function",
  ),
  item(
    "call",
    "call()",
    "method",
    "Call function with this and args",
    "(thisArg, ...args) => any",
  ),
  item("caller", "caller", "property", "Caller function", "Function"),
  item("length", "length", "property", "Argument count", "number"),
  item("name", "name", "property", "Function name", "string"),
  item("prototype", "prototype", "property", "Function prototype", "object"),
  item(
    "toString",
    "toString()",
    "method",
    "Function source string",
    "() => string",
  ),
];
