import React, { useState } from 'react';
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
} from 'lucide-react';
import type { MenuItem, AdminSubTab } from '../../types/pos';
import { BillLogs } from './BillLogs';
import { FinancingPanel } from './FinancingPanel';
import { EmployeePanel } from './EmployeePanel';

const sidebarTabs: { id: AdminSubTab; icon: React.ReactNode; labelTh: string; labelEn: string; ownerOnly?: boolean }[] = [
  { id: 'dashboard', icon: <TrendingUp size={16} />, labelTh: 'ภาพรวม & ยอดขาย', labelEn: 'Dashboard', ownerOnly: true },
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

  const activeTab = adminSubTab;
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState(() => ({ ...settings }));

  const handleSaveSettings = () => {
    updateSettings(settingsForm);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
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
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(217, 119, 6, 0.04))',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: 'var(--radius-lg)',
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
                  <div style={{ padding: 6, borderRadius: 8, background: 'rgba(245, 158, 11, 0.2)', color: 'var(--color-primary)' }}>
                    <DollarSign size={18} />
                  </div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                  ฿{grossSales.toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                  {language === 'th' ? `นับรวมเงินสด, PromptPay, บัตรเครดิต` : 'Cash + PromptPay + Card'}
                </div>
              </div>

              {/* PromptPay Sales */}
              <div
                style={{
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: 'var(--radius-lg)',
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
                  <div style={{ padding: 6, borderRadius: 8, background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>
                    <QrCode size={18} />
                  </div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#60a5fa', fontFamily: 'var(--font-mono)' }}>
                  ฿{currentShift.promptpaySales.toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                  {grossSales > 0 ? Math.round((currentShift.promptpaySales / grossSales) * 100) : 0}% {language === 'th' ? 'ของยอดขายทั้งหมด' : 'of total revenue'}
                </div>
              </div>

              {/* Cash Sales */}
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: 'var(--radius-lg)',
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
                  <div style={{ padding: 6, borderRadius: 8, background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
                    <Banknote size={18} />
                  </div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                  ฿{currentShift.cashSales.toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                  {grossSales > 0 ? Math.round((currentShift.cashSales / grossSales) * 100) : 0}% {language === 'th' ? 'ของยอดขายทั้งหมด' : 'of total revenue'}
                </div>
              </div>

              {/* Average Bill Size */}
              <div
                style={{
                  background: 'rgba(236, 72, 153, 0.08)',
                  border: '1px solid rgba(236, 72, 153, 0.25)',
                  borderRadius: 'var(--radius-lg)',
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
                  <div style={{ padding: 6, borderRadius: 8, background: 'rgba(236, 72, 153, 0.2)', color: '#f472b6' }}>
                    <ShoppingBag size={18} />
                  </div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#f472b6', fontFamily: 'var(--font-mono)' }}>
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

                <div>
                  <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>เบอร์มือถือหรือเลข Tax ID สำหรับพร้อมเพย์</label>
                  <input
                    type="text"
                    value={settingsForm.promptPayId}
                    onChange={(e) => setSettingsForm({ ...settingsForm, promptPayId: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', marginTop: 4 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>ชื่อบัญชีพร้อมเพย์</label>
                  <input
                    type="text"
                    value={settingsForm.promptPayName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, promptPayName: e.target.value })}
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

              {/* Save Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 10 }}>
                {saveSuccess && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#34d399', fontSize: 13, fontWeight: 700 }}>
                    <Check size={16} />
                    <span>{language === 'th' ? 'บันทึกการตั้งค่าเรียบร้อยแล้ว!' : 'Settings saved!'}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="btn-primary"
                  style={{ padding: '12px 28px', fontSize: 14, fontWeight: 800 }}
                >
                  {language === 'th' ? 'บันทึกการตั้งค่า' : 'Save Settings'}
                </button>
              </div>
            </div>
          </div>
        )}

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
