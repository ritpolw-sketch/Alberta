import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  DollarSign,
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  TrendingUp,
  Lock,
  CheckCircle,
  AlertTriangle,
  Clock,
  Banknote,
  QrCode,
  CreditCard,
  X,
} from 'lucide-react';

export const FinancingPanel: React.FC = () => {
  const {
    currentShift,
    cashTransactions,
    addCashTransaction,
    closeShift,
    reopenShift,
    language,
  } = usePOS();

  const [showPayInOut, setShowPayInOut] = useState(false);
  const [txType, setTxType] = useState<'pay_in' | 'pay_out'>('pay_out');
  const [txAmount, setTxAmount] = useState('');
  const [txReason, setTxReason] = useState('');

  const [showCloseShift, setShowCloseShift] = useState(false);
  const [actualCash, setActualCash] = useState('');
  const [closeNotes, setCloseNotes] = useState('');

  const [showOpenShift, setShowOpenShift] = useState(false);
  const [openFloat, setOpenFloat] = useState('2000');

  const isShiftOpen = currentShift.status === 'open';
  const grossSales = currentShift.cashSales + currentShift.promptpaySales + currentShift.cardSales;

  const handleAddTransaction = () => {
    const amount = parseFloat(txAmount);
    if (!amount || amount <= 0 || !txReason.trim()) return;
    addCashTransaction(txType, amount, txReason);
    setShowPayInOut(false);
    setTxAmount('');
    setTxReason('');
  };

  const handleCloseShift = () => {
    const actual = parseFloat(actualCash);
    if (isNaN(actual)) return;
    closeShift(actual, closeNotes || undefined);
    setShowCloseShift(false);
  };

  const handleOpenShift = () => {
    const float = parseFloat(openFloat);
    if (isNaN(float) || float < 0) return;
    reopenShift(float);
    setShowOpenShift(false);
  };

  const formatCurrency = (n: number) => `฿${n.toLocaleString()}`;

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  };

  const kpiCardStyle: React.CSSProperties = {
    padding: '18px 20px',
    borderRadius: 12,
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg-card)',
  };

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
            💰 {language === 'th' ? 'ระบบการเงินและกะ' : 'Financing & Shift'}
          </h3>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
            {isShiftOpen ? '🟢 กะเปิดอยู่' : '🔴 กะปิดแล้ว'} • เปิดเมื่อ {formatTime(currentShift.openedAt)} • โดย {currentShift.openedBy}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isShiftOpen && (
            <>
              <button
                onClick={() => {
                  setTxType('pay_out');
                  setShowPayInOut(true);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '10px 16px', borderRadius: 10,
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                }}
              >
                <ArrowUpCircle size={14} /> จ่ายออก (Pay-Out)
              </button>
              <button
                onClick={() => {
                  setTxType('pay_in');
                  setShowPayInOut(true);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '10px 16px', borderRadius: 10,
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#10b981', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                }}
              >
                <ArrowDownCircle size={14} /> รับเข้า (Pay-In)
              </button>
            </>
          )}
        </div>
      </div>

      {/* Shift KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        {/* Opening Float */}
        <div style={{ ...kpiCardStyle, borderColor: 'rgba(59, 130, 246, 0.3)', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), transparent)' }}>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Wallet size={12} /> เงินทอนตั้งต้น
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#3b82f6', fontFamily: 'var(--font-mono)' }}>
            {formatCurrency(currentShift.openingFloat)}
          </div>
        </div>

        {/* Gross Sales */}
        <div style={{ ...kpiCardStyle, borderColor: 'rgba(245, 158, 11, 0.3)', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), transparent)' }}>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <TrendingUp size={12} /> ยอดขายรวม
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
            {formatCurrency(grossSales)}
          </div>
        </div>

        {/* Expected Cash */}
        <div style={{ ...kpiCardStyle, borderColor: 'rgba(16, 185, 129, 0.3)', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), transparent)' }}>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <DollarSign size={12} /> เงินสดที่ควรมี
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
            {formatCurrency(currentShift.expectedCash)}
          </div>
        </div>

        {/* Discrepancy (if closed) */}
        {!isShiftOpen && currentShift.discrepancy != null && (
          <div style={{
            ...kpiCardStyle,
            borderColor: currentShift.discrepancy === 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
            background: currentShift.discrepancy === 0 ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), transparent)' : 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), transparent)',
          }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              <AlertTriangle size={12} /> เงินขาด/เงินเกิน
            </div>
            <div style={{
              fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-mono)',
              color: currentShift.discrepancy === 0 ? '#10b981' : currentShift.discrepancy > 0 ? '#3b82f6' : '#ef4444',
            }}>
              {currentShift.discrepancy > 0 ? '+' : ''}{formatCurrency(currentShift.discrepancy)}
            </div>
          </div>
        )}
      </div>

      {/* Payment Channel Breakdown */}
      <div style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 12,
        padding: 20,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 14 }}>
          💳 สรุปช่องทางชำระเงิน
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div style={{
            padding: 14, borderRadius: 10,
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#10b981', fontWeight: 600, marginBottom: 6 }}>
              <Banknote size={14} /> เงินสด
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
              {formatCurrency(currentShift.cashSales)}
            </div>
          </div>
          <div style={{
            padding: 14, borderRadius: 10,
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#3b82f6', fontWeight: 600, marginBottom: 6 }}>
              <QrCode size={14} /> PromptPay
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#3b82f6', fontFamily: 'var(--font-mono)' }}>
              {formatCurrency(currentShift.promptpaySales)}
            </div>
          </div>
          <div style={{
            padding: 14, borderRadius: 10,
            background: 'rgba(139, 92, 246, 0.08)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8b5cf6', fontWeight: 600, marginBottom: 6 }}>
              <CreditCard size={14} /> บัตรเครดิต
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#8b5cf6', fontFamily: 'var(--font-mono)' }}>
              {formatCurrency(currentShift.cardSales)}
            </div>
          </div>
        </div>
      </div>

      {/* Pay-In/Pay-Out & Cash Drawer Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Cash Flow Summary */}
        <div style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 12,
          padding: 20,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 14 }}>
            📊 สรุปเงินสดในกะ
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'เงินทอนตั้งต้น', value: currentShift.openingFloat, color: '#3b82f6' },
              { label: 'ขายเงินสด', value: currentShift.cashSales, color: '#10b981', prefix: '+' },
              { label: 'รับเข้า (Pay-In)', value: currentShift.payInsTotal, color: '#10b981', prefix: '+' },
              { label: 'จ่ายออก (Pay-Out)', value: currentShift.payOutsTotal, color: '#ef4444', prefix: '-' },
            ].map((row) => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{row.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: row.color, fontFamily: 'var(--font-mono)' }}>
                  {row.prefix || ''}{formatCurrency(row.value)}
                </span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>เงินสดที่ควรมี</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                {formatCurrency(currentShift.expectedCash)}
              </span>
            </div>
          </div>
        </div>

        {/* Transaction Log */}
        <div style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 12,
          padding: 20,
          maxHeight: 320,
          overflow: 'auto',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 14 }}>
            📋 รายการ Pay-In / Pay-Out
          </div>
          {cashTransactions.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 12 }}>
              ยังไม่มีรายการ
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cashTransactions.map((tx) => (
                <div key={tx.id} style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: tx.type === 'pay_in' ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.06)',
                  border: `1px solid ${tx.type === 'pay_in' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{tx.reason}</div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>
                      <Clock size={9} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                      {formatTime(tx.timestamp)} • {tx.staffName}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)',
                    color: tx.type === 'pay_in' ? '#10b981' : '#ef4444',
                  }}>
                    {tx.type === 'pay_in' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Shift Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        {isShiftOpen ? (
          <button
            onClick={() => setShowCloseShift(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '14px 24px', borderRadius: 12,
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              border: 'none', color: '#fff', fontWeight: 800,
              fontSize: 14, cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(239, 68, 68, 0.3)',
            }}
          >
            <Lock size={16} /> ปิดกะ (Close Shift)
          </button>
        ) : (
          <button
            onClick={() => setShowOpenShift(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '14px 24px', borderRadius: 12,
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none', color: '#fff', fontWeight: 800,
              fontSize: 14, cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
            }}
          >
            <CheckCircle size={16} /> เปิดกะใหม่ (Open Shift)
          </button>
        )}
      </div>

      {/* Pay-In/Pay-Out Modal */}
      {showPayInOut && (
        <div
          onClick={() => setShowPayInOut(false)}
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
              borderRadius: 16, width: 400, padding: 24,
              boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                {txType === 'pay_in' ? <ArrowDownCircle size={18} color="#10b981" /> : <ArrowUpCircle size={18} color="#ef4444" />}
                {txType === 'pay_in' ? 'รับเงินเข้า (Pay-In)' : 'จ่ายเงินออก (Pay-Out)'}
              </h3>
              <button onClick={() => setShowPayInOut(false)} style={{
                width: 32, height: 32, borderRadius: 8, border: '1px solid var(--color-border)',
                background: 'var(--color-bg-elevated)', color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Toggle type */}
              <div style={{ display: 'flex', gap: 6, background: 'var(--color-bg-elevated)', padding: 4, borderRadius: 10, border: '1px solid var(--color-border)' }}>
                <button
                  onClick={() => setTxType('pay_out')}
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontWeight: 700, fontSize: 12,
                    background: txType === 'pay_out' ? '#ef4444' : 'transparent',
                    color: txType === 'pay_out' ? '#fff' : 'var(--color-text-secondary)',
                  }}
                >
                  จ่ายออก
                </button>
                <button
                  onClick={() => setTxType('pay_in')}
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontWeight: 700, fontSize: 12,
                    background: txType === 'pay_in' ? '#10b981' : 'transparent',
                    color: txType === 'pay_in' ? '#fff' : 'var(--color-text-secondary)',
                  }}
                >
                  รับเข้า
                </button>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4, display: 'block' }}>
                  จำนวนเงิน (บาท) *
                </label>
                <input
                  type="number"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  placeholder="0"
                  style={{ ...inputStyle, fontSize: 20, fontWeight: 800, textAlign: 'center', fontFamily: 'var(--font-mono)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4, display: 'block' }}>
                  เหตุผล / หมายเหตุ *
                </label>
                <input
                  type="text"
                  value={txReason}
                  onChange={(e) => setTxReason(e.target.value)}
                  placeholder={txType === 'pay_out' ? 'เช่น ซื้อน้ำแข็ง, ซื้อผักสด' : 'เช่น เติมเงินทอน'}
                  style={inputStyle}
                />
              </div>

              <button
                onClick={handleAddTransaction}
                disabled={!txAmount || !txReason.trim()}
                style={{
                  padding: '14px', borderRadius: 10, border: 'none',
                  background: txType === 'pay_in' ? '#10b981' : '#ef4444',
                  color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer',
                  opacity: (!txAmount || !txReason.trim()) ? 0.5 : 1,
                }}
              >
                {txType === 'pay_in' ? '✅ บันทึกรับเข้า' : '💸 บันทึกจ่ายออก'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Shift Modal */}
      {showCloseShift && (
        <div
          onClick={() => setShowCloseShift(false)}
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
              borderRadius: 16, width: 420, padding: 24,
              boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Lock size={18} color="#ef4444" /> ปิดกะ (Blind Close)
            </h3>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
              นับเงินสดจริงในลิ้นชักแล้วกรอกด้านล่าง
            </p>

            <div style={{
              padding: 14, borderRadius: 10,
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              marginBottom: 16,
            }}>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>เงินสดที่ควรมีในลิ้นชัก</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                {formatCurrency(currentShift.expectedCash)}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4, display: 'block' }}>
                  เงินสดจริงที่นับได้ (บาท) *
                </label>
                <input
                  type="number"
                  value={actualCash}
                  onChange={(e) => setActualCash(e.target.value)}
                  placeholder="0"
                  style={{ ...inputStyle, fontSize: 24, fontWeight: 800, textAlign: 'center', fontFamily: 'var(--font-mono)' }}
                />
              </div>

              {actualCash && (
                <div style={{
                  padding: 12, borderRadius: 10,
                  background: parseFloat(actualCash) === currentShift.expectedCash ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                  border: `1px solid ${parseFloat(actualCash) === currentShift.expectedCash ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>ผลต่าง (เงินขาด/เงินเกิน)</div>
                  <div style={{
                    fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-mono)',
                    color: (parseFloat(actualCash) - currentShift.expectedCash) === 0 ? '#10b981' : '#ef4444',
                  }}>
                    {(parseFloat(actualCash) - currentShift.expectedCash) > 0 ? '+' : ''}
                    {formatCurrency(parseFloat(actualCash) - currentShift.expectedCash)}
                  </div>
                </div>
              )}

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4, display: 'block' }}>
                  หมายเหตุ (ถ้ามี)
                </label>
                <input
                  type="text"
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="เช่น กะเช้าวันธรรมดา"
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setShowCloseShift(false)}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 10,
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  }}
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleCloseShift}
                  disabled={!actualCash}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 10,
                    background: '#ef4444', border: 'none',
                    color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer',
                    opacity: !actualCash ? 0.5 : 1,
                  }}
                >
                  🔒 ยืนยันปิดกะ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Open Shift Modal */}
      {showOpenShift && (
        <div
          onClick={() => setShowOpenShift(false)}
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
              borderRadius: 16, width: 380, padding: 24,
              boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={18} color="#10b981" /> เปิดกะใหม่
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4, display: 'block' }}>
                  เงินทอนตั้งต้น (บาท)
                </label>
                <input
                  type="number"
                  value={openFloat}
                  onChange={(e) => setOpenFloat(e.target.value)}
                  style={{ ...inputStyle, fontSize: 20, fontWeight: 800, textAlign: 'center', fontFamily: 'var(--font-mono)' }}
                />
              </div>
              <button
                onClick={handleOpenShift}
                style={{
                  padding: '14px', borderRadius: 10, border: 'none',
                  background: '#10b981', color: '#fff', fontWeight: 800,
                  fontSize: 14, cursor: 'pointer',
                }}
              >
                ✅ เปิดกะ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
