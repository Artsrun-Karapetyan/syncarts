import type { Collection } from "../core/types";

export function getUniqueCollectionName(
  collections: Collection[],
  baseName: string,
) {
  const normalizedBaseName = baseName.trim() || "Collection";
  const existingNames = new Set(collections.map((item) => item.name));

  if (!existingNames.has(normalizedBaseName)) return normalizedBaseName;

  let index = 2;
  while (existingNames.has(`${normalizedBaseName} ${index}`)) {
    index += 1;
  }

  return `${normalizedBaseName} ${index}`;
}
