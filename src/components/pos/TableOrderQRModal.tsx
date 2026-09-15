import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  QrCode,
  Printer,
  X,
  Copy,
  Check,
  Smartphone,
  Wifi,
  Clock,
  ArrowRight,
  ShoppingBag,
} from 'lucide-react';
import type { Table, MenuItem } from '../../types/pos';
import confetti from 'canvas-confetti';

interface TableOrderQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: Table | null;
}

export const TableOrderQRModal: React.FC<TableOrderQRModalProps> = ({
  isOpen,
  onClose,
  table,
}) => {
  const { settings, language, menuItems, quickAddItemToOrder } = usePOS();
  const [copied, setCopied] = useState(false);
  const [isSimulatingCustomer, setIsSimulatingCustomer] = useState(false);
  const [customerCart, setCustomerCart] = useState<{ item: MenuItem; qty: number }[]>([]);
  const [orderSentSuccess, setOrderSentSuccess] = useState(false);

  if (!isOpen || !table) return null;

  // Generate Table QR Code URL
  const sessionCode = `SES-${table.id.toUpperCase()}-${Date.now().toString().slice(-4)}`;
  const orderUrl = `${window.location.origin}/order?table=${encodeURIComponent(
    table.id
  )}&code=${encodeURIComponent(table.number)}&session=${sessionCode}`;
  
  // High-res QR Code API URL
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    orderUrl
  )}&margin=10`;

  // Copy URL to Clipboard
  const handleCopyLink = () => {
    navigator.clipboard.writeText(orderUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Direct 80mm Thermal Receipt Printing for QR Slip
  const handlePrintQRSlip = () => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Order QR Slip - Table ${table.number}</title>
          <style>
            @page { margin: 0; size: 80mm auto; }
            body {
              font-family: 'Prompt', 'Courier New', monospace;
              width: 72mm;
              margin: 0 auto;
              padding: 8px 4px;
              color: #000;
              background: #fff;
              font-size: 11px;
            }
            .text-center { text-align: center; }
            .bold { font-weight: 800; }
            .table-badge {
              font-size: 24px;
              font-weight: 900;
              margin: 8px 0;
              padding: 6px;
              border: 2px solid #000;
              display: inline-block;
            }
            .qr-img {
              width: 180px;
              height: 180px;
              margin: 8px auto;
              display: block;
            }
            .divider { border-bottom: 1px dashed #000; margin: 8px 0; }
            .instructions { font-size: 10px; line-height: 1.4; text-align: center; margin: 6px 0; }
            .wifi-box { font-size: 10px; border: 1px dotted #000; padding: 4px; margin-top: 6px; }
          </style>
        </head>
        <body>
          <div class="text-center">
            <div class="bold" style="font-size: 14px;">${settings.restaurantNameTh}</div>
            <div style="font-size: 10px;">${settings.restaurantNameEn} • ${settings.branchName}</div>
            <div class="table-badge">โต๊ะ ${table.number}</div>
            <div>สแกนเพื่อดูเมนูและสั่งอาหาร</div>
            <img class="qr-img" src="${qrApiUrl}" alt="Order QR Code" />
            <div class="instructions">
              1. เปิดกล้องถ่ายรูป หรือ LINE บนมือถือ<br/>
              2. สแกน QR Code เพื่อดูเมนูอาหาร<br/>
              3. เลือกอาหารและกดส่งรายการเข้าครัวได้ทันที
            </div>
            <div class="divider"></div>
            <div class="wifi-box">
              📶 Free WiFi: <strong>Alberta_Guest</strong> | Pass: <strong>alberta888</strong>
            </div>
            <div style="font-size: 9px; margin-top: 6px; color: #555;">
              พิมพ์เมื่อ: ${new Date().toLocaleDateString('th-TH')} ${new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </body>
      </html>
    `;

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(printContent);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 2000);
      }, 300);
    } else {
      window.print();
    }
  };

  // Customer Self-Order Simulator Handlers
  const handleAddSimulatorItem = (item: MenuItem) => {
    setCustomerCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.item.id === item.id ? { ...c, qty: c.qty + 1 } : c
        );
      }
      return [...prev, { item, qty: 1 }];
    });
  };

  const handleSendSimulatorOrder = () => {
    if (customerCart.length === 0) return;
    customerCart.forEach(({ item, qty }) => {
      for (let i = 0; i < qty; i++) {
        quickAddItemToOrder(item);
      }
    });

    setOrderSentSuccess(true);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });

    setTimeout(() => {
      setOrderSentSuccess(false);
      setCustomerCart([]);
      setIsSimulatingCustomer(false);
    }, 1500);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 8, 16, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        style={{
          background: 'var(--color-bg-card)',
          border: '1.5px solid var(--color-border-glow)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: isSimulatingCustomer ? 780 : 460,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0,0,0,0.85)',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '14px 20px',
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
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid var(--color-primary)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <QrCode size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>
                {language === 'th' ? `QR Code สั่งอาหาร - โต๊ะ ${table.number}` : `Table ${table.number} Order QR`}
              </h3>
              <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                {language === 'th' ? 'พิมพ์สลิป QR หรือแชร์ลิงก์ให้ลูกค้าสแกนสั่งอาหารด้วยตัวเอง' : 'Print QR slip or share ordering link for customer self-service'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 20,
            display: 'flex',
            gap: 20,
            flexDirection: isSimulatingCustomer ? 'row' : 'column',
            alignItems: isSimulatingCustomer ? 'stretch' : 'center',
          }}
        >
          {/* Main 80mm Thermal Receipt QR Slip Preview Card */}
          <div
            style={{
              width: isSimulatingCustomer ? 320 : '100%',
              maxWidth: 340,
              margin: '0 auto',
              background: '#ffffff',
              color: '#000000',
              borderRadius: 'var(--radius-md)',
              padding: 20,
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              fontFamily: "'Prompt', sans-serif",
              position: 'relative',
              userSelect: 'text',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 800 }}>{settings.restaurantNameTh}</div>
            <div style={{ fontSize: 10, color: '#444' }}>{settings.branchName}</div>

            {/* Big Table Badge */}
            <div
              style={{
                fontSize: 22,
                fontWeight: 900,
                marginTop: 8,
                marginBottom: 6,
                padding: '4px 16px',
                border: '2.5px solid #000',
                borderRadius: 8,
                background: '#fafafa',
              }}
            >
              {language === 'th' ? `โต๊ะ ${table.number}` : `Table ${table.number}`}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#333' }}>
              📲 {language === 'th' ? 'สแกนเพื่อดูเมนูและสั่งอาหารเข้าครัว' : 'Scan to view menu & order'}
            </div>

            {/* Dynamic QR Code Image */}
            <div style={{ margin: '12px 0', padding: 8, background: '#fff', borderRadius: 8, border: '1px dashed #ccc' }}>
              <img
                src={qrApiUrl}
                alt={`Table ${table.number} Order QR Code`}
                style={{ width: 180, height: 180, display: 'block' }}
              />
            </div>

            {/* Instructions list */}
            <div style={{ fontSize: 10, color: '#555', textAlign: 'left', width: '100%', lineHeight: 1.5, background: '#f5f5f5', padding: '8px 10px', borderRadius: 6 }}>
              <div>1️⃣ เปิดกล้องถ่ายรูป หรือแอป LINE บนมือถือ</div>
              <div>2️⃣ สแกน QR Code นี้เพื่อเปิดเมนูอาหาร</div>
              <div>3️⃣ เลือกเมนูและกดส่งรายการเข้าครัวได้ทันที</div>
            </div>

            {/* WiFi Credentials Box */}
            <div style={{ fontSize: 10, width: '100%', marginTop: 8, padding: '4px 6px', border: '1px dotted #888', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Wifi size={12} />
              <span>Free WiFi: <strong>Alberta_Guest</strong> | Pass: <strong>alberta888</strong></span>
            </div>

            <div style={{ fontSize: 9, color: '#888', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={10} />
              <span>{language === 'th' ? 'รหัสสั่งอาหารเปิดใช้งาน 3 ชม.' : 'Session active for 3 hrs'}</span>
            </div>
          </div>

          {/* Optional: Customer Self-Ordering Mobile Phone Simulator */}
          {isSimulatingCustomer && (
            <div
              style={{
                flex: 1,
                minWidth: 320,
                background: '#090d16',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                padding: 14,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-primary)' }}>
                  <Smartphone size={16} />
                  <span style={{ fontSize: 12, fontWeight: 800 }}>
                    {language === 'th' ? `หน้าจอมือถือลูกค้า (โต๊ะ ${table.number})` : `Customer Phone View (Table ${table.number})`}
                  </span>
                </div>
                <button
                  onClick={() => setIsSimulatingCustomer(false)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', fontSize: 11, cursor: 'pointer' }}
                >
                  ✕ {language === 'th' ? 'ซ่อน' : 'Hide'}
                </button>
              </div>

              {/* Mobile Menu Catalog */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2 }}>
                  {language === 'th' ? 'แตะอาหารเพื่อลองสั่งเข้า POS ทันที:' : 'Tap food items to test instant ordering:'}
                </div>
                {menuItems.slice(0, 6).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleAddSimulatorItem(item)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: 'var(--color-bg-card)',
                      padding: 8,
                      borderRadius: 8,
                      border: '1px solid var(--color-border)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ width: 34, height: 34, borderRadius: 6, background: '#1e293b', overflow: 'hidden', flexShrink: 0 }}>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.nameTh} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 16 }}>🍽️</div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {language === 'th' ? item.nameTh : item.nameEn}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-primary)' }}>฿{item.price}</div>
                    </div>
                    <button
                      style={{
                        padding: '4px 8px',
                        borderRadius: 6,
                        background: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid var(--color-primary)',
                        color: 'var(--color-primary)',
                        fontSize: 11,
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      + เพิ่ม
                    </button>
                  </div>
                ))}
              </div>

              {/* Customer Mobile Cart Footer */}
              <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>
                  <ShoppingBag size={14} style={{ display: 'inline', marginRight: 4, color: 'var(--color-primary)' }} />
                  {customerCart.reduce((sum, c) => sum + c.qty, 0)} {language === 'th' ? 'รายการ' : 'items'}
                </div>

                <button
                  onClick={handleSendSimulatorOrder}
                  disabled={customerCart.length === 0 || orderSentSuccess}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    background: orderSentSuccess
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : 'linear-gradient(135deg, #f59e0b, #d97706)',
                    border: 'none',
                    color: orderSentSuccess ? '#fff' : '#000',
                    fontSize: 12,
                    fontWeight: 900,
                    cursor: customerCart.length === 0 ? 'not-allowed' : 'pointer',
                    opacity: customerCart.length === 0 ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {orderSentSuccess ? (
                    <>
                      <Check size={14} />
                      <span>{language === 'th' ? 'ส่งเข้า POS สำเร็จ!' : 'Sent to POS!'}</span>
                    </>
                  ) : (
                    <>
                      <span>{language === 'th' ? 'ส่งออเดอร์เข้าครัว' : 'Send to Kitchen'}</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div
          style={{
            padding: '12px 20px',
            background: 'var(--color-bg-elevated)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Copy Link Button */}
            <button
              onClick={handleCopyLink}
              className="btn-secondary"
              style={{ padding: '8px 12px', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}
              title="Copy URL"
            >
              {copied ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
              <span>{copied ? (language === 'th' ? 'คัดลอกแล้ว!' : 'Copied!') : (language === 'th' ? 'คัดลอกลิงก์' : 'Copy Link')}</span>
            </button>

            {/* Customer Simulator Toggle Button */}
            {!isSimulatingCustomer && (
              <button
                onClick={() => setIsSimulatingCustomer(true)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(59, 130, 246, 0.12)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: '#60a5fa',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <Smartphone size={14} />
                <span>{language === 'th' ? 'ลองสแกนสั่งอาหาร' : 'Simulate Customer View'}</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={onClose}
              className="btn-secondary"
              style={{ padding: '8px 14px', fontSize: 12, fontWeight: 700 }}
            >
              {language === 'th' ? 'ปิด' : 'Close'}
            </button>

            {/* Direct Thermal Slip Printer */}
            <button
              onClick={handlePrintQRSlip}
              style={{
                padding: '8px 18px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                border: 'none',
                color: '#000',
                fontSize: 13,
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
              }}
            >
              <Printer size={16} />
              <span>{language === 'th' ? 'พิมพ์สลิป QR (80mm)' : 'Print QR Slip'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
