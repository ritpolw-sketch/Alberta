import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  Key,
  Webhook,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  RefreshCw,
  Send,
  Building,
  Code2,
} from 'lucide-react';
import type { ApiKeyPermission, AccountingPlatform } from '../../types/pos';

export const AccountingApiPanel: React.FC = () => {
  const {
    apiKeys,
    webhooks,
    accountingConfig,
    generateApiKey,
    revokeApiKey,
    addWebhookEndpoint,
    deleteWebhookEndpoint,
    updateAccountingConfig,
    triggerTestWebhook,
    language,
  } = usePOS();

  const [activeSubTab, setActiveSubTab] = useState<'api_keys' | 'mcp_server' | 'accounting_connectors' | 'webhooks'>('api_keys');
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [showNewWebhookModal, setShowNewWebhookModal] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // New Key Form state
  const [keyName, setKeyName] = useState('');
  const [keyEnv, setKeyEnv] = useState<'live' | 'test'>('live');
  const [selectedPermissions, setSelectedPermissions] = useState<ApiKeyPermission[]>([
    'read_sales',
    'read_bills',
    'read_write_pos',
    'export_vat_tax',
    'accounting_sync',
  ]);

  // Webhook Form state
  const [targetUrl, setTargetUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<('bill.completed' | 'po.paid' | 'shift.closed')[]>([
    'bill.completed',
    'po.paid',
    'shift.closed',
  ]);

  const togglePermission = (perm: ApiKeyPermission) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const toggleEvent = (ev: 'bill.completed' | 'po.paid' | 'shift.closed') => {
    setSelectedEvents((prev) =>
      prev.includes(ev) ? prev.filter((e) => e !== ev) : [...prev, ev]
    );
  };

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName) return;
    generateApiKey(keyName, selectedPermissions, keyEnv);
    setKeyName('');
    setShowNewKeyModal(false);
  };

  const handleCreateWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl) return;
    const randomSecret = `whsec_${Math.random().toString(36).substring(2, 10)}`;
    addWebhookEndpoint({
      targetUrl,
      secretHeader: randomSecret,
      events: selectedEvents,
      active: true,
    });
    setTargetUrl('');
    setShowNewWebhookModal(false);
  };

  const handleCopyKey = (id: string, secret: string) => {
    navigator.clipboard.writeText(secret);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const toggleRevealSecret = (id: string) => {
    setRevealedKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const activeKeyForMcp = apiKeys.find((k) => k.active) || apiKeys[0];

  const mcpConfigJson = JSON.stringify(
    {
      mcpServers: {
        'alberta-pos-mcp': {
          command: 'npx',
          args: ['-y', '@alberta-pos/mcp-server'],
          env: {
            ALBERTA_API_KEY: activeKeyForMcp?.keySecret || 'ak_live_alberta_your_key_here',
            ALBERTA_STORE_ID: 'STORE-RAMA3-01',
          },
        },
      },
    },
    null,
    2
  );

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20, color: '#fff' }}>
      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))',
          padding: '16px 20px',
          borderRadius: 14,
          border: '1px solid var(--color-border)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
            }}
          >
            <Key size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
                {language === 'th' ? 'API Key & การเชื่อมต่อโปรแกรมบัญชี (MCP & Connectors)' : 'API Keys & Accounting Integration'}
              </h2>
              <span
                style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 10,
                  background: 'rgba(139, 92, 246, 0.2)',
                  color: '#c084fc',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                🔒 Owner Auth Required
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
              จัดการ API Key, MCP Server สื่อสารกับ AI Agents, ซิงค์ยอดขายและ PO อัตโนมัติกับ FlowAccount / PEAK / Xero
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowNewKeyModal(true)}
          className="btn-primary"
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
          }}
        >
          <Plus size={16} />
          <span>สร้าง API Key ใหม่</span>
        </button>
      </div>

      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--color-border)', paddingBottom: 10 }}>
        <button
          onClick={() => setActiveSubTab('api_keys')}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: activeSubTab === 'api_keys' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
            color: activeSubTab === 'api_keys' ? '#c084fc' : 'var(--color-text-secondary)',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Key size={15} />
          <span>🔑 API Keys ({apiKeys.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('mcp_server')}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: activeSubTab === 'mcp_server' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
            color: activeSubTab === 'mcp_server' ? '#c084fc' : 'var(--color-text-secondary)',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Code2 size={15} />
          <span>🤖 MCP Server Config (สำหรับ AI Agents)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('accounting_connectors')}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: activeSubTab === 'accounting_connectors' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
            color: activeSubTab === 'accounting_connectors' ? '#c084fc' : 'var(--color-text-secondary)',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Building size={15} />
          <span>🇹🇭 โปรแกรมบัญชี (FlowAccount / PEAK / Express)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('webhooks')}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: activeSubTab === 'webhooks' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
            color: activeSubTab === 'webhooks' ? '#c084fc' : 'var(--color-text-secondary)',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Webhook size={15} />
          <span>⚡ Webhooks ({webhooks.length})</span>
        </button>
      </div>

      {/* TAB 1: API KEYS */}
      {activeSubTab === 'api_keys' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>API Key สำหรับเชื่อมต่อโปรแกรมภายนอก & AI</h3>
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
              เก็บบันทึก Secret Key ในสถานที่ปลอดภัย ห้ามเปิดเผยแก่บุคคลภายนอก
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {apiKeys.map((key) => (
              <div
                key={key.id}
                style={{
                  background: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h4 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: '#c084fc' }}>{key.name}</h4>
                      <span
                        style={{
                          fontSize: 10,
                          padding: '2px 6px',
                          borderRadius: 8,
                          background: key.environment === 'live' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          color: key.environment === 'live' ? '#34d399' : '#fbbf24',
                          fontWeight: 700,
                        }}
                      >
                        {key.environment.toUpperCase()}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      สร้างเมื่อ {new Date(key.createdAt).toLocaleDateString('th-TH')} • ใช้งานล่าสุด:{' '}
                      {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : 'ยังไม่เคยใช้'}
                    </span>
                  </div>

                  <button
                    onClick={() => revokeApiKey(key.id)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#f87171',
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Trash2 size={13} /> เพิกถอน Key
                  </button>
                </div>

                {/* Secret Key Input Box */}
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <code style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                    {revealedKeys[key.id] ? key.keySecret : `${key.keySecret.substring(0, 14)}••••••••••••••••••••`}
                  </code>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => toggleRevealSecret(key.id)}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
                      title="ซ่อน/แสดง Key"
                    >
                      {revealedKeys[key.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                      onClick={() => handleCopyKey(key.id, key.keySecret)}
                      style={{
                        background: copiedKeyId === key.id ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid var(--color-border)',
                        color: copiedKeyId === key.id ? '#34d399' : '#fff',
                        borderRadius: 6,
                        padding: '4px 8px',
                        fontSize: 11,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Copy size={13} />
                      <span>{copiedKeyId === key.id ? 'คัดลอกแล้ว!' : 'คัดลอก'}</span>
                    </button>
                  </div>
                </div>

                {/* Scope Permissions Badges */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {key.permissions.map((p, idx) => (
                    <span key={idx} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 8, background: 'rgba(139, 92, 246, 0.12)', color: '#c084fc', border: '1px solid rgba(139, 92, 246, 0.25)', fontWeight: 600 }}>
                      ✓ {p}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: MCP SERVER CONFIG */}
      {activeSubTab === 'mcp_server' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 750 }}>
          <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Code2 size={20} style={{ color: '#c084fc' }} />
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Model Context Protocol (MCP) Integration</h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
              นำ JSON Config ด้านล่างนี้ไปใส่ใน <code>mcp_config.json</code> ของ Antigravity, Claude Desktop, หรือ AI Agents ของคุณ เพื่อให้อาจารย์/บอท AI สามารถดึงข้อมูลยอดขาย, PO, และตัดสต็อกสินค้าใน Alberta POS ได้โดยตรง
            </p>

            <div style={{ background: '#090d16', padding: 14, borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.1)', position: 'relative' }}>
              <button
                onClick={() => handleCopyKey('mcp_config', mcpConfigJson)}
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  background: copiedKeyId === 'mcp_config' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid var(--color-border)',
                  color: copiedKeyId === 'mcp_config' ? '#34d399' : '#fff',
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: 11,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <Copy size={13} />
                <span>{copiedKeyId === 'mcp_config' ? 'คัดลอก JSON แล้ว!' : 'คัดลอก JSON'}</span>
              </button>
              <pre style={{ margin: 0, fontSize: 12, fontFamily: 'var(--font-mono)', color: '#38bdf8', overflowX: 'auto' }}>
                {mcpConfigJson}
              </pre>
            </div>

            <div style={{ fontSize: 12, background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)', padding: 12, borderRadius: 8, color: '#22d3ee' }}>
              <strong>🤖 Supported MCP Tools capability in Alberta POS:</strong>
              <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                <li><code>get_daily_sales_summary</code>: ดึงสรุปยอดขายสุทธิ VAT และช่องทางชำระเงิน</li>
                <li><code>list_purchase_orders</code>: รายการ PO และสถานะการรับของซัพพลายเออร์</li>
                <li><code>export_vat_30_tax_report</code>: ส่งออกข้อมูลรายงานภาษีขาย ภ.พ.30</li>
                <li><code>post_accounting_journal_entry</code>: ลงบัญชีเดบิต/เครดิตเข้า FlowAccount หรือ PEAK</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ACCOUNTING CONNECTORS */}
      {activeSubTab === 'accounting_connectors' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 680 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>เชื่อมต่อโปรแกรมบัญชีไทย (Thai SME Accounting Integration)</h3>

          <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Select Platform */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>เลือกโปรแกรมบัญชีหลักของร้าน</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { id: 'flowaccount', name: 'FlowAccount', desc: 'ซิงค์บิลขาย & PO อัตโนมัติ' },
                  { id: 'peak', name: 'PEAK Account', desc: 'ลงบัญชีแยกประเภทอัตโนมัติ' },
                  { id: 'trcloud', name: 'TRCLOUD / Express', desc: 'ส่งออกไฟล์ ภ.พ.30 ภาษี' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => updateAccountingConfig({ platform: p.id as AccountingPlatform })}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      border: accountingConfig.platform === p.id ? '2px solid #c084fc' : '1px solid var(--color-border)',
                      background: accountingConfig.platform === p.id ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                      color: '#fff',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: 14, color: accountingConfig.platform === p.id ? '#c084fc' : '#fff' }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 0 }} />

            {/* API Credentials */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>ข้อมูล API Credentials ({accountingConfig.platform.toUpperCase()})</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>Client API Key / User Token</label>
                  <input
                    type="text"
                    value={accountingConfig.apiKey}
                    onChange={(e) => updateAccountingConfig({ apiKey: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: '#fff', fontSize: 12 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>API Secret Key</label>
                  <input
                    type="password"
                    value={accountingConfig.apiSecret}
                    onChange={(e) => updateAccountingConfig({ apiSecret: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: '#fff', fontSize: 12 }}
                  />
                </div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 0 }} />

            {/* Account Mapping */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>แมปผังบัญชี (Chart of Accounts Mapping)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>รหัสบัญชีรายได้จากการขาย</label>
                  <input
                    type="text"
                    value={accountingConfig.salesAccountCode}
                    onChange={(e) => updateAccountingConfig({ salesAccountCode: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: '#fff', fontSize: 12 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>รหัสบัญชีต้นทุนวัตถุดิบ (COGS)</label>
                  <input
                    type="text"
                    value={accountingConfig.cogsAccountCode}
                    onChange={(e) => updateAccountingConfig({ cogsAccountCode: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: '#fff', fontSize: 12 }}
                  />
                </div>
              </div>
            </div>

            {/* Auto Sync Toggles */}
            <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: 12, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={accountingConfig.autoSyncDailySales}
                  onChange={(e) => updateAccountingConfig({ autoSyncDailySales: e.target.checked })}
                />
                <span>ซิงค์ยอดขายประจำวันเข้าโปรแกรมบัญชีอัตโนมัติเมื่อปิดกะ (Daily Sales Voucher)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={accountingConfig.autoSyncPurchaseOrders}
                  onChange={(e) => updateAccountingConfig({ autoSyncPurchaseOrders: e.target.checked })}
                />
                <span>ซิงค์ใบสั่งซื้อสินค้า PO & ค่าใช้จ่ายเข้าเป็นใบกำกับภาษีซื้ออัตโนมัติ</span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6 }}>
              <span style={{ fontSize: 11, color: '#34d399', fontWeight: 700 }}>
                ✓ เชื่อมต่อสำเร็จ ซิงค์ล่าสุด: {accountingConfig.lastSyncedAt ? new Date(accountingConfig.lastSyncedAt).toLocaleString('th-TH') : 'ยังไม่เคยซิงค์'}
              </span>
              <button
                onClick={() => updateAccountingConfig({})}
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: 12, fontWeight: 700, borderRadius: 8, background: 'linear-gradient(135deg, #10b981, #059669)' }}
              >
                <RefreshCw size={14} /> บันทึก & ซิงค์ข้อมูลทันที
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: WEBHOOKS */}
      {activeSubTab === 'webhooks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 700 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Webhook Event Endpoints</h3>
            <button
              onClick={() => setShowNewWebhookModal(true)}
              className="btn-primary"
              style={{ padding: '6px 12px', fontSize: 12 }}
            >
              <Plus size={14} /> เพิ่ม Webhook URL
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {webhooks.map((wh) => (
              <div
                key={wh.id}
                style={{
                  background: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Webhook size={16} style={{ color: '#c084fc' }} />
                    <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>{wh.targetUrl}</span>
                  </div>
                  <button
                    onClick={() => deleteWebhookEndpoint(wh.id)}
                    style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 4 }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {wh.events.map((ev, idx) => (
                    <span key={idx} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', fontWeight: 700 }}>
                      ⚡ {ev}
                    </span>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                    ส่งล่าสุด: {wh.lastTriggeredAt ? new Date(wh.lastTriggeredAt).toLocaleTimeString('th-TH') : 'ยังไม่เคยส่ง'} (Status: {wh.lastStatus || '200 OK'})
                  </span>
                  <button
                    onClick={() => triggerTestWebhook(wh.id)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      background: 'rgba(139, 92, 246, 0.15)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      color: '#c084fc',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Send size={12} /> ส่ง Test Webhook Payload
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Generate API Key */}
      {showNewKeyModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <form
            onSubmit={handleCreateKey}
            style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              width: '100%',
              maxWidth: 460,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#c084fc' }}>สร้าง API Secret Key ใหม่</h3>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>ชื่อระบุ Key (Key Description)</label>
              <input
                type="text"
                placeholder="เช่น FlowAccount Daily Sync หรือ Agent AI Key"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                required
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: '#fff' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>สภาพแวดล้อม (Environment)</label>
                <select
                  value={keyEnv}
                  onChange={(e) => setKeyEnv(e.target.value as 'live' | 'test')}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: '#fff' }}
                >
                  <option value="live">🟢 Live (การใช้งานจริง)</option>
                  <option value="test">🟡 Test (สภาพแวดล้อมทดสอบ)</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>สิทธิ์เข้าถึงข้อมูล (Scope Permissions)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: 'rgba(15, 23, 42, 0.5)', padding: 10, borderRadius: 8 }}>
                {[
                  { id: 'read_sales', name: 'อ่านยอดขายสุทธิและสรุปการชำระเงิน (Read Sales)' },
                  { id: 'read_bills', name: 'อ่านประวัติบิลทั้งหมด (Read Bill Logs)' },
                  { id: 'read_write_pos', name: 'อ่าน/เขียน ใบสั่งซื้อ PO (Read/Write Purchase Orders)' },
                  { id: 'read_inventory', name: 'อ่านระดับคลังวัตถุดิบ (Read Inventory)' },
                  { id: 'export_vat_tax', name: 'ส่งออกรายงานภาษีขาย ภ.พ.30 (VAT 7% Export)' },
                  { id: 'accounting_sync', name: 'ซิงค์ลงบัญชีแยกประเภท (Accounting Journal Entry)' },
                ].map((p) => (
                  <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(p.id as ApiKeyPermission)}
                      onChange={() => togglePermission(p.id as ApiKeyPermission)}
                    />
                    <span>{p.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
              <button type="button" onClick={() => setShowNewKeyModal(false)} className="btn-secondary" style={{ padding: '8px 14px' }}>
                ยกเลิก
              </button>
              <button type="submit" className="btn-primary" style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>
                สร้าง Key ทันที
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: New Webhook Endpoint */}
      {showNewWebhookModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <form
            onSubmit={handleCreateWebhook}
            style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              width: '100%',
              maxWidth: 460,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#38bdf8' }}>เพิ่ม Webhook Event Endpoint ใหม่</h3>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>Webhook Target URL</label>
              <input
                type="url"
                placeholder="https://api.flowaccount.com/v1/webhooks/alberta"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                required
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: '#fff' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>เหตุการณ์ที่ต้องการรับ (Subscribed Events)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: 'rgba(15, 23, 42, 0.5)', padding: 10, borderRadius: 8 }}>
                {[
                  { id: 'bill.completed', name: '⚡ bill.completed (เมื่อชำระบิลสำเร็จ)' },
                  { id: 'po.paid', name: '⚡ po.paid (เมื่ออนุมัติชำระเงิน PO และตัดสต็อก)' },
                  { id: 'shift.closed', name: '⚡ shift.closed (เมื่อปิดกะรอบวันและคำนวณเงินขาด/เกิน)' },
                ].map((ev) => (
                  <label key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(ev.id as any)}
                      onChange={() => toggleEvent(ev.id as any)}
                    />
                    <span>{ev.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
              <button type="button" onClick={() => setShowNewWebhookModal(false)} className="btn-secondary" style={{ padding: '8px 14px' }}>
                ยกเลิก
              </button>
              <button type="submit" className="btn-primary" style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}>
                บันทึก Webhook
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
