import React, { useState, useEffect, useRef } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  Users,
  Grid,
  MapPin,
  Sliders,
} from 'lucide-react';
import type { Table } from '../../types/pos';


interface TableMapProps {
  onSelectTable?: (tableId: string) => void;
  compact?: boolean;
}

export const TableMap: React.FC<TableMapProps> = ({ onSelectTable, compact = false }) => {
  const {
    tables,
    activeTableId,
    setActiveTableId,
    orders,
    language,
    setActiveTab,
  } = usePOS();

  // Dynamic Block Sizing (Standard vs Compact for 3-Panel POS)
  const blockW = compact ? 92 : 140;
  const blockH = compact ? 74 : 110;
  const gap = compact ? 8 : 16;
  const padding = compact ? 10 : 28;
  const stepX = blockW + gap;
  const stepY = blockH + gap;

  // Grid dimensions (read from persisted settings)
  const [gridCols] = useState<number>(() => {
    const saved = localStorage.getItem('alberta_grid_cols');
    return saved ? Math.max(4, parseInt(saved, 10)) : 6;
  });

  const [gridRows] = useState<number>(() => {
    const saved = localStorage.getItem('alberta_grid_rows');
    return saved ? Math.max(3, parseInt(saved, 10)) : 5;
  });

  const [viewMode, setViewMode] = useState<'canvas' | 'grid'>('canvas');

  // Container Measurement for "Always Align Center"
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: 800,
    height: 650,
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

  // Pan state for background dragging / scrolling
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number; scrollLeft: number; scrollTop: number }>({
    x: 0,
    y: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });

  // Centering Math (Always align center)
  const totalGridWidth = gridCols * stepX - gap;
  const totalGridHeight = gridRows * stepY - gap;

  const canvasWidth = Math.max(containerSize.width, totalGridWidth + padding * 2);
  const canvasHeight = Math.max(containerSize.height, totalGridHeight + padding * 2);

  const originX = Math.max(padding, Math.floor((canvasWidth - totalGridWidth) / 2));
  const originY = Math.max(padding, Math.floor((canvasHeight - totalGridHeight) / 2));

  // Helper to get table active order
  const getTableActiveOrder = (tableId: string) => {
    return Object.values(orders).find(
      (o) => o.tableId === tableId && o.status === 'active'
    );
  };

  // Helper to get coordinates
  const getTableCoordinates = (table: Table, index: number) => {
    let col = table.blockCol;
    let row = table.blockRow;

    if (col === undefined || row === undefined) {
      if (table.x !== undefined && table.y !== undefined) {
        col = Math.max(0, Math.min(gridCols - 1, Math.round(((table.x - 24) / 156))));
        row = Math.max(0, Math.min(gridRows - 1, Math.round(((table.y - 24) / 126))));
      } else {
        col = index % gridCols;
        row = Math.floor(index / gridCols);
      }
    }
    return { col, row };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;
    setIsPanning(true);
    setPanStart({
      x: e.clientX,
      y: e.clientY,
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop,
    });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning && containerRef.current) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      containerRef.current.scrollLeft = panStart.scrollLeft - dx;
      containerRef.current.scrollTop = panStart.scrollTop - dy;
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
  };

  const handleSelect = (tableId: string) => {
    setActiveTableId(tableId);
    if (onSelectTable) {
      onSelectTable(tableId);
    }
  };

  // Summary counts for service
  const occupiedTables = tables.filter((t) => !!getTableActiveOrder(t.id));
  const totalActiveRevenue = occupiedTables.reduce((sum, t) => {
    const ord = getTableActiveOrder(t.id);
    return sum + (ord?.grandTotal || 0);
  }, 0);

  return (
    <div
      className="table-map-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        background: '#0a0e17',
      }}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onMouseLeave={handleCanvasMouseUp}
    >
      {/* Top Toolbar in POS Service Mode */}
      <div
        style={{
          padding: compact ? '10px 14px' : '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--color-border)',
          background: 'rgba(17, 24, 39, 0.85)',
          zIndex: 10,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Left: Title & Quick Status Summary */}
        <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 8 : 14 }}>
          <div
            style={{
              width: compact ? 30 : 36,
              height: compact ? 30 : 36,
              borderRadius: 8,
              background: 'rgba(245, 158, 11, 0.15)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MapPin size={compact ? 16 : 20} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <h2 style={{ fontSize: compact ? 14 : 16, fontWeight: 800, color: '#fff', margin: 0 }}>
                {language === 'th' ? 'ผังโต๊ะ' : 'Tables'}
              </h2>
              <span
                style={{
                  fontSize: 10,
                  padding: '1px 6px',
                  borderRadius: 8,
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  fontWeight: 700,
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                {tables.length - occupiedTables.length} {language === 'th' ? 'ว่าง' : 'free'}
              </span>
            </div>

            {!compact && (
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                <span style={{ color: '#10b981', fontWeight: 600 }}>
                  {tables.length - occupiedTables.length} {language === 'th' ? 'โต๊ะว่าง' : 'vacant'}
                </span>
                <span>•</span>
                <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                  {occupiedTables.length} {language === 'th' ? 'เปิดบิลอยู่' : 'active bills'}
                </span>
                {totalActiveRevenue > 0 && (
                  <>
                    <span>•</span>
                    <span style={{ color: '#f59e0b', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                      ฿{totalActiveRevenue.toLocaleString()}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: View Mode Toggle & Layout Manager Shortcut */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* View Mode Switcher */}
          <div style={{ display: 'flex', background: 'var(--color-bg-elevated)', padding: 2, borderRadius: 6, border: '1px solid var(--color-border)' }}>
            <button
              onClick={() => setViewMode('canvas')}
              style={{
                padding: compact ? '4px 8px' : '6px 12px',
                borderRadius: 4,
                border: 'none',
                background: viewMode === 'canvas' ? 'var(--color-primary)' : 'transparent',
                color: viewMode === 'canvas' ? '#000' : 'var(--color-text-secondary)',
                fontSize: compact ? 11 : 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
              title="Canvas view"
            >
              <Grid size={compact ? 12 : 13} />
              <span>{compact ? '' : (language === 'th' ? 'บล็อกผัง' : 'Blocks')}</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: compact ? '4px 8px' : '6px 12px',
                borderRadius: 4,
                border: 'none',
                background: viewMode === 'grid' ? 'var(--color-primary)' : 'transparent',
                color: viewMode === 'grid' ? '#000' : 'var(--color-text-secondary)',
                fontSize: compact ? 11 : 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
              title="List view"
            >
              <span>{compact ? '☰' : (language === 'th' ? 'รายการ' : 'List')}</span>
            </button>
          </div>

          {!compact && (
            <button
              onClick={() => setActiveTab('tables')}
              className="btn-secondary"
              style={{
                padding: '7px 12px',
                fontSize: 12,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--color-border)',
                color: '#fff',
              }}
              title="Switch to dedicated Table Layout Editor"
            >
              <Sliders size={14} style={{ color: 'var(--color-primary)' }} />
              <span>{language === 'th' ? 'จัดการผังโต๊ะ' : 'Manage Layout'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Floor Area (Canvas or List) */}
      {viewMode === 'canvas' ? (
        <div
          ref={containerRef}
          className="table-canvas-scroll-container"
          onMouseDown={handleCanvasMouseDown}
          style={{
            flex: 1,
            position: 'relative',
            overflow: 'auto',
            background: '#070a11',
            cursor: isPanning ? 'grabbing' : 'default',
          }}
        >
          {/* Centered Floor Canvas (Always Align Center) */}
          <div
            className="canvas-background-layer"
            style={{
              position: 'relative',
              width: canvasWidth,
              height: canvasHeight,
              minWidth: '100%',
              minHeight: '100%',
              background: 'radial-gradient(circle at 50% 50%, #0c1220 0%, #070a11 100%)',
              userSelect: 'none',
            }}
          >
            {/* Floor Grid Outline (Always Align Center) */}
            <div
              style={{
                position: 'absolute',
                left: originX - 8,
                top: originY - 8,
                width: totalGridWidth + 16,
                height: totalGridHeight + 16,
                border: '1px dashed rgba(255, 255, 255, 0.08)',
                borderRadius: 20,
                pointerEvents: 'none',
              }}
            />

            {/* Background Grid Blocks */}
            {Array.from({ length: gridRows }).map((_, r) =>
              Array.from({ length: gridCols }).map((_, c) => {
                const bx = originX + c * stepX;
                const by = originY + r * stepY;

                return (
                  <div
                    key={`slot-${c}-${r}`}
                    style={{
                      position: 'absolute',
                      left: bx,
                      top: by,
                      width: blockW,
                      height: blockH,
                      borderRadius: compact ? 12 : 16,
                      border: '1px solid rgba(255, 255, 255, 0.03)',
                      pointerEvents: 'none',
                    }}
                  />
                );
              })
            )}

            {/* Active Table Blocks (Always Align Center) */}
            {tables.map((table, index) => {
              const isSelected = activeTableId === table.id;
              const coords = getTableCoordinates(table, index);
              const posX = originX + coords.col * stepX;
              const posY = originY + coords.row * stepY;

              const tableOrder = getTableActiveOrder(table.id);
              const totalAmount = tableOrder?.grandTotal || 0;
              const itemCount = tableOrder?.items?.length || 0;

              return (
                <div
                  key={table.id}
                  onClick={() => handleSelect(table.id)}
                  style={{
                    position: 'absolute',
                    left: posX,
                    top: posY,
                    width: blockW,
                    height: blockH,
                    borderRadius: compact ? 12 : 16,
                    background: isSelected
                      ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.28), rgba(217, 119, 6, 0.15))'
                      : totalAmount > 0
                        ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))'
                        : 'linear-gradient(135deg, rgba(20, 29, 44, 0.9), rgba(13, 20, 32, 0.9))',
                    border: isSelected
                      ? '2.5px solid var(--color-primary)'
                      : totalAmount > 0
                        ? '1.5px solid rgba(245, 158, 11, 0.45)'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: isSelected
                      ? '0 0 16px rgba(245, 158, 11, 0.4), inset 0 0 10px rgba(245, 158, 11, 0.15)'
                      : totalAmount > 0
                        ? '0 4px 14px rgba(0, 0, 0, 0.35)'
                        : '0 2px 8px rgba(0, 0, 0, 0.25)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    gap: compact ? 2 : 3,
                    transition: 'all 0.15s ease',
                    zIndex: isSelected ? 5 : 1,
                  }}
                >
                  {/* Table Number */}
                  <div
                    style={{
                      fontSize: compact ? 18 : 26,
                      fontWeight: 900,
                      color: isSelected ? 'var(--color-primary)' : '#fff',
                      lineHeight: 1,
                    }}
                  >
                    {table.number}
                  </div>

                  {/* Seat Capacity */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 3,
                      fontSize: compact ? 10 : 11,
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    <Users size={compact ? 10 : 12} />
                    <span>{table.capacity} {language === 'th' ? 'ที่นั่ง' : 'seats'}</span>
                  </div>

                  {/* Order Status & Amount */}
                  {totalAmount > 0 ? (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        marginTop: 1,
                      }}
                    >
                      <span
                        style={{
                          fontSize: compact ? 12 : 14,
                          fontWeight: 900,
                          color: 'var(--color-primary)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        ฿{totalAmount.toLocaleString()}
                      </span>
                      {!compact && (
                        <span
                          style={{
                            fontSize: 10,
                            color: '#fbbf24',
                            fontWeight: 700,
                          }}
                        >
                          {itemCount} {language === 'th' ? 'รายการ' : 'items'}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div
                      style={{
                        fontSize: compact ? 9 : 10,
                        color: isSelected ? 'var(--color-primary)' : '#10b981',
                        fontWeight: 600,
                        marginTop: compact ? 2 : 4,
                        padding: '1px 5px',
                        borderRadius: 6,
                        background: 'rgba(16, 185, 129, 0.1)',
                      }}
                    >
                      {language === 'th' ? 'ว่าง' : 'Ready'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Grid List View */
        <div style={{ flex: 1, padding: compact ? 12 : 24, overflowY: 'auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: compact ? 'repeat(auto-fill, minmax(85px, 1fr))' : 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: compact ? 8 : 14,
            }}
          >
            {tables.map((table) => {
              const isSelected = activeTableId === table.id;
              const tableOrder = getTableActiveOrder(table.id);
              const totalAmount = tableOrder?.grandTotal || 0;

              return (
                <div
                  key={table.id}
                  onClick={() => handleSelect(table.id)}
                  style={{
                    background: isSelected
                      ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.22), rgba(217, 119, 6, 0.12))'
                      : 'var(--color-bg-card)',
                    border: isSelected
                      ? '2px solid var(--color-primary)'
                      : '1px solid var(--color-border)',
                    borderRadius: compact ? 'var(--radius-md)' : 'var(--radius-lg)',
                    padding: compact ? '10px 6px' : 16,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: compact ? 4 : 8,
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: compact ? 18 : 24, fontWeight: 900, color: '#fff' }}>
                    {table.number}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    <Users size={12} />
                    <span>{table.capacity} {language === 'th' ? 'ที่นั่ง' : 'seats'}</span>
                  </div>
                  {totalAmount > 0 ? (
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: 'var(--color-primary)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      ฿{totalAmount.toLocaleString()}
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>
                      {language === 'th' ? 'พร้อมบริการ' : 'Ready'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
