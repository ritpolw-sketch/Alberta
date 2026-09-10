import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  Printer,
  Trash2,
  Plus,
  Minus,
  Utensils,
  Banknote,
  QrCode,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MenuCatalog } from './MenuCatalog';
import type { MenuItem, Order, RestaurantSettings } from '../../types/pos';

interface OrderPanelProps {
  hideMenuToggle?: boolean;
}

export const OrderPanel: React.FC<OrderPanelProps> = ({ hideMenuToggle = false }) => {
  const {
    tables,
    activeTableId,
    activeOrder,
    updateOrderItemQuantity,
    removeOrderItem,
    settings,
    language,
    addItemToOrder,
    processPayment,
    currentStaff,
  } = usePOS();

  const [catalogView, setCatalogView] = useState<'menu' | 'cart'>('cart');
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [cashTendered, setCashTendered] = useState<string>('');
  const [isPaying, setIsPaying] = useState(false);

  const activeTable = tables.find((t) => t.id === activeTableId);

  const handleSelectItem = (item: MenuItem) => {
    addItemToOrder(item, []);
  };

  // Direct print receipt without modal
  const handleDirectPrintReceipt = () => {
    if (!activeOrder) return;
    triggerDirectPrint(activeOrder, settings, currentStaff?.name || 'Cashier');
  };

  // 1-Click Pay via Transfer (โอนเงิน)
  const handleTransferPayment = async () => {
    if (!activeOrder || isPaying) return;
    setIsPaying(true);
    try {
      await processPayment({
        orderId: activeOrder.id,
        method: 'promptpay',
        amount: activeOrder.grandTotal,
        promptpayRef: `TR-${Date.now().toString().slice(-6)}`,
      });
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error('Payment transfer error:', err);
    } finally {
      setIsPaying(false);
    }
  };

  // Open Cash Modal with exact amount as default
  const openCashModal = () => {
    if (!activeOrder) return;
    setCashTendered(activeOrder.grandTotal.toString());
    setIsCashModalOpen(true);
  };

  // Confirm Cash Payment
  const handleConfirmCashPayment = async () => {
    if (!activeOrder || isPaying) return;
    const numCash = parseFloat(cashTendered) || 0;
    if (numCash < activeOrder.grandTotal) return;

    setIsPaying(true);
    try {
      await processPayment({
        orderId: activeOrder.id,
        method: 'cash',
        amount: activeOrder.grandTotal,
        cashReceived: numCash,
        cashChange: Math.max(0, numCash - activeOrder.grandTotal),
      });
      setIsCashModalOpen(false);
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error('Cash payment error:', err);
    } finally {
      setIsPaying(false);
    }
  };

  if (!activeTable) {
    return (
      <div
        className="order-taking-panel"
        style={{
          width: '100%',
          minWidth: 0,
          maxWidth: '100%',
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          textAlign: 'center',
        }}
      >
        <Utensils size={40} style={{ color: 'var(--color-text-muted)', marginBottom: 12 }} />
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-secondary)' }}>
          {language === 'th' ? 'กรุณาเลือกโต๊ะ' : 'Please select a table'}
        </h3>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
          {language === 'th' ? 'เลือกโต๊ะทางด้านซ้ายเพื่อเปิดบิลหรือสั่งอาหาร' : 'Select a table on the left to start an order'}
        </p>
      </div>
    );
  }

  const items = activeOrder?.items || [];
  const pendingCount = items.filter((i) => i.status === 'pending').length;
  const numCash = parseFloat(cashTendered) || 0;
  const isCashInsufficient = activeOrder ? numCash < activeOrder.grandTotal : false;

  return (
    <div
      className="order-taking-panel"
      style={{
        width: '100%',
        minWidth: 0,
        maxWidth: '100%',
        flex: 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Table Header */}
      <div
        style={{
          padding: '14px 18px',
          background: 'var(--color-bg-elevated)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 64,
              height: 40,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.1))',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)',
              fontSize: 18,
              fontWeight: 800,
            }}
          >
            {language === 'th' ? 'โต๊ะ ' : 'Table '}
            {activeTable.number}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  fontSize: 16,
                  padding: '2px 6px',
                  borderRadius: 4,
                  color: 'var(--color-primary)',
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                }}
              >
                {language === 'th' ? 'รายการที่สั่ง' : 'Bill'}
              </span>
              {activeOrder && items.length > 0 && (
                <button
                  onClick={handleDirectPrintReceipt}
                  className="btn-secondary"
                  style={{
                    flex: pendingCount > 0 ? 'none' : 1,
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'right',
                    justifyContent: 'right',
                    gap: 6,
                  }}
                  title={language === 'th' ? 'พิมพ์ใบเรียกเก็บเงินทันที (ไม่มี Modal)' : 'Print bill directly'}
                >
                  <Printer size={16} />
                  <span>{language === 'th' ? 'พิมพ์บิล' : 'Print Pre-Bill'}</span>
                </button>
              )}

            </div>
          </div>
        </div>

        {/* Toggle between Menu Catalog & Cart (only when menu is not displayed side-by-side) */}
        {!hideMenuToggle && (
          <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.6)', padding: 3, borderRadius: 8, border: '1px solid var(--color-border)' }}>
            <button
              onClick={() => setCatalogView('menu')}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: 'none',
                background: catalogView === 'menu' ? 'var(--color-primary)' : 'transparent',
                color: catalogView === 'menu' ? '#000' : 'var(--color-text-secondary)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {language === 'th' ? '+ สั่งอาหาร' : '+ Add Food'}
            </button>
            <button
              onClick={() => setCatalogView('cart')}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: 'none',
                background: catalogView === 'cart' ? 'var(--color-primary)' : 'transparent',
                color: catalogView === 'cart' ? '#000' : 'var(--color-text-secondary)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              <span>{language === 'th' ? 'รายการบิล' : 'Bill Items'}</span>
              {items.length > 0 && (
                <span
                  style={{
                    marginLeft: 4,
                    padding: '1px 5px',
                    borderRadius: 10,
                    fontSize: 10,
                    background: catalogView === 'cart' ? '#000' : 'var(--color-primary)',
                    color: catalogView === 'cart' ? '#fff' : '#000',
                    fontWeight: 800,
                  }}
                >
                  {items.length}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Main Order View Area */}
      {!hideMenuToggle && catalogView === 'menu' ? (
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <MenuCatalog onSelectItem={handleSelectItem} />
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Order Items List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.length === 0 ? (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-text-muted)',
                  gap: 8,
                }}
              >
                <Utensils size={36} />
                <p style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                  {language === 'th' ? 'ยังไม่มีรายการอาหารในบิล' : 'No items ordered yet'}
                </p>
                <p style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 600 }}>
                  {language === 'th' ? '👉 แตะเมนูทางขวา 1 ครั้งเพื่อเพิ่มลงบิลทันที' : '👉 Tap any dish to add instantly'}
                </p>
                {!hideMenuToggle && (
                  <button
                    onClick={() => setCatalogView('menu')}
                    className="btn-secondary"
                    style={{ marginTop: 8, fontSize: 13, padding: '8px 16px' }}
                  >
                    {language === 'th' ? 'เปิดเมนูอาหาร' : 'Browse Menu'}
                  </button>
                )}
              </div>
            ) : (
              items.map((item) => {
                return (
                  <div
                    key={item.id}
                    style={{
                      background: 'var(--color-bg-elevated)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid ' + (item.status === 'pending' ? 'rgba(245, 158, 11, 0.25)' : 'var(--color-border)'),
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      position: 'relative',
                    }}
                  >
                    {/* Item Title & Price */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, paddingRight: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                            {language === 'th' ? item.nameTh : item.nameEn}
                          </span>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                          ฿{item.itemTotal.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Quantity Controls & Enlarged Rectangle Delete Button */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button
                          onClick={() => updateOrderItemQuantity(item.id, -1)}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 6,
                            background: 'var(--color-bg-card)',
                            border: '1px solid var(--color-border)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <Minus size={14} />
                        </button>
                        <span style={{ minWidth: 28, textAlign: 'center', fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateOrderItemQuantity(item.id, 1)}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 6,
                            background: 'var(--color-bg-card)',
                            border: '1px solid var(--color-border)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {/* Enlarged Rectangle Delete Button */}
                      <button
                        onClick={() => removeOrderItem(item.id)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.12)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: 6,
                          color: '#f87171',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          padding: '6px 14px',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                          e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
                          e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                        }}
                        title={language === 'th' ? 'ลบรายการนี้' : 'Delete item'}
                      >
                        <Trash2 size={14} />
                        <span>{language === 'th' ? 'ลบรายการ' : 'Delete'}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Financial Calculation Summary (Service Charge & VAT hidden when toggled off in Settings) */}
          {activeOrder && items.length > 0 && (
            <div
              style={{
                background: 'var(--color-bg-elevated)',
                borderTop: '1px solid var(--color-border)',
                padding: '12px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--color-text-secondary)' }}>
                <span>{language === 'th' ? 'ยอดรวมอาหาร (Subtotal)' : 'Subtotal'}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>฿{activeOrder.subtotal.toLocaleString()}</span>
              </div>

              {/* Service Charge Line - Only shown if enabled in Settings */}
              {settings.enableServiceCharge && activeOrder.serviceChargeAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  <span>
                    {language === 'th'
                      ? `ค่าบริการ Service Charge (${Math.round(settings.serviceChargeRate * 100)}%)`
                      : `Service Charge (${Math.round(settings.serviceChargeRate * 100)}%)`}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    ฿{activeOrder.serviceChargeAmount.toLocaleString()}
                  </span>
                </div>
              )}

              {/* VAT Row - Only shown if enabled in Settings */}
              {settings.enableVat && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-text-muted)' }}>
                  <span>
                    {language === 'th'
                      ? settings.isVatInclusive
                        ? `ภาษีมูลค่าเพิ่ม ${Math.round(settings.vatRate * 100)}% (รวมในราคาแล้ว)`
                        : `ภาษีมูลค่าเพิ่ม VAT (${Math.round(settings.vatRate * 100)}%)`
                      : settings.isVatInclusive
                        ? `VAT ${Math.round(settings.vatRate * 100)}% (Inclusive)`
                        : `VAT ${Math.round(settings.vatRate * 100)}% (Exclusive)`}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>฿{activeOrder.vatAmount.toLocaleString()}</span>
                </div>
              )}

              {/* Grand Total */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  paddingTop: 8,
                  marginTop: 2,
                  borderTop: '1px dashed var(--color-border)',
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
                  {language === 'th' ? 'ยอดสุทธิ (Total)' : 'Total Due'}
                </span>
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: 'var(--color-primary)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  ฿{activeOrder.grandTotal.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Bottom Actions Bar */}
          <div
            style={{
              padding: '12px 16px',
              background: 'var(--color-bg-card)',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {/* Action Row 1: Direct Instant Print */}
            <div style={{ display: 'flex', gap: 8 }}>


            </div>

            {/* Action Row 2: Pay via โอนเงิน (Transfer) & เงินสด (Cash) */}
            {activeOrder && items.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {/* 1. โอนเงิน (Mark as paid via transferred immediately) */}
                <button
                  onClick={handleTransferPayment}
                  disabled={isPaying}
                  style={{
                    height: 52,
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    color: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isPaying ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                    transition: 'all 0.15s ease',
                    padding: '4px 8px',
                    opacity: isPaying ? 0.7 : 1,
                  }}
                  title={language === 'th' ? 'ชำระเงินโดยการโอนเงิน (บันทึกทันที)' : 'Pay via Transfer'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 15 }}>
                    <QrCode size={18} />
                    <span>{language === 'th' ? 'โอนเงิน' : 'Transfer'}</span>
                  </div>
                  <span style={{ fontSize: 11, opacity: 0.9, fontFamily: 'var(--font-mono)' }}>
                    ฿{activeOrder.grandTotal.toLocaleString()}
                  </span>
                </button>

                {/* 2. เงินสด (Opens modal with exact amount, 500, 1000 quick options) */}
                <button
                  onClick={openCashModal}
                  disabled={isPaying}
                  style={{
                    height: 52,
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isPaying ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                    transition: 'all 0.15s ease',
                    padding: '4px 8px',
                    opacity: isPaying ? 0.7 : 1,
                  }}
                  title={language === 'th' ? 'ชำระเงินสด (คำนวณเงินทอน)' : 'Pay via Cash'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 15 }}>
                    <Banknote size={18} />
                    <span>{language === 'th' ? 'เงินสด' : 'Cash'}</span>
                  </div>
                  <span style={{ fontSize: 11, opacity: 0.9, fontFamily: 'var(--font-mono)' }}>
                    ฿{activeOrder.grandTotal.toLocaleString()}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Cash Payment Modal */}
      {isCashModalOpen && activeOrder && (
        <div className="modal-overlay" style={{ zIndex: 100 }}>
          <div className="modal-content-card" style={{ width: 440, maxWidth: '92vw' }}>
            {/* Header */}
            <div
              style={{
                padding: '16px 20px',
                background: 'var(--color-bg-elevated)',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: 'var(--color-emerald)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Banknote size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                    {language === 'th' ? 'รับชำระเงินสด' : 'Cash Payment'}
                  </h3>
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                    {language === 'th'
                      ? `โต๊ะ ${activeTable.number} • บิล ${activeOrder.orderNumber}`
                      : `Table ${activeTable.number} • ${activeOrder.orderNumber}`}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsCashModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#999', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Grand Total banner */}
              <div
                style={{
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 14, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                  {language === 'th' ? 'ยอดที่ต้องชำระ' : 'Total Due'}
                </span>
                <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                  ฿{activeOrder.grandTotal.toLocaleString()}
                </span>
              </div>

              {/* Cash input */}
              <div>
                <label style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  {language === 'th' ? 'จำนวนเงินที่รับมา (บาท)' : 'Cash Tendered (THB)'}
                </label>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: 18,
                      fontWeight: 700,
                      color: 'var(--color-primary)',
                    }}
                  >
                    ฿
                  </span>
                  <input
                    type="number"
                    autoFocus
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    placeholder="0"
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 36px',
                      fontSize: 22,
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      background: 'var(--color-bg-card)',
                      border: '1.5px solid var(--color-primary)',
                      borderRadius: 'var(--radius-md)',
                      color: '#fff',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Quick Amount Options: Exact, 500, 1000 */}
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 6, fontWeight: 600 }}>
                  {language === 'th' ? 'ปุ่มลัดจำนวนเงิน:' : 'Quick Amounts:'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setCashTendered(activeOrder.grandTotal.toString())}
                    style={{
                      padding: '10px 8px',
                      borderRadius: 8,
                      border:
                        cashTendered === activeOrder.grandTotal.toString()
                          ? '1.5px solid var(--color-primary)'
                          : '1px solid var(--color-border)',
                      background:
                        cashTendered === activeOrder.grandTotal.toString()
                          ? 'rgba(245, 158, 11, 0.15)'
                          : 'var(--color-bg-elevated)',
                      color: cashTendered === activeOrder.grandTotal.toString() ? 'var(--color-primary)' : '#fff',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                    }}
                  >
                    <span>{language === 'th' ? 'จำนวนพอดี' : 'Exact'}</span>
                    <span style={{ fontSize: 11, opacity: 0.8, fontFamily: 'var(--font-mono)' }}>
                      (฿{activeOrder.grandTotal.toLocaleString()})
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCashTendered('500')}
                    style={{
                      padding: '10px 8px',
                      borderRadius: 8,
                      border: cashTendered === '500' ? '1.5px solid #a855f7' : '1px solid var(--color-border)',
                      background: cashTendered === '500' ? 'rgba(168, 85, 247, 0.15)' : 'var(--color-bg-elevated)',
                      color: cashTendered === '500' ? '#c084fc' : '#fff',
                      fontSize: 14,
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer',
                    }}
                  >
                    ฿500
                  </button>

                  <button
                    type="button"
                    onClick={() => setCashTendered('1000')}
                    style={{
                      padding: '10px 8px',
                      borderRadius: 8,
                      border: cashTendered === '1000' ? '1.5px solid #a855f7' : '1px solid var(--color-border)',
                      background: cashTendered === '1000' ? 'rgba(168, 85, 247, 0.15)' : 'var(--color-bg-elevated)',
                      color: cashTendered === '1000' ? '#c084fc' : '#fff',
                      fontSize: 14,
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer',
                    }}
                  >
                    ฿1,000
                  </button>
                </div>
              </div>

              {/* Change calculation */}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: isCashInsufficient ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                  border: isCashInsufficient ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: isCashInsufficient ? '#f87171' : 'var(--color-emerald)' }}>
                  {isCashInsufficient
                    ? language === 'th'
                      ? 'ยังขาดอีก'
                      : 'Remaining'
                    : language === 'th'
                      ? 'เงินทอน (Change)'
                      : 'Change Due'}
                </span>
                <span
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    color: isCashInsufficient ? '#f87171' : 'var(--color-emerald)',
                  }}
                >
                  ฿
                  {isCashInsufficient
                    ? (activeOrder.grandTotal - numCash).toLocaleString()
                    : (numCash - activeOrder.grandTotal).toLocaleString()}
                </span>
              </div>

              {/* Confirm / Cancel buttons */}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setIsCashModalOpen(false)}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '12px', fontSize: 14 }}
                >
                  {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCashPayment}
                  disabled={isCashInsufficient || isPaying}
                  className="btn-primary"
                  style={{
                    flex: 1.5,
                    padding: '12px',
                    fontSize: 15,
                    fontWeight: 800,
                    background: isCashInsufficient
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'linear-gradient(135deg, #10b981, #059669)',
                    opacity: isCashInsufficient || isPaying ? 0.5 : 1,
                    cursor: isCashInsufficient || isPaying ? 'not-allowed' : 'pointer',
                  }}
                >
                  {language === 'th' ? 'บันทึกรับเงินสด' : 'Confirm Cash'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Direct Thermal Print helper (triggers print directly, no confirmation modal)
function triggerDirectPrint(order: Order, restSettings: RestaurantSettings, staffName: string) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const itemsHtml = order.items
    .map(
      (item) => `
      <div style="margin-bottom: 6px;">
        <div style="display: flex; justify-content: space-between; font-weight: 600;">
          <span>${item.quantity}x ${item.nameTh}</span>
          <span>฿${item.itemTotal.toLocaleString()}</span>
        </div>
        ${item.modifiers.length > 0
          ? `<div style="font-size: 11px; color: #555; padding-left: 10px;">${item.modifiers
            .map((m) => m.optionNameTh)
            .join(', ')}</div>`
          : ''
        }
        ${item.specialInstructions
          ? `<div style="font-size: 10px; color: #666; padding-left: 10px;">* ${item.specialInstructions}</div>`
          : ''
        }
      </div>
    `
    )
    .join('');

  const content = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>ใบเรียกเก็บเงิน - โต๊ะ ${order.tableName}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 4mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Sarabun", sans-serif;
            font-size: 12px;
            color: #000;
            margin: 0;
            padding: 8px 4px;
            line-height: 1.35;
          }
          .text-center { text-align: center; }
          .bold { font-weight: 700; }
          .divider { border-bottom: 1px dashed #000; margin: 8px 0; }
          .divider-double { border-bottom: 2px solid #000; margin: 8px 0; }
          .row { display: flex; justify-content: space-between; margin-bottom: 3px; }
        </style>
      </head>
      <body>
        <div class="text-center">
          <div style="font-size: 16px; font-weight: 800;">${restSettings.restaurantNameTh}</div>
          <div style="font-size: 11px;">${restSettings.restaurantNameEn}</div>
          <div style="font-size: 10px; margin-top: 2px;">${restSettings.branchName} • Tax: ${restSettings.taxId}</div>
          <div style="font-size: 10px;">โทร: ${restSettings.phone}</div>
          <div class="bold" style="font-size: 12px; margin-top: 6px;">ใบเรียกเก็บเงิน / ใบเสร็จรับเงิน</div>
        </div>
        <div class="divider"></div>
        <div class="row">
          <span>บิล: ${order.orderNumber}</span>
          <span>โต๊ะ: <strong>${order.tableName}</strong></span>
        </div>
        <div class="row" style="font-size: 11px;">
          <span>วันที่: ${new Date().toLocaleDateString('th-TH')}</span>
          <span>เวลา: ${new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div style="font-size: 11px;">พนักงาน: ${staffName}</div>
        <div class="divider"></div>
        <div>
          ${itemsHtml}
        </div>
        <div class="divider"></div>
        <div class="row">
          <span>ยอดรวมอาหาร (Subtotal)</span>
          <span>฿${order.subtotal.toLocaleString()}</span>
        </div>
        ${restSettings.enableServiceCharge && order.serviceChargeAmount > 0
      ? `<div class="row">
                <span>ค่าบริการ Service Charge (${Math.round(restSettings.serviceChargeRate * 100)}%)</span>
                <span>฿${order.serviceChargeAmount.toLocaleString()}</span>
              </div>`
      : ''
    }
        ${restSettings.enableVat
      ? `<div class="row" style="font-size: 11px; color: #444;">
                <span>${restSettings.isVatInclusive ? 'ภาษีมูลค่าเพิ่ม 7% (รวมในราคา)' : 'ภาษีมูลค่าเพิ่ม VAT 7%'}</span>
                <span>฿${order.vatAmount.toLocaleString()}</span>
              </div>`
      : ''
    }
        <div class="divider-double"></div>
        <div class="row" style="font-size: 16px; font-weight: 800;">
          <span>ยอดสุทธิ (Total)</span>
          <span>฿${order.grandTotal.toLocaleString()}</span>
        </div>
        <div class="divider"></div>
        <div class="text-center" style="font-size: 11px; margin-top: 8px;">
          <div>🙏 ขอบคุณที่ใช้บริการ 🙏</div>
          <div style="font-size: 9px; margin-top: 4px; color: #666;">Powered by Project Alberta POS</div>
        </div>
      </body>
    </html>
  `;

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(content);
    doc.close();
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }, 250);
  } else {
    window.print();
  }
}
