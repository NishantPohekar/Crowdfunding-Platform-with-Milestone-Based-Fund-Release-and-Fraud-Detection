import Modal from './Modal.jsx';

export default function ConfirmationDialog({ open, title, message, onCancel, onConfirm }) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p className="text-muted-cfx">{message}</p>
      <div className="modal-actions">
        <button className="btn btn-soft" type="button" onClick={onCancel}>Cancel</button>
        <button className="btn btn-cfx" type="button" onClick={onConfirm}>Confirm</button>
      </div>
    </Modal>
  );
}
