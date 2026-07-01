import { FiX } from 'react-icons/fi';

export default function Modal({ title, open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop-cfx">
      <div className="modal-panel glass-card">
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" type="button" onClick={onClose} aria-label="Close modal"><FiX /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
