import React, { useEffect } from 'react';
import { usePOS } from '../../context/POSContext';
import { TableMap } from './TableMap';
import { OrderPanel } from './OrderPanel';
import { MenuCatalog } from './MenuCatalog';
import {
  Users,
  Receipt,
  LayoutGrid,
} from 'lucide-react';
import type { MenuItem } from '../../types/pos';

export const POSOrderView: React.FC = () => {
  const {
    tables,
    activeTableId,
    setActiveTableId,
    orders,
    quickAddItemToOrder,
    setSelectedItemForModifier,
    setActiveModal,
    language,
  } = usePOS();

  // Auto-select first table if none selected so cashier immediately sees the 3-panel workspace in action
  useEffect(() => {
    if (!activeTableId && tables.length > 0) {
      const occupied = tables.find((t) =>
        Object.values(orders).some((o) => o.tableId === t.id && o.status === 'active')
      );
      setActiveTableId(occupied ? occupied.id : tables[0].id);
    }
  }, [tables, activeTableId, orders, setActiveTableId]);

  const activeTable = tables.find((t) => t.id === activeTableId);
  const activeOrder = activeTableId
    ? Object.values(orders).find((o) => o.tableId === activeTableId && o.status === 'active')
    : null;

  const handleCustomizeItem = (item: MenuItem) => {
    setSelectedItemForModifier(item);
    setActiveModal('modifier');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Minimal Active Table Status Bar */}
      <div
        style={{
          padding: '6px 16px',
          background: 'var(--color-bg-card)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          zIndex: 10,
          minHeight: 38,
        }}
      >
        {activeTable ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.22), rgba(217, 119, 6, 0.12))',
              border: '1.5px solid var(--color-primary)',
              borderRadius: 8,
              padding: '3px 10px',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--color-primary)' }}>
              {language === 'th' ? `กำลังสั่ง: โต๊ะ ${activeTable.number}` : `Active: Table ${activeTable.number}`}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--color-text-secondary)' }}>
              <Users size={12} />
              <span>{activeTable.capacity} {language === 'th' ? 'ที่นั่ง' : 'seats'}</span>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '3px 10px',
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--color-border)',
              fontSize: 12,
              color: 'var(--color-text-secondary)',
            }}
          >
            <LayoutGrid size={14} />
            <span>{language === 'th' ? 'กรุณาแตะเลือกโต๊ะจากผังด้านซ้าย' : 'Select table on the left'}</span>
          </div>
        )}

        {activeOrder && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              color: '#fff',
              background: 'rgba(255, 255, 255, 0.06)',
              padding: '3px 8px',
              borderRadius: 6,
              border: '1px solid var(--color-border)',
            }}
          >
            <Receipt size={13} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontWeight: 700 }}>{activeOrder.orderNumber}</span>
            <span>•</span>
            <span style={{ color: 'var(--color-primary)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
              ฿{activeOrder.grandTotal.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Main 3-Panels Layout: 1. Tables Blocks | 2. Tables Bill | 3. Menu 1-Click */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', width: '100%', height: '100%' }}>
        {/* Panel 1: Tables blocks ผังโต๊ะ (27% width, min 280px, max 360px) */}
        <div
          style={{
            width: '27%',
            minWidth: 280,
            maxWidth: 360,
            height: '100%',
            borderRight: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: '#070a11',
          }}
        >
          <TableMap compact={true} onSelectTable={(tableId) => setActiveTableId(tableId)} />
        </div>

        {/* Panel 2: Tables bill รายการอาหารที่สั่ง (33% width, min 320px, max 420px) */}
        <div
          style={{
            width: '33%',
            minWidth: 320,
            maxWidth: 420,
            height: '100%',
            borderRight: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: 'var(--color-bg-card)',
          }}
        >
          <OrderPanel hideMenuToggle={true} />
        </div>

        {/* Panel 3: Menu One-click add to table (Remaining width, min 380px) */}
        <div
          style={{
            flex: 1,
            minWidth: 380,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: 'var(--color-bg-main)',
          }}
        >
          <MenuCatalog
            onSelectItem={(item) => {
              if (!activeTableId && tables.length > 0) {
                setActiveTableId(tables[0].id);
              }
              quickAddItemToOrder(item);
            }}
            onCustomizeItem={handleCustomizeItem}
          />
        </div>
      </div>
    </div>
  );
};

