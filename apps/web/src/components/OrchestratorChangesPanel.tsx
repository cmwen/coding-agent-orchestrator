import type {
  OrchestratorWorkingTree,
  OrchestratorWorkingTreeFile,
} from "@coding-agent-orchestrator/shared";

interface OrchestratorChangesPanelProps {
  workingTree?: OrchestratorWorkingTree;
  loading: boolean;
  error?: string;
  selectedPath?: string;
  onSelectFile: (file: OrchestratorWorkingTreeFile) => void;
}

export function OrchestratorChangesPanel(props: OrchestratorChangesPanelProps) {
  const files = props.workingTree?.files ?? [];

  return (
    <div className="orchestrator-changes-panel">
      <div className="orchestrator-working-tree-header">
        <span className="eyebrow">Local changes</span>
        <span className="panel-caption">
          {props.loading
            ? "Loading…"
            : props.workingTree?.state === "dirty"
              ? `${files.length} changed`
              : "Status"}
        </span>
      </div>
      {props.loading ? (
        <div className="field-note" role="status">
          Loading uncommitted changes…
        </div>
      ) : props.error ? (
        <div className="field-note" role="alert">
          {props.error}
        </div>
      ) : props.workingTree?.state === "dirty" ? (
        <div className="orchestrator-working-tree-list">
          {files.map((file) => {
            const selected = props.selectedPath === file.path;
            return (
              <button
                key={`${file.statusCode}:${file.path}`}
                type="button"
                className={`orchestrator-working-tree-file${selected ? " is-selected" : ""}`}
                aria-pressed={selected}
                onClick={() => props.onSelectFile(file)}
              >
                <div className="orchestrator-working-tree-file-primary">
                  <span className="orchestrator-working-tree-file-path">
                    {file.path}
                  </span>
                  {file.previousPath ? (
                    <span className="orchestrator-working-tree-file-previous">
                      {file.previousPath}
                    </span>
                  ) : null}
                </div>
                <div className="orchestrator-working-tree-file-meta">
                  <span className="scope-chip orchestrator-working-tree-file-status">
                    {file.displayStatus}
                  </span>
                  <span className="panel-caption orchestrator-working-tree-file-lines">
                    {formatLineTouchSummary(file)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      ) : props.workingTree ? (
        <div className="field-note" role="status">
          {props.workingTree.message ?? "No uncommitted changes."}
        </div>
      ) : null}
    </div>
  );
}

function formatLineTouchSummary(file: OrchestratorWorkingTreeFile): string {
  if (file.lineStats?.isBinary) {
    return "Binary";
  }
  const added = file.lineStats?.added ?? 0;
  const removed = file.lineStats?.removed ?? 0;
  return `+${added} / -${removed}`;
}
