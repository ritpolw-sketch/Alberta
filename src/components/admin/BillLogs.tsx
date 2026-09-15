import React, { useState, useMemo } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  Search,
  Filter,
  Eye,
  XCircle,
  CreditCard,
  Banknote,
  QrCode,
  X,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Clock,
  Printer,
  Calendar,
} from 'lucide-react';
import type { Order, PaymentMethod } from '../../types/pos';

// ─── Date Utilities ────────────────────────────────
const toDateKey = (iso: string): string => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const toThaiDate = (dateStr: string): string => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
};

const toThaiDateLong = (dateStr: string): string => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const todayKey = (): string => toDateKey(new Date().toISOString());

const shiftDate = (dateStr: string, delta: number): string => {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatDateInput = (dateStr: string): string => dateStr; // yyyy-MM-dd for <input type="date">

// ─── Component ─────────────────────────────────────
export const BillLogs: React.FC = () => {
  const {
    completedOrders,
    language,
    voidCompletedOrder,
    staffUsers,
  } = usePOS();

  // Date navigation state
  const [dateFrom, setDateFrom] = useState<string>(todayKey());
  const [dateTo, setDateTo] = useState<string>(todayKey());
  const [isRangeMode, setIsRangeMode] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'voided'>('all');
  const [filterMethod, setFilterMethod] = useState<'all' | PaymentMethod>('all');
  const [selectedBill, setSelectedBill] = useState<Order | null>(null);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [voidOrderId, setVoidOrderId] = useState<string | null>(null);
  const [voidPin, setVoidPin] = useState('');
  const [voidError, setVoidError] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // ─── Derived Data ──────────────────────────────
  const filteredBills = useMemo(() => {
    let bills = [...completedOrders];

    // Date filter
    bills = bills.filter((b) => {
      const key = toDateKey(b.updatedAt);
      return key >= dateFrom && key <= dateTo;
    });

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      bills = bills.filter(
        (b) =>
          b.orderNumber.toLowerCase().includes(q) ||
          b.tableName.toLowerCase().includes(q) ||
          b.staffName.toLowerCase().includes(q) ||
          b.items.some((i) => i.nameTh.toLowerCase().includes(q) || i.nameEn.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      bills = bills.filter((b) => b.status === filterStatus);
    }

    // Payment method filter
    if (filterMethod !== 'all') {
      bills = bills.filter((b) => b.payment?.method === filterMethod);
    }

    // Sort newest first
    bills.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return bills;
  }, [completedOrders, dateFrom, dateTo, searchQuery, filterStatus, filterMethod]);

  // Group bills by date
  const groupedBills = useMemo(() => {
    const groups: { dateKey: string; bills: Order[] }[] = [];
    const map = new Map<string, Order[]>();

    for (const bill of filteredBills) {
      const key = toDateKey(bill.updatedAt);
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(bill);
    }

    // Sort groups by date desc
    const sortedKeys = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));
    for (const key of sortedKeys) {
      groups.push({ dateKey: key, bills: map.get(key)! });
    }
    return groups;
  }, [filteredBills]);

  const isSingleDay = dateFrom === dateTo;
  const isToday = dateFrom === todayKey() && dateTo === todayKey();

  // ─── Handlers ──────────────────────────────────
  const handleToday = () => {
    setDateFrom(todayKey());
    setDateTo(todayKey());
    setIsRangeMode(false);
  };

  const handlePrevDay = () => {
    if (isSingleDay) {
      const prev = shiftDate(dateFrom, -1);
      setDateFrom(prev);
      setDateTo(prev);
    } else {
      setDateFrom(shiftDate(dateFrom, -1));
    }
  };

  const handleNextDay = () => {
    const next = shiftDate(isSingleDay ? dateFrom : dateTo, 1);
    if (next > todayKey()) return; // Can't go to future
    if (isSingleDay) {
      setDateFrom(next);
      setDateTo(next);
    } else {
      setDateTo(next);
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getPaymentMethodLabel = (method?: PaymentMethod) => {
    switch (method) {
      case 'cash': return { icon: <Banknote size={13} />, label: 'เงินสด', color: '#10b981' };
      case 'promptpay': return { icon: <QrCode size={13} />, label: 'PromptPay', color: '#3b82f6' };
      case 'card': return { icon: <CreditCard size={13} />, label: 'บัตรเครดิต', color: '#8b5cf6' };
      default: return { icon: null, label: '-', color: '#64748b' };
    }
  };

  const handleVoidClick = (orderId: string) => {
    setVoidOrderId(orderId);
    setVoidReason('');
    setVoidPin('');
    setVoidError('');
    setShowVoidModal(true);
  };

  const handleVoidConfirm = () => {
    if (!voidOrderId || !voidReason.trim()) {
      setVoidError('กรุณาระบุเหตุผลในการยกเลิก');
      return;
    }
    const staff = staffUsers.find((s) => s.pin === voidPin);
    if (!staff || (staff.role !== 'owner' && staff.role !== 'admin' && staff.role !== 'manager')) {
      setVoidError('PIN ไม่ถูกต้อง หรือไม่มีสิทธิ์ (ต้องเป็น Owner/Manager)');
      return;
    }
    voidCompletedOrder(voidOrderId, voidReason);
    setShowVoidModal(false);
    setSelectedBill(null);
  };

  const handleReprintReceipt = (bill: Order) => {
    // Open receipt modal for reprint
    setSelectedBill(bill);
  };

  // ─── Styles ────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    background: 'var(--color-bg-card)',
    border: '1px solid var(--color-border)',
    borderRadius: 12,
    padding: 0,
    overflow: 'hidden',
  };

  const thStyle: React.CSSProperties = {
    padding: '10px 14px',
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--color-text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    textAlign: 'left',
    borderBottom: '1px solid var(--color-border)',
    background: 'var(--color-bg-elevated)',
    whiteSpace: 'nowrap',
  };

  const tdStyle: React.CSSProperties = {
    padding: '12px 14px',
    fontSize: 13,
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    verticalAlign: 'middle',
  };

  // ─── Render ────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>
            🧾 {language === 'th' ? 'ประวัติบิลทั้งหมด' : 'All Bill Logs'}
          </h3>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
            {language === 'th' ? 'จัดการบิลรายวัน ดูประวัติย้อนหลัง' : 'Daily bill management & history'}
          </p>
        </div>
      </div>

      {/* ── Date Navigation Strip ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 16px',
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 12,
          flexWrap: 'wrap',
        }}
      >
        {/* Today Button */}
        <button
          onClick={handleToday}
          style={{
            padding: '7px 16px',
            borderRadius: 8,
            border: isToday ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--color-border)',
            background: isToday ? 'rgba(245, 158, 11, 0.15)' : 'var(--color-bg-elevated)',
            color: isToday ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.15s',
          }}
        >
          <Calendar size={14} />
          วันนี้
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.08)' }} />

        {/* Prev Day */}
        <button
          onClick={handlePrevDay}
          style={{
            width: 32, height: 32, borderRadius: 8,
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-elevated)',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}
        >
          <ChevronLeft size={16} />
        </button>

        {/* Date Display / Picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <input
              type="date"
              value={formatDateInput(dateFrom)}
              max={todayKey()}
              onChange={(e) => {
                const val = e.target.value;
                setDateFrom(val);
                if (!isRangeMode) setDateTo(val);
              }}
              style={{
                padding: '7px 12px',
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                colorScheme: 'dark',
              }}
            />
          </div>

          {isRangeMode && (
            <>
              <span style={{ color: 'var(--color-text-muted)', fontSize: 12, fontWeight: 600 }}>ถึง</span>
              <input
                type="date"
                value={formatDateInput(dateTo)}
                min={dateFrom}
                max={todayKey()}
                onChange={(e) => setDateTo(e.target.value)}
                style={{
                  padding: '7px 12px',
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  colorScheme: 'dark',
                }}
              />
            </>
          )}
        </div>

        {/* Next Day */}
        <button
          onClick={handleNextDay}
          disabled={(isSingleDay ? dateFrom : dateTo) >= todayKey()}
          style={{
            width: 32, height: 32, borderRadius: 8,
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-elevated)',
            color: (isSingleDay ? dateFrom : dateTo) >= todayKey() ? 'rgba(255,255,255,0.15)' : 'var(--color-text-secondary)',
            cursor: (isSingleDay ? dateFrom : dateTo) >= todayKey() ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}
        >
          <ChevronRight size={16} />
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.08)' }} />

        {/* Range Toggle */}
        <button
          onClick={() => {
            setIsRangeMode(!isRangeMode);
            if (isRangeMode) setDateTo(dateFrom);
          }}
          style={{
            padding: '7px 14px',
            borderRadius: 8,
            border: isRangeMode ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid var(--color-border)',
            background: isRangeMode ? 'rgba(59, 130, 246, 0.12)' : 'var(--color-bg-elevated)',
            color: isRangeMode ? '#60a5fa' : 'var(--color-text-muted)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            transition: 'all 0.15s',
          }}
        >
          <Calendar size={13} />
          {isRangeMode ? 'ช่วงวัน' : 'เลือกช่วง'}
        </button>

        {/* Current Date Label */}
        <div style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}>
          {isSingleDay
            ? (isToday ? '📅 วันนี้ — ' : '📅 ') + toThaiDate(dateFrom)
            : `📅 ${toThaiDate(dateFrom)} — ${toThaiDate(dateTo)}`
          }
        </div>
      </div>

      {/* ── Search & Filters ── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            placeholder={language === 'th' ? 'ค้นหาบิล, โต๊ะ, พนักงาน, เมนู...' : 'Search bills, tables, staff, items...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 38px',
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 10,
              color: '#fff',
              fontSize: 13,
              outline: 'none',
            }}
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 16px',
            background: showFilters ? 'rgba(245, 158, 11, 0.15)' : 'var(--color-bg-elevated)',
            border: showFilters ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--color-border)',
            borderRadius: 10,
            color: showFilters ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Filter size={14} />
          ตัวกรอง
          {showFilters ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Filter Row */}
      {showFilters && (
        <div style={{
          display: 'flex',
          gap: 10,
          padding: 14,
          background: 'var(--color-bg-elevated)',
          borderRadius: 10,
          border: '1px solid var(--color-border)',
          flexWrap: 'wrap',
        }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>สถานะ</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              style={{
                padding: '8px 12px',
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                color: '#fff',
                fontSize: 12,
              }}
            >
              <option value="all">ทั้งหมด</option>
              <option value="completed">ชำระแล้ว</option>
              <option value="voided">ยกเลิก</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>ช่องทางชำระ</label>
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value as any)}
              style={{
                padding: '8px 12px',
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                color: '#fff',
                fontSize: 12,
              }}
            >
              <option value="all">ทั้งหมด</option>
              <option value="cash">เงินสด</option>
              <option value="promptpay">PromptPay</option>
              <option value="card">บัตรเครดิต</option>
            </select>
          </div>
        </div>
      )}

      {/* ── Bills Table (grouped by date) ── */}
      <div style={cardStyle}>
        {filteredBills.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <Receipt size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p style={{ fontSize: 14, fontWeight: 600 }}>
              {language === 'th' ? 'ไม่พบบิลในช่วงวันที่เลือก' : 'No bills found for the selected dates'}
            </p>
            <p style={{ fontSize: 12, marginTop: 4 }}>
              {isSingleDay ? toThaiDate(dateFrom) : `${toThaiDate(dateFrom)} — ${toThaiDate(dateTo)}`}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>บิล #</th>
                  <th style={thStyle}>โต๊ะ</th>
                  <th style={thStyle}>เวลา</th>
                  <th style={thStyle}>พนักงาน</th>
                  <th style={thStyle}>ยอดรวม</th>
                  <th style={thStyle}>ช่องทาง</th>
                  <th style={thStyle}>สถานะ</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {groupedBills.map((group) => {
                  const groupTotal = group.bills.filter((b) => b.status === 'completed').reduce((sum, b) => sum + b.grandTotal, 0);
                  const showDateHeader = !isSingleDay;

                  return (
                    <React.Fragment key={group.dateKey}>
                      {/* Date Group Header (for multi-day range) */}
                      {showDateHeader && (
                        <tr>
                          <td
                            colSpan={8}
                            style={{
                              padding: '12px 14px',
                              background: 'rgba(245, 158, 11, 0.06)',
                              borderBottom: '1px solid rgba(245, 158, 11, 0.15)',
                              fontWeight: 700,
                              fontSize: 13,
                              color: 'var(--color-primary)',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>
                                📅 {toThaiDateLong(group.dateKey)} — {group.bills.length} บิล
                              </span>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14 }}>
                                ฿{groupTotal.toLocaleString()}
                              </span>
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* Bill Rows */}
                      {group.bills.map((bill) => {
                        const pm = getPaymentMethodLabel(bill.payment?.method);
                        return (
                          <tr
                            key={bill.id}
                            style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <td style={{ ...tdStyle, fontWeight: 700, color: 'var(--color-primary)' }}>{bill.orderNumber}</td>
                            <td style={{ ...tdStyle, fontWeight: 600, color: '#fff' }}>T{bill.tableName}</td>
                            <td style={tdStyle}>
                              {isSingleDay ? (
                                <div style={{ fontSize: 12, color: '#fff', display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <Clock size={11} style={{ color: 'var(--color-text-muted)' }} />
                                  {formatTime(bill.updatedAt)}
                                </div>
                              ) : (
                                <>
                                  <div style={{ fontSize: 12, color: '#fff' }}>{formatDate(bill.updatedAt)}</div>
                                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Clock size={10} /> {formatTime(bill.updatedAt)}
                                  </div>
                                </>
                              )}
                            </td>
                            <td style={{ ...tdStyle, fontSize: 12 }}>{bill.staffName}</td>
                            <td style={{ ...tdStyle, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                              ฿{bill.grandTotal.toLocaleString()}
                            </td>
                            <td style={tdStyle}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '3px 8px',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 600,
                                background: `${pm.color}15`,
                                color: pm.color,
                              }}>
                                {pm.icon} {pm.label}
                              </span>
                            </td>
                            <td style={tdStyle}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '3px 8px',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 700,
                                background: bill.status === 'completed' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                                color: bill.status === 'completed' ? '#10b981' : '#ef4444',
                              }}>
                                {bill.status === 'completed' ? '✅ ชำระแล้ว' : '❌ ยกเลิก'}
                              </span>
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                                <button
                                  onClick={() => setSelectedBill(bill)}
                                  title="ดูรายละเอียด"
                                  style={{
                                    width: 32, height: 32, borderRadius: 8,
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-bg-elevated)',
                                    color: 'var(--color-text-secondary)',
                                    cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  }}
                                >
                                  <Eye size={14} />
                                </button>
                                {bill.status === 'completed' && (
                                  <>
                                    <button
                                      onClick={() => handleReprintReceipt(bill)}
                                      title="พิมพ์ใบเสร็จซ้ำ"
                                      style={{
                                        width: 32, height: 32, borderRadius: 8,
                                        border: '1px solid rgba(59, 130, 246, 0.3)',
                                        background: 'rgba(59, 130, 246, 0.08)',
                                        color: '#60a5fa',
                                        cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      }}
                                    >
                                      <Printer size={14} />
                                    </button>
                                    <button
                                      onClick={() => handleVoidClick(bill.id)}
                                      title="ยกเลิกบิล"
                                      style={{
                                        width: 32, height: 32, borderRadius: 8,
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        background: 'rgba(239, 68, 68, 0.08)',
                                        color: '#ef4444',
                                        cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      }}
                                    >
                                      <XCircle size={14} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Bill Detail Modal ── */}
      {selectedBill && (
        <div
          onClick={() => setSelectedBill(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              width: 520,
              maxHeight: '85vh',
              overflow: 'auto',
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>
                  รายละเอียดบิล {selectedBill.orderNumber}
                </h3>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                  โต๊ะ {selectedBill.tableName} • {selectedBill.staffName}
                </p>
              </div>
              <button
                onClick={() => setSelectedBill(null)}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: '1px solid var(--color-border)',
                  background: 'var(--color-bg-elevated)', color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Items List */}
            <div style={{ padding: '16px 24px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                รายการอาหาร ({selectedBill.items.length} รายการ)
              </div>
              {selectedBill.items.map((item) => (
                <div key={item.id} style={{
                  padding: '10px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: item.status === 'voided' ? '#ef4444' : '#fff' }}>
                      {item.nameTh}
                      {item.status === 'voided' && <span style={{ fontSize: 10, marginLeft: 6 }}>(ยกเลิก)</span>}
                    </div>
                    {item.modifiers.length > 0 && (
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                        {item.modifiers.map((m) => m.optionNameTh).join(', ')}
                      </div>
                    )}
                    {item.specialInstructions && (
                      <div style={{ fontSize: 11, color: 'var(--color-primary)', marginTop: 2 }}>
                        📝 {item.specialInstructions}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', minWidth: 80 }}>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>x{item.quantity}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                      ฿{item.itemTotal.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div style={{
              padding: '16px 24px',
              background: 'var(--color-bg-elevated)',
              borderTop: '1px solid var(--color-border)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>ยอดสินค้า (Subtotal)</span>
                <span style={{ fontSize: 13, color: '#fff', fontFamily: 'var(--font-mono)' }}>฿{selectedBill.subtotal.toLocaleString()}</span>
              </div>
              {selectedBill.serviceChargeAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    Service Charge ({(selectedBill.serviceChargeRate * 100).toFixed(0)}%)
                  </span>
                  <span style={{ fontSize: 13, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                    ฿{selectedBill.serviceChargeAmount.toLocaleString()}
                  </span>
                </div>
              )}
              {selectedBill.vatAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    VAT {(selectedBill.vatRate * 100).toFixed(0)}% {selectedBill.isVatInclusive ? '(รวมในราคา)' : ''}
                  </span>
                  <span style={{ fontSize: 13, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                    ฿{selectedBill.vatAmount.toLocaleString()}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-primary)' }}>ยอดรวมสุทธิ</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                  ฿{selectedBill.grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Payment Info */}
            {selectedBill.payment && (
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                  ข้อมูลการชำระเงิน
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>ช่องทาง</span>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginTop: 2 }}>
                      {getPaymentMethodLabel(selectedBill.payment.method).label}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>เวลาชำระ</span>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginTop: 2 }}>
                      {formatTime(selectedBill.payment.paidAt)}
                    </div>
                  </div>
                  {selectedBill.payment.cashReceived != null && (
                    <>
                      <div>
                        <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>รับเงิน</span>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginTop: 2 }}>
                          ฿{selectedBill.payment.cashReceived.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>ทอนเงิน</span>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-emerald)', marginTop: 2 }}>
                          ฿{(selectedBill.payment.cashChange || 0).toLocaleString()}
                        </div>
                      </div>
                    </>
                  )}
                  {selectedBill.payment.promptpayRef && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>เลขอ้างอิง PromptPay</span>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginTop: 2 }}>
                        {selectedBill.payment.promptpayRef}
                      </div>
                    </div>
                  )}
                  {selectedBill.payment.cardLast4 && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>หมายเลขบัตร</span>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginTop: 2 }}>
                        •••• •••• •••• {selectedBill.payment.cardLast4}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Void Note */}
            {selectedBill.status === 'voided' && selectedBill.notes && (
              <div style={{
                padding: '12px 24px',
                background: 'rgba(239, 68, 68, 0.08)',
                borderTop: '1px solid rgba(239, 68, 68, 0.2)',
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={13} />
                  {selectedBill.notes}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div style={{
              padding: '12px 24px',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 11,
              color: 'var(--color-text-muted)',
            }}>
              <span>เปิดบิล: {formatDate(selectedBill.createdAt)} {formatTime(selectedBill.createdAt)}</span>
              <span>อัพเดท: {formatDate(selectedBill.updatedAt)} {formatTime(selectedBill.updatedAt)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Void Confirmation Modal ── */}
      {showVoidModal && (
        <div
          onClick={() => setShowVoidModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--color-bg-card)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 16,
              width: 400,
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)',
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'rgba(239, 68, 68, 0.12)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <AlertTriangle size={20} color="#ef4444" />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>ยกเลิกบิล (Void)</h3>
                <p style={{ fontSize: 12, color: '#ef4444', marginTop: 2 }}>ต้องใช้ PIN ผู้จัดการ/เจ้าของร้าน</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4, display: 'block' }}>
                  เหตุผลในการยกเลิก *
                </label>
                <select
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 13,
                  }}
                >
                  <option value="">-- เลือกเหตุผล --</option>
                  <option value="ลูกค้ายกเลิก">ลูกค้ายกเลิก</option>
                  <option value="ครัวทำผิด">ครัวทำผิด</option>
                  <option value="สั่งผิดโต๊ะ">สั่งผิดโต๊ะ</option>
                  <option value="รายการซ้ำ">รายการซ้ำ</option>
                  <option value="อื่นๆ">อื่นๆ</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4, display: 'block' }}>
                  PIN ผู้อนุมัติ *
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={voidPin}
                  onChange={(e) => {
                    setVoidPin(e.target.value.replace(/\D/g, ''));
                    setVoidError('');
                  }}
                  placeholder="กรอก 4 หลัก"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 18,
                    fontWeight: 700,
                    letterSpacing: 8,
                    textAlign: 'center',
                    fontFamily: 'var(--font-mono)',
                  }}
                />
              </div>

              {voidError && (
                <div style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>⚠️ {voidError}</div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  onClick={() => setShowVoidModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 10,
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleVoidConfirm}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#ef4444',
                    border: 'none',
                    borderRadius: 10,
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  ยืนยันยกเลิกบิล
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
