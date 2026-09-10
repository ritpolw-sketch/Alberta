import React, { createContext, useContext, useState, useEffect } from 'react';
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
} from '../types/pos';
import {
  initialCategories,
  initialMenuItems,
  initialModifierGroups,
  initialSettings,
  initialStaff,
  initialTables,
  initialActiveShift,
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
    quantity?: number
  ) => void;
  quickAddItemToOrder: (item: MenuItem) => void;
  updateOrderItemQuantity: (orderItemId: string, delta: number) => void;
  removeOrderItem: (orderItemId: string) => void;
  sendOrderToKitchen: () => void;
  processPayment: (payment: Omit<PaymentRecord, 'id' | 'paidAt' | 'staffName'>) => Promise<PaymentRecord>;
  voidOrder: (reason: string) => void;
  voidCompletedOrder: (orderId: string, reason: string) => void;
  markOrderItemReady: (orderId: string, orderItemId: string) => void;
  markOrderAllReady: (orderId: string) => void;

  // Cash Drawer & Shift
  currentShift: Shift;
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

  const [settings, setSettings] = useState<RestaurantSettings>(initialSettings);

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

  const [categories, setCategories] = useState<MenuCategory[]>(initialCategories);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>(initialModifierGroups);

  // Keep them synced if initialData changes during development
  useEffect(() => {
    setMenuItems(initialMenuItems);
    setCategories(initialCategories);
    setModifierGroups(initialModifierGroups);
    setSettings(initialSettings);
  }, [initialMenuItems, initialCategories, initialModifierGroups, initialSettings]);

  // Pre-seed an active order for demonstration
  const [orders, setOrders] = useState<Record<string, Order>>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}orders`);
    if (saved) return JSON.parse(saved);

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

    return {
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
  const calculateOrderTotals = (
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

    if (!enableVat) {
      vatAmount = 0;
      grandTotal = subtotal + scAmount;
    } else if (isInclusive) {
      // VAT is already included in subtotal
      vatAmount = Math.round(((subtotal + scAmount) * 7) / 107 * 100) / 100;
      grandTotal = subtotal + scAmount;
    } else {
      // VAT is added on top
      vatAmount = Math.round((subtotal + scAmount) * settings.vatRate * 100) / 100;
      grandTotal = subtotal + scAmount + vatAmount;
    }

    return { subtotal, scAmount, scRate, vatAmount, grandTotal };
  };

  // Order Operations
  const addItemToOrder = (
    menuItem: MenuItem,
    modifiers: SelectedModifier[],
    instructions?: string,
    quantity = 1
  ) => {
    if (!activeTableId || !activeTable) return;

    const modifierDelta = modifiers.reduce((acc, m) => acc + m.priceDelta, 0);
    const itemTotal = (menuItem.price + modifierDelta) * quantity;

    const newOrderItem: OrderItem = {
      id: `oi-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      menuItemId: menuItem.id,
      nameTh: menuItem.nameTh,
      nameEn: menuItem.nameEn,
      basePrice: menuItem.price,
      quantity,
      modifiers,
      specialInstructions: instructions,
      itemTotal,
      status: 'pending',
    };

    let targetOrder = activeOrder;

    if (!targetOrder) {
      // Create new order
      const orderId = `ord-${Date.now().toString().slice(-4)}`;
      const newItems = [newOrderItem];
      const { subtotal, scAmount, scRate, vatAmount, grandTotal } =
        calculateOrderTotals(newItems, settings.enableServiceCharge, settings.enableVat, settings.isVatInclusive);

      const createdOrder: Order = {
        id: orderId,
        orderNumber: `#${orderId.slice(-4)}`,
        tableId: activeTable.id,
        tableName: activeTable.number,
        guestCount: activeTable.guestCount || 2,
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

      setOrders((prev) => ({ ...prev, [orderId]: createdOrder }));
      updateTableStatus(activeTable.id, 'occupied');
      setTables((prev) =>
        prev.map((t) =>
          t.id === activeTable.id ? { ...t, seatedAt: new Date().toISOString() } : t
        )
      );
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

      setOrders((prev) => ({
        ...prev,
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
      }));
    }
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
    setCurrentShift((prev) => ({
      ...prev,
      closedAt: new Date().toISOString(),
      closedBy: currentStaff?.name || 'Staff',
      actualCash,
      discrepancy,
      status: 'closed',
      notes,
    }));
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
        sendOrderToKitchen,
        processPayment,
        voidOrder,
        voidCompletedOrder,
        markOrderItemReady,
        markOrderAllReady,
        currentShift,
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
