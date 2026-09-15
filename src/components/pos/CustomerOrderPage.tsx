import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  Utensils,
  ShoppingBag,
  CheckCircle2,
  Plus,
  Minus,
  Trash2,
  Clock,
  Flame,
  X,
  Lock,
  Receipt,
  Check,
  CreditCard,
  Store,
} from 'lucide-react';
import type { MenuItem, SelectedModifier, OrderItem } from '../../types/pos';
import confetti from 'canvas-confetti';

interface DraftCartItem {
  menuItem: MenuItem;
  quantity: number;
  modifiers: SelectedModifier[];
  instructions?: string;
  itemTotal: number;
}

export const CustomerOrderPage: React.FC = () => {
  const {
    menuItems,
    categories,
    modifierGroups,
    tables,
    orders,
    addItemToOrder,
    settings,
    language,
  } = usePOS();

  // Extract URL Parameters
  const searchParams = new URLSearchParams(window.location.search);
  const tableParam = searchParams.get('table') || 't-2';
  const tableCodeParam = searchParams.get('code') || 'A2';
  const tsParam = searchParams.get('ts') || Date.now().toString();

  // Active Navigation Tab: 'menu' | 'cart' | 'status'
  const [activeCustomerTab, setActiveCustomerTab] = useState<'menu' | 'cart' | 'status'>('menu');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [draftCart, setDraftCart] = useState<DraftCartItem[]>([]);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  // Modifier Customization Modal State
  const [customizeItem, setCustomizeItem] = useState<MenuItem | null>(null);
  const [selectedMods, setSelectedMods] = useState<Record<string, string>>({});
  const [instructions, setInstructions] = useState<string>('');
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);

  // 1. Session Expiry Check (3 hours = 10,800,000 ms)
  const sessionTimestamp = parseInt(tsParam, 10) || Date.now();
  const sessionAgeMs = Date.now() - sessionTimestamp;
  const isSessionExpired = sessionAgeMs > 3 * 60 * 60 * 1000;

  // 2. Paid Order Lockout Check
  // Find order associated with this table
  const tableObj = tables.find((t) => t.id === tableParam || t.number === tableCodeParam);
  const tableId = tableObj ? tableObj.id : tableParam;

  const currentOrder = Object.values(orders).find(
    (o) => o.tableId === tableId && (o.status === 'active' || o.status === 'completed')
  );

  // If table exists and its latest order is marked 'completed' (paid by POS), OR table status is open with no active order after payment:
  const isOrderPaid = currentOrder ? currentOrder.status === 'completed' : false;

  // Items already sent to kitchen for this table
  const sentItems: OrderItem[] = currentOrder && currentOrder.status === 'active' ? currentOrder.items : [];

  // Filter menu items by category
  const filteredItems = menuItems.filter(
    (item) => selectedCategory === 'all' || item.categoryId === selectedCategory
  );

  // Quick 1-click Add to Draft Cart
  const handleQuickAdd = (item: MenuItem) => {
    if (!item.inStock) return;
    
    // Check if item has single-type required modifiers
    const itemGroups = modifierGroups.filter((g) => item.modifierGroupIds.includes(g.id));
    const hasRequiredMods = itemGroups.some((g) => g.required || g.type === 'single');

    if (hasRequiredMods && !customizeItem) {
      // Open customization modal for modifier selection
      setCustomizeItem(item);
      const defaultMods: Record<string, string> = {};
      itemGroups.forEach((g) => {
        const def = g.options.find((o) => o.isDefault) || g.options[0];
        if (def) defaultMods[g.id] = def.id;
      });
      setSelectedMods(defaultMods);
      setInstructions('');
      return;
    }

    // Direct add default
    const defaultModifiersList: SelectedModifier[] = [];
    itemGroups.forEach((g) => {
      const def = g.options.find((o) => o.isDefault) || g.options[0];
      if (def) {
        defaultModifiersList.push({
          groupId: g.id,
          groupNameTh: g.nameTh,
          groupNameEn: g.nameEn,
          optionId: def.id,
          optionNameTh: def.nameTh,
          optionNameEn: def.nameEn,
          priceDelta: def.priceDelta,
        });
      }
    });

    const modDelta = defaultModifiersList.reduce((sum, m) => sum + m.priceDelta, 0);

    setDraftCart((prev) => {
      const existingIdx = prev.findIndex(
        (c) => c.menuItem.id === item.id && c.modifiers.length === defaultModifiersList.length
      );
      if (existingIdx >= 0) {
        return prev.map((c, idx) =>
          idx === existingIdx
            ? { ...c, quantity: c.quantity + 1, itemTotal: (c.menuItem.price + modDelta) * (c.quantity + 1) }
            : c
        );
      }
      return [
        ...prev,
        {
          menuItem: item,
          quantity: 1,
          modifiers: defaultModifiersList,
          itemTotal: item.price + modDelta,
        },
      ];
    });

    setJustAddedId(item.id);
    setTimeout(() => setJustAddedId(null), 600);
  };

  // Add customized item from modal to cart
  const handleConfirmCustomize = () => {
    if (!customizeItem) return;
    const itemGroups = modifierGroups.filter((g) => customizeItem.modifierGroupIds.includes(g.id));
    const chosenModsList: SelectedModifier[] = [];

    itemGroups.forEach((group) => {
      const selectedOptId = selectedMods[group.id];
      const opt = group.options.find((o) => o.id === selectedOptId);
      if (opt) {
        chosenModsList.push({
          groupId: group.id,
          groupNameTh: group.nameTh,
          groupNameEn: group.nameEn,
          optionId: opt.id,
          optionNameTh: opt.nameTh,
          optionNameEn: opt.nameEn,
          priceDelta: opt.priceDelta,
        });
      }
    });

    const modDelta = chosenModsList.reduce((sum, m) => sum + m.priceDelta, 0);

    setDraftCart((prev) => [
      ...prev,
      {
        menuItem: customizeItem,
        quantity: 1,
        modifiers: chosenModsList,
        instructions,
        itemTotal: customizeItem.price + modDelta,
      },
    ]);

    setCustomizeItem(null);
    setJustAddedId(customizeItem.id);
    setTimeout(() => setJustAddedId(null), 600);
  };

  // Update Cart Quantity
  const updateDraftQty = (index: number, delta: number) => {
    setDraftCart((prev) =>
      prev
        .map((c, idx) => {
          if (idx === index) {
            const newQty = c.quantity + delta;
            if (newQty <= 0) return null;
            const modDelta = c.modifiers.reduce((sum, m) => sum + m.priceDelta, 0);
            return {
              ...c,
              quantity: newQty,
              itemTotal: (c.menuItem.price + modDelta) * newQty,
            };
          }
          return c;
        })
        .filter(Boolean) as DraftCartItem[]
    );
  };

  // Total calculation for customer draft cart
  const draftSubtotal = draftCart.reduce((sum, c) => sum + c.itemTotal, 0);
  const cartItemCount = draftCart.reduce((sum, c) => sum + c.quantity, 0);

  // Submit Customer Order to POS & Kitchen Display
  const handleConfirmOrderToKitchen = () => {
    if (draftCart.length === 0) return;

    // Dispatch all items to POSContext specifically for this tableId
    draftCart.forEach((draft) => {
      addItemToOrder(draft.menuItem, draft.modifiers, draft.instructions, draft.quantity, tableId);
    });

    // Clear draft cart & trigger celebration
    setDraftCart([]);
    setShowOrderSuccess(true);
    confetti({
      particleCount: 70,
      spread: 80,
      origin: { y: 0.5 },
    });

    setTimeout(() => {
      setShowOrderSuccess(false);
      setActiveCustomerTab('status');
    }, 2000);
  };

  // ---------------------------------------------------------------------------
  // SCREEN 1: Paid Order Lockout (ป้องกันการสั่งซ้ำซ้อนเมื่อจ่ายเงินแล้ว)
  // ---------------------------------------------------------------------------
  if (isOrderPaid) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'radial-gradient(circle at 50% 20%, #1e293b 0%, #090d16 100%)',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          textAlign: 'center',
          fontFamily: 'var(--font-sans)',
        }}
      >
        <div
          style={{
            background: 'var(--color-bg-card)',
            border: '1.5px solid rgba(16, 185, 129, 0.4)',
            borderRadius: 'var(--radius-xl)',
            maxWidth: 420,
            width: '100%',
            padding: 28,
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.18)',
              border: '2px solid var(--color-emerald)',
              color: 'var(--color-emerald)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle2 size={36} />
          </div>

          <div>
            <div style={{ fontSize: 13, color: 'var(--color-emerald)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
              Payment Completed
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginTop: 4 }}>
              ชำระเงินเรียบร้อยแล้ว
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 8, lineHeight: 1.5 }}>
              บิลรายการอาหารของ <strong style={{ color: 'var(--color-primary)' }}>โต๊ะ {tableCodeParam}</strong> ได้รับการเช็กบิลชำระเงินเรียบร้อยแล้ว
            </p>
          </div>

          <div
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px dashed var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: 12,
              fontSize: 12,
              color: 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              textAlign: 'left',
            }}
          >
            <Lock size={18} style={{ flexShrink: 0, color: 'var(--color-primary)' }} />
            <span>
              QR Code รอบนี้เสร็จสิ้นการใช้งานแล้วเพื่อป้องกันการกดสั่งอาหารซ้ำซ้อน หากต้องการสั่งเพิ่ม กรุณาแจ้งพนักงานเพื่อเปิดโต๊ะใหม่
            </span>
          </div>

          <button
            onClick={() => (window.location.href = '/')}
            style={{
              marginTop: 8,
              width: '100%',
              padding: '12px 20px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            กลับสู่หน้าหลัก POS
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // SCREEN 2: Session Expired Screen (QR หมดอายุ)
  // ---------------------------------------------------------------------------
  if (isSessionExpired) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#090d16',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            background: 'var(--color-bg-card)',
            border: '1.5px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 'var(--radius-xl)',
            maxWidth: 400,
            width: '100%',
            padding: 28,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '2px solid #ef4444',
              color: '#f87171',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Clock size={32} />
          </div>

          <div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>
              QR Code หมดอายุการใช้งาน
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 6, lineHeight: 1.5 }}>
              รหัสสั่งอาหารของ โต๊ะ {tableCodeParam} หมดอายุการสั่ง (จำกัด 3 ชม.) กรุณาแจ้งพนักงานเพื่อพิมพ์สลิป QR ใหม่อีกครั้ง
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // SCREEN 3: Active Customer Mobile Self-Ordering Workspace
  // ---------------------------------------------------------------------------
  return (
    <div
      style={{
        minHeight: '100vh',
        maxWidth: 480,
        margin: '0 auto',
        background: 'var(--color-bg-main)',
        color: 'var(--color-text-primary)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        boxShadow: '0 0 50px rgba(0,0,0,0.8)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Mobile Top Header */}
      <header
        style={{
          padding: '12px 16px',
          background: 'var(--color-bg-card)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              padding: '4px 10px',
              borderRadius: 8,
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.12))',
              border: '1.5px solid var(--color-primary)',
              color: 'var(--color-primary)',
              fontWeight: 900,
              fontSize: 14,
            }}
          >
            โต๊ะ {tableCodeParam}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>
              {settings.restaurantNameTh}
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>
              {settings.branchName} • สั่งอาหารด้วยตัวเอง
            </div>
          </div>
        </div>

        {/* Live Status indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#10b981', fontWeight: 700 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
          <span>พร้อมสั่ง</span>
        </div>
      </header>

      {/* Order Success Toast Banner */}
      {showOrderSuccess && (
        <div
          style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: '#fff',
            padding: '10px 16px',
            fontSize: 13,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
          }}
        >
          <CheckCircle2 size={18} />
          <span>ออเดอร์ส่งเข้าครัวเรียบร้อยแล้ว! พนักงานกำลังปรุงอาหารให้คุณ</span>
        </div>
      )}

      {/* Main Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
        {/* TAB 1: Menu Catalog */}
        {activeCustomerTab === 'menu' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Category Filter Pills */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                overflowX: 'auto',
                padding: '10px 14px',
                background: 'var(--color-bg-card)',
                borderBottom: '1px solid var(--color-border)',
                scrollbarWidth: 'none',
              }}
            >
              <button
                onClick={() => setSelectedCategory('all')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid ' + (selectedCategory === 'all' ? 'var(--color-primary)' : 'var(--color-border)'),
                  background: selectedCategory === 'all' ? 'rgba(245, 158, 11, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                  color: selectedCategory === 'all' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  fontSize: 12,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                }}
              >
                🍽️ ทุกเมนู
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid ' + (selectedCategory === cat.id ? 'var(--color-primary)' : 'var(--color-border)'),
                    background: selectedCategory === cat.id ? 'rgba(245, 158, 11, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                    color: selectedCategory === cat.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    fontSize: 12,
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                  }}
                >
                  {cat.icon} {language === 'th' ? cat.nameTh : cat.nameEn}
                </button>
              ))}
            </div>

            {/* Menu Items Grid */}
            <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredItems.map((item) => {
                const isJustAdded = justAddedId === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleQuickAdd(item)}
                    style={{
                      background: 'var(--color-bg-elevated)',
                      borderRadius: 'var(--radius-md)',
                      border: isJustAdded ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                      padding: 10,
                      display: 'flex',
                      gap: 12,
                      alignItems: 'center',
                      cursor: item.inStock ? 'pointer' : 'not-allowed',
                      opacity: item.inStock ? 1 : 0.55,
                      position: 'relative',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {/* Item Thumbnail */}
                    <div style={{ width: 70, height: 70, borderRadius: 10, overflow: 'hidden', background: '#1e293b', flexShrink: 0, position: 'relative' }}>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.nameTh} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 28 }}>🍽️</div>
                      )}
                    </div>

                    {/* Item Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
                        {language === 'th' ? item.nameTh : item.nameEn}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                        {item.descriptionTh || item.descriptionEn || 'สูตรเด็ดประจำร้าน'}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                        ฿{item.price}
                      </div>
                    </div>

                    {/* Add Button */}
                    <button
                      disabled={!item.inStock}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        background: isJustAdded ? 'var(--color-primary)' : 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid var(--color-primary)',
                        color: isJustAdded ? '#000' : 'var(--color-primary)',
                        fontWeight: 900,
                        fontSize: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        flexShrink: 0,
                      }}
                    >
                      {isJustAdded ? <Check size={14} /> : <Plus size={14} />}
                      <span>{isJustAdded ? 'เพิ่มแล้ว' : 'เพิ่ม'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: Draft Cart & Confirm Order to Kitchen */}
        {activeCustomerTab === 'cart' && (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShoppingBag size={18} style={{ color: 'var(--color-primary)' }} />
              <span>รายการอาหารที่เลือก (รอส่งเข้าครัว)</span>
            </h3>

            {draftCart.length === 0 ? (
              <div
                style={{
                  background: 'var(--color-bg-card)',
                  borderRadius: 'var(--radius-md)',
                  padding: 36,
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                  color: 'var(--color-text-muted)',
                }}
              >
                <Utensils size={40} />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>ยังไม่มีรายการอาหารในตะกร้า</div>
                <p style={{ fontSize: 12 }}>กดเลือกเมนูอาหารที่ต้องการ แล้วมากดยืนยันส่งเข้าครัวที่นี่</p>
                <button
                  onClick={() => setActiveCustomerTab('menu')}
                  style={{
                    marginTop: 8,
                    padding: '8px 18px',
                    borderRadius: 8,
                    background: 'var(--color-primary)',
                    border: 'none',
                    color: '#000',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  เลือกเมนูอาหาร
                </button>
              </div>
            ) : (
              <>
                {/* Draft Items List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {draftCart.map((draft, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'var(--color-bg-elevated)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        padding: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                            {language === 'th' ? draft.menuItem.nameTh : draft.menuItem.nameEn}
                          </div>
                          {draft.modifiers.length > 0 && (
                            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                              {draft.modifiers.map((m) => (language === 'th' ? m.optionNameTh : m.optionNameEn)).join(', ')}
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                          ฿{draft.itemTotal.toLocaleString()}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px dashed rgba(255,255,255,0.08)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button
                            onClick={() => updateDraftQty(idx, -1)}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 6,
                              background: 'var(--color-bg-card)',
                              border: '1px solid var(--color-border)',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Minus size={14} />
                          </button>
                          <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                            {draft.quantity}
                          </span>
                          <button
                            onClick={() => updateDraftQty(idx, 1)}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 6,
                              background: 'var(--color-bg-card)',
                              border: '1px solid var(--color-border)',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <button
                          onClick={() => updateDraftQty(idx, -draft.quantity)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#f87171',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Trash2 size={14} /> ลบ
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotal Summary Box */}
                <div
                  style={{
                    background: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--color-text-secondary)' }}>
                    <span>ยอดรวมรายการนี้ ({cartItemCount} ชิ้น)</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>฿{draftSubtotal.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 900, color: '#fff', paddingTop: 6, borderTop: '1px solid var(--color-border)' }}>
                    <span>รวมสุทธิ</span>
                    <span style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>฿{draftSubtotal.toLocaleString()}</span>
                  </div>
                </div>

                {/* Main Action: CONFIRM ORDER TO KITCHEN */}
                <button
                  onClick={handleConfirmOrderToKitchen}
                  style={{
                    padding: '14px 20px',
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    border: 'none',
                    color: '#000',
                    fontSize: 16,
                    fontWeight: 900,
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(245, 158, 11, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    marginTop: 8,
                  }}
                >
                  <Flame size={20} />
                  <span>ยืนยันสั่งอาหารส่งเข้าครัว (Send Order)</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* TAB 3: รายการบิลรอชำระ (Bill Items Awaiting Payment) */}
        {activeCustomerTab === 'status' && (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Receipt size={18} style={{ color: 'var(--color-primary)' }} />
              <span>รายการบิลรอชำระ (โต๊ะ {tableCodeParam})</span>
            </h3>

            {sentItems.length === 0 ? (
              <div
                style={{
                  background: 'var(--color-bg-card)',
                  borderRadius: 'var(--radius-md)',
                  padding: 30,
                  textAlign: 'center',
                  color: 'var(--color-text-muted)',
                  fontSize: 13,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Receipt size={32} />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>ยังไม่มีรายการบิลรอชำระสำหรับโต๊ะนี้</div>
                <p style={{ fontSize: 12 }}>เมื่อเลือกอาหารแล้วกดยืนยันส่งเข้าครัว รายการบิลรอชำระจะแสดงที่นี่</p>
              </div>
            ) : (
              <>
                {/* Cashier Payment Instruction Card */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.08))',
                    border: '1.5px solid var(--color-primary)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    boxShadow: '0 4px 14px rgba(245, 158, 11, 0.2)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-primary)', fontWeight: 800, fontSize: 14 }}>
                    <CreditCard size={18} />
                    <span>คำแนะนำการชำระเงินที่เคาน์เตอร์แคชเชียร์</span>
                  </div>
                  <p style={{ fontSize: 12.5, color: '#fff', lineHeight: 1.5 }}>
                    เมื่อรับประทานอาหารเสร็จเรียบร้อยแล้ว กรุณาแจ้งหมายเลข <strong style={{ color: 'var(--color-primary)' }}>โต๊ะ {tableCodeParam}</strong> ที่เคาน์เตอร์ชำระเงิน (Cashier Counter) เพื่อชำระเงินด้วยเงินสด หรือสแกน QR Code โอนผ่าน PromptPay
                  </p>
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 5, paddingTop: 4, borderTop: '1px dashed rgba(245, 158, 11, 0.3)' }}>
                    <Store size={13} />
                    <span>ขอบคุณที่ใช้บริการ {settings.restaurantNameTh} ({settings.branchName})</span>
                  </div>
                </div>

                {/* List of Bill Items Awaiting Payment */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text-secondary)' }}>
                    รายการอาหารที่สั่งทั้งหมด ({sentItems.length} รายการ):
                  </div>

                  {sentItems.map((item) => {
                    const menuItemObj = menuItems.find((m) => m.id === item.menuItemId);
                    const itemImageUrl = item.imageUrl || menuItemObj?.imageUrl;

                    return (
                      <div
                        key={item.id}
                        style={{
                          background: 'var(--color-bg-elevated)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-md)',
                          padding: 10,
                          display: 'flex',
                          gap: 10,
                          alignItems: 'center',
                        }}
                      >
                        {/* Thumbnail Image */}
                        {itemImageUrl ? (
                          <img
                            src={itemImageUrl}
                            alt={language === 'th' ? item.nameTh : item.nameEn}
                            style={{
                              width: 42,
                              height: 42,
                              borderRadius: 8,
                              objectFit: 'cover',
                              flexShrink: 0,
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 42,
                              height: 42,
                              borderRadius: 8,
                              background: 'rgba(255, 255, 255, 0.06)',
                              border: '1px solid var(--color-border)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 20,
                              flexShrink: 0,
                            }}
                          >
                            🍽️
                          </div>
                        )}

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                              {item.quantity}x {language === 'th' ? item.nameTh : item.nameEn}
                            </span>
                            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                              ฿{item.itemTotal.toLocaleString()}
                            </span>
                          </div>

                          {item.modifiers.length > 0 && (
                            <div style={{ fontSize: 10.5, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                              {item.modifiers.map((m) => (language === 'th' ? m.optionNameTh : m.optionNameEn)).join(', ')}
                            </div>
                          )}
                        </div>

                        <div
                          style={{
                            padding: '3px 8px',
                            borderRadius: 10,
                            fontSize: 10,
                            fontWeight: 800,
                            background:
                              item.status === 'served'
                                ? 'rgba(16, 185, 129, 0.2)'
                                : 'rgba(245, 158, 11, 0.2)',
                            color: item.status === 'served' ? '#10b981' : '#f59e0b',
                            border:
                              item.status === 'served'
                                ? '1px solid #10b981'
                                : '1px solid #f59e0b',
                            flexShrink: 0,
                          }}
                        >
                          {item.status === 'served' ? 'เสิร์ฟแล้ว' : 'กำลังปรุง'}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bill Financial Totals Summary Box */}
                {currentOrder && (
                  <div
                    style={{
                      background: 'var(--color-bg-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: 14,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      <span>ยอดรวมอาหาร (Subtotal)</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>฿{currentOrder.subtotal.toLocaleString()}</span>
                    </div>

                    {settings.enableServiceCharge && currentOrder.serviceChargeAmount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-text-secondary)' }}>
                        <span>Service Charge ({Math.round(settings.serviceChargeRate * 100)}%)</span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>฿{currentOrder.serviceChargeAmount.toLocaleString()}</span>
                      </div>
                    )}

                    {settings.enableVat && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-muted)' }}>
                        <span>VAT ({Math.round(settings.vatRate * 100)}%)</span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>฿{currentOrder.vatAmount.toLocaleString()}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 6, marginTop: 2, borderTop: '1px dashed var(--color-border)' }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>ยอดรวมสุทธิที่ต้องชำระ (Total Due)</span>
                      <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                        ฿{currentOrder.grandTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Bottom Sticky Mobile Navigation Bar */}
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 480,
          background: 'var(--color-bg-card)',
          borderTop: '1px solid var(--color-border)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          padding: '8px 0',
          zIndex: 50,
        }}
      >
        <button
          onClick={() => setActiveCustomerTab('menu')}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeCustomerTab === 'menu' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <Utensils size={18} />
          <span>เมนูอาหาร</span>
        </button>

        <button
          onClick={() => setActiveCustomerTab('cart')}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeCustomerTab === 'cart' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          <div style={{ position: 'relative' }}>
            <ShoppingBag size={18} />
            {cartItemCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -5,
                  right: -8,
                  background: 'var(--color-primary)',
                  color: '#000',
                  fontSize: 10,
                  fontWeight: 900,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {cartItemCount}
              </span>
            )}
          </div>
          <span>รายการสั่ง</span>
        </button>

        <button
          onClick={() => setActiveCustomerTab('status')}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeCustomerTab === 'status' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <Receipt size={18} />
          <span>รายการบิลรอชำระ</span>
        </button>
      </nav>

      {/* Modifier Customization Modal */}
      {customizeItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'flex-end',
            zIndex: 100,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 480,
              margin: '0 auto',
              background: 'var(--color-bg-card)',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              maxHeight: '80vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>
                เลือกตัวเลือก: {language === 'th' ? customizeItem.nameTh : customizeItem.nameEn}
              </h3>
              <button
                onClick={() => setCustomizeItem(null)}
                style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modifier Groups */}
            {modifierGroups
              .filter((g) => customizeItem.modifierGroupIds.includes(g.id))
              .map((group) => (
                <div key={group.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)' }}>
                    {language === 'th' ? group.nameTh : group.nameEn}
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {group.options.map((opt) => {
                      const isSelected = selectedMods[group.id] === opt.id;

                      return (
                        <button
                          key={opt.id}
                          onClick={() => setSelectedMods((prev) => ({ ...prev, [group.id]: opt.id }))}
                          style={{
                            padding: '10px 14px',
                            borderRadius: 8,
                            background: isSelected ? 'rgba(245, 158, 11, 0.18)' : 'var(--color-bg-elevated)',
                            border: '1px solid ' + (isSelected ? 'var(--color-primary)' : 'var(--color-border)'),
                            color: isSelected ? 'var(--color-primary)' : '#fff',
                            fontSize: 13,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                          }}
                        >
                          <span>{language === 'th' ? opt.nameTh : opt.nameEn}</span>
                          <span>{opt.priceDelta > 0 ? `+฿${opt.priceDelta}` : ''}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

            <button
              onClick={handleConfirmCustomize}
              style={{
                marginTop: 10,
                padding: '12px 20px',
                borderRadius: 10,
                background: 'var(--color-primary)',
                border: 'none',
                color: '#000',
                fontSize: 14,
                fontWeight: 900,
                cursor: 'pointer',
              }}
            >
              ตกลงเพิ่มลงรายการ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
