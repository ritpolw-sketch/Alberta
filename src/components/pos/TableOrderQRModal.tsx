import React, { useState, useMemo } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  QrCode,
  Printer,
  X,
  Copy,
  Check,
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

  // Direct Thermal Receipt Printing for QR Slip
  const handlePrintQRSlip = () => {
    const qrLayout = settings.printLayouts?.qrSlip || {
      paperWidth: '80mm',
      headerTitle: 'สแกนเพื่อสั่งอาหาร (Scan to Order)',
      showLogo: true,
      showWifi: true,
      showInstructions: true,
      footnote: 'ขอบคุณที่ใช้บริการ / Thank you!',
      autoPrint: false,
      fontSizeScale: '100',
    };

    const bodyWidth = qrLayout.paperWidth === '58mm' ? '52mm' : '72mm';
    const paperSize = qrLayout.paperWidth === '58mm' ? '58mm auto' : '80mm auto';
    const fontSize = qrLayout.fontSizeScale === '90' ? '10px' : qrLayout.fontSizeScale === '110' ? '12px' : '11px';

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
            @page { margin: 0; size: ${paperSize}; }
            body {
              font-family: 'Prompt', 'Courier New', monospace;
              width: ${bodyWidth};
              margin: 0 auto;
              padding: 8px 4px;
              color: #000;
              background: #fff;
              font-size: ${fontSize};
            }
            .text-center { text-align: center; }
            .bold { font-weight: 800; }
            .table-badge {
              font-size: ${qrLayout.fontSizeScale === '110' ? '26px' : qrLayout.fontSizeScale === '90' ? '22px' : '24px'};
              font-weight: 900;
              margin: 8px 0;
              padding: 6px;
              border: 2px solid #000;
              display: inline-block;
            }
            .qr-img {
              width: ${qrLayout.paperWidth === '58mm' ? '140px' : '180px'};
              height: ${qrLayout.paperWidth === '58mm' ? '140px' : '180px'};
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
            ${qrLayout.showLogo ? `<div class="bold" style="font-size: 14px;">${settings.restaurantNameTh}</div>` : ''}
            <div style="font-size: 10px;">${settings.restaurantNameEn} • ${settings.branchName}</div>
            <div class="table-badge">โต๊ะ ${table.number}</div>
            <div class="bold">${qrLayout.headerTitle || 'สแกนเพื่อดูเมนูและสั่งอาหาร'}</div>
            <img class="qr-img" src="${qrApiUrl}" alt="Order QR Code" />
            <div class="instructions">
              1. เปิดกล้องถ่ายรูป หรือ LINE บนมือถือ<br/>
              2. สแกน QR Code เพื่อดูเมนูอาหาร<br/>
              3. เลือกอาหารและกดส่งรายการเข้าครัวได้ทันที
            </div>
            ${qrLayout.showWifi ? `
            <div class="divider"></div>
            <div class="wifi-box">
              📶 Free WiFi: <strong>Alberta_Guest</strong> | Pass: <strong>alberta888</strong>
            </div>` : ''}
            <div class="divider"></div>
            <div style="font-size: 9px; margin-top: 6px; color: #555;">
              ${qrLayout.footnote || 'ขอบคุณที่ใช้บริการ / Thank you!'} • พิมพ์เมื่อ: ${new Date().toLocaleDateString('th-TH')} ${new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
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

  const qrPaperWidth = settings.printLayouts?.qrSlip?.paperWidth || '80mm';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        background: 'rgba(5, 7, 13, 0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 440,
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--color-border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--color-bg-elevated)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <QrCode size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                {language === 'th' ? `QR Code สั่งอาหาร - โต๊ะ ${table.number}` : `Order QR - Table ${table.number}`}
              </h3>
              <p style={{ fontSize: 12, margin: 0, color: 'var(--color-text-secondary)' }}>
                {table.zone || 'Indoor'} Zone • {table.capacity} {language === 'th' ? 'ที่นั่ง' : 'seats'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              padding: 6,
              borderRadius: 'var(--radius-md)',
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Slip Container */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', textAlign: 'center', margin: '0 0 16px 0' }}>
            {language === 'th' ? 'พิมพ์สลิป QR หรือแชร์ลิงก์ให้ลูกค้าสแกนสั่งอาหารด้วยตัวเอง' : 'Print QR slip or share ordering link for customer self-service'}
          </p>

          {/* Printable Ticket Box */}
          <div
            style={{
              width: '100%',
              maxWidth: 300,
              background: '#ffffff',
              color: '#000000',
              padding: '20px 16px',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              textAlign: 'center',
              fontFamily: "'Prompt', sans-serif",
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 15 }}>{settings.restaurantNameTh}</div>
            <div style={{ fontSize: 11, color: '#555' }}>{settings.restaurantNameEn} • {settings.branchName}</div>

            <div
              style={{
                margin: '12px auto',
                padding: '6px 14px',
                border: '2px solid #000',
                display: 'inline-block',
                fontWeight: 900,
                fontSize: 22,
                borderRadius: 4,
              }}
            >
              โต๊ะ {table.number}
            </div>

            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
              {settings.printLayouts?.qrSlip?.headerTitle || 'สแกนเพื่อดูเมนูและสั่งอาหาร'}
            </div>

            <img
              src={qrApiUrl}
              alt={`QR Code Table ${table.number}`}
              style={{ width: 180, height: 180, display: 'block', margin: '0 auto 12px auto' }}
            />

            <div style={{ fontSize: 11, color: '#444', lineHeight: 1.4 }}>
              1. เปิดกล้องถ่ายรูป หรือ LINE บนมือถือ<br />
              2. สแกน QR Code เพื่อดูเมนูอาหาร<br />
              3. เลือกอาหารและกดส่งรายการเข้าครัวได้ทันที
            </div>

            <div style={{ borderBottom: '1px dashed #000', margin: '12px 0' }} />

            {settings.printLayouts?.qrSlip?.showWifi !== false && (
              <div
                style={{
                  fontSize: 10,
                  border: '1px dotted #000',
                  padding: 6,
                  borderRadius: 4,
                  background: '#fafafa',
                }}
              >
                📶 Free WiFi: <strong>Alberta_Guest</strong> | Pass: <strong>alberta888</strong>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions Footer - Copy Link & Print Side-by-Side Right Aligned */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--color-border-subtle)',
            background: 'var(--color-bg-elevated)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10,
          }}
        >
          {/* Copy Link Button */}
          <button
            onClick={handleCopyLink}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              background: copied ? 'rgba(34, 197, 94, 0.2)' : 'var(--color-bg-surface)',
              border: `1px solid ${copied ? '#22c55e' : 'var(--color-border-subtle)'}`,
              color: copied ? '#22c55e' : 'var(--color-text-primary)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s ease',
            }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
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
            <span>{language === 'th' ? `พิมพ์สลิป QR (${qrPaperWidth})` : `Print QR Slip (${qrPaperWidth})`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
