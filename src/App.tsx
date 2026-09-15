import React, { useState, useRef, useEffect, Suspense, lazy } from 'react';
import { POSProvider, usePOS } from './context/POSContext';
import { POSOrderView } from './components/pos/POSOrderView';
import { PinPadModal } from './components/common/PinPadModal';
import { PaymentModal } from './components/pos/PaymentModal';
import { OrderQueueModal } from './components/pos/OrderQueueModal';
import {
  LayoutGrid,
  BarChart3,
  Lock,
  LogOut,
  Receipt,
  Flame,
  Menu as MenuIcon,
  X as CloseIcon,
  ChevronDown,
  Clock,
  Bot,
  Key,
  Utensils,
  Users,
  Settings as SettingsIcon,
} from 'lucide-react';

// Code-split secondary views to prioritize POS Master resources first
const TableLayoutManager = lazy(() =>
  import('./components/pos/TableLayoutManager').then((m) => ({ default: m.TableLayoutManager }))
);
const AdminDashboard = lazy(() =>
  import('./components/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);
const KitchenKDS = lazy(() =>
  import('./components/kds/KitchenKDS').then((m) => ({ default: m.KitchenKDS }))
);
const CustomerOrderPage = lazy(() =>
  import('./components/pos/CustomerOrderPage').then((m) => ({ default: m.CustomerOrderPage }))
);
const ReceiptPrintModal = lazy(() =>
  import('./components/pos/ReceiptPrintModal').then((m) => ({ default: m.ReceiptPrintModal }))
);

const LazyFallback: React.FC = () => (
  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#090d16', color: 'var(--color-primary)' }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 28, height: 28, border: '3px solid rgba(245, 158, 11, 0.2)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)' }}>กำลังโหลดส่วนเสริม...</span>
    </div>
  </div>
);

const POSContent: React.FC = () => {
  const {
    currentStaff,
    logoutStaff,
    language,
    activeTab,
    setActiveTab,
    activeModal,
    setActiveModal,
    settings,
    currentShift,
    adminSubTab,
    setAdminSubTab,
    orderQueue,
    lastWorkerNotification,
    dismissWorkerNotification,
  } = usePOS();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // Check if URL is Customer Mobile Self-Ordering route (/order, /customer-order, or ?table=)
  const isCustomerRoute =
    window.location.pathname.startsWith('/order') ||
    window.location.pathname.startsWith('/customer-order') ||
    window.location.search.includes('table=');

  if (isCustomerRoute) {
    return (
      <Suspense fallback={<LazyFallback />}>
        <CustomerOrderPage />
      </Suspense>
    );
  }

  const handleTabClick = (tab: any) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
  };

  const tabLabels: Record<string, { icon: React.ReactNode; th: string; en: string }> = {
    pos: { icon: <Receipt size={15} />, th: 'สั่งอาหาร & บิล', en: 'Order & Bill' },
    tables: { icon: <LayoutGrid size={15} />, th: 'จัดการผังโต๊ะ', en: 'Table Layout' },
    kds: { icon: <Flame size={15} />, th: 'จอครัว (KDS)', en: 'Kitchen KDS' },
    admin: {
      icon:
        adminSubTab === 'procurement' ? (
          <Bot size={15} />
        ) : adminSubTab === 'api_keys' ? (
          <Key size={15} />
        ) : adminSubTab === 'settings' ? (
          <SettingsIcon size={15} />
        ) : adminSubTab === 'employees' ? (
          <Users size={15} />
        ) : adminSubTab === 'shifts' ? (
          <Clock size={15} />
        ) : adminSubTab === 'bills' ? (
          <Receipt size={15} />
        ) : (
          <BarChart3 size={15} />
        ),
      th:
        adminSubTab === 'procurement'
          ? 'จัดซื้อ & LINE Agent'
          : adminSubTab === 'api_keys'
          ? 'API Key & โปรแกรมบัญชี'
          : adminSubTab === 'settings'
          ? 'ตั้งค่าระบบ (System Setup)'
          : adminSubTab === 'employees'
          ? 'จัดการพนักงาน & สิทธิ์'
          : adminSubTab === 'shifts'
          ? 'จัดการกะ'
          : adminSubTab === 'bills'
          ? 'ประวัติบิล (Bill Logs)'
          : 'เจ้าของร้าน (Admin)',
      en:
        adminSubTab === 'procurement'
          ? 'Procurement Agent'
          : adminSubTab === 'api_keys'
          ? 'API Keys & Accounting'
          : adminSubTab === 'settings'
          ? 'System Setup'
          : adminSubTab === 'employees'
          ? 'User Access Control'
          : adminSubTab === 'shifts'
          ? 'Manage Shifts'
          : adminSubTab === 'bills'
          ? 'Bill Logs'
          : 'Admin',
    },
  };

  const currentTabInfo = tabLabels[activeTab] || tabLabels.pos;

  return (
    <div className="app-container" style={{ flexDirection: 'column' }}>
      {/* Top Navbar - Full Width */}
      <header
        className="app-header"
        style={{
          height: 48,
          minHeight: 48,
          background: 'rgba(17, 24, 39, 0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 max(16px, var(--safe-right)) 0 max(16px, var(--safe-left))',
          position: 'relative',
          zIndex: 50,
          gap: 10,
        }}
      >
        {/* Left: Hamburger Menu + Restaurant Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, zIndex: 2 }}>
          {/* Hamburger + Active Tab Dropdown */}
          <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: isMenuOpen ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                border: isMenuOpen ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--color-border)',
                borderRadius: 8,
                padding: '6px 12px',
                cursor: 'pointer',
                color: isMenuOpen ? 'var(--color-primary)' : '#fff',
                fontSize: 13,
                fontWeight: 700,
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {isMenuOpen ? <CloseIcon size={16} /> : <MenuIcon size={16} />}
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {currentTabInfo.icon}
                {currentTabInfo.th}
              </span>
              <ChevronDown size={13} style={{ opacity: 0.6, transform: isMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  minWidth: 230,
                  background: 'rgba(17, 24, 39, 0.98)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 10,
                  padding: '8px 6px',
                  boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)',
                  zIndex: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                }}
              >
                <div style={{ padding: '4px 8px 2px', fontSize: 10, fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  หน้าร้าน & ครัว
                </div>

                <button onClick={() => handleTabClick('pos')} className={`nav-item ${activeTab === 'pos' ? 'active' : ''}`}>
                  <Receipt size={16} />
                  <span>สั่งอาหาร & บิล</span>
                </button>
                <button onClick={() => handleTabClick('tables')} className={`nav-item ${activeTab === 'tables' ? 'active' : ''}`}>
                  <LayoutGrid size={16} />
                  <span>จัดการผังโต๊ะ</span>
                </button>

                <button
                  onClick={() => {
                    setAdminSubTab('menu');
                    handleTabClick('admin');
                  }}
                  className={`nav-item ${activeTab === 'admin' && adminSubTab === 'menu' ? 'active' : ''}`}
                >
                  <Utensils size={16} />
                  <span>จัดการเมนูอาหาร</span>
                </button>

                <button onClick={() => handleTabClick('kds')} className={`nav-item ${activeTab === 'kds' ? 'active' : ''}`} style={{ position: 'relative' }}>
                  <Flame size={16} />
                  <span>จอในครัว (KDS)</span>
                </button>

                <div style={{ height: 1, background: 'var(--color-border)', margin: '4px 0' }} />

                <div style={{ padding: '4px 8px 2px', fontSize: 10, fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  การเงิน & กะ
                </div>

                <button
                  onClick={() => {
                    setAdminSubTab('shifts');
                    handleTabClick('pos');
                  }}
                  className={`nav-item ${activeTab === 'pos' && adminSubTab === 'shifts' ? 'active' : ''}`}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Clock size={16} style={{ color: currentShift.status === 'open' ? '#34d399' : '#f87171' }} />
                    <span>จัดการกะ & ลิ้นชักเงิน</span>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      padding: '1px 6px',
                      borderRadius: 10,
                      fontWeight: 700,
                      background: currentShift.status === 'open' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: currentShift.status === 'open' ? '#34d399' : '#f87171',
                    }}
                  >
                    {currentShift.status === 'open' ? 'เปิด' : 'ปิด'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setAdminSubTab('bills');
                    handleTabClick('pos');
                  }}
                  className={`nav-item ${activeTab === 'pos' && adminSubTab === 'bills' ? 'active' : ''}`}
                >
                  <Receipt size={16} />
                  <span>ประวัติบิล (Bill Logs)</span>
                </button>

                {(currentStaff?.role === 'owner' || currentStaff?.role === 'admin') && (
                  <>
                    <div style={{ height: 1, background: 'var(--color-border)', margin: '4px 0' }} />
                    <div style={{ padding: '4px 8px 2px', fontSize: 10, fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      การจัดการระบบ (System Management)
                    </div>

                    {/* 1. API Key & Accounting */}
                    <button
                      onClick={() => {
                        setAdminSubTab('api_keys');
                        handleTabClick('admin');
                      }}
                      className={`nav-item ${activeTab === 'admin' && adminSubTab === 'api_keys' ? 'active' : ''}`}
                    >
                      <Key size={16} style={{ color: '#c084fc' }} />
                      <span>API Key & โปรแกรมบัญชี</span>
                    </button>

                    {/* 2. System Setup & Preferences */}
                    <button
                      onClick={() => {
                        setAdminSubTab('settings');
                        handleTabClick('admin');
                        setIsMenuOpen(false);
                      }}
                      className={`nav-item ${activeTab === 'admin' && adminSubTab === 'settings' ? 'active' : ''}`}
                    >
                      <SettingsIcon size={16} style={{ color: '#f59e0b' }} />
                      <span>ตั้งค่าระบบ & ค่าเริ่มต้น (System Setup)</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('admin');
                        setAdminSubTab('menu');
                        setIsMenuOpen(false);
                      }}
                      className={`nav-item ${activeTab === 'admin' && adminSubTab === 'menu' ? 'active' : ''}`}
                    >
                      <MenuIcon size={18} />
                      <span>จัดการเมนู (Menu)</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('admin');
                        setAdminSubTab('shifts');
                        setIsMenuOpen(false);
                      }}
                      className={`nav-item ${activeTab === 'admin' && adminSubTab === 'shifts' ? 'active' : ''}`}
                    >
                      <Clock size={18} />
                      <span>จัดการกะ (Shift)</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('admin');
                        setAdminSubTab('procurement');
                        setIsMenuOpen(false);
                      }}
                      className={`nav-item ${activeTab === 'admin' && adminSubTab === 'procurement' ? 'active' : ''}`}
                    >
                      <Bot size={18} />
                      <span>LINE AI สั่งวัตถุดิบ</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('admin');
                        setAdminSubTab('dashboard');
                        setIsMenuOpen(false);
                      }}
                      className={`nav-item ${activeTab === 'admin' && adminSubTab === 'dashboard' ? 'active' : ''}`}
                    >
                      <BarChart3 size={18} />
                      <span>แดชบอร์ดสรุปยอด</span>
                    </button>
                  </>
                )}

                <div style={{ height: 1, background: 'var(--color-border)', margin: '4px 0' }} />

                {/* Staff Info Card with Switch PIN & Logout */}
                <div
                  style={{
                    padding: 8,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <button
                    onClick={() => {
                      setActiveModal('pin');
                      setIsMenuOpen(false);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      textAlign: 'left',
                      padding: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        background: currentStaff?.avatarColor || 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#fff',
                      }}
                    >
                      {currentStaff ? currentStaff.name.charAt(0) : <Lock size={10} />}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>
                        {currentStaff ? currentStaff.name : 'ใส่รหัส (PIN)'}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase' }}>
                        {currentStaff?.role === 'owner' ? 'Owner' : currentStaff?.role || 'Staff'}
                      </div>
                    </div>
                  </button>

                  {currentStaff && (
                    <button
                      onClick={() => {
                        logoutStaff();
                        setIsMenuOpen(false);
                      }}
                      title="ออกจากระบบ"
                      style={{
                        padding: '5px 8px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#f87171',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <LogOut size={13} />
                      <span>ออก</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 24, background: 'var(--color-border)', flexShrink: 0 }} />

          {/* Brand Logo & Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div
              style={{
                width: 32,
                height: 32,
                minWidth: 32,
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, var(--color-primary), #ea580c)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                flexShrink: 0,
              }}
            >
              🍲
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span className="brand-title" style={{ fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {settings.restaurantNameTh}
              </span>
              <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {settings.branchName} • POS v2.0
              </span>
            </div>
          </div>
        </div>

        {/* Center Section: Quick navigation bar (รายการสั่ง, บิลย้อนหลัง, จัดการกะ) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Quick Menu 1: รายการสั่ง */}
          <button
            onClick={() => setActiveTab('pos')}
            className={`btn-header ${activeTab === 'pos' ? 'active' : ''}`}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              background: activeTab === 'pos' ? 'rgba(245, 158, 11, 0.2)' : 'var(--color-bg-elevated)',
              border: `1px solid ${activeTab === 'pos' ? 'var(--color-primary)' : 'var(--color-border)'}`,
              color: activeTab === 'pos' ? 'var(--color-primary)' : '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s ease',
            }}
          >
            <LayoutGrid size={16} />
            <span>รายการสั่ง</span>
          </button>

          {/* Quick Menu 2: บิลย้อนหลัง */}
          {(currentStaff?.role === 'owner' || currentStaff?.role === 'admin') && (
            <button
              onClick={() => {
                setActiveTab('admin');
                setAdminSubTab('bills');
              }}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-md)',
                background: activeTab === 'admin' && adminSubTab === 'bills' ? 'rgba(245, 158, 11, 0.2)' : 'var(--color-bg-elevated)',
                border: `1px solid ${activeTab === 'admin' && adminSubTab === 'bills' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                color: activeTab === 'admin' && adminSubTab === 'bills' ? 'var(--color-primary)' : '#fff',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s ease',
              }}
            >
              <Receipt size={16} />
              <span>บิลย้อนหลัง</span>
            </button>
          )}

          {/* Quick Menu 3: จัดการกะ */}
          {(currentStaff?.role === 'owner' || currentStaff?.role === 'admin') && (
            <button
              onClick={() => {
                setActiveTab('admin');
                setAdminSubTab('shifts');
              }}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-md)',
                background: activeTab === 'admin' && adminSubTab === 'shifts' ? 'rgba(245, 158, 11, 0.2)' : 'var(--color-bg-elevated)',
                border: `1px solid ${activeTab === 'admin' && adminSubTab === 'shifts' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                color: activeTab === 'admin' && adminSubTab === 'shifts' ? 'var(--color-primary)' : '#fff',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s ease',
              }}
            >
              <Clock size={16} />
              <span>จัดการกะ</span>
            </button>
          )}

          {/* Quick Menu 4: จัดการระบบ (Admin System Settings) */}
          {(currentStaff?.role === 'owner' || currentStaff?.role === 'admin') && (
            <button
              onClick={() => {
                setActiveTab('admin');
                setAdminSubTab('settings');
              }}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-md)',
                background: activeTab === 'admin' && (adminSubTab === 'settings' || adminSubTab === 'api_keys' || adminSubTab === 'employees') ? 'rgba(245, 158, 11, 0.2)' : 'var(--color-bg-elevated)',
                border: `1px solid ${activeTab === 'admin' && (adminSubTab === 'settings' || adminSubTab === 'api_keys' || adminSubTab === 'employees') ? 'var(--color-primary)' : 'var(--color-border)'}`,
                color: activeTab === 'admin' && (adminSubTab === 'settings' || adminSubTab === 'api_keys' || adminSubTab === 'employees') ? 'var(--color-primary)' : '#fff',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s ease',
              }}
            >
              <SettingsIcon size={16} />
              <span>จัดการระบบ</span>
            </button>
          )}
        </div>

        {/* Right Section: Order Queue Alert + Active Shift Status + Staff Profile + Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {/* Order Queue Alert Badge */}
          {orderQueue.length > 0 && (
            <button
              onClick={() => setActiveModal('order_queue')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid var(--color-primary)',
                padding: '5px 10px',
                borderRadius: 20,
                color: 'var(--color-primary)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                animation: 'pulse 1.5s infinite',
              }}
            >
              <span>คิวสั่งอาหาร</span>
              <span
                style={{
                  background: 'var(--color-primary)',
                  color: '#000',
                  borderRadius: 10,
                  padding: '1px 6px',
                  fontSize: 11,
                  fontWeight: 900,
                }}
              >
                {orderQueue.length}
              </span>
            </button>
          )}

          {/* Active Shift Indicator Button */}
          <button
            onClick={() => {
              if (currentStaff?.role === 'owner' || currentStaff?.role === 'admin') {
                setActiveTab('admin');
                setAdminSubTab('shifts');
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: currentShift ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              border: `1px solid ${currentShift ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              padding: '5px 12px',
              borderRadius: 20,
              cursor: currentStaff?.role === 'owner' || currentStaff?.role === 'admin' ? 'pointer' : 'default',
              transition: 'all 0.2s',
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: currentShift ? '#22c55e' : '#ef4444',
                boxShadow: `0 0 8px ${currentShift ? '#22c55e' : '#ef4444'}`,
              }}
            />
            <span style={{ fontSize: 12, fontWeight: 700, color: currentShift ? '#22c55e' : '#ef4444' }}>
              {currentShift
                ? `กะ #${currentShift.id.slice(-4)} (${currentShift.openedBy})`
                : 'กะ: ปิด (แตะเปิด)'}
            </span>
          </button>

          {/* Staff Profile & Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={() => setActiveModal('pin')}
              title={language === 'th' ? 'สลับพนักงาน (PIN)' : 'Switch Staff'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                padding: '5px 12px 5px 6px',
                borderRadius: 20,
                cursor: 'pointer',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: currentStaff?.avatarColor || 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                {currentStaff ? currentStaff.name.charAt(0) : <Lock size={10} />}
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentStaff ? currentStaff.name : 'PIN'}
              </span>
            </button>

            {currentStaff && (
              <button
                onClick={() => logoutStaff()}
                title={language === 'th' ? 'ออกจากระบบ' : 'Log Out'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 12px',
                  borderRadius: 20,
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                }}
              >
                <LogOut size={14} />
                <span>{language === 'th' ? 'ออกจากระบบ' : 'Log Out'}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main View Area - Takes remaining height with Suspense for secondary modules */}
      <main style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {activeTab === 'pos' && <POSOrderView />}
        {activeTab === 'tables' && (
          <Suspense fallback={<LazyFallback />}>
            <TableLayoutManager />
          </Suspense>
        )}
        {activeTab === 'kds' && (
          <Suspense fallback={<LazyFallback />}>
            <KitchenKDS />
          </Suspense>
        )}
        {activeTab === 'admin' && (
          <Suspense fallback={<LazyFallback />}>
            <AdminDashboard />
          </Suspense>
        )}
      </main>

      {/* Real-time Cashier Toast for Customer Self-Orders via Queue Worker */}
      {lastWorkerNotification && (
        <div
          style={{
            position: 'fixed',
            top: 56,
            right: 16,
            zIndex: 9999,
            background: 'rgba(17, 24, 39, 0.96)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
            borderRadius: 12,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'rgba(245, 158, 11, 0.2)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)',
            }}
          >
            <Flame size={20} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>
              🔔 ลูกค้าโต๊ะ {lastWorkerNotification.tableName} สั่งอาหาร ({lastWorkerNotification.itemCount} รายการ)
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
              Worker ประมวลผลและส่งเข้าครัวเรียบร้อยแล้ว • {lastWorkerNotification.time}
            </div>
          </div>
          <button
            onClick={() => {
              dismissWorkerNotification();
              setActiveModal('order_queue');
            }}
            style={{
              background: 'rgba(245, 158, 11, 0.2)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: 'var(--color-primary)',
              padding: '6px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ดูคิว
          </button>
          <button
            onClick={dismissWorkerNotification}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
          >
            <CloseIcon size={16} />
          </button>
        </div>
      )}

      {/* Modals */}
      <PinPadModal
        isOpen={activeModal === 'pin'}
        onClose={() => setActiveModal(null)}
      />

      <PaymentModal
        isOpen={activeModal === 'payment'}
        onClose={() => setActiveModal(null)}
      />

      <Suspense fallback={null}>
        <ReceiptPrintModal
          isOpen={activeModal === 'receipt'}
          onClose={() => setActiveModal(null)}
        />
      </Suspense>

      <OrderQueueModal
        isOpen={activeModal === 'order_queue'}
        onClose={() => setActiveModal(null)}
      />
    </div>
  );
};

export default function App() {
  return (
    <POSProvider>
      <POSContent />
    </POSProvider>
  );
}
