import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { Lock, Delete, X, AlertCircle } from 'lucide-react';

interface PinPadModalProps {
  isOpen: boolean;
  onClose?: () => void;
  requiredRole?: 'admin' | 'manager' | 'any';
  title?: string;
  onSuccess?: () => void;
}

export const PinPadModal: React.FC<PinPadModalProps> = ({
  isOpen,
  onClose,
  requiredRole = 'any',
  title,
  onSuccess,
}) => {
  const { staffUsers, loginWithPin, language } = usePOS();
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMsg(null);

      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg(null);
  };

  const verifyPin = (enteredPin: string) => {
    const matched = staffUsers.find((s) => s.pin === enteredPin);
    if (!matched) {
      setErrorMsg(language === 'th' ? 'รหัส PIN ไม่ถูกต้อง' : 'Invalid PIN code');
      setPin('');
      return;
    }

    if (requiredRole === 'admin' && matched.role !== 'admin') {
      setErrorMsg(language === 'th' ? 'ต้องการสิทธิ์เจ้าของร้าน (Admin)' : 'Admin access required');
      setPin('');
      return;
    }

    if (requiredRole === 'manager' && matched.role !== 'admin' && matched.role !== 'manager') {
      setErrorMsg(language === 'th' ? 'ต้องการสิทธิ์ผู้จัดการ (Manager)' : 'Manager access required');
      setPin('');
      return;
    }

    // Success
    loginWithPin(enteredPin);
    setPin('');
    if (onSuccess) onSuccess();
    if (onClose) onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content-card" style={{ width: 380, padding: 28, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)'
            }}>
              <Lock size={20} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>
              {title || (language === 'th' ? 'ใส่รหัส PIN พนักงาน' : 'Enter Staff PIN')}
            </h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
              }}
            >
              <X size={22} />
            </button>
          )}
        </div>

        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
          {language === 'th'
            ? 'กดรหัส 4 หลักเพื่อเข้าสู่ระบบหรือยืนยันสิทธิ์'
            : 'Enter 4-digit PIN to switch staff or authenticate'}
        </p>

        {/* PIN Indicators */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 24 }}>
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  border: '2px solid ' + (isFilled ? 'var(--color-primary)' : 'var(--color-border)'),
                  background: isFilled ? 'var(--color-primary)' : 'transparent',
                  boxShadow: isFilled ? '0 0 12px var(--color-primary)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              />
            );
          })}
        </div>

        {errorMsg && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              color: '#f87171',
              fontSize: 13,
              marginBottom: 16,
              background: 'rgba(239, 68, 68, 0.1)',
              padding: '8px 12px',
              borderRadius: 8,
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Numeric Keypad */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
            marginBottom: 20,
          }}
        >
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigit(digit)}
              className="touch-btn"
              style={{
                fontSize: 22,
                fontWeight: 700,
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                color: '#fff',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {digit}
            </button>
          ))}

          <button
            onClick={handleClear}
            className="touch-btn"
            style={{
              fontSize: 14,
              fontWeight: 600,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-secondary)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
            }}
          >
            {language === 'th' ? 'ล้าง' : 'Clear'}
          </button>

          <button
            onClick={() => handleDigit('0')}
            className="touch-btn"
            style={{
              fontSize: 22,
              fontWeight: 700,
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              color: '#fff',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
            }}
          >
            0
          </button>

          <button
            onClick={handleBackspace}
            className="touch-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-secondary)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
            }}
          >
            <Delete size={20} />
          </button>
        </div>

        {/* Quick hint for demo */}
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
          {language === 'th'
            ? 'ทดลองเข้าสู่ระบบ: เจ้าของ (1234) | ผจก. (8888) | แคชเชียร์ (0000)'
            : 'Demo PINs: Owner (1234) | Manager (8888) | Cashier (0000)'}
        </div>
      </div>
    </div>
  );
};
