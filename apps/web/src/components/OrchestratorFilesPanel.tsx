import type {
  OrchestratorRepositoryDirectory,
  OrchestratorRepositoryEntry,
  OrchestratorRepositoryFile,
} from "@coding-agent-orchestrator/shared";

interface OrchestratorFilesPanelProps {
  directory?: OrchestratorRepositoryDirectory;
  loading: boolean;
  error?: string;
  selectedPath?: string;
  file?: OrchestratorRepositoryFile;
  fileLoading: boolean;
  fileError?: string;
  onOpenDirectory: (path: string) => void;
  onSelectFile: (entry: OrchestratorRepositoryEntry) => void;
}

export function OrchestratorFilesPanel(props: OrchestratorFilesPanelProps) {
  const entries = props.directory?.entries ?? [];
  const path = props.directory?.path ?? "";
  const breadcrumbs = buildBreadcrumbs(path);

  return (
    <div className="orchestrator-files-panel">
      <div className="orchestrator-working-tree-header">
        <span className="eyebrow">Repository files</span>
        <span className="panel-caption">
          {props.loading ? "Loading…" : `${entries.length} entries`}
        </span>
      </div>
      <nav className="orchestrator-files-breadcrumbs" aria-label="Folder path">
        {breadcrumbs.map((crumb, index) => (
          <button
            key={crumb.path || "root"}
            type="button"
            className="orchestrator-files-breadcrumb"
            onClick={() => props.onOpenDirectory(crumb.path)}
            disabled={crumb.path === path}
          >
            {index === 0 ? "Root" : crumb.label}
          </button>
        ))}
      </nav>
      {props.loading ? (
        <div className="field-note" role="status">
          Loading files…
        </div>
      ) : props.error ? (
        <div className="field-note" role="alert">
          {props.error}
        </div>
      ) : props.directory ? (
        <div className="orchestrator-files-layout">
          <ul className="orchestrator-files-list">
            {props.directory.parentPath !== undefined ? (
              <li className="orchestrator-files-list-item">
                <button
                  type="button"
                  className="orchestrator-files-entry is-directory"
                  onClick={() =>
                    props.onOpenDirectory(props.directory?.parentPath ?? "")
                  }
                >
                  <span className="orchestrator-files-entry-name">..</span>
                  <span className="panel-caption">Up one level</span>
                </button>
              </li>
            ) : null}
            {entries.map((entry) => {
              const selected = props.selectedPath === entry.path;
              const className = `orchestrator-files-entry ${
                entry.kind === "directory" ? "is-directory" : "is-file"
              }${selected ? " is-selected" : ""}`;
              return (
                <li key={entry.path} className="orchestrator-files-list-item">
                  <button
                    type="button"
                    className={className}
                    onClick={() =>
                      entry.kind === "directory"
                        ? props.onOpenDirectory(entry.path)
                        : props.onSelectFile(entry)
                    }
                  >
                    <span className="orchestrator-files-entry-name">
                      {entry.kind === "directory" ? "[Dir] " : "[File] "}
                      {entry.name}
                    </span>
                    <span className="panel-caption">
                      {entry.kind === "directory"
                        ? "Folder"
                        : formatFileSize(entry.size)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="orchestrator-files-viewer">
            {props.fileLoading ? (
              <div className="field-note" role="status">
                Loading file…
              </div>
            ) : props.fileError ? (
              <div className="field-note" role="alert">
                {props.fileError}
              </div>
            ) : props.file ? (
              <>
                <div className="orchestrator-files-viewer-header">
                  <strong>{props.file.path}</strong>
                  <span className="panel-caption">
                    {formatFileSize(props.file.size)}
                  </span>
                </div>
                {props.file.state === "binary" ? (
                  <div className="field-note">
                    {props.file.message ??
                      "Binary file preview is not available."}
                  </div>
                ) : (
                  <>
                    {props.file.message ? (
                      <div className="field-note">{props.file.message}</div>
                    ) : null}
                    <pre className="orchestrator-files-content">
                      <code>{props.file.content}</code>
                    </pre>
                  </>
                )}
              </>
            ) : (
              <div className="field-note">
                Choose a file to preview its contents.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function buildBreadcrumbs(
  path: string
): Array<{ label: string; path: string }> {
  const segments = path.split("/").filter(Boolean);
  const breadcrumbs: Array<{ label: string; path: string }> = [
    {
      label: "Root",
      path: "",
    },
  ];
  let current = "";
  for (const segment of segments) {
    current = current ? `${current}/${segment}` : segment;
    breadcrumbs.push({
      label: segment,
      path: current,
    });
  }
  return breadcrumbs;
}

function formatFileSize(size?: number): string {
  if (typeof size !== "number" || !Number.isFinite(size)) {
    return "Unknown size";
  }
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
