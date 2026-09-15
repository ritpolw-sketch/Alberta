import React, { useState, useEffect, useRef } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  Users,
  Plus,
  Minus,
  Trash2,
  Check,
  RotateCcw,
  LayoutGrid,
  X,
  ArrowRight,
  Info,
  Edit2,
  Maximize2,
} from 'lucide-react';
import type { Table } from '../../types/pos';

// Discrete Modular Block Grid Constants
const BLOCK_W = 140;
const BLOCK_H = 110;
const GAP = 16;
const PADDING = 32;
const STEP_X = BLOCK_W + GAP; // 156px
const STEP_Y = BLOCK_H + GAP; // 126px

export const TableLayoutManager: React.FC = () => {
  const {
    tables,
    language,
    saveTableLayout,
    resetTableLayout,
    deleteTable,
    setActiveTab,
  } = usePOS();

  // Dynamic Customizable Block Grid Dimensions
  const [gridCols, setGridCols] = useState<number>(() => {
    const saved = localStorage.getItem('alberta_grid_cols');
    return saved ? Math.max(4, parseInt(saved, 10)) : 6;
  });

  const [gridRows, setGridRows] = useState<number>(() => {
    const saved = localStorage.getItem('alberta_grid_rows');
    return saved ? Math.max(3, parseInt(saved, 10)) : 5;
  });

  useEffect(() => {
    localStorage.setItem('alberta_grid_cols', gridCols.toString());
  }, [gridCols]);

  useEffect(() => {
    localStorage.setItem('alberta_grid_rows', gridRows.toString());
  }, [gridRows]);

  // Container Size for Always Align Center Calculation
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasLayerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: 1100,
    height: 700,
  });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    const ro = new ResizeObserver(updateSize);
    if (containerRef.current) {
      ro.observe(containerRef.current);
    }
    return () => {
      window.removeEventListener('resize', updateSize);
      ro.disconnect();
    };
  }, []);

  // Draft working copy of tables while editing (NO auto-save after moving blocks!)
  const [draftTables, setDraftTables] = useState<Table[]>(() => JSON.parse(JSON.stringify(tables)));
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<boolean>(false);

  // Sync when tables prop changes externally
  useEffect(() => {
    setDraftTables(JSON.parse(JSON.stringify(tables)));
    setHasUnsavedChanges(false);
  }, [tables]);

  // Dragging states
  const [draggingTableId, setDraggingTableId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragCurrentPos, setDragCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const dragStartMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasActuallyDragged = useRef<boolean>(false);

  // Background Pan state
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number; scrollLeft: number; scrollTop: number }>({
    x: 0,
    y: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });

  // Table Modal states
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [deleteTargetTable, setDeleteTargetTable] = useState<Table | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newNumber, setNewNumber] = useState('');
  const [newCapacity, setNewCapacity] = useState(4);
  const [targetBlockForAdd, setTargetBlockForAdd] = useState<{ col: number; row: number } | null>(null);

  // Math for Centering (Always align center)
  const totalGridWidth = gridCols * STEP_X - GAP;
  const totalGridHeight = gridRows * STEP_Y - GAP;

  const canvasWidth = Math.max(containerSize.width, totalGridWidth + PADDING * 2);
  const canvasHeight = Math.max(containerSize.height, totalGridHeight + PADDING * 2);

  const originX = Math.max(PADDING, Math.floor((canvasWidth - totalGridWidth) / 2));
  const originY = Math.max(PADDING, Math.floor((canvasHeight - totalGridHeight) / 2));

  // Helper to get a table's column and row
  const getTableCoordinates = (table: Table, index: number) => {
    let col = table.blockCol;
    let row = table.blockRow;

    if (col === undefined || row === undefined) {
      if (table.x !== undefined && table.y !== undefined) {
        col = Math.max(0, Math.min(gridCols - 1, Math.round(((table.x - 24) / STEP_X))));
        row = Math.max(0, Math.min(gridRows - 1, Math.round(((table.y - 24) / STEP_Y))));
      } else {
        col = index % gridCols;
        row = Math.floor(index / gridCols);
      }
    }
    return { col, row };
  };

  // Helper to snap canvas pixel coordinates to grid block
  function snapToBlock(canvasX: number, canvasY: number) {
    const col = Math.max(0, Math.min(gridCols - 1, Math.round((canvasX - originX) / STEP_X)));
    const row = Math.max(0, Math.min(gridRows - 1, Math.round((canvasY - originY) / STEP_Y)));
    return {
      col,
      row,
      x: originX + col * STEP_X,
      y: originY + row * STEP_Y,
    };
  }

  // Explicit Save: only saves when user clicks Save Layout
  const handleSaveLayout = () => {
    saveTableLayout(draftTables);
    setHasUnsavedChanges(false);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  // Cancel: discards all draft moves without saving
  const handleCancelLayout = () => {
    setDraftTables(JSON.parse(JSON.stringify(tables)));
    setHasUnsavedChanges(false);
  };

  // Mouse Handlers for Drag & Drop
  const handleMouseDown = (e: React.MouseEvent, table: Table, index: number) => {
    e.stopPropagation();
    const canvasEl = canvasLayerRef.current;
    if (!canvasEl) return;

    const rect = canvasEl.getBoundingClientRect();
    const { col, row } = getTableCoordinates(table, index);
    const currentX = originX + col * STEP_X;
    const currentY = originY + row * STEP_Y;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    dragStartMousePos.current = { x: e.clientX, y: e.clientY };
    hasActuallyDragged.current = false;

    setDraggingTableId(table.id);
    setDragCurrentPos({ x: currentX, y: currentY });
    setDragOffset({
      x: mouseX - currentX,
      y: mouseY - currentY,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingTableId && canvasLayerRef.current) {
      const dist = Math.hypot(
        e.clientX - dragStartMousePos.current.x,
        e.clientY - dragStartMousePos.current.y
      );
      if (dist > 6) {
        hasActuallyDragged.current = true;
      }

      const rect = canvasLayerRef.current.getBoundingClientRect();
      const rawX = e.clientX - rect.left - dragOffset.x;
      const rawY = e.clientY - rect.top - dragOffset.y;
      setDragCurrentPos({ x: rawX, y: rawY });
      return;
    }

    if (isPanning && containerRef.current) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      containerRef.current.scrollLeft = panStart.scrollLeft - dx;
      containerRef.current.scrollTop = panStart.scrollTop - dy;
    }
  };

  const handleMouseUp = () => {
    if (draggingTableId && dragCurrentPos && hasActuallyDragged.current) {
      const snapped = snapToBlock(dragCurrentPos.x, dragCurrentPos.y);
      setDraftTables((prev) =>
        prev.map((t) =>
          t.id === draggingTableId
            ? { ...t, blockCol: snapped.col, blockRow: snapped.row, x: snapped.x, y: snapped.y }
            : t
        )
      );
      setHasUnsavedChanges(true);
    }
    setDraggingTableId(null);
    setDragCurrentPos(null);
    setIsPanning(false);
  };

  const handleCanvasBackgroundMouseDown = (e: React.MouseEvent) => {
    const scrollEl = containerRef.current;
    if (!scrollEl) return;

    setIsPanning(true);
    setPanStart({
      x: e.clientX,
      y: e.clientY,
      scrollLeft: scrollEl.scrollLeft,
      scrollTop: scrollEl.scrollTop,
    });
  };

  const handleAddNewTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNumber.trim()) return;

    let targetCol = 0;
    let targetRow = 0;

    if (targetBlockForAdd) {
      targetCol = targetBlockForAdd.col;
      targetRow = targetBlockForAdd.row;
    } else {
      // Find first empty block
      let found = false;
      for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
          const isOccupied = draftTables.some((t, i) => {
            const coords = getTableCoordinates(t, i);
            return coords.col === c && coords.row === r;
          });
          if (!isOccupied) {
            targetCol = c;
            targetRow = r;
            found = true;
            break;
          }
        }
        if (found) break;
      }
    }

    const newTable: Table = {
      id: `t-${Date.now().toString().slice(-5)}`,
      number: newNumber.trim(),
      capacity: newCapacity,
      blockCol: targetCol,
      blockRow: targetRow,
      x: originX + targetCol * STEP_X,
      y: originY + targetRow * STEP_Y,
    };

    setDraftTables((prev) => [...prev, newTable]);
    setHasUnsavedChanges(true);
    setNewNumber('');
    setTargetBlockForAdd(null);
    setIsAddModalOpen(false);
  };

  const handleSaveTableEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTable) return;
    setDraftTables((prev) =>
      prev.map((t) => (t.id === editingTable.id ? editingTable : t))
    );
    setHasUnsavedChanges(true);
    setEditingTable(null);
  };

  const handleDeleteDraftTable = (tableId: string) => {
    deleteTable(tableId);
    const updatedTables = draftTables.filter((t) => t.id !== tableId);
    setDraftTables(updatedTables);
    saveTableLayout(updatedTables);
    setHasUnsavedChanges(false);
    setEditingTable(null);
    setDeleteTargetTable(null);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  const hoveredBlock =
    draggingTableId && dragCurrentPos
      ? snapToBlock(dragCurrentPos.x, dragCurrentPos.y)
      : null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        background: '#0a0e17',
        overflow: 'hidden',
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Top Header & Toolbar for Table Management */}
      <div
        style={{
          padding: '10px 16px',
          background: 'var(--color-bg-card)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        {/* Title & Dimension Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div
            style={{
              width: 36,
              height: 36,
              minWidth: 36,
              borderRadius: 8,
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.12))',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)',
              flexShrink: 0,
            }}
          >
            <LayoutGrid size={20} />
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0, whiteSpace: 'nowrap' }}>
                {language === 'th' ? 'จัดการผังโต๊ะร้านค้า' : 'Table Layout'}
              </h2>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 10,
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: 'var(--color-primary)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  whiteSpace: 'nowrap',
                }}
              >
                {language === 'th' ? 'โหมดปรับแต่งผัง' : 'Editor'}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 1, whiteSpace: 'nowrap' }}>
              <span>{draftTables.length} {language === 'th' ? 'โต๊ะ' : 'tables'}</span>
              <span>•</span>
              <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                {gridCols} × {gridRows}
              </span>
              <span>•</span>
              <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 2 }}>
                <Maximize2 size={10} />
                <span>Align Center</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls & Steppers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Columns Stepper */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              padding: '3px 8px',
              borderRadius: 8,
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              {language === 'th' ? 'คอลัมน์:' : 'Cols:'}
            </span>
            <button
              onClick={() => setGridCols((c) => Math.max(3, c - 1))}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#fff',
                borderRadius: 4,
                width: 22,
                height: 22,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Decrease Columns"
            >
              <Minus size={12} />
            </button>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', minWidth: 18, textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
              {gridCols}
            </span>
            <button
              onClick={() => setGridCols((c) => Math.min(14, c + 1))}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#fff',
                borderRadius: 4,
                width: 22,
                height: 22,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Increase Columns"
            >
              <Plus size={12} />
            </button>
          </div>

          {/* Rows Stepper */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              padding: '3px 8px',
              borderRadius: 8,
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              {language === 'th' ? 'แถว:' : 'Rows:'}
            </span>
            <button
              onClick={() => setGridRows((r) => Math.max(3, r - 1))}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#fff',
                borderRadius: 4,
                width: 22,
                height: 22,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Decrease Rows"
            >
              <Minus size={12} />
            </button>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', minWidth: 18, textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
              {gridRows}
            </span>
            <button
              onClick={() => setGridRows((r) => Math.min(14, r + 1))}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#fff',
                borderRadius: 4,
                width: 22,
                height: 22,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Increase Rows"
            >
              <Plus size={12} />
            </button>
          </div>

          {/* Add Table Button */}
          <button
            onClick={() => {
              setTargetBlockForAdd(null);
              setIsAddModalOpen(true);
            }}
            className="btn-primary"
            style={{
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Plus size={14} />
            <span>{language === 'th' ? 'เพิ่มโต๊ะ' : 'Add Table'}</span>
          </button>

          {/* Reset Layout */}
          <button
            onClick={() => {
              if (window.confirm(language === 'th' ? 'คุณต้องการรีเซ็ตผังร้านกลับเป็นค่าเริ่มต้นหรือไม่?' : 'Reset table layout to defaults?')) {
                resetTableLayout();
                setHasUnsavedChanges(false);
              }
            }}
            style={{
              background: 'transparent',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-secondary)',
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
            title="Reset to initial layout"
          >
            <RotateCcw size={13} />
            <span>{language === 'th' ? 'รีเซ็ต' : 'Reset'}</span>
          </button>

          {/* Explicit Save and Cancel Controls */}
          {hasUnsavedChanges ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(245, 158, 11, 0.12)', padding: '4px 8px', borderRadius: 8, border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              <button
                onClick={handleSaveLayout}
                style={{
                  background: 'var(--color-primary)',
                  color: '#000',
                  border: 'none',
                  borderRadius: 6,
                  padding: '7px 14px',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)',
                }}
              >
                <Check size={16} />
                <span>{language === 'th' ? 'บันทึกผัง' : 'Save Layout'}</span>
              </button>
              <button
                onClick={handleCancelLayout}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 6,
                  padding: '7px 12px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {language === 'th' ? 'ยกเลิก' : 'Cancel'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setActiveTab('pos')}
              className="btn-primary"
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <span>{language === 'th' ? 'ไปหน้าสั่งอาหาร & บิล' : 'Go to Front POS'}</span>
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Sub-bar Guidance Notice */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.8)',
          borderBottom: '1px solid var(--color-border)',
          padding: '6px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 12,
          color: 'var(--color-text-secondary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Info size={14} style={{ color: 'var(--color-primary)' }} />
          <span>
            {language === 'th'
              ? '🧲 ผังบล็อกจะจัดกึ่งกลางหน้าจอเสมอ (Always align center) • สามารถคลิกลากโต๊ะเพื่อย้ายบล็อก • คลิกที่บล็อกว่างเพื่อเพิ่มโต๊ะ'
              : '🧲 Block floor is always centered • Drag tables to move into blocks • Click empty block to add table'}
          </span>
        </div>

        {saveSuccessMsg && (
          <span style={{ color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Check size={14} />
            {language === 'th' ? 'บันทึกผังโต๊ะเรียบร้อยแล้ว' : 'Layout saved successfully!'}
          </span>
        )}
      </div>

      {/* Main Floor Canvas Container (Scrollable 2D with Always Align Center) */}
      <div
        ref={containerRef}
        className="table-canvas-scroll-container"
        onMouseDown={handleCanvasBackgroundMouseDown}
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'auto',
          background: '#070a11',
          cursor: isPanning ? 'grabbing' : 'default',
        }}
      >
        {/* Centered Canvas Background Layer */}
        <div
          ref={canvasLayerRef}
          className="canvas-background-layer"
          style={{
            position: 'relative',
            width: canvasWidth,
            height: canvasHeight,
            minWidth: '100%',
            minHeight: '100%',
            background: 'radial-gradient(circle at 50% 50%, #0d1322 0%, #070a11 100%)',
            userSelect: 'none',
          }}
        >
          {/* Subtle grid center marker lines */}
          <div
            style={{
              position: 'absolute',
              left: originX - 10,
              top: originY - 10,
              width: totalGridWidth + 20,
              height: totalGridHeight + 20,
              border: '1px dashed rgba(245, 158, 11, 0.15)',
              borderRadius: 20,
              pointerEvents: 'none',
            }}
          />

          {/* Visible Floor Grid Blocks (Always align center) */}
          {Array.from({ length: gridRows }).map((_, r) =>
            Array.from({ length: gridCols }).map((_, c) => {
              const bx = originX + c * STEP_X;
              const by = originY + r * STEP_Y;

              const isOccupied = draftTables.some((t, i) => {
                if (t.id === draggingTableId) return false;
                const coords = getTableCoordinates(t, i);
                return coords.col === c && coords.row === r;
              });

              return (
                <div
                  key={`block-${c}-${r}`}
                  onClick={() => {
                    if (!isOccupied) {
                      setTargetBlockForAdd({ col: c, row: r });
                      setIsAddModalOpen(true);
                    }
                  }}
                  style={{
                    position: 'absolute',
                    left: bx,
                    top: by,
                    width: BLOCK_W,
                    height: BLOCK_H,
                    borderRadius: 16,
                    border: isOccupied
                      ? '1px dashed rgba(255, 255, 255, 0.08)'
                      : '1.5px dashed rgba(245, 158, 11, 0.25)',
                    background: !isOccupied
                      ? 'rgba(255, 255, 255, 0.015)'
                      : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: !isOccupied ? 'pointer' : 'default',
                    transition: 'all 0.15s ease',
                    zIndex: 0,
                  }}
                  onMouseEnter={(e) => {
                    if (!isOccupied) {
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                      e.currentTarget.style.background = 'rgba(245, 158, 11, 0.06)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isOccupied) {
                      e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.25)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.015)';
                    }
                  }}
                >
                  {!isOccupied && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 3,
                        color: 'rgba(245, 158, 11, 0.4)',
                      }}
                    >
                      <Plus size={16} />
                      <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)' }}>
                        [{c + 1}, {r + 1}]
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Ghost Snap Target Highlight while dragging */}
          {hoveredBlock && (
            <div
              style={{
                position: 'absolute',
                left: hoveredBlock.x,
                top: hoveredBlock.y,
                width: BLOCK_W,
                height: BLOCK_H,
                borderRadius: 16,
                border: '2px solid var(--color-primary)',
                background: 'rgba(245, 158, 11, 0.18)',
                boxShadow: '0 0 24px rgba(245, 158, 11, 0.4)',
                pointerEvents: 'none',
                zIndex: 5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.06s ease-out',
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: 'var(--color-primary)',
                  fontFamily: 'var(--font-mono)',
                  background: 'rgba(0,0,0,0.65)',
                  padding: '3px 8px',
                  borderRadius: 4,
                }}
              >
                Snap: [{hoveredBlock.col + 1}, {hoveredBlock.row + 1}]
              </span>
            </div>
          )}

          {/* Rendered Table Blocks (Uniform Size, Always Centered) */}
          {draftTables.map((table, index) => {
            const isDraggingThis = draggingTableId === table.id;
            const coords = getTableCoordinates(table, index);

            let posX = originX + coords.col * STEP_X;
            let posY = originY + coords.row * STEP_Y;

            if (isDraggingThis && dragCurrentPos) {
              posX = dragCurrentPos.x;
              posY = dragCurrentPos.y;
            }

            return (
              <div
                key={table.id}
                onMouseDown={(e) => handleMouseDown(e, table, index)}
                onClick={() => {
                  if (!hasActuallyDragged.current) {
                    setEditingTable(table);
                  }
                }}
                style={{
                  position: 'absolute',
                  left: posX,
                  top: posY,
                  width: BLOCK_W,
                  height: BLOCK_H,
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))',
                  border: isDraggingThis
                    ? '2px solid var(--color-primary)'
                    : '1.5px solid rgba(245, 158, 11, 0.35)',
                  boxShadow: isDraggingThis
                    ? '0 12px 32px rgba(245, 158, 11, 0.35)'
                    : '0 4px 14px rgba(0, 0, 0, 0.4)',
                  cursor: isDraggingThis ? 'grabbing' : 'grab',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  gap: 4,
                  zIndex: isDraggingThis ? 20 : 1,
                  transform: isDraggingThis ? 'scale(1.04)' : 'scale(1)',
                  transition: isDraggingThis ? 'none' : 'transform 0.15s, box-shadow 0.15s',
                }}
              >
                {/* Quick Delete Table Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTargetTable(table);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 10,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.35)';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                    e.currentTarget.style.color = '#f87171';
                  }}
                  title={language === 'th' ? `ลบโต๊ะ ${table.number}` : `Delete table ${table.number}`}
                >
                  <Trash2 size={13} />
                </button>

                {/* Table Number */}
                <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                  {table.number}
                </div>

                {/* Seats Capacity */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    fontSize: 12,
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  <Users size={13} />
                  <span>{table.capacity} {language === 'th' ? 'ที่นั่ง' : 'seats'}</span>
                </div>

                {/* Edit hint badge */}
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'var(--color-primary)',
                    background: 'rgba(245, 158, 11, 0.12)',
                    padding: '2px 8px',
                    borderRadius: 10,
                    marginTop: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  <Edit2 size={9} />
                  <span>{language === 'th' ? 'คลิกเพื่อแก้ไข' : 'Edit'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add New Table Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content-card" style={{ width: 380 }}>
            <div
              style={{
                padding: '16px 20px',
                background: 'var(--color-bg-elevated)',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>
                {targetBlockForAdd
                  ? (language === 'th'
                      ? `+ เพิ่มโต๊ะลงบล็อก [${targetBlockForAdd.col + 1}, ${targetBlockForAdd.row + 1}]`
                      : `+ Add Table to Block [${targetBlockForAdd.col + 1}, ${targetBlockForAdd.row + 1}]`)
                  : (language === 'th' ? '+ เพิ่มโต๊ะใหม่' : '+ Add New Table')}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddNewTable} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                  {language === 'th' ? 'หมายเลข / ชื่อโต๊ะ *' : 'Table Number / Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น 13, 14, VIP1"
                  value={newNumber}
                  onChange={(e) => setNewNumber(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    color: '#fff',
                    fontSize: 16,
                    fontWeight: 700,
                    marginTop: 6,
                    outline: 'none',
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                  {language === 'th' ? 'จำนวนที่นั่ง (Capacity)' : 'Seat Capacity'}
                </label>
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  {[2, 4, 6, 8, 10].map((cap) => (
                    <button
                      key={cap}
                      type="button"
                      onClick={() => setNewCapacity(cap)}
                      style={{
                        flex: 1,
                        padding: '8px 0',
                        borderRadius: 6,
                        border: newCapacity === cap ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        background: newCapacity === cap ? 'rgba(245, 158, 11, 0.2)' : 'var(--color-bg-elevated)',
                        color: newCapacity === cap ? 'var(--color-primary)' : '#fff',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      {cap}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1 }}
                >
                  {language === 'th' ? 'เพิ่มโต๊ะ' : 'Add Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Existing Table Modal */}
      {editingTable && (
        <div className="modal-overlay">
          <div className="modal-content-card" style={{ width: 380 }}>
            <div
              style={{
                padding: '16px 20px',
                background: 'var(--color-bg-elevated)',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>
                {language === 'th' ? `แก้ไขโต๊ะ ${editingTable.number}` : `Edit Table ${editingTable.number}`}
              </h3>
              <button
                onClick={() => setEditingTable(null)}
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTableEdit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                  {language === 'th' ? 'หมายเลข / ชื่อโต๊ะ' : 'Table Number'}
                </label>
                <input
                  type="text"
                  required
                  value={editingTable.number}
                  onChange={(e) => setEditingTable({ ...editingTable, number: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    color: '#fff',
                    fontSize: 16,
                    fontWeight: 700,
                    marginTop: 6,
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                  {language === 'th' ? 'จำนวนที่นั่ง' : 'Capacity'}
                </label>
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  {[2, 4, 6, 8, 10].map((cap) => (
                    <button
                      key={cap}
                      type="button"
                      onClick={() => setEditingTable({ ...editingTable, capacity: cap })}
                      style={{
                        flex: 1,
                        padding: '8px 0',
                        borderRadius: 6,
                        border: editingTable.capacity === cap ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        background: editingTable.capacity === cap ? 'rgba(245, 158, 11, 0.2)' : 'var(--color-bg-elevated)',
                        color: editingTable.capacity === cap ? 'var(--color-primary)' : '#fff',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      {cap}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons: Delete & Save */}
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    const target = editingTable;
                    setEditingTable(null);
                    setDeleteTargetTable(target);
                  }}
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 6,
                    padding: '8px 14px',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Trash2 size={15} />
                  <span>{language === 'th' ? 'ลบโต๊ะ' : 'Delete'}</span>
                </button>

                <div style={{ flex: 1, display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setEditingTable(null)}
                    className="btn-secondary"
                    style={{ flex: 1 }}
                  >
                    {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ flex: 1 }}
                  >
                    {language === 'th' ? 'บันทึก' : 'Save'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteTargetTable && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content-card" style={{ width: 380, textAlign: 'center', padding: '24px 20px' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              <Trash2 size={28} />
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
              {language === 'th' ? `ลบโต๊ะ ${deleteTargetTable.number}?` : `Delete Table ${deleteTargetTable.number}?`}
            </h3>

            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
              {language === 'th'
                ? `คุณแน่ใจหรือไม่ว่าต้องการลบ "โต๊ะ ${deleteTargetTable.number}" (${deleteTargetTable.capacity} ที่นั่ง) ออกจากผังร้าน?`
                : `Are you sure you want to remove Table "${deleteTargetTable.number}" (${deleteTargetTable.capacity} seats) from the restaurant layout?`}
            </p>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setDeleteTargetTable(null)}
                className="btn-secondary"
                style={{ flex: 1, padding: '10px 0', fontWeight: 700 }}
              >
                {language === 'th' ? 'ยกเลิก' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => handleDeleteDraftTable(deleteTargetTable.id)}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                }}
              >
                <Trash2 size={16} />
                <span>{language === 'th' ? 'ยืนยันการลบ' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
