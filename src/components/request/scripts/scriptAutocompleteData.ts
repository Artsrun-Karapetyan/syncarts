import {
  FUNCTION_MEMBERS,
  OBJECT_MEMBERS,
  type ScriptSuggestion,
} from "@/components/request/scripts/scriptAutocompleteHelpers";
import { POSTMAN_MEMBERS } from "@/components/request/scripts/scriptAutocompletePostmanMembers";
import { ROOT_SUGGESTIONS } from "@/components/request/scripts/scriptAutocompleteRoot";
import { STANDARD_MEMBERS } from "@/components/request/scripts/scriptAutocompleteStandardMembers";

export type { ScriptSuggestion } from "@/components/request/scripts/scriptAutocompleteHelpers";

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
