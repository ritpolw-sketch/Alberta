import React, { useEffect, useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { TableMap } from './TableMap';
import { OrderPanel } from './OrderPanel';
import { MenuCatalog } from './MenuCatalog';
import { BillLogs } from '../admin/BillLogs';
import { ShiftManagePage } from '../admin/ShiftManagePage';
import {
  Receipt,
  History,
  Clock,
} from 'lucide-react';
import type { MenuItem } from '../../types/pos';

interface FlyingItem {
  instanceId: string;
  imageUrl?: string;
  nameTh: string;
  nameEn: string;
  price: number;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  deltaX: number;
  deltaY: number;
}

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
    adminSubTab,
    setAdminSubTab,
  } = usePOS();

  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
  const [isCartPulsing, setIsCartPulsing] = useState(false);
  const [subTab, setSubTab] = useState<'pos' | 'bills' | 'shifts'>(
    adminSubTab === 'bills' ? 'bills' : adminSubTab === 'shifts' ? 'shifts' : 'pos'
  );

  useEffect(() => {
    if (adminSubTab === 'bills') {
      setSubTab('bills');
    } else if (adminSubTab === 'shifts') {
      setSubTab('shifts');
    }
  }, [adminSubTab]);

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

  const handleCustomizeItem = (item: MenuItem) => {
    setSelectedItemForModifier(item);
    setActiveModal('modifier');
  };

  const triggerFlyToCart = (item: MenuItem, cardRect?: DOMRect) => {
    let startX = 500;
    let startY = 300;
    let startWidth = 110;
    let startHeight = 90;

    if (cardRect) {
      startX = cardRect.left;
      startY = cardRect.top;
      startWidth = cardRect.width;
      startHeight = cardRect.height;
    } else {
      const cardEl = document.querySelector(`[data-item-id="${item.id}"]`);
      if (cardEl) {
        const rect = cardEl.getBoundingClientRect();
        startX = rect.left;
        startY = rect.top;
        startWidth = rect.width;
        startHeight = rect.height;
      }
    }

    const targetEl = document.getElementById('pos-order-panel-target');
    let targetX = window.innerWidth * 0.35;
    let targetY = 160;

    if (targetEl) {
      const tRect = targetEl.getBoundingClientRect();
      targetX = tRect.left + Math.min(tRect.width / 2, 140);
      targetY = tRect.top + 100;
    }

    const deltaX = targetX - startX;
    const deltaY = targetY - startY;
    const instanceId = `${item.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const newFly: FlyingItem = {
      instanceId,
      imageUrl: item.imageUrl,
      nameTh: item.nameTh,
      nameEn: item.nameEn,
      price: item.price,
      startX,
      startY,
      startWidth,
      startHeight,
      deltaX,
      deltaY,
    };

    setFlyingItems((prev) => [...prev, newFly]);

    // Trigger cart bounce pulse when item lands (~450ms)
    setTimeout(() => {
      setIsCartPulsing(true);
      setTimeout(() => setIsCartPulsing(false), 380);
    }, 450);

    // Remove flying instance when animation finishes (~550ms)
    setTimeout(() => {
      setFlyingItems((prev) => prev.filter((f) => f.instanceId !== instanceId));
    }, 550);
  };

  const handleSelectItem = (item: MenuItem, cardRect?: DOMRect) => {
    if (!activeTableId && tables.length > 0) {
      setActiveTableId(tables[0].id);
    }
    triggerFlyToCart(item, cardRect);
    quickAddItemToOrder(item);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
      {/* Flying Menu Items Micro-interaction Layer */}
      {flyingItems.map((fly) => (
        <div
          key={fly.instanceId}
          className="flying-menu-item"
          style={{
            left: fly.startX,
            top: fly.startY,
            width: fly.startWidth || 100,
            height: fly.startHeight || 90,
            '--fly-x': `${fly.deltaX}px`,
            '--fly-y': `${fly.deltaY}px`,
          } as React.CSSProperties}
        >
          {fly.imageUrl ? (
            <img
              src={fly.imageUrl}
              alt={fly.nameTh}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                fontSize: 32,
                background: 'var(--color-bg-card)',
              }}
            >
              🍽️
            </div>
          )}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'rgba(9, 13, 22, 0.88)',
              color: 'var(--color-primary)',
              fontSize: 10,
              fontWeight: 800,
              padding: '2px 4px',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              borderTop: '1px solid rgba(245, 158, 11, 0.4)',
            }}
          >
            +1 ฿{fly.price}
          </div>
        </div>
      ))}

      {/* Quick Navigation Bar: รายการสั่ง, บิลย้อนหลัง, จัดการกะ */}
      <div
        style={{
          padding: '6px 14px',
          background: 'var(--color-bg-card)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          zIndex: 10,
          minHeight: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* 1. รายการสั่ง */}
          <button
            onClick={() => {
              setSubTab('pos');
              setAdminSubTab('dashboard');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 8,
              border: subTab === 'pos' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--color-border)',
              background: subTab === 'pos' ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.1))' : 'rgba(255, 255, 255, 0.04)',
              color: subTab === 'pos' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Receipt size={15} />
            <span>{language === 'th' ? 'รายการสั่ง' : 'POS Order'}</span>
          </button>

          {/* 2. บิลย้อนหลัง */}
          <button
            onClick={() => {
              setSubTab('bills');
              setAdminSubTab('bills');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 8,
              border: subTab === 'bills' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--color-border)',
              background: subTab === 'bills' ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.1))' : 'rgba(255, 255, 255, 0.04)',
              color: subTab === 'bills' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <History size={15} />
            <span>{language === 'th' ? 'บิลย้อนหลัง' : 'Bill History'}</span>
          </button>

          {/* 3. จัดการกะ */}
          <button
            onClick={() => {
              setSubTab('shifts');
              setAdminSubTab('shifts');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 8,
              border: subTab === 'shifts' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--color-border)',
              background: subTab === 'shifts' ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.1))' : 'rgba(255, 255, 255, 0.04)',
              color: subTab === 'shifts' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Clock size={15} />
            <span>{language === 'th' ? 'จัดการกะ' : 'Shift Management'}</span>
          </button>
        </div>

        {/* Right side active table indicator */}
        {activeTable && (
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--color-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid var(--color-border)',
            }}
          >
            <span style={{ color: 'var(--color-primary)', fontWeight: 800 }}>
              {language === 'th' ? `โต๊ะ ${activeTable.number}` : `Table ${activeTable.number}`}
            </span>
          </div>
        )}
      </div>

      {/* Dynamic Sub-Tab View Rendering */}
      {subTab === 'pos' && (
        <div
          className="pos-3panel-container"
          style={{
            flex: 1,
            display: 'flex',
            overflow: 'hidden',
            width: '100%',
            height: '100%',
          }}
        >
          {/* Panel 1: Tables blocks ผังโต๊ะ (~26% width, 260px-300px) */}
          <div
            style={{
              width: '26%',
              minWidth: 260,
              maxWidth: 300,
              height: '100%',
              borderRight: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              background: '#070a11',
              flexShrink: 0,
            }}
          >
            <TableMap compact={true} onSelectTable={(tableId) => setActiveTableId(tableId)} />
          </div>

          {/* Panel 2: Tables bill รายการอาหารที่สั่ง (~33% width, 320px-380px) */}
          <div
            id="pos-order-panel-target"
            className={isCartPulsing ? 'cart-bounce-pulse' : ''}
            style={{
              width: '33%',
              minWidth: 320,
              maxWidth: 380,
              height: '100%',
              borderRight: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              background: 'var(--color-bg-card)',
              flexShrink: 0,
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            }}
          >
            <OrderPanel hideMenuToggle={true} />
          </div>

          {/* Panel 3: Menu One-click add to table (Remaining width, min 350px) */}
          <div
            style={{
              flex: 1,
              minWidth: 350,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              background: 'var(--color-bg-main)',
            }}
          >
            <MenuCatalog
              onSelectItem={handleSelectItem}
              onCustomizeItem={handleCustomizeItem}
            />
          </div>
        </div>
      )}

      {subTab === 'bills' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', background: 'var(--color-bg-base)' }}>
          <BillLogs />
        </div>
      )}

      {subTab === 'shifts' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', background: 'var(--color-bg-base)' }}>
          <ShiftManagePage />
        </div>
      )}
    </div>
  );
};
