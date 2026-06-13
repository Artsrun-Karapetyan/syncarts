import {
  FUNCTION_MEMBERS,
  OBJECT_MEMBERS,
  type ScriptSuggestion,
} from "./scriptAutocompleteHelpers";
import { POSTMAN_MEMBERS } from "./scriptAutocompletePostmanMembers";
import { ROOT_SUGGESTIONS } from "./scriptAutocompleteRoot";
import { STANDARD_MEMBERS } from "./scriptAutocompleteStandardMembers";

export type { ScriptSuggestion } from "./scriptAutocompleteHelpers";

const MEMBERS: Record<string, ScriptSuggestion[]> = {
  ...STANDARD_MEMBERS,
  ...POSTMAN_MEMBERS,
};

export function getScriptSuggestions(path: string, query: string) {
  const list =
    path === ""
      ? ROOT_SUGGESTIONS
      : MEMBERS[path] ||
        (path.split(".").length > 1 ? FUNCTION_MEMBERS : OBJECT_MEMBERS);
  const normalizedQuery = query.toLowerCase();
  return list
    .filter((item) => item.label.toLowerCase().startsWith(normalizedQuery))
    .slice(0, 30);
}
