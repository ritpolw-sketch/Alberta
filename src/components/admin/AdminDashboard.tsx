import React, { useState, useEffect } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  QrCode,
  Banknote,
  Utensils,
  Plus,
  Edit2,
  X,
  Settings as SettingsIcon,
  Percent,
  Store,
  Check,
  Receipt,
  Wallet,
  Users,
  Clock,
  CreditCard,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Bot,
  Key,
  Printer,
} from 'lucide-react';
import type { MenuItem, AdminSubTab, RestaurantSettings, CardGatewayType, SinglePrintLayoutConfig } from '../../types/pos';
import { initialSettings } from '../../data/initialData';
import { BillLogs } from './BillLogs';
import { FinancingPanel } from './FinancingPanel';
import { EmployeePanel } from './EmployeePanel';
import { ShiftManagePage } from './ShiftManagePage';
import { ProcurementPanel } from './ProcurementPanel';
import { AccountingApiPanel } from './AccountingApiPanel';

const sidebarTabs: { id: AdminSubTab; icon: React.ReactNode; labelTh: string; labelEn: string; ownerOnly?: boolean }[] = [
  { id: 'dashboard', icon: <TrendingUp size={16} />, labelTh: 'ภาพรวม & ยอดขาย', labelEn: 'Dashboard', ownerOnly: true },
  { id: 'procurement', icon: <Bot size={16} />, labelTh: 'จัดซื้อ & LINE Agent', labelEn: 'Procurement & LINE Agent', ownerOnly: true },
  { id: 'api_keys', icon: <Key size={16} />, labelTh: 'API Key & โปรแกรมบัญชี', labelEn: 'API Keys & Accounting', ownerOnly: true },
  { id: 'shifts', icon: <Clock size={16} />, labelTh: 'จัดการกะ', labelEn: 'Manage Shifts' },
  { id: 'bills', icon: <Receipt size={16} />, labelTh: 'ประวัติบิลทั้งหมด', labelEn: 'Bill Logs' },
  { id: 'menu', icon: <Utensils size={16} />, labelTh: 'จัดการเมนูอาหาร', labelEn: 'Menu Catalog' },
  { id: 'financing', icon: <Wallet size={16} />, labelTh: 'การเงิน & กะ', labelEn: 'Financing' },
  { id: 'employees', icon: <Users size={16} />, labelTh: 'จัดการพนักงาน', labelEn: 'Employees', ownerOnly: true },
  { id: 'settings', icon: <SettingsIcon size={16} />, labelTh: 'ตั้งค่าระบบ', labelEn: 'Settings', ownerOnly: true },
];

