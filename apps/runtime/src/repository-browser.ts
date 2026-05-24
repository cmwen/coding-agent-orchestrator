import { promises as fs } from "node:fs";
import path from "node:path";
import {
  type OrchestratorRepositoryDirectory,
  type OrchestratorRepositoryFile,
  orchestratorRepositoryDirectorySchema,
  orchestratorRepositoryFileSchema,
} from "@coding-agent-orchestrator/shared";

export const DEFAULT_REPOSITORY_FILE_PREVIEW_BYTES = 128 * 1024;

interface ReadRepositoryFileOptions {
  maxPreviewBytes?: number;
}

export async function listRepositoryDirectory(
  projectPath: string,
  directoryPath?: string
): Promise<OrchestratorRepositoryDirectory> {
  const projectRoot = path.resolve(projectPath);
  const normalizedDirectoryPath = normalizeRepositoryPath(directoryPath, {
    allowEmpty: true,
  });
  const absoluteDirectoryPath = resolveRepositoryAbsolutePath(
    projectRoot,
    normalizedDirectoryPath
  );
  const directoryStats = await fs
    .lstat(absoluteDirectoryPath)
    .catch((error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") {
        throw new Error(
          `Directory does not exist in this project: ${normalizedDirectoryPath || "."}`
        );
      }
      throw error;
    });

  if (!directoryStats.isDirectory()) {
    throw new Error(
      `Path is not a directory: ${normalizedDirectoryPath || "."}`
    );
  }

  const dirEntries = await fs.readdir(absoluteDirectoryPath, {
    withFileTypes: true,
  });

  const entries = await Promise.all(
    dirEntries
      .filter((entry) => entry.name !== "." && entry.name !== "..")
      .map(async (entry) => {
        const absoluteEntryPath = path.join(absoluteDirectoryPath, entry.name);
        const relativeEntryPath = toRepositoryRelativePath(
          projectRoot,
          absoluteEntryPath
        );
        const kind = entry.isDirectory() ? "directory" : "file";
        const size =
          kind === "file" && !entry.isSymbolicLink()
            ? (await fs.lstat(absoluteEntryPath)).size
            : undefined;
        return {
          path: relativeEntryPath,
          name: entry.name,
          kind,
          size,
        };
      })
  );

  entries.sort((left, right) => {
    if (left.kind !== right.kind) {
      return left.kind === "directory" ? -1 : 1;
    }
    return left.name.localeCompare(right.name, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

  const parentPath = normalizedDirectoryPath
    ? path.posix.dirname(normalizedDirectoryPath)
    : undefined;

  return orchestratorRepositoryDirectorySchema.parse({
    projectPath: projectRoot,
    path: normalizedDirectoryPath,
    parentPath:
      parentPath && parentPath !== "."
        ? parentPath
        : normalizedDirectoryPath
          ? ""
          : undefined,
    entries,
  });
}

export async function readRepositoryFile(
  projectPath: string,
  filePath: string,
  options: ReadRepositoryFileOptions = {}
): Promise<OrchestratorRepositoryFile> {
  const projectRoot = path.resolve(projectPath);
  const normalizedFilePath = normalizeRepositoryPath(filePath, {
    allowEmpty: false,
  });
  const absoluteFilePath = resolveRepositoryAbsolutePath(
    projectRoot,
    normalizedFilePath
  );
  const fileStats = await fs
    .lstat(absoluteFilePath)
    .catch((error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") {
        throw new Error(
          `File does not exist in this project: ${normalizedFilePath}`
        );
      }
      throw error;
    });

  if (fileStats.isDirectory()) {
    throw new Error("Choose a file path to preview file content.");
  }

  if (fileStats.isSymbolicLink()) {
    throw new Error("Symbolic links cannot be previewed in this workspace.");
  }

  const maxPreviewBytes = Math.max(
    1,
    options.maxPreviewBytes ?? DEFAULT_REPOSITORY_FILE_PREVIEW_BYTES
  );
  const bytesToRead = Math.min(fileStats.size, maxPreviewBytes + 1);
  const fileHandle = await fs.open(absoluteFilePath, "r");
  const previewBuffer = Buffer.alloc(bytesToRead);
  try {
    const { bytesRead } = await fileHandle.read(
      previewBuffer,
      0,
      bytesToRead,
      0
    );
    const visibleBuffer = previewBuffer.subarray(0, bytesRead);
    const isBinary = visibleBuffer.includes(0);
    if (isBinary) {
      return orchestratorRepositoryFileSchema.parse({
        state: "binary",
        projectPath: projectRoot,
        path: normalizedFilePath,
        size: fileStats.size,
        content: "",
        truncated: false,
        message: "Binary file preview is not available.",
      });
    }

    const truncated = fileStats.size > maxPreviewBytes;
    return orchestratorRepositoryFileSchema.parse({
      state: "ready",
      projectPath: projectRoot,
      path: normalizedFilePath,
      size: fileStats.size,
      content: visibleBuffer.subarray(0, maxPreviewBytes).toString("utf8"),
      truncated,
      message: truncated
        ? `Preview truncated to ${maxPreviewBytes.toLocaleString()} bytes.`
        : undefined,
    });
  } finally {
    await fileHandle.close();
  }
}

function normalizeRepositoryPath(
  repositoryPath: string | undefined,
  options: { allowEmpty: boolean }
): string {
  const normalized = path.posix.normalize(
    (repositoryPath ?? "").trim().replaceAll("\\", "/")
  );
  if (normalized === ".") {
    if (options.allowEmpty) {
      return "";
    }
    throw new Error("Repository paths must stay inside the session project.");
  }
  if (normalized.length === 0 && options.allowEmpty) {
    return "";
  }
  if (
    normalized.length === 0 ||
    normalized === ".." ||
    normalized.startsWith("../") ||
    path.posix.isAbsolute(normalized)
  ) {
    throw new Error("Repository paths must stay inside the session project.");
  }
  return normalized;
}

function resolveRepositoryAbsolutePath(
  projectRoot: string,
  repositoryPath: string
): string {
  const candidatePath = path.resolve(projectRoot, repositoryPath);
  if (!isPathInside(projectRoot, candidatePath)) {
    throw new Error("Repository paths must stay inside the session project.");
  }
  return candidatePath;
}

function toRepositoryRelativePath(
  projectRoot: string,
  absolutePath: string
): string {
  const relativePath = path.relative(projectRoot, absolutePath);
  if (!relativePath || relativePath === ".") {
    throw new Error(
      "Repository entry path must remain inside the project root."
    );
  }
  return relativePath.split(path.sep).join("/");
}

function isPathInside(rootPath: string, candidatePath: string): boolean {
  const relativePath = path.relative(rootPath, candidatePath);
  return (
    relativePath === "" ||
    (!relativePath.startsWith("..") && !path.isAbsolute(relativePath))
  );
}
