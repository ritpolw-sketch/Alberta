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
  ChevronDown,
  ChevronRight,
  CalendarDays,
  Timer,
  ReceiptText,
  CircleDot,
  RefreshCw,
} from 'lucide-react';
import type { Shift } from '../../types/pos';

export const ShiftManagePage: React.FC = () => {
  const {
    currentShift,
    shiftHistory,
    cashTransactions,
    addCashTransaction,
    closeShift,
    reopenShift,
    language,
  } = usePOS();

  // Pay-In/Pay-Out modal
  const [showPayInOut, setShowPayInOut] = useState(false);
  const [txType, setTxType] = useState<'pay_in' | 'pay_out'>('pay_out');
  const [txAmount, setTxAmount] = useState('');
  const [txReason, setTxReason] = useState('');

  // Close shift modal
  const [showCloseShift, setShowCloseShift] = useState(false);
  const [actualCash, setActualCash] = useState('');
  const [closeNotes, setCloseNotes] = useState('');

  // Open shift modal
  const [showOpenShift, setShowOpenShift] = useState(false);
  const [openFloat, setOpenFloat] = useState('2000');

  // Expanded history row
  const [expandedShiftId, setExpandedShiftId] = useState<string | null>(null);

  const isShiftOpen = currentShift.status === 'open';
  const grossSales = currentShift.cashSales + currentShift.promptpaySales + currentShift.cardSales;

  // Current shift transactions
  const currentShiftTx = cashTransactions.filter((tx) => tx.shiftId === currentShift.id);

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
    setActualCash('');
    setCloseNotes('');
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

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('th-TH', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const [nowTimestamp] = useState(() => Date.now());

  const getShiftDuration = (shift: Shift, currentTimestamp: number = nowTimestamp) => {
    const start = new Date(shift.openedAt).getTime();
    const end = shift.closedAt ? new Date(shift.closedAt).getTime() : currentTimestamp;
    const diffMin = Math.floor((end - start) / 60000);
    const h = Math.floor(diffMin / 60);
    const m = diffMin % 60;
    if (h > 0) return `${h} ชม. ${m} นาที`;
    return `${m} นาที`;
  };

  const getShiftGross = (shift: Shift) =>
    shift.cashSales + shift.promptpaySales + shift.cardSales;

  // Percentage for visual breakdown bar
  const cashPct = grossSales > 0 ? (currentShift.cashSales / grossSales) * 100 : 0;
  const promptpayPct = grossSales > 0 ? (currentShift.promptpaySales / grossSales) * 100 : 0;
  const cardPct = grossSales > 0 ? (currentShift.cardSales / grossSales) * 100 : 0;

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

  const cardStyle: React.CSSProperties = {
    background: 'var(--color-bg-card)',
    border: '1px solid var(--color-border)',
    borderRadius: 14,
    padding: 20,
  };

  const kpiStyle: React.CSSProperties = {
    padding: '16px 18px',
    borderRadius: 12,
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg-card)',
    minWidth: 0,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ═══════ Page Header ═══════ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.1))',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CalendarDays size={18} color="#f59e0b" />
            </div>
            {language === 'th' ? 'จัดการกะ & เงินสดประจำวัน' : 'Manage Shifts & Daily Cash'}
          </h3>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4, marginLeft: 46 }}>
            {formatDate(currentShift.openedAt)} • {isShiftOpen ? '🟢 กะเปิดอยู่' : '🔴 กะปิดแล้ว'} •
            เปิดเมื่อ {formatTime(currentShift.openedAt)} โดย {currentShift.openedBy}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {isShiftOpen && (
            <>
              <button
                onClick={() => { setTxType('pay_out'); setShowPayInOut(true); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 16px', borderRadius: 10,
                  background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#f87171', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <ArrowUpCircle size={14} /> จ่ายออก
              </button>
              <button
                onClick={() => { setTxType('pay_in'); setShowPayInOut(true); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 16px', borderRadius: 10,
                  background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)',
                  color: '#34d399', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <ArrowDownCircle size={14} /> รับเข้า
              </button>
              <button
                onClick={() => setShowCloseShift(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 16px', borderRadius: 10,
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  border: 'none', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                  boxShadow: '0 3px 12px rgba(239, 68, 68, 0.25)',
                  transition: 'all 0.15s',
                }}
              >
                <Lock size={14} /> ปิดกะ
              </button>
            </>
          )}
          {!isShiftOpen && (
            <button
              onClick={() => setShowOpenShift(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', borderRadius: 10,
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                boxShadow: '0 3px 12px rgba(16, 185, 129, 0.25)',
              }}
            >
              <RefreshCw size={14} /> เปิดกะใหม่
            </button>
          )}
        </div>
      </div>

      {/* ═══════ Active Shift KPIs ═══════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 12 }}>
        {/* Shift Duration */}
        <div style={kpiStyle}>
          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Timer size={11} /> ระยะเวลากะ
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
            {getShiftDuration(currentShift)}
          </div>
        </div>

        {/* Opening Float */}
        <div style={kpiStyle}>
          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Wallet size={11} /> เงินทอนตั้งต้น
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#3b82f6', fontFamily: 'var(--font-mono)' }}>
            {formatCurrency(currentShift.openingFloat)}
          </div>
        </div>

        {/* Gross Sales */}
        <div style={kpiStyle}>
          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <TrendingUp size={11} /> ยอดขายรวม
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
            {formatCurrency(grossSales)}
          </div>
        </div>

        {/* Pay-In */}
        <div style={kpiStyle}>
          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <ArrowDownCircle size={11} /> รับเข้า (Pay-In)
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
            +{formatCurrency(currentShift.payInsTotal)}
          </div>
        </div>

        {/* Pay-Out */}
        <div style={kpiStyle}>
          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <ArrowUpCircle size={11} /> จ่ายออก (Pay-Out)
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#ef4444', fontFamily: 'var(--font-mono)' }}>
            -{formatCurrency(currentShift.payOutsTotal)}
          </div>
        </div>

        {/* Expected Cash */}
        <div style={{
          ...kpiStyle,
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.06), rgba(217, 119, 6, 0.02))',
          border: '1px solid rgba(245, 158, 11, 0.2)',
        }}>
          <div style={{ fontSize: 10, color: 'var(--color-primary)', fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <DollarSign size={11} /> เงินสดที่ควรมี
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>
            {formatCurrency(currentShift.expectedCash)}
          </div>
        </div>

        {/* Discrepancy (closed only) */}
        {!isShiftOpen && currentShift.discrepancy != null && (
          <div style={{
            ...kpiStyle,
            background: currentShift.discrepancy === 0
              ? 'rgba(16, 185, 129, 0.06)'
              : 'rgba(239, 68, 68, 0.06)',
            border: `1px solid ${currentShift.discrepancy === 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
          }}>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              <AlertTriangle size={11} /> เงินขาด/เกิน
            </div>
            <div style={{
              fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-mono)',
              color: currentShift.discrepancy === 0 ? '#10b981' : currentShift.discrepancy > 0 ? '#60a5fa' : '#ef4444',
            }}>
              {currentShift.discrepancy > 0 ? '+' : ''}{formatCurrency(currentShift.discrepancy)}
            </div>
          </div>
        )}
      </div>

      {/* ═══════ Middle Row: Cash Flow + Channel Breakdown ═══════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Daily Cash Flow Calculation */}
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ReceiptText size={16} color="var(--color-primary)" />
            สรุปเงินสดในกะ
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'เงินทอนตั้งต้น', value: currentShift.openingFloat, color: '#3b82f6', icon: <Wallet size={12} /> },
              { label: '+ ขายเงินสด', value: currentShift.cashSales, color: '#10b981', prefix: '+', icon: <Banknote size={12} /> },
              { label: '+ รับเข้า (Pay-In)', value: currentShift.payInsTotal, color: '#10b981', prefix: '+', icon: <ArrowDownCircle size={12} /> },
              { label: '− จ่ายออก (Pay-Out)', value: currentShift.payOutsTotal, color: '#ef4444', prefix: '-', icon: <ArrowUpCircle size={12} /> },
            ].map((row) => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {row.icon} {row.label}
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: row.color, fontFamily: 'var(--font-mono)' }}>
                  {row.prefix || ''}{formatCurrency(row.value)}
                </span>
              </div>
            ))}
            <div style={{
              borderTop: '2px solid var(--color-border)', paddingTop: 12, marginTop: 4,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                <DollarSign size={14} color="var(--color-primary)" /> เงินสดที่ควรมี
              </span>
              <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                {formatCurrency(currentShift.expectedCash)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Channel Breakdown */}
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            💳 ช่องทางชำระเงิน
          </div>

          {/* Visual breakdown bar */}
          {grossSales > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden',
                background: 'var(--color-bg-elevated)',
              }}>
                {cashPct > 0 && (
                  <div style={{ width: `${cashPct}%`, background: '#10b981', transition: 'width 0.3s' }} />
                )}
                {promptpayPct > 0 && (
                  <div style={{ width: `${promptpayPct}%`, background: '#3b82f6', transition: 'width 0.3s' }} />
                )}
                {cardPct > 0 && (
                  <div style={{ width: `${cardPct}%`, background: '#8b5cf6', transition: 'width 0.3s' }} />
                )}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 10, color: 'var(--color-text-muted)' }}>
                {cashPct > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                  เงินสด {cashPct.toFixed(0)}%
                </span>}
                {promptpayPct > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6' }} />
                  PromptPay {promptpayPct.toFixed(0)}%
                </span>}
                {cardPct > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8b5cf6' }} />
                  บัตร {cardPct.toFixed(0)}%
                </span>}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'เงินสด', value: currentShift.cashSales, icon: <Banknote size={14} />, color: '#10b981' },
              { label: 'PromptPay QR', value: currentShift.promptpaySales, icon: <QrCode size={14} />, color: '#3b82f6' },
              { label: 'บัตรเครดิต/เดบิต', value: currentShift.cardSales, icon: <CreditCard size={14} />, color: '#8b5cf6' },
            ].map((ch) => (
              <div key={ch.label} style={{
                padding: '12px 14px', borderRadius: 10,
                background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                  {ch.icon} {ch.label}
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: ch.color, fontFamily: 'var(--font-mono)' }}>
                  {formatCurrency(ch.value)}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            borderTop: '2px solid var(--color-border)', paddingTop: 12, marginTop: 12,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>ยอดรวมทุกช่องทาง</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
              {formatCurrency(grossSales)}
            </span>
          </div>
        </div>
      </div>

      {/* ═══════ Transaction Timeline ═══════ */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
            📋 รายการ Pay-In / Pay-Out (กะปัจจุบัน)
          </div>
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>
            {currentShiftTx.length} รายการ
          </span>
        </div>

        {currentShiftTx.length === 0 ? (
          <div style={{
            padding: '32px 20px', textAlign: 'center',
            color: 'var(--color-text-muted)', fontSize: 13,
            background: 'var(--color-bg-elevated)', borderRadius: 10,
            border: '1px dashed var(--color-border)',
          }}>
            <CircleDot size={24} style={{ marginBottom: 8, opacity: 0.4 }} />
            <div>ยังไม่มีรายการ Pay-In / Pay-Out ในกะนี้</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
            {currentShiftTx.map((tx, index) => (
              <div key={tx.id} style={{
                padding: '12px 14px', borderRadius: 10,
                background: tx.type === 'pay_in'
                  ? 'rgba(16, 185, 129, 0.05)'
                  : 'rgba(239, 68, 68, 0.05)',
                border: `1px solid ${tx.type === 'pay_in'
                  ? 'rgba(16, 185, 129, 0.12)'
                  : 'rgba(239, 68, 68, 0.12)'}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                animation: `fadeIn 0.2s ease-out ${index * 0.03}s both`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: tx.type === 'pay_in' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {tx.type === 'pay_in'
                      ? <ArrowDownCircle size={16} color="#10b981" />
                      : <ArrowUpCircle size={16} color="#ef4444" />
                    }
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{tx.reason}</div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={9} />
                      {formatTime(tx.timestamp)} • {tx.staffName}
                    </div>
                  </div>
                </div>
                <div style={{
                  fontSize: 15, fontWeight: 800, fontFamily: 'var(--font-mono)',
                  color: tx.type === 'pay_in' ? '#10b981' : '#ef4444',
                }}>
                  {tx.type === 'pay_in' ? '+' : '-'}{formatCurrency(tx.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══════ Shift History ═══════ */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarDays size={16} color="var(--color-primary)" />
            ประวัติกะทั้งหมด
          </div>
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>
            {shiftHistory.length} กะ
          </span>
        </div>

        {shiftHistory.length === 0 ? (
          <div style={{
            padding: '32px 20px', textAlign: 'center',
            color: 'var(--color-text-muted)', fontSize: 13,
            background: 'var(--color-bg-elevated)', borderRadius: 10,
            border: '1px dashed var(--color-border)',
          }}>
            <CalendarDays size={24} style={{ marginBottom: 8, opacity: 0.4 }} />
            <div>ยังไม่มีประวัติกะ — ปิดกะเพื่อบันทึกข้อมูล</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '28px 1.5fr 1fr 1fr 1fr 1fr 1fr 1fr',
              gap: 8, padding: '8px 12px',
              fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              borderBottom: '1px solid var(--color-border)',
            }}>
              <div></div>
              <div>วันที่ / เวลา</div>
              <div>เปิดโดย</div>
              <div>ระยะเวลา</div>
              <div style={{ textAlign: 'right' }}>ยอดขายรวม</div>
              <div style={{ textAlign: 'right' }}>เงินสดคาดหวัง</div>
              <div style={{ textAlign: 'right' }}>เงินสดจริง</div>
              <div style={{ textAlign: 'right' }}>ผลต่าง</div>
            </div>

            {/* Shift rows */}
            {shiftHistory.map((shift) => {
              const isExpanded = expandedShiftId === shift.id;
              const shiftGross = getShiftGross(shift);
              const shiftTxs = cashTransactions.filter((tx) => tx.shiftId === shift.id);

              return (
                <div key={shift.id}>
                  <button
                    onClick={() => setExpandedShiftId(isExpanded ? null : shift.id)}
                    style={{
                      display: 'grid', width: '100%',
                      gridTemplateColumns: '28px 1.5fr 1fr 1fr 1fr 1fr 1fr 1fr',
                      gap: 8, padding: '10px 12px',
                      fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)',
                      background: isExpanded ? 'rgba(245, 158, 11, 0.04)' : 'transparent',
                      border: 'none', borderRadius: 8,
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.15s',
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {isExpanded
                        ? <ChevronDown size={14} color="var(--color-primary)" />
                        : <ChevronRight size={14} />
                      }
                    </div>
                    <div style={{ fontWeight: 600, color: '#fff' }}>
                      {formatDateTime(shift.openedAt)}
                    </div>
                    <div>{shift.openedBy?.split('(')[0]?.trim()}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Timer size={11} /> {getShiftDuration(shift)}
                    </div>
                    <div style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                      {formatCurrency(shiftGross)}
                    </div>
                    <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {formatCurrency(shift.expectedCash)}
                    </div>
                    <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {shift.actualCash != null ? formatCurrency(shift.actualCash) : '—'}
                    </div>
                    <div style={{
                      textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 800,
                      color: shift.discrepancy == null ? 'var(--color-text-muted)'
                        : shift.discrepancy === 0 ? '#10b981'
                        : shift.discrepancy > 0 ? '#60a5fa' : '#ef4444',
                    }}>
                      {shift.discrepancy != null
                        ? `${shift.discrepancy > 0 ? '+' : ''}${formatCurrency(shift.discrepancy)}`
                        : '—'
                      }
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div style={{
                      padding: '14px 16px 14px 44px',
                      background: 'rgba(245, 158, 11, 0.02)',
                      borderRadius: '0 0 10px 10px',
                      marginBottom: 4,
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 }}>
                        {[
                          { label: 'เงินทอนตั้งต้น', value: formatCurrency(shift.openingFloat), color: '#3b82f6' },
                          { label: 'ขายเงินสด', value: formatCurrency(shift.cashSales), color: '#10b981' },
                          { label: 'PromptPay', value: formatCurrency(shift.promptpaySales), color: '#3b82f6' },
                          { label: 'บัตร', value: formatCurrency(shift.cardSales), color: '#8b5cf6' },
                        ].map((item) => (
                          <div key={item.label} style={{
                            padding: '10px 12px', borderRadius: 8,
                            background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
                          }}>
                            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 2 }}>{item.label}</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: item.color, fontFamily: 'var(--font-mono)' }}>
                              {item.value}
                            </div>
                          </div>
                        ))}
                      </div>

                      {shift.notes && (
                        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 10 }}>
                          📝 หมายเหตุ: {shift.notes}
                        </div>
                      )}

                      {shift.closedBy && (
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 10 }}>
                          ปิดกะโดย: {shift.closedBy} • เมื่อ {shift.closedAt ? formatDateTime(shift.closedAt) : '—'}
                        </div>
                      )}

                      {/* Shift transactions */}
                      {shiftTxs.length > 0 && (
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                            รายการ Pay-In/Pay-Out ({shiftTxs.length})
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {shiftTxs.map((tx) => (
                              <div key={tx.id} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '6px 10px', borderRadius: 6,
                                background: tx.type === 'pay_in' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                                border: `1px solid ${tx.type === 'pay_in' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}`,
                                fontSize: 11,
                              }}>
                                <span style={{ color: 'var(--color-text-secondary)' }}>
                                  {tx.type === 'pay_in' ? '⬇️' : '⬆️'} {tx.reason} • {formatTime(tx.timestamp)}
                                </span>
                                <span style={{
                                  fontWeight: 700, fontFamily: 'var(--font-mono)',
                                  color: tx.type === 'pay_in' ? '#10b981' : '#ef4444',
                                }}>
                                  {tx.type === 'pay_in' ? '+' : '-'}{formatCurrency(tx.amount)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══════ MODALS ═══════ */}

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
              borderRadius: 16, width: 420, padding: 24,
              boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
              animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                {txType === 'pay_in'
                  ? <ArrowDownCircle size={18} color="#10b981" />
                  : <ArrowUpCircle size={18} color="#ef4444" />
                }
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
              {/* Toggle */}
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
                  style={{ ...inputStyle, fontSize: 22, fontWeight: 800, textAlign: 'center', fontFamily: 'var(--font-mono)' }}
                  autoFocus
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

              {/* Quick reason chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(txType === 'pay_out'
                  ? ['ซื้อน้ำแข็ง', 'ซื้อผักสด', 'ค่าแก๊ส', 'ของใช้ร้าน', 'ค่าส่ง']
                  : ['เติมเงินทอน', 'รับเงินสดเพิ่ม']
                ).map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setTxReason(reason)}
                    style={{
                      padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                      background: txReason === reason ? (txType === 'pay_out' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)') : 'var(--color-bg-elevated)',
                      border: `1px solid ${txReason === reason ? (txType === 'pay_out' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)') : 'var(--color-border)'}`,
                      color: txReason === reason ? '#fff' : 'var(--color-text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    {reason}
                  </button>
                ))}
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
              borderRadius: 16, width: 440, padding: 24,
              boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
              animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Lock size={18} color="#ef4444" /> ปิดกะ (Blind Close)
            </h3>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
              นับเงินสดจริงในลิ้นชักแล้วกรอกด้านล่าง — ระบบจะคำนวณผลต่างให้อัตโนมัติ
            </p>

            {/* Summary before closing */}
            <div style={{
              padding: 14, borderRadius: 10,
              background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
              marginBottom: 16,
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
            }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>ยอดขายรวม</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                  {formatCurrency(grossSales)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>เงินสดที่ควรมี</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                  {formatCurrency(currentShift.expectedCash)}
                </div>
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
                  autoFocus
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
                    fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-mono)',
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
                    background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
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
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    border: 'none', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer',
                    opacity: !actualCash ? 0.5 : 1,
                    boxShadow: '0 4px 16px rgba(239, 68, 68, 0.3)',
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
              borderRadius: 16, width: 400, padding: 24,
              boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
              animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
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
                  style={{ ...inputStyle, fontSize: 22, fontWeight: 800, textAlign: 'center', fontFamily: 'var(--font-mono)' }}
                  autoFocus
                />
              </div>

              {/* Quick float buttons */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[1000, 1500, 2000, 3000, 5000].map((val) => (
                  <button
                    key={val}
                    onClick={() => setOpenFloat(String(val))}
                    style={{
                      flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                      background: openFloat === String(val) ? 'rgba(16, 185, 129, 0.15)' : 'var(--color-bg-elevated)',
                      border: `1px solid ${openFloat === String(val) ? 'rgba(16, 185, 129, 0.3)' : 'var(--color-border)'}`,
                      color: openFloat === String(val) ? '#10b981' : 'var(--color-text-secondary)',
                      cursor: 'pointer', fontFamily: 'var(--font-mono)',
                    }}
                  >
                    ฿{val.toLocaleString()}
                  </button>
                ))}
              </div>

              <button
                onClick={handleOpenShift}
                style={{
                  padding: '14px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
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
