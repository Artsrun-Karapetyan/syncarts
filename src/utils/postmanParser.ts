import type {
  Collection,
  Environment,
  EnvironmentVariable,
} from "@/contexts/WorkspaceContext";
import { parseOpenApiCollection } from "@/utils/openapi/openApiImportParser";
import { stringifyPostmanCollection } from "@/utils/postman/postmanExportParser";
import { parsePostmanCollection } from "@/utils/postman/postmanImportParser";

export function importPostmanCollection(
  jsonString: string,
): Omit<Collection, "id"> {
  return parsePostmanCollection(jsonString);
}

export function importOpenApiCollection(
  jsonString: string,
): Omit<Collection, "id"> {
  return parseOpenApiCollection(jsonString);
}

export function exportToPostmanCollection(collection: Collection): string {
  return stringifyPostmanCollection(collection);
}

export function importPostmanEnvironment(
  jsonString: string,
): Omit<Environment, "id"> {
  const data = JSON.parse(jsonString);
  if (!data.name || !Array.isArray(data.values)) {
    throw new Error("Invalid Postman Environment format");
  }

  const variables: EnvironmentVariable[] = data.values
    .map((value: any) => ({
      id: crypto.randomUUID(),
      key: value.key || "",
      value: value.value || "",
      enabled: value.enabled !== false,
    }))
    .filter((variable: EnvironmentVariable) => variable.key);

  return {
    name: data.name,
    variables,
  };
}
