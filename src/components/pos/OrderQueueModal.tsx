import React from 'react';
import { usePOS } from '../../context/POSContext';
import {
  X,
  Cpu,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Flame,
  ArrowRight,
} from 'lucide-react';

interface OrderQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OrderQueueModal: React.FC<OrderQueueModalProps> = ({ isOpen, onClose }) => {
  const {
    orderQueue,
    workerStatus,
    clearCompletedQueue,
    language,
    setActiveTableId,
    setActiveTab,
  } = usePOS();

  if (!isOpen) return null;

  const queuedCount = orderQueue.filter((q) => q.status === 'queued').length;
  const processingCount = orderQueue.filter((q) => q.status === 'processing').length;
  const completedCount = orderQueue.filter((q) => q.status === 'completed').length;

  const formatTime = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const handleGoToTable = (tableId: string) => {
    setActiveTableId(tableId);
    setActiveTab('pos');
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 110 }}>
      <div className="modal-content-card" style={{ width: 620, maxHeight: '88vh' }}>
        {/* Header */}
        <div
          style={{
            padding: '14px 20px',
            background: 'var(--color-bg-elevated)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: workerStatus === 'processing' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                border: `1.5px solid ${workerStatus === 'processing' ? 'var(--color-primary)' : 'var(--color-emerald)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: workerStatus === 'processing' ? 'var(--color-primary)' : 'var(--color-emerald)',
              }}
            >
              <Cpu size={20} className={workerStatus === 'processing' ? 'animate-pulse' : ''} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>
                {language === 'th' ? 'ระบบคิวออเดอร์ลูกค้า (Queue Worker)' : 'Order Queue Worker'}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: workerStatus === 'processing' ? '#f59e0b' : '#10b981',
                    boxShadow: `0 0 6px ${workerStatus === 'processing' ? '#f59e0b' : '#10b981'}`,
                  }}
                />
                <span>
                  {workerStatus === 'processing'
                    ? (language === 'th' ? 'กำลังประมวลผลออเดอร์...' : 'Worker Ingesting...')
                    : (language === 'th' ? 'Worker พร้อมทำงาน (Idle)' : 'Worker Ready (Idle)')}
                </span>
                <span>•</span>
                <span>Priority: POS Master Main</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#fff',
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Stats Metrics Bar */}
        <div
          style={{
            padding: '12px 20px',
            background: 'rgba(0, 0, 0, 0.25)',
            borderBottom: '1px solid var(--color-border)',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
          }}
        >
          <div style={{ background: 'var(--color-bg-card)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>
              {language === 'th' ? 'ในคิวรอทำ (Queued)' : 'Queued'}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: queuedCount > 0 ? '#f59e0b' : '#fff', fontFamily: 'var(--font-mono)' }}>
              {queuedCount}
            </div>
          </div>
          <div style={{ background: 'var(--color-bg-card)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>
              {language === 'th' ? 'กำลังประมวลผล' : 'Processing'}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: processingCount > 0 ? '#38bdf8' : '#fff', fontFamily: 'var(--font-mono)' }}>
              {processingCount}
            </div>
          </div>
          <div style={{ background: 'var(--color-bg-card)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>
              {language === 'th' ? 'ประมวลผลแล้ว (เสร็จ)' : 'Completed'}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
              {completedCount}
            </div>
          </div>
        </div>

        {/* Queue Items List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {orderQueue.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-muted)' }}>
              <Clock size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                {language === 'th' ? 'ไม่มีออเดอร์ในคิว' : 'Queue is empty'}
              </div>
              <p style={{ fontSize: 12, marginTop: 4 }}>
                {language === 'th'
                  ? 'เมื่อลูกค้าสแกน QR และกดสั่งอาหารจากโต๊ะ ออเดอร์จะเข้ามาที่คิวนี้ทันที'
                  : 'Customer self-orders from QR will appear here in real-time.'}
              </p>
            </div>
          ) : (
            orderQueue.map((item) => {
              const totalItemsCount = item.items.reduce((sum, i) => sum + i.quantity, 0);
              const isQueued = item.status === 'queued';
              const isProcessing = item.status === 'processing';

              return (
                <div
                  key={item.id}
                  style={{
                    background: 'var(--color-bg-card)',
                    border: `1px solid ${
                      isProcessing
                        ? 'rgba(245, 158, 11, 0.5)'
                        : isQueued
                        ? 'rgba(56, 189, 248, 0.4)'
                        : 'var(--color-border)'
                    }`,
                    borderRadius: 10,
                    padding: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: 'rgba(245, 158, 11, 0.15)',
                          color: 'var(--color-primary)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                        }}
                      >
                        โต๊ะ {item.tableName}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                        {item.id.slice(-8)}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        {formatTime(item.submittedAt)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isQueued && (
                        <span
                          style={{
                            fontSize: 11,
                            padding: '3px 8px',
                            borderRadius: 12,
                            fontWeight: 700,
                            background: 'rgba(56, 189, 248, 0.15)',
                            color: '#38bdf8',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Clock size={11} /> รอคิว (Queued)
                        </span>
                      )}
                      {isProcessing && (
                        <span
                          style={{
                            fontSize: 11,
                            padding: '3px 8px',
                            borderRadius: 12,
                            fontWeight: 700,
                            background: 'rgba(245, 158, 11, 0.2)',
                            color: '#f59e0b',
                            border: '1px solid rgba(245, 158, 11, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Cpu size={11} /> กำลังลงระบบ...
                        </span>
                      )}
                      {item.status === 'completed' && (
                        <span
                          style={{
                            fontSize: 11,
                            padding: '3px 8px',
                            borderRadius: 12,
                            fontWeight: 700,
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#34d399',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <CheckCircle2 size={11} /> ลงบิลแล้ว ({formatTime(item.processedAt)})
                        </span>
                      )}
                      {item.status === 'failed' && (
                        <span
                          style={{
                            fontSize: 11,
                            padding: '3px 8px',
                            borderRadius: 12,
                            fontWeight: 700,
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#f87171',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <AlertCircle size={11} /> ล้มเหลว
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Item preview */}
                  <div style={{ background: 'rgba(0, 0, 0, 0.2)', borderRadius: 6, padding: '8px 12px', fontSize: 12 }}>
                    <div style={{ fontWeight: 700, color: '#fff', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Flame size={13} style={{ color: '#ef4444' }} />
                      <span>{totalItemsCount} รายการ:</span>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                      {item.items.map((it, idx) => (
                        <li key={idx}>
                          <span style={{ color: '#fff', fontWeight: 600 }}>{it.quantity}x {it.menuItem.nameTh}</span>
                          {it.modifiers.length > 0 && (
                            <span style={{ color: '#f59e0b', fontSize: 11 }}> ({it.modifiers.map((m) => m.optionNameTh).join(', ')})</span>
                          )}
                          {it.instructions && (
                            <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 11 }}> — "{it.instructions}"</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button
                      onClick={() => handleGoToTable(item.tableId)}
                      className="btn-secondary"
                      style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <span>{language === 'th' ? 'เปิดบิลโต๊ะนี้' : 'Open Table'}</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            background: 'var(--color-bg-elevated)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
            ⚡ Cross-window BroadcastChannel Worker active
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {completedCount > 0 && (
              <button
                onClick={clearCompletedQueue}
                className="btn-secondary"
                style={{ padding: '8px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Trash2 size={13} />
                <span>{language === 'th' ? 'ล้างประวัติที่เสร็จแล้ว' : 'Clear Completed'}</span>
              </button>
            )}

            <button onClick={onClose} className="btn-primary" style={{ padding: '8px 18px', fontSize: 12 }}>
              {language === 'th' ? 'ปิด' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
