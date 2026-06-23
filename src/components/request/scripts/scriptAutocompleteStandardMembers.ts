import {
  item,
  type ScriptSuggestion,
} from "@/components/request/scripts/scriptAutocompleteHelpers";

export const STANDARD_MEMBERS: Record<string, ScriptSuggestion[]> = {
  console: [
    item("log", "log()", "method", "Write a log line", "(...args) => void"),
    item("warn", "warn()", "method", "Write a warning", "(...args) => void"),
    item("error", "error()", "method", "Write an error", "(...args) => void"),
    item("info", "info()", "method", "Write info log", "(...args) => void"),
    item("debug", "debug()", "method", "Write debug log", "(...args) => void"),
    item("table", "table()", "method", "Print tabular data", "(data) => void"),
    item("time", 'time("label")', "method", "Start timer", "(label) => void"),
    item(
      "timeEnd",
      'timeEnd("label")',
      "method",
      "End timer",
      "(label) => void",
    ),
  ],
  JSON: [
    item("parse", "parse()", "method", "Parse JSON string", "(text) => any"),
    item(
      "stringify",
      "stringify()",
      "method",
      "Convert value to JSON string",
      "(value) => string",
    ),
  ],
  Math: [
    item("abs", "abs()", "method", "Absolute value", "(x) => number"),
    item(
      "random",
      "random()",
      "method",
      "Random number from 0 to 1",
      "() => number",
    ),
    item("floor", "floor()", "method", "Round down", "(x) => number"),
    item("ceil", "ceil()", "method", "Round up", "(x) => number"),
    item(
      "round",
      "round()",
      "method",
      "Round to nearest integer",
      "(x) => number",
    ),
    item("max", "max()", "method", "Largest number", "(...values) => number"),
    item("min", "min()", "method", "Smallest number", "(...values) => number"),
    item("pow", "pow()", "method", "Power", "(base, exponent) => number"),
    item("sqrt", "sqrt()", "method", "Square root", "(x) => number"),
  ],
  Object: [
    item("keys", "keys()", "method", "Object keys", "(object) => string[]"),
    item("values", "values()", "method", "Object values", "(object) => any[]"),
    item(
      "entries",
      "entries()",
      "method",
      "Object entries",
      "(object) => [key, value][]",
    ),
    item(
      "assign",
      "assign()",
      "method",
      "Copy object values",
      "(target, ...sources) => object",
    ),
    item(
      "fromEntries",
      "fromEntries()",
      "method",
      "Create object from entries",
      "(entries) => object",
    ),
  ],
  Array: [
    item(
      "isArray",
      "isArray()",
      "method",
      "Check if value is array",
      "(value) => boolean",
    ),
    item(
      "from",
      "from()",
      "method",
      "Create array from iterable",
      "(value) => any[]",
    ),
    item(
      "of",
      "of()",
      "method",
      "Create array from arguments",
      "(...items) => any[]",
    ),
  ],
  Date: [
    item("now", "now()", "method", "Current timestamp in ms", "() => number"),
    item(
      "parse",
      "parse()",
      "method",
      "Parse date string",
      "(value) => number",
    ),
  ],
};
