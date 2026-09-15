import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type {
  Table,
  TableStatus,
  MenuItem,
  MenuCategory,
  ModifierGroup,
  Order,
  OrderItem,
  PaymentRecord,
  RestaurantSettings,
  Shift,
  CashTransaction,
  StaffUser,
  SelectedModifier,
  AdminSubTab,
  Supplier,
  InventoryItem,
  POItem,
  PurchaseOrder,
  LineAgentConfig,
  LineMessageLog,
  ApiKey,
  WebhookEndpoint,
  AccountingIntegrationConfig,
  QueuedCustomerOrder,
  AutomationWorkflow,
  WorkflowSchedule,
  KnowledgeDocument,
  MenuItemRecipe,
  FoundationConfig,
  RawMaterialCostItem,
  PriceHistoryRecord,
  SupplierPriceQuote,
  YieldTestRecord,
} from '../types/pos';
import {
  initialCategories,
  initialMenuItems,
  initialModifierGroups,
  initialSettings,
  initialStaff,
  initialTables,
  initialActiveShift,
  initialCompletedOrders,
  initialSuppliers,
  initialInventory,
  initialPurchaseOrders,
  initialLineAgentConfig,
  initialLineLogs,
  initialApiKeys,
  initialWebhooks,
  initialAccountingConfig,
  initialWorkflows,
  initialWorkflowSchedules,
  initialKnowledgeDocs,
  initialFoundationConfig,
  initialMenuRecipes,
  initialRawMaterialCosts,
} from '../data/initialData';

interface POSContextType {
  language: 'th' | 'en';
  setLanguage: (lang: 'th' | 'en') => void;
  isOnline: boolean;
  settings: RestaurantSettings;
  updateSettings: (newSettings: Partial<RestaurantSettings>) => void;

  // Staff & Auth
  currentStaff: StaffUser | null;
  staffUsers: StaffUser[];
  loginWithPin: (pin: string) => boolean;
  logoutStaff: () => void;
  addStaffUser: (staff: Omit<StaffUser, 'id'>) => void;
  updateStaffUser: (staff: StaffUser) => void;
  deleteStaffUser: (staffId: string) => void;

  // Tables & Customizable Layout
  tables: Table[];
  activeTableId: string | null;
  setActiveTableId: (id: string | null) => void;
  updateTableStatus: (tableId: string, status: TableStatus) => void;
  setTableGuestCount: (tableId: string, count: number) => void;
  updateTablePosition: (tableId: string, x: number, y: number) => void;
  addTable: (table: Omit<Table, 'id'>) => void;
  updateTable: (table: Table) => void;
  deleteTable: (tableId: string) => void;
  resetTableLayout: () => void;
  saveTableLayout: (newTables: Table[]) => void;

  // Menu & Modifiers
  categories: MenuCategory[];
  menuItems: MenuItem[];
  modifierGroups: ModifierGroup[];
  toggleItemStock: (itemId: string) => void;
  updateMenuItem: (item: MenuItem) => void;
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;

  // Orders
  orders: Record<string, Order>;
  completedOrders: Order[];
  activeOrder: Order | null;
  addItemToOrder: (
    item: MenuItem,
    modifiers: SelectedModifier[],
    instructions?: string,
    quantity?: number,
    targetTableId?: string
  ) => void;
  quickAddItemToOrder: (item: MenuItem) => void;
  updateOrderItemQuantity: (orderItemId: string, delta: number) => void;
  removeOrderItem: (orderItemId: string) => void;
  clearOrder: () => void;
  sendOrderToKitchen: () => void;
  processPayment: (payment: Omit<PaymentRecord, 'id' | 'paidAt' | 'staffName'>) => Promise<PaymentRecord>;
  voidOrder: (reason: string) => void;
  voidCompletedOrder: (orderId: string, reason: string) => void;
  markOrderItemReady: (orderId: string, orderItemId: string) => void;
  markOrderAllReady: (orderId: string) => void;

  // Cash Drawer & Shift
  currentShift: Shift;
  shiftHistory: Shift[];
  cashTransactions: CashTransaction[];
  addCashTransaction: (type: 'pay_in' | 'pay_out', amount: number, reason: string) => void;
  closeShift: (actualCash: number, notes?: string) => void;
  reopenShift: (openingFloat: number) => void;

  // Modals & Navigation
  activeModal: string | null;
  setActiveModal: (modal: string | null) => void;
  selectedItemForModifier: MenuItem | null;
  setSelectedItemForModifier: (item: MenuItem | null) => void;
  lastCompletedPayment: PaymentRecord | null;
  setLastCompletedPayment: (payment: PaymentRecord | null) => void;
  activeTab: 'pos' | 'tables' | 'orders' | 'admin' | 'kds';
  setActiveTab: (tab: 'pos' | 'tables' | 'orders' | 'admin' | 'kds') => void;
  adminSubTab: AdminSubTab;
  setAdminSubTab: (tab: AdminSubTab) => void;

  // Procurement & LINE Agent
  suppliers: Supplier[];
  inventory: InventoryItem[];
  purchaseOrders: PurchaseOrder[];
  lineAgentConfig: LineAgentConfig;
  lineLogs: LineMessageLog[];
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  updateSupplier: (supplier: Supplier) => void;
  deleteSupplier: (supplierId: string) => void;
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItem: (item: InventoryItem) => void;
  deleteInventoryItem: (itemId: string) => void;
  createPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'poNumber' | 'createdAt' | 'createdBy' | 'status' | 'paymentStatus' | 'stockIngested'>) => PurchaseOrder;
  sendPOToLineGroup: (poId: string) => void;
  simulateSupplierLineReply: (poId: string, simulatedTotal?: number, isDiscrepancy?: boolean) => void;
  approveAndPayPO: (poId: string) => void;
  updateLineAgentConfig: (newConfig: Partial<LineAgentConfig>) => void;
  triggerAutoPOForLowStock: (itemId: string) => void;
  deductInventoryFromOrder: (order: Order) => void;
  simulateSaleAndDeductStock: (saleItems: { menuItemId: string; quantity: number }[]) => {
    totalSales: number;
    totalCogs: number;
    deductedIngredients: { nameTh: string; amount: number; unit: string; currentStock: number }[];
  };
  createBulkPOForSupplier: (
    supplierId: string,
    items: { inventoryItemId: string; qtyOrdered: number; unitPrice?: number }[],
    autoSendLine?: boolean
  ) => PurchaseOrder;
  triggerAllSupplierReorders: () => PurchaseOrder[];

  // API Keys & Accounting Program Connectors
  apiKeys: ApiKey[];
  webhooks: WebhookEndpoint[];
  accountingConfig: AccountingIntegrationConfig;
  generateApiKey: (name: string, permissions: ApiKey['permissions'], environment?: 'live' | 'test') => ApiKey;
  revokeApiKey: (keyId: string) => void;
  addWebhookEndpoint: (webhook: Omit<WebhookEndpoint, 'id'>) => void;
  deleteWebhookEndpoint: (webhookId: string) => void;
  updateAccountingConfig: (newCfg: Partial<AccountingIntegrationConfig>) => void;
  triggerTestWebhook: (webhookId: string) => void;

  // Customer Order Queue & Background Worker
  orderQueue: QueuedCustomerOrder[];
  workerStatus: 'idle' | 'processing' | 'active';
  queueCustomerOrder: (orderData: Omit<QueuedCustomerOrder, 'id' | 'submittedAt' | 'status'>) => Promise<string>;
  clearCompletedQueue: () => void;
  lastWorkerNotification: { id: string; tableName: string; itemCount: number; time: string } | null;
  dismissWorkerNotification: () => void;

  // Automation Workflows, RBAC Scheduling & KM
  workflows: AutomationWorkflow[];
  workflowSchedules: WorkflowSchedule[];
  knowledgeDocs: KnowledgeDocument[];
  toggleWorkflow: (id: string) => void;
  addWorkflow: (wf: Omit<AutomationWorkflow, 'id' | 'executionCount'>) => void;
  updateWorkflow: (wf: AutomationWorkflow) => void;
  deleteWorkflow: (id: string) => void;
  runWorkflowNow: (id: string) => void;
  toggleSchedule: (id: string) => void;
  addSchedule: (sch: Omit<WorkflowSchedule, 'id'>) => void;
  updateSchedule: (sch: WorkflowSchedule) => void;
  deleteSchedule: (id: string) => void;
  addKnowledgeDoc: (doc: Omit<KnowledgeDocument, 'id' | 'updatedAt'>) => void;
  updateKnowledgeDoc: (doc: KnowledgeDocument) => void;
  deleteKnowledgeDoc: (id: string) => void;

  // Foundation Setup & CoGS Configuration
  foundationConfig: FoundationConfig;
  menuRecipes: Record<string, MenuItemRecipe>;
  updateFoundationConfig: (newCfg: Partial<FoundationConfig>) => void;
  updateMenuItemRecipe: (recipe: MenuItemRecipe) => void;
  deleteMenuItemRecipe: (menuItemId: string) => void;

  // Raw Material Cost & Market Price Tracking
  rawMaterials: RawMaterialCostItem[];
  updateRawMaterialCost: (id: string, updates: Partial<RawMaterialCostItem>, syncToBOM?: boolean) => void;
  addRawMaterialPriceRecord: (rawMaterialId: string, record: Omit<PriceHistoryRecord, 'id'>) => void;
  addSupplierQuote: (rawMaterialId: string, quote: SupplierPriceQuote) => void;
  setPrimarySupplierQuote: (rawMaterialId: string, supplierId: string) => void;
  addYieldTestRecord: (rawMaterialId: string, test: Omit<YieldTestRecord, 'id'>) => void;
  resetRawMaterialsToDefault: () => void;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

