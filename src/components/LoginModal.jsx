import { useState } from 'react';
import Modal, { ModalCloseButton } from './Modal.jsx';
import Icon from './Icons.jsx';
import { verifyAdminPassword } from '../storage.js';

export default function LoginModal({ onClose, onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (verifyAdminPassword(password)) {
      sessionStorage.setItem('hvt_logged', 'true');
      onSuccess();
    } else {
      setError('Sai mật khẩu đăng nhập. Vui lòng thử lại.');
    }
  };

  return (
    <Modal labelledBy="login-title" onClose={onClose} panelClassName="max-w-md p-6 sm:p-8">
      <ModalCloseButton onClick={onClose} />

      <div className="mb-6 text-center">
        <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-primary/5 text-primary ring-1 ring-primary/15">
          <Icon name="lock" size={22} />
        </span>
        <h2 id="login-title" className="font-serif text-xl font-bold text-primary">
          Đăng nhập Quản trị Admin
        </h2>
        <p className="mt-1 text-xs text-stone-500">Khu vực dành riêng cho ban quản trị phòng truyền thống</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="admin-password" className="field-label">
            Mật khẩu Admin
          </label>
          <input
            id="admin-password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'login-error' : undefined}
            className="field-input"
            placeholder="Nhập mật khẩu…"
          />
          {error && (
            <p id="login-error" role="alert" className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-700">
              <Icon name="close" size={14} /> {error}
            </p>
          )}
        </div>

        <button type="submit" className="btn-primary focus-ring w-full">
          <Icon name="check" size={16} /> Xác nhận đăng nhập
        </button>
        <p className="text-center text-[11px] leading-relaxed text-stone-500">
          Bạn là cựu học sinh hoặc phụ huynh muốn đóng góp tư liệu? Hãy liên hệ CLB Tin học của nhà trường.
        </p>
      </form>
    </Modal>
  );
}
