import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import type { MenuItem } from '../../types/pos';
import { Plus, AlertCircle, Check } from 'lucide-react';

interface MenuCatalogProps {
  onSelectItem: (item: MenuItem) => void;
  onCustomizeItem?: (item: MenuItem) => void;
}

export const MenuCatalog: React.FC<MenuCatalogProps> = ({ onSelectItem }) => {
  const { categories, menuItems, language } = usePOS();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  const filteredItems = menuItems.filter((item) => {
    return activeCategory === 'all' || item.categoryId === activeCategory;
  });

  const handleCardClick = (item: MenuItem) => {
    if (!item.inStock) return;
    onSelectItem(item);
    setJustAddedId(item.id);
    setTimeout(() => {
      setJustAddedId((curr) => (curr === item.id ? null : curr));
    }, 600);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Items Grid (Middle scrollable) */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))',
            gap: 12,
          }}
        >
          {filteredItems.map((item) => {
            const isJustAdded = justAddedId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => handleCardClick(item)}
                style={{
                  background: isJustAdded ? 'rgba(245, 158, 11, 0.18)' : 'var(--color-bg-elevated)',
                  border: isJustAdded
                    ? '1.5px solid var(--color-primary)'
                    : '1px solid ' + (item.inStock ? 'var(--color-border)' : 'rgba(239, 68, 68, 0.2)'),
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: item.inStock ? 'pointer' : 'not-allowed',
                  opacity: item.inStock ? 1 : 0.55,
                  transform: isJustAdded ? 'scale(0.97)' : 'none',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                  userSelect: 'none',
                }}
                onMouseEnter={(e) => {
                  if (item.inStock && !isJustAdded) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isJustAdded) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = item.inStock ? 'var(--color-border)' : 'rgba(239, 68, 68, 0.2)';
                  }
                }}
              >
                {/* 1-Click Added Animation Overlay */}
                {isJustAdded && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      background: 'var(--color-primary)',
                      color: '#000',
                      fontWeight: 900,
                      fontSize: 12,
                      padding: '2px 8px',
                      borderRadius: 12,
                      zIndex: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                    }}
                  >
                    <Check size={12} strokeWidth={3} />
                    <span>+1</span>
                  </div>
                )}
                {/* Image Banner */}
                <div style={{ height: 85, position: 'relative', overflow: 'hidden', background: '#1e293b' }}>
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={language === 'th' ? item.nameTh : item.nameEn}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />
                  ) : (
                    <div
                      style={{
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 28,
                      }}
                    >
                      🍽️
                    </div>
                  )}

                  {/* Stock Out Indicator */}
                  {!item.inStock && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        color: '#f87171',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      <AlertCircle size={14} />
                      <span>{language === 'th' ? 'ของหมด' : 'Sold Out'}</span>
                    </div>
                  )}
                </div>

                {/* Body */}
                <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#fff',
                      lineHeight: 1.3,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {language === 'th' ? item.nameTh : item.nameEn}
                  </span>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 'auto',
                      paddingTop: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: 'var(--color-primary)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      ฿{item.price}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

                      {item.inStock && (
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 6,
                            background: isJustAdded ? 'var(--color-primary)' : 'rgba(245, 158, 11, 0.15)',
                            color: isJustAdded ? '#000' : 'var(--color-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <Plus size={14} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Categories Navigation */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          padding: '12px 16px',
          background: 'var(--color-bg-card)',
          borderTop: '1px solid var(--color-border)',
          boxShadow: '0 -4px 12px rgba(0,0,0,0.2)',
        }}
      >
        <button
          onClick={() => setActiveCategory('all')}
          style={{
            padding: '10px 20px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid ' + (activeCategory === 'all' ? 'var(--color-primary)' : 'var(--color-border)'),
            background: activeCategory === 'all' ? 'var(--color-primary)' : 'var(--color-bg-elevated)',
            color: activeCategory === 'all' ? '#000' : 'var(--color-text-secondary)',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span style={{ fontSize: 18 }}>🍽️</span>
          <span>{language === 'th' ? 'ทุกเมนู' : 'All'}</span>
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid ' + (activeCategory === cat.id ? 'var(--color-primary)' : 'var(--color-border)'),
              background: activeCategory === cat.id ? 'var(--color-primary)' : 'var(--color-bg-elevated)',
              color: activeCategory === cat.id ? '#000' : 'var(--color-text-secondary)',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span style={{ fontSize: 18 }}>{cat.icon}</span>
            <span>{language === 'th' ? cat.nameTh : cat.nameEn}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
