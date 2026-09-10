import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  UserPlus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Shield,
  X,
  Phone,
  Calendar,
  Key,
  Check,
} from 'lucide-react';
import type { StaffUser, StaffRole } from '../../types/pos';

const roleLabels: Record<StaffRole, { th: string; en: string; color: string }> = {
  owner: { th: 'เจ้าของร้าน', en: 'Owner', color: '#f59e0b' },
  admin: { th: 'แอดมิน', en: 'Admin', color: '#f59e0b' },
  manager: { th: 'ผู้จัดการ', en: 'Manager', color: '#10b981' },
  cashier: { th: 'แคชเชียร์', en: 'Cashier', color: '#3b82f6' },
  kitchen: { th: 'พนักงานครัว', en: 'Kitchen', color: '#ef4444' },
};

const emptyForm = {
  name: '',
  role: 'cashier' as StaffRole,
  pin: '',
  avatarColor: '#3b82f6',
  phone: '',
  startDate: '',
};

export const EmployeePanel: React.FC = () => {
  const {
    staffUsers,
    addStaffUser,
    updateStaffUser,
    deleteStaffUser,
    currentStaff,
    language,
  } = usePOS();

  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showPin, setShowPin] = useState<Record<string, boolean>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  const handleAdd = () => {
    setEditingStaff(null);
    setForm(emptyForm);
    setFormError('');
    setShowModal(true);
  };

  const handleEdit = (staff: StaffUser) => {
    setEditingStaff(staff);
    setForm({
      name: staff.name,
      role: staff.role,
      pin: staff.pin,
      avatarColor: staff.avatarColor,
      phone: staff.phone || '',
      startDate: staff.startDate || '',
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      setFormError('กรุณาระบุชื่อพนักงาน');
      return;
    }
    if (!form.pin || form.pin.length !== 4) {
      setFormError('PIN ต้องมี 4 หลัก');
      return;
    }
    // Check PIN uniqueness
    const pinConflict = staffUsers.find((s) => s.pin === form.pin && s.id !== editingStaff?.id);
    if (pinConflict) {
      setFormError(`PIN "${form.pin}" ถูกใช้แล้วโดย ${pinConflict.name}`);
      return;
    }

    if (editingStaff) {
      updateStaffUser({
        ...editingStaff,
        ...form,
      });
    } else {
      addStaffUser(form);
    }
    setShowModal(false);
  };

  const handleDelete = (staffId: string) => {
    deleteStaffUser(staffId);
    setShowDeleteConfirm(null);
  };

  const togglePinVisibility = (staffId: string) => {
    setShowPin((prev) => ({ ...prev, [staffId]: !prev[staffId] }));
  };

  const colorOptions = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    background: 'var(--color-bg-elevated)',
    border: '1px solid var(--color-border)',
    borderRadius: 8,
    color: '#fff',
    fontSize: 13,
    outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>
            👥 {language === 'th' ? 'จัดการพนักงาน' : 'Employee Management'}
          </h3>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
            {staffUsers.length} {language === 'th' ? 'คน' : 'staff members'}
          </p>
        </div>
        <button
          onClick={handleAdd}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 18px', borderRadius: 10,
            background: 'var(--color-primary)', border: 'none',
            color: '#000', fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}
        >
          <UserPlus size={15} /> เพิ่มพนักงาน
        </button>
      </div>

      {/* Staff Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 14,
      }}>
        {staffUsers.map((staff) => {
          const rl = roleLabels[staff.role];
          const isCurrentUser = currentStaff?.id === staff.id;

          return (
            <div
              key={staff.id}
              style={{
                background: 'var(--color-bg-card)',
                border: isCurrentUser ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--color-border)',
                borderRadius: 12,
                padding: 18,
                position: 'relative',
                transition: 'all 0.2s',
              }}
            >
              {isCurrentUser && (
                <div style={{
                  position: 'absolute', top: 10, right: 10,
                  fontSize: 10, fontWeight: 700, color: 'var(--color-primary)',
                  background: 'rgba(245, 158, 11, 0.12)',
                  padding: '2px 8px', borderRadius: 6,
                }}>
                  คุณ
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                {/* Avatar */}
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: staff.avatarColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, fontWeight: 800, color: '#fff',
                  boxShadow: `0 4px 12px ${staff.avatarColor}30`,
                }}>
                  {staff.name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{staff.name}</div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    marginTop: 4, padding: '2px 8px', borderRadius: 6,
                    fontSize: 11, fontWeight: 700,
                    background: `${rl.color}15`,
                    color: rl.color,
                  }}>
                    <Shield size={10} /> {rl.th}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                {/* PIN */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Key size={11} /> PIN
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      fontSize: 14, fontWeight: 700, color: '#fff',
                      fontFamily: 'var(--font-mono)', letterSpacing: 4,
                    }}>
                      {showPin[staff.id] ? staff.pin : '••••'}
                    </span>
                    <button
                      onClick={() => togglePinVisibility(staff.id)}
                      style={{
                        width: 24, height: 24, borderRadius: 6, border: 'none',
                        background: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {showPin[staff.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                  </div>
                </div>

                {/* Phone */}
                {staff.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Phone size={11} /> โทรศัพท์
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{staff.phone}</span>
                  </div>
                )}

                {/* Start Date */}
                {staff.startDate && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={11} /> เริ่มงาน
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{staff.startDate}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => handleEdit(staff)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    padding: '8px', borderRadius: 8, border: '1px solid var(--color-border)',
                    background: 'var(--color-bg-elevated)', color: 'var(--color-text-secondary)',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  <Edit2 size={12} /> แก้ไข
                </button>
                {!isCurrentUser && (
                  <button
                    onClick={() => setShowDeleteConfirm(staff.id)}
                    style={{
                      width: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: 8, border: '1px solid rgba(239, 68, 68, 0.3)',
                      background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
              borderRadius: 16, width: 440, padding: 24,
              boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>
                {editingStaff ? '✏️ แก้ไขพนักงาน' : '➕ เพิ่มพนักงานใหม่'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{
                width: 32, height: 32, borderRadius: 8, border: '1px solid var(--color-border)',
                background: 'var(--color-bg-elevated)', color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Avatar Color */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6, display: 'block' }}>
                  สีประจำตัว
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {colorOptions.map((c) => (
                    <button
                      key={c}
                      onClick={() => setForm({ ...form, avatarColor: c })}
                      style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: c, border: form.avatarColor === c ? '3px solid #fff' : '2px solid transparent',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: form.avatarColor === c ? `0 0 12px ${c}50` : 'none',
                      }}
                    >
                      {form.avatarColor === c && <Check size={14} color="#fff" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4, display: 'block' }}>
                  ชื่อพนักงาน *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => { setForm({ ...form, name: e.target.value }); setFormError(''); }}
                  placeholder="เช่น น้องมิ้นท์ (แคชเชียร์)"
                  style={inputStyle}
                />
              </div>

              {/* Role */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4, display: 'block' }}>
                  ตำแหน่ง
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as StaffRole })}
                  style={inputStyle}
                >
                  <option value="owner">👑 เจ้าของร้าน (Owner)</option>
                  <option value="manager">🏪 ผู้จัดการ (Manager)</option>
                  <option value="cashier">💵 แคชเชียร์ (Cashier)</option>
                  <option value="kitchen">🍳 พนักงานครัว (Kitchen)</option>
                </select>
              </div>

              {/* PIN */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4, display: 'block' }}>
                  รหัส PIN (4 หลัก) *
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={form.pin}
                  onChange={(e) => { setForm({ ...form, pin: e.target.value.replace(/\D/g, '') }); setFormError(''); }}
                  placeholder="0000"
                  style={{ ...inputStyle, fontSize: 22, fontWeight: 800, letterSpacing: 10, textAlign: 'center', fontFamily: 'var(--font-mono)' }}
                />
              </div>

              {/* Phone */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4, display: 'block' }}>
                  เบอร์โทรศัพท์
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="081-234-5678"
                  style={inputStyle}
                />
              </div>

              {/* Start Date */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4, display: 'block' }}>
                  วันที่เริ่มงาน
                </label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  style={inputStyle}
                />
              </div>

              {formError && (
                <div style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>⚠️ {formError}</div>
              )}

              <button
                onClick={handleSave}
                style={{
                  padding: '14px', borderRadius: 10, border: 'none',
                  background: 'var(--color-primary)', color: '#000',
                  fontWeight: 800, fontSize: 14, cursor: 'pointer',
                  marginTop: 4,
                }}
              >
                {editingStaff ? '💾 บันทึกการแก้ไข' : '✅ เพิ่มพนักงาน'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          onClick={() => setShowDeleteConfirm(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1100,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--color-bg-card)', border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 16, width: 360, padding: 24,
              boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
              textAlign: 'center',
            }}
          >
            <Trash2 size={32} color="#ef4444" style={{ marginBottom: 12 }} />
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: '0 0 6px 0' }}>
              ลบพนักงาน?
            </h3>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
              ลบ "{staffUsers.find((s) => s.id === showDeleteConfirm)?.name}" ออกจากระบบ
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                style={{
                  flex: 1, padding: '12px', borderRadius: 10,
                  background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
                  color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                }}
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                style={{
                  flex: 1, padding: '12px', borderRadius: 10,
                  background: '#ef4444', border: 'none',
                  color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                }}
              >
                🗑️ ยืนยันลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
