import React, { useState, useMemo } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  QrCode,
  Printer,
  X,
  Copy,
  Check,
  Wifi,
  Clock,
} from 'lucide-react';
import type { Table } from '../../types/pos';

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
  const { settings, language } = usePOS();
  const [copied, setCopied] = useState(false);

  const sessionCode = useMemo(() => {
    if (!table) return '';
    return `SES-${table.id.toUpperCase()}-2026`;
  }, [table]);

  if (!isOpen || !table) return null;

  // Generate Table QR Code URL
  const orderUrl = `${window.location.origin}/customer-order?table=${encodeURIComponent(
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

  return (
    <div
      onClick={onClose}
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
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-bg-card)',
          border: '1.5px solid var(--color-border-glow)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: 440,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0,0,0,0.85)',
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
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Main 80mm Thermal Receipt QR Slip Preview Card */}
          <div
            style={{
              width: '100%',
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
        </div>

        {/* Modal Actions Footer - Copy Link & Print Side-by-Side Right Aligned */}
        <div
          style={{
            padding: '12px 20px',
            background: 'var(--color-bg-elevated)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10,
          }}
        >
          {/* Copy Link Button */}
          <button
            onClick={handleCopyLink}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
            title="Copy URL"
          >
            {copied ? <Check size={15} style={{ color: '#10b981' }} /> : <Copy size={15} />}
            <span>{copied ? (language === 'th' ? 'คัดลอกแล้ว!' : 'Copied!') : (language === 'th' ? 'คัดลอกลิงก์' : 'Copy Link')}</span>
          </button>

          {/* Direct Thermal Slip Printer Button */}
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
  );
};
