import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  Calculator,
  Flame,
  Layers,
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  Save,
  CheckCircle2,
  Sliders,
  Building2,
  Search,
  X,
  Scale,
} from 'lucide-react';
import type {
  MenuItemRecipe,
  RecipeIngredient,
  RecipeUnit,
  StoreType,
} from '../../types/pos';

export const CogsFoundationPanel: React.FC = () => {
  const {
    language,
    menuItems,
    categories,
    inventory,
    foundationConfig,
    menuRecipes,
    updateFoundationConfig,
    updateMenuItemRecipe,
    updateInventoryItem,
    setAdminSubTab,
  } = usePOS();

  // Top Tabs: 'cogs_matrix' | 'cost_benchmarks' | 'batch_calculator' | 'store_foundation'
  const [activeSubTab, setActiveSubTab] = useState<'cogs_matrix' | 'cost_benchmarks' | 'batch_calculator' | 'store_foundation'>('cogs_matrix');

  // Filters for Recipe Matrix
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [costStatusFilter, setCostStatusFilter] = useState<'all' | 'healthy' | 'moderate' | 'high'>('all');

  // Active Recipe Editing State
  const [editingRecipe, setEditingRecipe] = useState<MenuItemRecipe | null>(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);

  // Batch Yield Calculator State
  const [batchName, setBatchName] = useState('ต้มเนื้อเปื่อยตุ๋นยาจีน (สูตรหม้อใหญ่)');
  const [targetInventoryId, setTargetInventoryId] = useState(inventory[1]?.id || 'inv-2');
  const [rawWeightKg, setRawWeightKg] = useState(15);
  const [rawCostPerKg, setRawCostPerKg] = useState(220);
  const [seasoningCost, setSeasoningCost] = useState(280);
  const [gasFuelCost, setGasFuelCost] = useState(150);
  const [cookingShrinkagePct, setCookingShrinkagePct] = useState(30); // 30% shrinkage during braising
  const [portionGrams, setPortionGrams] = useState(80);
  const [batchSavedToast, setBatchSavedToast] = useState<string | null>(null);

  // Foundation Form State
  const [foundationForm, setFoundationForm] = useState({ ...foundationConfig });
  const [foundationSavedToast, setFoundationSavedToast] = useState(false);

  // Helper: Calculate Recipe Cost for a given Recipe
  const calculateRecipeCost = (recipe?: MenuItemRecipe) => {
    if (!recipe || !recipe.ingredients || recipe.ingredients.length === 0) {
      return { foodCost: 0, primeCost: 0, foodCostPct: 0, grossMargin: 0, grossMarginPct: 0, ingredientCosts: [] };
    }

    const ingredientCosts = recipe.ingredients.map((ing) => {
      const invItem = inventory.find((inv) => inv.id === ing.inventoryItemId);
      const unitCost = invItem ? invItem.avgCost : ing.unitCostSnapshot || 0;
      const wasteFactor = 1 + (ing.wastagePercent || 0) / 100;

      // Normalize quantity to inventory unit
      let normQty = ing.quantity;
      if (ing.unit === 'g' && invItem?.unit === 'kg') normQty = ing.quantity / 1000;
      if (ing.unit === 'ml' && invItem?.unit === 'L') normQty = ing.quantity / 1000;

      const totalCost = normQty * unitCost * wasteFactor;
      return {
        ...ing,
        invItem,
        unitCost,
        calculatedCost: totalCost,
      };
    });

    const foodCost = ingredientCosts.reduce((sum, item) => sum + item.calculatedCost, 0);
    const labor = recipe.prepCostLabor || foundationConfig.cogs.laborCostPerDishEstimate || 0;
    const packaging = recipe.packagingCost || 0;
    const overhead = recipe.overheadAllocation || foundationConfig.cogs.overheadCostPerDishEstimate || 0;
    const primeCost = foodCost + labor + packaging + overhead;

    const price = recipe.sellingPrice || 1;
    const foodCostPct = (foodCost / price) * 100;
    const grossMargin = price - foodCost;
    const grossMarginPct = ((price - foodCost) / price) * 100;

    return {
      foodCost,
      labor,
      packaging,
      overhead,
      primeCost,
      foodCostPct,
      grossMargin,
      grossMarginPct,
      ingredientCosts,
    };
  };

  // Summary Metrics across all menu items
  const allCalculations = menuItems.map((item) => {
    const recipe = menuRecipes[item.id] || {
      menuItemId: item.id,
      menuItemNameTh: item.nameTh,
      sellingPrice: item.price,
      ingredients: [],
      prepCostLabor: foundationConfig.cogs.laborCostPerDishEstimate,
      packagingCost: 0,
      overheadAllocation: foundationConfig.cogs.overheadCostPerDishEstimate,
    };
    return {
      item,
      recipe,
      calc: calculateRecipeCost(recipe),
    };
  });

  const dishesWithRecipe = allCalculations.filter((c) => c.recipe.ingredients.length > 0);
  const avgFoodCostPct =
    dishesWithRecipe.length > 0
      ? dishesWithRecipe.reduce((sum, c) => sum + c.calc.foodCostPct, 0) / dishesWithRecipe.length
      : 0;

  const avgGrossMarginPct =
    dishesWithRecipe.length > 0
      ? dishesWithRecipe.reduce((sum, c) => sum + c.calc.grossMarginPct, 0) / dishesWithRecipe.length
      : 0;

  // Filtered Menu Items for Display
  const filteredCalculations = allCalculations.filter(({ item, calc, recipe }) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.nameTh.toLowerCase().includes(q) || item.nameEn.toLowerCase().includes(q);
      const matchSku = item.sku?.toLowerCase().includes(q);
      if (!matchName && !matchSku) return false;
    }
    if (selectedCategory !== 'all' && item.categoryId !== selectedCategory) {
      return false;
    }
    if (costStatusFilter === 'healthy' && (calc.foodCostPct > foundationConfig.cogs.targetFoodCostPercent || recipe.ingredients.length === 0)) {
      return false;
    }
    if (costStatusFilter === 'moderate' && (calc.foodCostPct <= foundationConfig.cogs.targetFoodCostPercent || calc.foodCostPct > 45)) {
      return false;
    }
    if (costStatusFilter === 'high' && calc.foodCostPct <= 45 && recipe.ingredients.length > 0) {
      return false;
    }
    return true;
  });

  // Open Recipe Editor for Menu Item
  const handleOpenRecipeEditor = (item: typeof menuItems[0]) => {
    const existing = menuRecipes[item.id];
    if (existing) {
      setEditingRecipe({ ...existing, sellingPrice: item.price, menuItemNameTh: item.nameTh });
    } else {
      setEditingRecipe({
        menuItemId: item.id,
        menuItemNameTh: item.nameTh,
        sellingPrice: item.price,
        ingredients: [
          {
            id: `ing-${Date.now()}`,
            inventoryItemId: inventory[0]?.id || 'inv-1',
            nameTh: inventory[0]?.nameTh || 'วัตถุดิบหลัก',
            quantity: 0.1,
            unit: 'kg',
            wastagePercent: 3,
          },
        ],
        prepCostLabor: foundationConfig.cogs.laborCostPerDishEstimate,
        packagingCost: 0,
        overheadAllocation: foundationConfig.cogs.overheadCostPerDishEstimate,
        targetFoodCostPercent: foundationConfig.cogs.targetFoodCostPercent,
        notes: '',
      });
    }
    setShowRecipeModal(true);
  };

  // Add Ingredient row in Editor
  const handleAddIngredientRow = () => {
    if (!editingRecipe) return;
    const firstInv = inventory[0];
    const newIng: RecipeIngredient = {
      id: `ing-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      inventoryItemId: firstInv?.id || 'inv-1',
      nameTh: firstInv?.nameTh || 'วัตถุดิบ',
      quantity: 0.05,
      unit: (firstInv?.unit as RecipeUnit) || 'kg',
      wastagePercent: 3,
    };
    setEditingRecipe({
      ...editingRecipe,
      ingredients: [...editingRecipe.ingredients, newIng],
    });
  };

  // Update specific Ingredient row
  const handleUpdateIngredientRow = (idx: number, updates: Partial<RecipeIngredient>) => {
    if (!editingRecipe) return;
    const newIngredients = [...editingRecipe.ingredients];
    const current = newIngredients[idx];
    if (!current) return;

    if (updates.inventoryItemId && updates.inventoryItemId !== current.inventoryItemId) {
      const found = inventory.find((i) => i.id === updates.inventoryItemId);
      if (found) {
        updates.nameTh = found.nameTh;
        if (['kg', 'g', 'L', 'ml', 'pcs', 'pack', 'portion'].includes(found.unit)) {
          updates.unit = found.unit as RecipeUnit;
        }
      }
    }

    newIngredients[idx] = { ...current, ...updates };
    setEditingRecipe({ ...editingRecipe, ingredients: newIngredients });
  };

  // Remove Ingredient row
  const handleRemoveIngredientRow = (idx: number) => {
    if (!editingRecipe) return;
    setEditingRecipe({
      ...editingRecipe,
      ingredients: editingRecipe.ingredients.filter((_, i) => i !== idx),
    });
  };

  // Save Recipe BOM
  const handleSaveRecipe = () => {
    if (!editingRecipe) return;
    updateMenuItemRecipe(editingRecipe);
    setShowRecipeModal(false);
    setEditingRecipe(null);
  };

  // Batch Yield Calculation
  const rawBatchCost = rawWeightKg * rawCostPerKg;
  const totalBatchCost = rawBatchCost + seasoningCost + gasFuelCost;
  const cookedYieldWeightKg = rawWeightKg * (1 - cookingShrinkagePct / 100);
  const cookedCostPerKg = cookedYieldWeightKg > 0 ? totalBatchCost / cookedYieldWeightKg : 0;
  const totalPortionsYield = portionGrams > 0 ? (cookedYieldWeightKg * 1000) / portionGrams : 0;
  const costPerPortion = totalPortionsYield > 0 ? totalBatchCost / totalPortionsYield : 0;

  // Sync Batch Result to Inventory
  const handleSyncBatchToInventory = () => {
    const targetItem = inventory.find((i) => i.id === targetInventoryId);
    if (!targetItem) return;

    const newAvgCost = Math.round(cookedCostPerKg);
    updateInventoryItem({
      ...targetItem,
      avgCost: newAvgCost,
      currentStock: targetItem.currentStock + Number(cookedYieldWeightKg.toFixed(2)),
    });

    setBatchSavedToast(`✅ บันทึกสต็อกเข้าคลัง ${targetItem.nameTh} +${cookedYieldWeightKg.toFixed(2)} kg และปรับต้นทุนเฉลี่ยเป็น ฿${newAvgCost}/kg เรียบร้อยแล้ว!`);
    setTimeout(() => setBatchSavedToast(null), 4000);
  };

  // Save Foundation Config
  const handleSaveFoundation = () => {
    updateFoundationConfig(foundationForm);
    setFoundationSavedToast(true);
    setTimeout(() => setFoundationSavedToast(false), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1320, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(16, 185, 129, 0.12) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(245, 158, 11, 0.4)',
            }}
          >
            <Calculator size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>
                {language === 'th' ? 'ต้นทุนสินค้า CoGS & ตั้งค่ารากฐานร้านค้า' : 'Cost of Goods Sold (CoGS) & Foundation Setup'}
              </h2>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '3px 9px',
                  borderRadius: 20,
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                }}
              >
                Food Cost & BOM Active
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
              {language === 'th'
                ? 'คำนวณต้นทุนสูตรอาหาร (Recipe BOM), วิเคราะห์ Menu Engineering, คำนวณการตุ๋นหม้อใหญ่ และกำหนดกฎพื้นฐานร้านค้า'
                : 'Recipe Bill of Materials (BOM), Menu Engineering matrix, batch yield costing, and foundation rules'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => setAdminSubTab('raw_material_cost')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 16px',
              fontSize: 13,
              fontWeight: 600,
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#60a5fa',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
            }}
          >
            <Scale size={16} />
            <span>{language === 'th' ? '🥩 ต้นทุนวัตถุดิบ (Raw Material)' : 'Raw Material Costs'}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('batch_calculator')}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', fontSize: 13 }}
          >
            <Flame size={16} style={{ color: '#f59e0b' }} />
            <span>{language === 'th' ? 'คำนวณตุ๋นหม้อใหญ่' : 'Batch Calculator'}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('cogs_matrix')}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', fontSize: 13 }}
          >
            <Plus size={16} />
            <span>{language === 'th' ? 'แก้ไขสูตร BOM' : 'Manage BOM'}</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          background: 'var(--color-bg-card)',
          padding: 6,
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
        }}
      >
        {[
          { id: 'cogs_matrix' as const, labelTh: '1. สูตรอาหาร & ต้นทุน BOM', labelEn: '1. Recipe BOM Matrix', icon: <Layers size={16} /> },
          { id: 'cost_benchmarks' as const, labelTh: '2. เกณฑ์เป้าหมาย & ต้นทุนแฝง', labelEn: '2. Cost Benchmarks & Overheads', icon: <Sliders size={16} /> },
          { id: 'batch_calculator' as const, labelTh: '3. คำนวณตุ๋นชุดใหญ่ (Batch Yield)', labelEn: '3. Master Batch Yield', icon: <Flame size={16} /> },
          { id: 'store_foundation' as const, labelTh: '4. ตั้งค่ารากฐานระบบ & กฎร้าน', labelEn: '4. Store Foundation Setup', icon: <Building2 size={16} /> },
        ].map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px 16px',
                borderRadius: 6,
                border: 'none',
                background: isActive ? 'var(--color-primary)' : 'transparent',
                color: isActive ? '#000' : 'var(--color-text-secondary)',
                fontWeight: isActive ? 800 : 600,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {tab.icon}
              <span>{language === 'th' ? tab.labelTh : tab.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: COGS & RECIPE BOM MATRIX */}
      {/* ========================================================================= */}
      {activeSubTab === 'cogs_matrix' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Executive KPI Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {/* KPI 1: Food Cost % */}
            <div
              style={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                  {language === 'th' ? 'ต้นทุนอาหารเฉลี่ย (Food Cost %)' : 'Avg Food Cost %'}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: avgFoodCostPct <= foundationConfig.cogs.targetFoodCostPercent ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: avgFoodCostPct <= foundationConfig.cogs.targetFoodCostPercent ? '#34d399' : '#f87171',
                  }}
                >
                  เป้าหมาย: {foundationConfig.cogs.targetFoodCostPercent}%
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                {avgFoodCostPct.toFixed(1)}%
              </div>
              <div style={{ fontSize: 11, color: avgFoodCostPct <= foundationConfig.cogs.targetFoodCostPercent ? '#34d399' : 'var(--color-primary)' }}>
                {avgFoodCostPct <= foundationConfig.cogs.targetFoodCostPercent ? '✓ อยู่ในเกณฑ์ควบคุมได้ดีมาก' : '⚠️ สูงกว่าเกณฑ์เป้าหมายเล็กน้อย'}
              </div>
            </div>

            {/* KPI 2: Gross Margin % */}
            <div
              style={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                  {language === 'th' ? 'อัตรากำไรขั้นต้น (Gross Margin %)' : 'Avg Gross Margin %'}
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>
                  Target: {foundationConfig.cogs.targetGrossMarginPercent}%
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                {avgGrossMarginPct.toFixed(1)}%
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                กำไรส่วนเกินเฉลี่ยต่อจาน ฿{(dishesWithRecipe.reduce((s, c) => s + c.calc.grossMargin, 0) / (dishesWithRecipe.length || 1)).toFixed(1)}
              </div>
            </div>

            {/* KPI 3: BOM Recipes Active */}
            <div
              style={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                  {language === 'th' ? 'เมนูที่ผูกสูตร BOM ครบ' : 'Recipes Configured'}
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(245, 158, 11, 0.2)', color: 'var(--color-primary)' }}>
                  Coverage
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                {dishesWithRecipe.length} <span style={{ fontSize: 14, color: 'var(--color-text-muted)', fontWeight: 500 }}>/ {menuItems.length} เมนู</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                ครอบคลุม {Math.round((dishesWithRecipe.length / (menuItems.length || 1)) * 100)}% ของรายการขายทั้งหมด
              </div>
            </div>

            {/* KPI 4: Stock Shrinkage Buffer */}
            <div
              style={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                  {language === 'th' ? 'เผื่อสูญเสีย & การตัดสต็อก' : 'Waste Buffer & Auto-Deduct'}
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
                  Auto Sync
                </span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                {foundationConfig.cogs.defaultWastageBufferPercent}%
              </div>
              <div style={{ fontSize: 11, color: '#34d399' }}>
                {foundationConfig.cogs.autoDeductStockOnOrder ? '⚡ ตัดสต็อกวัตถุดิบอัตโนมัติตามบิล' : '○ ไม่ได้เปิดตัดสต็อกอัตโนมัติ'}
              </div>
            </div>
          </div>

          {/* Menu Engineering (BCG Matrix) Highlights */}
          <div
            style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: 16,
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, background: 'rgba(16, 185, 129, 0.1)', borderRadius: 8, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ fontSize: 24 }}>🌟</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#34d399' }}>Stars (กำไรดี ขายดี)</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>ก๋วยเตี๋ยวเนื้อจัมโบ้, เกาเหลาพิเศษ</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, background: 'rgba(59, 130, 246, 0.1)', borderRadius: 8, border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <div style={{ fontSize: 24 }}>🚜</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#60a5fa' }}>Plowhorses (กำไรต่ำ ขายดี)</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>ก๋วยเตี๋ยวธรรมดา (แนะนำคุม portion)</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, background: 'rgba(245, 158, 11, 0.1)', borderRadius: 8, border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <div style={{ fontSize: 24 }}>🧩</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}>Puzzles (กำไรสูง ขายช้า)</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>หม้อไฟเนื้อ (แนะนำจัดโปร/ดันหน้าแรก)</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, background: 'rgba(239, 68, 68, 0.1)', borderRadius: 8, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <div style={{ fontSize: 24 }}>🐕</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f87171' }}>Dogs (กำไรต่ำ ขายช้า)</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>ไม่มีเมนูวิกฤตในขณะนี้</div>
              </div>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              background: 'var(--color-bg-card)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, maxWidth: 400 }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={15} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--color-text-muted)' }} />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อเมนู หรือ SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 32px',
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 6,
                    color: '#fff',
                    fontSize: 13,
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  padding: '8px 12px',
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  color: '#fff',
                  fontSize: 13,
                }}
              >
                <option value="all">ทุกหมวดหมู่อาหาร</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.nameTh}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={costStatusFilter}
                onChange={(e) => setCostStatusFilter(e.target.value as any)}
                style={{
                  padding: '8px 12px',
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  color: '#fff',
                  fontSize: 13,
                }}
              >
                <option value="all">สถานะต้นทุนทั้งหมด</option>
                <option value="healthy">🟩 ต้นทุนดีมาก (&lt;={foundationConfig.cogs.targetFoodCostPercent}%)</option>
                <option value="moderate">🟨 ปานกลาง ({foundationConfig.cogs.targetFoodCostPercent}-45%)</option>
                <option value="high">🟥 ต้นทุนสูง (&gt;45%)</option>
              </select>
            </div>
          </div>

          {/* Recipe BOM Master Table */}
          <div
            style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--color-bg-elevated)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                  <th style={{ padding: '14px 18px' }}>รายการเมนู & SKU</th>
                  <th style={{ padding: '14px 18px' }}>ราคาขาย (THB)</th>
                  <th style={{ padding: '14px 18px' }}>สูตรวัตถุดิบ BOM</th>
                  <th style={{ padding: '14px 18px' }}>ต้นทุนอาหาร (Food Cost)</th>
                  <th style={{ padding: '14px 18px' }}>Food Cost %</th>
                  <th style={{ padding: '14px 18px' }}>กำไรขั้นต้น (Margin)</th>
                  <th style={{ padding: '14px 18px', textAlign: 'center' }}>สถานะ</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>จัดการสูตร</th>
                </tr>
              </thead>
              <tbody>
                {filteredCalculations.map(({ item, recipe, calc }) => {
                  const hasIngredients = recipe.ingredients.length > 0;
                  const isHealthy = calc.foodCostPct <= foundationConfig.cogs.targetFoodCostPercent;
                  const isHighCost = calc.foodCostPct > 45;

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        background: hasIngredients ? 'transparent' : 'rgba(255, 255, 255, 0.01)',
                      }}
                    >
                      {/* Menu Name */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', background: '#1e293b', flexShrink: 0 }}>
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🍲</div>
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: '#fff' }}>{item.nameTh}</div>
                            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                              {item.nameEn} • <code style={{ color: 'var(--color-primary)' }}>{item.sku || 'SKU'}</code>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Selling Price */}
                      <td style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#fff' }}>
                        ฿{item.price}
                      </td>

                      {/* Ingredients Preview */}
                      <td style={{ padding: '14px 18px' }}>
                        {hasIngredients ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 260 }}>
                            {recipe.ingredients.slice(0, 3).map((ing, idx) => (
                              <span
                                key={idx}
                                style={{
                                  fontSize: 10,
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  background: 'var(--color-bg-elevated)',
                                  color: 'var(--color-text-secondary)',
                                  border: '1px solid rgba(255, 255, 255, 0.05)',
                                }}
                              >
                                {ing.nameTh} ({ing.quantity}{ing.unit})
                              </span>
                            ))}
                            {recipe.ingredients.length > 3 && (
                              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-primary)' }}>
                                +{recipe.ingredients.length - 3} อย่าง
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                            ยังไม่ได้กำหนดสูตร BOM
                          </span>
                        )}
                      </td>

                      {/* Food Cost ฿ */}
                      <td style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-primary)' }}>
                        {hasIngredients ? `฿${calc.foodCost.toFixed(2)}` : '-'}
                      </td>

                      {/* Food Cost % */}
                      <td style={{ padding: '14px 18px' }}>
                        {hasIngredients ? (
                          <div>
                            <span
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 800,
                                color: isHealthy ? '#34d399' : isHighCost ? '#f87171' : 'var(--color-primary)',
                              }}
                            >
                              {calc.foodCostPct.toFixed(1)}%
                            </span>
                            <div style={{ width: 70, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${Math.min(calc.foodCostPct, 100)}%`,
                                  height: '100%',
                                  background: isHealthy ? '#34d399' : isHighCost ? '#f87171' : '#f59e0b',
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>

                      {/* Gross Margin */}
                      <td style={{ padding: '14px 18px' }}>
                        {hasIngredients ? (
                          <div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#34d399' }}>
                              ฿{calc.grossMargin.toFixed(2)}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                              Margin {calc.grossMarginPct.toFixed(1)}%
                            </div>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        {hasIngredients ? (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: 12,
                              background: isHealthy
                                ? 'rgba(16, 185, 129, 0.15)'
                                : isHighCost
                                ? 'rgba(239, 68, 68, 0.15)'
                                : 'rgba(245, 158, 11, 0.15)',
                              color: isHealthy ? '#34d399' : isHighCost ? '#f87171' : 'var(--color-primary)',
                              border: '1px solid ' + (isHealthy ? 'rgba(16, 185, 129, 0.3)' : isHighCost ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'),
                            }}
                          >
                            {isHealthy ? '✓ ต้นทุนดี' : isHighCost ? '⚠️ ต้นทุนสูง' : '● ปานกลาง'}
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                          <button
                            onClick={() => handleOpenRecipeEditor(item)}
                            className={hasIngredients ? 'btn-secondary' : 'btn-primary'}
                            style={{ padding: '6px 12px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <Edit3 size={13} />
                            <span>{hasIngredients ? 'แก้ไขสูตร BOM' : '+ กำหนดสูตร'}</span>
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

      {/* ========================================================================= */}
      {/* SUB-TAB 2: COST BENCHMARKS & OVERHEADS */}
      {/* ========================================================================= */}
      {activeSubTab === 'cost_benchmarks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sliders size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: 0 }}>
                  {language === 'th' ? 'เกณฑ์เป้าหมายต้นทุนอาหาร & เครื่องดื่ม (CoGS Benchmarks)' : 'Cost of Goods Sold Benchmarks'}
                </h3>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                  {language === 'th'
                    ? 'กำหนดอัตราส่วนต้นทุนเป้าหมาย เพื่อให้ระบบแจ้งเตือนเมื่อเมนูอาหารมีต้นทุนสูงเกินเกณฑ์'
                    : 'Configure benchmark target percentages to trigger cost warnings'}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {/* Target Food Cost */}
              <div style={{ background: 'var(--color-bg-elevated)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#fff', display: 'block', marginBottom: 6 }}>
                  เป้าหมายต้นทุนอาหาร (Target Food Cost %)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="number"
                    min="10"
                    max="60"
                    value={foundationForm.cogs.targetFoodCostPercent}
                    onChange={(e) =>
                      setFoundationForm({
                        ...foundationForm,
                        cogs: { ...foundationForm.cogs, targetFoodCostPercent: Number(e.target.value) },
                      })
                    }
                    style={{ width: 90, padding: '8px 12px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-mono)' }}
                  />
                  <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>%</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 8 }}>
                  มาตรฐานร้านอาหารจานด่วน / ก๋วยเตี๋ยว: 30 - 35%
                </div>
              </div>

              {/* Target Beverage Cost */}
              <div style={{ background: 'var(--color-bg-elevated)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#fff', display: 'block', marginBottom: 6 }}>
                  เป้าหมายต้นทุนเครื่องดื่ม (Target Beverage Cost %)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={foundationForm.cogs.targetBeverageCostPercent}
                    onChange={(e) =>
                      setFoundationForm({
                        ...foundationForm,
                        cogs: { ...foundationForm.cogs, targetBeverageCostPercent: Number(e.target.value) },
                      })
                    }
                    style={{ width: 90, padding: '8px 12px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-mono)' }}
                  />
                  <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>%</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 8 }}>
                  มาตรฐานเครื่องดื่ม / ชงเอง: 15 - 22%
                </div>
              </div>

              {/* Target Gross Margin */}
              <div style={{ background: 'var(--color-bg-elevated)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#fff', display: 'block', marginBottom: 6 }}>
                  เป้าหมายกำไรขั้นต้นรวม (Target Gross Margin %)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="number"
                    min="40"
                    max="90"
                    value={foundationForm.cogs.targetGrossMarginPercent}
                    onChange={(e) =>
                      setFoundationForm({
                        ...foundationForm,
                        cogs: { ...foundationForm.cogs, targetGrossMarginPercent: Number(e.target.value) },
                      })
                    }
                    style={{ width: 90, padding: '8px 12px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-mono)' }}
                  />
                  <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>%</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 8 }}>
                  เป้าหมายกำไรขั้นต้นรวมร้านอาหาร: 65 - 70%
                </div>
              </div>
            </div>

            {/* Waste Buffer & Prime Cost Estimates */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, paddingTop: 10 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
                  อัตราเผื่อสูญเสียตอนเตรียม (Default Prep Shrinkage Buffer %)
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={foundationForm.cogs.defaultWastageBufferPercent}
                  onChange={(e) =>
                    setFoundationForm({
                      ...foundationForm,
                      cogs: { ...foundationForm.cogs, defaultWastageBufferPercent: Number(e.target.value) },
                    })
                  }
                  style={{ width: '100%', padding: '10px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', fontFamily: 'var(--font-mono)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
                  ค่าแรงทางตรงต่อจานเฉลี่ย (Direct Labor Allocation ฿/dish)
                </label>
                <input
                  type="number"
                  min="0"
                  value={foundationForm.cogs.laborCostPerDishEstimate}
                  onChange={(e) =>
                    setFoundationForm({
                      ...foundationForm,
                      cogs: { ...foundationForm.cogs, laborCostPerDishEstimate: Number(e.target.value) },
                    })
                  }
                  style={{ width: '100%', padding: '10px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', fontFamily: 'var(--font-mono)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
                  ค่าใช้จ่ายดำเนินงานต่อจาน (Overhead / Gas / Utility ฿/dish)
                </label>
                <input
                  type="number"
                  min="0"
                  value={foundationForm.cogs.overheadCostPerDishEstimate}
                  onChange={(e) =>
                    setFoundationForm({
                      ...foundationForm,
                      cogs: { ...foundationForm.cogs, overheadCostPerDishEstimate: Number(e.target.value) },
                    })
                  }
                  style={{ width: '100%', padding: '10px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', fontFamily: 'var(--font-mono)' }}
                />
              </div>
            </div>

            {/* Auto Deduct Stock Toggle */}
            <div
              style={{
                background: 'var(--color-bg-elevated)',
                borderRadius: 'var(--radius-md)',
                padding: 16,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid ' + (foundationForm.cogs.autoDeductStockOnOrder ? 'rgba(16, 185, 129, 0.4)' : 'var(--color-border)'),
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                  ⚡ ตัดสต็อกวัตถุดิบอัตโนมัติตามบิลขายจริง (Real-time Inventory Decrement)
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                  เมื่อแคชเชียร์รับชำระเงินออเดอร์สำเร็จ ระบบจะตัดยอดวัตถุดิบในคลัง (Inventory) ตามสัดส่วนสูตร BOM ทันที
                </div>
              </div>

              <label style={{ position: 'relative', display: 'inline-block', width: 48, height: 24, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={foundationForm.cogs.autoDeductStockOnOrder}
                  onChange={(e) =>
                    setFoundationForm({
                      ...foundationForm,
                      cogs: { ...foundationForm.cogs, autoDeductStockOnOrder: e.target.checked },
                    })
                  }
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: foundationForm.cogs.autoDeductStockOnOrder ? '#10b981' : 'rgba(255, 255, 255, 0.15)',
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
                      left: foundationForm.cogs.autoDeductStockOnOrder ? 27 : 3,
                      bottom: 3,
                      backgroundColor: '#fff',
                      borderRadius: '50%',
                      transition: '0.2s',
                    }}
                  />
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 10 }}>
              <button
                onClick={handleSaveFoundation}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', fontSize: 13 }}
              >
                <Save size={16} />
                <span>{language === 'th' ? 'บันทึกเกณฑ์เป้าหมาย' : 'Save Benchmarks'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: BATCH YIELD CALCULATOR (เครื่องคำนวณตุ๋นหม้อใหญ่) */}
      {/* ========================================================================= */}
      {activeSubTab === 'batch_calculator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {batchSavedToast && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.5)',
                color: '#34d399',
                padding: '12px 18px',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <CheckCircle2 size={18} />
              <span>{batchSavedToast}</span>
            </div>
          )}

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
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Flame size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: 0 }}>
                  {language === 'th' ? 'เครื่องคำนวณต้นทุนการตุ๋น & เตรียมสต็อกหม้อใหญ่ (Master Batch Costing)' : 'Master Batch Prep Costing'}
                </h3>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                  {language === 'th'
                    ? 'คำนวณอัตราการหดตัว (Cooking Shrinkage) ของเนื้อตุ๋น/น้ำซุปหม้อใหญ่ เพื่อหาต้นทุนสุทธิต่อกิโลกรัมและต่อชามที่แท้จริง พร้อมอัปเดตเข้าสต็อก'
                    : 'Calculate true cooked yield after shrinkage and update average cost per kg'}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {/* Left Column: Batch Parameters */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
                  1. ข้อมูลการต้ม / ตุ๋นวัตถุดิบดิบ (Input Parameters)
                </h4>

                <div>
                  <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>ชื่อชุดการผลิต (Batch Name)</label>
                  <input
                    type="text"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    style={{ width: '100%', padding: '10px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', marginTop: 4 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>สินค้าคงคลังปลายทางที่ต้องการอัปเดต (Target Inventory Item)</label>
                  <select
                    value={targetInventoryId}
                    onChange={(e) => setTargetInventoryId(e.target.value)}
                    style={{ width: '100%', padding: '10px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', marginTop: 4, fontWeight: 600 }}
                  >
                    {inventory.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.nameTh} (ปัจจุบัน ฿{inv.avgCost}/{inv.unit}, คงเหลือ {inv.currentStock} {inv.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>น้ำหนักเนื้อดิบตั้งต้น (kg)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      value={rawWeightKg}
                      onChange={(e) => setRawWeightKg(Number(e.target.value))}
                      style={{ width: '100%', padding: '10px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>ราคาซื้อเนื้อสด (฿/kg)</label>
                    <input
                      type="number"
                      min="0"
                      value={rawCostPerKg}
                      onChange={(e) => setRawCostPerKg(Number(e.target.value))}
                      style={{ width: '100%', padding: '10px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>ค่าเครื่องตุ๋นยาจีน/เครื่องเทศ (฿)</label>
                    <input
                      type="number"
                      min="0"
                      value={seasoningCost}
                      onChange={(e) => setSeasoningCost(Number(e.target.value))}
                      style={{ width: '100%', padding: '10px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', fontFamily: 'var(--font-mono)' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>ค่าแก๊ส & เชื้อเพลิงตุ๋น (฿)</label>
                    <input
                      type="number"
                      min="0"
                      value={gasFuelCost}
                      onChange={(e) => setGasFuelCost(Number(e.target.value))}
                      style={{ width: '100%', padding: '10px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>% การหดตัวตอนตุ๋น (Shrinkage %)</label>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={cookingShrinkagePct}
                      onChange={(e) => setCookingShrinkagePct(Number(e.target.value))}
                      style={{ width: '100%', padding: '10px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>ปริมาณเสิร์ฟต่อชาม (กรัม)</label>
                    <input
                      type="number"
                      min="10"
                      max="500"
                      value={portionGrams}
                      onChange={(e) => setPortionGrams(Number(e.target.value))}
                      style={{ width: '100%', padding: '10px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Calculated True Yield & Sync Button */}
              <div
                style={{
                  background: 'var(--color-bg-elevated)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1.5px solid rgba(245, 158, 11, 0.4)',
                  padding: 22,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                <h4 style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={18} style={{ color: 'var(--color-primary)' }} />
                  <span>ผลลัพธ์การคำนวณต้นทุนสุทธิ (Batch Yield Summary)</span>
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ background: 'var(--color-bg-card)', padding: 12, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>ต้นทุนรวมทั้งหม้อ (Total Cost)</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                      ฿{totalBatchCost.toLocaleString()}
                    </div>
                  </div>

                  <div style={{ background: 'var(--color-bg-card)', padding: 12, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>น้ำหนักสุกสุทธิ (Cooked Yield)</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                      {cookedYieldWeightKg.toFixed(2)} kg
                    </div>
                  </div>

                  <div style={{ background: 'var(--color-bg-card)', padding: 12, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>ต้นทุนต่อกิโลกรัมสุก (Cost/kg)</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                      ฿{cookedCostPerKg.toFixed(2)} /kg
                    </div>
                  </div>

                  <div style={{ background: 'var(--color-bg-card)', padding: 12, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>จำนวนชามที่เสิร์ฟได้ (Portions)</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#60a5fa', fontFamily: 'var(--font-mono)' }}>
                      ~{Math.floor(totalPortionsYield)} ชาม
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: 8,
                    padding: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                    💡 สรุปต้นทุนเนื้อตุ๋นต่อชาม ({portionGrams}g): <strong style={{ color: 'var(--color-primary)' }}>฿{costPerPortion.toFixed(2)} / ชาม</strong>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                    จากราคาเนื้อสด ฿{rawCostPerKg}/kg เมื่อหักการหดตัว {cookingShrinkagePct}% + เครื่องเทศและแก๊ส ต้นทุนที่แท้จริงจะอยู่ที่ ฿{cookedCostPerKg.toFixed(2)}/kg
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSyncBatchToInventory}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    padding: '12px 18px',
                    fontSize: 14,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    marginTop: 'auto',
                  }}
                >
                  <Save size={18} />
                  <span>📥 อัปเดตราคาและเพิ่มสต็อกเข้าคลังทันที</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: STORE FOUNDATION SETUP */}
      {/* ========================================================================= */}
      {activeSubTab === 'store_foundation' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {foundationSavedToast && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.5)',
                color: '#34d399',
                padding: '12px 18px',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <CheckCircle2 size={18} />
              <span>บันทึกการตั้งค่ารากฐานระบบเรียบร้อยแล้ว</span>
            </div>
          )}

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
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: 0 }}>
                  {language === 'th' ? 'รากฐานข้อมูลนิติบุคคล & กฎร้านค้า (Foundation Rules)' : 'Store Foundation Rules'}
                </h3>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                  {language === 'th'
                    ? 'กำหนดข้อมูลองค์กร เลขจดทะเบียน ภ.พ.20, รหัสสาขา, กฎเงินสดย่อยในลิ้นชัก, และรหัสบัญชี Chart of Accounts'
                    : 'Corporate registry, VAT 20, branch code, drawer limits, and chart of accounts'}
                </p>
              </div>
            </div>

            {/* Section A: Organization & Legal */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>ประเภทกิจการ (Store Type)</label>
                <select
                  value={foundationForm.storeType}
                  onChange={(e) => setFoundationForm({ ...foundationForm, storeType: e.target.value as StoreType })}
                  style={{ width: '100%', padding: '10px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', marginTop: 4, fontWeight: 600 }}
                >
                  <option value="dine_in_restaurant">🍜 ร้านอาหารแบบนั่งทาน (Dine-in Restaurant)</option>
                  <option value="quick_service">⚡ ฟาสต์ฟู้ด / สั่งด่วน (Quick Service)</option>
                  <option value="cafe_beverage">☕ คาเฟ่ & เครื่องดื่ม (Cafe & Beverage)</option>
                  <option value="buffet">🥩 บุฟเฟต์ / ปิ้งย่าง (Buffet)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>รหัสสาขา (Branch Code 5 หลัก)</label>
                <input
                  type="text"
                  value={foundationForm.branchCode}
                  onChange={(e) => setFoundationForm({ ...foundationForm, branchCode: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', marginTop: 4, fontFamily: 'var(--font-mono)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>เลขประจำตัวผู้เสียภาษี (ภ.พ.20 Tax ID)</label>
                <input
                  type="text"
                  value={foundationForm.vatRegistrationNumber}
                  onChange={(e) => setFoundationForm({ ...foundationForm, vatRegistrationNumber: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', marginTop: 4, fontFamily: 'var(--font-mono)' }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>ชื่อจดทะเบียนนิติบุคคลตาม ภ.พ.20 (Registered Company Name)</label>
                <input
                  type="text"
                  value={foundationForm.registeredCompanyName}
                  onChange={(e) => setFoundationForm({ ...foundationForm, registeredCompanyName: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', marginTop: 4 }}
                />
              </div>
            </div>

            {/* Section B: Cash Flow & Drawer Rules */}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 12px' }}>
                กฎเงินสดย่อย & เก๊ะเงินทอน (Cash Flow & Drawer Security)
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>เงินทอนตั้งต้นเปิดกะเริ่มต้น (Default Float ฿)</label>
                  <input
                    type="number"
                    value={foundationForm.defaultOpeningFloat}
                    onChange={(e) => setFoundationForm({ ...foundationForm, defaultOpeningFloat: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', marginTop: 4, fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>เพดานเงินสดในเก๊ะเตือนส่งเซฟ (Safe Drop Alert ฿)</label>
                  <input
                    type="number"
                    value={foundationForm.maxCashDrawerLimit}
                    onChange={(e) => setFoundationForm({ ...foundationForm, maxCashDrawerLimit: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', marginTop: 4, fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>เกณฑ์แจ้งเตือนเงินขาด/เกิน (Discrepancy Warning ฿)</label>
                  <input
                    type="number"
                    value={foundationForm.cashDiscrepancyWarningThreshold}
                    onChange={(e) => setFoundationForm({ ...foundationForm, cashDiscrepancyWarningThreshold: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', marginTop: 4, fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                  />
                </div>
              </div>
            </div>

            {/* Section C: Accounting Code Mappings */}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#60a5fa', margin: '0 0 12px' }}>
                ผังบัญชีเชื่อมโยงโปรแกรมบัญชี (Chart of Accounts Mapping)
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>รหัสบัญชีรายได้ขาย (Sales Revenue Code)</label>
                  <input
                    type="text"
                    value={foundationForm.accountingSalesCode}
                    onChange={(e) => setFoundationForm({ ...foundationForm, accountingSalesCode: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', marginTop: 4 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>รหัสบัญชีต้นทุนขายวัตถุดิบ (COGS Account Code)</label>
                  <input
                    type="text"
                    value={foundationForm.accountingCogsCode}
                    onChange={(e) => setFoundationForm({ ...foundationForm, accountingCogsCode: e.target.value })}
                    style={{ width: '100%', padding: '10px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', marginTop: 4 }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 10 }}>
              <button
                onClick={handleSaveFoundation}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', fontSize: 13 }}
              >
                <Save size={16} />
                <span>{language === 'th' ? 'บันทึกการตั้งค่ารากฐาน' : 'Save Foundation Settings'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RECIPE BOM EDITOR MODAL */}
      {/* ========================================================================= */}
      {showRecipeModal && editingRecipe && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div
            className="modal-content-card"
            style={{
              maxWidth: 820,
              width: '94%',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'var(--color-bg-card)',
              border: '1.5px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--color-border)', paddingBottom: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>🍲</span>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>
                    สูตรอาหาร & ต้นทุนวัตถุดิบ (Recipe BOM): {editingRecipe.menuItemNameTh}
                  </h3>
                </div>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                  ราคาขายปัจจุบัน: <strong style={{ color: 'var(--color-primary)' }}>฿{editingRecipe.sellingPrice}</strong> | ผูกกับสต็อกวัตถุดิบจริงเพื่อคำนวณต้นทุนต่อจาน
                </p>
              </div>

              <button
                onClick={() => {
                  setShowRecipeModal(false);
                  setEditingRecipe(null);
                }}
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Live Calculation Preview Banner */}
            {(() => {
              const currentCalc = calculateRecipeCost(editingRecipe);
              const isHealthy = currentCalc.foodCostPct <= foundationConfig.cogs.targetFoodCostPercent;
              return (
                <div
                  style={{
                    background: 'var(--color-bg-elevated)',
                    border: '1.5px solid ' + (isHealthy ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'),
                    borderRadius: 'var(--radius-md)',
                    padding: 16,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>ต้นทุนอาหาร (Food Cost)</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                      ฿{currentCalc.foodCost.toFixed(2)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Food Cost %</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: isHealthy ? '#34d399' : '#f59e0b', fontFamily: 'var(--font-mono)' }}>
                      {currentCalc.foodCostPct.toFixed(1)}%
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>ต้นทุนรวม Prime Cost</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                      ฿{currentCalc.primeCost.toFixed(2)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>กำไรขั้นต้น (Gross Margin)</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                      ฿{currentCalc.grossMargin.toFixed(2)} ({currentCalc.grossMarginPct.toFixed(1)}%)
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Ingredients Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                  รายการวัตถุดิบในสูตร ({editingRecipe.ingredients.length} รายการ)
                </label>
                <button
                  type="button"
                  onClick={handleAddIngredientRow}
                  className="btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', fontSize: 12 }}
                >
                  <Plus size={14} />
                  <span>+ เพิ่มวัตถุดิบ</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {editingRecipe.ingredients.map((ing, idx) => {
                  const invItem = inventory.find((i) => i.id === ing.inventoryItemId);
                  const wasteFactor = 1 + (ing.wastagePercent || 0) / 100;
                  let normQty = ing.quantity;
                  if (ing.unit === 'g' && invItem?.unit === 'kg') normQty = ing.quantity / 1000;
                  if (ing.unit === 'ml' && invItem?.unit === 'L') normQty = ing.quantity / 1000;
                  const itemCost = normQty * (invItem?.avgCost || 0) * wasteFactor;

                  return (
                    <div
                      key={ing.id || idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr 1fr 1.2fr 36px',
                        gap: 10,
                        alignItems: 'center',
                        background: 'var(--color-bg-elevated)',
                        padding: 10,
                        borderRadius: 8,
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      {/* 1. Inventory Item Select */}
                      <div>
                        <select
                          value={ing.inventoryItemId}
                          onChange={(e) => handleUpdateIngredientRow(idx, { inventoryItemId: e.target.value })}
                          style={{ width: '100%', padding: '7px 10px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600 }}
                        >
                          {inventory.map((inv) => (
                            <option key={inv.id} value={inv.id}>
                              {inv.nameTh} (฿{inv.avgCost}/{inv.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 2. Quantity */}
                      <div>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={ing.quantity}
                          onChange={(e) => handleUpdateIngredientRow(idx, { quantity: parseFloat(e.target.value) || 0 })}
                          style={{ width: '100%', padding: '7px 10px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                        />
                      </div>

                      {/* 3. Unit */}
                      <div>
                        <select
                          value={ing.unit}
                          onChange={(e) => handleUpdateIngredientRow(idx, { unit: e.target.value as RecipeUnit })}
                          style={{ width: '100%', padding: '7px 8px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', fontSize: 12 }}
                        >
                          <option value="kg">kg</option>
                          <option value="g">g (กรัม)</option>
                          <option value="L">L (ลิตร)</option>
                          <option value="ml">ml (มล.)</option>
                          <option value="pcs">pcs (ชิ้น/ขวด)</option>
                        </select>
                      </div>

                      {/* 4. Waste % */}
                      <div>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          placeholder="Waste %"
                          value={ing.wastagePercent || 0}
                          onChange={(e) => handleUpdateIngredientRow(idx, { wastagePercent: parseFloat(e.target.value) || 0 })}
                          style={{ width: '100%', padding: '7px 8px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', fontSize: 12, fontFamily: 'var(--font-mono)' }}
                        />
                      </div>

                      {/* 5. Live Calculated Cost ฿ */}
                      <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-primary)', fontSize: 13 }}>
                        ฿{itemCost.toFixed(2)}
                      </div>

                      {/* 6. Delete Button */}
                      <div>
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredientRow(idx)}
                          style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: 4 }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Prime Cost Additions (Labor & Overhead) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, borderTop: '1px solid var(--color-border)', paddingTop: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>ค่าแรงทางตรงต่อจาน (Labor ฿)</label>
                <input
                  type="number"
                  value={editingRecipe.prepCostLabor || 0}
                  onChange={(e) => setEditingRecipe({ ...editingRecipe, prepCostLabor: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', marginTop: 4 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>ค่าบรรจุภัณฑ์/แก้ว/กล่อง (Packaging ฿)</label>
                <input
                  type="number"
                  value={editingRecipe.packagingCost || 0}
                  onChange={(e) => setEditingRecipe({ ...editingRecipe, packagingCost: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', marginTop: 4 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>ค่าแก๊ส/ส่วนกลางต่อจาน (Overhead ฿)</label>
                <input
                  type="number"
                  value={editingRecipe.overheadAllocation || 0}
                  onChange={(e) => setEditingRecipe({ ...editingRecipe, overheadAllocation: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', marginTop: 4 }}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>หมายเหตุสูตร / เทคนิคการปรุง (Prep Notes)</label>
              <input
                type="text"
                placeholder="เช่น ลวกเส้น 8 วินาที, น้ำซุปอุณหภูมิ 85 องศา..."
                value={editingRecipe.notes || ''}
                onChange={(e) => setEditingRecipe({ ...editingRecipe, notes: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 6, color: '#fff', marginTop: 4 }}
              />
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: 14 }}>
              <button
                type="button"
                onClick={handleAddIngredientRow}
                className="btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 12 }}
              >
                <Plus size={14} />
                <span>+ เพิ่มรายการวัตถุดิบ</span>
              </button>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowRecipeModal(false);
                    setEditingRecipe(null);
                  }}
                  className="btn-secondary"
                  style={{ padding: '8px 18px', fontSize: 13 }}
                >
                  ยกเลิก
                </button>

                <button
                  type="button"
                  onClick={handleSaveRecipe}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 22px', fontSize: 13 }}
                >
                  <Save size={15} />
                  <span>บันทึกสูตรอาหาร BOM</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