export const AdminDashboard: React.FC = () => {
  const {
    currentShift,
    orders,
    menuItems,
    toggleItemStock,
    updateMenuItem,
    addMenuItem,
    categories,
    modifierGroups,
    language,
    settings,
    updateSettings,
    adminSubTab,
    setAdminSubTab,
    currentStaff,
  } = usePOS();

  // If staff is not owner/admin and is currently on an owner-only tab, switch to 'shifts'
  useEffect(() => {
    const isOwnerOrAdmin = currentStaff?.role === 'owner' || currentStaff?.role === 'admin';
    const ownerTabs: AdminSubTab[] = ['dashboard', 'employees', 'settings', 'procurement', 'api_keys'];
    if (!isOwnerOrAdmin && ownerTabs.includes(adminSubTab)) {
      setAdminSubTab('shifts');
    }
  }, [currentStaff, adminSubTab, setAdminSubTab]);

  const activeTab = adminSubTab;
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);

  // Settings form state with full paymentChannels structure
  const [settingsForm, setSettingsForm] = useState<RestaurantSettings>(() => ({
    ...settings,
    paymentChannels: {
      cash: {
        enabled: true,
        allowQuickDenominations: true,
        ...(settings.paymentChannels?.cash || {}),
      },
      scan: {
        enabled: true,
        accountName: settings.promptPayName || 'นาย สมชาย บุญรอด (ตุ๋นมัน)',
        accountNumber: settings.promptPayId || '0819876543',
        bankName: settings.paymentChannels?.scan?.bankName || 'PromptPay',
        qrType: settings.paymentChannels?.scan?.qrType || 'generated',
        customQrUrl: settings.paymentChannels?.scan?.customQrUrl || '',
        ...(settings.paymentChannels?.scan || {}),
      },
      card: {
        enabled: true,
        gatewayType: (settings.paymentChannels?.card?.gatewayType || 'edc_terminal') as CardGatewayType,
        terminalId: settings.paymentChannels?.card?.terminalId || 'EDC-882194',
        merchantId: settings.paymentChannels?.card?.merchantId || 'MERCHANT-TH-001',
        apiKey: settings.paymentChannels?.card?.apiKey || '',
        secretKey: settings.paymentChannels?.card?.secretKey || '',
        feePercentage: settings.paymentChannels?.card?.feePercentage ?? 2.5,
        passFeeToCustomer: settings.paymentChannels?.card?.passFeeToCustomer ?? false,
        ...(settings.paymentChannels?.card || {}),
      },
    },
  }));

  // Update settingsForm when context settings change
  useEffect(() => {
    setSettingsForm((prev) => ({
      ...settings,
      paymentChannels: {
        cash: {
          enabled: true,
          allowQuickDenominations: true,
          ...(settings.paymentChannels?.cash || prev.paymentChannels?.cash || {}),
        },
        scan: {
          enabled: true,
          accountName: settings.promptPayName || 'นาย สมชาย บุญรอด (ตุ๋นมัน)',
          accountNumber: settings.promptPayId || '0819876543',
          bankName: settings.paymentChannels?.scan?.bankName || prev.paymentChannels?.scan?.bankName || 'PromptPay',
          qrType: settings.paymentChannels?.scan?.qrType || prev.paymentChannels?.scan?.qrType || 'generated',
          customQrUrl: settings.paymentChannels?.scan?.customQrUrl || prev.paymentChannels?.scan?.customQrUrl || '',
          ...(settings.paymentChannels?.scan || prev.paymentChannels?.scan || {}),
        },
        card: {
          enabled: true,
          gatewayType: (settings.paymentChannels?.card?.gatewayType || prev.paymentChannels?.card?.gatewayType || 'edc_terminal') as CardGatewayType,
          terminalId: settings.paymentChannels?.card?.terminalId || prev.paymentChannels?.card?.terminalId || 'EDC-882194',
          merchantId: settings.paymentChannels?.card?.merchantId || prev.paymentChannels?.card?.merchantId || 'MERCHANT-TH-001',
          apiKey: settings.paymentChannels?.card?.apiKey || prev.paymentChannels?.card?.apiKey || '',
          secretKey: settings.paymentChannels?.card?.secretKey || prev.paymentChannels?.card?.secretKey || '',
          feePercentage: settings.paymentChannels?.card?.feePercentage ?? prev.paymentChannels?.card?.feePercentage ?? 2.5,
          passFeeToCustomer: settings.paymentChannels?.card?.passFeeToCustomer ?? prev.paymentChannels?.card?.passFeeToCustomer ?? false,
          ...(settings.paymentChannels?.card || prev.paymentChannels?.card || {}),
        },
      },
    }));
  }, [settings]);

  const handleSaveSettings = () => {
    // Keep promptPayId and promptPayName synced with scan channel
    const toSave = {
      ...settingsForm,
      promptPayId: settingsForm.paymentChannels?.scan.accountNumber || settingsForm.promptPayId,
      promptPayName: settingsForm.paymentChannels?.scan.accountName || settingsForm.promptPayName,
    };
    updateSettings(toSave);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleCustomQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSettingsForm((prev) => ({
        ...prev,
        paymentChannels: {
          ...prev.paymentChannels!,
          scan: {
            ...prev.paymentChannels!.scan,
            qrType: 'custom_image',
            customQrUrl: base64,
          },
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  // New item form state
  const [newForm, setNewForm] = useState({
    nameTh: '',
    nameEn: '',
    categoryId: categories[0]?.id || '',
    price: 60,
    sku: '',
    descriptionTh: '',
    descriptionEn: '',
    modifierGroupIds: [] as string[],
    inStock: true,
  });

  // Calculate metrics
  const completedOrders = Object.values(orders).filter((o) => o.status === 'completed');
  const grossSales = currentShift.cashSales + currentShift.promptpaySales + currentShift.cardSales;
  const totalBills = completedOrders.length;
  const avgBillSize = totalBills > 0 ? Math.round(grossSales / totalBills) : 0;

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    updateMenuItem(editingItem);
    setEditingItem(null);
  };

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.nameTh || newForm.price <= 0) return;

    addMenuItem({
      ...newForm,
      price: Number(newForm.price),
    });

    setIsAddingNew(false);
    setNewForm({
      nameTh: '',
      nameEn: '',
      categoryId: categories[0]?.id || '',
      price: 60,
      sku: '',
      descriptionTh: '',
      descriptionEn: '',
      modifierGroupIds: [],
      inStock: true,
    });
  };

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: 'var(--color-bg-main)' }}>
      {/* Left Sidebar */}
      <aside
        style={{
          width: 220,
          minWidth: 220,
          background: 'var(--color-bg-card)',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
        }}
      >
        {/* Sidebar Header */}
        <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, color: '#fff', margin: 0 }}>
            {language === 'th' ? 'การจัดการหลังบ้าน' : 'Back-Office'}
          </h2>
          <p style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 3 }}>
            {settings.restaurantNameTh}
          </p>
        </div>

        {/* Sidebar Tabs */}
        <div style={{ padding: '8px 8px', display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {sidebarTabs
            .filter((tab) => {
              // Role-based visibility
              if (tab.ownerOnly && currentStaff?.role !== 'owner' && currentStaff?.role !== 'admin') {
                return false;
              }
              return true;
            })
            .map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setAdminSubTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: isActive
                      ? 'rgba(245, 158, 11, 0.12)'
                      : 'transparent',
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: 13,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                    borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
                  }}
                >
                  {tab.icon}
                  <span>{language === 'th' ? tab.labelTh : tab.labelEn}</span>
                </button>
              );
            })}
        </div>
      </aside>

      {/* Main Content Column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Main Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Sales KPI Cards Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 16,
              }}
            >
              {/* Gross Sales */}
              <div
                style={{
                  background: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    {language === 'th' ? 'ยอดขายรวมวันนี้ (Gross Sales)' : 'Gross Sales Today'}
                  </span>
                  <div style={{ padding: 6, borderRadius: 8, background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-primary)' }}>
                    <DollarSign size={18} />
                  </div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                  ฿{grossSales.toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                  {language === 'th' ? `นับรวมเงินสด, PromptPay, บัตรเครดิต` : 'Cash + PromptPay + Card'}
                </div>
              </div>

              {/* PromptPay Sales */}
              <div
                style={{
                  background: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    PromptPay QR
                  </span>
                  <div style={{ padding: 6, borderRadius: 8, background: 'rgba(255, 255, 255, 0.06)', color: '#fff' }}>
                    <QrCode size={18} />
                  </div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                  ฿{currentShift.promptpaySales.toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                  {grossSales > 0 ? Math.round((currentShift.promptpaySales / grossSales) * 100) : 0}% {language === 'th' ? 'ของยอดขายทั้งหมด' : 'of total revenue'}
                </div>
              </div>

              {/* Cash Sales */}
              <div
                style={{
                  background: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    {language === 'th' ? 'เงินสด (Cash)' : 'Cash in Hand'}
                  </span>
                  <div style={{ padding: 6, borderRadius: 8, background: 'rgba(255, 255, 255, 0.06)', color: '#fff' }}>
                    <Banknote size={18} />
                  </div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                  ฿{currentShift.cashSales.toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                  {grossSales > 0 ? Math.round((currentShift.cashSales / grossSales) * 100) : 0}% {language === 'th' ? 'ของยอดขายทั้งหมด' : 'of total revenue'}
                </div>
              </div>

              {/* Average Bill Size */}
              <div
                style={{
                  background: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    {language === 'th' ? 'ยอดเฉลี่ยต่อบิล' : 'Average Ticket Size'}
                  </span>
                  <div style={{ padding: 6, borderRadius: 8, background: 'rgba(255, 255, 255, 0.06)', color: '#fff' }}>
                    <ShoppingBag size={18} />
                  </div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                  ฿{avgBillSize.toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                  {totalBills} {language === 'th' ? 'บิลที่ชำระแล้ววันนี้' : 'bills served'}
                </div>
              </div>
            </div>

            {/* Shift & Cash Flow Audit Details */}
            <div
              style={{
                background: 'var(--color-bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                padding: 22,
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 14 }}>
                {language === 'th' ? 'การตรวจสอบเงินสด & ข้อมูลรอบกะ (Shift Ledger)' : 'Shift & Cash Ledger'}
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <div style={{ background: 'var(--color-bg-elevated)', padding: 14, borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{language === 'th' ? 'เงินทอนตอนเปิดกะ' : 'Opening Float'}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                    ฿{currentShift.openingFloat.toLocaleString()}
                  </div>
                </div>

                <div style={{ background: 'var(--color-bg-elevated)', padding: 14, borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{language === 'th' ? 'เบิกจ่ายออก (Pay-Outs)' : 'Petty Pay-Outs'}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#f87171', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                    -฿{currentShift.payOutsTotal.toLocaleString()}
                  </div>
                </div>

                <div style={{ background: 'var(--color-bg-elevated)', padding: 14, borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{language === 'th' ? 'เงินสดที่ต้องมีในลิ้นชัก' : 'Expected Drawer Cash'}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                    ฿{currentShift.expectedCash.toLocaleString()}
                  </div>
                </div>

                <div style={{ background: 'var(--color-bg-elevated)', padding: 14, borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{language === 'th' ? 'ผู้เปิดกะ' : 'Shift Opened By'}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginTop: 6 }}>
                    {currentShift.openedBy}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'menu' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>
                  {language === 'th' ? 'รายการเมนูอาหารทั้งหมด' : 'All Menu Dishes'} ({menuItems.length})
                </h3>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                  {language === 'th' ? 'สามารถเปิด/ปิดของหมด (86) หรือแก้ไขราคาได้ทันที' : 'Toggle 86 (out of stock) or edit pricing in real-time'}
                </p>
              </div>

              <button
                onClick={() => setIsAddingNew(true)}
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: 13 }}
              >
                <Plus size={16} />
                <span>{language === 'th' ? '+ เพิ่มเมนูใหม่' : '+ Add New Dish'}</span>
              </button>
            </div>

            {/* Menu Items Table */}
            <div
              style={{
                background: 'var(--color-bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                overflow: 'hidden',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--color-bg-elevated)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                    <th style={{ padding: '12px 16px' }}>{language === 'th' ? 'ชื่อเมนู' : 'Item Name'}</th>
                    <th style={{ padding: '12px 16px' }}>{language === 'th' ? 'หมวดหมู่' : 'Category'}</th>
                    <th style={{ padding: '12px 16px' }}>{language === 'th' ? 'ราคา (THB)' : 'Price'}</th>
                    <th style={{ padding: '12px 16px' }}>{language === 'th' ? 'ตัวเลือก (Modifiers)' : 'Modifiers'}</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>{language === 'th' ? 'สถานะของพร้อมขาย' : 'Stock Availability'}</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>{language === 'th' ? 'จัดการ' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody>
                  {menuItems.map((item) => {
                    const cat = categories.find((c) => c.id === item.categoryId);
                    return (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: '1px solid var(--color-border)',
                          background: item.inStock ? 'transparent' : 'rgba(239, 68, 68, 0.04)',
                        }}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 6, overflow: 'hidden', background: '#1e293b' }}>
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🍲</div>
                              )}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#fff' }}>{item.nameTh}</div>
                              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{item.nameEn} • {item.sku || 'SKU'}</div>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)' }}>
                          {cat ? (language === 'th' ? cat.nameTh : cat.nameEn) : '-'}
                        </td>

                        <td style={{ padding: '12px 16px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-primary)' }}>
                          ฿{item.price}
                        </td>

                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {item.modifierGroupIds.map((mgId) => {
                              const group = modifierGroups.find((g) => g.id === mgId);
                              return (
                                <span
                                  key={mgId}
                                  style={{
                                    fontSize: 10,
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                    background: 'var(--color-bg-elevated)',
                                    color: 'var(--color-text-secondary)',
                                  }}
                                >
                                  {group ? group.nameTh : mgId}
                                </span>
                              );
                            })}
                          </div>
                        </td>

                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <button
                            onClick={() => toggleItemStock(item.id)}
                            style={{
                              padding: '4px 12px',
                              borderRadius: 'var(--radius-full)',
                              border: 'none',
                              background: item.inStock ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                              color: item.inStock ? '#34d399' : '#f87171',
                              fontWeight: 700,
                              fontSize: 11,
                              cursor: 'pointer',
                            }}
                          >
                            {item.inStock ? (language === 'th' ? '✓ มีของพร้อมขาย' : 'In Stock') : (language === 'th' ? '✕ ของหมด (86)' : 'Sold Out')}
                          </button>
                        </td>

                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button
                            onClick={() => setEditingItem(item)}
                            style={{
                              background: 'var(--color-bg-elevated)',
                              border: '1px solid var(--color-border)',
                              color: 'var(--color-text-secondary)',
                              padding: '6px 10px',
                              borderRadius: 6,
                              cursor: 'pointer',
                            }}
                          >
                            <Edit2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Settings Tab Content */}
        {activeTab === 'settings' && (
          <div style={{ maxWidth: 840, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
            {/* Section 1: Taxes & Service Charge */}
            <div
              style={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--color-border)', paddingBottom: 14 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: 'rgba(245, 158, 11, 0.15)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Percent size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: 0 }}>
                    {language === 'th' ? 'ระบบค่าบริการ & ภาษีมูลค่าเพิ่ม' : 'Service Charge & Tax Settings'}
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                    {language === 'th'
                      ? 'เปิด-ปิดการคำนวณ Service Charge และ VAT ในระบบ (หากปิดใช้งานจะไม่แสดงในหน้ารายการบิล)'
                      : 'Toggle Service Charge and VAT calculation in orders and bills'}
                  </p>
                </div>
              </div>

              {/* Service Charge Toggle Card */}
              <div
                style={{
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid ' + (settingsForm.enableServiceCharge ? 'rgba(245, 158, 11, 0.4)' : 'var(--color-border)'),
                  borderRadius: 'var(--radius-md)',
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
                      {language === 'th' ? 'คิดค่าบริการ Service Charge' : 'Enable Service Charge'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                      {language === 'th'
                        ? 'บวกค่าบริการเพิ่มเติมจากยอดค่าอาหาร (ร้านอาหารทั่วไปมักไม่คิด หรือคิด 10%)'
                        : 'Add service charge percentage to the food bill'}
                    </div>
                  </div>

                  <label style={{ position: 'relative', display: 'inline-block', width: 50, height: 26, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settingsForm.enableServiceCharge}
                      onChange={(e) => setSettingsForm({ ...settingsForm, enableServiceCharge: e.target.checked })}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: settingsForm.enableServiceCharge ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.15)',
                        borderRadius: 26,
                        transition: '0.2s',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          content: '""',
                          height: 20,
                          width: 20,
                          left: settingsForm.enableServiceCharge ? 26 : 3,
                          bottom: 3,
                          backgroundColor: '#fff',
                          borderRadius: '50%',
                          transition: '0.2s',
                        }}
                      />
                    </span>
                  </label>
                </div>

                {settingsForm.enableServiceCharge && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 12, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <label style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                      {language === 'th' ? 'อัตรา Service Charge (%):' : 'Rate (%):'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={Math.round(settingsForm.serviceChargeRate * 100)}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          serviceChargeRate: (parseFloat(e.target.value) || 0) / 100,
                        })
                      }
                      style={{
                        width: 80,
                        padding: '6px 10px',
                        background: 'var(--color-bg-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 6,
                        color: '#fff',
                        fontSize: 14,
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                      }}
                    />
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>%</span>
                  </div>
                )}
              </div>

              {/* VAT Toggle Card */}
              <div
                style={{
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid ' + (settingsForm.enableVat ? 'rgba(59, 130, 246, 0.4)' : 'var(--color-border)'),
                  borderRadius: 'var(--radius-md)',
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
                      {language === 'th' ? 'คิดภาษีมูลค่าเพิ่ม (VAT 7%)' : 'Enable VAT (Value Added Tax)'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                      {language === 'th'
                        ? 'คำนวณและแสดงภาษีมูลค่าเพิ่มในบิล (หากร้านไม่ได้จดทะเบียน VAT แนะนำให้ปิดส่วนนี้)'
                        : 'Calculate and display VAT in customer receipts'}
                    </div>
                  </div>

                  <label style={{ position: 'relative', display: 'inline-block', width: 50, height: 26, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settingsForm.enableVat}
                      onChange={(e) => setSettingsForm({ ...settingsForm, enableVat: e.target.checked })}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: settingsForm.enableVat ? '#3b82f6' : 'rgba(255, 255, 255, 0.15)',
                        borderRadius: 26,
                        transition: '0.2s',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          content: '""',
                          height: 20,
                          width: 20,
                          left: settingsForm.enableVat ? 26 : 3,
                          bottom: 3,
                          backgroundColor: '#fff',
                          borderRadius: '50%',
                          transition: '0.2s',
                        }}
                      />
                    </span>
                  </label>
                </div>

                {settingsForm.enableVat && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 12, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <label style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                        {language === 'th' ? 'อัตราภาษี VAT (%):' : 'VAT Rate (%):'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={Math.round(settingsForm.vatRate * 100)}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            vatRate: (parseFloat(e.target.value) || 0) / 100,
                          })
                        }
                        style={{
                          width: 80,
                          padding: '6px 10px',
                          background: 'var(--color-bg-card)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 6,
                          color: '#fff',
                          fontSize: 14,
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                        }}
                      />
                      <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>%</span>
                    </div>

                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: '#fff' }}>
                        <input
                          type="radio"
                          name="vatType"
                          checked={settingsForm.isVatInclusive}
                          onChange={() => setSettingsForm({ ...settingsForm, isVatInclusive: true })}
                          style={{ accentColor: 'var(--color-primary)' }}
                        />
                        <span>{language === 'th' ? 'ราคารวม VAT แล้ว (Inclusive)' : 'VAT Inclusive'}</span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: '#fff' }}>
                        <input
                          type="radio"
                          name="vatType"
                          checked={!settingsForm.isVatInclusive}
                          onChange={() => setSettingsForm({ ...settingsForm, isVatInclusive: false })}
                          style={{ accentColor: 'var(--color-primary)' }}
                        />
                        <span>{language === 'th' ? 'บวก VAT เพิ่มจากราคาอาหาร (Exclusive)' : 'VAT Exclusive'}</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Restaurant & PromptPay Details */}
            <div
              style={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--color-border)', paddingBottom: 14 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: 'rgba(59, 130, 246, 0.15)',
                    color: '#60a5fa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Store size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: 0 }}>
                    {language === 'th' ? 'ข้อมูลร้านค้า & บัญชีพร้อมเพย์' : 'Store & Payment Info'}
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                    {language === 'th' ? 'ข้อมูลนี้จะแสดงบนหัวใบเสร็จรับเงิน และสร้าง QR Code พร้อมเพย์' : 'Appears on receipts and PromptPay QR'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>ชื่อร้าน (ภาษาไทย)</label>
                  <input
                    type="text"
                    value={settingsForm.restaurantNameTh}
                    onChange={(e) => setSettingsForm({ ...settingsForm, restaurantNameTh: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', marginTop: 4 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>ชื่อร้าน (ภาษาอังกฤษ)</label>
                  <input
                    type="text"
                    value={settingsForm.restaurantNameEn}
                    onChange={(e) => setSettingsForm({ ...settingsForm, restaurantNameEn: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', marginTop: 4 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>สาขา (Branch)</label>
                  <input
                    type="text"
                    value={settingsForm.branchName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, branchName: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', marginTop: 4 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>เลขประจำตัวผู้เสียภาษี (Tax ID)</label>
                  <input
                    type="text"
                    value={settingsForm.taxId}
                    onChange={(e) => setSettingsForm({ ...settingsForm, taxId: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', marginTop: 4 }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>ที่อยู่ร้าน (ภาษาไทย)</label>
                  <input
                    type="text"
                    value={settingsForm.addressTh || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, addressTh: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', marginTop: 4 }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>เบอร์โทรศัพท์ร้าน</label>
                  <input
                    type="text"
                    value={settingsForm.phone}
                    onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', marginTop: 4 }}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Payment Channels & Gateway Settings (ช่องทางจัดการเงิน) */}
            <div
              style={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 22,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--color-border)', paddingBottom: 14 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: 0 }}>
                    {language === 'th' ? 'ช่องทางรับชำระเงิน & เกตเวย์ (Payment Channels & Gateways)' : 'Payment Channels & Gateways'}
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                    {language === 'th'
                      ? 'เปิด-ปิดช่องทางรับเงิน (เงินสด, สแกน QR / พร้อมเพย์, บัตรเครดิต EDC / Online Gateway) พร้อมระบบอัปโหลดรูป QR และเชื่อมต่อ Payment Gateway'
                      : 'Toggle channels, configure QR scan / PromptPay upload, and setup card payment gateways'}
                  </p>
                </div>
              </div>

              {/* 3 Quick Channel Overview Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {/* 1. Cash Card */}
                <div
                  style={{
                    background: 'var(--color-bg-elevated)',
                    border: '1.5px solid ' + (settingsForm.paymentChannels?.cash.enabled ? 'rgba(16, 185, 129, 0.4)' : 'var(--color-border)'),
                    borderRadius: 'var(--radius-md)',
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#34d399',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Banknote size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>เงินสด (Cash)</div>
                        <div style={{ fontSize: 11, color: settingsForm.paymentChannels?.cash.enabled ? '#34d399' : 'var(--color-text-muted)' }}>
                          {settingsForm.paymentChannels?.cash.enabled ? '● เปิดใช้งาน' : '○ ปิดใช้งาน'}
                        </div>
                      </div>
                    </div>

                    <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={settingsForm.paymentChannels?.cash.enabled ?? true}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            paymentChannels: {
                              ...settingsForm.paymentChannels!,
                              cash: {
                                ...settingsForm.paymentChannels!.cash,
                                enabled: e.target.checked,
                              },
                            },
                          })
                        }
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: settingsForm.paymentChannels?.cash.enabled ? '#10b981' : 'rgba(255, 255, 255, 0.15)',
                          borderRadius: 24,
                          transition: '0.2s',
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            content: '""',
                            height: 18,
                            width: 18,
                            left: settingsForm.paymentChannels?.cash.enabled ? 23 : 3,
                            bottom: 3,
                            backgroundColor: '#fff',
                            borderRadius: '50%',
                            transition: '0.2s',
                          }}
                        />
                      </span>
                    </label>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                    รับเงินสดหน้าเคาน์เตอร์ คำนวณเงินทอนอัตโนมัติ และบันทึกเข้าเก๊ะเงินทอน
                  </div>
                </div>

                {/* 2. Scan / PromptPay Card */}
                <div
                  style={{
                    background: 'var(--color-bg-elevated)',
                    border: '1.5px solid ' + (settingsForm.paymentChannels?.scan.enabled ? 'rgba(59, 130, 246, 0.4)' : 'var(--color-border)'),
                    borderRadius: 'var(--radius-md)',
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: 'rgba(59, 130, 246, 0.15)',
                          color: '#60a5fa',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <QrCode size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>สแกน QR / พร้อมเพย์</div>
                        <div style={{ fontSize: 11, color: settingsForm.paymentChannels?.scan.enabled ? '#60a5fa' : 'var(--color-text-muted)' }}>
                          {settingsForm.paymentChannels?.scan.enabled ? '● เปิดใช้งาน' : '○ ปิดใช้งาน'}
                        </div>
                      </div>
                    </div>

                    <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={settingsForm.paymentChannels?.scan.enabled ?? true}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            paymentChannels: {
                              ...settingsForm.paymentChannels!,
                              scan: {
                                ...settingsForm.paymentChannels!.scan,
                                enabled: e.target.checked,
                              },
                            },
                          })
                        }
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: settingsForm.paymentChannels?.scan.enabled ? '#3b82f6' : 'rgba(255, 255, 255, 0.15)',
                          borderRadius: 24,
                          transition: '0.2s',
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            content: '""',
                            height: 18,
                            width: 18,
                            left: settingsForm.paymentChannels?.scan.enabled ? 23 : 3,
                            bottom: 3,
                            backgroundColor: '#fff',
                            borderRadius: '50%',
                            transition: '0.2s',
                          }}
                        />
                      </span>
                    </label>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                    {settingsForm.paymentChannels?.scan.qrType === 'custom_image' ? '🖼️ แสดงรูปภาพ QR ที่อัปโหลด' : '⚡ สร้าง PromptPay QR ยอดตรงอัตโนมัติ'}
                  </div>
                </div>

                {/* 3. Card & Gateway Card */}
                <div
                  style={{
                    background: 'var(--color-bg-elevated)',
                    border: '1.5px solid ' + (settingsForm.paymentChannels?.card.enabled ? 'rgba(245, 158, 11, 0.4)' : 'var(--color-border)'),
                    borderRadius: 'var(--radius-md)',
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: 'rgba(245, 158, 11, 0.15)',
                          color: 'var(--color-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <CreditCard size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>บัตรเครดิต & เกตเวย์</div>
                        <div style={{ fontSize: 11, color: settingsForm.paymentChannels?.card.enabled ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                          {settingsForm.paymentChannels?.card.enabled ? '● เปิดใช้งาน' : '○ ปิดใช้งาน'}
                        </div>
                      </div>
                    </div>

                    <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={settingsForm.paymentChannels?.card.enabled ?? true}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            paymentChannels: {
                              ...settingsForm.paymentChannels!,
                              card: {
                                ...settingsForm.paymentChannels!.card,
                                enabled: e.target.checked,
                              },
                            },
                          })
                        }
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: settingsForm.paymentChannels?.card.enabled ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.15)',
                          borderRadius: 24,
                          transition: '0.2s',
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            content: '""',
                            height: 18,
                            width: 18,
                            left: settingsForm.paymentChannels?.card.enabled ? 23 : 3,
                            bottom: 3,
                            backgroundColor: '#fff',
                            borderRadius: '50%',
                            transition: '0.2s',
                          }}
                        />
                      </span>
                    </label>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                    เกตเวย์: <strong style={{ color: '#fff' }}>{settingsForm.paymentChannels?.card.gatewayType.toUpperCase()}</strong> (ค่าธรรมเนียม {settingsForm.paymentChannels?.card.feePercentage}%)
                  </div>
                </div>
              </div>

              {/* Detailed Config Section: Scan Channel */}
              {settingsForm.paymentChannels?.scan.enabled && (
                <div
                  style={{
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <QrCode size={18} style={{ color: '#60a5fa' }} />
                      <h4 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>
                        {language === 'th' ? 'ตั้งค่าบัญชีสแกนรับเงิน & รูป QR (Scan & QR Setup)' : 'Scan & QR Account Configuration'}
                      </h4>
                    </div>
                    <span style={{ fontSize: 11, background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
                      Scan Channel Config
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>ธนาคาร / ผู้ให้บริการ</label>
                      <select
                        value={settingsForm.paymentChannels.scan.bankName}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            paymentChannels: {
                              ...settingsForm.paymentChannels!,
                              scan: {
                                ...settingsForm.paymentChannels!.scan,
                                bankName: e.target.value,
                              },
                            },
                          })
                        }
                        style={{ width: '100%', padding: '10px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', marginTop: 4 }}
                      >
                        <option value="PromptPay">พร้อมเพย์ (PromptPay)</option>
                        <option value="KBANK">ธนาคารกสิกรไทย (KBANK)</option>
                        <option value="SCB">ธนาคารไทยพาณิชย์ (SCB)</option>
                        <option value="BBL">ธนาคารกรุงเทพ (BBL)</option>
                        <option value="KTB">ธนาคารกรุงไทย (KTB)</option>
                        <option value="TTB">ธนาคารทหารไทยธนชาต (TTB)</option>
                        <option value="GSB">ธนาคารออมสิน (GSB)</option>
                        <option value="BAY">ธนาคารกรุงศรีอยุธยา (BAY)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>ชื่อบัญชีรับเงิน (Account Name)</label>
                      <input
                        type="text"
                        placeholder="เช่น นาย สมชาย บุญรอด (ตุ๋นมัน)"
                        value={settingsForm.paymentChannels.scan.accountName}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            promptPayName: e.target.value,
                            paymentChannels: {
                              ...settingsForm.paymentChannels!,
                              scan: {
                                ...settingsForm.paymentChannels!.scan,
                                accountName: e.target.value,
                              },
                            },
                          })
                        }
                        style={{ width: '100%', padding: '10px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', marginTop: 4 }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>เลขที่บัญชี / เบอร์พร้อมเพย์ (Account No. / PromptPay ID)</label>
                      <input
                        type="text"
                        placeholder="เช่น 081-987-6543 หรือ 0105563089421"
                        value={settingsForm.paymentChannels.scan.accountNumber}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            promptPayId: e.target.value,
                            paymentChannels: {
                              ...settingsForm.paymentChannels!,
                              scan: {
                                ...settingsForm.paymentChannels!.scan,
                                accountNumber: e.target.value,
                              },
                            },
                          })
                        }
                        style={{ width: '100%', padding: '10px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', marginTop: 4, fontFamily: 'var(--font-mono)' }}
                      />
                    </div>
                  </div>

                  {/* QR Presentation Mode Selector */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 6 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                      {language === 'th' ? 'รูปแบบการแสดงผล QR รับเงิน (QR Display Mode):' : 'QR Display Mode:'}
                    </label>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {/* Mode A: Dynamic PromptPay */}
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 12,
                          padding: 14,
                          background: settingsForm.paymentChannels.scan.qrType === 'generated' ? 'rgba(59, 130, 246, 0.15)' : 'var(--color-bg-card)',
                          border: '1.5px solid ' + (settingsForm.paymentChannels.scan.qrType === 'generated' ? '#3b82f6' : 'var(--color-border)'),
                          borderRadius: 8,
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="radio"
                          name="qrType"
                          checked={settingsForm.paymentChannels.scan.qrType === 'generated'}
                          onChange={() =>
                            setSettingsForm({
                              ...settingsForm,
                              paymentChannels: {
                                ...settingsForm.paymentChannels!,
                                scan: {
                                  ...settingsForm.paymentChannels!.scan,
                                  qrType: 'generated',
                                },
                              },
                            })
                          }
                          style={{ marginTop: 3, accentColor: '#3b82f6' }}
                        />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>⚡ สร้าง QR พร้อมเพย์ยอดตรงอัตโนมัติ (Dynamic QR)</span>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
                            ระบบจะแปลงเลขพร้อมเพย์และยอดบิลแต่ละออเดอร์เป็น QR Code มาตรฐาน EMVCo ทันที ลูกค้าสแกนแล้วยอดเงินจะขึ้นตรงตามบิล
                          </div>
                        </div>
                      </label>

                      {/* Mode B: Custom Static QR Standee Upload */}
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 12,
                          padding: 14,
                          background: settingsForm.paymentChannels.scan.qrType === 'custom_image' ? 'rgba(59, 130, 246, 0.15)' : 'var(--color-bg-card)',
                          border: '1.5px solid ' + (settingsForm.paymentChannels.scan.qrType === 'custom_image' ? '#3b82f6' : 'var(--color-border)'),
                          borderRadius: 8,
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="radio"
                          name="qrType"
                          checked={settingsForm.paymentChannels.scan.qrType === 'custom_image'}
                          onChange={() =>
                            setSettingsForm({
                              ...settingsForm,
                              paymentChannels: {
                                ...settingsForm.paymentChannels!,
                                scan: {
                                  ...settingsForm.paymentChannels!.scan,
                                  qrType: 'custom_image',
                                },
                              },
                            })
                          }
                          style={{ marginTop: 3, accentColor: '#3b82f6' }}
                        />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>🖼️ อัปโหลดรูป QR รับเงินของร้าน (Custom QR Upload)</span>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
                            อัปโหลดไฟล์รูปภาพป้าย QR Code บัญชีธนาคารหรือแม่มณีของทางร้าน สำหรับแสดงให้ลูกค้าสแกนบนหน้าจอชำระเงิน
                          </div>
                        </div>
                      </label>
                    </div>

                    {/* Custom QR Image Upload Box (shown if custom_image selected) */}
                    {settingsForm.paymentChannels.scan.qrType === 'custom_image' && (
                      <div
                        style={{
                          marginTop: 6,
                          background: 'var(--color-bg-card)',
                          border: '1px dashed rgba(59, 130, 246, 0.5)',
                          borderRadius: 8,
                          padding: 16,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 20,
                        }}
                      >
                        {settingsForm.paymentChannels.scan.customQrUrl ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%' }}>
                            <div
                              style={{
                                width: 100,
                                height: 100,
                                borderRadius: 8,
                                border: '1px solid var(--color-border)',
                                overflow: 'hidden',
                                background: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <img
                                src={settingsForm.paymentChannels.scan.customQrUrl}
                                alt="Custom QR Preview"
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              />
                            </div>

                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Check size={16} />
                                <span>อัปโหลดรูปภาพ QR รับเงินเรียบร้อยแล้ว</span>
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                                รูปภาพนี้จะแสดงบนหน้าต่างรับชำระเงินเมื่อลูกค้าเลือกชำระด้วยการสแกน QR
                              </div>

                              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                                <label
                                  className="btn-secondary"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '6px 12px',
                                    fontSize: 12,
                                    cursor: 'pointer',
                                  }}
                                >
                                  <Upload size={14} />
                                  <span>เปลี่ยนรูปภาพ</span>
                                  <input type="file" accept="image/*" onChange={handleCustomQrUpload} style={{ display: 'none' }} />
                                </label>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setSettingsForm({
                                      ...settingsForm,
                                      paymentChannels: {
                                        ...settingsForm.paymentChannels!,
                                        scan: {
                                          ...settingsForm.paymentChannels!.scan,
                                          customQrUrl: '',
                                          qrType: 'generated',
                                        },
                                      },
                                    })
                                  }
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '6px 12px',
                                    fontSize: 12,
                                    background: 'rgba(239, 68, 68, 0.15)',
                                    color: '#f87171',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: 6,
                                    cursor: 'pointer',
                                  }}
                                >
                                  <Trash2 size={14} />
                                  <span>ลบรูปภาพ</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '12px 0', gap: 8 }}>
                            <div
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: '50%',
                                background: 'rgba(59, 130, 246, 0.15)',
                                color: '#60a5fa',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Upload size={20} />
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                              คลิกเพื่อเลือกไฟล์รูปภาพ QR Code (PNG, JPG, WebP)
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                              แนะนำภาพสี่เหลี่ยมจัตุรัสที่มีความคมชัด เพื่อให้ลูกค้าสแกนได้สะดวกรวดเร็ว
                            </div>
                            <label
                              className="btn-primary"
                              style={{
                                marginTop: 6,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '8px 16px',
                                fontSize: 13,
                                cursor: 'pointer',
                              }}
                            >
                              <Upload size={15} />
                              <span>เลือกรูปภาพ QR</span>
                              <input type="file" accept="image/*" onChange={handleCustomQrUpload} style={{ display: 'none' }} />
                            </label>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Detailed Config Section: Card Gateway */}
              {settingsForm.paymentChannels?.card.enabled && (
                <div
                  style={{
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CreditCard size={18} style={{ color: 'var(--color-primary)' }} />
                      <h4 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>
                        {language === 'th' ? 'ตั้งค่าเครื่องรูดบัตร EDC & เกตเวย์ชำระเงิน (Card Gateway Setup)' : 'Card Payment Gateway Setup'}
                      </h4>
                    </div>
                    <span style={{ fontSize: 11, background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-primary)', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
                      Card Gateway Config
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>ผู้ให้บริการ Payment Gateway / เครื่อง EDC</label>
                      <select
                        value={settingsForm.paymentChannels.card.gatewayType}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            paymentChannels: {
                              ...settingsForm.paymentChannels!,
                              card: {
                                ...settingsForm.paymentChannels!.card,
                                gatewayType: e.target.value as CardGatewayType,
                              },
                            },
                          })
                        }
                        style={{ width: '100%', padding: '10px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', marginTop: 4, fontWeight: 600 }}
                      >
                        <option value="edc_terminal">📟 เครื่องรูดบัตร EDC ประจำร้าน (EDC Terminal - Manual / Slip Ref)</option>
                        <option value="kpayment">🟢 Kasikorn K-Payment Gateway (KBANK EDC / API)</option>
                        <option value="omise">🟣 Omise / Opn Payments Gateway</option>
                        <option value="stripe">💳 Stripe Payment Gateway</option>
                        <option value="gbprimepay">🔵 GB Prime Pay Gateway</option>
                        <option value="2c2p">🔶 2C2P Payment Gateway</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Terminal ID / รหัสเครื่อง EDC</label>
                      <input
                        type="text"
                        placeholder="เช่น EDC-882194 หรือ POS-T01"
                        value={settingsForm.paymentChannels.card.terminalId || ''}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            paymentChannels: {
                              ...settingsForm.paymentChannels!,
                              card: {
                                ...settingsForm.paymentChannels!.card,
                                terminalId: e.target.value,
                              },
                            },
                          })
                        }
                        style={{ width: '100%', padding: '10px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', marginTop: 4, fontFamily: 'var(--font-mono)' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Merchant ID (รหัสร้านค้าของผู้ให้บริการ)</label>
                      <input
                        type="text"
                        placeholder="เช่น MERCHANT-TH-001 หรือ 0105563089"
                        value={settingsForm.paymentChannels.card.merchantId || ''}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            paymentChannels: {
                              ...settingsForm.paymentChannels!,
                              card: {
                                ...settingsForm.paymentChannels!.card,
                                merchantId: e.target.value,
                              },
                            },
                          })
                        }
                        style={{ width: '100%', padding: '10px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', marginTop: 4, fontFamily: 'var(--font-mono)' }}
                      />
                    </div>

                    {settingsForm.paymentChannels.card.gatewayType !== 'edc_terminal' && (
                      <>
                        <div>
                          <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Public Key / API Key</label>
                          <input
                            type="text"
                            placeholder="pkey_test_..."
                            value={settingsForm.paymentChannels.card.apiKey || ''}
                            onChange={(e) =>
                              setSettingsForm({
                                ...settingsForm,
                                paymentChannels: {
                                  ...settingsForm.paymentChannels!,
                                  card: {
                                    ...settingsForm.paymentChannels!.card,
                                    apiKey: e.target.value,
                                  },
                                },
                              })
                            }
                            style={{ width: '100%', padding: '10px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', marginTop: 4, fontFamily: 'var(--font-mono)' }}
                          />
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Secret Key / Private Key</label>
                            <button
                              type="button"
                              onClick={() => setShowSecretKey(!showSecretKey)}
                              style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              {showSecretKey ? <EyeOff size={13} /> : <Eye size={13} />}
                              <span>{showSecretKey ? 'ซ่อน' : 'แสดง'}</span>
                            </button>
                          </div>
                          <input
                            type={showSecretKey ? 'text' : 'password'}
                            placeholder="skey_test_..."
                            value={settingsForm.paymentChannels.card.secretKey || ''}
                            onChange={(e) =>
                              setSettingsForm({
                                ...settingsForm,
                                paymentChannels: {
                                  ...settingsForm.paymentChannels!,
                                  card: {
                                    ...settingsForm.paymentChannels!.card,
                                    secretKey: e.target.value,
                                  },
                                },
                              })
                            }
                            style={{ width: '100%', padding: '10px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', marginTop: 4, fontFamily: 'var(--font-mono)' }}
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>อัตราค่าธรรมเนียมรูดบัตร (MDR / Processing Fee %)</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="10"
                          value={settingsForm.paymentChannels.card.feePercentage ?? 2.5}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              paymentChannels: {
                                ...settingsForm.paymentChannels!,
                                card: {
                                  ...settingsForm.paymentChannels!.card,
                                  feePercentage: parseFloat(e.target.value) || 0,
                                },
                              },
                            })
                          }
                          style={{ width: 100, padding: '10px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                        />
                        <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>%</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 22 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#fff' }}>
                        <input
                          type="checkbox"
                          checked={settingsForm.paymentChannels.card.passFeeToCustomer ?? false}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              paymentChannels: {
                                ...settingsForm.paymentChannels!,
                                card: {
                                  ...settingsForm.paymentChannels!.card,
                                  passFeeToCustomer: e.target.checked,
                                },
                              },
                            })
                          }
                          style={{ accentColor: 'var(--color-primary)' }}
                        />
                        <span>ส่งต่อค่าธรรมเนียมให้ลูกค้าชำระ (Surcharge)</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 4: Thermal Print Layout Settings (ตั้งค่ารูปแบบการพิมพ์สลิปและใบเสร็จ) */}
              <div
                style={{
                  background: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 22,
                  marginTop: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--color-border)', paddingBottom: 14 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Printer size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: 0 }}>
                      {language === 'th' ? 'ตั้งค่าการพิมพ์และสลิปความร้อน (Thermal Print Layout Settings)' : 'Thermal Print Layout Settings'}
                    </h3>
                    <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                      {language === 'th'
                        ? 'กำหนดขนาดกระดาษ (80mm / 58mm), หัวกระดาษ, ข้อความลงท้าย, และส่วนประกอบของสลิปแยกอิสระตามประเภทเอกสาร'
                        : 'Customize paper width, headers, footnotes, and layout elements for each print document type'}
                    </p>
                  </div>
                </div>

                {/* Print Layout Grid for each Document Type */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {[
                    {
                      key: 'qrSlip' as const,
                      titleTh: '1. สลิป QR Code สั่งอาหาร (Order QR Slip)',
                      titleEn: '1. Customer Order QR Slip',
                      descTh: 'สลิปพิมพ์ QR Code เพื่อให้ลูกค้าสแกนสั่งอาหารจากมือถือที่โต๊ะ',
                      descEn: 'Thermal slip with QR code printed for customer self-ordering at table',
                      icon: <QrCode size={18} style={{ color: '#f59e0b' }} />,
                    },
                    {
                      key: 'customerReceipt' as const,
                      titleTh: '2. ใบเสร็จรับเงิน / ใบเรียกเก็บเงิน (Customer Receipt & Bill)',
                      titleEn: '2. Customer Receipt & Bill',
                      descTh: 'ใบแจ้งยอดชำระและใบเสร็จรับเงินอย่างย่อสำหรับมอบให้ลูกค้า',
                      descEn: 'Thermal bill receipt given to customer upon checkout',
                      icon: <Receipt size={18} style={{ color: '#10b981' }} />,
                    },
                    {
                      key: 'kitchenTicket' as const,
                      titleTh: '3. ใบสั่งอาหารเข้าครัว (Kitchen KDS Ticket)',
                      titleEn: '3. Kitchen KDS Ticket',
                      descTh: 'สลิปรายการอาหารสำหรับส่งต่อให้เชฟและห้องครัว',
                      descEn: 'Thermal order ticket printed for kitchen & bar staff',
                      icon: <Utensils size={18} style={{ color: '#ef4444' }} />,
                    },
                    {
                      key: 'shiftSummary' as const,
                      titleTh: '4. ใบสรุปรายงานปิดกะ (Shift Summary Slip)',
                      titleEn: '4. Shift Summary Slip',
                      descTh: 'รายงานสรุปยอดขาย ลิ้นชักเงิน และส่วนต่างเมื่อปิดกะพนักงาน',
                      descEn: 'Shift closing report slip printed at shift end',
                      icon: <Clock size={18} style={{ color: '#60a5fa' }} />,
                    },
                  ].map((docType) => {
                    const defaultLayout = initialSettings.printLayouts![docType.key];
                    const currentLayout: SinglePrintLayoutConfig = {
                      ...defaultLayout,
                      ...(settingsForm.printLayouts?.[docType.key] || {}),
                    };

                    const updateLayout = (updates: Partial<SinglePrintLayoutConfig>) => {
                      setSettingsForm({
                        ...settingsForm,
                        printLayouts: {
                          ...(settingsForm.printLayouts || initialSettings.printLayouts!),
                          [docType.key]: {
                            ...currentLayout,
                            ...updates,
                          },
                        },
                      });
                    };

                    return (
                      <div
                        key={docType.key}
                        style={{
                          background: 'var(--color-bg-elevated)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 12,
                          padding: 16,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 14,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: 10, flexWrap: 'wrap', gap: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ padding: 6, borderRadius: 6, background: 'rgba(255,255,255,0.05)' }}>
                              {docType.icon}
                            </div>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>
                                {language === 'th' ? docType.titleTh : docType.titleEn}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                                {language === 'th' ? docType.descTh : docType.descEn}
                              </div>
                            </div>
                          </div>

                          {/* Paper Width Selector */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => updateLayout({ paperWidth: '80mm' })}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 700,
                                border: currentLayout.paperWidth === '80mm' ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                                background: currentLayout.paperWidth === '80mm' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                                color: currentLayout.paperWidth === '80mm' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                cursor: 'pointer',
                              }}
                            >
                              80mm (มาตรฐาน)
                            </button>
                            <button
                              type="button"
                              onClick={() => updateLayout({ paperWidth: '58mm' })}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 700,
                                border: currentLayout.paperWidth === '58mm' ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                                background: currentLayout.paperWidth === '58mm' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                                color: currentLayout.paperWidth === '58mm' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                cursor: 'pointer',
                              }}
                            >
                              58mm (มินิ)
                            </button>
                          </div>
                        </div>

                        {/* Controls Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                          {/* Header Title */}
                          <div>
                            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)' }}>หัวกระดาษ (Header Title)</label>
                            <input
                              type="text"
                              value={currentLayout.headerTitle}
                              onChange={(e) => updateLayout({ headerTitle: e.target.value })}
                              style={{ width: '100%', padding: '8px 10px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', fontSize: 12, marginTop: 4 }}
                            />
                          </div>

                          {/* Footnote */}
                          <div>
                            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)' }}>ข้อความลงท้าย (Footnote Text)</label>
                            <input
                              type="text"
                              value={currentLayout.footnote}
                              onChange={(e) => updateLayout({ footnote: e.target.value })}
                              style={{ width: '100%', padding: '8px 10px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', fontSize: 12, marginTop: 4 }}
                            />
                          </div>

                          {/* Font Size Scale */}
                          <div>
                            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)' }}>ขนาดตัวหนังสือ (Font Scale)</label>
                            <select
                              value={currentLayout.fontSizeScale}
                              onChange={(e) => updateLayout({ fontSizeScale: e.target.value as any })}
                              style={{ width: '100%', padding: '8px 10px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', fontSize: 12, marginTop: 4, cursor: 'pointer' }}
                            >
                              <option value="90">90% (ขนาดกระทัดรัด)</option>
                              <option value="100">100% (ขนาดปกติมาตรฐาน)</option>
                              <option value="110">110% (ขนาดใหญ่ อ่านง่าย)</option>
                            </select>
                          </div>
                        </div>

                        {/* Toggles */}
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', paddingTop: 4 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#fff', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={currentLayout.showLogo}
                              onChange={(e) => updateLayout({ showLogo: e.target.checked })}
                              style={{ accentColor: 'var(--color-primary)' }}
                            />
                            <span>แสดงโลโก้ร้าน</span>
                          </label>

                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#fff', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={currentLayout.showWifi}
                              onChange={(e) => updateLayout({ showWifi: e.target.checked })}
                              style={{ accentColor: 'var(--color-primary)' }}
                            />
                            <span>แสดงกล่อง WiFi ร้าน</span>
                          </label>

                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#fff', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={currentLayout.autoPrint}
                              onChange={(e) => updateLayout({ autoPrint: e.target.checked })}
                              style={{ accentColor: 'var(--color-primary)' }}
                            />
                            <span>สั่งพิมพ์อัตโนมัติ (Auto Print)</span>
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Save Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 14, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
                {saveSuccess && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#34d399', fontSize: 13, fontWeight: 700 }}>
                    <Check size={16} />
                    <span>{language === 'th' ? 'บันทึกการตั้งค่าช่องทางชำระเงินเรียบร้อยแล้ว!' : 'Settings saved!'}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="btn-primary"
                  style={{ padding: '12px 32px', fontSize: 14, fontWeight: 800 }}
                >
                  {language === 'th' ? 'บันทึกการตั้งค่าทั้งหมด' : 'Save All Settings'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'procurement' && <ProcurementPanel />}

        {activeTab === 'api_keys' && <AccountingApiPanel />}

        {activeTab === 'shifts' && <ShiftManagePage />}

        {activeTab === 'bills' && <BillLogs />}

        {activeTab === 'financing' && <FinancingPanel />}

        {activeTab === 'employees' && <EmployeePanel />}

      </div>

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="modal-overlay">
          <div className="modal-content-card" style={{ width: 480 }}>
            <div style={{ padding: '16px 20px', background: 'var(--color-bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>แก้ไขเมนู: {editingItem.nameTh}</h3>
              <button onClick={() => setEditingItem(null)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>ชื่อเมนูภาษาไทย</label>
                <input
                  type="text"
                  value={editingItem.nameTh}
                  onChange={(e) => setEditingItem({ ...editingItem, nameTh: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', marginTop: 4 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>ชื่อภาษาอังกฤษ</label>
                <input
                  type="text"
                  value={editingItem.nameEn}
                  onChange={(e) => setEditingItem({ ...editingItem, nameEn: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', marginTop: 4 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>ราคา (บาท)</label>
                <input
                  type="number"
                  value={editingItem.price}
                  onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '10px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', marginTop: 4 }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setEditingItem(null)} className="btn-secondary" style={{ flex: 1 }}>ยกเลิก</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>บันทึกการเปลี่ยนแปลง</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Item Modal */}
      {isAddingNew && (
        <div className="modal-overlay">
          <div className="modal-content-card" style={{ width: 480 }}>
            <div style={{ padding: '16px 20px', background: 'var(--color-bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>+ เพิ่มเมนูอาหารใหม่</h3>
              <button onClick={() => setIsAddingNew(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateNew} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>ชื่อเมนูภาษาไทย *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ต้มแซ่บหมูกระดูกอ่อน"
                  value={newForm.nameTh}
                  onChange={(e) => setNewForm({ ...newForm, nameTh: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', marginTop: 4 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>ชื่อภาษาอังกฤษ</label>
                <input
                  type="text"
                  placeholder="e.g. Spicy Pork Ribs Soup"
                  value={newForm.nameEn}
                  onChange={(e) => setNewForm({ ...newForm, nameEn: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', marginTop: 4 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>หมวดหมู่</label>
                  <select
                    value={newForm.categoryId}
                    onChange={(e) => setNewForm({ ...newForm, categoryId: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', marginTop: 4 }}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.nameTh}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>ราคา (บาท) *</label>
                  <input
                    type="number"
                    required
                    value={newForm.price}
                    onChange={(e) => setNewForm({ ...newForm, price: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '10px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', marginTop: 4 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setIsAddingNew(false)} className="btn-secondary" style={{ flex: 1 }}>ยกเลิก</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>เพิ่มเมนู</button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
