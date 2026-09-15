import React, { useState, useMemo } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Layers,
  Scale,
  Search,
  Plus,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Flame,
  RefreshCw,
  Sliders,
  History,
  Building2,
  ChevronDown,
  ChevronUp,
  X,
  Utensils,
} from 'lucide-react';
import type {
  RawMaterialCostItem,
  SupplierPriceQuote,
} from '../../types/pos';

export const RawMaterialCostPanel: React.FC = () => {
  const {
    rawMaterials,
    updateRawMaterialCost,
    addRawMaterialPriceRecord,
    addSupplierQuote,
    setPrimarySupplierQuote,
    addYieldTestRecord,
    resetRawMaterialsToDefault,
    menuRecipes,
  } = usePOS();

  // Active Sub-Tab
  const [activeSubTab, setActiveSubTab] = useState<
    'matrix' | 'trend_history' | 'quotes_compare' | 'price_simulator' | 'yield_lab'
  >('matrix');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'increased' | 'stable' | 'volatile'>('all');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Modals
  const [editingItem, setEditingItem] = useState<RawMaterialCostItem | null>(null);
  const [quotingItem, setQuotingItem] = useState<RawMaterialCostItem | null>(null);
  const [historyItem, setHistoryItem] = useState<RawMaterialCostItem | null>(null);
  const [yieldTestingItem, setYieldTestingItem] = useState<RawMaterialCostItem | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Quick helper toast
  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Categories list
  const categories = useMemo(() => {
    const cats = new Set<string>();
    rawMaterials.forEach((rm) => cats.add(rm.category));
    return Array.from(cats);
  }, [rawMaterials]);

  // Filtered Raw Materials
  const filteredItems = useMemo(() => {
    return rawMaterials.filter((item) => {
      const matchSearch =
        item.nameTh.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.primarySupplierName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchStatus = statusFilter === 'all' || item.priceStatus === statusFilter;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [rawMaterials, searchQuery, selectedCategory, statusFilter]);

  // Executive KPI Summary
  const kpis = useMemo(() => {
    const totalCount = rawMaterials.length;
    const volatileCount = rawMaterials.filter((r) => r.priceStatus === 'volatile' || r.priceChangePctMoM > 10).length;
    const increasedCount = rawMaterials.filter((r) => r.priceChangePctMoM > 0).length;

    // Average MoM price change
    const avgMoM =
      totalCount > 0
        ? Math.round(
            (rawMaterials.reduce((acc, curr) => acc + curr.priceChangePctMoM, 0) / totalCount) * 100
          ) / 100
        : 0;

    // Highest cost driver
    const sortedByUnitCost = [...rawMaterials].sort((a, b) => b.usableEdiblePortionCost - a.usableEdiblePortionCost);
    const topCostDriver = sortedByUnitCost[0];

    // Estimated monthly potential savings from multi-supplier quote differences
    let estimatedMonthlySavings = 0;
    rawMaterials.forEach((rm) => {
      if (rm.quotes.length > 1) {
        const lowestQuote = Math.min(...rm.quotes.map((q) => q.quotedPrice));
        const diff = rm.asPurchasedCost - lowestQuote;
        if (diff > 0) {
          // Assume average monthly consumption 50 units
          estimatedMonthlySavings += diff * 50;
        }
      }
    });

    return {
      totalCount,
      volatileCount,
      increasedCount,
      avgMoM,
      topCostDriver,
      estimatedMonthlySavings: Math.round(estimatedMonthlySavings),
    };
  }, [rawMaterials]);

  // Simulator State
  const [simAdjustments, setSimAdjustments] = useState<Record<string, number>>({});
  const handleSimChange = (itemId: string, pctChange: number) => {
    setSimAdjustments((prev) => ({
      ...prev,
      [itemId]: pctChange,
    }));
  };

  const resetSimulation = () => {
    setSimAdjustments({});
  };

  // Yield Lab State
  const [yieldForm, setYieldForm] = useState({
    asPurchasedKg: 10,
    ediblePortionKg: 9.5,
    cookedWeightKg: 6.8,
    testedBy: 'หัวหน้าพ่อครัว',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
      {/* Toast Notification */}
      {successToast && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: 'rgba(16, 185, 129, 0.95)',
            backdropFilter: 'blur(10px)',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 600,
            animation: 'fadeIn 0.3s ease-out',
          }}
        >
          <CheckCircle2 size={20} />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                letterSpacing: '0.5px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              RAW MATERIAL COSTING & MARKET TRACKER
            </span>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
              ระบบควบคุมต้นทุนวัตถุดิบ & การผันผวนราคาตลาด
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#fff' }}>
            🥩 จัดการต้นทุนวัตถุดิบ (Raw Material Cost)
          </h1>
          <p style={{ margin: '6px 0 0 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            คำนวณต้นทุนจริงรวมค่าขนส่ง (Landed Cost), อัตราสูญเสีย (Yield/Waste Factor), เปรียบเทียบราคาซัพพลายเออร์ และเชื่อมโยงสูตร BOM อัตโนมัติ
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              // Trigger bulk sync of all raw material costs into BOM Recipes
              rawMaterials.forEach((rm) => {
                updateRawMaterialCost(rm.id, { asPurchasedCost: rm.asPurchasedCost }, true);
              });
              showToast('⚡ ซิงค์ต้นทุนวัตถุดิบทั้งหมดเข้าสู่สูตรอาหาร (BOM Recipes) สำเร็จ');
            }}
            className="btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              fontSize: '0.9rem',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              color: '#fff',
            }}
          >
            <RefreshCw size={16} />
            <span>ซิงค์ต้นทุนสู่ BOM ทั้งหมด</span>
          </button>

          <button
            onClick={() => {
              if (confirm('ต้องการรีเซ็ตข้อมูลต้นทุนวัตถุดิบเป็นค่าตั้งต้นจากระบบหรือไม่?')) {
                resetRawMaterialsToDefault();
                showToast('รีเซ็ตข้อมูลต้นทุนวัตถุดิบเป็นค่าเริ่มต้นเรียบร้อย');
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              fontSize: '0.85rem',
              fontWeight: 600,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '10px',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
            }}
          >
            <History size={15} />
            <span>รีเซ็ตค่าเริ่มต้น</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Card 1: Total Items */}
        <div
          style={{
            backgroundColor: 'var(--color-bg-card)',
            borderRadius: '14px',
            padding: '18px 20px',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              color: '#60a5fa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
            }}
          >
            <Layers size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
              วัตถุดิบที่ติดตามต้นทุน
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>
              {kpis.totalCount}{' '}
              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                รายการ
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Average MoM Fluctuation */}
        <div
          style={{
            backgroundColor: 'var(--color-bg-card)',
            borderRadius: '14px',
            padding: '18px 20px',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor:
                kpis.avgMoM > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: kpis.avgMoM > 0 ? '#f87171' : '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {kpis.avgMoM > 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
              ความผันผวนเฉลี่ย (MoM)
            </div>
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: kpis.avgMoM > 0 ? '#f87171' : '#34d399',
              }}
            >
              {kpis.avgMoM > 0 ? `+${kpis.avgMoM}%` : `${kpis.avgMoM}%`}
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  marginLeft: '6px',
                  color: 'var(--color-text-secondary)',
                }}
              >
                ({kpis.increasedCount} รายการขึ้นราคา)
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Top Cost Driver */}
        <div
          style={{
            backgroundColor: 'var(--color-bg-card)',
            borderRadius: '14px',
            padding: '18px 20px',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              color: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Flame size={24} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
              ต้นทุนสูงสุดต่อหน่วย (Top Cost)
            </div>
            <div
              style={{
                fontSize: '1.1rem',
                fontWeight: 800,
                color: '#fff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {kpis.topCostDriver?.nameTh || '-'}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#fbbf24', fontWeight: 700 }}>
              ฿{kpis.topCostDriver?.usableEdiblePortionCost.toFixed(2)} /{kpis.topCostDriver?.unit} (จริง)
            </div>
          </div>
        </div>

        {/* Card 4: Volatile Items Alert */}
        <div
          style={{
            backgroundColor: 'var(--color-bg-card)',
            borderRadius: '14px',
            padding: '18px 20px',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor:
                kpis.volatileCount > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: kpis.volatileCount > 0 ? '#ef4444' : '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
              สินค้าผันผวนสูง (&gt;10%)
            </div>
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: kpis.volatileCount > 0 ? '#ef4444' : '#10b981',
              }}
            >
              {kpis.volatileCount}{' '}
              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                รายการ
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: '12px',
          overflowX: 'auto',
        }}
      >
        {[
          { id: 'matrix', label: '📊 รายการต้นทุน & Landed Cost', icon: <DollarSign size={17} /> },
          { id: 'trend_history', label: '📈 ประวัติราคา & กราฟแนวโน้ม', icon: <History size={17} /> },
          { id: 'quotes_compare', label: '⚖️ เปรียบเทียบราคาซัพพลายเออร์', icon: <Building2 size={17} /> },
          { id: 'price_simulator', label: '🎯 จำลองผลกระทบต้นทุน (What-If)', icon: <Sliders size={17} /> },
          { id: 'yield_lab', label: '🔪 คำนวณ Yield & Waste ทิ้ง', icon: <Scale size={17} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backgroundColor:
                activeSubTab === tab.id ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.03)',
              color: activeSubTab === tab.id ? '#fff' : 'var(--color-text-secondary)',
              border:
                activeSubTab === tab.id
                  ? '1px solid var(--color-primary)'
                  : '1px solid rgba(255, 255, 255, 0.08)',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ============================================================== */}
      {/* TAB 1: RAW MATERIAL COST MATRIX                                */}
      {/* ============================================================== */}
      {activeSubTab === 'matrix' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Controls: Search, Category Filter, Status Filter */}
          <div
            style={{
              backgroundColor: 'var(--color-bg-card)',
              padding: '16px 20px',
              borderRadius: '14px',
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '14px',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', gap: '12px', flex: '1 1 300px', alignItems: 'center' }}>
              <div
                style={{
                  position: 'relative',
                  flex: '1',
                }}
              >
                <Search
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-secondary)',
                  }}
                />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อวัตถุดิบ, SKU, ซัพพลายเออร์..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    backgroundColor: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '0.85rem',
                }}
              >
                <option value="all">ทุกสถานะราคา</option>
                <option value="increased">📈 ราคาปรับขึ้น</option>
                <option value="stable">⚖️ ราคาคงที่</option>
                <option value="volatile">⚠️ ผันผวนสูง (&gt;10%)</option>
              </select>
            </div>

            {/* Category Pills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setSelectedCategory('all')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: selectedCategory === 'all' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                  color: selectedCategory === 'all' ? '#60a5fa' : 'var(--color-text-secondary)',
                  border:
                    selectedCategory === 'all'
                      ? '1px solid #3b82f6'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                ทั้งหมด ({rawMaterials.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor:
                      selectedCategory === cat ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                    color: selectedCategory === cat ? '#60a5fa' : 'var(--color-text-secondary)',
                    border:
                      selectedCategory === cat
                        ? '1px solid #3b82f6'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  {cat.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Table Container */}
          <div
            style={{
              backgroundColor: 'var(--color-bg-card)',
              borderRadius: '16px',
              border: '1px solid var(--color-border)',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      fontSize: '0.85rem',
                      color: 'var(--color-text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    <th style={{ padding: '14px 18px' }}>วัตถุดิบ / หมวดหมู่</th>
                    <th style={{ padding: '14px 16px' }}>ราคาซื้อ (AP)</th>
                    <th style={{ padding: '14px 16px' }}>ค่าส่ง/จัดการ</th>
                    <th style={{ padding: '14px 16px' }}>Landed Cost</th>
                    <th style={{ padding: '14px 16px' }}>สูญเสีย/หดตัว</th>
                    <th style={{ padding: '14px 16px', color: '#60a5fa' }}>ต้นทุนใช้จริง (EP)</th>
                    <th style={{ padding: '14px 16px' }}>แนวโน้ม (MoM)</th>
                    <th style={{ padding: '14px 16px' }}>Supplier หลัก</th>
                    <th style={{ padding: '14px 18px', textAlign: 'center' }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => {
                    const isExpanded = expandedItemId === item.id;
                    return (
                      <React.Fragment key={item.id}>
                        <tr
                          style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                            backgroundColor: isExpanded
                              ? 'rgba(59, 130, 246, 0.05)'
                              : 'transparent',
                            transition: 'background-color 0.15s ease',
                          }}
                        >
                          {/* Name & SKU */}
                          <td style={{ padding: '16px 18px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
                                {item.nameTh}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                <span
                                  style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--color-text-secondary)',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                  }}
                                >
                                  {item.sku}
                                </span>
                                <span
                                  style={{
                                    fontSize: '0.75rem',
                                    color: '#93c5fd',
                                  }}
                                >
                                  {item.category.split(' ')[0]}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* AP Cost */}
                          <td style={{ padding: '16px 16px' }}>
                            <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>
                              ฿{item.asPurchasedCost.toFixed(2)}
                              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 400 }}>
                                /{item.unit}
                              </span>
                            </div>
                          </td>

                          {/* Freight */}
                          <td style={{ padding: '16px 16px' }}>
                            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                              +฿{item.freightAndHandlingCostPerUnit.toFixed(2)}
                            </span>
                          </td>

                          {/* Landed Cost */}
                          <td style={{ padding: '16px 16px' }}>
                            <span style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.95rem' }}>
                              ฿{item.landedCost.toFixed(2)}
                            </span>
                          </td>

                          {/* Trimming / Cooking Loss */}
                          <td style={{ padding: '16px 16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span
                                style={{
                                  fontSize: '0.8rem',
                                  color: item.trimmingWastePct > 0 ? '#f87171' : 'var(--color-text-secondary)',
                                }}
                              >
                                ตัดทิ้ง: {item.trimmingWastePct}%
                              </span>
                              {item.cookingYieldPct < 100 && (
                                <span style={{ fontSize: '0.75rem', color: '#fbbf24' }}>
                                  สุกได้: {item.cookingYieldPct}%
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Usable EP Cost */}
                          <td style={{ padding: '16px 16px' }}>
                            <div
                              style={{
                                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                                padding: '6px 10px',
                                borderRadius: '8px',
                                display: 'inline-block',
                                border: '1px solid rgba(59, 130, 246, 0.3)',
                              }}
                            >
                              <span style={{ fontWeight: 800, color: '#60a5fa', fontSize: '1rem' }}>
                                ฿{item.usableEdiblePortionCost.toFixed(2)}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: '#93c5fd' }}>
                                /{item.unit}
                              </span>
                            </div>
                          </td>

                          {/* MoM Trend */}
                          <td style={{ padding: '16px 16px' }}>
                            {item.priceChangePctMoM > 0 ? (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  backgroundColor:
                                    item.priceChangePctMoM > 10
                                      ? 'rgba(239, 68, 68, 0.2)'
                                      : 'rgba(245, 158, 11, 0.15)',
                                  color: item.priceChangePctMoM > 10 ? '#ef4444' : '#fbbf24',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                }}
                              >
                                <TrendingUp size={14} />
                                +{item.priceChangePctMoM}%
                              </span>
                            ) : item.priceChangePctMoM < 0 ? (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                  color: '#34d399',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                }}
                              >
                                <TrendingDown size={14} />
                                {item.priceChangePctMoM}%
                              </span>
                            ) : (
                              <span
                                style={{
                                  color: 'var(--color-text-secondary)',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                }}
                              >
                                คงที่ (0%)
                              </span>
                            )}
                          </td>

                          {/* Primary Supplier */}
                          <td style={{ padding: '16px 16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span
                                style={{
                                  fontWeight: 600,
                                  color: '#e2e8f0',
                                  fontSize: '0.85rem',
                                  maxWidth: '180px',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {item.primarySupplierName}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                {item.quotes.length} ใบเสนอราคา
                              </span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '16px 18px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              <button
                                onClick={() => setEditingItem(item)}
                                title="แก้ไขต้นทุน & ค่าสูญเสีย"
                                style={{
                                  padding: '6px 10px',
                                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                                  color: '#60a5fa',
                                  border: '1px solid rgba(59, 130, 246, 0.3)',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                }}
                              >
                                <Edit2 size={14} />
                                <span>แก้ต้นทุน</span>
                              </button>

                              <button
                                onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                                title="ดูเมนูที่ได้รับผลกระทบ"
                                style={{
                                  padding: '6px 10px',
                                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                  color: 'var(--color-text-secondary)',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '0.8rem',
                                }}
                              >
                                <span>{item.usedInRecipeCount} เมนู</span>
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Menu Breakdown */}
                        {isExpanded && (
                          <tr style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
                            <td colSpan={9} style={{ padding: '16px 24px' }}>
                              <div
                                style={{
                                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                  padding: '14px 18px',
                                  borderRadius: '12px',
                                  border: '1px solid rgba(255, 255, 255, 0.08)',
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '10px',
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: '0.85rem',
                                      fontWeight: 700,
                                      color: '#93c5fd',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                    }}
                                  >
                                    <Utensils size={15} />
                                    รายการเมนูที่ใช้วัตถุดิบนี้ในสูตร (BOM Recipes ({item.usedInRecipes.length} เมนู)):
                                  </span>
                                  <button
                                    onClick={() => setYieldTestingItem(item)}
                                    style={{
                                      fontSize: '0.8rem',
                                      color: '#fbbf24',
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      fontWeight: 600,
                                    }}
                                  >
                                    <Scale size={14} />
                                    <span>บันทึกผลการทดสอบ Yield ล่าสุด</span>
                                  </button>
                                </div>

                                {item.usedInRecipes.length > 0 ? (
                                  <div
                                    style={{
                                      display: 'grid',
                                      gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                                      gap: '10px',
                                    }}
                                  >
                                    {item.usedInRecipes.map((rec) => (
                                      <div
                                        key={rec.menuItemId}
                                        style={{
                                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                          padding: '10px 14px',
                                          borderRadius: '8px',
                                          border: '1px solid rgba(255, 255, 255, 0.05)',
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                        }}
                                      >
                                        <div>
                                          <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.85rem' }}>
                                            {rec.menuItemNameTh}
                                          </div>
                                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                            ใช้ {rec.portionQty} {item.unit} / เสิร์ฟ
                                          </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                          <div style={{ fontWeight: 700, color: '#34d399', fontSize: '0.85rem' }}>
                                            ฿{rec.portionCost.toFixed(2)}
                                          </div>
                                          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                                            ต้นทุนส่วนผสมนี้
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                    ยังไม่ได้ผูกกับเมนูอาหารใด (เป็นวัตถุดิบทั่วไป หรือบรรจุภัณฑ์สิ้นเปลือง)
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: PRICE FLUCTUATION & TREND HISTORY                       */}
      {/* ============================================================== */}
      {activeSubTab === 'trend_history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              backgroundColor: 'var(--color-bg-card)',
              padding: '20px 24px',
              borderRadius: '16px',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
                  📈 ประวัติราคาและการเปลี่ยนแปลงรายไตรมาส (Price History Audit)
                </h3>
                <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                  บันทึกราคาซื้อจากบิลใบแจ้งหนี้จริงเพื่อตรวจจับการปรับขึ้นของราคาวัตถุดิบ
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {rawMaterials.map((rm) => (
                <div
                  key={rm.id}
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.25)',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{rm.nameTh}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{rm.sku}</div>
                      </div>
                      <span
                        style={{
                          backgroundColor: rm.priceChangePctMoM > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                          color: rm.priceChangePctMoM > 0 ? '#f87171' : '#34d399',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        {rm.priceChangePctMoM > 0 ? `+${rm.priceChangePctMoM}%` : `${rm.priceChangePctMoM}%`}
                      </span>
                    </div>

                    <div style={{ marginTop: '12px', display: 'flex', gap: '16px' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>ราคาซื้อปัจจุบัน:</span>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                          ฿{rm.asPurchasedCost.toFixed(2)} /{rm.unit}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>ราคาเฉลี่ยเดือนก่อน:</span>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                          ฿{rm.lastMonthAvgPrice.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Timeline records */}
                    <div style={{ marginTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '10px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#93c5fd', fontWeight: 600 }}>ประวัติบันทึกล่าสุด:</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                        {rm.history.map((h) => (
                          <div
                            key={h.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '0.8rem',
                              color: 'var(--color-text-secondary)',
                            }}
                          >
                            <span>📅 {h.date}</span>
                            <span style={{ fontWeight: 600, color: '#e2e8f0' }}>฿{h.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <button
                      onClick={() => setHistoryItem(rm)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                        color: '#60a5fa',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <Plus size={14} />
                      <span>บันทึกราคาซื้อใหม่จากบิล</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: MULTI-SUPPLIER QUOTES COMPARISON                        */}
      {/* ============================================================== */}
      {activeSubTab === 'quotes_compare' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              backgroundColor: 'var(--color-bg-card)',
              padding: '20px 24px',
              borderRadius: '16px',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
                  ⚖️ ตารางเปรียบเทียบราคาเสนอซื้อจากคู่ค้า (Supplier Quotation Matrix)
                </h3>
                <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                  เปรียบเทียบราคา, ขั้นต่ำสั่งซื้อ (MOQ), ระยะเวลาจัดส่ง และเครดิตเทอมเพื่อเลือกคู่ค้าที่คุ้มค่าที่สุด
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {rawMaterials.map((rm) => {
                const bestPrice = Math.min(...rm.quotes.map((q) => q.quotedPrice));
                return (
                  <div
                    key={rm.id}
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.25)',
                      borderRadius: '14px',
                      padding: '18px 20px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '10px',
                        marginBottom: '14px',
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>{rm.nameTh}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginLeft: '8px' }}>
                          ({rm.sku})
                        </span>
                      </div>
                      <button
                        onClick={() => setQuotingItem(rm)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          color: '#34d399',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Plus size={14} />
                        <span>เพิ่มใบเสนอราคาจาก Supplier อื่น</span>
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                      {rm.quotes.map((quote) => {
                        const isBestDeal = quote.quotedPrice === bestPrice;
                        return (
                          <div
                            key={quote.supplierId}
                            style={{
                              backgroundColor: quote.isPrimary
                                ? 'rgba(59, 130, 246, 0.1)'
                                : 'rgba(255, 255, 255, 0.03)',
                              borderRadius: '10px',
                              padding: '14px',
                              border: quote.isPrimary
                                ? '1px solid #3b82f6'
                                : '1px solid rgba(255, 255, 255, 0.06)',
                              position: 'relative',
                            }}
                          >
                            {quote.isPrimary && (
                              <span
                                style={{
                                  position: 'absolute',
                                  top: '-10px',
                                  right: '12px',
                                  backgroundColor: '#3b82f6',
                                  color: '#fff',
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: '10px',
                                }}
                              >
                                ซัพพลายเออร์หลัก
                              </span>
                            )}

                            <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem', marginBottom: '8px' }}>
                              {quote.supplierName}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: isBestDeal ? '#34d399' : '#fff' }}>
                                ฿{quote.quotedPrice.toFixed(2)}{' '}
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 400 }}>
                                  /{quote.unit}
                                </span>
                              </span>
                              {isBestDeal && (
                                <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700 }}>
                                  🌟 ราคาถูกที่สุด
                                </span>
                              )}
                            </div>

                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              <div>📦 ขั้นต่ำสั่งซื้อ (MOQ): {quote.moq} {quote.unit}</div>
                              <div>🚚 ระยะเวลาส่ง: {quote.leadTimeDays} วัน</div>
                              <div>💳 เครดิตเทอม: {quote.paymentTerm}</div>
                            </div>

                            {!quote.isPrimary && (
                              <button
                                onClick={() => {
                                  setPrimarySupplierQuote(rm.id, quote.supplierId);
                                  showToast(`เปลี่ยนซัพพลายเออร์หลักของ ${rm.nameTh} เป็น ${quote.supplierName} เรียบร้อย`);
                                }}
                                style={{
                                  width: '100%',
                                  marginTop: '10px',
                                  padding: '6px',
                                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                                  color: '#e2e8f0',
                                  border: '1px solid rgba(255, 255, 255, 0.15)',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                สลับเป็น Supplier หลัก
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: WHAT-IF PRICE IMPACT SIMULATOR                          */}
      {/* ============================================================== */}
      {activeSubTab === 'price_simulator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              backgroundColor: 'var(--color-bg-card)',
              padding: '20px 24px',
              borderRadius: '16px',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
                  🎯 เครื่องมือจำลองผลกระทบต้นทุนวัตถุดิบต่อเมนู (What-If Price Simulation)
                </h3>
                <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                  ทดสอบปรับราคาสินค้าขึ้น/ลงเพื่อดูผลกระทบต่อต้นทุนต่อชาม (Cost/Portion) และเปอร์เซ็นต์ Food Cost % ของแต่ละเมนู
                </p>
              </div>

              <button
                onClick={resetSimulation}
                style={{
                  padding: '8px 14px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: 'var(--color-text-secondary)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                รีเซ็ตการจำลอง
              </button>
            </div>

            {/* Sliders Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '24px' }}>
              {rawMaterials.slice(0, 6).map((rm) => {
                const currentPct = simAdjustments[rm.id] || 0;
                const simCost = rm.asPurchasedCost * (1 + currentPct / 100);
                return (
                  <div
                    key={rm.id}
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.25)',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.85rem' }}>{rm.nameTh}</span>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          color: currentPct > 0 ? '#f87171' : currentPct < 0 ? '#34d399' : 'var(--color-text-secondary)',
                        }}
                      >
                        {currentPct > 0 ? `+${currentPct}%` : `${currentPct}%`}
                      </span>
                    </div>

                    <input
                      type="range"
                      min="-30"
                      max="50"
                      step="5"
                      value={currentPct}
                      onChange={(e) => handleSimChange(rm.id, Number(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--color-primary)' }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      <span>เดิม: ฿{rm.asPurchasedCost}</span>
                      <span style={{ fontWeight: 700, color: '#fff' }}>จำลอง: ฿{simCost.toFixed(1)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Impacted Menu Table */}
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 700, color: '#93c5fd' }}>
                📊 ผลกระทบต่อเมนูอาหาร (Simulated Recipe Impact)
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px' }}>
                {Object.values(menuRecipes).map((recipe) => {
                  // Calculate baseline and simulated food cost
                  let baselineFoodCost = 0;
                  let simulatedFoodCost = 0;

                  recipe.ingredients.forEach((ing) => {
                    const rm = rawMaterials.find((r) => r.inventoryItemId === ing.inventoryItemId);
                    const baseUnitCost = ing.unitCostSnapshot || (rm ? rm.asPurchasedCost : 0);
                    const wasteFactor = 1 + (ing.wastagePercent || 0) / 100;
                    const ingBaseCost = ing.quantity * baseUnitCost * wasteFactor;
                    baselineFoodCost += ingBaseCost;

                    const pctAdj = rm ? simAdjustments[rm.id] || 0 : 0;
                    const simUnitCost = baseUnitCost * (1 + pctAdj / 100);
                    const ingSimCost = ing.quantity * simUnitCost * wasteFactor;
                    simulatedFoodCost += ingSimCost;
                  });

                  const basePct = recipe.sellingPrice > 0 ? (baselineFoodCost / recipe.sellingPrice) * 100 : 0;
                  const simPct = recipe.sellingPrice > 0 ? (simulatedFoodCost / recipe.sellingPrice) * 100 : 0;
                  const costDiff = simulatedFoodCost - baselineFoodCost;

                  return (
                    <div
                      key={recipe.menuItemId}
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '10px',
                        padding: '14px',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{recipe.menuItemNameTh}</span>
                        <span style={{ fontSize: '0.85rem', color: '#93c5fd', fontWeight: 600 }}>฿{recipe.sellingPrice}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
                        <span>ต้นทุนอาหารเดิม: ฿{baselineFoodCost.toFixed(2)} ({basePct.toFixed(1)}%)</span>
                        <span style={{ fontWeight: 700, color: costDiff > 0 ? '#f87171' : '#34d399' }}>
                          จำลอง: ฿{simulatedFoodCost.toFixed(2)} ({simPct.toFixed(1)}%)
                        </span>
                      </div>

                      {costDiff > 0 && (
                        <div
                          style={{
                            marginTop: '8px',
                            padding: '6px 8px',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            color: '#f87171',
                            display: 'flex',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span>ต้นทุนเพิ่มขึ้น: +฿{costDiff.toFixed(2)} /ชาม</span>
                          <span>ควรปรับราคาขายเป็น: ฿{Math.ceil((simulatedFoodCost / 0.32) / 5) * 5}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: YIELD & TRIMMING WASTE CALIBRATOR                       */}
      {/* ============================================================== */}
      {activeSubTab === 'yield_lab' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            style={{
              backgroundColor: 'var(--color-bg-card)',
              padding: '20px 24px',
              borderRadius: '16px',
              border: '1px solid var(--color-border)',
            }}
          >
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
              🔪 เครื่องมือคำนวณและทดสอบ Yield วัตถุดิบ (Yield & Trimming Calibrator)
            </h3>
            <p style={{ margin: '0 0 20px 0', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
              เครื่องมือสำหรับหัวหน้าพ่อครัวบันทึกการตัดแต่งเนื้อสด (Trimming Loss) และการหดตัวจากการต้มตุ๋น (Cooking Shrinkage)
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {/* Yield Input Form */}
              <div
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  padding: '18px 20px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <h4 style={{ margin: '0 0 14px 0', color: '#93c5fd', fontSize: '0.95rem' }}>
                  📝 ป้อนค่าน้ำหนักทดสอบ (Test Batch Input)
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                      น้ำหนักซื้อตั้งต้น (As Purchased - AP Weight)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={yieldForm.asPurchasedKg}
                      onChange={(e) => setYieldForm({ ...yieldForm, asPurchasedKg: Number(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                      น้ำหนักเนื้อใช้ได้หลังตัดแต่ง (Edible Portion - EP Weight)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={yieldForm.ediblePortionKg}
                      onChange={(e) => setYieldForm({ ...yieldForm, ediblePortionKg: Number(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                      น้ำหนักเนื้อหลังต้มสุก (Cooked Yield Weight)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={yieldForm.cookedWeightKg}
                      onChange={(e) => setYieldForm({ ...yieldForm, cookedWeightKg: Number(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Real-time Calculation Result */}
              {(() => {
                const trimLossPct =
                  yieldForm.asPurchasedKg > 0
                    ? Math.round(
                        ((yieldForm.asPurchasedKg - yieldForm.ediblePortionKg) / yieldForm.asPurchasedKg) *
                          10000
                      ) / 100
                    : 0;

                const cookShrinkPct =
                  yieldForm.ediblePortionKg > 0
                    ? Math.round(
                        ((yieldForm.ediblePortionKg - yieldForm.cookedWeightKg) / yieldForm.ediblePortionKg) *
                          10000
                      ) / 100
                    : 0;

                const sampleApCost = 240; // ฿240/kg
                const realCostPerCookedKg =
                  yieldForm.cookedWeightKg > 0
                    ? Math.round(((yieldForm.asPurchasedKg * sampleApCost) / yieldForm.cookedWeightKg) * 100) /
                      100
                    : 0;

                return (
                  <div
                    style={{
                      backgroundColor: 'rgba(59, 130, 246, 0.08)',
                      padding: '18px 20px',
                      borderRadius: '12px',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <h4 style={{ margin: '0 0 14px 0', color: '#60a5fa', fontSize: '0.95rem' }}>
                        📊 ผลลัพธ์การวิเคราะห์ Yield อัตโนมัติ
                      </h4>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                          <span style={{ color: 'var(--color-text-secondary)' }}>เปอร์เซ็นต์เศษตัดแต่งทิ้ง (Trimming Loss):</span>
                          <span style={{ fontWeight: 700, color: '#f87171' }}>{trimLossPct}%</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                          <span style={{ color: 'var(--color-text-secondary)' }}>การหดตัวจากการต้ม (Shrinkage Loss):</span>
                          <span style={{ fontWeight: 700, color: '#fbbf24' }}>{cookShrinkPct}%</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                          <span style={{ color: 'var(--color-text-secondary)' }}>ผลผลิตเนื้อสุกสุทธิ (Net Cooked Yield %):</span>
                          <span style={{ fontWeight: 700, color: '#34d399' }}>{(100 - cookShrinkPct).toFixed(1)}%</span>
                        </div>

                        <div
                          style={{
                            marginTop: '12px',
                            paddingTop: '12px',
                            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                          }}
                        >
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                            ตัวอย่างต้นทุนจริง (จากราคาซื้อ ฿{sampleApCost}/กก.):
                          </span>
                          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
                            ฿{realCostPerCookedKg.toFixed(2)}{' '}
                            <span style={{ fontSize: '0.85rem', color: '#60a5fa', fontWeight: 500 }}>
                              /กก. เนื้อสุกพร้อมเสิร์ฟ
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        showToast(`บันทึกผลการทดสอบ Yield (ตัดทิ้ง ${trimLossPct}%, หดตัว ${cookShrinkPct}%) เรียบร้อย`);
                      }}
                      className="btn-primary"
                      style={{
                        marginTop: '16px',
                        padding: '10px',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      บันทึกผลการทดสอบเข้าสู่ระบบ
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: EDIT RAW MATERIAL COST                                  */}
      {/* ============================================================== */}
      {editingItem && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content-card" style={{ maxWidth: '520px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>✏️ ปรับปรุงต้นทุนวัตถุดิบ</h3>
                <span style={{ fontSize: '0.85rem', color: '#93c5fd' }}>{editingItem.nameTh}</span>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateRawMaterialCost(editingItem.id, editingItem, true);
                setEditingItem(null);
                showToast(`อัปเดตต้นทุน ${editingItem.nameTh} และซิงค์ BOM สำเร็จ`);
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                  ราคาซื้อต่อหน่วย (As Purchased AP Price) [฿/{editingItem.unit}]
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={editingItem.asPurchasedCost}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, asPurchasedCost: Number(e.target.value) })
                  }
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: 700,
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                    ค่าขนส่งต่อหน่วย (Freight ฿)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingItem.freightAndHandlingCostPerUnit}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        freightAndHandlingCostPerUnit: Number(e.target.value),
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                    % เศษตัดแต่งทิ้ง (Waste %)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={editingItem.trimmingWastePct}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        trimmingWastePct: Number(e.target.value),
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: 'var(--color-text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  บันทึก & ซิงค์สูตรอาหาร
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD SUPPLIER QUOTE                                      */}
      {/* ============================================================== */}
      {quotingItem && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content-card" style={{ maxWidth: '480px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>📋 เพิ่มใบเสนอราคาจาก Supplier</h3>
                <span style={{ fontSize: '0.85rem', color: '#93c5fd' }}>{quotingItem.nameTh}</span>
              </div>
              <button
                onClick={() => setQuotingItem(null)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as any;
                const newQuote: SupplierPriceQuote = {
                  supplierId: `sup-quote-${Date.now()}`,
                  supplierName: form.supplierName.value,
                  quotedPrice: Number(form.quotedPrice.value),
                  moq: Number(form.moq.value),
                  unit: quotingItem.unit,
                  leadTimeDays: Number(form.leadTimeDays.value),
                  paymentTerm: form.paymentTerm.value,
                  isPrimary: false,
                  lastUpdated: new Date().toISOString().slice(0, 10),
                };
                addSupplierQuote(quotingItem.id, newQuote);
                setQuotingItem(null);
                showToast(`เพิ่มใบเสนอราคาของ ${newQuote.supplierName} สำเร็จ`);
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                  ชื่อซัพพลายเออร์ / ร้านค้า
                </label>
                <input
                  name="supplierName"
                  required
                  placeholder="เช่น ซีพี เอ็กซ์ตร้า, ตลาดสี่มุมเมือง"
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                    ราคาเสนอซื้อ (฿/{quotingItem.unit})
                  </label>
                  <input
                    name="quotedPrice"
                    type="number"
                    step="0.1"
                    required
                    defaultValue={quotingItem.asPurchasedCost}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                    ขั้นต่ำสั่งซื้อ (MOQ)
                  </label>
                  <input
                    name="moq"
                    type="number"
                    required
                    defaultValue={10}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                    ระยะเวลาจัดส่ง (วัน)
                  </label>
                  <input
                    name="leadTimeDays"
                    type="number"
                    defaultValue={1}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                    เงื่อนไขชำระเงิน
                  </label>
                  <input
                    name="paymentTerm"
                    defaultValue="เครดิต 15 วัน"
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setQuotingItem(null)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: 'var(--color-text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                >
                  บันทึกใบเสนอราคา
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD PRICE HISTORY RECORD                                */}
      {/* ============================================================== */}
      {historyItem && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content-card" style={{ maxWidth: '460px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>📝 บันทึกราคาซื้อจริงจากบิล</h3>
                <span style={{ fontSize: '0.85rem', color: '#93c5fd' }}>{historyItem.nameTh}</span>
              </div>
              <button
                onClick={() => setHistoryItem(null)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as any;
                addRawMaterialPriceRecord(historyItem.id, {
                  date: form.date.value,
                  price: Number(form.price.value),
                  source: 'invoice',
                  supplierName: form.supplierName.value,
                  note: form.note.value,
                });
                setHistoryItem(null);
                showToast(`บันทึกประวัติราคาซื้อ ฿${form.price.value} สำเร็จ`);
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                  วันที่ตามใบแจ้งหนี้/บิล
                </label>
                <input
                  name="date"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                  ราคาซื้อจริงตามบิล (฿/{historyItem.unit})
                </label>
                <input
                  name="price"
                  type="number"
                  step="0.1"
                  required
                  defaultValue={historyItem.asPurchasedCost}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                  ชื่อซัพพลายเออร์ที่ซื้อ
                </label>
                <input
                  name="supplierName"
                  defaultValue={historyItem.primarySupplierName}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                  หมายเหตุ (เช่น รอบบิลปรับราคา, สินค้าโปรโมชั่น)
                </label>
                <input
                  name="note"
                  placeholder="เช่น ราคาพิเศษช่วงเทศกาล"
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setHistoryItem(null)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: 'var(--color-text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                >
                  บันทึกประวัติราคา
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD YIELD TEST RECORD                                   */}
      {/* ============================================================== */}
      {yieldTestingItem && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content-card" style={{ maxWidth: '480px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>🔪 บันทึกผลทดสอบ Yield & การตัดแต่ง</h3>
                <span style={{ fontSize: '0.85rem', color: '#93c5fd' }}>{yieldTestingItem.nameTh}</span>
              </div>
              <button
                onClick={() => setYieldTestingItem(null)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as any;
                const ap = Number(form.apWeight.value);
                const ep = Number(form.epWeight.value);
                const cooked = form.cookedWeight?.value ? Number(form.cookedWeight.value) : undefined;
                const trimLoss = ap > 0 ? Math.round(((ap - ep) / ap) * 10000) / 100 : 0;
                const cookShrink = ep > 0 && cooked ? Math.round(((ep - cooked) / ep) * 10000) / 100 : undefined;

                addYieldTestRecord(yieldTestingItem.id, {
                  testDate: form.date.value,
                  asPurchasedWeightKg: ap,
                  ediblePortionWeightKg: ep,
                  trimmingLossPct: trimLoss,
                  cookedWeightKg: cooked,
                  cookingShrinkagePct: cookShrink,
                  testedBy: form.testedBy.value,
                });
                setYieldTestingItem(null);
                showToast(`บันทึกผลทดสอบ Yield เรียบร้อย (ตัดทิ้ง ${trimLoss}%)`);
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                  วันที่ทดสอบ
                </label>
                <input
                  name="date"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                    น้ำหนักซื้อ (AP กก.)
                  </label>
                  <input
                    name="apWeight"
                    type="number"
                    step="0.1"
                    required
                    defaultValue={10}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                    น้ำหนักเนื้อใช้ได้จริง (EP กก.)
                  </label>
                  <input
                    name="epWeight"
                    type="number"
                    step="0.1"
                    required
                    defaultValue={9.5}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                  น้ำหนักหลังต้มสุก (ไม่บังคับ - กก.)
                </label>
                <input
                  name="cookedWeight"
                  type="number"
                  step="0.1"
                  placeholder="เช่น 6.8 กก."
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                  ผู้ทดสอบ
                </label>
                <input
                  name="testedBy"
                  defaultValue="พ่อครัวอาทิตย์"
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setYieldTestingItem(null)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: 'var(--color-text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                >
                  บันทึกผลการทดสอบ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
