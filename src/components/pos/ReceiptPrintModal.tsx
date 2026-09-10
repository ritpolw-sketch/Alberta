import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { X, Printer, Share2, Check } from 'lucide-react';

interface ReceiptPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptPrintModal: React.FC<ReceiptPrintModalProps> = ({ isOpen, onClose }) => {
  const { activeOrder, lastCompletedPayment, settings, language, currentStaff } = usePOS();
  const [ticketType, setTicketType] = useState<'customer' | 'kitchen'>('customer');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !activeOrder) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShareDigital = () => {
    const text = `[ใบเสร็จ] ${settings.restaurantNameTh} โต๊ะ ${activeOrder.tableName} ยอดรวม ฿${activeOrder.grandTotal.toLocaleString()}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content-card" style={{ width: 440, maxHeight: '92vh' }}>
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
          {/* Ticket Type Toggle */}
          <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.6)', padding: 3, borderRadius: 8, border: '1px solid var(--color-border)' }}>
            <button
              onClick={() => setTicketType('customer')}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: 'none',
                background: ticketType === 'customer' ? 'var(--color-primary)' : 'transparent',
                color: ticketType === 'customer' ? '#000' : 'var(--color-text-secondary)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {language === 'th' ? 'ใบเสร็จลูกค้า' : 'Customer Bill'}
            </button>
            <button
              onClick={() => setTicketType('kitchen')}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: 'none',
                background: ticketType === 'kitchen' ? 'var(--color-primary)' : 'transparent',
                color: ticketType === 'kitchen' ? '#000' : 'var(--color-text-secondary)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {language === 'th' ? 'ใบสั่งครัว (KOT)' : 'Kitchen Ticket'}
            </button>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Paper Container */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            background: '#090d16',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {ticketType === 'customer' ? (
            /* Customer Receipt / Tax Invoice */
            <div className="thermal-receipt-paper" id="printable-receipt">
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>
                  {settings.restaurantNameTh}
                </h2>
                <div style={{ fontSize: 11, color: '#52525b', marginTop: 2 }}>
                  {settings.restaurantNameEn}
                </div>
                <div style={{ fontSize: 10, color: '#52525b', marginTop: 2 }}>
                  {settings.branchName} • เลขผู้เสียภาษี: {settings.taxId}
                </div>
                <div style={{ fontSize: 10, color: '#52525b' }}>
                  โทร: {settings.phone}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, marginTop: 6, textTransform: 'uppercase' }}>
                  ใบเสร็จรับเงิน / ใบกำกับภาษีอย่างย่อ
                </div>
              </div>

              <div className="thermal-divider-dashed" />

              {/* Order Meta */}
              <div style={{ fontSize: 11, display: 'flex', flexDirection: 'column', gap: 2, color: '#3f3f46' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>บิล: {activeOrder.orderNumber}</span>
                  <span>โต๊ะ: <strong>{activeOrder.tableName}</strong></span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>วันที่: {new Date().toLocaleDateString('th-TH')}</span>
                  <span>เวลา: {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div>พนักงาน: {currentStaff?.name || 'Cashier'}</div>
              </div>

              <div className="thermal-divider-dashed" />

              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                {activeOrder.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600 }}>
                        {item.quantity}x {item.nameTh}
                      </span>
                      <span style={{ fontWeight: 700 }}>
                        {item.itemTotal.toLocaleString()}
                      </span>
                    </div>

                    {/* Modifiers line */}
                    {item.modifiers.length > 0 && (
                      <div style={{ fontSize: 10, color: '#52525b', paddingLeft: 14 }}>
                        {item.modifiers.map((m) => m.optionNameTh).join(', ')}
                      </div>
                    )}

                    {item.specialInstructions && (
                      <div style={{ fontSize: 10, color: '#d97706', paddingLeft: 14 }}>
                        * {item.specialInstructions}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="thermal-divider-dashed" />

              {/* Totals */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>รวมค่าอาหาร (Subtotal)</span>
                  <span>฿{activeOrder.subtotal.toLocaleString()}</span>
                </div>

                {activeOrder.serviceChargeAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>ค่าบริการ Service (10%)</span>
                    <span>฿{activeOrder.serviceChargeAmount.toLocaleString()}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#52525b' }}>
                  <span>
                    {settings.isVatInclusive
                      ? 'ภาษีมูลค่าเพิ่ม 7% (รวมในราคา)'
                      : 'ภาษีมูลค่าเพิ่ม VAT 7%'}
                  </span>
                  <span>฿{activeOrder.vatAmount.toLocaleString()}</span>
                </div>

                <div className="thermal-divider-double" />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800 }}>
                  <span>ยอดสุทธิ (Total)</span>
                  <span>฿{activeOrder.grandTotal.toLocaleString()}</span>
                </div>

                {lastCompletedPayment && (
                  <div style={{ marginTop: 6, fontSize: 11, color: '#52525b' }}>
                    <div>ชำระโดย: {lastCompletedPayment.method.toUpperCase()}</div>
                    {lastCompletedPayment.cashReceived && (
                      <div>รับเงิน: ฿{lastCompletedPayment.cashReceived.toLocaleString()} | เงินทอน: ฿{(lastCompletedPayment.cashChange || 0).toLocaleString()}</div>
                    )}
                    {lastCompletedPayment.promptpayRef && (
                      <div>รหัสอ้างอิงพร้อมเพย์: {lastCompletedPayment.promptpayRef}</div>
                    )}
                  </div>
                )}
              </div>

              <div className="thermal-divider-dashed" />

              <div style={{ textAlign: 'center', fontSize: 11, color: '#52525b', marginTop: 10 }}>
                <div>🙏 ขอบพระคุณที่มาอุดหนุนตุ๋นมัน(พระราม 3) 🙏</div>
                <div style={{ fontSize: 9, marginTop: 4 }}>Powered by Project Alberta POS</div>
              </div>
            </div>
          ) : (
            /* Kitchen Order Ticket (KOT) */
            <div className="thermal-receipt-paper" style={{ borderTop: '6px solid #ef4444' }}>
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#ef4444', letterSpacing: '0.05em' }}>
                  *** ใบส่งครัว (KITCHEN TICKET) ***
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, margin: '6px 0' }}>
                  โต๊ะ {activeOrder.tableName}
                </div>
                <div style={{ fontSize: 11, color: '#52525b' }}>
                  เวลาสั่ง: {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} • บิล: {activeOrder.orderNumber}
                </div>
              </div>

              <div className="thermal-divider-dashed" />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
                {activeOrder.items.map((item, idx) => (
                  <div key={idx} style={{ borderBottom: '1px dotted #a1a1aa', paddingBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontSize: 20, fontWeight: 900, color: '#ef4444' }}>
                        {item.quantity}x
                      </span>
                      <span style={{ fontSize: 16, fontWeight: 800 }}>
                        {item.nameTh}
                      </span>
                    </div>

                    {/* Highly visible Thai modifier callouts */}
                    {item.modifiers.length > 0 && (
                      <div style={{ marginTop: 4, paddingLeft: 28, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {item.modifiers.map((mod, mIdx) => (
                          <div
                            key={mIdx}
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: mod.optionNameTh.includes('เผ็ด') || mod.optionNameTh.includes('ไม่ใส่') ? '#b91c1c' : '#1f2937',
                            }}
                          >
                            ▶ {mod.optionNameTh}
                          </div>
                        ))}
                      </div>
                    )}

                    {item.specialInstructions && (
                      <div style={{ marginTop: 4, paddingLeft: 28, fontSize: 13, fontWeight: 800, color: '#b91c1c', background: '#fee2e2', padding: '4px 8px', borderRadius: 4 }}>
                        ⚠️ หมายเหตุ: {item.specialInstructions}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="thermal-divider-dashed" />
              <div style={{ textAlign: 'center', fontSize: 11, color: '#52525b' }}>
                พนักงานรับออเดอร์: {currentStaff?.name || 'Staff'}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '14px 20px',
            background: 'var(--color-bg-elevated)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <button
            onClick={handleShareDigital}
            className="btn-secondary"
            style={{ padding: '10px 14px', fontSize: 13 }}
          >
            {copied ? <Check size={16} color="var(--color-emerald)" /> : <Share2 size={16} />}
            <span>{copied ? (language === 'th' ? 'คัดลอกแล้ว' : 'Copied!') : (language === 'th' ? 'แชร์' : 'Share')}</span>
          </button>

          <button
            onClick={handlePrint}
            className="btn-primary touch-btn"
            style={{ flex: 1, padding: '10px 18px', fontSize: 14 }}
          >
            <Printer size={18} />
            <span>{language === 'th' ? 'สั่งพิมพ์ (Print ESC/POS)' : 'Print Receipt'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