const STORAGE_PREFIX = 'alberta_pos_';

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial or persisted state
  const [language, setLanguage] = useState<'th' | 'en'>(() => {
    return (localStorage.getItem(`${STORAGE_PREFIX}lang`) as 'th' | 'en') || 'th';
  });

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [settings, setSettings] = useState<RestaurantSettings>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}settings`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...initialSettings,
          ...parsed,
          paymentChannels: {
            ...initialSettings.paymentChannels,
            ...(parsed.paymentChannels || {}),
            cash: {
              ...(initialSettings.paymentChannels?.cash || { enabled: true }),
              ...(parsed.paymentChannels?.cash || {}),
            },
            scan: {
              ...(initialSettings.paymentChannels?.scan || { enabled: true, accountName: '', accountNumber: '', bankName: 'PromptPay', qrType: 'generated' }),
              ...(parsed.paymentChannels?.scan || {}),
            },
            card: {
              ...(initialSettings.paymentChannels?.card || { enabled: true, gatewayType: 'edc_terminal' }),
              ...(parsed.paymentChannels?.card || {}),
            },
          },
          printLayouts: {
            ...initialSettings.printLayouts!,
            ...(parsed.printLayouts || {}),
            qrSlip: {
              ...(initialSettings.printLayouts?.qrSlip!),
              ...(parsed.printLayouts?.qrSlip || {}),
            },
            customerReceipt: {
              ...(initialSettings.printLayouts?.customerReceipt!),
              ...(parsed.printLayouts?.customerReceipt || {}),
            },
            kitchenTicket: {
              ...(initialSettings.printLayouts?.kitchenTicket!),
              ...(parsed.printLayouts?.kitchenTicket || {}),
            },
            shiftSummary: {
              ...(initialSettings.printLayouts?.shiftSummary!),
              ...(parsed.printLayouts?.shiftSummary || {}),
            },
          },
        };
      } catch (e) {
        console.error('Error parsing settings from localStorage', e);
      }
    }
    return initialSettings;
  });

  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(initialStaff);
  const [currentStaff, setCurrentStaff] = useState<StaffUser | null>(() => {
    // Default logged in as admin for demo ease
    return initialStaff[0];
  });

  const [tables, setTables] = useState<Table[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}tables`);
    return saved ? JSON.parse(saved) : initialTables;
  });

  const [activeTableId, setActiveTableId] = useState<string | null>('t-2');

  const [categories] = useState<MenuCategory[]>(initialCategories);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [modifierGroups] = useState<ModifierGroup[]>(initialModifierGroups);


  // Pre-seed an active order for demonstration
  const [orders, setOrders] = useState<Record<string, Order>>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}orders`);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge seed completed orders (don't overwrite if already saved)
      const seedOrders: Record<string, Order> = {};
      for (const order of initialCompletedOrders) {
        if (!parsed[order.id]) {
          seedOrders[order.id] = order;
        }
      }
      return { ...seedOrders, ...parsed };
    }

    // Initial demo order for Table A2
    const demoOrderId = 'ord-1001';
    const demoItems: OrderItem[] = [
      {
        id: 'oi-1',
        menuItemId: 'item-1',
        nameTh: 'ข้าวกะเพรากระทะเหล็กสูตรโบราณ',
        nameEn: 'Signature Wok-Fried Basil on Rice',
        basePrice: 75,
        quantity: 2,
        modifiers: [
          {
            groupId: 'mg-meat',
            groupNameTh: 'เลือกเนื้อสัตว์',
            groupNameEn: 'Meat',
            optionId: 'm-crispypork',
            optionNameTh: 'หมูกรอบสูตรเด็ด (+30)',
            optionNameEn: 'Crispy Pork',
            priceDelta: 30,
          },
          {
            groupId: 'mg-spice',
            groupNameTh: 'ระดับความเผ็ด',
            groupNameEn: 'Spice',
            optionId: 'sp-3',
            optionNameTh: 'เผ็ดมาก (5 เม็ด)',
            optionNameEn: 'Spicy',
            priceDelta: 0,
          },
          {
            groupId: 'mg-egg',
            groupNameTh: 'ท็อปปิ้งไข่',
            groupNameEn: 'Egg',
            optionId: 'egg-crispy',
            optionNameTh: 'ไข่ดาวขอบกรอบ (+15)',
            optionNameEn: 'Crispy Fried Egg',
            priceDelta: 15,
          },
        ],
        specialInstructions: 'ขอพริกน้ำปลาเยอะๆ',
        itemTotal: (75 + 30 + 15) * 2, // 240
        status: 'sent_to_kitchen',
        sentAt: '2026-09-10T10:18:00.000Z',
      },
      {
        id: 'oi-2',
        menuItemId: 'item-4',
        nameTh: 'ต้มยำกุ้งแม่น้ำเห็ดฟางหม้อไฟ',
        nameEn: 'River Prawn Tom Yum Hotpot',
        basePrice: 220,
        quantity: 1,
        modifiers: [
          {
            groupId: 'mg-soup-type',
            groupNameTh: 'เลือกน้ำซุป',
            groupNameEn: 'Soup',
            optionId: 'soup-creamy',
            optionNameTh: 'ต้มยำน้ำข้นนมสด (+10)',
            optionNameEn: 'Creamy Tom Yum',
            priceDelta: 10,
          },
          {
            groupId: 'mg-spice',
            groupNameTh: 'ระดับความเผ็ด',
            groupNameEn: 'Spice',
            optionId: 'sp-2',
            optionNameTh: 'เผ็ดกลาง (3 เม็ด)',
            optionNameEn: 'Medium',
            priceDelta: 0,
          },
        ],
        itemTotal: 230,
        status: 'sent_to_kitchen',
        sentAt: '2026-09-10T10:18:00.000Z',
      },
      {
        id: 'oi-3',
        menuItemId: 'item-10',
        nameTh: 'ชาไทยเย็นปักษ์ใต้แท้ (ชาชัก)',
        nameEn: 'Authentic Southern Thai Iced Tea',
        basePrice: 45,
        quantity: 2,
        modifiers: [
          {
            groupId: 'mg-sweetness',
            groupNameTh: 'ระดับความหวาน',
            groupNameEn: 'Sweetness',
            optionId: 'sw-25',
            optionNameTh: 'หวานน้อย (25%)',
            optionNameEn: 'Less Sweet',
            priceDelta: 0,
          },
        ],
        itemTotal: 90,
        status: 'served',
      },
    ];

    const subtotal = 240 + 230 + 90; // 560
    const vat = Math.round(subtotal * 0.07 * 100) / 100;

    // Build seed completed orders map
    const seedOrders: Record<string, Order> = {};
    for (const order of initialCompletedOrders) {
      seedOrders[order.id] = order;
    }

    return {
      ...seedOrders,
      [demoOrderId]: {
        id: demoOrderId,
        orderNumber: '#1001',
        tableId: 't-2',
        tableName: 'A2',
        guestCount: 3,
        items: demoItems,
        status: 'active',
        createdAt: '2026-09-10T10:15:00.000Z',
        updatedAt: '2026-09-10T10:18:00.000Z',
        staffId: 'staff-3',
        staffName: 'น้องนก (พนักงานแคชเชียร์)',
        subtotal: subtotal,
        serviceChargeRate: 0,
        serviceChargeAmount: 0,
        vatRate: 0.07,
        vatAmount: vat,
        isVatInclusive: true,
        grandTotal: subtotal,
      },
    };
  });

  const [currentShift, setCurrentShift] = useState<Shift>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}shift`);
    return saved ? JSON.parse(saved) : initialActiveShift;
  });

  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}cash_tx`);
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'tx-1',
        shiftId: initialActiveShift.id,
        type: 'pay_out',
        amount: 150,
        reason: 'ซื้อน้ำแข็งหลอด + ผักชีตลาดสดยามเช้า',
        timestamp: new Date().toISOString(),
        staffName: 'คุณสมชาย (เจ้าของร้าน)',
      },
    ];
  });

  const [shiftHistory, setShiftHistory] = useState<Shift[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}shift_history`);
    return saved ? JSON.parse(saved) : [];
  });

  // UI Navigation states
  const [activeTab, setActiveTab] = useState<'pos' | 'tables' | 'orders' | 'admin' | 'kds'>('pos');
  const [adminSubTab, setAdminSubTab] = useState<AdminSubTab>('dashboard');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedItemForModifier, setSelectedItemForModifier] = useState<MenuItem | null>(null);
  const [lastCompletedPayment, setLastCompletedPayment] = useState<PaymentRecord | null>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}lang`, language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}settings`, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}menu_items`, JSON.stringify(menuItems));
  }, [menuItems]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}orders`, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}shift`, JSON.stringify(currentShift));
  }, [currentShift]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}cash_tx`, JSON.stringify(cashTransactions));
  }, [cashTransactions]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}shift_history`, JSON.stringify(shiftHistory));
  }, [shiftHistory]);

  // Auth
  const loginWithPin = (pin: string): boolean => {
    const found = staffUsers.find((s) => s.pin === pin);
    if (found) {
      setCurrentStaff(found);
      return true;
    }
    return false;
  };

  const logoutStaff = () => {
    setCurrentStaff(null);
    setActiveModal('pin');
  };

  // Staff CRUD
  const addStaffUser = (staffData: Omit<StaffUser, 'id'>) => {
    const newStaff: StaffUser = {
      ...staffData,
      id: `staff-${Date.now()}`,
    };
    setStaffUsers((prev) => [...prev, newStaff]);
  };

  const updateStaffUser = (updated: StaffUser) => {
    setStaffUsers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const deleteStaffUser = (staffId: string) => {
    setStaffUsers((prev) => prev.filter((s) => s.id !== staffId));
  };

  const updateSettings = (newSettings: Partial<RestaurantSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem(`${STORAGE_PREFIX}settings`, JSON.stringify(updated));

      // Recalculate active orders with updated SC and VAT settings
      setOrders((prevOrders) => {
        let hasChanges = false;
        const nextOrders: Record<string, Order> = {};

        for (const [id, order] of Object.entries(prevOrders)) {
          if (order.status === 'active') {
            const subtotal = order.items
              .filter((i) => i.status !== 'voided')
              .reduce((sum, item) => sum + item.itemTotal, 0);

            const scRate = updated.enableServiceCharge ? updated.serviceChargeRate : 0;
            const scAmount = updated.enableServiceCharge ? Math.round(subtotal * scRate * 100) / 100 : 0;

            let vatAmount = 0;
            let grandTotal = 0;

            if (!updated.enableVat) {
              vatAmount = 0;
              grandTotal = subtotal + scAmount;
            } else if (updated.isVatInclusive) {
              vatAmount = Math.round(((subtotal + scAmount) * 7) / 107 * 100) / 100;
              grandTotal = subtotal + scAmount;
            } else {
              vatAmount = Math.round((subtotal + scAmount) * updated.vatRate * 100) / 100;
              grandTotal = subtotal + scAmount + vatAmount;
            }

            nextOrders[id] = {
              ...order,
              subtotal,
              serviceChargeRate: scRate,
              serviceChargeAmount: scAmount,
              vatRate: updated.enableVat ? updated.vatRate : 0,
              vatAmount,
              isVatInclusive: updated.isVatInclusive,
              grandTotal,
              updatedAt: new Date().toISOString(),
            };
            hasChanges = true;
          } else {
            nextOrders[id] = order;
          }
        }

        return hasChanges ? nextOrders : prevOrders;
      });

      return updated;
    });
  };

  // Tables
  const updateTableStatus = (tableId: string, status: TableStatus) => {
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, status } : t))
    );
  };

  const setTableGuestCount = (tableId: string, count: number) => {
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, guestCount: count } : t))
    );
  };

  const updateTablePosition = (tableId: string, x: number, y: number) => {
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, x, y } : t))
    );
  };

  const addTable = (tableData: Omit<Table, 'id'>) => {
    const newId = `t-${Date.now().toString().slice(-4)}`;
    const newTable: Table = {
      ...tableData,
      id: newId,
    };
    setTables((prev) => [...prev, newTable]);
  };

  const updateTable = (updatedTable: Table) => {
    setTables((prev) =>
      prev.map((t) => (t.id === updatedTable.id ? updatedTable : t))
    );
  };

  const deleteTable = (tableId: string) => {
    setTables((prev) => {
      const updated = prev.filter((t) => t.id !== tableId);
      localStorage.setItem(`${STORAGE_PREFIX}tables`, JSON.stringify(updated));
      return updated;
    });
    if (activeTableId === tableId) {
      setActiveTableId(null);
    }
  };

  const resetTableLayout = () => {
    setTables(initialTables);
    localStorage.setItem(`${STORAGE_PREFIX}tables`, JSON.stringify(initialTables));
  };

  const saveTableLayout = (newTables: Table[]) => {
    setTables(newTables);
    localStorage.setItem(`${STORAGE_PREFIX}tables`, JSON.stringify(newTables));
  };

  // Active Order lookup
  const activeTable = tables.find((t) => t.id === activeTableId);
  const activeOrder = activeTableId
    ? Object.values(orders).find(
        (o) => o.tableId === activeTableId && o.status === 'active'
      ) || null
    : null;

  // Completed orders for Bill Logs
  const completedOrders = Object.values(orders).filter(
    (o) => o.status === 'completed' || o.status === 'voided'
  );

  // Calculate totals helper
  const calculateOrderTotals = useCallback(
    (
      items: OrderItem[],
      enableSC = settings.enableServiceCharge,
      enableVat = settings.enableVat,
      isInclusive = settings.isVatInclusive
    ) => {
      const subtotal = items
        .filter((i) => i.status !== 'voided')
        .reduce((sum, item) => sum + item.itemTotal, 0);

      const scRate = enableSC ? settings.serviceChargeRate : 0;
      const scAmount = enableSC ? Math.round(subtotal * scRate * 100) / 100 : 0;

      let vatAmount = 0;
      let grandTotal = 0;

      const vatPct = (settings.vatRate || 0.07) * 100;

      if (!enableVat) {
        vatAmount = 0;
        grandTotal = subtotal + scAmount;
      } else if (isInclusive) {
        // VAT is already included in subtotal
        vatAmount = Math.round(((subtotal + scAmount) * vatPct) / (100 + vatPct) * 100) / 100;
        grandTotal = subtotal + scAmount;
      } else {
        // VAT is added on top
        vatAmount = Math.round((subtotal + scAmount) * (settings.vatRate || 0.07) * 100) / 100;
        grandTotal = subtotal + scAmount + vatAmount;
      }

      return { subtotal, scAmount, scRate, vatAmount, grandTotal };
    },
    [settings.enableServiceCharge, settings.enableVat, settings.isVatInclusive, settings.serviceChargeRate, settings.vatRate]
  );

  // Order Operations
  const addItemToOrder = (
    menuItem: MenuItem,
    modifiers: SelectedModifier[],
    instructions?: string,
    quantity = 1,
    targetTableId?: string
  ) => {
    const effectiveTableId = targetTableId || activeTableId;
    const effectiveTable = tables.find((t) => t.id === effectiveTableId);
    if (!effectiveTableId || !effectiveTable) return;

    const modifierDelta = modifiers.reduce((acc, m) => acc + m.priceDelta, 0);
    const itemTotal = (menuItem.price + modifierDelta) * quantity;

    const newOrderItem: OrderItem = {
      id: `oi-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      menuItemId: menuItem.id,
      nameTh: menuItem.nameTh,
      nameEn: menuItem.nameEn,
      imageUrl: menuItem.imageUrl,
      basePrice: menuItem.price,
      quantity,
      modifiers,
      specialInstructions: instructions,
      itemTotal,
      status: 'pending',
    };

    setOrders((prevOrders) => {
      const targetOrder = Object.values(prevOrders).find(
        (o) => o.tableId === effectiveTableId && o.status === 'active'
      ) || null;

      if (!targetOrder) {
        // Create new order
        const orderId = `ord-${Date.now().toString().slice(-4)}`;
        const newItems = [newOrderItem];
        const { subtotal, scAmount, scRate, vatAmount, grandTotal } =
          calculateOrderTotals(newItems, settings.enableServiceCharge, settings.enableVat, settings.isVatInclusive);

        const createdOrder: Order = {
          id: orderId,
          orderNumber: `#${orderId.slice(-4)}`,
          tableId: effectiveTable.id,
          tableName: effectiveTable.number,
          guestCount: effectiveTable.guestCount || 2,
          items: newItems,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          staffId: currentStaff?.id || 'staff-1',
          staffName: currentStaff?.name || 'Staff',
          subtotal,
          serviceChargeRate: scRate,
          serviceChargeAmount: scAmount,
          vatRate: settings.vatRate,
          vatAmount,
          isVatInclusive: settings.isVatInclusive,
          grandTotal,
        };

        return { ...prevOrders, [orderId]: createdOrder };
      } else {
        // Check if an identical pending item exists, increment if so
        const modIds = modifiers.map((m) => m.optionId).sort().join(',');
        const existingIdx = targetOrder.items.findIndex(
          (i) =>
            i.menuItemId === menuItem.id &&
            i.status === 'pending' &&
            (i.specialInstructions || '') === (instructions || '') &&
            i.modifiers.map((m) => m.optionId).sort().join(',') === modIds
        );

        let updatedItems: OrderItem[];
        if (existingIdx >= 0) {
          updatedItems = targetOrder.items.map((item, idx) => {
            if (idx === existingIdx) {
              const newQty = item.quantity + quantity;
              return {
                ...item,
                quantity: newQty,
                itemTotal: (menuItem.price + modifierDelta) * newQty,
              };
            }
            return item;
          });
        } else {
          updatedItems = [...targetOrder.items, newOrderItem];
        }

        const { subtotal, scAmount, scRate, vatAmount, grandTotal } =
          calculateOrderTotals(updatedItems, settings.enableServiceCharge, settings.enableVat, settings.isVatInclusive);

        return {
          ...prevOrders,
          [targetOrder.id]: {
            ...targetOrder,
            items: updatedItems,
            subtotal,
            serviceChargeRate: scRate,
            serviceChargeAmount: scAmount,
            vatAmount,
            grandTotal,
            updatedAt: new Date().toISOString(),
          },
        };
      }
    });

    updateTableStatus(effectiveTable.id, 'occupied');
    setTables((prev) =>
      prev.map((t) =>
        t.id === effectiveTable.id ? { ...t, seatedAt: t.seatedAt || new Date().toISOString() } : t
      )
    );
  };

  // Quick 1-Click add to order with smart defaults
  const quickAddItemToOrder = (menuItem: MenuItem) => {
    if (!activeTableId || !activeTable) return;

    // Auto-select standard default options for single-type modifiers
    const defaultModifiers: SelectedModifier[] = [];
    const itemGroups = modifierGroups.filter((g) => menuItem.modifierGroupIds.includes(g.id));

    itemGroups.forEach((group) => {
      if (group.type === 'single') {
        const defaultOption = group.options.find((o) => o.isDefault) || group.options[0];
        if (defaultOption) {
          defaultModifiers.push({
            groupId: group.id,
            groupNameTh: group.nameTh,
            groupNameEn: group.nameEn,
            optionId: defaultOption.id,
            optionNameTh: defaultOption.nameTh,
            optionNameEn: defaultOption.nameEn,
            priceDelta: defaultOption.priceDelta,
          });
        }
      }
    });

    addItemToOrder(menuItem, defaultModifiers);
  };

  const updateOrderItemQuantity = (orderItemId: string, delta: number) => {
    if (!activeOrder) return;

    const updatedItems = activeOrder.items
      .map((item) => {
        if (item.id === orderItemId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          const modifierDelta = item.modifiers.reduce((acc, m) => acc + m.priceDelta, 0);
          return {
            ...item,
            quantity: newQty,
            itemTotal: (item.basePrice + modifierDelta) * newQty,
          };
        }
        return item;
      })
      .filter(Boolean) as OrderItem[];

    const { subtotal, scAmount, scRate, vatAmount, grandTotal } =
      calculateOrderTotals(updatedItems, settings.enableServiceCharge, settings.enableVat, settings.isVatInclusive);

    setOrders((prev) => ({
      ...prev,
      [activeOrder.id]: {
        ...activeOrder,
        items: updatedItems,
        subtotal,
        serviceChargeRate: scRate,
        serviceChargeAmount: scAmount,
        vatAmount,
        grandTotal,
        updatedAt: new Date().toISOString(),
      },
    }));
  };

  const removeOrderItem = (orderItemId: string) => {
    if (!activeOrder) return;
    const updatedItems = activeOrder.items.filter((i) => i.id !== orderItemId);
    const { subtotal, scAmount, scRate, vatAmount, grandTotal } =
      calculateOrderTotals(updatedItems, settings.enableServiceCharge, settings.enableVat, settings.isVatInclusive);

    setOrders((prev) => ({
      ...prev,
      [activeOrder.id]: {
        ...activeOrder,
        items: updatedItems,
        subtotal,
        serviceChargeRate: scRate,
        serviceChargeAmount: scAmount,
        vatAmount,
        grandTotal,
        updatedAt: new Date().toISOString(),
      },
    }));
  };

  const clearOrder = () => {
    if (!activeOrder) return;
    const { subtotal, scAmount, scRate, vatAmount, grandTotal } =
      calculateOrderTotals([], settings.enableServiceCharge, settings.enableVat, settings.isVatInclusive);

    setOrders((prev) => ({
      ...prev,
      [activeOrder.id]: {
        ...activeOrder,
        items: [],
        subtotal,
        serviceChargeRate: scRate,
        serviceChargeAmount: scAmount,
        vatAmount,
        grandTotal,
        updatedAt: new Date().toISOString(),
      },
    }));
  };

  const sendOrderToKitchen = () => {
    if (!activeOrder || !activeTableId) return;

    const updatedItems = activeOrder.items.map((item) => {
      if (item.status === 'pending') {
        return {
          ...item,
          status: 'sent_to_kitchen' as const,
          sentAt: new Date().toISOString(),
        };
      }
      return item;
    });

    setOrders((prev) => ({
      ...prev,
      [activeOrder.id]: {
        ...activeOrder,
        items: updatedItems,
        updatedAt: new Date().toISOString(),
      },
    }));

    updateTableStatus(activeTableId, 'ordered');
  };

  const processPayment = async (
    paymentInput: Omit<PaymentRecord, 'id' | 'paidAt' | 'staffName'>
  ): Promise<PaymentRecord> => {
    if (!activeOrder || !activeTableId) {
      throw new Error('No active order to pay');
    }

    const payment: PaymentRecord = {
      ...paymentInput,
      id: `pay-${Date.now()}`,
      paidAt: new Date().toISOString(),
      staffName: currentStaff?.name || 'Staff',
    };

    // Update order to completed
    setOrders((prev) => ({
      ...prev,
      [activeOrder.id]: {
        ...activeOrder,
        status: 'completed',
        payment,
        updatedAt: new Date().toISOString(),
      },
    }));

    // Update table to open
    updateTableStatus(activeTableId, 'open');
    setTables((prev) =>
      prev.map((t) =>
        t.id === activeTableId
          ? { ...t, status: 'open', seatedAt: undefined, guestCount: undefined }
          : t
      )
    );

    // Deduct stock based on BOM / Recipe & trigger inventory updates
    deductInventoryFromOrder(activeOrder);

    // Update shift metrics
    setCurrentShift((prev) => {
      const cashDelta = payment.method === 'cash' ? payment.amount : 0;
      const promptpayDelta = payment.method === 'promptpay' ? payment.amount : 0;
      const cardDelta = payment.method === 'card' ? payment.amount : 0;
      const newExpectedCash = prev.openingFloat + (prev.cashSales + cashDelta) + prev.payInsTotal - prev.payOutsTotal;

      return {
        ...prev,
        cashSales: prev.cashSales + cashDelta,
        promptpaySales: prev.promptpaySales + promptpayDelta,
        cardSales: prev.cardSales + cardDelta,
        expectedCash: newExpectedCash,
      };
    });

    setLastCompletedPayment(payment);
    return payment;
  };

  const voidOrder = (reason: string) => {
    if (!activeOrder || !activeTableId) return;

    setOrders((prev) => ({
      ...prev,
      [activeOrder.id]: {
        ...activeOrder,
        status: 'voided',
        notes: `Voided: ${reason}`,
        updatedAt: new Date().toISOString(),
      },
    }));

    updateTableStatus(activeTableId, 'open');
  };

  // Void a completed order (from Bill Logs)
  const voidCompletedOrder = (orderId: string, reason: string) => {
    setOrders((prev) => {
      const order = prev[orderId];
      if (!order) return prev;
      return {
        ...prev,
        [orderId]: {
          ...order,
          status: 'voided',
          notes: `Voided: ${reason}`,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  };

  // KDS: Mark single item as served
  const markOrderItemReady = (orderId: string, orderItemId: string) => {
    setOrders((prev) => {
      const order = prev[orderId];
      if (!order) return prev;
      const updatedItems = order.items.map((item) =>
        item.id === orderItemId ? { ...item, status: 'served' as const } : item
      );
      return {
        ...prev,
        [orderId]: {
          ...order,
          items: updatedItems,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  };

  // KDS: Mark all items in an order as served
  const markOrderAllReady = (orderId: string) => {
    setOrders((prev) => {
      const order = prev[orderId];
      if (!order) return prev;
      const updatedItems = order.items.map((item) =>
        item.status === 'sent_to_kitchen' ? { ...item, status: 'served' as const } : item
      );
      return {
        ...prev,
        [orderId]: {
          ...order,
          items: updatedItems,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  };

  // Cash Drawer & Shift
  const addCashTransaction = (
    type: 'pay_in' | 'pay_out',
    amount: number,
    reason: string
  ) => {
    const newTx: CashTransaction = {
      id: `tx-${Date.now()}`,
      shiftId: currentShift.id,
      type,
      amount,
      reason,
      timestamp: new Date().toISOString(),
      staffName: currentStaff?.name || 'Staff',
    };

    setCashTransactions((prev) => [newTx, ...prev]);

    setCurrentShift((prev) => {
      const payInsTotal = type === 'pay_in' ? prev.payInsTotal + amount : prev.payInsTotal;
      const payOutsTotal = type === 'pay_out' ? prev.payOutsTotal + amount : prev.payOutsTotal;
      const expectedCash = prev.openingFloat + prev.cashSales + payInsTotal - payOutsTotal;
      return {
        ...prev,
        payInsTotal,
        payOutsTotal,
        expectedCash,
      };
    });
  };

  const closeShift = (actualCash: number, notes?: string) => {
    const discrepancy = actualCash - currentShift.expectedCash;
    const closedShift: Shift = {
      ...currentShift,
      closedAt: new Date().toISOString(),
      closedBy: currentStaff?.name || 'Staff',
      actualCash,
      discrepancy,
      status: 'closed',
      notes,
    };
    setCurrentShift(closedShift);
    setShiftHistory((prev) => [closedShift, ...prev]);
  };

  const reopenShift = (openingFloat: number) => {
    const newShift: Shift = {
      id: `shift-${Date.now()}`,
      openedAt: new Date().toISOString(),
      openedBy: currentStaff?.name || 'Staff',
      openingFloat,
      cashSales: 0,
      promptpaySales: 0,
      cardSales: 0,
      payInsTotal: 0,
      payOutsTotal: 0,
      expectedCash: openingFloat,
      status: 'open',
    };
    setCurrentShift(newShift);
  };

  // Menu Management
  const toggleItemStock = (itemId: string) => {
    setMenuItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, inStock: !item.inStock } : item
      )
    );
  };

  const updateMenuItem = (updated: MenuItem) => {
    setMenuItems((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
  };

  const addMenuItem = (item: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = {
      ...item,
      id: `item-${Date.now()}`,
    };
    setMenuItems((prev) => [...prev, newItem]);
  };

  // Procurement & LINE Agent state
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}suppliers`);
    return saved ? JSON.parse(saved) : initialSuppliers;
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}inventory`);
    return saved ? JSON.parse(saved) : initialInventory;
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}purchase_orders`);
    return saved ? JSON.parse(saved) : initialPurchaseOrders;
  });

  const [lineAgentConfig, setLineAgentConfig] = useState<LineAgentConfig>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}line_agent_config`);
    return saved ? JSON.parse(saved) : initialLineAgentConfig;
  });

  const [lineLogs, setLineLogs] = useState<LineMessageLog[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}line_logs`);
    return saved ? JSON.parse(saved) : initialLineLogs;
  });

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}suppliers`, JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}inventory`, JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}purchase_orders`, JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}line_agent_config`, JSON.stringify(lineAgentConfig));
  }, [lineAgentConfig]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}line_logs`, JSON.stringify(lineLogs));
  }, [lineLogs]);

  const addSupplier = (s: Omit<Supplier, 'id'>) => {
    const newSupplier: Supplier = { ...s, id: `sup-${Date.now()}` };
    setSuppliers((prev) => [...prev, newSupplier]);
  };

  const updateSupplier = (s: Supplier) => {
    setSuppliers((prev) => prev.map((item) => (item.id === s.id ? s : item)));
  };

  const deleteSupplier = (supplierId: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== supplierId));
  };

  const addInventoryItem = (item: Omit<InventoryItem, 'id'>) => {
    const newItem: InventoryItem = { ...item, id: `inv-${Date.now()}` };
    setInventory((prev) => [...prev, newItem]);
  };

  const updateInventoryItem = (item: InventoryItem) => {
    setInventory((prev) => prev.map((i) => (i.id === item.id ? item : i)));
  };

  const deleteInventoryItem = (itemId: string) => {
    setInventory((prev) => prev.filter((i) => i.id !== itemId));
  };

  const createPurchaseOrder = (poData: Omit<PurchaseOrder, 'id' | 'poNumber' | 'createdAt' | 'createdBy' | 'status' | 'paymentStatus' | 'stockIngested'>): PurchaseOrder => {
    const poCount = purchaseOrders.length + 1;
    const poNum = `PO-202609-${String(poCount).padStart(3, '0')}`;
    const newPo: PurchaseOrder = {
      ...poData,
      id: `po-${Date.now()}`,
      poNumber: poNum,
      status: 'draft',
      paymentStatus: 'pending',
      stockIngested: false,
      createdAt: new Date().toISOString(),
      createdBy: currentStaff?.name || 'Store Staff',
    };
    setPurchaseOrders((prev) => [newPo, ...prev]);
    return newPo;
  };

  const sendPOToLineGroup = (poId: string) => {
    const po = purchaseOrders.find((p) => p.id === poId);
    if (!po) return;

    const supplier = suppliers.find((s) => s.id === po.supplierId);
    const supplierName = supplier?.name || po.supplierName;

    setPurchaseOrders((prev) =>
      prev.map((p) =>
        p.id === poId
          ? {
              ...p,
              status: 'sent_line',
              sentToLineAt: new Date().toISOString(),
            }
          : p
      )
    );

    const itemSummaryText = po.items
      .map((it, idx) => `${idx + 1}. ${it.nameTh} ${it.qtyOrdered} ${it.unit} @ ฿${it.unitPrice} = ฿${it.total.toLocaleString()}`)
      .join('\n');
    const msgText = `ขอสั่งซื้อสินค้าตามใบสั่งซื้อ ${po.poNumber}:\n${itemSummaryText}\nรวมทั้งสิ้น: ฿${po.grandTotal.toLocaleString()}\nส่งพรุ่งนี้เช้า ร้านตุ๋นมัน (พระราม 3) ขอบคุณครับ`;

    const newLog: LineMessageLog = {
      id: `log-${Date.now()}`,
      poId: po.id,
      supplierName,
      direction: 'outbound',
      sender: '🤖 Alberta Procurement Agent',
      messageText: msgText,
      timestamp: new Date().toISOString(),
    };

    setLineLogs((prev) => [newLog, ...prev]);
  };

  const simulateSupplierLineReply = (poId: string, simulatedTotal?: number, isDiscrepancy?: boolean) => {
    const po = purchaseOrders.find((p) => p.id === poId);
    if (!po) return;

    const supplier = suppliers.find((s) => s.id === po.supplierId);
    const supplierPromptPay = supplier?.promptPayId || '0812223333';
    const finalTotal = isDiscrepancy ? (simulatedTotal || po.grandTotal + 300) : po.grandTotal;
    const discrepancy = isDiscrepancy ? finalTotal - po.grandTotal : 0;

    const qrPayload = `00020101021229370016A0000006770101110113${supplierPromptPay}5802TH5303764540${finalTotal.toFixed(2)}6304E8A2`;

    setPurchaseOrders((prev) =>
      prev.map((p) =>
        p.id === poId
          ? {
              ...p,
              status: discrepancy !== 0 ? 'ocr_received' : 'reconciled',
              scannedBillUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=600&q=80',
              ocrExtractedTotal: finalTotal,
              discrepancyAmount: discrepancy,
              promptPayQrPayload: qrPayload,
            }
          : p
      )
    );

    const newLog: LineMessageLog = {
      id: `log-${Date.now()}`,
      poId: po.id,
      supplierName: po.supplierName,
      direction: 'inbound',
      sender: supplier?.contactPerson || 'ซัพพลายเออร์',
      messageText: isDiscrepancy
        ? `รับออเดอร์ครับเฮีย บิล PO นี้มีปรับราคาพิเศษ รวมทั้งสิ้น ฿${finalTotal.toLocaleString()} สแกน QR PromptPay นี้ชำระได้เลยครับ`
        : `รับออเดอร์เรียบร้อยครับ ส่งตามเวลาแน่นอน ฿${finalTotal.toLocaleString()} แนบใบเสร็จและ PromptPay QR ให้ครับ`,
      imageUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=600&q=80',
      qrPayload,
      timestamp: new Date().toISOString(),
      ocrStatus: isDiscrepancy ? 'discrepancy' : 'verified',
    };

    setLineLogs((prev) => [newLog, ...prev]);
  };

  const approveAndPayPO = (poId: string) => {
    const po = purchaseOrders.find((p) => p.id === poId);
    if (!po) return;

    setPurchaseOrders((prev) =>
      prev.map((p) =>
        p.id === poId
          ? {
              ...p,
              status: 'completed',
              paymentStatus: 'paid',
              paidAt: new Date().toISOString(),
              stockIngested: true,
            }
          : p
      )
    );

    setInventory((prevInv) =>
      prevInv.map((invItem) => {
        const poMatch = po.items.find((it) => it.inventoryItemId === invItem.id);
        if (poMatch) {
          return {
            ...invItem,
            currentStock: invItem.currentStock + poMatch.qtyOrdered,
          };
        }
        return invItem;
      })
    );
  };

  const updateLineAgentConfig = (cfg: Partial<LineAgentConfig>) => {
    setLineAgentConfig((prev) => ({ ...prev, ...cfg }));
  };

  const triggerAutoPOForLowStock = (itemId: string) => {
    const invItem = inventory.find((i) => i.id === itemId);
    if (!invItem) return;

    const supplier = suppliers.find((s) => s.id === invItem.supplierId) || suppliers[0];
    const qtyToOrder = Math.max(10, Math.ceil(invItem.minSafetyThreshold * 1.5 - invItem.currentStock));

    const poItem: POItem = {
      inventoryItemId: invItem.id,
      nameTh: invItem.nameTh,
      unit: invItem.unit,
      qtyOrdered: qtyToOrder,
      unitPrice: invItem.avgCost,
      total: qtyToOrder * invItem.avgCost,
    };

    const poCount = purchaseOrders.length + 1;
    const poNum = `PO-202609-${String(poCount).padStart(3, '0')}`;
    const newPo: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber: poNum,
      supplierId: supplier.id,
      supplierName: supplier.name,
      status: 'draft',
      items: [poItem],
      subtotal: poItem.total,
      grandTotal: poItem.total,
      createdAt: new Date().toISOString(),
      createdBy: currentStaff?.name || 'Store Staff',
      paymentStatus: 'pending',
      stockIngested: false,
    };

    setPurchaseOrders((prev) => [newPo, ...prev]);

    if (lineAgentConfig.autoSendLineOnLowStock) {
      setTimeout(() => {
        sendPOToLineGroup(newPo.id);
      }, 300);
    }
  };

  // -------------------------------------------------------------
  // BOM + COGS + Sale Stock Deduction Engine
  // -------------------------------------------------------------
  const deductInventoryFromOrder = (order: Order) => {
    if (!order || !order.items || order.items.length === 0) return;

    setInventory((prevInventory) => {
      const updated = [...prevInventory];

      order.items.forEach((orderItem) => {
        const recipe = menuRecipes[orderItem.menuItemId];
        if (recipe && recipe.ingredients && recipe.ingredients.length > 0) {
          recipe.ingredients.forEach((ing) => {
            const invIndex = updated.findIndex((i) => i.id === ing.inventoryItemId);
            if (invIndex !== -1) {
              const invItem = updated[invIndex];
              const wasteFactor = 1 + (ing.wastagePercent || 0) / 100;
              let normQty = ing.quantity * orderItem.quantity * wasteFactor;
              if (ing.unit === 'g' && invItem.unit === 'kg') normQty = normQty / 1000;
              if (ing.unit === 'ml' && invItem.unit === 'L') normQty = normQty / 1000;

              const newStock = Math.max(0, Number((invItem.currentStock - normQty).toFixed(3)));
              updated[invIndex] = {
                ...invItem,
                currentStock: newStock,
              };
            }
          });
        } else {
          // Direct retail item check (e.g. bottles)
          const invIndex = updated.findIndex(
            (i) =>
              i.nameTh.toLowerCase().includes(orderItem.nameTh.toLowerCase()) ||
              orderItem.nameTh.toLowerCase().includes(i.nameTh.toLowerCase())
          );
          if (invIndex !== -1) {
            const invItem = updated[invIndex];
            const newStock = Math.max(0, Number((invItem.currentStock - orderItem.quantity).toFixed(3)));
            updated[invIndex] = {
              ...invItem,
              currentStock: newStock,
            };
          }
        }
      });

      return updated;
    });
  };

  const simulateSaleAndDeductStock = (saleItems: { menuItemId: string; quantity: number }[]) => {
    let totalSales = 0;
    let totalCogs = 0;
    const deductedMap: Record<string, { nameTh: string; amount: number; unit: string; currentStock: number }> = {};

    setInventory((prevInventory) => {
      const updated = [...prevInventory];

      saleItems.forEach((sItem) => {
        const menuItem = menuItems.find((m) => m.id === sItem.menuItemId);
        if (menuItem) {
          totalSales += menuItem.price * sItem.quantity;
        }

        const recipe = menuRecipes[sItem.menuItemId];
        if (recipe && recipe.ingredients && recipe.ingredients.length > 0) {
          recipe.ingredients.forEach((ing) => {
            const invIndex = updated.findIndex((i) => i.id === ing.inventoryItemId);
            if (invIndex !== -1) {
              const invItem = updated[invIndex];
              const wasteFactor = 1 + (ing.wastagePercent || 0) / 100;
              let normQty = ing.quantity * sItem.quantity * wasteFactor;
              if (ing.unit === 'g' && invItem.unit === 'kg') normQty = normQty / 1000;
              if (ing.unit === 'ml' && invItem.unit === 'L') normQty = normQty / 1000;

              const newStock = Math.max(0, Number((invItem.currentStock - normQty).toFixed(3)));
              totalCogs += normQty * invItem.avgCost;

              if (!deductedMap[invItem.id]) {
                deductedMap[invItem.id] = {
                  nameTh: invItem.nameTh,
                  amount: normQty,
                  unit: invItem.unit,
                  currentStock: newStock,
                };
              } else {
                deductedMap[invItem.id].amount += normQty;
                deductedMap[invItem.id].currentStock = newStock;
              }

              updated[invIndex] = {
                ...invItem,
                currentStock: newStock,
              };
            }
          });
        } else if (menuItem) {
          const invIndex = updated.findIndex(
            (i) =>
              i.nameTh.toLowerCase().includes(menuItem.nameTh.toLowerCase()) ||
              menuItem.nameTh.toLowerCase().includes(i.nameTh.toLowerCase())
          );
          if (invIndex !== -1) {
            const invItem = updated[invIndex];
            const newStock = Math.max(0, Number((invItem.currentStock - sItem.quantity).toFixed(3)));
            totalCogs += sItem.quantity * invItem.avgCost;

            if (!deductedMap[invItem.id]) {
              deductedMap[invItem.id] = {
                nameTh: invItem.nameTh,
                amount: sItem.quantity,
                unit: invItem.unit,
                currentStock: newStock,
              };
            } else {
              deductedMap[invItem.id].amount += sItem.quantity;
              deductedMap[invItem.id].currentStock = newStock;
            }

            updated[invIndex] = {
              ...invItem,
              currentStock: newStock,
            };
          }
        }
      });

      return updated;
    });

    return {
      totalSales,
      totalCogs,
      deductedIngredients: Object.values(deductedMap),
    };
  };

  const createBulkPOForSupplier = (
    supplierId: string,
    items: { inventoryItemId: string; qtyOrdered: number; unitPrice?: number }[],
    autoSendLine: boolean = true
  ): PurchaseOrder => {
    const supplier = suppliers.find((s) => s.id === supplierId) || suppliers[0];
    const poItems: POItem[] = items.map((itm) => {
      const inv = inventory.find((i) => i.id === itm.inventoryItemId);
      const unitPrice = itm.unitPrice !== undefined ? itm.unitPrice : inv?.avgCost || 0;
      return {
        inventoryItemId: itm.inventoryItemId,
        nameTh: inv?.nameTh || 'สินค้าสั่งซื้อ',
        unit: inv?.unit || 'หน่วย',
        qtyOrdered: itm.qtyOrdered,
        unitPrice,
        total: itm.qtyOrdered * unitPrice,
      };
    });

    const subtotal = poItems.reduce((sum, i) => sum + i.total, 0);
    const poCount = purchaseOrders.length + 1;
    const poNum = `PO-202609-${String(poCount).padStart(3, '0')}`;

    const newPo: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber: poNum,
      supplierId: supplier.id,
      supplierName: supplier.name,
      status: 'draft',
      items: poItems,
      subtotal,
      grandTotal: subtotal,
      createdAt: new Date().toISOString(),
      createdBy: currentStaff?.name || 'Owner / Procurement Auto',
      paymentStatus: 'pending',
      stockIngested: false,
    };

    setPurchaseOrders((prev) => [newPo, ...prev]);

    if (autoSendLine) {
      setTimeout(() => {
        sendPOToLineGroup(newPo.id);
      }, 300);
    }

    return newPo;
  };

  const triggerAllSupplierReorders = (): PurchaseOrder[] => {
    // Find all inventory items where currentStock <= minSafetyThreshold
    const lowStockItems = inventory.filter((inv) => inv.currentStock <= inv.minSafetyThreshold);
    if (lowStockItems.length === 0) return [];

    // Group by supplier
    const supplierMap: Record<string, { inventoryItemId: string; qtyOrdered: number; unitPrice: number }[]> = {};
    lowStockItems.forEach((item) => {
      const sId = item.supplierId || suppliers[0]?.id || 'sup-1';
      if (!supplierMap[sId]) supplierMap[sId] = [];
      const qtyToOrder = Math.max(10, Math.ceil(item.minSafetyThreshold * 1.5 - item.currentStock));
      supplierMap[sId].push({
        inventoryItemId: item.id,
        qtyOrdered: qtyToOrder,
        unitPrice: item.avgCost,
      });
    });

    const createdPOs: PurchaseOrder[] = [];
    Object.entries(supplierMap).forEach(([supId, items]) => {
      const po = createBulkPOForSupplier(supId, items, true);
      createdPOs.push(po);
    });

    return createdPOs;
  };

  // API Keys & Accounting Program Connectors state
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}api_keys`);
    return saved ? JSON.parse(saved) : initialApiKeys;
  });

  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}webhooks`);
    return saved ? JSON.parse(saved) : initialWebhooks;
  });

  const [accountingConfig, setAccountingConfig] = useState<AccountingIntegrationConfig>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}accounting_config`);
    return saved ? JSON.parse(saved) : initialAccountingConfig;
  });

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}api_keys`, JSON.stringify(apiKeys));
  }, [apiKeys]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}webhooks`, JSON.stringify(webhooks));
  }, [webhooks]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}accounting_config`, JSON.stringify(accountingConfig));
  }, [accountingConfig]);

  const generateApiKey = (name: string, permissions: ApiKey['permissions'], environment: 'live' | 'test' = 'live'): ApiKey => {
    const randomHex = Math.random().toString(16).substring(2, 10) + Math.random().toString(16).substring(2, 10);
    const secret = `ak_${environment}_alberta_${randomHex}`;
    const newKey: ApiKey = {
      id: `key-${Date.now()}`,
      name,
      keySecret: secret,
      environment,
      permissions,
      createdAt: new Date().toISOString(),
      active: true,
    };
    setApiKeys((prev) => [newKey, ...prev]);
    return newKey;
  };

  const revokeApiKey = (keyId: string) => {
    setApiKeys((prev) => prev.filter((k) => k.id !== keyId));
  };

  const addWebhookEndpoint = (wh: Omit<WebhookEndpoint, 'id'>) => {
    const newWh: WebhookEndpoint = {
      ...wh,
      id: `wh-${Date.now()}`,
    };
    setWebhooks((prev) => [...prev, newWh]);
  };

  const deleteWebhookEndpoint = (whId: string) => {
    setWebhooks((prev) => prev.filter((w) => w.id !== whId));
  };

  const updateAccountingConfig = (newCfg: Partial<AccountingIntegrationConfig>) => {
    setAccountingConfig((prev) => ({ ...prev, ...newCfg, lastSyncedAt: new Date().toISOString() }));
  };

  const triggerTestWebhook = (whId: string) => {
    setWebhooks((prev) =>
      prev.map((w) =>
        w.id === whId
          ? {
              ...w,
              lastTriggeredAt: new Date().toISOString(),
              lastStatus: 'success',
            }
          : w
      )
    );
  };

  // Customer Order Queue & Background Worker State
  const [orderQueue, setOrderQueue] = useState<QueuedCustomerOrder[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}order_queue`);
    return saved ? JSON.parse(saved) : [];
  });

  const [workerStatus, setWorkerStatus] = useState<'idle' | 'processing' | 'active'>('idle');
  const [lastWorkerNotification, setLastWorkerNotification] = useState<{ id: string; tableName: string; itemCount: number; time: string } | null>(null);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}order_queue`, JSON.stringify(orderQueue));
  }, [orderQueue]);

  // Cross-tab / Cross-window event synchronization for Order Queue Worker
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel('alberta_order_queue_bus');
        channel.onmessage = (event) => {
          if (event.data?.type === 'QUEUE_NEW_ORDER' && event.data.order) {
            setOrderQueue((prev) => {
              if (prev.some((o) => o.id === event.data.order.id)) return prev;
              return [event.data.order, ...prev];
            });
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported or restricted', e);
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === `${STORAGE_PREFIX}order_queue` && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setOrderQueue(parsed);
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Background Order Queue Worker Processor
  const isProcessingQueueRef = useRef(false);

  useEffect(() => {
    const nextQueued = orderQueue.find((q) => q.status === 'queued');
    if (!nextQueued || isProcessingQueueRef.current) return;

    isProcessingQueueRef.current = true;
    setWorkerStatus('processing');

    // Asynchronous background worker ingestion latency (380ms)
    const timer = setTimeout(() => {
      const targetTableId = nextQueued.tableId;
      const targetTable = tables.find((t) => t.id === targetTableId || t.number === nextQueued.tableName);
      const effectiveTableId = targetTable ? targetTable.id : targetTableId;
      const effectiveTableName = targetTable ? targetTable.number : nextQueued.tableName;

      const newOrderItems: OrderItem[] = nextQueued.items.map((it) => {
        const modifierDelta = it.modifiers.reduce((sum, m) => sum + m.priceDelta, 0);
        return {
          id: `oi-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          menuItemId: it.menuItem.id,
          nameTh: it.menuItem.nameTh,
          nameEn: it.menuItem.nameEn,
          imageUrl: it.menuItem.imageUrl,
          basePrice: it.menuItem.price,
          quantity: it.quantity,
          modifiers: it.modifiers,
          specialInstructions: it.instructions || (nextQueued.guestNote ? `[ลูกค้า]: ${nextQueued.guestNote}` : undefined),
          itemTotal: (it.menuItem.price + modifierDelta) * it.quantity,
          status: 'sent_to_kitchen' as const,
          sentAt: new Date().toISOString(),
        };
      });

      setOrders((prevOrders) => {
        const existingOrder = Object.values(prevOrders).find(
          (o) => o.tableId === effectiveTableId && o.status === 'active'
        );

        if (existingOrder) {
          const updatedItems = [...existingOrder.items, ...newOrderItems];
          const { subtotal, scAmount, scRate, vatAmount, grandTotal } =
            calculateOrderTotals(updatedItems, settings.enableServiceCharge, settings.enableVat, settings.isVatInclusive);

          return {
            ...prevOrders,
            [existingOrder.id]: {
              ...existingOrder,
              items: updatedItems,
              subtotal,
              serviceChargeRate: scRate,
              serviceChargeAmount: scAmount,
              vatAmount,
              grandTotal,
              updatedAt: new Date().toISOString(),
            },
          };
        } else {
          const orderId = `ord-${Date.now().toString().slice(-4)}`;
          const { subtotal, scAmount, scRate, vatAmount, grandTotal } =
            calculateOrderTotals(newOrderItems, settings.enableServiceCharge, settings.enableVat, settings.isVatInclusive);

          const createdOrder: Order = {
            id: orderId,
            orderNumber: `#${orderId.slice(-4)}`,
            tableId: effectiveTableId,
            tableName: effectiveTableName,
            guestCount: nextQueued.guestCount || targetTable?.guestCount || 2,
            items: newOrderItems,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            staffId: 'staff-customer-self',
            staffName: `สั่งเองที่โต๊ะ (${effectiveTableName})`,
            subtotal,
            serviceChargeRate: scRate,
            serviceChargeAmount: scAmount,
            vatRate: settings.vatRate,
            vatAmount,
            isVatInclusive: settings.isVatInclusive,
            grandTotal,
          };

          return {
            ...prevOrders,
            [orderId]: createdOrder,
          };
        }
      });

      // Update table status to ordered
      updateTableStatus(effectiveTableId, 'ordered');
      setTables((prev) =>
        prev.map((t) =>
          t.id === effectiveTableId ? { ...t, status: 'ordered', seatedAt: t.seatedAt || new Date().toISOString() } : t
        )
      );

      // Mark queue item as completed
      setOrderQueue((prev) =>
        prev.map((q) =>
          q.id === nextQueued.id
            ? { ...q, status: 'completed', processedAt: new Date().toISOString() }
            : q
        )
      );

      // Trigger notification for POS master cashier
      setLastWorkerNotification({
        id: nextQueued.id,
        tableName: effectiveTableName,
        itemCount: nextQueued.items.reduce((sum, i) => sum + i.quantity, 0),
        time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });

      // Web Audio API chime
      try {
        if (typeof window !== 'undefined' && 'AudioContext' in window) {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, ctx.currentTime);
          osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
          gain.gain.setValueAtTime(0.12, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
          osc.start();
          osc.stop(ctx.currentTime + 0.35);
        }
      } catch {}

      setWorkerStatus('idle');
      isProcessingQueueRef.current = false;
    }, 380);

    return () => clearTimeout(timer);
  }, [orderQueue, tables, settings, calculateOrderTotals]);

  const queueCustomerOrder = async (
    orderData: Omit<QueuedCustomerOrder, 'id' | 'submittedAt' | 'status'>
  ): Promise<string> => {
    const id = `qord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newQueueItem: QueuedCustomerOrder = {
      ...orderData,
      id,
      submittedAt: new Date().toISOString(),
      status: 'queued',
    };

    setOrderQueue((prev) => [newQueueItem, ...prev]);

    // Broadcast cross-window / cross-tab
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('alberta_order_queue_bus');
        channel.postMessage({ type: 'QUEUE_NEW_ORDER', order: newQueueItem });
        channel.close();
      }
    } catch {}

    return id;
  };

  const clearCompletedQueue = () => {
    setOrderQueue((prev) => prev.filter((q) => q.status === 'queued' || q.status === 'processing'));
  };

  const dismissWorkerNotification = () => {
    setLastWorkerNotification(null);
  };

  // -------------------------------------------------------------
  // Automation Workflows, RBAC Scheduling & Knowledge Management (KM)
  // -------------------------------------------------------------
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}workflows`);
    return saved ? JSON.parse(saved) : initialWorkflows;
  });

  const [workflowSchedules, setWorkflowSchedules] = useState<WorkflowSchedule[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}schedules`);
    return saved ? JSON.parse(saved) : initialWorkflowSchedules;
  });

  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDocument[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}knowledge_docs`);
    return saved ? JSON.parse(saved) : initialKnowledgeDocs;
  });

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}workflows`, JSON.stringify(workflows));
  }, [workflows]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}schedules`, JSON.stringify(workflowSchedules));
  }, [workflowSchedules]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}knowledge_docs`, JSON.stringify(knowledgeDocs));
  }, [knowledgeDocs]);

  const toggleWorkflow = (id: string) => {
    setWorkflows((prev) =>
      prev.map((wf) => (wf.id === id ? { ...wf, enabled: !wf.enabled } : wf))
    );
  };

  const addWorkflow = (wf: Omit<AutomationWorkflow, 'id' | 'executionCount'>) => {
    const newWf: AutomationWorkflow = {
      ...wf,
      id: `wf-${Date.now()}`,
      executionCount: 0,
      lastRunStatus: 'success',
    };
    setWorkflows((prev) => [newWf, ...prev]);
  };

  const updateWorkflow = (wf: AutomationWorkflow) => {
    setWorkflows((prev) => prev.map((w) => (w.id === wf.id ? wf : w)));
  };

  const deleteWorkflow = (id: string) => {
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
  };

  const runWorkflowNow = (id: string) => {
    setWorkflows((prev) =>
      prev.map((w) =>
        w.id === id
          ? {
              ...w,
              lastRunAt: new Date().toISOString(),
              lastRunStatus: 'success',
              executionCount: w.executionCount + 1,
            }
          : w
      )
    );
  };

  const toggleSchedule = (id: string) => {
    setWorkflowSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled, status: !s.enabled ? 'active' : 'paused' } : s))
    );
  };

  const addSchedule = (sch: Omit<WorkflowSchedule, 'id'>) => {
    const newSch: WorkflowSchedule = {
      ...sch,
      id: `sch-${Date.now()}`,
    };
    setWorkflowSchedules((prev) => [...prev, newSch]);
  };

  const updateSchedule = (sch: WorkflowSchedule) => {
    setWorkflowSchedules((prev) => prev.map((s) => (s.id === sch.id ? sch : s)));
  };

  const deleteSchedule = (id: string) => {
    setWorkflowSchedules((prev) => prev.filter((s) => s.id !== id));
  };

  const addKnowledgeDoc = (doc: Omit<KnowledgeDocument, 'id' | 'updatedAt'>) => {
    const newDoc: KnowledgeDocument = {
      ...doc,
      id: `sop-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    setKnowledgeDocs((prev) => [newDoc, ...prev]);
  };

  const updateKnowledgeDoc = (doc: KnowledgeDocument) => {
    setKnowledgeDocs((prev) =>
      prev.map((d) => (d.id === doc.id ? { ...doc, updatedAt: new Date().toISOString() } : d))
    );
  };

  const deleteKnowledgeDoc = (id: string) => {
    setKnowledgeDocs((prev) => prev.filter((d) => d.id !== id));
  };

  // -------------------------------------------------------------
  // Foundation Setup & CoGS State & Methods
  // -------------------------------------------------------------
  const [foundationConfig, setFoundationConfig] = useState<FoundationConfig>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}foundation_config`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...initialFoundationConfig,
          ...parsed,
          cogs: {
            ...initialFoundationConfig.cogs,
            ...(parsed.cogs || {}),
          },
        };
      } catch (e) {
        console.error('Failed to parse foundation config', e);
      }
    }
    return initialFoundationConfig;
  });

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}foundation_config`, JSON.stringify(foundationConfig));
  }, [foundationConfig]);

  const [menuRecipes, setMenuRecipes] = useState<Record<string, MenuItemRecipe>>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}menu_recipes`);
    if (saved) {
      try {
        return { ...initialMenuRecipes, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Failed to parse menu recipes', e);
      }
    }
    return initialMenuRecipes;
  });

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}menu_recipes`, JSON.stringify(menuRecipes));
  }, [menuRecipes]);

  const updateFoundationConfig = (newCfg: Partial<FoundationConfig>) => {
    setFoundationConfig((prev) => ({
      ...prev,
      ...newCfg,
      cogs: {
        ...prev.cogs,
        ...(newCfg.cogs || {}),
      },
    }));
  };

  const updateMenuItemRecipe = (recipe: MenuItemRecipe) => {
    setMenuRecipes((prev) => ({
      ...prev,
      [recipe.menuItemId]: {
        ...recipe,
        updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      },
    }));
  };

  const deleteMenuItemRecipe = (menuItemId: string) => {
    setMenuRecipes((prev) => {
      const copy = { ...prev };
      delete copy[menuItemId];
      return copy;
    });
  };

  const [rawMaterials, setRawMaterials] = useState<RawMaterialCostItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}raw_materials`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse raw materials', e);
      }
    }
    return initialRawMaterialCosts;
  });

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}raw_materials`, JSON.stringify(rawMaterials));
  }, [rawMaterials]);

  const updateRawMaterialCost = (id: string, updates: Partial<RawMaterialCostItem>, syncToBOM = true) => {
    setRawMaterials((prev) => {
      return prev.map((rm) => {
        if (rm.id !== id) return rm;

        const newAsPurchased = updates.asPurchasedCost !== undefined ? updates.asPurchasedCost : rm.asPurchasedCost;
        const newFreight = updates.freightAndHandlingCostPerUnit !== undefined ? updates.freightAndHandlingCostPerUnit : rm.freightAndHandlingCostPerUnit;
        const newLanded = updates.landedCost !== undefined ? updates.landedCost : newAsPurchased + newFreight;
        const newTrimmingWaste = updates.trimmingWastePct !== undefined ? updates.trimmingWastePct : rm.trimmingWastePct;
        const newCookingYield = updates.cookingYieldPct !== undefined ? updates.cookingYieldPct : rm.cookingYieldPct;

        // Calculate usable edible portion cost: Landed / (1 - waste) / (yield / 100)
        const wasteFactor = Math.max(0.01, 1 - (newTrimmingWaste / 100));
        const yieldFactor = Math.max(0.01, newCookingYield / 100);
        const newUsableCost = Math.round((newLanded / wasteFactor / yieldFactor) * 100) / 100;

        // Price trend status
        let newPriceStatus = rm.priceStatus;
        let newMoM = rm.priceChangePctMoM;
        if (rm.lastMonthAvgPrice > 0 && updates.asPurchasedCost !== undefined) {
          newMoM = Math.round(((newAsPurchased - rm.lastMonthAvgPrice) / rm.lastMonthAvgPrice) * 10000) / 100;
          if (newMoM > 10) newPriceStatus = 'volatile';
          else if (newMoM > 0) newPriceStatus = 'increased';
          else if (newMoM < 0) newPriceStatus = 'decreased';
          else newPriceStatus = 'stable';
        }

        // History entry if price changed
        let newHistory = rm.history;
        if (updates.asPurchasedCost !== undefined && updates.asPurchasedCost !== rm.asPurchasedCost) {
          newHistory = [
            ...rm.history,
            {
              id: `h-${Date.now()}`,
              date: new Date().toISOString().slice(0, 10),
              price: newAsPurchased,
              source: 'manual_override',
              supplierName: rm.primarySupplierName,
              note: 'ปรับปรุงต้นทุนราคาซื้อใหม่',
            },
          ];
        }

        const updatedRM: RawMaterialCostItem = {
          ...rm,
          ...updates,
          asPurchasedCost: newAsPurchased,
          freightAndHandlingCostPerUnit: newFreight,
          landedCost: newLanded,
          trimmingWastePct: newTrimmingWaste,
          cookingYieldPct: newCookingYield,
          usableEdiblePortionCost: newUsableCost,
          priceChangePctMoM: newMoM,
          priceStatus: newPriceStatus,
          history: newHistory,
          updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        };

        // Sync to inventory avgCost if linked
        if (syncToBOM && rm.inventoryItemId) {
          setInventory((prevInv) =>
            prevInv.map((inv) => (inv.id === rm.inventoryItemId ? { ...inv, avgCost: newAsPurchased } : inv))
          );

          // Update BOM Recipe snapshots
          setMenuRecipes((prevRecipes) => {
            const nextRecipes: Record<string, MenuItemRecipe> = {};
            for (const [menuId, recipe] of Object.entries(prevRecipes)) {
              const updatedIngredients = recipe.ingredients.map((ing) => {
                if (ing.inventoryItemId === rm.inventoryItemId) {
                  return { ...ing, unitCostSnapshot: newAsPurchased };
                }
                return ing;
              });
              nextRecipes[menuId] = { ...recipe, ingredients: updatedIngredients };
            }
            return nextRecipes;
          });
        }

        return updatedRM;
      });
    });
  };

  const addRawMaterialPriceRecord = (rawMaterialId: string, record: Omit<PriceHistoryRecord, 'id'>) => {
    setRawMaterials((prev) =>
      prev.map((rm) => {
        if (rm.id !== rawMaterialId) return rm;
        const newRec: PriceHistoryRecord = { ...record, id: `h-${Date.now()}` };
        return {
          ...rm,
          history: [...rm.history, newRec],
          asPurchasedCost: record.price,
          updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        };
      })
    );
  };

  const addSupplierQuote = (rawMaterialId: string, quote: SupplierPriceQuote) => {
    setRawMaterials((prev) =>
      prev.map((rm) => {
        if (rm.id !== rawMaterialId) return rm;
        const existingIdx = rm.quotes.findIndex((q) => q.supplierId === quote.supplierId);
        let updatedQuotes = [...rm.quotes];
        if (existingIdx >= 0) {
          updatedQuotes[existingIdx] = quote;
        } else {
          updatedQuotes.push(quote);
        }
        return {
          ...rm,
          quotes: updatedQuotes,
          updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        };
      })
    );
  };

  const setPrimarySupplierQuote = (rawMaterialId: string, supplierId: string) => {
    setRawMaterials((prev) =>
      prev.map((rm) => {
        if (rm.id !== rawMaterialId) return rm;
        const targetQuote = rm.quotes.find((q) => q.supplierId === supplierId);
        if (!targetQuote) return rm;
        const updatedQuotes = rm.quotes.map((q) => ({
          ...q,
          isPrimary: q.supplierId === supplierId,
        }));
        return {
          ...rm,
          primarySupplierId: supplierId,
          primarySupplierName: targetQuote.supplierName,
          asPurchasedCost: targetQuote.quotedPrice,
          quotes: updatedQuotes,
          updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        };
      })
    );
  };

  const addYieldTestRecord = (rawMaterialId: string, test: Omit<YieldTestRecord, 'id'>) => {
    setRawMaterials((prev) =>
      prev.map((rm) => {
        if (rm.id !== rawMaterialId) return rm;
        const newTest: YieldTestRecord = { ...test, id: `yt-${Date.now()}` };
        return {
          ...rm,
          trimmingWastePct: test.trimmingLossPct,
          cookingYieldPct: test.cookingShrinkagePct ? Math.max(1, 100 - test.cookingShrinkagePct) : rm.cookingYieldPct,
          yieldTests: [newTest, ...rm.yieldTests],
          updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        };
      })
    );
  };

  const resetRawMaterialsToDefault = () => {
    setRawMaterials(initialRawMaterialCosts);
    localStorage.removeItem(`${STORAGE_PREFIX}raw_materials`);
  };

  return (
    <POSContext.Provider
      value={{
        language,
        setLanguage,
        isOnline,
        settings,
        updateSettings,
        currentStaff,
        staffUsers,
        loginWithPin,
        logoutStaff,
        addStaffUser,
        updateStaffUser,
        deleteStaffUser,
        tables,
        activeTableId,
        setActiveTableId,
        updateTableStatus,
        setTableGuestCount,
        updateTablePosition,
        addTable,
        updateTable,
        deleteTable,
        resetTableLayout,
        saveTableLayout,
        categories,
        menuItems,
        modifierGroups,
        toggleItemStock,
        updateMenuItem,
        addMenuItem,
        orders,
        completedOrders,
        activeOrder,
        addItemToOrder,
        quickAddItemToOrder,
        updateOrderItemQuantity,
        removeOrderItem,
        clearOrder,
        sendOrderToKitchen,
        processPayment,
        voidOrder,
        voidCompletedOrder,
        markOrderItemReady,
        markOrderAllReady,
        currentShift,
        shiftHistory,
        cashTransactions,
        addCashTransaction,
        closeShift,
        reopenShift,
        activeModal,
        setActiveModal,
        selectedItemForModifier,
        setSelectedItemForModifier,
        lastCompletedPayment,
        setLastCompletedPayment,
        activeTab,
        setActiveTab,
        adminSubTab,
        setAdminSubTab,
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
        deductInventoryFromOrder,
        simulateSaleAndDeductStock,
        createBulkPOForSupplier,
        triggerAllSupplierReorders,
        apiKeys,
        webhooks,
        accountingConfig,
        generateApiKey,
        revokeApiKey,
        addWebhookEndpoint,
        deleteWebhookEndpoint,
        updateAccountingConfig,
        triggerTestWebhook,
        orderQueue,
        workerStatus,
        queueCustomerOrder,
        clearCompletedQueue,
        lastWorkerNotification,
        dismissWorkerNotification,
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
        foundationConfig,
        menuRecipes,
        updateFoundationConfig,
        updateMenuItemRecipe,
        deleteMenuItemRecipe,
        rawMaterials,
        updateRawMaterialCost,
        addRawMaterialPriceRecord,
        addSupplierQuote,
        setPrimarySupplierQuote,
        addYieldTestRecord,
        resetRawMaterialsToDefault,
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
};
