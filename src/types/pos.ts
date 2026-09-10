export type TableStatus = 'open' | 'occupied' | 'ordered' | 'bill_requested';

export interface Table {
  id: string;
  number: string;
  zone?: string;
  capacity: number;
  status?: TableStatus;
  currentOrderId?: string;
  seatedAt?: string;
  guestCount?: number;
  x?: number;
  y?: number;
  blockCol?: number;
  blockRow?: number;
  shape?: 'square' | 'round' | 'rect';
}

export type ModifierType = 'single' | 'multi' | 'removal';

export interface ModifierOption {
  id: string;
  nameTh: string;
  nameEn: string;
  priceDelta: number; // e.g. +15 for extra egg, 0 for no cilantro
  isDefault?: boolean;
}

export interface ModifierGroup {
  id: string;
  nameTh: string;
  nameEn: string;
  type: ModifierType;
  required: boolean;
  minSelect?: number;
  maxSelect?: number;
  options: ModifierOption[];
}

export interface MenuItem {
  id: string;
  categoryId: string;
  nameTh: string;
  nameEn: string;
  price: number;
  descriptionTh?: string;
  descriptionEn?: string;
  sku?: string;
  inStock: boolean;
  imageUrl?: string;
  modifierGroupIds: string[];
}

export interface MenuCategory {
  id: string;
  nameTh: string;
  nameEn: string;
  icon: string;
  displayOrder: number;
}

export interface SelectedModifier {
  groupId: string;
  groupNameTh: string;
  groupNameEn: string;
  optionId: string;
  optionNameTh: string;
  optionNameEn: string;
  priceDelta: number;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  nameTh: string;
  nameEn: string;
  basePrice: number;
  quantity: number;
  modifiers: SelectedModifier[];
  specialInstructions?: string;
  itemTotal: number; // (basePrice + sum(modifiers)) * quantity
  status: 'pending' | 'sent_to_kitchen' | 'served' | 'voided';
  voidReason?: string;
  sentAt?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  tableId: string;
  tableName: string;
  guestCount: number;
  items: OrderItem[];
  status: 'active' | 'completed' | 'voided';
  createdAt: string;
  updatedAt: string;
  staffId: string;
  staffName: string;
  notes?: string;
  subtotal: number;
  discountAmount?: number;
  serviceChargeRate: number; // e.g. 0.10 for 10%
  serviceChargeAmount: number;
  vatRate: number; // 0.07 for 7%
  vatAmount: number;
  isVatInclusive: boolean;
  grandTotal: number;
  payment?: PaymentRecord;
}

export type PaymentMethod = 'promptpay' | 'cash' | 'card';

export interface PaymentRecord {
  id: string;
  orderId: string;
  method: PaymentMethod;
  amount: number;
  cashReceived?: number;
  cashChange?: number;
  promptpayRef?: string;
  cardLast4?: string;
  paidAt: string;
  staffName: string;
}

export interface Shift {
  id: string;
  openedAt: string;
  closedAt?: string;
  openedBy: string;
  closedBy?: string;
  openingFloat: number;
  cashSales: number;
  promptpaySales: number;
  cardSales: number;
  payInsTotal: number;
  payOutsTotal: number;
  expectedCash: number;
  actualCash?: number;
  discrepancy?: number;
  status: 'open' | 'closed';
  notes?: string;
}

export interface CashTransaction {
  id: string;
  shiftId: string;
  type: 'pay_in' | 'pay_out';
  amount: number;
  reason: string;
  timestamp: string;
  staffName: string;
}

export type StaffRole = 'admin' | 'manager' | 'cashier' | 'owner' | 'kitchen';

export type AdminSubTab = 'dashboard' | 'bills' | 'menu' | 'financing' | 'employees' | 'settings';

export interface StaffUser {
  id: string;
  name: string;
  role: StaffRole;
  pin: string;
  avatarColor: string;
  phone?: string;
  startDate?: string;
}

export interface RestaurantSettings {
  restaurantNameTh: string;
  restaurantNameEn: string;
  branchName: string;
  taxId: string;
  promptPayId: string; // e.g. 0812345678 or 13-digit Tax ID
  promptPayName: string;
  vatRate: number; // 0.07
  enableVat: boolean; // Toggle VAT on/off
  isVatInclusive: boolean;
  serviceChargeRate: number; // 0.10
  enableServiceCharge: boolean;
  addressTh: string;
  addressEn: string;
  phone: string;
}
