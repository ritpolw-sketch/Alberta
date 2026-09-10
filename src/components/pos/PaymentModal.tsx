import React, { useState, useEffect, useRef } from 'react';
import { usePOS } from '../../context/POSContext';
import type { PaymentMethod } from '../../types/pos';
import { generatePromptPayPayload } from '../../utils/promptpay';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import {
  X,
  QrCode,
  Banknote,
  CreditCard,
  CheckCircle,
  Printer,
  Users,
  Copy,
  Check,
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose }) => {
  const {
    activeOrder,
    processPayment,
    settings,
    language,
    setActiveModal,
  } = usePOS();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('promptpay');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [cardLast4, setCardLast4] = useState<string>('');
  const [splitCount, setSplitCount] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [copiedPromptPay, setCopiedPromptPay] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const grandTotal = activeOrder?.grandTotal || 0;
  const splitAmount = Math.ceil(grandTotal / splitCount);

  // Generate PromptPay QR when in PromptPay tab
  useEffect(() => {
    if (paymentMethod === 'promptpay' && canvasRef.current && activeOrder) {
      const payload = generatePromptPayPayload(settings.promptPayId, grandTotal);
      QRCode.toCanvas(canvasRef.current, payload, {
        width: 220,
        margin: 2,
        color: {
          dark: '#002d62', // Deep PromptPay Blue
          light: '#ffffff',
        },
      }).catch((err) => console.error('PromptPay QR Error:', err));
    }
  }, [paymentMethod, grandTotal, settings.promptPayId, activeOrder]);

  // Set default cash tendered to exact amount
  useEffect(() => {
    if (grandTotal > 0 && !cashTendered) {
      setCashTendered(grandTotal.toString());
    }
  }, [grandTotal]);

  if (!isOpen || !activeOrder) return null;

  const numCashTendered = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, numCashTendered - grandTotal);
  const isCashInsufficient = numCashTendered < grandTotal;

  const handleQuickCash = (amount: number) => {
    setCashTendered(amount.toString());
  };

  const handleAddDenomination = (denom: number) => {
    const current = parseFloat(cashTendered) || 0;
    setCashTendered((current + denom).toString());
  };

  const handleConfirmPayment = async () => {
    if (paymentMethod === 'cash' && isCashInsufficient) return;

    setIsProcessing(true);

    try {
      await processPayment({
        orderId: activeOrder.id,
        method: paymentMethod,
        amount: grandTotal,
        cashReceived: paymentMethod === 'cash' ? numCashTendered : undefined,
        cashChange: paymentMethod === 'cash' ? changeDue : undefined,
        promptpayRef: paymentMethod === 'promptpay' ? `PP-${Date.now().toString().slice(-6)}` : undefined,
        cardLast4: paymentMethod === 'card' ? (cardLast4 || '8888') : undefined,
      });

      // Fire victory confetti!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899'],
      });

      setPaymentSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyPromptPay = () => {
    navigator.clipboard.writeText(settings.promptPayId);
    setCopiedPromptPay(true);
    setTimeout(() => setCopiedPromptPay(false), 2000);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content-card" style={{ width: 620, maxHeight: '92vh' }}>
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            background: 'var(--color-bg-elevated)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>
              {language === 'th' ? `เช็คบิล โต๊ะ ${activeOrder.tableName}` : `Checkout Table ${activeOrder.tableName}`}
            </h2>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
              {activeOrder.orderNumber} • {activeOrder.items.length} {language === 'th' ? 'รายการ' : 'items'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#fff',
              width: 36,
              height: 36,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {paymentSuccess ? (
          /* Payment Success Confirmation View */
          <div
            style={{
              padding: 40,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: 20,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.2)',
                border: '2px solid var(--color-emerald)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-emerald)',
              }}
            >
              <CheckCircle size={44} />
            </div>

            <div>
              <h3 style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>
                {language === 'th' ? 'ชำระเงินสำเร็จเรียบร้อย!' : 'Payment Completed!'}
              </h3>
              <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 6 }}>
                {language === 'th'
                  ? `ยอดชำระ ฿${grandTotal.toLocaleString()} ผ่านช่องทาง ${paymentMethod.toUpperCase()}`
                  : `Paid ฿${grandTotal.toLocaleString()} via ${paymentMethod.toUpperCase()}`}
              </p>
              {paymentMethod === 'cash' && changeDue > 0 && (
                <div
                  style={{
                    marginTop: 14,
                    padding: '10px 20px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    display: 'inline-block',
                  }}
                >
                  <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                    {language === 'th' ? 'เงินทอนลูกค้า: ' : 'Change Due: '}
                  </span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                    ฿{changeDue.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 360, marginTop: 10 }}>
              <button
                onClick={() => {
                  onClose();
                  setActiveModal('receipt');
                }}
                className="btn-secondary"
                style={{ flex: 1, padding: '12px' }}
              >
                <Printer size={18} />
                <span>{language === 'th' ? 'พิมพ์ใบเสร็จ' : 'Print Receipt'}</span>
              </button>

              <button
                onClick={onClose}
                className="btn-primary"
                style={{ flex: 1, padding: '12px' }}
              >
                <span>{language === 'th' ? 'เสร็จสิ้น' : 'Done'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Payment Selection Form */
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Total Display Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(217, 119, 6, 0.04))',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {language === 'th' ? 'ยอดที่ต้องชำระทั้งหมด' : 'Total Amount Due'}
                </span>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                  ฿{grandTotal.toLocaleString()}
                </div>
              </div>

              {/* Bill Splitting Control */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  <Users size={14} />
                  <span>{language === 'th' ? 'หารเท่ากัน' : 'Split Bill'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {[1, 2, 3, 4].map((count) => (
                    <button
                      key={count}
                      onClick={() => setSplitCount(count)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: '1px solid ' + (splitCount === count ? 'var(--color-primary)' : 'var(--color-border)'),
                        background: splitCount === count ? 'var(--color-primary)' : 'var(--color-bg-elevated)',
                        color: splitCount === count ? '#000' : 'var(--color-text-secondary)',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {count === 1 ? (language === 'th' ? 'เต็ม' : 'Full') : `${count} คน`}
                    </button>
                  ))}
                </div>
                {splitCount > 1 && (
                  <span style={{ fontSize: 11, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                    คนละ ฿{splitAmount.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* Payment Method Selector Tabs */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 10,
              }}
            >
              <button
                type="button"
                onClick={() => setPaymentMethod('promptpay')}
                className="touch-btn"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '14px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '2px solid ' + (paymentMethod === 'promptpay' ? '#3b82f6' : 'var(--color-border)'),
                  background: paymentMethod === 'promptpay' ? 'rgba(59, 130, 246, 0.15)' : 'var(--color-bg-elevated)',
                  color: paymentMethod === 'promptpay' ? '#60a5fa' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <QrCode size={24} />
                <span style={{ fontSize: 13, fontWeight: 700 }}>PromptPay QR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className="touch-btn"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '14px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '2px solid ' + (paymentMethod === 'cash' ? '#10b981' : 'var(--color-border)'),
                  background: paymentMethod === 'cash' ? 'rgba(16, 185, 129, 0.15)' : 'var(--color-bg-elevated)',
                  color: paymentMethod === 'cash' ? '#34d399' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <Banknote size={24} />
                <span style={{ fontSize: 13, fontWeight: 700 }}>
                  {language === 'th' ? 'เงินสด (Cash)' : 'Cash'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className="touch-btn"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '14px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '2px solid ' + (paymentMethod === 'card' ? 'var(--color-primary)' : 'var(--color-border)'),
                  background: paymentMethod === 'card' ? 'rgba(245, 158, 11, 0.15)' : 'var(--color-bg-elevated)',
                  color: paymentMethod === 'card' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <CreditCard size={24} />
                <span style={{ fontSize: 13, fontWeight: 700 }}>
                  {language === 'th' ? 'บัตรเครดิต/เดบิต' : 'Card'}
                </span>
              </button>
            </div>

            {/* PromptPay QR View */}
            {paymentMethod === 'promptpay' && (
              <div
                style={{
                  background: 'var(--color-bg-elevated)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: 14,
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                }}
              >
                {/* PromptPay Official Branding Banner */}
                <div
                  style={{
                    background: '#002d62',
                    color: '#fff',
                    padding: '6px 20px',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: '0.04em' }}>พร้อมเพย์ PROMPTPAY</span>
                </div>

                {/* QR Canvas */}
                <div
                  style={{
                    background: '#fff',
                    padding: 10,
                    borderRadius: 12,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                  }}
                >
                  <canvas ref={canvasRef} style={{ display: 'block' }} />
                </div>

                {/* Merchant PromptPay Info */}
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontWeight: 700, color: '#fff' }}>{settings.promptPayName}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>PromptPay ID: {settings.promptPayId}</span>
                    <button
                      onClick={handleCopyPromptPay}
                      style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer' }}
                    >
                      {copiedPromptPay ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                    {language === 'th'
                      ? 'สแกนจ่ายได้ทุกแอปธนาคารไทย (K PLUS, SCB EASY, Krungthai NEXT ฯลฯ)'
                      : 'Scan to pay with any Thai mobile banking app'}
                  </div>
                </div>
              </div>
            )}

            {/* Cash Calculator View */}
            {paymentMethod === 'cash' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Cash Input & Quick Denominations */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    {language === 'th' ? 'จำนวนเงินที่รับจากลูกค้า (THB)' : 'Cash Received (THB)'}
                  </label>
                  <input
                    type="number"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    style={{
                      background: 'var(--color-bg-elevated)',
                      border: '2px solid ' + (isCashInsufficient ? 'rgba(239, 68, 68, 0.5)' : 'var(--color-border)'),
                      borderRadius: 'var(--radius-md)',
                      color: '#fff',
                      fontSize: 26,
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      padding: '12px 16px',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Quick Tender Shortcuts */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => handleQuickCash(grandTotal)}
                    className="btn-secondary"
                    style={{ flex: 1, padding: '10px 8px', fontSize: 13, fontWeight: 700 }}
                  >
                    {language === 'th' ? 'พอดี' : 'Exact'} (฿{grandTotal})
                  </button>
                  {[100, 500, 1000].map((denom) => (
                    <button
                      key={denom}
                      type="button"
                      onClick={() => handleQuickCash(denom)}
                      className="btn-secondary"
                      style={{ flex: 1, padding: '10px 8px', fontSize: 13, fontWeight: 700 }}
                    >
                      ฿{denom}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleAddDenomination(100)}
                    className="btn-secondary"
                    style={{ padding: '10px 14px', fontSize: 12 }}
                  >
                    +100
                  </button>
                </div>

                {/* Change Due Box */}
                <div
                  style={{
                    background: isCashInsufficient ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid ' + (isCashInsufficient ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'),
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 600, color: isCashInsufficient ? '#f87171' : '#34d399' }}>
                    {language === 'th' ? (isCashInsufficient ? 'เงินยังไม่พอ' : 'เงินทอน') : (isCashInsufficient ? 'Insufficient Cash' : 'Change Due')}
                  </span>
                  <span
                    style={{
                      fontSize: 24,
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      color: isCashInsufficient ? '#f87171' : '#34d399',
                    }}
                  >
                    ฿{changeDue.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Card Info View */}
            {paymentMethod === 'card' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    {language === 'th' ? 'เลขท้ายบัตร 4 หลัก (บันทึกอ้างอิง)' : 'Card Last 4 Digits (Reference)'}
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={cardLast4}
                    onChange={(e) => setCardLast4(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="e.g. 4242"
                    style={{
                      background: 'var(--color-bg-elevated)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      color: '#fff',
                      fontSize: 22,
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      padding: '12px 16px',
                      letterSpacing: '0.2em',
                      outline: 'none',
                    }}
                  />
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  {language === 'th'
                    ? 'รองรับบัตร VISA, Mastercard, JCB, UnionPay ผ่านเครื่องรูดบัตร EDC'
                    : 'Supports VISA, Mastercard, JCB, UnionPay via EDC Terminal'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Footer */}
        {!paymentSuccess && (
          <div
            style={{
              padding: '16px 24px',
              background: 'var(--color-bg-elevated)',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <button
              onClick={onClose}
              className="btn-secondary"
              style={{ padding: '12px 20px' }}
            >
              {language === 'th' ? 'ยกเลิก' : 'Cancel'}
            </button>

            <button
              onClick={handleConfirmPayment}
              disabled={isProcessing || (paymentMethod === 'cash' && isCashInsufficient)}
              className="btn-primary touch-btn"
              style={{
                flex: 1,
                fontSize: 16,
                height: 48,
                opacity: (paymentMethod === 'cash' && isCashInsufficient) ? 0.5 : 1,
              }}
            >
              {isProcessing ? (
                <span>{language === 'th' ? 'กำลังบันทึก...' : 'Processing...'}</span>
              ) : (
                <>
                  <CheckCircle size={18} />
                  <span>
                    {language === 'th'
                      ? `ยืนยันรับชำระ ฿${grandTotal.toLocaleString()}`
                      : `Confirm Paid ฿${grandTotal.toLocaleString()}`}
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
