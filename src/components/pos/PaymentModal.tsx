import React, { useState, useEffect, useRef, useMemo } from 'react';
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

  const paymentChannels = useMemo(() => settings.paymentChannels || {
    cash: { enabled: true, allowQuickDenominations: true },
    scan: { enabled: true, accountName: settings.promptPayName, accountNumber: settings.promptPayId, bankName: 'PromptPay', qrType: 'generated', customQrUrl: '' },
    card: { enabled: true, gatewayType: 'edc_terminal', terminalId: 'EDC-882194', feePercentage: 2.5 },
  }, [settings.paymentChannels, settings.promptPayName, settings.promptPayId]);

  const availableMethods = useMemo(() => {
    const methods: { id: PaymentMethod; labelTh: string; labelEn: string; icon: React.ReactNode; color: string; border: string; bg: string }[] = [];
    if (paymentChannels.scan?.enabled) {
      methods.push({
        id: 'promptpay',
        labelTh: paymentChannels.scan.qrType === 'custom_image' ? 'สแกน QR ร้าน' : 'PromptPay QR',
        labelEn: 'QR Scan',
        icon: <QrCode size={22} />,
        color: '#60a5fa',
        border: '#3b82f6',
        bg: 'rgba(59, 130, 246, 0.15)',
      });
    }
    if (paymentChannels.cash?.enabled) {
      methods.push({
        id: 'cash',
        labelTh: 'เงินสด (Cash)',
        labelEn: 'Cash',
        icon: <Banknote size={22} />,
        color: '#34d399',
        border: '#10b981',
        bg: 'rgba(16, 185, 129, 0.15)',
      });
    }
    if (paymentChannels.card?.enabled) {
      methods.push({
        id: 'card',
        labelTh: 'บัตรเครดิต/เดบิต',
        labelEn: 'Card / EDC',
        icon: <CreditCard size={22} />,
        color: 'var(--color-primary)',
        border: 'var(--color-primary)',
        bg: 'rgba(245, 158, 11, 0.15)',
      });
    }
    return methods;
  }, [paymentChannels]);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(() => {
    return availableMethods[0]?.id || 'promptpay';
  });

  const [cashTendered, setCashTendered] = useState<string>('');
  const [cardLast4, setCardLast4] = useState<string>('');
  const [splitCount, setSplitCount] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [copiedPromptPay, setCopiedPromptPay] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const grandTotal = activeOrder?.grandTotal || 0;
  const splitAmount = Math.ceil(grandTotal / splitCount);

  const scanAccountNo = paymentChannels.scan?.accountNumber || settings.promptPayId;
  const scanAccountName = paymentChannels.scan?.accountName || settings.promptPayName;
  const isCustomQr = paymentChannels.scan?.qrType === 'custom_image' && !!paymentChannels.scan?.customQrUrl;

  // Reset modal state when modal opens or active order changes
  useEffect(() => {
    if (isOpen && activeOrder) {
      setPaymentSuccess(false);
      setCashTendered(activeOrder.grandTotal ? activeOrder.grandTotal.toString() : '');
      setCardLast4('');
      setSplitCount(1);
      if (availableMethods.length > 0 && !availableMethods.some((m) => m.id === paymentMethod)) {
        setPaymentMethod(availableMethods[0].id);
      }
    }
  }, [isOpen, activeOrder?.id]);

  // Generate PromptPay QR when in PromptPay tab (if dynamic generator)
  useEffect(() => {
    if (isOpen && paymentMethod === 'promptpay' && canvasRef.current && activeOrder && !isCustomQr) {
      const payload = generatePromptPayPayload(scanAccountNo, grandTotal);
      QRCode.toCanvas(canvasRef.current, payload, {
        width: 160,
        margin: 1,
        color: {
          dark: '#002d62', // Deep PromptPay Blue
          light: '#ffffff',
        },
      }).catch((err) => console.error('PromptPay QR Error:', err));
    }
  }, [isOpen, paymentMethod, grandTotal, scanAccountNo, activeOrder, isCustomQr]);

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
    navigator.clipboard.writeText(scanAccountNo);
    setCopiedPromptPay(true);
    setTimeout(() => setCopiedPromptPay(false), 2000);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content-card" style={{ width: 560, maxHeight: '92vh' }}>
        {/* Header */}
        <div
          style={{
            padding: '12px 18px',
            background: 'var(--color-bg-elevated)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>
              {language === 'th' ? `เช็คบิล โต๊ะ ${activeOrder.tableName}` : `Checkout Table ${activeOrder.tableName}`}
            </h2>
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 1 }}>
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
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Total Display Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(217, 119, 6, 0.04))',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 'var(--radius-lg)',
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {language === 'th' ? 'ยอดที่ต้องชำระทั้งหมด' : 'Total Amount Due'}
                </span>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>
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
            {availableMethods.length === 0 ? (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 8,
                  padding: '16px 20px',
                  color: '#f87171',
                  textAlign: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                ⚠️ ยังไม่ได้เปิดใช้งานช่องทางชำระเงินใดๆ กรุณาเข้าไปเปิดใช้งานในหน้า "ตั้งค่าระบบ (Settings)"
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${availableMethods.length}, 1fr)`,
                  gap: 10,
                }}
              >
                {availableMethods.map((m) => {
                  const isSelected = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className="touch-btn"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        padding: '14px 10px',
                        borderRadius: 'var(--radius-md)',
                        border: '2px solid ' + (isSelected ? m.border : 'var(--color-border)'),
                        background: isSelected ? m.bg : 'var(--color-bg-elevated)',
                        color: isSelected ? m.color : 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {m.icon}
                      <span style={{ fontSize: 13, fontWeight: 700 }}>
                        {language === 'th' ? m.labelTh : m.labelEn}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* PromptPay / QR Scan View */}
            {paymentMethod === 'promptpay' && (
              <div
                style={{
                  background: 'var(--color-bg-elevated)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: 10,
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                }}
              >
                {/* Branding Banner */}
                <div
                  style={{
                    background: isCustomQr ? '#1e293b' : '#002d62',
                    border: '1px solid ' + (isCustomQr ? '#3b82f6' : 'transparent'),
                    color: '#fff',
                    padding: '4px 16px',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.04em' }}>
                    {isCustomQr ? `สแกน QR (${paymentChannels.scan.bankName || 'ธนาคาร'})` : 'พร้อมเพย์ PROMPTPAY'}
                  </span>
                </div>

                {/* QR Code Container: Custom Uploaded Image vs Dynamic Canvas */}
                {isCustomQr ? (
                  <div
                    style={{
                      background: '#fff',
                      padding: 8,
                      borderRadius: 10,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                      maxWidth: 170,
                      maxHeight: 170,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <img
                      src={paymentChannels.scan.customQrUrl}
                      alt="Merchant Payment QR"
                      style={{
                        maxWidth: 154,
                        maxHeight: 154,
                        objectFit: 'contain',
                        borderRadius: 6,
                        display: 'block',
                      }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      background: '#fff',
                      padding: 8,
                      borderRadius: 10,
                      boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                    }}
                  >
                    <canvas ref={canvasRef} style={{ display: 'block' }} />
                  </div>
                )}

                {/* Merchant Account & PromptPay Info */}
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{scanAccountName}</div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '4px 12px',
                      borderRadius: 6,
                      margin: '0 auto',
                      width: 'fit-content',
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#60a5fa' }}>
                      {paymentChannels.scan.bankName ? `${paymentChannels.scan.bankName}: ` : 'เลขที่บัญชี: '}
                      {scanAccountNo}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyPromptPay}
                      title="คัดลอกเลขบัญชี"
                      style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      {copiedPromptPay ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                    {language === 'th'
                      ? `สแกนจ่ายยอด ฿${grandTotal.toLocaleString()} ได้ทุกแอปธนาคารไทย (K PLUS, SCB EASY, Krungthai NEXT ฯลฯ)`
                      : `Scan to pay ฿${grandTotal.toLocaleString()} with any Thai mobile banking app`}
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
                {paymentChannels.cash?.allowQuickDenominations !== false && (
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
                )}

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
                {/* Gateway Status Badge */}
                <div
                  style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: 8,
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CreditCard size={18} style={{ color: 'var(--color-primary)' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                      {paymentChannels.card?.gatewayType === 'edc_terminal'
                        ? 'เครื่องรูดบัตร EDC (EDC Terminal)'
                        : `Payment Gateway: ${paymentChannels.card?.gatewayType.toUpperCase()}`}
                    </span>
                  </div>
                  {paymentChannels.card?.terminalId && (
                    <span style={{ fontSize: 11, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      ID: {paymentChannels.card.terminalId}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                    {language === 'th' ? 'เลขท้ายบัตร 4 หลัก / รหัสสลิป EDC (บันทึกอ้างอิง)' : 'Card Last 4 Digits / Slip Approval (Reference)'}
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={cardLast4}
                    onChange={(e) => setCardLast4(e.target.value)}
                    placeholder="e.g. 4242 หรือ 882194"
                    style={{
                      background: 'var(--color-bg-elevated)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      color: '#fff',
                      fontSize: 20,
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      padding: '12px 16px',
                      letterSpacing: '0.1em',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                  {language === 'th'
                    ? 'รองรับบัตร VISA, Mastercard, JCB, UnionPay • ทำรายการผ่านเครื่อง EDC แล้วกดยืนยันการชำระเงิน'
                    : 'Supports VISA, Mastercard, JCB, UnionPay • Process on EDC then confirm payment'}
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
