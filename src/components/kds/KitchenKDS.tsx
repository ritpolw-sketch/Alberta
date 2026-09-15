import React, { useState, useEffect } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  Clock,
  CheckCircle,
  Flame,
  UtensilsCrossed,
  AlertTriangle,
} from 'lucide-react';

export const KitchenKDS: React.FC = () => {
  const {
    orders,
    markOrderItemReady,
    markOrderAllReady,
    language,
  } = usePOS();

  const [now, setNow] = useState(() => Date.now());

  // Update timer every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Active tickets: orders with at least one 'sent_to_kitchen' item
  const activeTickets = Object.values(orders)
    .filter(
      (o) =>
        o.status === 'active' &&
        o.items.some((i) => i.status === 'sent_to_kitchen')
    )
    .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());

  const getElapsedMinutes = (isoString?: string) => {
    if (!isoString) return 0;
    return Math.floor((now - new Date(isoString).getTime()) / 60000);
  };

  const getUrgencyColor = (minutes: number) => {
    if (minutes >= 15) return '#ef4444'; // red - urgent
    if (minutes >= 8) return '#f59e0b';  // amber - getting long
    return '#10b981';                     // green - fresh
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: '#0a0e1a',
    }}>
      {/* KDS Header */}
      <div style={{
        padding: '14px 24px',
        background: 'rgba(17, 24, 39, 0.95)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
          }}>
            <Flame size={20} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>
              {language === 'th' ? 'จอในครัว (KDS)' : 'Kitchen Display System'}
            </h2>
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>
              {activeTickets.length} {language === 'th' ? 'ออเดอร์รอเสิร์ฟ' : 'pending tickets'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            fontSize: 28, fontWeight: 800, color: '#fff',
            fontFamily: 'var(--font-mono)',
            letterSpacing: 2,
          }}>
            {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {/* Ticket Grid */}
      {activeTickets.length === 0 ? (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          color: 'var(--color-text-muted)',
        }}>
          <UtensilsCrossed size={56} style={{ opacity: 0.2 }} />
          <p style={{ fontSize: 18, fontWeight: 700 }}>
            {language === 'th' ? 'ไม่มีออเดอร์รอทำ' : 'No pending orders'}
          </p>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            {language === 'th' ? 'ออเดอร์ใหม่จะปรากฏที่นี่เมื่อส่งเข้าครัว' : 'New orders will appear here when sent to kitchen'}
          </p>
        </div>
      ) : (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: 20,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 16,
          alignContent: 'start',
        }}>
          {activeTickets.map((order) => {
            const kitchenItems = order.items.filter((i) => i.status === 'sent_to_kitchen');
            const servedItems = order.items.filter((i) => i.status === 'served');
            const allItems = [...kitchenItems, ...servedItems];
            const oldestSent = kitchenItems.reduce((oldest, item) => {
              if (!item.sentAt) return oldest;
              return !oldest || new Date(item.sentAt) < new Date(oldest) ? item.sentAt : oldest;
            }, '' as string);
            const elapsed = getElapsedMinutes(oldestSent || order.updatedAt);
            const urgencyColor = getUrgencyColor(elapsed);

            return (
              <div
                key={order.id}
                style={{
                  background: 'var(--color-bg-card)',
                  border: `2px solid ${urgencyColor}40`,
                  borderRadius: 14,
                  overflow: 'hidden',
                  boxShadow: `0 4px 20px ${urgencyColor}15`,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Ticket Header */}
                <div style={{
                  padding: '14px 16px',
                  background: `${urgencyColor}12`,
                  borderBottom: `1px solid ${urgencyColor}25`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: `${urgencyColor}20`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, fontWeight: 800, color: urgencyColor,
                      border: `2px solid ${urgencyColor}40`,
                    }}>
                      T{order.tableName}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>
                        {order.orderNumber}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        {order.staffName} • {order.guestCount} ท่าน
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '4px 10px', borderRadius: 8,
                    background: `${urgencyColor}15`,
                    border: `1px solid ${urgencyColor}30`,
                  }}>
                    {elapsed >= 15 && <AlertTriangle size={13} color={urgencyColor} />}
                    <Clock size={13} color={urgencyColor} />
                    <span style={{
                      fontSize: 14, fontWeight: 800, color: urgencyColor,
                      fontFamily: 'var(--font-mono)',
                    }}>
                      {elapsed} {language === 'th' ? 'นาที' : 'min'}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div style={{ padding: '12px 16px', flex: 1 }}>
                  {allItems.map((item) => {
                    const isReady = item.status === 'served';
                    return (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 10,
                          padding: '10px 0',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          opacity: isReady ? 0.4 : 1,
                        }}
                      >
                        {/* Item Checkbox */}
                        <button
                          onClick={() => {
                            if (!isReady) markOrderItemReady(order.id, item.id);
                          }}
                          style={{
                            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                            border: isReady ? '2px solid #10b981' : '2px solid var(--color-border)',
                            background: isReady ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                            cursor: isReady ? 'default' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s',
                            marginTop: 2,
                          }}
                        >
                          {isReady && <CheckCircle size={16} color="#10b981" />}
                        </button>

                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: 15, fontWeight: 700,
                            color: isReady ? '#10b981' : '#fff',
                            textDecoration: isReady ? 'line-through' : 'none',
                          }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: 22, height: 22, borderRadius: 6,
                              background: isReady ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                              color: isReady ? '#10b981' : 'var(--color-primary)',
                              fontSize: 12, fontWeight: 800, marginRight: 6,
                            }}>
                              {item.quantity}
                            </span>
                            {item.nameTh}
                          </div>

                          {/* Modifiers */}
                          {item.modifiers.length > 0 && (
                            <div style={{
                              marginTop: 4, fontSize: 12, color: '#f59e0b',
                              fontWeight: 600,
                            }}>
                              ▸ {item.modifiers.map((m) => m.optionNameTh).join(' • ')}
                            </div>
                          )}

                          {/* Special instructions */}
                          {item.specialInstructions && (
                            <div style={{
                              marginTop: 4, fontSize: 12, color: '#ef4444',
                              fontWeight: 700,
                              padding: '3px 8px',
                              background: 'rgba(239, 68, 68, 0.08)',
                              borderRadius: 6,
                              display: 'inline-block',
                            }}>
                              ⚠️ {item.specialInstructions}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Complete Button */}
                {kitchenItems.length > 0 && (
                  <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)' }}>
                    <button
                      onClick={() => markOrderAllReady(order.id)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: 10,
                        border: 'none',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: 14,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                        transition: 'transform 0.1s',
                      }}
                      onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
                      onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                      <CheckCircle size={18} />
                      {language === 'th' ? 'เสร็จทั้งหมด' : 'All Ready'}
                      <span style={{
                        background: 'rgba(255,255,255,0.2)',
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontSize: 12,
                      }}>
                        {kitchenItems.length} {language === 'th' ? 'รายการ' : 'items'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
