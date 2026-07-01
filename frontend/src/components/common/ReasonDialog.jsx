import { useEffect, useState } from 'react';
import Modal from './Modal.jsx';

export default function ReasonDialog({ open, title, message, reasonLabel = 'Reason', onCancel, onConfirm }) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p className="text-muted-cfx">{message}</p>
      <textarea
        className="reason-textarea"
        required
        placeholder={reasonLabel}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />
      <div className="modal-actions">
        <button className="btn btn-soft" type="button" onClick={onCancel}>Cancel</button>
        <button className="btn btn-cfx" type="button" disabled={!reason.trim()} onClick={() => onConfirm(reason.trim())}>Confirm</button>
      </div>
    </Modal>
  );
}
