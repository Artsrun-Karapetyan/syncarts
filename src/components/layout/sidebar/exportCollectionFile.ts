import { invoke } from "@tauri-apps/api/core";

import { exportToPostmanCollection } from "../../../utils/postmanParser";

export async function exportCollectionFile(
  defaultName: string,
  collection: Parameters<typeof exportToPostmanCollection>[0],
) {
  try {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const filePath = await save({
      defaultPath: `${defaultName}.postman_collection.json`,
      filters: [{ name: "Postman Collection", extensions: ["json"] }],
    });

    if (!filePath) return;

    await invoke("save_response_body", {
      path: filePath,
      body: exportToPostmanCollection(collection),
    });
  } catch (err) {
    console.error("Failed to export collection:", err);
    alert("Failed to export collection.");
  }
}
