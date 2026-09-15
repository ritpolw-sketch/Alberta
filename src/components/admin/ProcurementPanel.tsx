import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  Bot,
  Truck,
  Package,
  Plus,
  Send,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Building2,
  MessageSquare,
  ShieldCheck,
  Trash2,
  Edit2,
  Sparkles,
  Settings,
  Lock,
} from 'lucide-react';
import type { PurchaseOrder, Supplier, InventoryItem, POStatus, OrderingChannelMethod, SupplierPaymentTerm } from '../../types/pos';

export const ProcurementPanel: React.FC = () => {
  const {
    suppliers,
    inventory,
    purchaseOrders,
    lineAgentConfig,
    lineLogs,
    currentStaff,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    createPurchaseOrder,
    sendPOToLineGroup,
    simulateSupplierLineReply,
    approveAndPayPO,
    updateLineAgentConfig,
    triggerAutoPOForLowStock,
    language,
  } = usePOS();

  const [activeSubTab, setActiveSubTab] = useState<'pos_agent' | 'suppliers' | 'inventory' | 'settings'>('pos_agent');
  const [selectedPOForPay, setSelectedPOForPay] = useState<PurchaseOrder | null>(null);
  const [showNewPOModal, setShowNewPOModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editingInventory, setEditingInventory] = useState<InventoryItem | null>(null);

  // New PO Form state
  const [newPoSupplierId, setNewPoSupplierId] = useState(suppliers[0]?.id || '');
  const [newPoItemId, setNewPoItemId] = useState(inventory[0]?.id || '');
  const [newPoQty, setNewPoQty] = useState(10);
  const [newPoUnitPrice, setNewPoUnitPrice] = useState(inventory[0]?.avgCost || 220);

  // Supplier Form state with Workflow Config
  const [supForm, setSupForm] = useState<Omit<Supplier, 'id'>>({
    name: '',
    contactPerson: '',
    phone: '',
    lineId: '',
    lineGroup: '',
    category: 'เนื้อสด & ชิ้นส่วนวัว',
    promptPayId: '',
    accountName: '',
    bankName: 'PromptPay (กสิกรไทย)',
    creditDays: 0,
    workflowConfig: {
      channelMethod: 'line_group',
      paymentTerm: 'promptpay_cod',
      autoApproveThreshold: 5000,
      requireOwnerApproval: false,
      autoSendLineOnLowStock: true,
      requireDeliveryProofUpload: false,
      specialInstructions: '',
    },
  });

  // Inventory Form state
  const [invForm, setInvForm] = useState<Omit<InventoryItem, 'id'>>({
    nameTh: '',
    nameEn: '',
    unit: 'kg',
    currentStock: 10,
    minSafetyThreshold: 15,
    avgCost: 200,
    supplierId: suppliers[0]?.id || '',
    category: 'วัตถุดิบครัว',
  });

  const isOwnerOrAdmin = currentStaff?.role === 'owner' || currentStaff?.role === 'admin';

  // Helper Labels for Workflow
  const getChannelLabel = (method?: OrderingChannelMethod) => {
    switch (method) {
      case 'line_group':
        return '💬 LINE Group Chat';
      case 'line_oa':
        return '📱 LINE Official Account';
      case 'phone':
        return '📞 โทรศัพท์สั่งตรง';
      case 'email_pdf':
        return '📧 Email PDF PO';
      default:
        return '💬 LINE Group';
    }
  };

  const getPaymentTermLabel = (term?: SupplierPaymentTerm) => {
    switch (term) {
      case 'promptpay_cod':
        return '⚡ PromptPay สแกนจ่าย (COD)';
      case 'credit_7':
        return '📅 เครดิต 7 วัน';
      case 'credit_15':
        return '📅 เครดิต 15 วัน';
      case 'credit_30':
        return '📅 เครดิต 30 วัน';
      case 'cash_drawer':
        return '💵 เงินสดลิ้นชัก';
      default:
        return '⚡ PromptPay (COD)';
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status: POStatus) => {
    switch (status) {
      case 'draft':
        return (
          <span style={{ padding: '3px 8px', borderRadius: 12, background: 'rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: 11, fontWeight: 700 }}>
            📝 ร่าง PO
          </span>
        );
      case 'sent_line':
        return (
          <span style={{ padding: '3px 8px', borderRadius: 12, background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', fontSize: 11, fontWeight: 700 }}>
            💬 ส่ง LINE แล้ว
          </span>
        );
      case 'ocr_received':
        return (
          <span style={{ padding: '3px 8px', borderRadius: 12, background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)', fontSize: 11, fontWeight: 700 }}>
            🔍 รอตรวจสอบ OCR & QR
          </span>
        );
      case 'reconciled':
        return (
          <span style={{ padding: '3px 8px', borderRadius: 12, background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.4)', fontSize: 11, fontWeight: 700 }}>
            ✨ ตรวจสอบถูกต้อง พร้อมจ่าย
          </span>
        );
      case 'completed':
        return (
          <span style={{ padding: '3px 8px', borderRadius: 12, background: 'rgba(16, 185, 129, 0.25)', color: '#10b981', fontSize: 11, fontWeight: 700 }}>
            ✅ จ่ายแล้ว & เข้าคลังเรียบร้อย
          </span>
        );
      default:
        return null;
    }
  };

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    const invItem = inventory.find((i) => i.id === newPoItemId);
    const supplier = suppliers.find((s) => s.id === newPoSupplierId);
    if (!invItem || !supplier) return;

    const total = newPoQty * newPoUnitPrice;
    createPurchaseOrder({
      supplierId: supplier.id,
      supplierName: supplier.name,
      items: [
        {
          inventoryItemId: invItem.id,
          nameTh: invItem.nameTh,
          unit: invItem.unit,
          qtyOrdered: newPoQty,
          unitPrice: newPoUnitPrice,
          total,
        },
      ],
      subtotal: total,
      grandTotal: total,
    });

    setShowNewPOModal(false);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupplier) {
      updateSupplier({ ...supForm, id: editingSupplier.id });
    } else {
      addSupplier(supForm);
    }
    setShowSupplierModal(false);
    setEditingSupplier(null);
  };

  const handleSaveInventory = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingInventory) {
      updateInventoryItem({ ...invForm, id: editingInventory.id });
    } else {
      addInventoryItem(invForm);
    }
    setShowInventoryModal(false);
    setEditingInventory(null);
  };

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20, color: '#fff' }}>
      {/* Top Banner & Title */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))',
          padding: '16px 20px',
          borderRadius: 14,
          border: '1px solid var(--color-border)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)',
            }}
          >
            <Bot size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
                {language === 'th' ? 'การจัดซื้อ & บอทจัดซื้อ LINE Agent' : 'Procurement & LINE Agent'}
              </h2>
              <span
                style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 10,
                  background: lineAgentConfig.botEnabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: lineAgentConfig.botEnabled ? '#34d399' : '#f87171',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: lineAgentConfig.botEnabled ? '#10b981' : '#ef4444' }} />
                {lineAgentConfig.botEnabled ? 'Agent Active' : 'Agent Paused'}
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
              ตั้งค่า Procurement Workflow รายซัพพลายเออร์, สั่งซื้ออัตโนมัติผ่าน LINE Group/OA, OCR บิล และสแกนจ่าย PromptPay
            </p>
          </div>
        </div>

        {/* Quick Action Button */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setShowNewPOModal(true)}
            className="btn-primary"
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Plus size={16} />
            <span>สร้างใบสั่งซื้อ (PO)</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--color-border)', paddingBottom: 10 }}>
        <button
          onClick={() => setActiveSubTab('pos_agent')}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: activeSubTab === 'pos_agent' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
            color: activeSubTab === 'pos_agent' ? '#22d3ee' : 'var(--color-text-secondary)',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <MessageSquare size={15} />
          <span>ใบสั่งซื้อ & LINE Agent ({purchaseOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('suppliers')}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: activeSubTab === 'suppliers' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
            color: activeSubTab === 'suppliers' ? '#22d3ee' : 'var(--color-text-secondary)',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Truck size={15} />
          <span>ซัพพลายเออร์ & Workflow ({suppliers.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('inventory')}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: activeSubTab === 'inventory' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
            color: activeSubTab === 'inventory' ? '#22d3ee' : 'var(--color-text-secondary)',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Package size={15} />
          <span>คลังวัตถุดิบ ({inventory.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('settings')}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: activeSubTab === 'settings' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
            color: activeSubTab === 'settings' ? '#22d3ee' : 'var(--color-text-secondary)',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <ShieldCheck size={15} />
          <span>ตั้งค่า Agent & RBAC</span>
        </button>
      </div>

      {/* TAB 1: LINE Agent & POs */}
      {activeSubTab === 'pos_agent' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          {/* Left Column: Purchase Orders */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>รายการใบสั่งซื้อ (Purchase Orders)</span>
            </h3>

            {purchaseOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, background: 'var(--color-bg-card)', borderRadius: 12, color: 'var(--color-text-muted)' }}>
                ไม่มีใบสั่งซื้อในขณะนี้
              </div>
            ) : (
              purchaseOrders.map((po) => {
                const supplier = suppliers.find((s) => s.id === po.supplierId);
                const wf = supplier?.workflowConfig;
                const threshold = wf?.autoApproveThreshold ?? lineAgentConfig.autoApprovalThreshold;
                const requiresOwner = wf?.requireOwnerApproval || po.grandTotal > threshold;
                const isNeedOwnerApprove = requiresOwner && !isOwnerOrAdmin;

                return (
                  <div
                    key={po.id}
                    style={{
                      background: 'var(--color-bg-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 12,
                      padding: 16,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-primary)' }}>{po.poNumber}</span>
                        {getStatusBadge(po.status)}
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        สร้างเมื่อ {new Date(po.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} โดย {po.createdBy}
                      </span>
                    </div>

                    {/* Supplier Info & Per-Supplier Workflow Badges */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>
                        <Building2 size={15} style={{ color: '#06b6d4' }} />
                        <span>{po.supplierName}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 8, background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', fontWeight: 700 }}>
                          {getChannelLabel(wf?.channelMethod)}
                        </span>
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 8, background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', fontWeight: 700 }}>
                          {getPaymentTermLabel(wf?.paymentTerm)}
                        </span>
                        {requiresOwner && (
                          <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', fontWeight: 700 }}>
                            🔒 ต้องมี Owner PIN
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Items Table */}
                    <div style={{ background: 'rgba(15, 23, 42, 0.5)', borderRadius: 8, padding: 10, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      {po.items.map((it, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0' }}>
                          <span>
                            {it.nameTh} ({it.qtyOrdered} {it.unit} @ ฿{it.unitPrice})
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>฿{it.total.toLocaleString()}</span>
                        </div>
                      ))}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          borderTop: '1px dashed var(--color-border)',
                          marginTop: 6,
                          paddingTop: 6,
                          fontSize: 13,
                          fontWeight: 800,
                        }}
                      >
                        <span>ยอดรวมทั้งสิ้น (Grand Total)</span>
                        <span style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>฿{po.grandTotal.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Special Supplier Instructions */}
                    {wf?.specialInstructions && (
                      <div style={{ fontSize: 11, color: '#fbbf24', fontStyle: 'italic', background: 'rgba(245, 158, 11, 0.1)', padding: '4px 8px', borderRadius: 6 }}>
                        📌 คำแนะนำพิเศษซัพพลายเออร์: "{wf.specialInstructions}"
                      </div>
                    )}

                    {/* Discrepancy Alert */}
                    {po.discrepancyAmount !== undefined && po.discrepancyAmount !== 0 && (
                      <div
                        style={{
                          padding: '8px 12px',
                          borderRadius: 8,
                          background: 'rgba(245, 158, 11, 0.15)',
                          border: '1px solid rgba(245, 158, 11, 0.4)',
                          color: '#fbbf24',
                          fontSize: 12,
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <AlertTriangle size={16} />
                        <span>
                          บิล OCR ที่รับเข้ามียอดต่างจาก PO: ฿{po.ocrExtractedTotal?.toLocaleString()} (ส่วนต่าง +฿
                          {po.discrepancyAmount.toLocaleString()})
                        </span>
                      </div>
                    )}

                    {/* Actions Bar */}
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 6, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      {po.status === 'draft' && (
                        <button
                          onClick={() => sendPOToLineGroup(po.id)}
                          disabled={isNeedOwnerApprove}
                          className="btn-primary"
                          style={{
                            padding: '6px 14px',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            background: isNeedOwnerApprove ? 'gray' : undefined,
                          }}
                        >
                          <Send size={14} />
                          <span>{isNeedOwnerApprove ? `รอ Owner อนุมัติ (เกิน ฿${threshold.toLocaleString()})` : `ส่งผ่าน ${getChannelLabel(wf?.channelMethod)}`}</span>
                        </button>
                      )}

                      {po.status === 'sent_line' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => simulateSupplierLineReply(po.id, po.grandTotal, false)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 6,
                              background: 'rgba(16, 185, 129, 0.15)',
                              border: '1px solid rgba(16, 185, 129, 0.4)',
                              color: '#34d399',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5,
                            }}
                          >
                            <Sparkles size={14} />
                            <span>จำลองตอบรับ (ตรงเป๊ะ)</span>
                          </button>
                          <button
                            onClick={() => simulateSupplierLineReply(po.id, po.grandTotal + 300, true)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 6,
                              background: 'rgba(245, 158, 11, 0.15)',
                              border: '1px solid rgba(245, 158, 11, 0.4)',
                              color: '#fbbf24',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5,
                            }}
                          >
                            <AlertTriangle size={14} />
                            <span>จำลองตอบรับ (+฿300)</span>
                          </button>
                        </div>
                      )}

                      {(po.status === 'ocr_received' || po.status === 'reconciled') && po.paymentStatus === 'pending' && (
                        <button
                          onClick={() => setSelectedPOForPay(po)}
                          className="btn-primary"
                          style={{
                            padding: '6px 14px',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                          }}
                        >
                          <QrCode size={14} />
                          <span>1-Click สแกนจ่าย PromptPay & ตัดสต็อกเข้าคลัง</span>
                        </button>
                      )}

                      {po.status === 'completed' && (
                        <div style={{ fontSize: 12, color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <CheckCircle2 size={16} />
                          <span>ชำระเรียบร้อย & ตัดสต็อกเข้าคลังแล้ว</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Live LINE Chat & Agent Logs */}
          <div
            style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 14,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              maxHeight: 700,
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageSquare size={16} style={{ color: '#06b6d4' }} />
                <span style={{ fontSize: 14, fontWeight: 800 }}>ประวัติแชท LINE Group</span>
              </div>
              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 10, background: 'rgba(6, 182, 212, 0.2)', color: '#22d3ee', fontWeight: 700 }}>
                Live Feed
              </span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 4 }}>
              {lineLogs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    alignSelf: log.direction === 'outbound' ? 'flex-end' : 'flex-start',
                    maxWidth: '88%',
                    background: log.direction === 'outbound' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    border: log.direction === 'outbound' ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid var(--color-border)',
                    borderRadius: 10,
                    padding: 10,
                    fontSize: 12,
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 800, color: log.direction === 'outbound' ? '#22d3ee' : '#94a3b8', marginBottom: 4 }}>
                    {log.sender} • {new Date(log.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{log.messageText}</div>

                  {log.imageUrl && (
                    <div style={{ marginTop: 8, borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <img src={log.imageUrl} alt="LINE Receipt" style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                      <div style={{ background: 'rgba(0,0,0,0.7)', padding: '4px 8px', fontSize: 10, color: '#34d399', fontWeight: 700 }}>
                        🔍 OCR Detected: PromptPay QR Code Payload Ready
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SUPPLIERS & WORKFLOW SETUP */}
      {activeSubTab === 'suppliers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>ซัพพลายเออร์ & Procurement Workflow Configuration</h3>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                กำหนดช่องทางสั่งซื้อ, เงื่อนไขชำระเงิน, วงเงินอนุมัติ และคำสั่งเฉพาะรายซัพพลายเออร์
              </p>
            </div>
            <button
              onClick={() => {
                setEditingSupplier(null);
                setSupForm({
                  name: '',
                  contactPerson: '',
                  phone: '',
                  lineId: '',
                  lineGroup: '',
                  category: 'เนื้อสด & ชิ้นส่วนวัว',
                  promptPayId: '',
                  accountName: '',
                  bankName: 'PromptPay (กสิกรไทย)',
                  creditDays: 0,
                  workflowConfig: {
                    channelMethod: 'line_group',
                    paymentTerm: 'promptpay_cod',
                    autoApproveThreshold: 5000,
                    requireOwnerApproval: false,
                    autoSendLineOnLowStock: true,
                    requireDeliveryProofUpload: false,
                    specialInstructions: '',
                  },
                });
                setShowSupplierModal(true);
              }}
              className="btn-primary"
              style={{ padding: '8px 16px', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Plus size={14} /> เพิ่มซัพพลายเออร์ใหม่
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
            {suppliers.map((sup) => {
              const wf = sup.workflowConfig;
              return (
                <div
                  key={sup.id}
                  style={{
                    background: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 14,
                    padding: 18,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  {/* Supplier Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--color-primary)' }}>{sup.name}</h4>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{sup.category}</span>
                    </div>
                    <button
                      onClick={() => {
                        setEditingSupplier(sup);
                        setSupForm({
                          ...sup,
                          workflowConfig: sup.workflowConfig || {
                            channelMethod: 'line_group',
                            paymentTerm: 'promptpay_cod',
                            autoApproveThreshold: 5000,
                            requireOwnerApproval: false,
                            autoSendLineOnLowStock: true,
                            requireDeliveryProofUpload: false,
                            specialInstructions: '',
                          },
                        });
                        setShowSupplierModal(true);
                      }}
                      style={{
                        padding: '6px 10px',
                        background: 'rgba(6, 182, 212, 0.15)',
                        border: '1px solid rgba(6, 182, 212, 0.3)',
                        borderRadius: 6,
                        color: '#22d3ee',
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      <Settings size={14} /> ตั้งค่า Workflow
                    </button>
                  </div>

                  {/* Basic Contact Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#cbd5e1' }}>
                    <div>
                      👤 ผู้ติดต่อ: <strong>{sup.contactPerson}</strong> ({sup.phone})
                    </div>
                    <div>
                      💬 LINE Group: <strong style={{ color: '#22d3ee' }}>{sup.lineGroup}</strong> ({sup.lineId})
                    </div>
                  </div>

                  {/* Workflow Configuration Badge Box */}
                  <div style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: 10, padding: 12, border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 11, color: '#06b6d4', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Settings size={12} /> Configured Procurement Workflow
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                      <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                        <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>ช่องทางสั่งซื้อ</div>
                        <div style={{ fontWeight: 700, color: '#22d3ee' }}>{getChannelLabel(wf?.channelMethod)}</div>
                      </div>

                      <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                        <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>การชำระเงิน</div>
                        <div style={{ fontWeight: 700, color: '#c084fc' }}>{getPaymentTermLabel(wf?.paymentTerm)}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, paddingTop: 4 }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>วงเงินอนุมัติอัตโนมัติ:</span>
                      <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                        ≤ ฿{(wf?.autoApproveThreshold ?? 5000).toLocaleString()}
                      </span>
                    </div>

                    {wf?.requireOwnerApproval && (
                      <div style={{ fontSize: 11, color: '#f87171', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Lock size={12} /> ต้องให้ Owner อนุมัติ PIN ทุกครั้ง
                      </div>
                    )}

                    {wf?.specialInstructions && (
                      <div style={{ fontSize: 11, color: '#fbbf24', fontStyle: 'italic', background: 'rgba(245, 158, 11, 0.1)', padding: '4px 8px', borderRadius: 6 }}>
                        📌 "{wf.specialInstructions}"
                      </div>
                    )}
                  </div>

                  {/* Bank Account Details */}
                  <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: 10, borderRadius: 8, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <div style={{ fontSize: 11, color: '#34d399', fontWeight: 700 }}>🏦 PromptPay Bank Whitelist:</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, marginTop: 2, fontSize: 13 }}>{sup.promptPayId}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      {sup.accountName} • {sup.bankName}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: INVENTORY */}
      {activeSubTab === 'inventory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>ตารางคลังวัตถุดิบ & สินค้าคงเหลือ</h3>
            <button
              onClick={() => {
                setEditingInventory(null);
                setShowInventoryModal(true);
              }}
              className="btn-primary"
              style={{ padding: '6px 12px', fontSize: 12 }}
            >
              <Plus size={14} /> เพิ่มวัตถุดิบใหม่
            </button>
          </div>

          <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                  <th style={{ padding: 12 }}>รายการวัตถุดิบ</th>
                  <th style={{ padding: 12 }}>หมวดหมู่</th>
                  <th style={{ padding: 12 }}>สต็อกคงเหลือ</th>
                  <th style={{ padding: 12 }}>จุดสั่งซื้อขั้นต่ำ</th>
                  <th style={{ padding: 12 }}>ต้นทุนเฉลี่ย / หน่วย</th>
                  <th style={{ padding: 12 }}>ซัพพลายเออร์หลัก</th>
                  <th style={{ padding: 12, textAlign: 'center' }}>จัดการ & AI Auto-PO</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => {
                  const isLow = item.currentStock <= item.minSafetyThreshold;
                  const supplier = suppliers.find((s) => s.id === item.supplierId);
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: 12, fontWeight: 700 }}>
                        {item.nameTh}
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{item.nameEn}</div>
                      </td>
                      <td style={{ padding: 12 }}>{item.category}</td>
                      <td style={{ padding: 12 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: isLow ? '#f87171' : '#34d399' }}>
                          {item.currentStock} {item.unit}
                        </span>
                        {isLow && (
                          <span style={{ marginLeft: 6, fontSize: 10, padding: '2px 6px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', fontWeight: 700 }}>
                            ⚠️ ต่ำกว่าขั้นต่ำ
                          </span>
                        )}
                      </td>
                      <td style={{ padding: 12 }}>
                        {item.minSafetyThreshold} {item.unit}
                      </td>
                      <td style={{ padding: 12, fontFamily: 'var(--font-mono)' }}>฿{item.avgCost}</td>
                      <td style={{ padding: 12 }}>{supplier?.name || '-'}</td>
                      <td style={{ padding: 12, textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          {isLow && (
                            <button
                              onClick={() => triggerAutoPOForLowStock(item.id)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: 6,
                                background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                                border: 'none',
                                color: '#fff',
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <Bot size={13} />
                              <span>🤖 สั่งซื้อ LINE ทันที</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingInventory(item);
                              setInvForm(item);
                              setShowInventoryModal(true);
                            }}
                            style={{ padding: 4, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                          >
                            <Edit2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: AGENT SETTINGS & RBAC */}
      {activeSubTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 650 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>ตั้งค่าความปลอดภัย & การทำงานของ AI Agent</h3>

          <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Toggle Bot */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>เปิดการทำงานบอทจัดซื้อ AI (LINE Procurement Agent)</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>ส่งข้อความสั่งซื้อ และอ่าน OCR ใบเสร็จจาก LINE Group อัตโนมัติ</div>
              </div>
              <input
                type="checkbox"
                checked={lineAgentConfig.botEnabled}
                onChange={(e) => updateLineAgentConfig({ botEnabled: e.target.checked })}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 0 }} />

            {/* Threshold Limit */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>
                วงเงินสิทธิ์ส่งสั่งซื้ออัตโนมัติเริ่มต้น (Default Manager Approval Limit)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number"
                  value={lineAgentConfig.autoApprovalThreshold}
                  onChange={(e) => updateLineAgentConfig({ autoApprovalThreshold: parseFloat(e.target.value) || 0 })}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    color: '#fff',
                    fontSize: 14,
                    width: 160,
                  }}
                />
                <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>บาท (สามารถตั้งค่าแยกรายซัพพลายเออร์ได้ในแท็บ ซัพพลายเออร์)</span>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 0 }} />

            {/* Auto send on low stock */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>สั่งซื้อสินค้าอัตโนมัติทันทีเมื่อวัตถุดิบต่ำกว่าจุดปลอดภัย</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>สร้าง PO และส่งข้อความ LINE ทันทีโดยไม่ต้องกดมือ</div>
              </div>
              <input
                type="checkbox"
                checked={lineAgentConfig.autoSendLineOnLowStock}
                onChange={(e) => updateLineAgentConfig({ autoSendLineOnLowStock: e.target.checked })}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 0 }} />

            {/* Bank Whitelist toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>ตรวจสอบ Whitelist บัญชี PromptPay ซัพพลายเออร์</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>ป้องกัน QR แอบอ้าง โดยตรวจสอบตรงกับบัญชีที่ลงทะเบียนไว้</div>
              </div>
              <input
                type="checkbox"
                checked={lineAgentConfig.verifySupplierBankWhitelist}
                onChange={(e) => updateLineAgentConfig({ verifySupplierBankWhitelist: e.target.checked })}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL: 1-Click PromptPay Payment Modal */}
      {selectedPOForPay && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div
            style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              width: '100%',
              maxWidth: 480,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--color-primary)' }}>
                ชำระเงิน PromptPay & ตัดสต็อกเข้าคลัง ({selectedPOForPay.poNumber})
              </h3>
              <button onClick={() => setSelectedPOForPay(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            {/* Verified Supplier Badge */}
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: 10, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, color: '#34d399', fontSize: 12, fontWeight: 700 }}>
              <ShieldCheck size={18} />
              <span>ผ่านการตรวจสอบ Whitelist บัญชี PromptPay ซัพพลายเออร์แล้ว</span>
            </div>

            {/* Scanned QR Display */}
            <div style={{ textAlign: 'center', background: '#fff', padding: 16, borderRadius: 12 }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(selectedPOForPay.promptPayQrPayload || '')}`}
                alt="PromptPay QR"
                style={{ width: 180, height: 180, display: 'block', margin: '0 auto' }}
              />
              <div style={{ color: '#0f172a', fontWeight: 800, fontSize: 18, marginTop: 8 }}>
                ฿{(selectedPOForPay.ocrExtractedTotal || selectedPOForPay.grandTotal).toLocaleString()}
              </div>
              <div style={{ color: '#475569', fontSize: 12, fontWeight: 600 }}>
                {selectedPOForPay.supplierName} ({suppliers.find((s) => s.id === selectedPOForPay.supplierId)?.promptPayId})
              </div>
            </div>

            <button
              onClick={() => {
                approveAndPayPO(selectedPOForPay.id);
                setSelectedPOForPay(null);
              }}
              className="btn-primary"
              style={{ padding: '12px', fontSize: 14, fontWeight: 800, borderRadius: 10, background: 'linear-gradient(135deg, #10b981, #059669)' }}
            >
              ✅ อนุมัติจ่ายเงิน & ปรับเพิ่มสต็อกวัตถุดิบทันที
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Create PO */}
      {showNewPOModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <form
            onSubmit={handleCreatePO}
            style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              width: '100%',
              maxWidth: 440,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>สร้างใบสั่งซื้อใหม่ (New PO)</h3>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>เลือกซัพพลายเออร์</label>
              <select
                value={newPoSupplierId}
                onChange={(e) => setNewPoSupplierId(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: '#fff' }}
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({getChannelLabel(s.workflowConfig?.channelMethod)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>เลือกวัตถุดิบ</label>
              <select
                value={newPoItemId}
                onChange={(e) => {
                  setNewPoItemId(e.target.value);
                  const found = inventory.find((i) => i.id === e.target.value);
                  if (found) setNewPoUnitPrice(found.avgCost);
                }}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: '#fff' }}
              >
                {inventory.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nameTh} ({i.unit})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>จำนวนที่สั่ง</label>
                <input
                  type="number"
                  value={newPoQty}
                  onChange={(e) => setNewPoQty(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>ราคา / หน่วย (บาท)</label>
                <input
                  type="number"
                  value={newPoUnitPrice}
                  onChange={(e) => setNewPoUnitPrice(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: '#fff' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
              <button type="button" onClick={() => setShowNewPOModal(false)} className="btn-secondary" style={{ padding: '8px 14px' }}>
                ยกเลิก
              </button>
              <button type="submit" className="btn-primary" style={{ padding: '8px 16px' }}>
                บันทึกร่าง PO
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Supplier Add / Edit & Procurement Workflow Config */}
      {showSupplierModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <form
            onSubmit={handleSaveSupplier}
            style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              width: '100%',
              maxWidth: 540,
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--color-primary)' }}>
                {editingSupplier ? `ตั้งค่าซัพพลายเออร์ & Workflow: ${editingSupplier.name}` : 'เพิ่มซัพพลายเออร์ & ตั้งค่า Workflow'}
              </h3>
              {editingSupplier && (
                <button
                  type="button"
                  onClick={() => {
                    deleteSupplier(editingSupplier.id);
                    setShowSupplierModal(false);
                  }}
                  style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}
                >
                  <Trash2 size={13} /> ลบ
                </button>
              )}
            </div>

            {/* Basic Info Section */}
            <div style={{ fontSize: 12, fontWeight: 800, color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              1. ข้อมูลพื้นฐาน & ช่องทางติดต่อ
            </div>

            <input
              type="text"
              placeholder="ชื่อร้าน / บริษัทซัพพลายเออร์"
              value={supForm.name}
              onChange={(e) => setSupForm({ ...supForm, name: e.target.value })}
              required
              style={{ padding: '8px 12px', borderRadius: 6, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: '#fff' }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input
                type="text"
                placeholder="ชื่อผู้ติดต่อ"
                value={supForm.contactPerson}
                onChange={(e) => setSupForm({ ...supForm, contactPerson: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: 6, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: '#fff' }}
              />
              <input
                type="text"
                placeholder="เบอร์โทรศัพท์"
                value={supForm.phone}
                onChange={(e) => setSupForm({ ...supForm, phone: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: 6, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: '#fff' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input
                type="text"
                placeholder="ชื่อ LINE Group (เช่น [LINE Group] ส่งเนื้อสด)"
                value={supForm.lineGroup}
                onChange={(e) => setSupForm({ ...supForm, lineGroup: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: 6, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: '#fff' }}
              />
              <input
                type="text"
                placeholder="PromptPay ID / เบอร์โทรรับเงิน"
                value={supForm.promptPayId}
                onChange={(e) => setSupForm({ ...supForm, promptPayId: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: 6, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: '#fff' }}
              />
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '4px 0' }} />

            {/* Workflow Config Section */}
            <div style={{ fontSize: 12, fontWeight: 800, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Settings size={14} /> 2. ตั้งค่า Procurement Workflow รายซัพพลายเออร์
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>ช่องทางสั่งซื้อ (Order Channel)</label>
                <select
                  value={supForm.workflowConfig?.channelMethod || 'line_group'}
                  onChange={(e) =>
                    setSupForm({
                      ...supForm,
                      workflowConfig: {
                        ...supForm.workflowConfig!,
                        channelMethod: e.target.value as OrderingChannelMethod,
                      },
                    })
                  }
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: '#fff' }}
                >
                  <option value="line_group">💬 LINE Group Chat (บอทส่งกลุ่ม)</option>
                  <option value="line_oa">📱 LINE Official Account (แชทตรง)</option>
                  <option value="phone">📞 โทรศัพท์สั่งตรง</option>
                  <option value="email_pdf">📧 Email (ส่ง PDF ใบ PO)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>เงื่อนไขการชำระเงิน (Payment Terms)</label>
                <select
                  value={supForm.workflowConfig?.paymentTerm || 'promptpay_cod'}
                  onChange={(e) =>
                    setSupForm({
                      ...supForm,
                      workflowConfig: {
                        ...supForm.workflowConfig!,
                        paymentTerm: e.target.value as SupplierPaymentTerm,
                      },
                    })
                  }
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: '#fff' }}
                >
                  <option value="promptpay_cod">⚡ PromptPay สแกนจ่ายทันที (COD)</option>
                  <option value="credit_7">📅 บิลเครดิต 7 วัน</option>
                  <option value="credit_15">📅 บิลเครดิต 15 วัน</option>
                  <option value="credit_30">📅 บิลเครดิต 30 วัน</option>
                  <option value="cash_drawer">💵 เงินสดเบิกลิ้นชักหน้าร้าน</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>
                วงเงินอนุมัติส่ง PO อัตโนมัติ (Auto-Approve Threshold)
              </label>
              <input
                type="number"
                placeholder="เช่น 10000"
                value={supForm.workflowConfig?.autoApproveThreshold || 5000}
                onChange={(e) =>
                  setSupForm({
                    ...supForm,
                    workflowConfig: {
                      ...supForm.workflowConfig!,
                      autoApproveThreshold: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: '#fff' }}
              />
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>หากยอด PO เกินวงเงินนี้ ระบบจะบังคับขอ Owner PIN ก่อนส่งสั่งซื้อ</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: 'rgba(15, 23, 42, 0.5)', padding: 10, borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={supForm.workflowConfig?.requireOwnerApproval || false}
                  onChange={(e) =>
                    setSupForm({
                      ...supForm,
                      workflowConfig: {
                        ...supForm.workflowConfig!,
                        requireOwnerApproval: e.target.checked,
                      },
                    })
                  }
                />
                <span>🔒 บังคับให้ Owner PIN อนุมัติทุกบิล (ไม่ว่าจะกี่บาทก็ตาม)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={supForm.workflowConfig?.autoSendLineOnLowStock ?? true}
                  onChange={(e) =>
                    setSupForm({
                      ...supForm,
                      workflowConfig: {
                        ...supForm.workflowConfig!,
                        autoSendLineOnLowStock: e.target.checked,
                      },
                    })
                  }
                />
                <span>🤖 ส่งข้อความ LINE อัตโนมัติทันทีเมื่อวัตถุดิบต่ำกว่าจุดปลอดภัย</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={supForm.workflowConfig?.requireDeliveryProofUpload || false}
                  onChange={(e) =>
                    setSupForm({
                      ...supForm,
                      workflowConfig: {
                        ...supForm.workflowConfig!,
                        requireDeliveryProofUpload: e.target.checked,
                      },
                    })
                  }
                />
                <span>📸 บังคับให้แนบรูปถ่ายใบเสร็จ / รูปส่งของ ก่อนอนุมัติจ่ายเงิน</span>
              </label>
            </div>

            <input
              type="text"
              placeholder="คำแนะนำพิเศษ (เช่น ส่งก่อน 07:30 น. เท่านั้น)"
              value={supForm.workflowConfig?.specialInstructions || ''}
              onChange={(e) =>
                setSupForm({
                  ...supForm,
                  workflowConfig: {
                    ...supForm.workflowConfig!,
                    specialInstructions: e.target.value,
                  },
                })
              }
              style={{ padding: '8px 12px', borderRadius: 6, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: '#fff' }}
            />

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
              <button type="button" onClick={() => setShowSupplierModal(false)} className="btn-secondary" style={{ padding: '8px 14px' }}>
                ยกเลิก
              </button>
              <button type="submit" className="btn-primary" style={{ padding: '8px 16px' }}>
                บันทึกซัพพลายเออร์ & Workflow
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Inventory Add / Edit */}
      {showInventoryModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <form
            onSubmit={handleSaveInventory}
            style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              width: '100%',
              maxWidth: 480,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>{editingInventory ? 'แก้ไขรายการวัตถุดิบ' : 'เพิ่มวัตถุดิบใหม่'}</h3>
              {editingInventory && (
                <button
                  type="button"
                  onClick={() => {
                    deleteInventoryItem(editingInventory.id);
                    setShowInventoryModal(false);
                  }}
                  style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}
                >
                  <Trash2 size={13} /> ลบ
                </button>
              )}
            </div>

            <input
              type="text"
              placeholder="ชื่อวัตถุดิบ (ภาษาไทย)"
              value={invForm.nameTh}
              onChange={(e) => setInvForm({ ...invForm, nameTh: e.target.value })}
              required
              style={{ padding: '8px 12px', borderRadius: 6, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: '#fff' }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input
                type="text"
                placeholder="หน่วยนับ (เช่น kg, ขวด, Pack)"
                value={invForm.unit}
                onChange={(e) => setInvForm({ ...invForm, unit: e.target.value })}
                required
                style={{ padding: '8px 12px', borderRadius: 6, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: '#fff' }}
              />
              <input
                type="number"
                placeholder="สต็อกคงเหลือปัจจุบัน"
                value={invForm.currentStock}
                onChange={(e) => setInvForm({ ...invForm, currentStock: parseFloat(e.target.value) || 0 })}
                style={{ padding: '8px 12px', borderRadius: 6, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: '#fff' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input
                type="number"
                placeholder="จุดปลอดภัยขั้นต่ำ (Safety Min)"
                value={invForm.minSafetyThreshold}
                onChange={(e) => setInvForm({ ...invForm, minSafetyThreshold: parseFloat(e.target.value) || 0 })}
                style={{ padding: '8px 12px', borderRadius: 6, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: '#fff' }}
              />
              <input
                type="number"
                placeholder="ต้นทุนเฉลี่ย / หน่วย (บาท)"
                value={invForm.avgCost}
                onChange={(e) => setInvForm({ ...invForm, avgCost: parseFloat(e.target.value) || 0 })}
                style={{ padding: '8px 12px', borderRadius: 6, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: '#fff' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
              <button type="button" onClick={() => setShowInventoryModal(false)} className="btn-secondary" style={{ padding: '8px 14px' }}>
                ยกเลิก
              </button>
              <button type="submit" className="btn-primary" style={{ padding: '8px 16px' }}>
                บันทึกวัตถุดิบ
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
