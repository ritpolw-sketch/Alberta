import React, { useState, useRef, useEffect } from 'react';
import { POSProvider, usePOS } from './context/POSContext';
import { POSOrderView } from './components/pos/POSOrderView';
import { TableLayoutManager } from './components/pos/TableLayoutManager';
import { PinPadModal } from './components/common/PinPadModal';
import { PaymentModal } from './components/pos/PaymentModal';
import { ReceiptPrintModal } from './components/pos/ReceiptPrintModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { KitchenKDS } from './components/kds/KitchenKDS';
import {
  LayoutGrid,
  BarChart3,
  Lock,
  Receipt,
  Flame,
  Menu as MenuIcon,
  X as CloseIcon,
  ChevronDown,
} from 'lucide-react';

const POSContent: React.FC = () => {
  const {
    currentStaff,
    activeTab,
    setActiveTab,
    activeModal,
    setActiveModal,
    settings,
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

  const handleTabClick = (tab: any) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
  };

  const tabLabels: Record<string, { icon: React.ReactNode; th: string; en: string }> = {
    pos: { icon: <Receipt size={15} />, th: 'สั่งอาหาร & บิล', en: 'Order & Bill' },
    tables: { icon: <LayoutGrid size={15} />, th: 'จัดการผังโต๊ะ', en: 'Table Layout' },
    kds: { icon: <Flame size={15} />, th: 'จอครัว (KDS)', en: 'Kitchen KDS' },
    admin: { icon: <BarChart3 size={15} />, th: 'เจ้าของร้าน', en: 'Admin' },
  };

  const currentTabInfo = tabLabels[activeTab] || tabLabels.pos;

  return (
    <div className="app-container" style={{ flexDirection: 'column' }}>
      {/* Top Navbar - Full Width */}
      <header
        style={{
          height: 48,
          minHeight: 48,
          background: 'rgba(17, 24, 39, 0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          zIndex: 50,
          gap: 12,
        }}
      >
        {/* Left: Hamburger Menu + Restaurant Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Hamburger + Active Tab Dropdown */}
          <div ref={menuRef} style={{ position: 'relative' }}>
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
                  minWidth: 220,
                  background: 'rgba(17, 24, 39, 0.98)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 10,
                  padding: 6,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                  zIndex: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <button onClick={() => handleTabClick('pos')} className={`nav-item ${activeTab === 'pos' ? 'active' : ''}`}>
                  <Receipt size={16} />
                  <span>สั่งอาหาร & บิล</span>
                </button>
                <button onClick={() => handleTabClick('tables')} className={`nav-item ${activeTab === 'tables' ? 'active' : ''}`}>
                  <LayoutGrid size={16} />
                  <span>จัดการผังโต๊ะ</span>
                </button>
                <button onClick={() => handleTabClick('kds')} className={`nav-item ${activeTab === 'kds' ? 'active' : ''}`}>
                  <Flame size={16} />
                  <span>จอในครัว (KDS)</span>
                </button>
                {(currentStaff?.role === 'owner' || currentStaff?.role === 'admin') && (
                  <button onClick={() => handleTabClick('admin')} className={`nav-item ${activeTab === 'admin' ? 'active' : ''}`}>
                    <BarChart3 size={16} />
                    <span>เจ้าของร้าน (Admin)</span>
                  </button>
                )}

                {/* Divider */}
                <div style={{ height: 1, background: 'var(--color-border)', margin: '4px 0' }} />

                {/* Staff Login in dropdown */}
                <button
                  onClick={() => {
                    setActiveModal('pin');
                    setIsMenuOpen(false);
                  }}
                  className="nav-item"
                  style={{ gap: 10 }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
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
                  <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                      {currentStaff ? currentStaff.name : 'ใส่รหัส (PIN)'}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase' }}>
                      {currentStaff?.role === 'owner' ? 'Owner' : currentStaff?.role || 'Staff'}
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 24, background: 'rgba(255, 255, 255, 0.1)' }} />

          {/* Restaurant Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
              }}
            >
              🍲
            </div>
            <div>
              <h1 style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>
                {settings.restaurantNameTh}
              </h1>
              <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'var(--color-emerald)',
                    boxShadow: '0 0 6px var(--color-emerald)',
                    display: 'inline-block',
                  }}
                />
                <span>ระบบออนไลน์</span>
                <span>•</span>
                <span>Project Alberta</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Staff Badge (quick display) */}
        <button
          onClick={() => setActiveModal('pin')}
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
          <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>
            {currentStaff ? currentStaff.name : 'PIN'}
          </span>
        </button>
      </header>

      {/* Main View Area - Takes remaining height */}
      <main style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {activeTab === 'pos' && <POSOrderView />}
        {activeTab === 'tables' && <TableLayoutManager />}
        {activeTab === 'kds' && <KitchenKDS />}
        {activeTab === 'admin' && <AdminDashboard />}
      </main>

      {/* Modals */}
      <PinPadModal
        isOpen={activeModal === 'pin'}
        onClose={() => setActiveModal(null)}
      />

      <PaymentModal
        isOpen={activeModal === 'payment'}
        onClose={() => setActiveModal(null)}
      />

      <ReceiptPrintModal
        isOpen={activeModal === 'receipt'}
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

