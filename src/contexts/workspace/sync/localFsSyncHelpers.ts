import { invoke } from "@tauri-apps/api/core";

import type { Workspace } from "@/contexts/workspace/core/types";

export interface LocalFile {
  relative_path: string;
  content: string;
}

function getUniqueName(desiredName: string, usedNames: Set<string>): string {
  let name = desiredName;
  let counter = 1;
  while (usedNames.has(name.toLowerCase())) {
    name = `${desiredName} ${counter}`;
    counter++;
  }
  usedNames.add(name.toLowerCase());
  return name;
}

export async function writeWorkspaceToLocalFs(workspace: Workspace) {
  if (!workspace.path || workspace.type !== "local") return;

  const filesToWrite: LocalFile[] = [];

  // syncarts.json
  filesToWrite.push({
    relative_path: "syncarts.json",
    content: JSON.stringify(
      {
        id: workspace.id,
        name: workspace.name,
        type: workspace.type,
        globalVariables: workspace.globalVariables || [],
      },
      null,
      2,
    ),
  });

  // Wipe old collections and environments before writing
  try {
    await invoke("delete_local_dir", {
      basePath: workspace.path,
      relativePath: "collections",
    });
    await invoke("delete_local_dir", {
      basePath: workspace.path,
      relativePath: "environments",
    });
  } catch {
    // Ignore
  }

  // environments
  const usedEnvNames = new Set<string>();
  for (const env of workspace.environments || []) {
    const safeName = getUniqueName(sanitizeFilename(env.name), usedEnvNames);
    filesToWrite.push({
      relative_path: `environments/${safeName}.env.json`,
      content: JSON.stringify(env, null, 2),
    });
  }

  // collections
  const usedColNames = new Set<string>();
  for (const col of workspace.collections || []) {
    const safeName = getUniqueName(sanitizeFilename(col.name), usedColNames);
    const colPath = `collections/${safeName}`;

    filesToWrite.push({
      relative_path: `${colPath}/collection.json`,
      content: JSON.stringify(
        {
          id: col.id,
          name: col.name,
          authType: col.authType,
          bearerToken: col.bearerToken,
          description: col.description,
          preRequestScript: col.preRequestScript,
          testScript: col.testScript,
          variables: col.variables,
        },
        null,
        2,
      ),
    });

    writeItemsRecursive(col.items, colPath, filesToWrite);
  }

  // Optimize: we can just write them all
  for (const file of filesToWrite) {
    try {
      await invoke("write_local_file", {
        basePath: workspace.path,
        relativePath: file.relative_path,
        content: file.content,
      });
    } catch (err) {
      console.error(`Failed to write local file ${file.relative_path}:`, err);
    }
  }
}

function writeItemsRecursive(
  items: any[],
  basePath: string,
  filesToWrite: LocalFile[],
) {
  const usedNames = new Set<string>();

  for (const item of items) {
    const safeName = getUniqueName(sanitizeFilename(item.name), usedNames);

    if (item.type === "folder") {
      const folderPath = `${basePath}/${safeName}`;
      filesToWrite.push({
        relative_path: `${folderPath}/folder.json`,
        content: JSON.stringify(
          {
            id: item.id,
            name: item.name,
            authType: item.authType,
            bearerToken: item.bearerToken,
            description: item.description,
            preRequestScript: item.preRequestScript,
            testScript: item.testScript,
            variables: item.variables,
          },
          null,
          2,
        ),
      });
      writeItemsRecursive(item.items || [], folderPath, filesToWrite);
    } else if (item.type === "request") {
      filesToWrite.push({
        relative_path: `${basePath}/${safeName}.req.json`,
        content: JSON.stringify(item, null, 2),
      });
    }
  }
}

export async function readWorkspaceFromLocalFs(
  path: string,
): Promise<Workspace | null> {
  try {
    const files: LocalFile[] = await invoke("read_local_workspace", { path });
    if (!files || files.length === 0) return null;

    const workspaceSyncartsFile = files.find(
      (f) => f.relative_path === "syncarts.json",
    );

    let workspaceData: any = {};
    if (workspaceSyncartsFile) {
      workspaceData = JSON.parse(workspaceSyncartsFile.content);
    } else {
      if (files.length === 0) return null;
      workspaceData = {
        id: path, // Fallback ID
        name: path.split("/").pop() || "Local Workspace",
        type: "local",
      };
    }

    const workspace: Workspace = {
      ...workspaceData,
      path,
      environments: [],
      collections: [],
    };

    // Load Environments
    const envFiles = files.filter(
      (f) =>
        f.relative_path.startsWith("environments/") &&
        f.relative_path.endsWith(".env.json"),
    );
    workspace.environments = envFiles.map((f) => JSON.parse(f.content));

    // Load Collections
    const colFiles = files.filter(
      (f) =>
        f.relative_path.startsWith("collections/") &&
        f.relative_path.endsWith("collection.json"),
    );

    workspace.collections = colFiles.map((cf) => {
      const colData = JSON.parse(cf.content);
      const colDir = cf.relative_path.replace("/collection.json", "");

      const items = buildItemsRecursive(files, colDir);

      return {
        ...colData,
        items,
      };
    });

    return workspace;
  } catch (err) {
    console.error("Failed to read local workspace:", err);
    return null;
  }
}

function buildItemsRecursive(files: LocalFile[], parentDir: string): any[] {
  const items: any[] = [];

  // Find immediate children (requests or folders)
  // A folder has a folder.json inside its dir: parentDir/folderName_id/folder.json
  // A request is parentDir/reqName_id.req.json

  for (const f of files) {
    if (
      f.relative_path.startsWith(`${parentDir}/`) &&
      f.relative_path !== `${parentDir}/collection.json` &&
      f.relative_path !== `${parentDir}/folder.json`
    ) {
      const rest = f.relative_path.substring(parentDir.length + 1);
      const parts = rest.split("/");

      if (parts.length === 1 && rest.endsWith(".req.json")) {
        // It's a request in this folder
        items.push(JSON.parse(f.content));
      } else if (parts.length === 2 && parts[1] === "folder.json") {
        // It's a subfolder
        const folderDir = `${parentDir}/${parts[0]}`;
        const folderData = JSON.parse(f.content);
        folderData.type = "folder";
        folderData.items = buildItemsRecursive(files, folderDir);
        items.push(folderData);
      }
    }
  }

  return items;
}

function sanitizeFilename(name: string) {
  // eslint-disable-next-line no-control-regex
  return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").trim() || "unnamed";
}
