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
    language,
  } = usePOS();

  // Top-level Navigation: 'workflows' | 'scheduling' | 'km'
  const [topTab, setTopTab] = useState<'workflows' | 'scheduling' | 'km'>('workflows');

  // Procurement sub-view toggle inside workflows
  const [showProcurementWorkbench, setShowProcurementWorkbench] = useState(false);
  const [procurementSubTab, setProcurementSubTab] = useState<'pos_agent' | 'suppliers' | 'inventory' | 'settings'>('pos_agent');

  // Workflow filters & modals
  const [workflowCategoryFilter, setWorkflowCategoryFilter] = useState<string>('all');
  const [showCreateWorkflowModal, setShowCreateWorkflowModal] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<AutomationWorkflow | null>(null);
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

  // Workflow Form State
  const [wfForm, setWfForm] = useState<Omit<AutomationWorkflow, 'id' | 'executionCount'>>({
    nameTh: '',
    nameEn: '',
    category: 'operations',
    descriptionTh: '',
    descriptionEn: '',
    icon: 'Zap',
    enabled: true,
    triggerType: 'schedule',
    triggerCondition: 'ทุกวัน เวลา 08:00 น.',
    actions: [
      { id: 'act-1', type: 'line_notify', title: 'แจ้งเตือนผ่าน LINE', description: 'ส่งสรุปข้อมูลเข้ากลุ่มพนักงาน' }
    ],
    allowedRoles: ['owner', 'manager'],
    approverRole: 'manager',
    scheduleHuman: 'ทุกวัน 08:00 น.',
    linkedSopId: '',
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

  const triggerWorkflowWithFeedback = (wf: AutomationWorkflow) => {
    runWorkflowNow(wf.id);
    setRunningToast({ name: wf.nameTh, time: new Date().toLocaleTimeString('th-TH') });
    setTimeout(() => {
      setRunningToast(null);
    }, 4000);
  };

  const getWorkflowIcon = (iconName: string) => {
    switch (iconName) {
      case 'Bot': return <Bot size={20} className="text-emerald-400" />;
      case 'Wallet': return <Zap size={20} className="text-amber-400" />;
      case 'Flame': return <Flame size={20} className="text-rose-400" />;
      case 'Database': return <Database size={20} className="text-blue-400" />;
      case 'Smile': return <Smile size={20} className="text-purple-400" />;
      case 'Wrench': return <Wrench size={20} className="text-cyan-400" />;
      default: return <Workflow size={20} className="text-amber-400" />;
    }
  };

  const getCategoryBadge = (cat: WorkflowCategory) => {
    switch (cat) {
      case 'procurement':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">📦 จัดซื้อ & ซัพพลายเออร์</span>;
      case 'finance':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">💰 การเงิน & ปิดกะ</span>;
      case 'operations':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">🍳 งานครัว & ปฏิบัติการ</span>;
      case 'inventory':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">📊 คลังสต็อก</span>;
      case 'customer':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pink-500/20 text-pink-300 border border-pink-500/30">🌟 ลูกค้า & รีวิว</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-500/20 text-gray-300">⚙️ ทั่วไป</span>;
    }
  };

  const getRoleBadge = (role: StaffRole) => {
    switch (role) {
      case 'owner':
        return <span key={role} className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">👑 Owner</span>;
      case 'admin':
        return <span key={role} className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">🛡️ Admin</span>;
      case 'manager':
        return <span key={role} className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">👔 Manager</span>;
      case 'cashier':
        return <span key={role} className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">💵 Cashier</span>;
      case 'kitchen':
        return <span key={role} className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">🍳 Kitchen</span>;
    }
  };

  const getStatusBadge = (status: POStatus) => {
    switch (status) {
      case 'draft':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-500/20 text-gray-400">📝 ร่าง PO</span>;
      case 'sent_line':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">💬 ส่ง LINE แล้ว</span>;
      case 'ocr_received':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">🔍 รอตรวจ OCR</span>;
      case 'reconciled':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">✅ ตรวจสอบแล้ว</span>;
      case 'completed':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">🎉 จ่ายแล้ว & เข้าสต็อก</span>;
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
    <div className="space-y-6">
      {/* Toast feedback when workflow runs */}
      {runningToast && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-950/90 border border-emerald-500/50 text-emerald-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
          <Sparkles size={20} className="text-emerald-400 animate-spin" />
          <div>
            <div className="font-bold text-sm">สั่งรันเวิร์กโฟลว์สำเร็จ!</div>
            <div className="text-xs text-emerald-300">{runningToast.name} ({runningToast.time})</div>
          </div>
        </div>
      )}

      {/* Header Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-blue-950/40 border border-amber-500/20 p-6 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Workflow size={28} className="text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white tracking-tight">
                {language === 'th' ? 'ศูนย์จัดการเวิร์กโฟลว์อัตโนมัติ (Automation Workflow Hub)' : 'Automation Workflow & Procurement Center'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold">
                PRO Enterprise
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-0.5">
              {language === 'th'
                ? 'ระบบจัดการการทำงานอัตโนมัติทั้งร้าน • ระบบจัดซื้อ & LINE Bot • RBAC Scheduling • คลังความรู้ KM & SOP'
                : 'Modular Restaurant Automation • Autonomous LINE Procurement • RBAC Scheduling • SOP Knowledge Base'}
            </p>
          </div>
        </div>

        {/* Global Action Stats */}
        <div className="flex items-center gap-3">
          <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-center">
            <div className="text-xs text-gray-400">เวิร์กโฟลว์ทั้งหมด</div>
            <div className="text-lg font-black text-amber-400">{workflows.length}</div>
          </div>
          <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-center">
            <div className="text-xs text-gray-400">ตารางเวลา RBAC</div>
            <div className="text-lg font-black text-blue-400">{workflowSchedules.length}</div>
          </div>
          <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-center">
            <div className="text-xs text-gray-400">คลังเอกสาร SOP</div>
            <div className="text-lg font-black text-emerald-400">{knowledgeDocs.length}</div>
          </div>
        </div>
      </div>

      {/* Main 3 Navigation Tabs */}
      <div className="flex border-b border-white/10 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => { setTopTab('workflows'); setShowProcurementWorkbench(false); }}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
            topTab === 'workflows' && !showProcurementWorkbench
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Zap size={18} />
          <span>⚡ เวิร์กโฟลว์ทั้งหมด (Workflows)</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-black/20 font-bold">{workflows.length}</span>
        </button>

        <button
          onClick={() => { setTopTab('scheduling'); setShowProcurementWorkbench(false); }}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
            topTab === 'scheduling'
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Clock size={18} />
          <span>⏱️ ตารางเวลา & สิทธิ์ RBAC (Scheduling)</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-black/20 font-bold">{workflowSchedules.length}</span>
        </button>

        <button
          onClick={() => { setTopTab('km'); setShowProcurementWorkbench(false); }}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
            topTab === 'km'
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <BookOpen size={18} />
          <span>📚 คลังความรู้ & SOP (Knowledge Base - KM)</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-black/20 font-bold">{knowledgeDocs.length}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: WORKFLOW CATALOG & PROCUREMENT */}
      {/* ========================================================================= */}
      {topTab === 'workflows' && !showProcurementWorkbench && (
        <div className="space-y-6">
          {/* Featured Hero: Autonomous Procurement Workflow */}
          <div className="relative overflow-hidden bg-gradient-to-r from-emerald-950/60 via-slate-900 to-amber-950/40 border border-emerald-500/30 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-emerald-500 text-black text-xs font-black uppercase tracking-wider">
                    Core Autonomous Workflow
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    LINE Agent Active & Ready
                  </span>
                </div>
                <h2 className="text-xl font-black text-white">
                  🤖 ระบบจัดซื้อ & สั่งของซัพพลายเออร์ผ่าน LINE อัตโนมัติ (LINE Procurement)
                </h2>
                <p className="text-sm text-gray-300 leading-relaxed">
                  เชื่อมต่อสต็อกวัตถุดิบเข้ากับ LINE กลุ่มของซัพพลายเออร์ สั่งซื้ออัตโนมัติเมื่อสต็อกต่ำกว่าเกณฑ์ความปลอดภัย ตรวจสอบสลิปผ่าน AI OCR และรองรับ 1-Click PromptPay Payment
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <div className="flex items-center gap-1.5 text-xs text-gray-300 bg-black/30 px-3 py-1.5 rounded-lg border border-white/10">
                    <Truck size={14} className="text-amber-400" />
                    <span>{suppliers.length} ซัพพลายเออร์ในระบบ</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-300 bg-black/30 px-3 py-1.5 rounded-lg border border-white/10">
                    <AlertTriangle size={14} className="text-rose-400" />
                    <span>{inventory.filter((i) => i.currentStock <= i.minSafetyThreshold).length} รายการสต็อกวิกฤต</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-300 bg-black/30 px-3 py-1.5 rounded-lg border border-white/10">
                    <MessageSquare size={14} className="text-emerald-400" />
                    <span>{lineLogs.length} ข้อความ LINE Logs</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
                <button
                  onClick={() => setShowProcurementWorkbench(true)}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                >
                  <Bot size={18} />
                  <span>เข้าสู่ห้องควบคุมจัดซื้อ (Procurement Suite)</span>
                  <ExternalLink size={16} />
                </button>
                <button
                  onClick={() => {
                    const lowStockItem = inventory.find((i) => i.currentStock <= i.minSafetyThreshold);
                    if (lowStockItem) {
                      triggerAutoPOForLowStock(lowStockItem.id);
                    } else if (inventory[0]) {
                      triggerAutoPOForLowStock(inventory[0].id);
                    }
                    setShowProcurementWorkbench(true);
                  }}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl border border-white/10 transition-all"
                >
                  <Play size={14} className="text-amber-400" />
                  <span>ทดสอบจำลอง Auto-PO สั่งด่วน</span>
                </button>
              </div>
            </div>
          </div>

          {/* Workflow Catalog Filters & Create Action */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
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
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    workflowCategoryFilter === f.id
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-white/5 text-gray-400 hover:text-white border border-transparent'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setEditingWorkflow(null);
                setWfForm({
                  nameTh: '',
                  nameEn: '',
                  category: 'operations',
                  descriptionTh: '',
                  descriptionEn: '',
                  icon: 'Zap',
                  enabled: true,
                  triggerType: 'schedule',
                  triggerCondition: 'ทุกวัน เวลา 08:00 น.',
                  actions: [
                    { id: `act-${Date.now()}`, type: 'line_notify', title: 'แจ้งเตือนผ่าน LINE', description: 'ส่งข้อมูลสรุปเข้ากลุ่ม' }
                  ],
                  allowedRoles: ['owner', 'manager'],
                  approverRole: 'manager',
                  scheduleHuman: 'ทุกวัน 08:00 น.',
                  linkedSopId: knowledgeDocs[0]?.id || '',
                });
                setShowCreateWorkflowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-sm rounded-xl transition-all shadow-lg shadow-amber-500/10"
            >
              <Plus size={16} />
              <span>สร้างเวิร์กโฟลว์ใหม่ (Create Workflow)</span>
            </button>
          </div>

          {/* Workflow Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredWorkflows.map((wf) => {
              const linkedSop = knowledgeDocs.find((d) => d.id === wf.linkedSopId);
              return (
                <div
                  key={wf.id}
                  className={`bg-slate-900/80 border rounded-2xl p-5 flex flex-col justify-between transition-all hover:border-amber-500/40 ${
                    wf.enabled ? 'border-white/10 shadow-lg' : 'border-white/5 opacity-60 bg-black/40'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Row: Icon, Name, Category & Toggle */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                          {getWorkflowIcon(wf.icon)}
                        </div>
                        <div>
                          <div className="font-bold text-white text-base leading-snug">{wf.nameTh}</div>
                          <div className="text-xs text-gray-400">{wf.nameEn}</div>
                        </div>
                      </div>

                      {/* Enable Switch */}
                      <button
                        onClick={() => toggleWorkflow(wf.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          wf.enabled ? 'bg-amber-500' : 'bg-gray-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            wf.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Category & Trigger Condition */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {getCategoryBadge(wf.category)}
                      <span className="px-2 py-0.5 rounded-md bg-white/5 text-gray-300 text-xs border border-white/10 flex items-center gap-1.5">
                        <Clock size={12} className="text-amber-400" />
                        {wf.scheduleHuman || wf.triggerCondition}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
                      {wf.descriptionTh}
                    </p>

                    {/* Action Pipeline Steps Preview */}
                    <div className="bg-black/30 border border-white/5 rounded-xl p-3 space-y-1.5">
                      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                        <span>ลำดับการทำงาน (Action Steps):</span>
                        <span className="text-amber-400">{wf.actions.length} ขั้นตอน</span>
                      </div>
                      <div className="space-y-1">
                        {wf.actions.map((act, i) => (
                          <div key={act.id || i} className="flex items-center gap-2 text-xs text-gray-300">
                            <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold">
                              {i + 1}
                            </span>
                            <span className="font-medium">{act.title}</span>
                            {act.targetChannel && (
                              <span className="text-[10px] text-gray-400 bg-white/5 px-1.5 py-0.5 rounded">
                                {act.targetChannel}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Roles & Linked SOP */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] text-gray-400 font-medium">สิทธิ์ใช้งาน:</span>
                        {wf.allowedRoles.map((r) => getRoleBadge(r))}
                        {wf.approverRole && (
                          <span className="text-[10px] text-amber-400/80 ml-1">
                            (อนุมัติ: {wf.approverRole})
                          </span>
                        )}
                      </div>

                      {linkedSop && (
                        <button
                          onClick={() => {
                            setSelectedDocForView(linkedSop);
                            setTopTab('km');
                          }}
                          className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 transition-all"
                        >
                          <BookOpen size={12} />
                          <span>ดู SOP ({linkedSop.version})</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bottom Stats & Trigger Action */}
                  <div className="border-t border-white/10 mt-4 pt-3 flex items-center justify-between">
                    <div className="text-[11px] text-gray-400">
                      รันแล้ว <span className="font-bold text-white">{wf.executionCount}</span> ครั้ง •{' '}
                      {wf.lastRunAt ? new Date(wf.lastRunAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : 'ยังไม่เคยรัน'}
                    </div>

                    <div className="flex items-center gap-2">
                      {wf.isSpecialProcurement ? (
                        <button
                          onClick={() => setShowProcurementWorkbench(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold rounded-xl border border-emerald-500/40 transition-all"
                        >
                          <Bot size={14} />
                          <span>เปิดหน้าจัดซื้อ</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => triggerWorkflowWithFeedback(wf)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold rounded-xl border border-amber-500/40 transition-all"
                        >
                          <Play size={12} />
                          <span>รันทันที</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setEditingWorkflow(wf);
                          setWfForm({
                            nameTh: wf.nameTh,
                            nameEn: wf.nameEn,
                            category: wf.category,
                            descriptionTh: wf.descriptionTh,
                            descriptionEn: wf.descriptionEn,
                            icon: wf.icon,
                            enabled: wf.enabled,
                            triggerType: wf.triggerType,
                            triggerCondition: wf.triggerCondition,
                            actions: [...wf.actions],
                            allowedRoles: [...wf.allowedRoles],
                            approverRole: wf.approverRole || 'manager',
                            scheduleHuman: wf.scheduleHuman || '',
                            linkedSopId: wf.linkedSopId || '',
                          });
                          setShowCreateWorkflowModal(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5"
                        title="แก้ไขเวิร์กโฟลว์"
                      >
                        <Edit2 size={14} />
                      </button>

                      {!wf.isSpecialProcurement && (
                        <button
                          onClick={() => deleteWorkflow(wf.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-400 rounded-lg hover:bg-white/5"
                          title="ลบเวิร์กโฟลว์"
                        >
                          <Trash2 size={14} />
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
      {/* TAB 1 SUB-VIEW: FULL INTERACTIVE PROCUREMENT WORKBENCH */}
      {/* ========================================================================= */}
      {topTab === 'workflows' && showProcurementWorkbench && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-900 border border-white/10 p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowProcurementWorkbench(false)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all"
              >
                ← กลับหน้าเวิร์กโฟลว์หลัก
              </button>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Bot size={20} className="text-emerald-400" />
                <span>ระบบจัดซื้อ & LINE Agent (Procurement Suite)</span>
              </h2>
            </div>

            {/* Sub-tabs for Procurement Workbench */}
            <div className="flex items-center gap-2">
              {[
                { id: 'pos_agent', label: '💬 แชทบอท & ใบสั่งซื้อ', icon: <Bot size={14} /> },
                { id: 'suppliers', label: '🏢 ซัพพลายเออร์', icon: <Building2 size={14} /> },
                { id: 'inventory', label: '📦 สต็อก & เกณฑ์เตือน', icon: <Package size={14} /> },
                { id: 'settings', label: '⚙️ ตั้งค่าบอท', icon: <Settings size={14} /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setProcurementSubTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    procurementSubTab === tab.id
                      ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                      : 'text-gray-400 hover:text-white bg-white/5'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* PROCUREMENT SUBTAB: PO & LINE AGENT */}
          {procurementSubTab === 'pos_agent' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: PO List */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FileText size={18} className="text-amber-400" />
                    <span>รายการใบสั่งซื้อสินค้า (Purchase Orders)</span>
                  </h3>
                  <button
                    onClick={() => setShowNewPOModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-black font-bold text-xs rounded-xl hover:bg-amber-400 transition-all"
                  >
                    <Plus size={14} />
                    <span>+ สร้าง PO ใหม่</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {purchaseOrders.map((po) => (
                    <div
                      key={po.id}
                      className="bg-slate-900 border border-white/10 rounded-2xl p-4 space-y-3 hover:border-emerald-500/40 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-amber-400 text-sm">{po.poNumber}</span>
                            {getStatusBadge(po.status)}
                          </div>
                          <div className="text-xs text-gray-300 font-semibold mt-1">
                            🏢 {po.supplierName}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            สร้างเมื่อ {new Date(po.createdAt).toLocaleString('th-TH')} โดย {po.createdBy}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs text-gray-400">ยอดรวมทั้งสิ้น</div>
                          <div className="text-lg font-black text-emerald-400">฿{po.grandTotal.toLocaleString()}</div>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="bg-black/30 rounded-xl p-2.5 space-y-1">
                        {po.items.map((it, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs text-gray-300">
                            <span>• {it.nameTh} ({it.qtyOrdered} {it.unit})</span>
                            <span className="font-semibold text-gray-200">฿{it.total.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      {/* PO Action Buttons */}
                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/5">
                        {po.status === 'draft' && (
                          <button
                            onClick={() => sendPOToLineGroup(po.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all"
                          >
                            <Send size={12} />
                            <span>ส่ง LINE กลุ่มซัพพลายเออร์</span>
                          </button>
                        )}

                        {po.status === 'sent_line' && (
                          <button
                            onClick={() => simulateSupplierLineReply(po.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl transition-all"
                          >
                            <MessageSquare size={12} />
                            <span>จำลองร้านตอบบิล & QR</span>
                          </button>
                        )}

                        {(po.status === 'ocr_received' || po.status === 'reconciled') && (
                          <button
                            onClick={() => setSelectedPOForPay(po)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                          >
                            <QrCode size={12} />
                            <span>สแกนจ่าย PromptPay (฿{po.grandTotal.toLocaleString()})</span>
                          </button>
                        )}

                        {po.status === 'completed' && (
                          <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 size={14} />
                            <span>ชำระเงินเรียบร้อย & เข้าสต็อกแล้ว</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Live LINE Chat Logs */}
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <MessageSquare size={18} className="text-emerald-400" />
                    <span>LINE Chat Simulator (ข้อความสด)</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                    Connected
                  </span>
                </div>

                <div className="bg-slate-950 border border-white/10 rounded-2xl p-4 h-[550px] overflow-y-auto space-y-3 flex flex-col justify-start">
                  {lineLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`flex flex-col max-w-[85%] ${
                        log.direction === 'outbound' ? 'self-end items-end' : 'self-start items-start'
                      }`}
                    >
                      <div className="text-[10px] text-gray-400 mb-1 px-1">
                        {log.sender} • {new Date(log.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div
                        className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-line shadow-md ${
                          log.direction === 'outbound'
                            ? 'bg-emerald-600 text-white rounded-tr-none'
                            : 'bg-slate-800 text-gray-200 border border-white/10 rounded-tl-none'
                        }`}
                      >
                        {log.messageText}
                        {log.imageUrl && (
                          <div className="mt-2 rounded-lg overflow-hidden border border-white/10">
                            <img src={log.imageUrl} alt="Bill attachment" className="w-full h-32 object-cover" />
                          </div>
                        )}
                        {log.ocrStatus && (
                          <div className="mt-2 pt-1 border-t border-white/10 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                            <ShieldCheck size={12} />
                            <span>OCR Status: {log.ocrStatus.toUpperCase()} (PromptPay Verified)</span>
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">รายชื่อซัพพลายเออร์ที่ลงทะเบียน</h3>
                  <p className="text-xs text-gray-400">กำหนดช่องทางสั่งของ อนุมัติวงเงินอัตโนมัติ และเลข PromptPay บัญชีคู่ค้า</p>
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
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-black font-bold text-xs rounded-xl hover:bg-emerald-400 transition-all"
                >
                  <Plus size={14} />
                  <span>+ เพิ่มซัพพลายเออร์</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suppliers.map((sup) => (
                  <div key={sup.id} className="bg-slate-900 border border-white/10 rounded-2xl p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                          {sup.category}
                        </span>
                        <h4 className="font-bold text-white text-base mt-1">{sup.name}</h4>
                        <div className="text-xs text-gray-400">ติดต่อ: {sup.contactPerson} ({sup.phone})</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingSupplier(sup);
                            setSupForm(sup);
                            setShowSupplierModal(true);
                          }}
                          className="p-1 text-gray-400 hover:text-white rounded"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => deleteSupplier(sup.id)}
                          className="p-1 text-gray-400 hover:text-rose-400 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="bg-black/30 rounded-xl p-2.5 text-xs space-y-1 text-gray-300">
                      <div>📱 LINE กลุ่ม: <span className="text-emerald-400 font-semibold">{sup.lineGroup || sup.lineId || 'ยังไม่ระบุ'}</span></div>
                      <div>⚡ PromptPay: <span className="text-amber-400 font-semibold">{sup.promptPayId} ({sup.accountName})</span></div>
                      <div>🏦 ธนาคาร: {sup.bankName}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PROCUREMENT SUBTAB: INVENTORY */}
          {procurementSubTab === 'inventory' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">ระดับสต็อกวัตถุดิบ & เกณฑ์ความปลอดภัย (Safety Stock)</h3>
                  <p className="text-xs text-gray-400">เมื่อคงเหลือต่ำกว่าเกณฑ์ ระบบจะทริกเกอร์สร้าง PO สั่งซื้ออัตโนมัติทันที</p>
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
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-black font-bold text-xs rounded-xl hover:bg-emerald-400 transition-all"
                >
                  <Plus size={14} />
                  <span>+ เพิ่มวัตถุดิบ</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inventory.map((inv) => {
                  const isLow = inv.currentStock <= inv.minSafetyThreshold;
                  const supplier = suppliers.find((s) => s.id === inv.supplierId);
                  return (
                    <div
                      key={inv.id}
                      className={`bg-slate-900 border rounded-2xl p-4 space-y-3 ${
                        isLow ? 'border-rose-500/50 bg-rose-950/20' : 'border-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-white text-base">{inv.nameTh}</div>
                          <div className="text-xs text-gray-400">{inv.nameEn}</div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isLow ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                              ⚠️ สต็อกวิกฤต
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                              ปกติ
                            </span>
                          )}
                          <button
                            onClick={() => {
                              setEditingInventory(inv);
                              setInvForm(inv);
                              setShowInventoryModal(true);
                            }}
                            className="p-1 text-gray-400 hover:text-white rounded"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => deleteInventoryItem(inv.id)}
                            className="p-1 text-gray-400 hover:text-rose-400 rounded"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-black/30 p-2.5 rounded-xl">
                        <div>
                          <div className="text-[10px] text-gray-400">คงเหลือปัจจุบัน</div>
                          <div className="text-lg font-black text-white">{inv.currentStock} {inv.unit}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-gray-400">เกณฑ์เตือน (Min Safety)</div>
                          <div className="text-sm font-bold text-amber-400">{inv.minSafetyThreshold} {inv.unit}</div>
                        </div>
                      </div>

                      <div className="text-xs text-gray-400 flex items-center justify-between">
                        <span>ซัพพลายเออร์: {supplier?.name || 'ไม่ระบุ'}</span>
                        <span>ต้นทุนเฉลี่ย: ฿{inv.avgCost}/{inv.unit}</span>
                      </div>

                      {isLow && (
                        <button
                          onClick={() => triggerAutoPOForLowStock(inv.id)}
                          className="w-full py-2 bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-rose-500/20"
                        >
                          <Zap size={14} />
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
            <div className="max-w-2xl bg-slate-900 border border-white/10 rounded-2xl p-6 space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings size={20} className="text-amber-400" />
                <span>การตั้งค่า LINE Agent & Autonomous Engine</span>
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-black/30 rounded-xl border border-white/5">
                  <div>
                    <div className="font-bold text-sm text-white">เปิดใช้งาน LINE Procurement Agent</div>
                    <div className="text-xs text-gray-400">ส่งและรับข้อความในกลุ่ม LINE ซัพพลายเออร์อัตโนมัติ</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={lineAgentConfig.botEnabled}
                    onChange={(e) => updateLineAgentConfig({ botEnabled: e.target.checked })}
                    className="w-5 h-5 accent-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-black/30 rounded-xl border border-white/5">
                  <div>
                    <div className="font-bold text-sm text-white">สั่ง PO อัตโนมัติเมื่อสต็อกต่ำ (Auto-PO on Low Stock)</div>
                    <div className="text-xs text-gray-400">สร้างใบสั่งซื้อและยิงเข้า LINE ซัพพลายเออร์ทันทีที่ต่ำกว่าเกณฑ์</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={lineAgentConfig.autoSendLineOnLowStock}
                    onChange={(e) => updateLineAgentConfig({ autoSendLineOnLowStock: e.target.checked })}
                    className="w-5 h-5 accent-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-black/30 rounded-xl border border-white/5">
                  <div>
                    <div className="font-bold text-sm text-white">ตรวจสอบบัญชีธนาคาร Whitelist (Anti-Fraud)</div>
                    <div className="text-xs text-gray-400">ป้องกันการโอนเงินผิดบัญชีโดยตรวจจับเลข PromptPay ใน QR</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={lineAgentConfig.verifySupplierBankWhitelist}
                    onChange={(e) => updateLineAgentConfig({ verifySupplierBankWhitelist: e.target.checked })}
                    className="w-5 h-5 accent-emerald-500"
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
        <div className="space-y-6">
          {/* Daily Schedule Timeline Card */}
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Calendar size={20} className="text-blue-400" />
                  <span>ไทม์ไลน์รอบการทำงานอัตโนมัติตลอดวัน (24h Automation Timeline)</span>
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  ระบบจะตรวจสอบและประมวลผลงานตามเวลาที่กำหนดโดยไม่ต้องรอคนกดสั่ง
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
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-blue-500/20"
              >
                <Plus size={16} />
                <span>+ เพิ่มตารางเวลาใหม่ (Add Schedule)</span>
              </button>
            </div>

            {/* Timeline Visual Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <div className="bg-blue-950/40 border border-blue-500/30 p-4 rounded-xl space-y-1">
                <div className="text-xs font-bold text-blue-400">🌅 รอบเช้า (07:00 น.)</div>
                <div className="font-black text-white text-sm">ต้มน้ำซุป & หมักเนื้อ</div>
                <div className="text-[11px] text-gray-300">ส่ง KDS Alert & เช็ค SOP-KIT-01</div>
              </div>

              <div className="bg-amber-950/40 border border-amber-500/30 p-4 rounded-xl space-y-1">
                <div className="text-xs font-bold text-amber-400">☀️ รอบบ่าย (14:00 น.)</div>
                <div className="font-black text-white text-sm">สแกนสต็อก & เตือนสั่งของ</div>
                <div className="text-[11px] text-gray-300">เช็ค Safety Stock & ร่าง PO</div>
              </div>

              <div className="bg-purple-950/40 border border-purple-500/30 p-4 rounded-xl space-y-1">
                <div className="text-xs font-bold text-purple-400">🌙 รอบค่ำ (22:30 น.)</div>
                <div className="font-black text-white text-sm">สรุปยอดเงินสดปิดกะ</div>
                <div className="text-[11px] text-gray-300">พิมพ์ Z-Report & เตือนผลต่างเงิน</div>
              </div>

              <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-xl space-y-1">
                <div className="text-xs font-bold text-emerald-400">🌌 เที่ยงคืน (23:45 น.)</div>
                <div className="font-black text-white text-sm">Sync โปรแกรมบัญชี & ภาษี</div>
                <div className="text-[11px] text-gray-300">ยิง FlowAccount Webhook</div>
              </div>
            </div>
          </div>

          {/* RBAC Capability Matrix */}
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Shield size={18} className="text-amber-400" />
                <span>ตารางสิทธิ์การทำงานตามบทบาท (RBAC Permission Matrix)</span>
              </h3>
              <p className="text-xs text-gray-400">ควบคุมสิทธิ์ว่าพนักงานตำแหน่งใดสามารถ สั่งรัน อนุมัติ หรือแก้ไขเวิร์กโฟลว์ได้</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-white/5 uppercase text-gray-400 border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4">บทบาทพนักงาน (Role)</th>
                    <th className="py-3 px-4 text-center">ทดสอบรันทันที (Trigger)</th>
                    <th className="py-3 px-4 text-center">อนุมัติ PO / ปิดกะ (Approve)</th>
                    <th className="py-3 px-4 text-center">แก้ไขเวิร์กโฟลว์ & เวลา</th>
                    <th className="py-3 px-4 text-center">อ่าน / เช็คลิสต์ SOP</th>
                    <th className="py-3 px-4 text-center">เข้าถึง API Keys</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="py-3 px-4 font-bold text-amber-400">👑 เจ้าของร้าน (Owner)</td>
                    <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ ทุกงาน</td>
                    <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ อนุมัติได้สูงสุด</td>
                    <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ แก้ไขได้ทั้งหมด</td>
                    <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ อ่าน/แก้ไข</td>
                    <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ เข้าถึงได้</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-purple-400">🛡️ ผู้ดูแลระบบ (Admin)</td>
                    <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ ทุกงาน</td>
                    <td className="py-3 px-4 text-center text-gray-500">-</td>
                    <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ แก้ไขได้ทั้งหมด</td>
                    <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ อ่าน/แก้ไข</td>
                    <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ จัดการ Webhooks</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-blue-400">👔 ผู้จัดการร้าน (Manager)</td>
                    <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ งานร้าน & ครัว</td>
                    <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ อนุมัติเบื้องต้น</td>
                    <td className="py-3 px-4 text-center text-gray-500">-</td>
                    <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ อ่าน/ตรวจสอบ</td>
                    <td className="py-3 px-4 text-center text-gray-500">-</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-emerald-400">💵 แคชเชียร์ (Cashier)</td>
                    <td className="py-3 px-4 text-center text-amber-400">✓ เฉพาะปิดกะเงินสด</td>
                    <td className="py-3 px-4 text-center text-gray-500">-</td>
                    <td className="py-3 px-4 text-center text-gray-500">-</td>
                    <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ อ่าน SOP ปิดกะ</td>
                    <td className="py-3 px-4 text-center text-gray-500">-</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-rose-400">🍳 ทีมครัว (Kitchen)</td>
                    <td className="py-3 px-4 text-center text-amber-400">✓ เฉพาะสั่งของ & ต้มซุป</td>
                    <td className="py-3 px-4 text-center text-gray-500">-</td>
                    <td className="py-3 px-4 text-center text-gray-500">-</td>
                    <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ อ่านสูตร & ตรวจรับ</td>
                    <td className="py-3 px-4 text-center text-gray-500">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Schedule List Cards */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-white">ตารางการทำงานที่บันทึกไว้ ({workflowSchedules.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workflowSchedules.map((sch) => (
                <div key={sch.id} className="bg-slate-900 border border-white/10 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-amber-400 text-base">{sch.timeOfDay} น.</span>
                        <span className="text-xs text-gray-400 font-mono">({sch.cronExpression})</span>
                      </div>
                      <h4 className="font-bold text-white text-sm mt-0.5">{sch.title}</h4>
                    </div>

                    <button
                      onClick={() => toggleSchedule(sch.id)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        sch.enabled ? 'bg-blue-500' : 'bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          sch.enabled ? 'translate-x-4' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <p className="text-xs text-gray-300 bg-black/30 p-2.5 rounded-xl">
                    ⚡ {sch.targetAction}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-white/5">
                    <div className="flex items-center gap-1">
                      <span>สิทธิ์:</span>
                      {sch.allowedRoles.map((r) => getRoleBadge(r))}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingSchedule(sch);
                          setSchForm(sch);
                          setShowScheduleModal(true);
                        }}
                        className="p-1 text-gray-400 hover:text-white rounded"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => deleteSchedule(sch.id)}
                        className="p-1 text-gray-400 hover:text-rose-400 rounded"
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
        <div className="space-y-6">
          {/* Header & Search */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-white/10 p-5 rounded-2xl">
            <div className="flex-1 w-full max-w-md relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={kmSearchQuery}
                onChange={(e) => setKmSearchQuery(e.target.value)}
                placeholder="ค้นหา SOP, คู่มือ, สูตรอาหาร, หรือ Checklist..."
                className="w-full bg-slate-950 border border-white/15 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
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
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20"
              >
                <Plus size={16} />
                <span>+ เพิ่มคู่มือ SOP / KM (New SOP)</span>
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
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
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  kmCategoryFilter === f.id
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-white/5 text-gray-400 hover:text-white border border-transparent'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Knowledge Docs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredKnowledgeDocs.map((doc) => {
              const linkedWorkflowCount = doc.linkedWorkflowIds?.length || 0;
              return (
                <div
                  key={doc.id}
                  className="bg-slate-900 border border-white/10 rounded-2xl p-5 flex flex-col justify-between hover:border-emerald-500/40 transition-all group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {doc.version}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(doc.updatedAt).toLocaleDateString('th-TH')}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-white text-base leading-snug group-hover:text-emerald-300 transition-colors">
                        {doc.titleTh}
                      </h4>
                      <div className="text-xs text-gray-400 mt-0.5">{doc.titleEn}</div>
                    </div>

                    <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed">
                      {doc.summary}
                    </p>

                    {/* Tag list */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {doc.tags.map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded bg-black/40 text-[10px] text-gray-400 border border-white/5">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-white/10 mt-4 pt-3 flex items-center justify-between">
                    <div className="text-[11px] text-gray-400">
                      {doc.checklists?.length || 0} เช็คลิสต์ • {linkedWorkflowCount} เวิร์กโฟลว์
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedDocForView(doc)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs rounded-xl transition-all shadow-md shadow-emerald-500/10"
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
                        className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5"
                      >
                        <Edit2 size={13} />
                      </button>

                      <button
                        onClick={() => deleteKnowledgeDoc(doc.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-400 rounded-lg hover:bg-white/5"
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
      {/* MODAL 1: CREATE / EDIT WORKFLOW MODAL */}
      {/* ========================================================================= */}
      {showCreateWorkflowModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/20 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-6 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Workflow className="text-amber-400" size={24} />
                <h3 className="text-xl font-black text-white">
                  {editingWorkflow ? 'แก้ไขเวิร์กโฟลว์อัตโนมัติ' : 'สร้างเวิร์กโฟลว์อัตโนมัติใหม่'}
                </h3>
              </div>
              <button
                onClick={() => setShowCreateWorkflowModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 text-gray-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!wfForm.nameTh.trim()) return;

                if (editingWorkflow) {
                  updateWorkflow({
                    ...editingWorkflow,
                    ...wfForm,
                  });
                } else {
                  addWorkflow(wfForm);
                }
                setShowCreateWorkflowModal(false);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-300 font-bold block mb-1">ชื่อเวิร์กโฟลว์ (ภาษาไทย) *</label>
                  <input
                    type="text"
                    required
                    value={wfForm.nameTh}
                    onChange={(e) => setWfForm({ ...wfForm, nameTh: e.target.value })}
                    placeholder="เช่น แจ้งเตือนต้มน้ำซุปเช้า"
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-300 font-bold block mb-1">Workflow Name (English)</label>
                  <input
                    type="text"
                    value={wfForm.nameEn}
                    onChange={(e) => setWfForm({ ...wfForm, nameEn: e.target.value })}
                    placeholder="e.g. Morning Broth Alert"
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-300 font-bold block mb-1">หมวดหมู่ (Category)</label>
                  <select
                    value={wfForm.category}
                    onChange={(e) => setWfForm({ ...wfForm, category: e.target.value as WorkflowCategory })}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    <option value="procurement">📦 จัดซื้อ & ซัพพลายเออร์</option>
                    <option value="finance">💰 การเงิน & ปิดกะ</option>
                    <option value="operations">🍳 งานครัว & ปฏิบัติการ</option>
                    <option value="inventory">📊 คลังสต็อก</option>
                    <option value="customer">🌟 ลูกค้า & รีวิว</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-300 font-bold block mb-1">ประเภททริกเกอร์ (Trigger Type)</label>
                  <select
                    value={wfForm.triggerType}
                    onChange={(e) => setWfForm({ ...wfForm, triggerType: e.target.value as WorkflowTriggerType })}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    <option value="schedule">⏱️ ตามตารางเวลา (Schedule / Cron)</option>
                    <option value="threshold">⚠️ เมื่อสต็อกต่ำกว่าเกณฑ์ (Safety Stock)</option>
                    <option value="event">⚡ เมื่อเกิด Event ใน POS (บิลเสร็จ/เปิดโต๊ะ)</option>
                    <option value="manual">🖐️ สั่งรันด้วยตนเอง (Manual Trigger)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-300 font-bold block mb-1">เงื่อนไขการทริกเกอร์ (Trigger Condition)</label>
                <input
                  type="text"
                  value={wfForm.triggerCondition}
                  onChange={(e) => setWfForm({ ...wfForm, triggerCondition: e.target.value, scheduleHuman: e.target.value })}
                  placeholder="เช่น ทุกวันเวลา 07:00 น. หรือ เมื่อสต็อก < 10 kg"
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="text-xs text-gray-300 font-bold block mb-1">คำอธิบายการทำงาน</label>
                <textarea
                  rows={2}
                  value={wfForm.descriptionTh}
                  onChange={(e) => setWfForm({ ...wfForm, descriptionTh: e.target.value })}
                  placeholder="อธิบายว่าเวิร์กโฟลว์นี้ทำอะไร และส่งต่อไปยังใคร"
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              {/* Action Sequence Builder */}
              <div className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    ⚡ ลำดับขั้นตอนทำงาน (Action Pipeline)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setWfForm({
                        ...wfForm,
                        actions: [
                          ...wfForm.actions,
                          {
                            id: `act-${Date.now()}`,
                            type: 'line_notify',
                            title: 'แจ้งเตือนผ่าน LINE',
                            description: 'ส่งข้อความสรุปข้อมูล',
                            targetChannel: 'LINE Channel',
                          },
                        ],
                      });
                    }}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                  >
                    + เพิ่ม Action
                  </button>
                </div>

                <div className="space-y-2">
                  {wfForm.actions.map((act, index) => (
                    <div key={act.id || index} className="flex items-center gap-2 bg-slate-900 p-2.5 rounded-xl border border-white/5">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        value={act.title}
                        onChange={(e) => {
                          const newActs = [...wfForm.actions];
                          newActs[index].title = e.target.value;
                          setWfForm({ ...wfForm, actions: newActs });
                        }}
                        placeholder="ชื่อ Action"
                        className="flex-1 bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white"
                      />
                      <input
                        type="text"
                        value={act.targetChannel || ''}
                        onChange={(e) => {
                          const newActs = [...wfForm.actions];
                          newActs[index].targetChannel = e.target.value;
                          setWfForm({ ...wfForm, actions: newActs });
                        }}
                        placeholder="ช่องทาง เช่น LINE / KDS"
                        className="w-32 bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white"
                      />
                      {wfForm.actions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setWfForm({
                              ...wfForm,
                              actions: wfForm.actions.filter((_, idx) => idx !== index),
                            });
                          }}
                          className="text-gray-400 hover:text-rose-400 p-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* RBAC & Linked SOP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-300 font-bold block mb-1">บทบาทที่ต้องอนุมัติ (Approver Role)</label>
                  <select
                    value={wfForm.approverRole || 'manager'}
                    onChange={(e) => setWfForm({ ...wfForm, approverRole: e.target.value as StaffRole })}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    <option value="owner">👑 Owner (เจ้าของร้าน)</option>
                    <option value="manager">👔 Manager (ผู้จัดการ)</option>
                    <option value="kitchen">🍳 Kitchen (หัวหน้าครัว)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-300 font-bold block mb-1">เชื่อมโยงคู่มือ SOP / KM</label>
                  <select
                    value={wfForm.linkedSopId || ''}
                    onChange={(e) => setWfForm({ ...wfForm, linkedSopId: e.target.value })}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    <option value="">-- ไม่เชื่อมโยง SOP --</option>
                    {knowledgeDocs.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.titleTh}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateWorkflowModal(false)}
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold text-sm rounded-xl transition-all"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-sm rounded-xl transition-all shadow-lg shadow-amber-500/20"
                >
                  {editingWorkflow ? 'บันทึกการแก้ไข' : 'สร้างเวิร์กโฟลว์'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: SOP / KM VIEWER & CHECKLIST MODAL */}
      {/* ========================================================================= */}
      {selectedDocForView && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 bg-slate-950 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-emerald-500 text-black text-xs font-black">
                    {selectedDocForView.version}
                  </span>
                  <span className="text-xs text-gray-400">
                    อัปเดตล่าสุด: {new Date(selectedDocForView.updatedAt).toLocaleDateString('th-TH')}
                  </span>
                </div>
                <h3 className="text-xl font-black text-white mt-1">{selectedDocForView.titleTh}</h3>
                <div className="text-xs text-gray-400">{selectedDocForView.titleEn}</div>
              </div>

              <button
                onClick={() => setSelectedDocForView(null)}
                className="w-8 h-8 rounded-full bg-white/10 text-gray-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-gray-200">
              {/* Summary Callout */}
              <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-2xl space-y-1">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">สรุปข้อกำหนด (Summary):</div>
                <div className="text-sm text-emerald-100">{selectedDocForView.summary}</div>
              </div>

              {/* Markdown Guide Body */}
              <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-line bg-black/30 p-5 rounded-2xl border border-white/5 font-sans">
                {selectedDocForView.contentMarkdown}
              </div>

              {/* Interactive QC Checklist */}
              {selectedDocForView.checklists && selectedDocForView.checklists.length > 0 && (
                <div className="bg-slate-950 border border-white/10 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <CheckSquare size={16} className="text-emerald-400" />
                      <span>รายการตรวจรับตามมาตรฐาน (Live QC Checklist)</span>
                    </h4>
                    <span className="text-xs text-emerald-400 font-bold">
                      {Object.values(checkedSopItems).filter(Boolean).length} / {selectedDocForView.checklists.length} ข้อ
                    </span>
                  </div>

                  <div className="space-y-2">
                    {selectedDocForView.checklists.map((ch) => {
                      const isChecked = checkedSopItems[ch.id] || false;
                      return (
                        <label
                          key={ch.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-100'
                              : 'bg-black/20 border-white/5 text-gray-300 hover:border-white/20'
                          }`}
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
                            className="w-4 h-4 accent-emerald-500 rounded"
                          />
                          <span className={`text-xs ${isChecked ? 'line-through opacity-80' : 'font-medium'}`}>
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
            <div className="p-4 border-t border-white/10 bg-slate-950 flex items-center justify-between">
              <div className="text-xs text-gray-400">
                ผู้รับผิดชอบหลัก: <span className="text-white font-bold">{selectedDocForView.authorRole}</span>
              </div>
              <button
                onClick={() => setSelectedDocForView(null)}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition-all"
              >
                เสร็จสิ้น / ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADD / EDIT SOP DOCUMENT */}
      {/* ========================================================================= */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/20 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpen size={20} className="text-emerald-400" />
                <span>{editingDoc ? 'แก้ไขคู่มือ SOP / KM' : 'เพิ่มคู่มือ SOP / มาตรฐานการทำงาน'}</span>
              </h3>
              <button onClick={() => setShowDocModal(false)} className="text-gray-400 hover:text-white">✕</button>
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
              className="space-y-4"
            >
              <div>
                <label className="text-xs text-gray-300 font-bold block mb-1">รหัส & ชื่อเอกสาร (ภาษาไทย) *</label>
                <input
                  type="text"
                  required
                  value={docForm.titleTh}
                  onChange={(e) => setDocForm({ ...docForm, titleTh: e.target.value })}
                  placeholder="เช่น SOP-KIT-02: ขั้นตอนการเตรียมเครื่องเคียง"
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-300 font-bold block mb-1">หมวดหมู่ (Category)</label>
                  <select
                    value={docForm.category}
                    onChange={(e) => setDocForm({ ...docForm, category: e.target.value as KnowledgeCategory })}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-sm text-white"
                  >
                    <option value="procurement">📦 ตรวจรับ & จัดซื้อ</option>
                    <option value="kitchen_sop">🍳 สูตรอาหาร & ครัว</option>
                    <option value="cash_handling">💵 การเงิน & ปิดกะ</option>
                    <option value="operations">🧹 สุขอนามัย & ความสะอาด</option>
                    <option value="finance">📊 ภาษี & บัญชี</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-300 font-bold block mb-1">เวอร์ชัน (Version)</label>
                  <input
                    type="text"
                    value={docForm.version}
                    onChange={(e) => setDocForm({ ...docForm, version: e.target.value })}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-300 font-bold block mb-1">สรุปสาระสำคัญ (Summary)</label>
                <input
                  type="text"
                  value={docForm.summary}
                  onChange={(e) => setDocForm({ ...docForm, summary: e.target.value })}
                  placeholder="สรุปสั้นๆ ให้พนักงานเข้าใจภาพรวม"
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="text-xs text-gray-300 font-bold block mb-1">เนื้อหาคู่มือปฏิบัติงาน (Markdown Content)</label>
                <textarea
                  rows={5}
                  value={docForm.contentMarkdown}
                  onChange={(e) => setDocForm({ ...docForm, contentMarkdown: e.target.value })}
                  placeholder="### ลำดับขั้นตอน&#10;1. ตรวจสอบอุณหภูมิ&#10;2. ชั่งน้ำหนัก..."
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-sm text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDocModal(false)}
                  className="px-4 py-2 bg-white/10 text-white text-xs font-bold rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20"
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
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <QrCode size={24} />
            </div>

            <div>
              <h3 className="text-xl font-black text-white">ชำระเงิน PO ผ่าน PromptPay QR</h3>
              <div className="text-xs text-gray-400 mt-1">
                {selectedPOForPay.poNumber} • {selectedPOForPay.supplierName}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl inline-block shadow-inner">
              {/* QR Mockup Canvas */}
              <div className="w-44 h-44 bg-slate-950 flex flex-col items-center justify-center text-white text-center p-2 rounded-xl">
                <QrCode size={96} className="text-emerald-400 animate-pulse" />
                <div className="text-[10px] text-gray-400 mt-1 font-mono">PROMPTPAY TH</div>
                <div className="text-xs font-bold text-white">฿{selectedPOForPay.grandTotal.toLocaleString()}</div>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-white/5 text-xs text-gray-300 space-y-1 text-left">
              <div className="flex justify-between">
                <span className="text-gray-400">ผู้รับเงิน:</span>
                <span className="font-bold text-white">{selectedPOForPay.supplierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">ยอดที่ต้องชำระ:</span>
                <span className="font-black text-emerald-400">฿{selectedPOForPay.grandTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">สถานะ OCR:</span>
                <span className="text-emerald-400 font-bold">✓ Whitelist Verified</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedPOForPay(null)}
                className="flex-1 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  approveAndPayPO(selectedPOForPay.id);
                  setSelectedPOForPay(null);
                }}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20"
              >
                ยืนยันการโอนเงิน (Pay Now)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: NEW PO CREATION MODAL */}
      {/* ========================================================================= */}
      {showNewPOModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/20 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText size={18} className="text-amber-400" />
                <span>สร้างใบสั่งซื้อใหม่ (Create Purchase Order)</span>
              </h3>
              <button onClick={() => setShowNewPOModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-300 font-bold block mb-1">เลือกซัพพลายเออร์ *</label>
                <select
                  value={newPoSupplierId}
                  onChange={(e) => setNewPoSupplierId(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-sm text-white"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-300 font-bold block mb-1">เลือกวัตถุดิบ *</label>
                <select
                  value={newPoItemId}
                  onChange={(e) => {
                    setNewPoItemId(e.target.value);
                    const item = inventory.find((i) => i.id === e.target.value);
                    if (item) setNewPoUnitPrice(item.avgCost);
                  }}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-sm text-white"
                >
                  {inventory.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.nameTh} ({inv.currentStock} {inv.unit} คงเหลือ)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-300 font-bold block mb-1">จำนวนที่สั่ง</label>
                  <input
                    type="number"
                    min={1}
                    value={newPoQty}
                    onChange={(e) => setNewPoQty(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-300 font-bold block mb-1">ราคาต่อหน่วย (฿)</label>
                  <input
                    type="number"
                    value={newPoUnitPrice}
                    onChange={(e) => setNewPoUnitPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div className="bg-black/30 p-3 rounded-xl flex items-center justify-between text-sm">
                <span className="text-gray-400">ยอดรวมโดยประมาณ:</span>
                <span className="font-black text-emerald-400 text-lg">฿{(newPoQty * newPoUnitPrice).toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewPOModal(false)}
                  className="px-4 py-2 bg-white/10 text-white text-xs font-bold rounded-xl"
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
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/20 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock size={18} className="text-blue-400" />
                <span>{editingSchedule ? 'แก้ไขตารางเวลา RBAC' : 'เพิ่มตารางเวลาทำงานใหม่'}</span>
              </h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-gray-400 hover:text-white">✕</button>
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
              className="space-y-4"
            >
              <div>
                <label className="text-xs text-gray-300 font-bold block mb-1">ชื่องาน / วัตถุประสงค์ *</label>
                <input
                  type="text"
                  required
                  value={schForm.title}
                  onChange={(e) => setSchForm({ ...schForm, title: e.target.value })}
                  placeholder="เช่น สรุปเงินสดปิดกะ & ตรวจผลต่าง"
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-300 font-bold block mb-1">เวลาทำงาน (HH:mm) *</label>
                  <input
                    type="time"
                    required
                    value={schForm.timeOfDay}
                    onChange={(e) => setSchForm({ ...schForm, timeOfDay: e.target.value })}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-300 font-bold block mb-1">Cron Expression</label>
                  <input
                    type="text"
                    value={schForm.cronExpression}
                    onChange={(e) => setSchForm({ ...schForm, cronExpression: e.target.value })}
                    placeholder="e.g. 0 8 * * *"
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-300 font-bold block mb-1">Action ที่ต้องทำเมื่อถึงเวลา</label>
                <input
                  type="text"
                  value={schForm.targetAction}
                  onChange={(e) => setSchForm({ ...schForm, targetAction: e.target.value })}
                  placeholder="เช่น พิมพ์ Z-Report และส่ง Alert LINE"
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="text-xs text-gray-300 font-bold block mb-1">ผู้อนุมัติ (Approver Role)</label>
                <select
                  value={schForm.approverRole}
                  onChange={(e) => setSchForm({ ...schForm, approverRole: e.target.value as StaffRole })}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-sm text-white"
                >
                  <option value="owner">👑 Owner</option>
                  <option value="manager">👔 Manager</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 bg-white/10 text-white text-xs font-bold rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/20 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 size={18} className="text-emerald-400" />
                <span>{editingSupplier ? 'แก้ไขซัพพลายเออร์' : 'เพิ่มซัพพลายเออร์ใหม่'}</span>
              </h3>
              <button onClick={() => setShowSupplierModal(false)} className="text-gray-400 hover:text-white">✕</button>
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
              className="space-y-4"
            >
              <div>
                <label className="text-xs text-gray-300 font-bold block mb-1">ชื่อร้านค้า / ซัพพลายเออร์ *</label>
                <input
                  type="text"
                  required
                  value={supForm.name}
                  onChange={(e) => setSupForm({ ...supForm, name: e.target.value })}
                  placeholder="เช่น ร้านเนื้อสด นายก้อง"
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-300 font-bold block mb-1">ผู้ติดต่อ</label>
                  <input
                    type="text"
                    value={supForm.contactPerson}
                    onChange={(e) => setSupForm({ ...supForm, contactPerson: e.target.value })}
                    placeholder="เช่น คุณก้องเกียรติ"
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-300 font-bold block mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    value={supForm.phone}
                    onChange={(e) => setSupForm({ ...supForm, phone: e.target.value })}
                    placeholder="081-222-3333"
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-300 font-bold block mb-1">PromptPay ID</label>
                  <input
                    type="text"
                    value={supForm.promptPayId}
                    onChange={(e) => setSupForm({ ...supForm, promptPayId: e.target.value })}
                    placeholder="0812223333"
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-300 font-bold block mb-1">ชื่อบัญชีรับเงิน</label>
                  <input
                    type="text"
                    value={supForm.accountName}
                    onChange={(e) => setSupForm({ ...supForm, accountName: e.target.value })}
                    placeholder="นายก้องเกียรติ มั่งมี"
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-300 font-bold block mb-1">ชื่อกลุ่ม LINE หรือ LINE ID</label>
                <input
                  type="text"
                  value={supForm.lineGroup || supForm.lineId || ''}
                  onChange={(e) => setSupForm({ ...supForm, lineGroup: e.target.value, lineId: e.target.value })}
                  placeholder="เช่น [LINE กลุ่ม] สั่งเนื้อสด นายก้อง"
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="px-4 py-2 bg-white/10 text-white text-xs font-bold rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/20 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Package size={18} className="text-emerald-400" />
                <span>{editingInventory ? 'แก้ไขรายการสต็อกวัตถุดิบ' : 'เพิ่มวัตถุดิบใหม่'}</span>
              </h3>
              <button onClick={() => setShowInventoryModal(false)} className="text-gray-400 hover:text-white">✕</button>
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
              className="space-y-4"
            >
              <div>
                <label className="text-xs text-gray-300 font-bold block mb-1">ชื่อวัตถุดิบ (ภาษาไทย) *</label>
                <input
                  type="text"
                  required
                  value={invForm.nameTh}
                  onChange={(e) => setInvForm({ ...invForm, nameTh: e.target.value })}
                  placeholder="เช่น เนื้อน่องลายพิเศษ"
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-300 font-bold block mb-1">สต็อกคงเหลือปัจจุบัน</label>
                  <input
                    type="number"
                    value={invForm.currentStock}
                    onChange={(e) => setInvForm({ ...invForm, currentStock: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-300 font-bold block mb-1">เกณฑ์เตือนสต็อกต่ำ (Min Safety)</label>
                  <input
                    type="number"
                    value={invForm.minSafetyThreshold}
                    onChange={(e) => setInvForm({ ...invForm, minSafetyThreshold: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-300 font-bold block mb-1">หน่วยนับ</label>
                  <input
                    type="text"
                    value={invForm.unit}
                    onChange={(e) => setInvForm({ ...invForm, unit: e.target.value })}
                    placeholder="kg / ถุง / ลัง"
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-300 font-bold block mb-1">ราคาต้นทุนเฉลี่ย (฿)</label>
                  <input
                    type="number"
                    value={invForm.avgCost}
                    onChange={(e) => setInvForm({ ...invForm, avgCost: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-300 font-bold block mb-1">ซัพพลายเออร์คู่ค้า</label>
                <select
                  value={invForm.supplierId}
                  onChange={(e) => setInvForm({ ...invForm, supplierId: e.target.value })}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-sm text-white"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowInventoryModal(false)}
                  className="px-4 py-2 bg-white/10 text-white text-xs font-bold rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  บันทึกวัตถุดิบ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
