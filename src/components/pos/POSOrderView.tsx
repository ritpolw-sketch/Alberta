import React, { useEffect, useState } from 'react';
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
  } = usePOS();

  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
  const [isCartPulsing, setIsCartPulsing] = useState(false);

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
    </div>
  );
};
