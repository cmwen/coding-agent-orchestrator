import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  listRepositoryDirectory,
  readRepositoryFile,
} from "./repository-browser.js";

let tempDirectory: string | undefined;

afterEach(async () => {
  if (tempDirectory) {
    await rm(tempDirectory, { recursive: true, force: true });
    tempDirectory = undefined;
  }
});

describe("repository-browser", () => {
  it("lists directories before files and includes relative paths", async () => {
    tempDirectory = await mkdtemp(
      path.join(os.tmpdir(), "orchestrator-repository-browser-")
    );
    await mkdir(path.join(tempDirectory, "src"), { recursive: true });
    await mkdir(path.join(tempDirectory, "docs"), { recursive: true });
    await writeFile(path.join(tempDirectory, "README.md"), "# README\n");

    const listing = await listRepositoryDirectory(tempDirectory);

    expect(listing.path).toBe("");
    expect(listing.parentPath).toBeUndefined();
    expect(listing.entries.map((entry) => entry.path)).toEqual([
      "docs",
      "src",
      "README.md",
    ]);
  });

  it("returns text previews with truncation metadata", async () => {
    tempDirectory = await mkdtemp(
      path.join(os.tmpdir(), "orchestrator-repository-browser-")
    );
    await writeFile(path.join(tempDirectory, "notes.md"), "0123456789abcdef");

    const file = await readRepositoryFile(tempDirectory, "notes.md", {
      maxPreviewBytes: 10,
    });

    expect(file.state).toBe("ready");
    expect(file.truncated).toBe(true);
    expect(file.content).toBe("0123456789");
    expect(file.message).toMatch(/truncated/i);
  });

  it("marks binary files as non-previewable", async () => {
    tempDirectory = await mkdtemp(
      path.join(os.tmpdir(), "orchestrator-repository-browser-")
    );
    await writeFile(
      path.join(tempDirectory, "payload.bin"),
      Buffer.from([0, 1, 2])
    );

    const file = await readRepositoryFile(tempDirectory, "payload.bin");

    expect(file.state).toBe("binary");
    expect(file.content).toBe("");
  });
});
