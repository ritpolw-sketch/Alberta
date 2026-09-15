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
  imageUrl?: string;
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

export type AdminSubTab = 'dashboard' | 'bills' | 'menu' | 'financing' | 'shifts' | 'employees' | 'settings' | 'procurement' | 'api_keys';

export type OrderingChannelMethod = 'line_group' | 'line_oa' | 'phone' | 'email_pdf';
export type SupplierPaymentTerm = 'promptpay_cod' | 'credit_7' | 'credit_15' | 'credit_30' | 'cash_drawer';

export interface SupplierWorkflowConfig {
  channelMethod: OrderingChannelMethod;
  paymentTerm: SupplierPaymentTerm;
  autoApproveThreshold: number; // custom threshold limit in Baht for this supplier
  requireOwnerApproval: boolean;
  autoSendLineOnLowStock: boolean;
  requireDeliveryProofUpload: boolean;
  specialInstructions?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  lineId: string;
  lineGroup: string;
  category: string;
  promptPayId: string;
  accountName: string;
  bankName: string;
  creditDays: number;
  workflowConfig?: SupplierWorkflowConfig;
}

export interface InventoryItem {
  id: string;
  nameTh: string;
  nameEn: string;
  unit: string;
  currentStock: number;
  minSafetyThreshold: number;
  avgCost: number;
  supplierId: string;
  category: string;
}

export interface POItem {
  inventoryItemId: string;
  nameTh: string;
  unit: string;
  qtyOrdered: number;
  unitPrice: number;
  total: number;
}

export type POStatus = 'draft' | 'sent_line' | 'ocr_received' | 'reconciled' | 'completed' | 'cancelled';

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  status: POStatus;
  items: POItem[];
  subtotal: number;
  grandTotal: number;
  createdAt: string;
  createdBy: string;
  sentToLineAt?: string;
  scannedBillUrl?: string;
  ocrExtractedTotal?: number;
  discrepancyAmount?: number;
  promptPayQrPayload?: string;
  promptPayQrImage?: string;
  paymentStatus: 'pending' | 'paid';
  paidAt?: string;
  stockIngested: boolean;
}

export interface LineAgentConfig {
  botEnabled: boolean;
  autoApprovalThreshold: number;
  autoSendLineOnLowStock: boolean;
  verifySupplierBankWhitelist: boolean;
}

export interface LineMessageLog {
  id: string;
  poId?: string;
  supplierName: string;
  direction: 'outbound' | 'inbound';
  sender: string;
  messageText: string;
  imageUrl?: string;
  qrPayload?: string;
  timestamp: string;
  ocrStatus?: 'success' | 'discrepancy' | 'verified';
}

// -------------------------------------------------------------
// Automation Workflow, RBAC Scheduling & Knowledge Management (KM)
// -------------------------------------------------------------
export type WorkflowCategory = 'procurement' | 'operations' | 'inventory' | 'finance' | 'customer' | 'custom';
export type WorkflowTriggerType = 'event' | 'schedule' | 'threshold' | 'manual';

export interface WorkflowActionStep {
  id: string;
  type: 'line_notify' | 'create_po' | 'sync_accounting' | 'kds_alert' | 'email_report' | 'print_ticket' | 'webhook_call';
  title: string;
  description: string;
  targetChannel?: string;
}

export interface AutomationWorkflow {
  id: string;
  nameTh: string;
  nameEn: string;
  category: WorkflowCategory;
  descriptionTh: string;
  descriptionEn: string;
  icon: string;
  enabled: boolean;
  triggerType: WorkflowTriggerType;
  triggerCondition: string;
  actions: WorkflowActionStep[];
  allowedRoles: StaffRole[];
  approverRole?: StaffRole;
  scheduleCron?: string;
  scheduleHuman?: string;
  linkedSopId?: string;
  lastRunAt?: string;
  lastRunStatus?: 'success' | 'warning' | 'failed' | 'pending_approval';
  executionCount: number;
  isSpecialProcurement?: boolean;
}

export interface WorkflowSchedule {
  id: string;
  workflowId: string;
  title: string;
  timeOfDay: string; // e.g. "07:00", "22:30"
  daysOfWeek: number[]; // [0,1,2,3,4,5,6] (0 = Sun, 1 = Mon...)
  cronExpression: string;
  enabled: boolean;
  targetAction: string;
  allowedRoles: StaffRole[];
  requireApproval: boolean;
  approverRole: StaffRole;
  lastRun?: string;
  nextRun?: string;
  status: 'active' | 'paused' | 'running';
}

