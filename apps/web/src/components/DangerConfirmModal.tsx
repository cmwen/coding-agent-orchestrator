import { Modal } from "./Modal";

interface DangerConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  warning: string;
  confirmLabel: string;
  busyLabel?: string;
  details?: string[];
  busy?: boolean;
  cancelLabel?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function DangerConfirmModal(props: DangerConfirmModalProps) {
  return (
    <Modal
      open={props.open}
      title={props.title}
      description={props.description}
      closeOnScrimClick={false}
      onClose={props.busy ? () => undefined : props.onClose}
    >
      {props.details?.length ? (
        <ul className="danger-modal-details">
          {props.details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      ) : null}
      <p className="danger-modal-warning">{props.warning}</p>
      <div className="modal-footer">
        <button
          type="button"
          className="ghost-button"
          onClick={props.onClose}
          disabled={props.busy}
          data-autofocus="true"
        >
          {props.cancelLabel ?? "Cancel"}
        </button>
        <button
          type="button"
          className="ghost-button danger-button"
          onClick={props.onConfirm}
          disabled={props.busy}
        >
          {props.busy
            ? (props.busyLabel ?? props.confirmLabel)
            : props.confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
