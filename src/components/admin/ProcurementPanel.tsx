import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  Workflow,
  Bot,
  Calendar,
  BookOpen,
  Clock,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Play,
  Plus,
  Search,
  Trash2,
  Edit2,
  Settings,
  ExternalLink,
  Sparkles,
  CheckSquare,
  FileText,
  Zap,
  Send,
  QrCode,
  Building2,
  Truck,
  Package,
  MessageSquare,
  ShieldCheck,
  Flame,
  Database,
  Smile,
  Wrench,
  Eye,
  X,
  ArrowLeft,
  ArrowDown,
  Sliders,
  Layers,
  Info,
} from 'lucide-react';
import type {
  PurchaseOrder,
  Supplier,
  InventoryItem,
  POStatus,
  AutomationWorkflow,
  WorkflowSchedule,
  KnowledgeDocument,
  StaffRole,
  WorkflowCategory,
  WorkflowTriggerType,
  WorkflowCondition,
  ConditionOperator,
  WorkflowActionStep,
  KnowledgeCategory,
} from '../../types/pos';

export const ProcurementPanel: React.FC = () => {
  const {
    // Automation Workflows, Schedules & KM
    workflows,
    workflowSchedules,
    knowledgeDocs,
    toggleWorkflow,
    addWorkflow,
    updateWorkflow,
    deleteWorkflow,
    runWorkflowNow,
    toggleSchedule,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    addKnowledgeDoc,
    updateKnowledgeDoc,
    deleteKnowledgeDoc,

    // Existing Procurement & LINE Agent
    suppliers,
    inventory,
    purchaseOrders,
    lineAgentConfig,
    lineLogs,
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
    createBulkPOForSupplier,
    triggerAllSupplierReorders,
    simulateSaleAndDeductStock,
    menuItems,
    menuRecipes,
    language,
  } = usePOS();

  // Top-level Navigation: 'workflows' | 'scheduling' | 'km'
  const [topTab, setTopTab] = useState<'workflows' | 'scheduling' | 'km'>('workflows');

  // Procurement sub-view toggle inside workflows
  const [showProcurementWorkbench, setShowProcurementWorkbench] = useState(false);
  const [procurementSubTab, setProcurementSubTab] = useState<'pos_agent' | 'suppliers' | 'inventory' | 'settings'>('pos_agent');

  // Pending Reorder customized quantities
  const [customReorderQtys, setCustomReorderQtys] = useState<Record<string, number>>({});
  const [showSalesSimModal, setShowSalesSimModal] = useState(false);
  const [simItemQuantities, setSimItemQuantities] = useState<Record<string, number>>({
    'item-1': 5, // 5x ก๋วยเตี๋ยวธรรมดา
    'item-3': 4, // 4x ก๋วยเตี๋ยวจัมโบ้
    'item-4': 3, // 3x เกาเหลาธรรมดา
    'item-7': 2, // 2x หม้อไฟ
    'item-11': 6, // 6x โค้ก
  });
  const [lastSimResult, setLastSimResult] = useState<{
    totalSales: number;
    totalCogs: number;
    deductedIngredients: { nameTh: string; amount: number; unit: string; currentStock: number }[];
  } | null>(null);

  // Workflow filters & Canvas Studio state
  const [workflowCategoryFilter, setWorkflowCategoryFilter] = useState<string>('all');
  const [selectedWorkflowForCanvas, setSelectedWorkflowForCanvas] = useState<AutomationWorkflow | null>(null);
  const [canvasSimulationStep, setCanvasSimulationStep] = useState<number | null>(null);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [runningToast, setRunningToast] = useState<{ name: string; time: string } | null>(null);

  // Scheduling modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<WorkflowSchedule | null>(null);

  // KM / SOP filters & modals
  const [kmSearchQuery, setKmSearchQuery] = useState('');
  const [kmCategoryFilter, setKmCategoryFilter] = useState<string>('all');
  const [selectedDocForView, setSelectedDocForView] = useState<KnowledgeDocument | null>(null);
  const [showDocModal, setShowDocModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<KnowledgeDocument | null>(null);
  const [checkedSopItems, setCheckedSopItems] = useState<Record<string, boolean>>({});

  // Procurement form states
  const [selectedPOForPay, setSelectedPOForPay] = useState<PurchaseOrder | null>(null);
  const [showNewPOModal, setShowNewPOModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editingInventory, setEditingInventory] = useState<InventoryItem | null>(null);

  const [newPoSupplierId, setNewPoSupplierId] = useState(suppliers[0]?.id || '');
  const [newPoItemId, setNewPoItemId] = useState(inventory[0]?.id || '');
  const [newPoQty, setNewPoQty] = useState(10);
  const [newPoUnitPrice, setNewPoUnitPrice] = useState(inventory[0]?.avgCost || 220);

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

  // Schedule Form State
  const [schForm, setSchForm] = useState<Omit<WorkflowSchedule, 'id'>>({
    workflowId: workflows[0]?.id || '',
    title: '',
    timeOfDay: '08:00',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    cronExpression: '0 8 * * *',
    enabled: true,
    targetAction: '',
    allowedRoles: ['owner', 'manager'],
    requireApproval: false,
    approverRole: 'manager',
    status: 'active',
  });

  // KM Form State
  const [docForm, setDocForm] = useState<Omit<KnowledgeDocument, 'id' | 'updatedAt'>>({
    titleTh: '',
    titleEn: '',
    category: 'operations',
    summary: '',
    contentMarkdown: '',
    tags: [],
    authorRole: 'manager',
    version: 'v1.0',
    linkedWorkflowIds: [],
    checklists: [
      { id: 'c-1', text: 'ตรวจเช็คความสะอาดและความเรียบร้อย', required: true }
    ],
  });

  // Open Canvas for new Workflow
  const handleCreateNewWorkflowCanvas = () => {
    const newWorkflowDraft: AutomationWorkflow = {
      id: `wf-${Date.now()}`,
      nameTh: 'เวิร์กโฟลว์ใหม่ (Custom Automation)',
      nameEn: 'Custom Automation Flow',
      category: 'operations',
      descriptionTh: 'กำหนดทริกเกอร์ เงื่อนไขการตรวจสอบ และลำดับคำสั่งอัตโนมัติ',
      descriptionEn: 'Custom rule-based automated workflow',
      icon: 'Zap',
      enabled: true,
      triggerType: 'threshold',
      triggerCondition: 'เมื่อเกิดเหตุการณ์ตามเงื่อนไขที่กำหนด',
      triggerLabel: '📦 สต็อก หรือ Event ในร้าน',
      conditions: [
        {
          id: `cond-${Date.now()}-1`,
          field: 'stock_level',
          fieldLabelTh: 'สต็อกคงเหลือ (Current Stock)',
          operator: 'less_or_equal',
          value: '10 kg',
          description: 'หากสต็อกคงเหลือน้อยกว่าหรือเท่ากับ 10',
        },
      ],
      actions: [
        {
          id: `act-${Date.now()}-1`,
          type: 'line_notify',
          title: 'แจ้งเตือนผ่าน LINE',
          description: 'ส่งข้อความแจ้งเตือนเข้ากลุ่มผู้จัดการ',
          targetChannel: 'LINE Manager Group',
        },
      ],
      allowedRoles: ['owner', 'manager'],
      approverRole: 'manager',
      scheduleHuman: 'ทำงานทันทีเมื่อเงื่อนไขเป็นจริง (Real-time)',
      linkedSopId: knowledgeDocs[0]?.id || '',
      executionCount: 0,
    };
    setSelectedWorkflowForCanvas(newWorkflowDraft);
    setCanvasSimulationStep(null);
    setSimulationLogs([]);
  };

  // Live Canvas Flow Simulator
  const handleSimulateCanvasFlow = () => {
    if (!selectedWorkflowForCanvas) return;
    setCanvasSimulationStep(0);
    setSimulationLogs(['[00.0s] 🚀 เริ่มต้นการทดสอบจำลองรัน Canvas Flow...']);

    // Step 1: Trigger
    setTimeout(() => {
      setCanvasSimulationStep(1);
      setSimulationLogs((prev) => [
        ...prev,
        `[00.5s] ⚡ TRIGGER DETECTED: ตรวจพบเหตุการณ์ "${selectedWorkflowForCanvas.triggerLabel || selectedWorkflowForCanvas.triggerCondition}"`,
      ]);
    }, 600);

    // Step 2: Conditions
    setTimeout(() => {
      setCanvasSimulationStep(2);
      const conditionCount = selectedWorkflowForCanvas.conditions?.length || 0;
      setSimulationLogs((prev) => [
        ...prev,
        `[01.2s] 🔀 CONDITIONS EVALUATED: ตรวจสอบ ${conditionCount} เงื่อนไข... ผลลัพธ์: [TRUE / ผ่านทุกข้อ] ✅`,
      ]);
    }, 1400);

    // Step 3: Actions
    setTimeout(() => {
      setCanvasSimulationStep(3);
      setSimulationLogs((prev) => [
        ...prev,
        `[02.0s] ⚙️ ACTIONS PIPELINE: กำลังสั่งประมวลผล ${selectedWorkflowForCanvas.actions.length} คำสั่งอัตโนมัติ...`,
      ]);
      selectedWorkflowForCanvas.actions.forEach((act, idx) => {
        setTimeout(() => {
          setSimulationLogs((prev) => [
            ...prev,
            `  └─ [Step ${idx + 1}] ✓ สำเร็จ: ${act.title} (${act.targetChannel || 'POS Core'})`,
          ]);
        }, (idx + 1) * 400);
      });
    }, 2200);

    // Step 4: RBAC & Gateway
    setTimeout(() => {
      setCanvasSimulationStep(4);
      setSimulationLogs((prev) => [
        ...prev,
        `[03.4s] 🛡️ RBAC & AUDIT LOG: บันทึกประวัติและตรวจสอบสิทธิ์ [${selectedWorkflowForCanvas.allowedRoles.join(', ')}] เสร็จสิ้นสมบูรณ์ 🎉`,
      ]);
    }, 3400);
  };

  const triggerWorkflowWithFeedback = (wf: AutomationWorkflow) => {
    runWorkflowNow(wf.id);
    setRunningToast({ name: wf.nameTh, time: new Date().toLocaleTimeString('th-TH') });
    setTimeout(() => {
      setRunningToast(null);
    }, 3500);
  };

  // -------------------------------------------------------------
  // BOM + Stock + Supplier Procurement Automation Engine
  // -------------------------------------------------------------
  const lowStockInventory = inventory.filter((inv) => inv.currentStock <= inv.minSafetyThreshold);

  const supplierReorderMap = suppliers
    .map((sup) => {
      const items = lowStockInventory.filter((inv) => (inv.supplierId || suppliers[0]?.id) === sup.id);
      const totalEstimatedCost = items.reduce((sum, item) => {
        const qty = customReorderQtys[item.id] !== undefined
          ? customReorderQtys[item.id]
          : Math.max(10, Math.ceil(item.minSafetyThreshold * 1.5 - item.currentStock));
        return sum + qty * item.avgCost;
      }, 0);

      return {
        supplier: sup,
        items,
        totalEstimatedCost,
      };
    })
    .filter((group) => group.items.length > 0);

  const handleTriggerSupplierPO = (supGroup: (typeof supplierReorderMap)[0]) => {
    const poItems = supGroup.items.map((item) => ({
      inventoryItemId: item.id,
      qtyOrdered:
        customReorderQtys[item.id] !== undefined
          ? customReorderQtys[item.id]
          : Math.max(10, Math.ceil(item.minSafetyThreshold * 1.5 - item.currentStock)),
      unitPrice: item.avgCost,
    }));

    const newPo = createBulkPOForSupplier(supGroup.supplier.id, poItems, true);
    setRunningToast({
      name: `สร้างใบสั่งซื้อ ${newPo.poNumber} (${poItems.length} รายการ) ส่ง LINE ให้ ${supGroup.supplier.name} แล้ว!`,
      time: '1-Click Auto PO',
    });
    setTimeout(() => setRunningToast(null), 4000);
  };

  const handleTriggerAllPOs = () => {
    const created = triggerAllSupplierReorders();
    setRunningToast({
      name: `⚡ สร้างใบสั่งซื้ออัตโนมัติสำเร็จ ${created.length} ฉบับ ครบทุก Supplier แล้ว!`,
      time: 'Auto Reorder All',
    });
    setTimeout(() => setRunningToast(null), 4000);
  };

  const handleRunSaleSimulation = () => {
    const saleList = Object.entries(simItemQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([menuItemId, quantity]) => ({ menuItemId, quantity }));

    if (saleList.length === 0) return;

    const result = simulateSaleAndDeductStock(saleList);
    setLastSimResult(result);
    setRunningToast({
      name: `จำลองขาย ${saleList.length} รายการสำเร็จ ยอดขาย ฿${result.totalSales.toLocaleString()} และตัดสต็อกวัตถุดิบตามสูตร BOM เรียบร้อย!`,
      time: 'BOM Stock Deducted',
    });
    setTimeout(() => setRunningToast(null), 4000);
  };

  const getWorkflowIcon = (iconName: string) => {
    switch (iconName) {
      case 'Bot': return <Bot size={20} color="#10b981" />;
      case 'Wallet': return <Zap size={20} color="#f59e0b" />;
      case 'Flame': return <Flame size={20} color="#f43f5e" />;
      case 'Database': return <Database size={20} color="#3b82f6" />;
      case 'Smile': return <Smile size={20} color="#a855f7" />;
      case 'Wrench': return <Wrench size={20} color="#06b6d4" />;
      default: return <Workflow size={20} color="#f59e0b" />;
    }
  };

  const getCategoryBadge = (cat: WorkflowCategory) => {
    switch (cat) {
      case 'procurement':
        return (
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            📦 จัดซื้อ & ซัพพลายเออร์
          </span>
        );
      case 'finance':
        return (
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            💰 การเงิน & ปิดกะ
          </span>
        );
      case 'operations':
        return (
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            🍳 งานครัว & ปฏิบัติการ
          </span>
        );
      case 'inventory':
        return (
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
            📊 คลังสต็อก
          </span>
        );
      case 'customer':
        return (
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6', border: '1px solid rgba(236, 72, 153, 0.3)' }}>
            🌟 ลูกค้า & รีวิว
          </span>
        );
      default:
        return (
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8' }}>
            ⚙️ ทั่วไป
          </span>
        );
    }
  };

  const getRoleBadge = (role: StaffRole) => {
    switch (role) {
      case 'owner':
        return (
          <span key={role} style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            👑 Owner
          </span>
        );
      case 'admin':
        return (
          <span key={role} style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
            🛡️ Admin
          </span>
        );
      case 'manager':
        return (
          <span key={role} style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            👔 Manager
          </span>
        );
      case 'cashier':
        return (
          <span key={role} style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            💵 Cashier
          </span>
        );
      case 'kitchen':
        return (
          <span key={role} style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: 'rgba(244, 63, 94, 0.2)', color: '#fb7185', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
            🍳 Kitchen
          </span>
        );
    }
  };

  const getStatusBadge = (status: POStatus) => {
    switch (status) {
      case 'draft':
        return <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>📝 ร่าง PO</span>;
      case 'sent_line':
        return <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>💬 ส่ง LINE แล้ว</span>;
      case 'ocr_received':
        return <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)' }}>🔍 รอตรวจ OCR</span>;
      case 'reconciled':
        return <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.3)' }}>✅ ตรวจสอบแล้ว</span>;
      case 'completed':
        return <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>🎉 จ่ายแล้ว & เข้าสต็อก</span>;
      default:
        return null;
    }
  };

  const filteredWorkflows = workflows.filter((w) => {
    if (workflowCategoryFilter !== 'all' && w.category !== workflowCategoryFilter) return false;
    return true;
  });

  const filteredKnowledgeDocs = knowledgeDocs.filter((doc) => {
    if (kmCategoryFilter !== 'all' && doc.category !== kmCategoryFilter) return false;
    if (kmSearchQuery.trim()) {
      const q = kmSearchQuery.toLowerCase();
      const matchTitle = doc.titleTh.toLowerCase().includes(q) || doc.titleEn.toLowerCase().includes(q);
      const matchSummary = doc.summary.toLowerCase().includes(q);
      const matchTags = doc.tags.some((t) => t.toLowerCase().includes(q));
      return matchTitle || matchSummary || matchTags;
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, color: 'var(--color-text-primary)' }}>
      {/* Toast feedback when workflow runs */}
      {runningToast && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 9999,
            background: 'linear-gradient(135deg, #064e3b, #022c22)',
            border: '1px solid #10b981',
            color: '#ecfdf5',
            padding: '12px 18px',
            borderRadius: 12,
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Sparkles size={20} color="#34d399" />
          <div>
            <div style={{ fontWeight: 800, fontSize: 13 }}>สั่งรันเวิร์กโฟลว์สำเร็จ!</div>
            <div style={{ fontSize: 11, color: '#a7f3d0' }}>{runningToast.name} ({runningToast.time})</div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))',
          padding: '20px 24px',
          borderRadius: 16,
          border: '1px solid var(--color-border)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
            }}
          >
            <Workflow size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: 19, fontWeight: 800, margin: 0, color: '#fff' }}>
                {language === 'th' ? 'ศูนย์จัดการเวิร์กโฟลว์อัตโนมัติ (Automation Workflow Hub)' : 'Automation Workflow & Procurement Center'}
              </h2>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 8,
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#fbbf24',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                }}
              >
                PRO Canvas Engine
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
              {language === 'th'
                ? 'ผังการทำงานอัตโนมัติ Trigger ➔ Condition ➔ Action • ระบบจัดซื้อ & LINE Bot • RBAC Scheduling • คลังความรู้ KM'
                : 'Interactive Workflow Canvas (Trigger ➔ Condition ➔ Actions) • LINE Procurement • RBAC Scheduling • KM Base'}
            </p>
          </div>
        </div>

        {/* Global Action Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', padding: '8px 14px', borderRadius: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>เวิร์กโฟลว์</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fbbf24' }}>{workflows.length}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', padding: '8px 14px', borderRadius: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>ตารางเวลา RBAC</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#60a5fa' }}>{workflowSchedules.length}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', padding: '8px 14px', borderRadius: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>คลัง SOP</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#34d399' }}>{knowledgeDocs.length}</div>
          </div>
        </div>
      </div>

      {/* Main 3 Navigation Tabs */}
      <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid var(--color-border)', paddingBottom: 8, overflowX: 'auto' }}>
        <button
          onClick={() => { setTopTab('workflows'); setShowProcurementWorkbench(false); }}
          style={{
            padding: '10px 18px',
            borderRadius: 10,
            border: 'none',
            background: topTab === 'workflows' && !showProcurementWorkbench ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.05)',
            color: topTab === 'workflows' && !showProcurementWorkbench ? '#000' : 'var(--color-text-secondary)',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: topTab === 'workflows' && !showProcurementWorkbench ? '0 4px 12px rgba(245, 158, 11, 0.3)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          <Zap size={16} />
          <span>⚡ เวิร์กโฟลว์ทั้งหมด (Workflows & Canvas)</span>
          <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 8, background: 'rgba(0,0,0,0.25)', fontWeight: 800 }}>{workflows.length}</span>
        </button>

        <button
          onClick={() => { setTopTab('scheduling'); setShowProcurementWorkbench(false); }}
          style={{
            padding: '10px 18px',
            borderRadius: 10,
            border: 'none',
            background: topTab === 'scheduling' ? '#3b82f6' : 'rgba(255, 255, 255, 0.05)',
            color: topTab === 'scheduling' ? '#fff' : 'var(--color-text-secondary)',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: topTab === 'scheduling' ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          <Clock size={16} />
          <span>⏱️ ตารางเวลา & สิทธิ์ RBAC (Scheduling)</span>
          <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 8, background: 'rgba(0,0,0,0.25)', fontWeight: 800 }}>{workflowSchedules.length}</span>
        </button>

        <button
          onClick={() => { setTopTab('km'); setShowProcurementWorkbench(false); }}
          style={{
            padding: '10px 18px',
            borderRadius: 10,
            border: 'none',
            background: topTab === 'km' ? '#10b981' : 'rgba(255, 255, 255, 0.05)',
            color: topTab === 'km' ? '#000' : 'var(--color-text-secondary)',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: topTab === 'km' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          <BookOpen size={16} />
          <span>📚 คลังความรู้ & SOP (Knowledge Base - KM)</span>
          <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 8, background: 'rgba(0,0,0,0.25)', fontWeight: 800 }}>{knowledgeDocs.length}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: WORKFLOW CATALOG & PROCUREMENT */}
      {/* ========================================================================= */}
      {topTab === 'workflows' && !showProcurementWorkbench && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Featured Hero: Autonomous Procurement Workflow */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.4), rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.8))',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: 16,
              padding: 24,
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 20,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ maxWidth: 700, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 900, background: '#10b981', color: '#000', padding: '3px 8px', borderRadius: 6, textTransform: 'uppercase' }}>
                  Core Autonomous Workflow
                </span>
                <span style={{ fontSize: 11, color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                  LINE Procurement Agent Active
                </span>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#fff' }}>
                🤖 ระบบจัดซื้อ & สั่งของซัพพลายเออร์ผ่าน LINE อัตโนมัติ (LINE Autonomous Procurement)
              </h3>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6 }}>
                เชื่อมต่อสต็อกวัตถุดิบเข้ากับ LINE กลุ่มซัพพลายเออร์ สั่งซื้ออัตโนมัติเมื่อสต็อกต่ำกว่าเกณฑ์ความปลอดภัย ตรวจสอบสลิปผ่าน AI OCR และรองรับการชำระเงิน PromptPay 1-Click
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, paddingTop: 4 }}>
                <div style={{ fontSize: 11, background: 'rgba(0,0,0,0.4)', padding: '5px 10px', borderRadius: 8, border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 6, color: '#e2e8f0' }}>
                  <Truck size={13} color="#f59e0b" />
                  <span>{suppliers.length} ซัพพลายเออร์</span>
                </div>
                <div style={{ fontSize: 11, background: 'rgba(0,0,0,0.4)', padding: '5px 10px', borderRadius: 8, border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 6, color: '#e2e8f0' }}>
                  <AlertTriangle size={13} color="#f43f5e" />
                  <span>{inventory.filter((i) => i.currentStock <= i.minSafetyThreshold).length} รายการสต็อกเตือน</span>
                </div>
                <div style={{ fontSize: 11, background: 'rgba(0,0,0,0.4)', padding: '5px 10px', borderRadius: 8, border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 6, color: '#e2e8f0' }}>
                  <MessageSquare size={13} color="#10b981" />
                  <span>{lineLogs.length} ประวัติข้อความ LINE</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 240 }}>
              <button
                onClick={() => setShowProcurementWorkbench(true)}
                className="btn-primary"
                style={{
                  padding: '12px 20px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#000',
                  fontWeight: 800,
                  fontSize: 13,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                }}
              >
                <Bot size={16} />
                <span>เปิดห้องควบคุมจัดซื้อ (Procurement Suite)</span>
                <ExternalLink size={14} />
              </button>
              <button
                onClick={() => {
                  const wf = workflows.find((w) => w.isSpecialProcurement) || workflows[0];
                  setSelectedWorkflowForCanvas(wf);
                  setCanvasSimulationStep(null);
                  setSimulationLogs([]);
                }}
                className="btn-secondary"
                style={{
                  padding: '9px 16px',
                  fontSize: 12,
                  fontWeight: 700,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Workflow size={14} color="#f59e0b" />
                <span>เปิด Canvas ผังจัดซื้อ (Trigger ➔ Action)</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BOM + SALE AUTO-TRIGGERED SUPPLIER REORDER WORKBENCH */}
          {/* ========================================================================= */}
          <div
            style={{
              background: 'var(--color-bg-card)',
              border: '1.5px solid ' + (supplierReorderMap.length > 0 ? 'rgba(244, 63, 94, 0.4)' : 'var(--color-border)'),
              borderRadius: 16,
              padding: 22,
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            }}
          >
            {/* Header with status and quick triggers */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: supplierReorderMap.length > 0 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: supplierReorderMap.length > 0 ? '#f43f5e' : '#34d399',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid ' + (supplierReorderMap.length > 0 ? 'rgba(244, 63, 94, 0.3)' : 'rgba(16, 185, 129, 0.3)'),
                  }}
                >
                  <Truck size={24} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h4 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>
                      📦 รายการสินค้ารอการสั่งซื้อจัดกลุ่มตาม Supplier (Triggered from BOM + POS Sales)
                    </h4>
                    {supplierReorderMap.length > 0 ? (
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 12, background: 'rgba(244, 63, 94, 0.2)', color: '#f87171', border: '1px solid rgba(244, 63, 94, 0.4)' }}>
                        ตรวจพบสต็อกต่ำ {lowStockInventory.length} รายการ ({supplierReorderMap.length} Supplier)
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 12, background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
                        ✓ สต็อกปลอดภัยทุกรายการ
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                    ตัดสต็อกอัตโนมัติตามสูตรอาหาร BOM จากยอดขายจริง และจัดเตรียมใบสั่งซื้อแยกตามคู่ค้าให้ผู้ใช้ตรวจสอบและกดยิงออก PO ทันที
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                {/* Sale Simulator Button */}
                <button
                  type="button"
                  onClick={() => setShowSalesSimModal(true)}
                  className="btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 12, fontWeight: 700 }}
                >
                  <Flame size={15} style={{ color: '#f59e0b' }} />
                  <span>🧪 จำลองการขาย POS & ตัดสต็อก BOM</span>
                </button>

                {/* Trigger All Button */}
                {supplierReorderMap.length > 0 && (
                  <button
                    type="button"
                    onClick={handleTriggerAllPOs}
                    className="btn-primary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 18px',
                      fontSize: 12,
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
                      color: '#fff',
                      boxShadow: '0 4px 14px rgba(244, 63, 94, 0.35)',
                    }}
                  >
                    <Zap size={15} />
                    <span>⚡ 1-Click ออก PO รวมทุก Supplier ({supplierReorderMap.length} ฉบับ)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Supplier Grouped Cards */}
            {supplierReorderMap.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16 }}>
                {supplierReorderMap.map((supGroup) => {
                  return (
                    <div
                      key={supGroup.supplier.id}
                      style={{
                        background: 'var(--color-bg-elevated)',
                        border: '1.5px solid rgba(244, 63, 94, 0.35)',
                        borderRadius: 14,
                        padding: 18,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 14,
                        position: 'relative',
                        boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
                      }}
                    >
                      {/* Supplier Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: 10 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Building2 size={16} style={{ color: 'var(--color-primary)' }} />
                            <h5 style={{ fontWeight: 800, fontSize: 15, color: '#fff', margin: 0 }}>{supGroup.supplier.name}</h5>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                            {supGroup.supplier.category} • ติดต่อ: {supGroup.supplier.contactPerson} ({supGroup.supplier.phone})
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#34d399',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                          }}
                        >
                          💬 {supGroup.supplier.lineGroup || 'LINE Direct'}
                        </span>
                      </div>

                      {/* Items List */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {supGroup.items.map((item) => {
                          const currentVal =
                            customReorderQtys[item.id] !== undefined
                              ? customReorderQtys[item.id]
                              : Math.max(10, Math.ceil(item.minSafetyThreshold * 1.5 - item.currentStock));
                          const lineTotal = currentVal * item.avgCost;

                          return (
                            <div
                              key={item.id}
                              style={{
                                background: 'var(--color-bg-card)',
                                borderRadius: 8,
                                padding: '10px 12px',
                                display: 'grid',
                                gridTemplateColumns: '1.6fr 1fr 1.2fr',
                                gap: 10,
                                alignItems: 'center',
                                border: '1px solid var(--color-border)',
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>{item.nameTh}</div>
                                <div style={{ fontSize: 10, color: '#f87171', fontWeight: 600 }}>
                                  คงเหลือ: {item.currentStock} / เกณฑ์: {item.minSafetyThreshold} {item.unit}
                                </div>
                              </div>

                              <div>
                                <label style={{ fontSize: 10, color: 'var(--color-text-muted)', display: 'block' }}>จำนวนสั่ง (Qty)</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <input
                                    type="number"
                                    min="1"
                                    value={currentVal}
                                    onChange={(e) =>
                                      setCustomReorderQtys({
                                        ...customReorderQtys,
                                        [item.id]: Number(e.target.value),
                                      })
                                    }
                                    style={{
                                      width: 60,
                                      padding: '4px 6px',
                                      background: 'var(--color-bg-elevated)',
                                      border: '1px solid var(--color-border)',
                                      borderRadius: 4,
                                      color: '#fff',
                                      fontSize: 12,
                                      fontFamily: 'var(--font-mono)',
                                      fontWeight: 800,
                                      textAlign: 'center',
                                    }}
                                  />
                                  <span style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>{item.unit}</span>
                                </div>
                              </div>

                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>฿{item.avgCost}/{item.unit}</div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                                  ฿{lineTotal.toLocaleString()}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Card Total & Action Trigger */}
                      <div
                        style={{
                          marginTop: 'auto',
                          paddingTop: 10,
                          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                            ยอดสั่งซื้อรวม ({supGroup.items.length} รายการ):
                          </span>
                          <span style={{ fontSize: 16, fontWeight: 900, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                            ฿{supGroup.totalEstimatedCost.toLocaleString()}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleTriggerSupplierPO(supGroup)}
                          className="btn-primary"
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            fontSize: 13,
                            fontWeight: 800,
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            color: '#000',
                          }}
                        >
                          <Send size={15} />
                          <span>⚡ 1-Click ออก PO & ยิง LINE สั่งซื้อทันที</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px dashed rgba(16, 185, 129, 0.3)',
                  borderRadius: 12,
                  padding: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>
                      สต็อกวัตถุดิบทุกรายการอยู่ในเกณฑ์ปลอดภัย (Safety Stocks Optimal)
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                      ไม่มีวัตถุดิบขาดสต็อกที่ต้องเปิดใบสั่งซื้อด่วนในขณะนี้ คุณสามารถทดสอบจำลองการขายหน้าร้านเพื่อทดสอบระบบตัดสต็อก BOM
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSalesSimModal(true)}
                  className="btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', fontSize: 13, fontWeight: 700 }}
                >
                  <Flame size={16} />
                  <span>🧪 ทดสอบจำลองขายหน้าร้านเพื่อดู Trigger</span>
                </button>
              </div>
            )}
          </div>

          {/* Workflow Catalog Filters & Create Action */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'ทั้งหมด' },
                { id: 'procurement', label: '📦 จัดซื้อ' },
                { id: 'finance', label: '💰 การเงิน' },
                { id: 'operations', label: '🍳 ครัว & งานร้าน' },
                { id: 'customer', label: '🌟 ลูกค้า' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setWorkflowCategoryFilter(f.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: 'none',
                    background: workflowCategoryFilter === f.id ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    color: workflowCategoryFilter === f.id ? '#fbbf24' : 'var(--color-text-secondary)',
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                    outline: workflowCategoryFilter === f.id ? '1px solid rgba(245, 158, 11, 0.4)' : 'none',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleCreateNewWorkflowCanvas}
              className="btn-primary"
              style={{
                padding: '10px 20px',
                fontSize: 13,
                fontWeight: 800,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#000',
              }}
            >
              <Workflow size={16} />
              <span>+ ออกแบบเวิร์กโฟลว์ด้วย Canvas (Open Canvas)</span>
            </button>
          </div>

          {/* Workflow Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 16 }}>
            {filteredWorkflows.map((wf) => {
              const linkedSop = knowledgeDocs.find((d) => d.id === wf.linkedSopId);
              return (
                <div
                  key={wf.id}
                  style={{
                    background: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 14,
                    padding: 18,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 14,
                    opacity: wf.enabled ? 1 : 0.6,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Header: Icon, Name & Toggle */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid var(--color-border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {getWorkflowIcon(wf.icon)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 14, color: '#fff' }}>{wf.nameTh}</div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{wf.nameEn}</div>
                        </div>
                      </div>

                      {/* Enable Switch */}
                      <button
                        onClick={() => toggleWorkflow(wf.id)}
                        style={{
                          width: 42,
                          height: 22,
                          borderRadius: 20,
                          background: wf.enabled ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.15)',
                          border: 'none',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'background 0.2s',
                          padding: 2,
                        }}
                      >
                        <span
                          style={{
                            display: 'block',
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            background: '#fff',
                            transform: wf.enabled ? 'translateX(20px)' : 'translateX(0px)',
                            transition: 'transform 0.2s',
                          }}
                        />
                      </button>
                    </div>

                    {/* Category & Trigger Condition */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {getCategoryBadge(wf.category)}
                      <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', background: 'rgba(255, 255, 255, 0.05)', padding: '2px 8px', borderRadius: 6, border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={11} color="#fbbf24" />
                        <span>{wf.triggerLabel || wf.scheduleHuman || wf.triggerCondition}</span>
                      </span>
                    </div>

                    {/* Description */}
                    <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
                      {wf.descriptionTh}
                    </p>

                    {/* Visual Mini-Flowchart Preview */}
                    <div style={{ background: 'rgba(0, 0, 0, 0.35)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                        <span>ผังการทำงาน (Canvas Flow):</span>
                        <span style={{ color: '#fbbf24' }}>
                          ⚡ Trigger ➔ 🔀 {wf.conditions?.length || 1} Conditions ➔ ⚙️ {wf.actions.length} Actions
                        </span>
                      </div>

                      {/* Mini Flow Nodes */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 11 }}>
                        <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '3px 8px', borderRadius: 6, color: '#fbbf24', fontWeight: 700 }}>
                          ⚡ {wf.triggerType.toUpperCase()}
                        </div>
                        <span style={{ color: 'var(--color-text-muted)' }}>➔</span>
                        <div style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '3px 8px', borderRadius: 6, color: '#60a5fa', fontWeight: 700 }}>
                          🔀 IF ({wf.conditions?.[0]?.fieldLabelTh || 'เงื่อนไข'})
                        </div>
                        <span style={{ color: 'var(--color-text-muted)' }}>➔</span>
                        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '3px 8px', borderRadius: 6, color: '#34d399', fontWeight: 700 }}>
                          ⚙️ {wf.actions[0]?.title || 'Action'}
                        </div>
                        {wf.actions.length > 1 && (
                          <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>+{wf.actions.length - 1} more</span>
                        )}
                      </div>
                    </div>

                    {/* Roles & Linked SOP */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>สิทธิ์:</span>
                        {wf.allowedRoles.map((r) => getRoleBadge(r))}
                      </div>

                      {linkedSop && (
                        <button
                          onClick={() => {
                            setSelectedDocForView(linkedSop);
                            setTopTab('km');
                          }}
                          style={{
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            color: '#34d399',
                            borderRadius: 6,
                            padding: '3px 8px',
                            fontSize: 10,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <BookOpen size={11} />
                          <span>ดู SOP ({linkedSop.version})</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bottom Stats & Canvas Trigger Action */}
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      รันแล้ว <strong style={{ color: '#fff' }}>{wf.executionCount}</strong> ครั้ง
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {/* Open Canvas Studio Button */}
                      <button
                        onClick={() => {
                          setSelectedWorkflowForCanvas(wf);
                          setCanvasSimulationStep(null);
                          setSimulationLogs([]);
                        }}
                        className="btn-secondary"
                        style={{
                          padding: '6px 12px',
                          borderRadius: 8,
                          fontSize: 11,
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          color: '#fbbf24',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          background: 'rgba(245, 158, 11, 0.1)',
                        }}
                      >
                        <Workflow size={13} />
                        <span>เปิด Canvas</span>
                      </button>

                      <button
                        onClick={() => triggerWorkflowWithFeedback(wf)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 8,
                          background: 'rgba(16, 185, 129, 0.2)',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          color: '#34d399',
                          fontWeight: 800,
                          fontSize: 11,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                        }}
                      >
                        <Play size={11} />
                        <span>รันทันที</span>
                      </button>

                      {!wf.isSpecialProcurement && (
                        <button
                          onClick={() => deleteWorkflow(wf.id)}
                          style={{ padding: 6, background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer' }}
                          title="ลบเวิร์กโฟลว์"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CANVAS STUDIO MODAL: INTERACTIVE TRIGGER ➔ CONDITION ➔ ACTION BUILDER */}
      {/* ========================================================================= */}
      {selectedWorkflowForCanvas && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div
            className="modal-content-card"
            style={{
              maxWidth: 960,
              width: '100%',
              padding: 0,
              background: '#090d16',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            }}
          >
            {/* Canvas Studio Header */}
            <div
              style={{
                padding: '16px 24px',
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#000',
                  }}
                >
                  <Workflow size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="text"
                      value={selectedWorkflowForCanvas.nameTh}
                      onChange={(e) => setSelectedWorkflowForCanvas({ ...selectedWorkflowForCanvas, nameTh: e.target.value })}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '1px dashed rgba(255,255,255,0.3)',
                        fontSize: 16,
                        fontWeight: 800,
                        color: '#fff',
                        padding: '2px 4px',
                        outline: 'none',
                        minWidth: 280,
                      }}
                    />
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', fontWeight: 800 }}>
                      CANVAS STUDIO
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                    ลาก/ตั้งค่า ทริกเกอร์ ➔ เงื่อนไขตรวจสอบ (Conditions) ➔ คำสั่งอัตโนมัติ (Actions)
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Simulator Trigger */}
                <button
                  type="button"
                  onClick={handleSimulateCanvasFlow}
                  className="btn-secondary"
                  style={{
                    padding: '8px 16px',
                    fontSize: 12,
                    fontWeight: 800,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    background: 'rgba(16, 185, 129, 0.1)',
                  }}
                >
                  <Play size={13} />
                  <span>▶️ ทดสอบจำลองรัน Flow</span>
                </button>

                {/* Save Canvas */}
                <button
                  type="button"
                  onClick={() => {
                    const existing = workflows.find((w) => w.id === selectedWorkflowForCanvas.id);
                    if (existing) {
                      updateWorkflow(selectedWorkflowForCanvas);
                    } else {
                      addWorkflow(selectedWorkflowForCanvas);
                    }
                    setSelectedWorkflowForCanvas(null);
                    setRunningToast({ name: selectedWorkflowForCanvas.nameTh, time: 'บันทึก Canvas แล้ว' });
                  }}
                  className="btn-primary"
                  style={{
                    padding: '8px 18px',
                    fontSize: 12,
                    fontWeight: 800,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#000',
                  }}
                >
                  <CheckSquare size={14} />
                  <span>บันทึกเวิร์กโฟลว์</span>
                </button>

                <button
                  onClick={() => setSelectedWorkflowForCanvas(null)}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Canvas Body (Flowchart Pipeline) */}
            <div
              style={{
                padding: 24,
                maxHeight: '72vh',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                background: 'radial-gradient(circle at center, rgba(30, 41, 59, 0.4) 0%, #090d16 100%)',
              }}
            >
              {/* Simulation Log Box (if running simulation) */}
              {canvasSimulationStep !== null && (
                <div
                  style={{
                    width: '100%',
                    background: '#022c22',
                    border: '1px solid #059669',
                    borderRadius: 12,
                    padding: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    fontSize: 12,
                    fontFamily: 'monospace',
                    color: '#a7f3d0',
                  }}
                >
                  <div style={{ fontWeight: 800, color: '#34d399', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={14} />
                    <span>ผลการจำลองการไหลของข้อมูล (Live Execution Trace):</span>
                  </div>
                  {simulationLogs.map((log, lIdx) => (
                    <div key={lIdx} style={{ paddingLeft: 8 }}>{log}</div>
                  ))}
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* NODE 1: TRIGGER NODE */}
              {/* ------------------------------------------------------------- */}
              <div
                style={{
                  width: '100%',
                  maxWidth: 680,
                  background: canvasSimulationStep === 1 ? 'linear-gradient(135deg, #1e293b, #064e3b)' : 'var(--color-bg-card)',
                  border: canvasSimulationStep === 1 ? '2px solid #10b981' : '1px solid rgba(245, 158, 11, 0.4)',
                  borderRadius: 14,
                  padding: 18,
                  boxShadow: canvasSimulationStep === 1 ? '0 0 20px rgba(16, 185, 129, 0.4)' : '0 4px 14px rgba(0,0,0,0.4)',
                  transition: 'all 0.3s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: 10, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
                      <Zap size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 900, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        NODE 1: TRIGGER (จุดเริ่มต้นการทำงาน)
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>
                        เหตุการณ์ที่ตรวจจับ (Event Trigger)
                      </div>
                    </div>
                  </div>

                  <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', fontWeight: 800 }}>
                    {selectedWorkflowForCanvas.triggerType.toUpperCase()}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
                      ประเภททริกเกอร์
                    </label>
                    <select
                      value={selectedWorkflowForCanvas.triggerType}
                      onChange={(e) => setSelectedWorkflowForCanvas({ ...selectedWorkflowForCanvas, triggerType: e.target.value as WorkflowTriggerType })}
                      style={{ width: '100%', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#fff' }}
                    >
                      <option value="threshold">📦 ระดับสต็อกวัตถุดิบ (Inventory Safety Stock)</option>
                      <option value="schedule">⏰ ตามตารางเวลา (Schedule / Cron)</option>
                      <option value="event">🧾 ชำระเงินบิล POS / เปิดโต๊ะ (POS Event)</option>
                      <option value="manual">🖐️ สั่งรันด้วยตนเอง (Manual Trigger)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
                      คำอธิบายทริกเกอร์
                    </label>
                    <input
                      type="text"
                      value={selectedWorkflowForCanvas.triggerCondition}
                      onChange={(e) => setSelectedWorkflowForCanvas({ ...selectedWorkflowForCanvas, triggerCondition: e.target.value })}
                      placeholder="เช่น เมื่อสต็อก < Min Safety หรือ 07:00 น."
                      style={{ width: '100%', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#fff' }}
                    />
                  </div>
                </div>
              </div>

              {/* Connecting Flow Arrow */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#fbbf24' }}>
                <ArrowDown size={22} className="animate-bounce" />
              </div>

              {/* ------------------------------------------------------------- */}
              {/* NODE 2: CONDITION NODE (IF / ELSE RULES) */}
              {/* ------------------------------------------------------------- */}
              <div
                style={{
                  width: '100%',
                  maxWidth: 680,
                  background: canvasSimulationStep === 2 ? 'linear-gradient(135deg, #1e293b, #172554)' : 'var(--color-bg-card)',
                  border: canvasSimulationStep === 2 ? '2px solid #3b82f6' : '1px solid rgba(59, 130, 246, 0.4)',
                  borderRadius: 14,
                  padding: 18,
                  boxShadow: canvasSimulationStep === 2 ? '0 0 20px rgba(59, 130, 246, 0.4)' : '0 4px 14px rgba(0,0,0,0.4)',
                  transition: 'all 0.3s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: 10, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
                      <Sliders size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 900, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        NODE 2: CONDITIONS (เงื่อนไขการตรวจสอบ IF)
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>
                        กฎและเงื่อนไขเปรียบเทียบ (Rule Evaluation)
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const currentConds = selectedWorkflowForCanvas.conditions || [];
                      const newCond: WorkflowCondition = {
                        id: `cond-${Date.now()}`,
                        field: 'stock_level',
                        fieldLabelTh: 'สต็อกคงเหลือ (Stock Level)',
                        operator: 'less_or_equal',
                        value: '10 kg',
                        description: 'หากสต็อกคงเหลือน้อยกว่าหรือเท่ากับเกณฑ์',
                      };
                      setSelectedWorkflowForCanvas({
                        ...selectedWorkflowForCanvas,
                        conditions: [...currentConds, newCond],
                      });
                    }}
                    style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.4)', color: '#60a5fa', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                  >
                    + เพิ่มเงื่อนไข IF
                  </button>
                </div>

                {/* Condition Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(selectedWorkflowForCanvas.conditions || []).map((cond, cIdx) => (
                    <div
                      key={cond.id || cIdx}
                      style={{
                        background: 'rgba(0,0,0,0.35)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 10,
                        padding: 12,
                        display: 'grid',
                        gridTemplateColumns: '1.2fr 1fr 1fr 32px',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <div>
                        <span style={{ fontSize: 10, color: 'var(--color-text-muted)', display: 'block', marginBottom: 2 }}>ตัวแปรตรวจสอบ</span>
                        <select
                          value={cond.field}
                          onChange={(e) => {
                            const newConds = [...(selectedWorkflowForCanvas.conditions || [])];
                            newConds[cIdx].field = e.target.value as any;
                            setSelectedWorkflowForCanvas({ ...selectedWorkflowForCanvas, conditions: newConds });
                          }}
                          style={{ width: '100%', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 6, padding: '6px 8px', fontSize: 11, color: '#fff' }}
                        >
                          <option value="stock_level">📦 สต็อกคงเหลือ (Stock Level)</option>
                          <option value="cash_discrepancy">💵 ผลต่างเงินสดปิดกะ (Discrepancy)</option>
                          <option value="bill_amount">🧾 ยอดเงินในบิล (Bill Amount)</option>
                          <option value="time_of_day">⏰ เวลาปัจจุบัน (Time of Day)</option>
                          <option value="payment_method">⚡ ช่องทางชำระเงิน (Payment Method)</option>
                        </select>
                      </div>

                      <div>
                        <span style={{ fontSize: 10, color: 'var(--color-text-muted)', display: 'block', marginBottom: 2 }}>ตัวดำเนินการ</span>
                        <select
                          value={cond.operator}
                          onChange={(e) => {
                            const newConds = [...(selectedWorkflowForCanvas.conditions || [])];
                            newConds[cIdx].operator = e.target.value as ConditionOperator;
                            setSelectedWorkflowForCanvas({ ...selectedWorkflowForCanvas, conditions: newConds });
                          }}
                          style={{ width: '100%', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 6, padding: '6px 8px', fontSize: 11, color: '#fff' }}
                        >
                          <option value="less_or_equal">≤ น้อยกว่าหรือเท่ากับ</option>
                          <option value="greater_than">&gt; มากกว่า</option>
                          <option value="greater_or_equal">≥ มากกว่าหรือเท่ากับ</option>
                          <option value="less_than">&lt; น้อยกว่า</option>
                          <option value="equals">== เท่ากับ</option>
                          <option value="contains">มีคำว่า (Contains)</option>
                        </select>
                      </div>

                      <div>
                        <span style={{ fontSize: 10, color: 'var(--color-text-muted)', display: 'block', marginBottom: 2 }}>ค่าเปรียบเทียบ</span>
                        <input
                          type="text"
                          value={cond.value}
                          onChange={(e) => {
                            const newConds = [...(selectedWorkflowForCanvas.conditions || [])];
                            newConds[cIdx].value = e.target.value;
                            setSelectedWorkflowForCanvas({ ...selectedWorkflowForCanvas, conditions: newConds });
                          }}
                          placeholder="เช่น 15 kg หรือ ฿100"
                          style={{ width: '100%', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 6, padding: '6px 8px', fontSize: 11, color: '#fff' }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        {(selectedWorkflowForCanvas.conditions || []).length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedWorkflowForCanvas({
                                ...selectedWorkflowForCanvas,
                                conditions: (selectedWorkflowForCanvas.conditions || []).filter((_, idx) => idx !== cIdx),
                              });
                            }}
                            style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: 4 }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Connecting Flow Arrow */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#34d399' }}>
                <ArrowDown size={22} className="animate-bounce" />
              </div>

              {/* ------------------------------------------------------------- */}
              {/* NODE 3: ACTION PIPELINE NODES */}
              {/* ------------------------------------------------------------- */}
              <div
                style={{
                  width: '100%',
                  maxWidth: 680,
                  background: canvasSimulationStep === 3 ? 'linear-gradient(135deg, #1e293b, #064e3b)' : 'var(--color-bg-card)',
                  border: canvasSimulationStep === 3 ? '2px solid #10b981' : '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: 14,
                  padding: 18,
                  boxShadow: canvasSimulationStep === 3 ? '0 0 20px rgba(16, 185, 129, 0.4)' : '0 4px 14px rgba(0,0,0,0.4)',
                  transition: 'all 0.3s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: 10, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
                      <Layers size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 900, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        NODE 3: ACTIONS PIPELINE (คำสั่งอัตโนมัติ)
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>
                        ลำดับขั้นตอนการปฏิบัติงาน ({selectedWorkflowForCanvas.actions.length} ขั้นตอน)
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const newAct: WorkflowActionStep = {
                        id: `act-${Date.now()}`,
                        type: 'line_notify',
                        title: 'แจ้งเตือนผ่าน LINE',
                        description: 'ส่งข้อความสรุปเข้ากลุ่ม',
                        targetChannel: 'LINE Channel',
                      };
                      setSelectedWorkflowForCanvas({
                        ...selectedWorkflowForCanvas,
                        actions: [...selectedWorkflowForCanvas.actions, newAct],
                      });
                    }}
                    style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                  >
                    + แทรก Action Node
                  </button>
                </div>

                {/* Actions Chain */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedWorkflowForCanvas.actions.map((act, aIdx) => (
                    <div
                      key={act.id || aIdx}
                      style={{
                        background: 'rgba(0,0,0,0.35)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 10,
                        padding: 12,
                        display: 'grid',
                        gridTemplateColumns: '28px 1.2fr 1fr 1fr 32px',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: 'rgba(16, 185, 129, 0.2)',
                          color: '#34d399',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        {aIdx + 1}
                      </span>

                      <div>
                        <span style={{ fontSize: 10, color: 'var(--color-text-muted)', display: 'block', marginBottom: 2 }}>ประเภท Action</span>
                        <select
                          value={act.type}
                          onChange={(e) => {
                            const newActs = [...selectedWorkflowForCanvas.actions];
                            newActs[aIdx].type = e.target.value as any;
                            setSelectedWorkflowForCanvas({ ...selectedWorkflowForCanvas, actions: newActs });
                          }}
                          style={{ width: '100%', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 6, padding: '6px 8px', fontSize: 11, color: '#fff' }}
                        >
                          <option value="line_notify">💬 ส่งแจ้งเตือน LINE Bot</option>
                          <option value="create_po">📝 สร้างใบสั่งซื้อ PO ซัพพลายเออร์</option>
                          <option value="ocr_verify">🔍 รอรับสลิป & ตรวจสอบ AI OCR</option>
                          <option value="kds_alert">🍳 ส่งภารกิจเข้าจอครัว KDS</option>
                          <option value="sync_accounting">📊 ซิงค์โปรแกรมบัญชี FlowAccount / PEAK</option>
                          <option value="print_ticket">🖨️ สั่งพิมพ์ใบสรุปกะ / Survey QR</option>
                          <option value="webhook_call">🌐 ยิง REST Webhook ภายนอก</option>
                        </select>
                      </div>

                      <div>
                        <span style={{ fontSize: 10, color: 'var(--color-text-muted)', display: 'block', marginBottom: 2 }}>หัวข้อการกระทำ</span>
                        <input
                          type="text"
                          value={act.title}
                          onChange={(e) => {
                            const newActs = [...selectedWorkflowForCanvas.actions];
                            newActs[aIdx].title = e.target.value;
                            setSelectedWorkflowForCanvas({ ...selectedWorkflowForCanvas, actions: newActs });
                          }}
                          placeholder="ชื่อ Action"
                          style={{ width: '100%', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 6, padding: '6px 8px', fontSize: 11, color: '#fff' }}
                        />
                      </div>

                      <div>
                        <span style={{ fontSize: 10, color: 'var(--color-text-muted)', display: 'block', marginBottom: 2 }}>ช่องทางเป้าหมาย</span>
                        <input
                          type="text"
                          value={act.targetChannel || ''}
                          onChange={(e) => {
                            const newActs = [...selectedWorkflowForCanvas.actions];
                            newActs[aIdx].targetChannel = e.target.value;
                            setSelectedWorkflowForCanvas({ ...selectedWorkflowForCanvas, actions: newActs });
                          }}
                          placeholder="เช่น LINE Group / KDS"
                          style={{ width: '100%', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 6, padding: '6px 8px', fontSize: 11, color: '#fff' }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        {selectedWorkflowForCanvas.actions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedWorkflowForCanvas({
                                ...selectedWorkflowForCanvas,
                                actions: selectedWorkflowForCanvas.actions.filter((_, idx) => idx !== aIdx),
                              });
                            }}
                            style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: 4 }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Connecting Flow Arrow */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#c084fc' }}>
                <ArrowDown size={22} className="animate-bounce" />
              </div>

              {/* ------------------------------------------------------------- */}
              {/* NODE 4: RBAC GATEWAY & LINKED SOP */}
              {/* ------------------------------------------------------------- */}
              <div
                style={{
                  width: '100%',
                  maxWidth: 680,
                  background: canvasSimulationStep === 4 ? 'linear-gradient(135deg, #1e293b, #3b0764)' : 'var(--color-bg-card)',
                  border: canvasSimulationStep === 4 ? '2px solid #c084fc' : '1px solid rgba(168, 85, 247, 0.4)',
                  borderRadius: 14,
                  padding: 18,
                  boxShadow: canvasSimulationStep === 4 ? '0 0 20px rgba(168, 85, 247, 0.4)' : '0 4px 14px rgba(0,0,0,0.4)',
                  transition: 'all 0.3s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--color-border)', paddingBottom: 10, marginBottom: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(168, 85, 247, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
                    <Shield size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 900, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      NODE 4: RBAC SECURITY & KM SOP LINK
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>
                      การควบคุมสิทธิ์ & เอกสารระเบียบปฏิบัติ
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
                      บทบาทผู้อนุมัติ (Approver)
                    </label>
                    <select
                      value={selectedWorkflowForCanvas.approverRole || 'manager'}
                      onChange={(e) => setSelectedWorkflowForCanvas({ ...selectedWorkflowForCanvas, approverRole: e.target.value as StaffRole })}
                      style={{ width: '100%', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#fff' }}
                    >
                      <option value="owner">👑 Owner (เจ้าของร้าน)</option>
                      <option value="manager">👔 Manager (ผู้จัดการ)</option>
                      <option value="kitchen">🍳 Kitchen (หัวหน้าครัว)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
                      แนบคู่มือ SOP / KM ประจำเวิร์กโฟลว์
                    </label>
                    <select
                      value={selectedWorkflowForCanvas.linkedSopId || ''}
                      onChange={(e) => setSelectedWorkflowForCanvas({ ...selectedWorkflowForCanvas, linkedSopId: e.target.value })}
                      style={{ width: '100%', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#fff' }}
                    >
                      <option value="">-- ไม่เชื่อมโยง SOP --</option>
                      {knowledgeDocs.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.titleTh} ({doc.version})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1 SUB-VIEW: FULL INTERACTIVE PROCUREMENT WORKBENCH */}
      {/* ========================================================================= */}
      {topTab === 'workflows' && showProcurementWorkbench && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 14,
              padding: '14px 18px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => setShowProcurementWorkbench(false)}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: 12, fontWeight: 700, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <ArrowLeft size={13} />
                <span>กลับหน้าเวิร์กโฟลว์หลัก</span>
              </button>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bot size={18} color="#10b981" />
                <span>ระบบจัดซื้อ & LINE Agent (Procurement Suite)</span>
              </h3>
            </div>

            {/* Sub-tabs for Procurement Workbench */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { id: 'pos_agent', label: '💬 แชทบอท & ใบสั่งซื้อ', icon: <Bot size={13} /> },
                { id: 'suppliers', label: '🏢 ซัพพลายเออร์', icon: <Building2 size={13} /> },
                { id: 'inventory', label: '📦 สต็อก & เกณฑ์เตือน', icon: <Package size={13} /> },
                { id: 'settings', label: '⚙️ ตั้งค่าบอท', icon: <Settings size={13} /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setProcurementSubTab(tab.id as any)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: 'none',
                    background: procurementSubTab === tab.id ? '#10b981' : 'rgba(255,255,255,0.05)',
                    color: procurementSubTab === tab.id ? '#000' : 'var(--color-text-secondary)',
                    fontWeight: 800,
                    fontSize: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* PROCUREMENT SUBTAB: PO & LINE AGENT */}
          {procurementSubTab === 'pos_agent' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 18 }}>
              {/* Left Column: PO List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FileText size={16} color="#fbbf24" />
                    <span>รายการใบสั่งซื้อสินค้า (Purchase Orders)</span>
                  </h4>
                  <button
                    onClick={() => setShowNewPOModal(true)}
                    className="btn-primary"
                    style={{ padding: '6px 14px', fontSize: 12, fontWeight: 800, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Plus size={13} />
                    <span>+ สร้าง PO ใหม่</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {purchaseOrders.map((po) => (
                    <div
                      key={po.id}
                      style={{
                        background: 'var(--color-bg-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 12,
                        padding: 14,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 900, color: '#fbbf24', fontSize: 13 }}>{po.poNumber}</span>
                            {getStatusBadge(po.status)}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginTop: 4 }}>
                            🏢 {po.supplierName}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                            สร้างเมื่อ {new Date(po.createdAt).toLocaleString('th-TH')} โดย {po.createdBy}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>ยอดรวมทั้งสิ้น</div>
                          <div style={{ fontSize: 16, fontWeight: 900, color: '#34d399' }}>฿{po.grandTotal.toLocaleString()}</div>
                        </div>
                      </div>

                      {/* Items */}
                      <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {po.items.map((it, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-secondary)' }}>
                            <span>• {it.nameTh} ({it.qtyOrdered} {it.unit})</span>
                            <span style={{ fontWeight: 700, color: '#fff' }}>฿{it.total.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      {/* PO Action Buttons */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, borderTop: '1px solid var(--color-border)', paddingTop: 8 }}>
                        {po.status === 'draft' && (
                          <button
                            onClick={() => sendPOToLineGroup(po.id)}
                            className="btn-primary"
                            style={{ padding: '6px 12px', fontSize: 11, fontWeight: 800, borderRadius: 6, background: '#3b82f6', display: 'flex', alignItems: 'center', gap: 4 }}
                          >
                            <Send size={11} />
                            <span>ส่ง LINE กลุ่มซัพพลายเออร์</span>
                          </button>
                        )}

                        {po.status === 'sent_line' && (
                          <button
                            onClick={() => simulateSupplierLineReply(po.id)}
                            className="btn-primary"
                            style={{ padding: '6px 12px', fontSize: 11, fontWeight: 800, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}
                          >
                            <MessageSquare size={11} />
                            <span>จำลองร้านตอบบิล & QR</span>
                          </button>
                        )}

                        {(po.status === 'ocr_received' || po.status === 'reconciled') && (
                          <button
                            onClick={() => setSelectedPOForPay(po)}
                            className="btn-primary"
                            style={{ padding: '6px 14px', fontSize: 12, fontWeight: 900, borderRadius: 8, background: '#10b981', color: '#000', display: 'flex', alignItems: 'center', gap: 5 }}
                          >
                            <QrCode size={13} />
                            <span>สแกนจ่าย PromptPay (฿{po.grandTotal.toLocaleString()})</span>
                          </button>
                        )}

                        {po.status === 'completed' && (
                          <span style={{ fontSize: 11, color: '#34d399', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircle2 size={13} />
                            <span>ชำระเงินเรียบร้อย & เข้าสต็อกแล้ว</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Live LINE Chat Logs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MessageSquare size={16} color="#10b981" />
                    <span>LINE Chat Simulator (ข้อความสด)</span>
                  </h4>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontWeight: 800 }}>
                    Connected
                  </span>
                </div>

                <div
                  style={{
                    background: '#090d16',
                    border: '1px solid var(--color-border)',
                    borderRadius: 14,
                    padding: 14,
                    height: 520,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  {lineLogs.map((log) => (
                    <div
                      key={log.id}
                      style={{
                        maxWidth: '85%',
                        alignSelf: log.direction === 'outbound' ? 'flex-end' : 'flex-start',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: log.direction === 'outbound' ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginBottom: 2, padding: '0 4px' }}>
                        {log.sender} • {new Date(log.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div
                        style={{
                          padding: 10,
                          borderRadius: 12,
                          fontSize: 11,
                          lineHeight: 1.5,
                          whiteSpace: 'pre-line',
                          background: log.direction === 'outbound' ? '#059669' : '#1e293b',
                          color: '#fff',
                          border: log.direction === 'outbound' ? 'none' : '1px solid var(--color-border)',
                        }}
                      >
                        {log.messageText}
                        {log.imageUrl && (
                          <div style={{ marginTop: 8, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                            <img src={log.imageUrl} alt="Bill attachment" style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                          </div>
                        )}
                        {log.ocrStatus && (
                          <div style={{ marginTop: 6, paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.15)', fontSize: 9, fontWeight: 800, color: '#a7f3d0', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <ShieldCheck size={11} />
                            <span>OCR: {log.ocrStatus.toUpperCase()} (PromptPay Verified)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PROCUREMENT SUBTAB: SUPPLIERS */}
          {procurementSubTab === 'suppliers' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: 0 }}>รายชื่อซัพพลายเออร์ที่ลงทะเบียน</h4>
                  <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>กำหนดช่องทางสั่งของ อนุมัติวงเงินอัตโนมัติ และเลข PromptPay บัญชีคู่ค้า</p>
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
                  style={{ padding: '8px 16px', fontSize: 12, fontWeight: 800, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <Plus size={14} />
                  <span>+ เพิ่มซัพพลายเออร์</span>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
                {suppliers.map((sup) => (
                  <div key={sup.id} style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
                          {sup.category}
                        </span>
                        <h5 style={{ fontWeight: 800, fontSize: 14, color: '#fff', margin: '6px 0 0' }}>{sup.name}</h5>
                        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>ติดต่อ: {sup.contactPerson} ({sup.phone})</div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          onClick={() => {
                            setEditingSupplier(sup);
                            setSupForm(sup);
                            setShowSupplierModal(true);
                          }}
                          style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: 4 }}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => deleteSupplier(sup.id)}
                          style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: 4 }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 8, fontSize: 11, display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--color-text-secondary)' }}>
                      <div>📱 LINE กลุ่ม: <strong style={{ color: '#34d399' }}>{sup.lineGroup || sup.lineId || 'ยังไม่ระบุ'}</strong></div>
                      <div>⚡ PromptPay: <strong style={{ color: '#fbbf24' }}>{sup.promptPayId} ({sup.accountName})</strong></div>
                      <div>🏦 ธนาคาร: {sup.bankName}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PROCUREMENT SUBTAB: INVENTORY */}
          {procurementSubTab === 'inventory' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: 0 }}>ระดับสต็อกวัตถุดิบ & เกณฑ์ความปลอดภัย (Safety Stock)</h4>
                  <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>เมื่อคงเหลือต่ำกว่าเกณฑ์ ระบบจะทริกเกอร์สร้าง PO สั่งซื้ออัตโนมัติทันที</p>
                </div>
                <button
                  onClick={() => {
                    setEditingInventory(null);
                    setInvForm({
                      nameTh: '',
                      nameEn: '',
                      unit: 'kg',
                      currentStock: 10,
                      minSafetyThreshold: 15,
                      avgCost: 200,
                      supplierId: suppliers[0]?.id || '',
                      category: 'วัตถุดิบครัว',
                    });
                    setShowInventoryModal(true);
                  }}
                  className="btn-primary"
                  style={{ padding: '8px 16px', fontSize: 12, fontWeight: 800, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <Plus size={14} />
                  <span>+ เพิ่มวัตถุดิบ</span>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
                {inventory.map((inv) => {
                  const isLow = inv.currentStock <= inv.minSafetyThreshold;
                  const supplier = suppliers.find((s) => s.id === inv.supplierId);
                  return (
                    <div
                      key={inv.id}
                      style={{
                        background: isLow ? 'rgba(239, 68, 68, 0.08)' : 'var(--color-bg-card)',
                        border: isLow ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--color-border)',
                        borderRadius: 12,
                        padding: 16,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h5 style={{ fontWeight: 800, fontSize: 14, color: '#fff', margin: 0 }}>{inv.nameTh}</h5>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{inv.nameEn}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {isLow ? (
                            <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
                              ⚠️ สต็อกวิกฤต
                            </span>
                          ) : (
                            <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
                              ปกติ
                            </span>
                          )}
                          <button
                            onClick={() => {
                              setEditingInventory(inv);
                              setInvForm(inv);
                              setShowInventoryModal(true);
                            }}
                            style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: 2 }}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => deleteInventoryItem(inv.id)}
                            style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: 2 }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>คงเหลือปัจจุบัน</div>
                          <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{inv.currentStock} {inv.unit}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>เกณฑ์เตือน (Min Safety)</div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#fbbf24' }}>{inv.minSafetyThreshold} {inv.unit}</div>
                        </div>
                      </div>

                      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>คู่ค้า: {supplier?.name || 'ไม่ระบุ'}</span>
                        <span>ต้นทุนเฉลี่ย: ฿{inv.avgCost}/{inv.unit}</span>
                      </div>

                      {isLow && (
                        <button
                          onClick={() => triggerAutoPOForLowStock(inv.id)}
                          className="btn-primary"
                          style={{ padding: '8px', fontSize: 11, fontWeight: 800, borderRadius: 8, background: '#ef4444', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                        >
                          <Zap size={13} />
                          <span>สร้าง PO สั่งของด่วนผ่าน LINE ทันที</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PROCUREMENT SUBTAB: SETTINGS */}
          {procurementSubTab === 'settings' && (
            <div style={{ maxWidth: 640, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Settings size={18} color="#fbbf24" />
                <span>การตั้งค่า LINE Agent & Autonomous Engine</span>
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 10, border: '1px solid var(--color-border)' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 13, color: '#fff' }}>เปิดใช้งาน LINE Procurement Agent</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>ส่งและรับข้อความในกลุ่ม LINE ซัพพลายเออร์อัตโนมัติ</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={lineAgentConfig.botEnabled}
                    onChange={(e) => updateLineAgentConfig({ botEnabled: e.target.checked })}
                    style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 10, border: '1px solid var(--color-border)' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 13, color: '#fff' }}>สั่ง PO อัตโนมัติเมื่อสต็อกต่ำ (Auto-PO on Low Stock)</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>สร้างใบสั่งซื้อและยิงเข้า LINE ซัพพลายเออร์ทันทีที่ต่ำกว่าเกณฑ์</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={lineAgentConfig.autoSendLineOnLowStock}
                    onChange={(e) => updateLineAgentConfig({ autoSendLineOnLowStock: e.target.checked })}
                    style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 10, border: '1px solid var(--color-border)' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 13, color: '#fff' }}>ตรวจสอบบัญชีธนาคาร Whitelist (Anti-Fraud)</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>ป้องกันการโอนเงินผิดบัญชีโดยตรวจจับเลข PromptPay ใน QR</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={lineAgentConfig.verifySupplierBankWhitelist}
                    onChange={(e) => updateLineAgentConfig({ verifySupplierBankWhitelist: e.target.checked })}
                    style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: RBAC SCHEDULING (ตารางเวลา & การกำหนดสิทธิ์) */}
      {/* ========================================================================= */}
      {topTab === 'scheduling' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Daily Schedule Timeline Card */}
          <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Calendar size={18} color="#60a5fa" />
                  <span>ไทม์ไลน์รอบการทำงานอัตโนมัติตลอดวัน (24h Automation Timeline)</span>
                </h3>
                <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                  ระบบจะตรวจสอบและประมวลผลงานตามเวลาที่กำหนดโดยอัตโนมัติ
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingSchedule(null);
                  setSchForm({
                    workflowId: workflows[0]?.id || '',
                    title: '',
                    timeOfDay: '08:00',
                    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
                    cronExpression: '0 8 * * *',
                    enabled: true,
                    targetAction: '',
                    allowedRoles: ['owner', 'manager'],
                    requireApproval: false,
                    approverRole: 'manager',
                    status: 'active',
                  });
                  setShowScheduleModal(true);
                }}
                className="btn-primary"
                style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', fontSize: 12, fontWeight: 800, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Plus size={14} />
                <span>+ เพิ่มตารางเวลาใหม่ (Add Schedule)</span>
              </button>
            </div>

            {/* Timeline Visual Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: 14, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#60a5fa' }}>🌅 รอบเช้า (07:00 น.)</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>ต้มน้ำซุป & หมักเนื้อ</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>ส่ง KDS Alert & เช็ค SOP-KIT-01</div>
              </div>

              <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: 14, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#fbbf24' }}>☀️ รอบบ่าย (14:00 น.)</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>สแกนสต็อก & เตือนสั่งของ</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>เช็ค Safety Stock & ร่าง PO</div>
              </div>

              <div style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', padding: 14, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#c084fc' }}>🌙 รอบค่ำ (22:30 น.)</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>สรุปยอดเงินสดปิดกะ</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>พิมพ์ Z-Report & เตือนผลต่างเงิน</div>
              </div>

              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: 14, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#34d399' }}>🌌 เที่ยงคืน (23:45 น.)</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Sync บัญชี & ภาษี</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>ยิง FlowAccount Webhook</div>
              </div>
            </div>
          </div>

          {/* RBAC Capability Matrix */}
          <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <h4 style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Shield size={16} color="#fbbf24" />
                <span>ตารางสิทธิ์การทำงานตามบทบาท (RBAC Permission Matrix)</span>
              </h4>
              <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>ควบคุมสิทธิ์ว่าพนักงานตำแหน่งใดสามารถ สั่งรัน อนุมัติ หรือแก้ไขเวิร์กโฟลว์ได้</p>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.05)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                    <th style={{ padding: '10px 14px' }}>บทบาทพนักงาน (Role)</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center' }}>สั่งรันทันที (Trigger)</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center' }}>อนุมัติ PO / ปิดกะ</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center' }}>แก้ไขเวิร์กโฟลว์</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center' }}>อ่าน / เช็คลิสต์ SOP</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center' }}>API Keys & บัญชี</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 800, color: '#fbbf24' }}>👑 เจ้าของร้าน (Owner)</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: '#34d399', fontWeight: 800 }}>✓ ทุกงาน</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: '#34d399', fontWeight: 800 }}>✓ สูงสุด</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: '#34d399', fontWeight: 800 }}>✓ ทั้งหมด</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: '#34d399', fontWeight: 800 }}>✓ อ่าน/แก้ไข</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: '#34d399', fontWeight: 800 }}>✓ เข้าถึงได้</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 800, color: '#c084fc' }}>🛡️ ผู้ดูแลระบบ (Admin)</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: '#34d399', fontWeight: 800 }}>✓ ทุกงาน</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--color-text-muted)' }}>-</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: '#34d399', fontWeight: 800 }}>✓ ทั้งหมด</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: '#34d399', fontWeight: 800 }}>✓ อ่าน/แก้ไข</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: '#34d399', fontWeight: 800 }}>✓ จัดการได้</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 800, color: '#60a5fa' }}>👔 ผู้จัดการร้าน (Manager)</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: '#34d399', fontWeight: 800 }}>✓ งานร้าน & ครัว</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: '#34d399', fontWeight: 800 }}>✓ อนุมัติเบื้องต้น</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--color-text-muted)' }}>-</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: '#34d399', fontWeight: 800 }}>✓ อ่าน/ตรวจสอบ</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--color-text-muted)' }}>-</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 800, color: '#34d399' }}>💵 แคชเชียร์ (Cashier)</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: '#fbbf24' }}>✓ ปิดกะเงินสด</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--color-text-muted)' }}>-</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--color-text-muted)' }}>-</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: '#34d399', fontWeight: 800 }}>✓ อ่าน SOP ปิดกะ</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--color-text-muted)' }}>-</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px 14px', fontWeight: 800, color: '#fb7185' }}>🍳 ทีมครัว (Kitchen)</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: '#fbbf24' }}>✓ สั่งของ & ต้มซุป</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--color-text-muted)' }}>-</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--color-text-muted)' }}>-</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: '#34d399', fontWeight: 800 }}>✓ อ่านสูตร & ตรวจรับ</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--color-text-muted)' }}>-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Schedule List Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h4 style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: 0 }}>ตารางการทำงานที่บันทึกไว้ ({workflowSchedules.length})</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 14 }}>
              {workflowSchedules.map((sch) => (
                <div key={sch.id} style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 900, color: '#fbbf24', fontSize: 16 }}>{sch.timeOfDay} น.</span>
                        <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>({sch.cronExpression})</span>
                      </div>
                      <h5 style={{ fontWeight: 800, fontSize: 13, color: '#fff', margin: '4px 0 0' }}>{sch.title}</h5>
                    </div>

                    <button
                      onClick={() => toggleSchedule(sch.id)}
                      style={{
                        width: 38,
                        height: 20,
                        borderRadius: 20,
                        background: sch.enabled ? '#3b82f6' : 'rgba(255, 255, 255, 0.15)',
                        border: 'none',
                        cursor: 'pointer',
                        position: 'relative',
                        padding: 2,
                      }}
                    >
                      <span
                        style={{
                          display: 'block',
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          background: '#fff',
                          transform: sch.enabled ? 'translateX(18px)' : 'translateX(0px)',
                          transition: 'transform 0.2s',
                        }}
                      />
                    </button>
                  </div>

                  <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', background: 'rgba(0,0,0,0.3)', padding: 8, borderRadius: 8, margin: 0 }}>
                    ⚡ {sch.targetAction}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>สิทธิ์:</span>
                      {sch.allowedRoles.map((r) => getRoleBadge(r))}
                    </div>

                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={() => {
                          setEditingSchedule(sch);
                          setSchForm(sch);
                          setShowScheduleModal(true);
                        }}
                        style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: 4 }}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => deleteSchedule(sch.id)}
                        style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: 4 }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: KM & SOP KNOWLEDGE MANAGEMENT */}
      {/* ========================================================================= */}
      {topTab === 'km' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Header & Search */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 14,
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 14,
              padding: 16,
            }}
          >
            <div style={{ flex: 1, minWidth: 280, position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                value={kmSearchQuery}
                onChange={(e) => setKmSearchQuery(e.target.value)}
                placeholder="ค้นหา SOP, คู่มือ, สูตรอาหาร, หรือ Checklist..."
                style={{
                  width: '100%',
                  background: 'var(--color-bg-main)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 10,
                  padding: '9px 12px 9px 36px',
                  fontSize: 13,
                  color: '#fff',
                  outline: 'none',
                }}
              />
            </div>

            <button
              onClick={() => {
                setEditingDoc(null);
                setDocForm({
                  titleTh: '',
                  titleEn: '',
                  category: 'kitchen_sop',
                  summary: '',
                  contentMarkdown: '',
                  tags: ['สูตรอาหาร', 'ครัว'],
                  authorRole: 'kitchen',
                  version: 'v1.0',
                  linkedWorkflowIds: [],
                  checklists: [{ id: `c-${Date.now()}`, text: 'ตรวจสอบมาตรฐานวัตถุดิบ', required: true }],
                });
                setShowDocModal(true);
              }}
              className="btn-primary"
              style={{ padding: '9px 18px', background: '#10b981', color: '#000', fontSize: 13, fontWeight: 800, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Plus size={15} />
              <span>+ เพิ่มคู่มือ SOP / KM (New SOP)</span>
            </button>
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            {[
              { id: 'all', label: 'ทั้งหมด' },
              { id: 'procurement', label: '📦 ตรวจรับ & จัดซื้อ' },
              { id: 'kitchen_sop', label: '🍳 สูตรอาหาร & งานครัว' },
              { id: 'cash_handling', label: '💵 การเงิน & ปิดกะ' },
              { id: 'operations', label: '🧹 สุขอนามัย & ความสะอาด' },
              { id: 'finance', label: '📊 ภาษี & ระบบบัญชี' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setKmCategoryFilter(f.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: kmCategoryFilter === f.id ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  color: kmCategoryFilter === f.id ? '#34d399' : 'var(--color-text-secondary)',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                  outline: kmCategoryFilter === f.id ? '1px solid rgba(16, 185, 129, 0.4)' : 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Knowledge Docs Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
            {filteredKnowledgeDocs.map((doc) => {
              const linkedWorkflowCount = doc.linkedWorkflowIds?.length || 0;
              return (
                <div
                  key={doc.id}
                  style={{
                    background: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 14,
                    padding: 18,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 12,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
                        {doc.version}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={11} />
                        {new Date(doc.updatedAt).toLocaleDateString('th-TH')}
                      </span>
                    </div>

                    <div>
                      <h4 style={{ fontWeight: 800, fontSize: 14, color: '#fff', margin: 0, lineHeight: 1.4 }}>
                        {doc.titleTh}
                      </h4>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{doc.titleEn}</div>
                    </div>

                    <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
                      {doc.summary}
                    </p>

                    {/* Tag list */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, paddingTop: 4 }}>
                      {doc.tags.map((t) => (
                        <span key={t} style={{ fontSize: 10, background: 'rgba(0,0,0,0.35)', color: 'var(--color-text-muted)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--color-border)' }}>
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      {doc.checklists?.length || 0} เช็คลิสต์ • {linkedWorkflowCount} เวิร์กโฟลว์
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        onClick={() => setSelectedDocForView(doc)}
                        className="btn-primary"
                        style={{
                          padding: '6px 14px',
                          background: '#10b981',
                          color: '#000',
                          fontSize: 11,
                          fontWeight: 800,
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Eye size={12} />
                        <span>เปิดอ่าน SOP</span>
                      </button>

                      <button
                        onClick={() => {
                          setEditingDoc(doc);
                          setDocForm(doc);
                          setShowDocModal(true);
                        }}
                        style={{ padding: 6, background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
                      >
                        <Edit2 size={13} />
                      </button>

                      <button
                        onClick={() => deleteKnowledgeDoc(doc.id)}
                        style={{ padding: 6, background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: SOP / KM VIEWER & CHECKLIST MODAL */}
      {/* ========================================================================= */}
      {selectedDocForView && (
        <div className="modal-overlay">
          <div className="modal-content-card" style={{ maxWidth: 700, width: '100%', padding: 0 }}>
            {/* Modal Header */}
            <div style={{ padding: '16px 20px', background: 'var(--color-bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: '#10b981', color: '#000' }}>
                    {selectedDocForView.version}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                    อัปเดตล่าสุด: {new Date(selectedDocForView.updatedAt).toLocaleDateString('th-TH')}
                  </span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: '4px 0 0', color: '#fff' }}>{selectedDocForView.titleTh}</h3>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{selectedDocForView.titleEn}</div>
              </div>

              <button onClick={() => setSelectedDocForView(null)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: 20, maxHeight: '65vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Summary Callout */}
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#34d399', textTransform: 'uppercase' }}>สรุปข้อกำหนด (Summary):</div>
                <div style={{ fontSize: 13, color: '#ecfdf5', marginTop: 2 }}>{selectedDocForView.summary}</div>
              </div>

              {/* Markdown Guide Body */}
              <div
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 10,
                  padding: 16,
                  fontSize: 12,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-line',
                  color: '#e2e8f0',
                  fontFamily: 'inherit',
                }}
              >
                {selectedDocForView.contentMarkdown}
              </div>

              {/* Interactive QC Checklist */}
              {selectedDocForView.checklists && selectedDocForView.checklists.length > 0 && (
                <div style={{ background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h5 style={{ fontSize: 13, fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckSquare size={15} color="#34d399" />
                      <span>รายการตรวจรับตามมาตรฐาน (Live QC Checklist)</span>
                    </h5>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#34d399' }}>
                      {Object.values(checkedSopItems).filter(Boolean).length} / {selectedDocForView.checklists.length} ข้อ
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {selectedDocForView.checklists.map((ch) => {
                      const isChecked = checkedSopItems[ch.id] || false;
                      return (
                        <label
                          key={ch.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '8px 12px',
                            borderRadius: 8,
                            background: isChecked ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)',
                            border: isChecked ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--color-border)',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              setCheckedSopItems({
                                ...checkedSopItems,
                                [ch.id]: e.target.checked,
                              });
                            }}
                            style={{ width: 16, height: 16, accentColor: '#10b981' }}
                          />
                          <span style={{ fontSize: 12, color: isChecked ? '#34d399' : '#fff', textDecoration: isChecked ? 'line-through' : 'none' }}>
                            {ch.text}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '12px 20px', background: 'var(--color-bg-elevated)', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                ผู้รับผิดชอบหลัก: <strong style={{ color: '#fff' }}>{selectedDocForView.authorRole}</strong>
              </div>
              <button
                onClick={() => setSelectedDocForView(null)}
                className="btn-primary"
                style={{ padding: '8px 20px', background: '#10b981', color: '#000', fontSize: 12, fontWeight: 800, borderRadius: 8 }}
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADD / EDIT SOP DOCUMENT */}
      {/* ========================================================================= */}
      {showDocModal && (
        <div className="modal-overlay">
          <div className="modal-content-card" style={{ maxWidth: 620, width: '100%', padding: 0 }}>
            <div style={{ padding: '16px 20px', background: 'var(--color-bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BookOpen size={18} color="#34d399" />
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>
                  {editingDoc ? 'แก้ไขคู่มือ SOP / KM' : 'เพิ่มคู่มือ SOP / มาตรฐานการทำงาน'}
                </h3>
              </div>
              <button onClick={() => setShowDocModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!docForm.titleTh.trim()) return;

                if (editingDoc) {
                  updateKnowledgeDoc({
                    ...editingDoc,
                    ...docForm,
                  });
                } else {
                  addKnowledgeDoc(docForm);
                }
                setShowDocModal(false);
              }}
              style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>รหัส & ชื่อเอกสาร (ภาษาไทย) *</label>
                <input
                  type="text"
                  required
                  value={docForm.titleTh}
                  onChange={(e) => setDocForm({ ...docForm, titleTh: e.target.value })}
                  placeholder="เช่น SOP-KIT-02: ขั้นตอนการเตรียมเครื่องเคียง"
                  style={{ width: '100%', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>หมวดหมู่ (Category)</label>
                  <select
                    value={docForm.category}
                    onChange={(e) => setDocForm({ ...docForm, category: e.target.value as KnowledgeCategory })}
                    style={{ width: '100%', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#fff' }}
                  >
                    <option value="procurement">📦 ตรวจรับ & จัดซื้อ</option>
                    <option value="kitchen_sop">🍳 สูตรอาหาร & ครัว</option>
                    <option value="cash_handling">💵 การเงิน & ปิดกะ</option>
                    <option value="operations">🧹 สุขอนามัย & ความสะอาด</option>
                    <option value="finance">📊 ภาษี & บัญชี</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>เวอร์ชัน (Version)</label>
                  <input
                    type="text"
                    value={docForm.version}
                    onChange={(e) => setDocForm({ ...docForm, version: e.target.value })}
                    style={{ width: '100%', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#fff' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>สรุปสาระสำคัญ (Summary)</label>
                <input
                  type="text"
                  value={docForm.summary}
                  onChange={(e) => setDocForm({ ...docForm, summary: e.target.value })}
                  placeholder="สรุปสั้นๆ ให้พนักงานเข้าใจภาพรวม"
                  style={{ width: '100%', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>เนื้อหาคู่มือปฏิบัติงาน (Markdown Content)</label>
                <textarea
                  rows={4}
                  value={docForm.contentMarkdown}
                  onChange={(e) => setDocForm({ ...docForm, contentMarkdown: e.target.value })}
                  placeholder="### ลำดับขั้นตอน&#10;1. ตรวจสอบอุณหภูมิ&#10;2. ชั่งน้ำหนัก..."
                  style={{ width: '100%', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#fff', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8, borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowDocModal(false)}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: 13, fontWeight: 700 }}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '8px 20px', background: '#10b981', color: '#000', fontSize: 13, fontWeight: 800 }}
                >
                  บันทึก SOP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: PROMPTPAY PAYMENT FOR PO MODAL */}
      {/* ========================================================================= */}
      {selectedPOForPay && (
        <div className="modal-overlay">
          <div className="modal-content-card" style={{ maxWidth: 420, width: '100%', padding: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
              }}
            >
              <QrCode size={26} />
            </div>

            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#fff' }}>ชำระเงิน PO ผ่าน PromptPay QR</h3>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                {selectedPOForPay.poNumber} • {selectedPOForPay.supplierName}
              </div>
            </div>

            <div style={{ background: '#fff', padding: 16, borderRadius: 16, display: 'inline-block', margin: '0 auto' }}>
              <div style={{ width: 160, height: 160, background: '#090d16', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', borderRadius: 12, padding: 8 }}>
                <QrCode size={90} color="#34d399" />
                <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 4, fontFamily: 'monospace' }}>PROMPTPAY TH</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>฿{selectedPOForPay.grandTotal.toLocaleString()}</div>
              </div>
            </div>

            <div style={{ background: 'var(--color-bg-main)', padding: 12, borderRadius: 10, border: '1px solid var(--color-border)', fontSize: 12, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>ผู้รับเงิน:</span>
                <strong style={{ color: '#fff' }}>{selectedPOForPay.supplierName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>ยอดที่ต้องชำระ:</span>
                <strong style={{ color: '#34d399', fontSize: 14 }}>฿{selectedPOForPay.grandTotal.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>สถานะ OCR:</span>
                <strong style={{ color: '#34d399' }}>✓ Whitelist Verified</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setSelectedPOForPay(null)}
                className="btn-secondary"
                style={{ flex: 1, padding: '10px', fontSize: 13, fontWeight: 700 }}
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  approveAndPayPO(selectedPOForPay.id);
                  setSelectedPOForPay(null);
                }}
                className="btn-primary"
                style={{ flex: 1, padding: '10px', background: '#10b981', color: '#000', fontSize: 13, fontWeight: 800 }}
              >
                ยืนยันการโอนเงิน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: NEW PO CREATION MODAL */}
      {/* ========================================================================= */}
      {showNewPOModal && (
        <div className="modal-overlay">
          <div className="modal-content-card" style={{ maxWidth: 480, width: '100%', padding: 0 }}>
            <div style={{ padding: '16px 20px', background: 'var(--color-bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={18} color="#fbbf24" />
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>สร้างใบสั่งซื้อใหม่ (Create PO)</h3>
              </div>
              <button onClick={() => setShowNewPOModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>เลือกซัพพลายเออร์ *</label>
                <select
                  value={newPoSupplierId}
                  onChange={(e) => setNewPoSupplierId(e.target.value)}
                  style={{ width: '100%', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#fff' }}
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>เลือกวัตถุดิบ *</label>
                <select
                  value={newPoItemId}
                  onChange={(e) => {
                    setNewPoItemId(e.target.value);
                    const item = inventory.find((i) => i.id === e.target.value);
                    if (item) setNewPoUnitPrice(item.avgCost);
                  }}
                  style={{ width: '100%', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#fff' }}
                >
                  {inventory.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.nameTh} ({inv.currentStock} {inv.unit} คงเหลือ)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>จำนวนที่สั่ง</label>
                  <input
                    type="number"
                    min={1}
                    value={newPoQty}
                    onChange={(e) => setNewPoQty(Number(e.target.value))}
                    style={{ width: '100%', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>ราคาต่อหน่วย (฿)</label>
                  <input
                    type="number"
                    value={newPoUnitPrice}
                    onChange={(e) => setNewPoUnitPrice(Number(e.target.value))}
                    style={{ width: '100%', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>ยอดรวมโดยประมาณ:</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#34d399' }}>฿{(newPoQty * newPoUnitPrice).toLocaleString()}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8, borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowNewPOModal(false)}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: 13, fontWeight: 700 }}
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const selectedSup = suppliers.find((s) => s.id === newPoSupplierId) || suppliers[0];
                    const selectedInv = inventory.find((i) => i.id === newPoItemId) || inventory[0];
                    const total = newPoQty * newPoUnitPrice;
                    createPurchaseOrder({
                      supplierId: selectedSup.id,
                      supplierName: selectedSup.name,
                      items: [
                        {
                          inventoryItemId: selectedInv.id,
                          nameTh: selectedInv.nameTh,
                          unit: selectedInv.unit,
                          qtyOrdered: newPoQty,
                          unitPrice: newPoUnitPrice,
                          total,
                        },
                      ],
                      subtotal: total,
                      grandTotal: total,
                    });
                    setShowNewPOModal(false);
                  }}
                  className="btn-primary"
                  style={{ padding: '8px 20px', fontSize: 13, fontWeight: 800 }}
                >
                  สร้าง PO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: ADD / EDIT SCHEDULE MODAL */}
      {/* ========================================================================= */}
      {showScheduleModal && (
        <div className="modal-overlay">
          <div className="modal-content-card" style={{ maxWidth: 480, width: '100%', padding: 0 }}>
            <div style={{ padding: '16px 20px', background: 'var(--color-bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={18} color="#60a5fa" />
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>
                  {editingSchedule ? 'แก้ไขตารางเวลา RBAC' : 'เพิ่มตารางเวลาทำงานใหม่'}
                </h3>
              </div>
              <button onClick={() => setShowScheduleModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!schForm.title.trim()) return;

                if (editingSchedule) {
                  updateSchedule({
                    ...editingSchedule,
                    ...schForm,
                  });
                } else {
                  addSchedule(schForm);
                }
                setShowScheduleModal(false);
              }}
              style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>ชื่องาน / วัตถุประสงค์ *</label>
                <input
                  type="text"
                  required
                  value={schForm.title}
                  onChange={(e) => setSchForm({ ...schForm, title: e.target.value })}
                  placeholder="เช่น สรุปเงินสดปิดกะ & ตรวจผลต่าง"
                  style={{ width: '100%', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>เวลาทำงาน (HH:mm) *</label>
                  <input
                    type="time"
                    required
                    value={schForm.timeOfDay}
                    onChange={(e) => setSchForm({ ...schForm, timeOfDay: e.target.value })}
                    style={{ width: '100%', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Cron Expression</label>
                  <input
                    type="text"
                    value={schForm.cronExpression}
                    onChange={(e) => setSchForm({ ...schForm, cronExpression: e.target.value })}
                    placeholder="e.g. 0 8 * * *"
                    style={{ width: '100%', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#fff', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Action ที่ต้องทำเมื่อถึงเวลา</label>
                <input
                  type="text"
                  value={schForm.targetAction}
                  onChange={(e) => setSchForm({ ...schForm, targetAction: e.target.value })}
                  placeholder="เช่น พิมพ์ Z-Report และส่ง Alert LINE"
                  style={{ width: '100%', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>ผู้อนุมัติ (Approver Role)</label>
                <select
                  value={schForm.approverRole}
                  onChange={(e) => setSchForm({ ...schForm, approverRole: e.target.value as StaffRole })}
                  style={{ width: '100%', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#fff' }}
                >
                  <option value="owner">👑 Owner</option>
                  <option value="manager">👔 Manager</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8, borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: 13, fontWeight: 700 }}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '8px 20px', background: '#3b82f6', color: '#fff', fontSize: 13, fontWeight: 800 }}
                >
                  บันทึกตารางเวลา
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: ADD / EDIT SUPPLIER MODAL */}
      {/* ========================================================================= */}
      {showSupplierModal && (
        <div className="modal-overlay">
          <div className="modal-content-card" style={{ maxWidth: 480, width: '100%', padding: 0 }}>
            <div style={{ padding: '16px 20px', background: 'var(--color-bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={18} color="#34d399" />
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>
                  {editingSupplier ? 'แก้ไขซัพพลายเออร์' : 'เพิ่มซัพพลายเออร์ใหม่'}
                </h3>
              </div>
              <button onClick={() => setShowSupplierModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!supForm.name.trim()) return;

                if (editingSupplier) {
                  updateSupplier({
                    ...editingSupplier,
                    ...supForm,
                  });
                } else {
                  addSupplier(supForm);
                }
                setShowSupplierModal(false);
              }}
              style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>ชื่อร้านค้า / ซัพพลายเออร์ *</label>
                <input
                  type="text"
                  required
                  value={supForm.name}
                  onChange={(e) => setSupForm({ ...supForm, name: e.target.value })}
                  placeholder="เช่น ร้านเนื้อสด นายก้อง"
                  style={{ width: '100%', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>ผู้ติดต่อ</label>
                  <input
                    type="text"
                    value={supForm.contactPerson}
                    onChange={(e) => setSupForm({ ...supForm, contactPerson: e.target.value })}
                    placeholder="เช่น คุณก้องเกียรติ"
                    style={{ width: '100%', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    value={supForm.phone}
                    onChange={(e) => setSupForm({ ...supForm, phone: e.target.value })}
                    placeholder="081-222-3333"
                    style={{ width: '100%', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>PromptPay ID</label>
                  <input
                    type="text"
                    value={supForm.promptPayId}
                    onChange={(e) => setSupForm({ ...supForm, promptPayId: e.target.value })}
                    placeholder="0812223333"
                    style={{ width: '100%', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>ชื่อบัญชีรับเงิน</label>
                  <input
                    type="text"
                    value={supForm.accountName}
                    onChange={(e) => setSupForm({ ...supForm, accountName: e.target.value })}
                    placeholder="นายก้องเกียรติ มั่งมี"
                    style={{ width: '100%', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#fff' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>ชื่อกลุ่ม LINE หรือ LINE ID</label>
                <input
                  type="text"
                  value={supForm.lineGroup || supForm.lineId || ''}
                  onChange={(e) => setSupForm({ ...supForm, lineGroup: e.target.value, lineId: e.target.value })}
                  placeholder="เช่น [LINE กลุ่ม] สั่งเนื้อสด นายก้อง"
                  style={{ width: '100%', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8, borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: 13, fontWeight: 700 }}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '8px 20px', background: '#10b981', color: '#000', fontSize: 13, fontWeight: 800 }}
                >
                  บันทึกซัพพลายเออร์
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 8: ADD / EDIT INVENTORY MODAL */}
      {/* ========================================================================= */}
      {showInventoryModal && (
        <div className="modal-overlay">
          <div className="modal-content-card" style={{ maxWidth: 480, width: '100%', padding: 0 }}>
            <div style={{ padding: '16px 20px', background: 'var(--color-bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Package size={18} color="#34d399" />
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>
                  {editingInventory ? 'แก้ไขรายการสต็อกวัตถุดิบ' : 'เพิ่มวัตถุดิบใหม่'}
                </h3>
              </div>
              <button onClick={() => setShowInventoryModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!invForm.nameTh.trim()) return;

                if (editingInventory) {
                  updateInventoryItem({
                    ...editingInventory,
                    ...invForm,
                  });
                } else {
                  addInventoryItem(invForm);
                }
                setShowInventoryModal(false);
              }}
              style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>ชื่อวัตถุดิบ (ภาษาไทย) *</label>
                <input
                  type="text"
                  required
                  value={invForm.nameTh}
                  onChange={(e) => setInvForm({ ...invForm, nameTh: e.target.value })}
                  placeholder="เช่น เนื้อน่องลายพิเศษ"
                  style={{ width: '100%', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>สต็อกคงเหลือปัจจุบัน</label>
                  <input
                    type="number"
                    value={invForm.currentStock}
                    onChange={(e) => setInvForm({ ...invForm, currentStock: Number(e.target.value) })}
                    style={{ width: '100%', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>เกณฑ์เตือนสต็อกต่ำ (Min Safety)</label>
                  <input
                    type="number"
                    value={invForm.minSafetyThreshold}
                    onChange={(e) => setInvForm({ ...invForm, minSafetyThreshold: Number(e.target.value) })}
                    style={{ width: '100%', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>หน่วยนับ</label>
                  <input
                    type="text"
                    value={invForm.unit}
                    onChange={(e) => setInvForm({ ...invForm, unit: e.target.value })}
                    placeholder="kg / ถุง / ลัง"
                    style={{ width: '100%', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>ราคาต้นทุนเฉลี่ย (฿)</label>
                  <input
                    type="number"
                    value={invForm.avgCost}
                    onChange={(e) => setInvForm({ ...invForm, avgCost: Number(e.target.value) })}
                    style={{ width: '100%', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#fff' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>ซัพพลายเออร์คู่ค้า</label>
                <select
                  value={invForm.supplierId}
                  onChange={(e) => setInvForm({ ...invForm, supplierId: e.target.value })}
                  style={{ width: '100%', background: 'var(--color-bg-main)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#fff' }}
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8, borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowInventoryModal(false)}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: 13, fontWeight: 700 }}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '8px 20px', background: '#10b981', color: '#000', fontSize: 13, fontWeight: 800 }}
                >
                  บันทึกวัตถุดิบ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POS SALES SIMULATION MODAL (ทดสอบตัดสต็อก BOM + TRIGGER จัดซื้อ) */}
      {/* ========================================================================= */}
      {showSalesSimModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div
            className="modal-content-card"
            style={{
              maxWidth: 780,
              width: '94%',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'var(--color-bg-card)',
              border: '1.5px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--color-border)', paddingBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Flame size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>
                    🧪 จำลองการขายหน้าร้าน (BOM Sales & Stock Decrement Simulator)
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                    ทดสอบการขายเมนูต่างๆ เพื่อตัดสต็อกวัตถุดิบตามสูตร BOM แบบเรียลไทม์ และดูการทริกเกอร์เตือนจัดซื้ออัตโนมัติ
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowSalesSimModal(false);
                  setLastSimResult(null);
                }}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Simulated Menu Items Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                เลือกจำนวนจานที่ต้องการจำลองการขาย:
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                {menuItems.slice(0, 8).map((mItem) => {
                  const currentQty = simItemQuantities[mItem.id] || 0;
                  const recipe = menuRecipes[mItem.id];
                  return (
                    <div
                      key={mItem.id}
                      style={{
                        background: 'var(--color-bg-elevated)',
                        border: '1px solid ' + (currentQty > 0 ? 'rgba(245, 158, 11, 0.4)' : 'var(--color-border)'),
                        borderRadius: 10,
                        padding: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{mItem.nameTh}</div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>฿{mItem.price} / จาน</div>
                        </div>
                        {recipe && recipe.ingredients.length > 0 && (
                          <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
                            BOM: {recipe.ingredients.length} วัตถุดิบ
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
                        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>จำนวน (จาน):</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() =>
                              setSimItemQuantities({
                                ...simItemQuantities,
                                [mItem.id]: Math.max(0, currentQty - 1),
                              })
                            }
                            style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: '#fff', cursor: 'pointer', fontWeight: 800 }}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={currentQty}
                            onChange={(e) =>
                              setSimItemQuantities({
                                ...simItemQuantities,
                                [mItem.id]: Math.max(0, parseInt(e.target.value) || 0),
                              })
                            }
                            style={{ width: 44, padding: '4px', textAlign: 'center', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 4, color: '#fff', fontSize: 12, fontWeight: 800, fontFamily: 'var(--font-mono)' }}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setSimItemQuantities({
                                ...simItemQuantities,
                                [mItem.id]: currentQty + 1,
                              })
                            }
                            style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--color-primary)', border: 'none', color: '#000', cursor: 'pointer', fontWeight: 800 }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Run Button */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 6 }}>
              <button
                type="button"
                onClick={handleRunSaleSimulation}
                className="btn-primary"
                style={{
                  padding: '12px 28px',
                  fontSize: 14,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#000',
                  boxShadow: '0 4px 16px rgba(245, 158, 11, 0.4)',
                }}
              >
                <Zap size={18} />
                <span>⚡ ประมวลผลยอดขายจริง & ตัดสต็อกวัตถุดิบทันที</span>
              </button>
            </div>

            {/* Simulation Results Preview */}
            {lastSimResult && (
              <div
                style={{
                  background: 'var(--color-bg-elevated)',
                  border: '1.5px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: 12,
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle2 size={18} style={{ color: '#34d399' }} />
                    <h4 style={{ fontSize: 14, fontWeight: 800, color: '#34d399', margin: 0 }}>
                      สรุปผลการตัดสต็อกวัตถุดิบ (BOM Deductions)
                    </h4>
                  </div>
                  <div style={{ display: 'flex', gap: 14, fontSize: 12 }}>
                    <span>ยอดขายรวม: <strong style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>฿{lastSimResult.totalSales.toLocaleString()}</strong></span>
                    <span>ต้นทุน COGS รวม: <strong style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>฿{lastSimResult.totalCogs.toFixed(2)}</strong></span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                  {lastSimResult.deductedIngredients.map((ing, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'var(--color-bg-card)',
                        borderRadius: 6,
                        padding: '8px 10px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 12,
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: '#fff' }}>{ing.nameTh}</div>
                        <div style={{ fontSize: 10, color: '#f87171' }}>- {ing.amount.toFixed(3)} {ing.unit}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>คงเหลือ</div>
                        <div style={{ fontWeight: 800, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
                          {ing.currentStock} {ing.unit}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Info size={14} style={{ color: 'var(--color-primary)' }} />
                  <span>หากสต็อกวัตถุดิบชิ้นใดลดลงต่ำกว่าเกณฑ์ความปลอดภัย ระบบจะจัดกลุ่มเข้า **รายการสินค้ารอการสั่งซื้อ** ด้านหลังทันที</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