export type KnowledgeCategory = 'procurement' | 'kitchen_sop' | 'cash_handling' | 'service_sop' | 'emergency' | 'ai_prompts' | 'operations' | 'finance';

export interface KnowledgeChecklistItem {
  id: string;
  text: string;
  required: boolean;
}

export interface KnowledgeDocument {
  id: string;
  titleTh: string;
  titleEn: string;
  category: KnowledgeCategory;
  summary: string;
  contentMarkdown: string;
  tags: string[];
  authorRole: StaffRole;
  updatedAt: string;
  version: string;
  linkedWorkflowIds: string[];
  checklists?: KnowledgeChecklistItem[];
}

export type ApiKeyPermission = 'read_sales' | 'read_bills' | 'read_write_pos' | 'read_inventory' | 'export_vat_tax' | 'accounting_sync';

export interface ApiKey {
  id: string;
  name: string;
  keySecret: string;
  environment: 'live' | 'test';
  permissions: ApiKeyPermission[];
  createdAt: string;
  lastUsedAt?: string;
  active: boolean;
}

export interface WebhookEndpoint {
  id: string;
  targetUrl: string;
  secretHeader: string;
  events: ('bill.completed' | 'po.paid' | 'shift.closed' | 'stock.low_alert')[];
  active: boolean;
  lastTriggeredAt?: string;
  lastStatus?: 'success' | 'failed';
}

export type AccountingPlatform = 'flowaccount' | 'peak' | 'trcloud' | 'express' | 'xero' | 'custom_mcp';

export interface AccountingIntegrationConfig {
  platform: AccountingPlatform;
  apiKey: string;
  apiSecret: string;
  autoSyncDailySales: boolean;
  autoSyncPurchaseOrders: boolean;
  vatTaxSync: boolean;
  salesAccountCode: string;
  cogsAccountCode: string;
  lastSyncedAt?: string;
}

export interface StaffUser {
  id: string;
  name: string;
  role: StaffRole;
  pin: string;
  avatarColor: string;
  phone?: string;
  startDate?: string;
}

export interface ScanChannelConfig {
  enabled: boolean;
  accountName: string;
  accountNumber: string; // Bank account or PromptPay Phone/Tax ID
  bankName: string; // e.g. PromptPay, KBANK, SCB, BBL, KTB, TTB, GSB, BAY
  qrType: 'generated' | 'custom_image'; // 'generated' uses dynamic QR canvas; 'custom_image' uses uploaded QR
  customQrUrl?: string; // base64 or image url
}

export type CardGatewayType = 'edc_terminal' | 'omise' | 'stripe' | 'kpayment' | 'gbprimepay' | '2c2p';

export interface CardGatewayConfig {
  enabled: boolean;
  gatewayType: CardGatewayType;
  terminalId?: string;
  merchantId?: string;
  apiKey?: string;
  secretKey?: string;
  feePercentage?: number; // e.g. 2.5%
  passFeeToCustomer?: boolean;
}

export interface CashChannelConfig {
  enabled: boolean;
  allowQuickDenominations?: boolean;
}

export interface PaymentChannelsSettings {
  cash: CashChannelConfig;
  scan: ScanChannelConfig;
  card: CardGatewayConfig;
}

export type ThermalPaperWidth = '80mm' | '58mm';

export interface SinglePrintLayoutConfig {
  paperWidth: ThermalPaperWidth;
  headerTitle: string;
  showLogo: boolean;
  showWifi: boolean;
  showInstructions: boolean;
  footnote: string;
  autoPrint: boolean;
  fontSizeScale: '90' | '100' | '110';
}

export interface PrintingLayoutSettings {
  qrSlip: SinglePrintLayoutConfig;
  customerReceipt: SinglePrintLayoutConfig;
  kitchenTicket: SinglePrintLayoutConfig;
  shiftSummary: SinglePrintLayoutConfig;
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
  paymentChannels?: PaymentChannelsSettings;
  printLayouts?: PrintingLayoutSettings;
}

export interface QueuedCustomerOrderItem {
  menuItem: MenuItem;
  modifiers: SelectedModifier[];
  instructions?: string;
  quantity: number;
}

export interface QueuedCustomerOrder {
  id: string;
  tableId: string;
  tableName: string;
  guestCount?: number;
  items: QueuedCustomerOrderItem[];
  guestNote?: string;
  submittedAt: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  processedAt?: string;
  error?: string;
}

