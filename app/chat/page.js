'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/* ── Orgs ── */
const CORP_ID = '00000000-0000-0000-0000-000000000001';
const STORES  = [
  { id: '00000000-0000-0000-0000-000000000002', name: 'Futurteck',      ico: '📱', color: '#0A84FF' },
  { id: '00000000-0000-0000-0000-000000000003', name: 'Innovatech Store', ico: '💻', color: '#BF5AF2' },
  { id: '00000000-0000-0000-0000-000000000004', name: 'WeTech Peru',    ico: '⌚', color: '#30D158' },
];

function useTheme() {
  const [theme, setTheme] = useState('dark');
  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'dark';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);
  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
  }
  return { theme, toggleTheme };
}

export default function ChatPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  const [profile,      setProfile]      = useState(null);
  const [role,         setRole]         = useState('');
  const [orgId,        setOrgId]        = useState('');
  const [userId,       setUserId]       = useState('');
  const [loading,      setLoading]      = useState(true);

  const [channels,     setChannels]     = useState([]);
  const [activeChannel,setActiveChannel]= useState(null);
  const [messages,     setMessages]     = useState([]);
  const [msgLoading,   setMsgLoading]   = useState(false);
  const [text,         setText]         = useState('');
  const [sending,      setSending]      = useState(false);
  const [unread,       setUnread]       = useState({});
  const [sidebarOpen,  setSidebarOpen]  = useState(true);

  /* ── AUTH ── */
  useEffect(() => { init(); }, []);

  async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace('/ingresar/corp'); return; }
    const uid = session.user.id;
    setUserId(uid);

    const { data: prof }     = await supabase.from('users').select('*, organizations(name)').eq('id', uid).single();
    const { data: roleRow }  = await supabase.from('user_roles').select('role').eq('user_id', uid).single();
    const r   = roleRow?.role || 'vendedor';
    const oid = prof?.org_id;

    setProfile(prof);
    setRole(r);
    setOrgId(oid);
    setLoading(false);

    await ensureChannels();
    await loadChannels(r, oid);
  }

  /* ── Crear canales por defecto si no existen ── */
  async function ensureChannels() {
    for (const store of STORES) {
      const { data: existing } = await supabase
        .from('chat_channels')
        .select('id')
        .eq('org_id', store.id)
        .single();
      if (!existing) {
        await supabase.from('chat_channels').insert({
          name:   `Corp ↔ ${store.name}`,
          org_id: store.id,
        });
      }
    }
  }

  /* ── Cargar canales según rol ── */
  async function loadChannels(r, oid) {
    const isCorp = r === 'superadmin' || r === 'corp';
    let q = supabase.from('chat_channels').select('id, name, org_id').order('name');
    if (!isCorp) q = q.eq('org_id', oid);
    const { data } = await q;
    setChannels(data || []);
    if (data && data.length > 0) openChannel(data[0]);
  }

  /* ── Abrir canal ── */
  async function openChannel(ch) {
    setActiveChannel(ch);
    setMessages([]);
    setMsgLoading(true);
    setUnread(u => ({ ...u, [ch.id]: 0 }));
    if (window.innerWidth < 768) setSidebarOpen(false);

    const { data } = await supabase
      .from('chat_messages')
      .select('id, content, created_at, user_id, users(full_name)')
      .eq('channel_id', ch.id)
      .order('created_at', { ascending: true })
      .limit(100);

    setMessages(data || []);
    setMsgLoading(false);
    setTimeout(() => scrollToBottom(), 80);
  }

  /* ── Realtime ── */
  useEffect(() => {
    if (!activeChannel) return;
    const sub = supabase
      .channel(`chat-${activeChannel.id}`)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'chat_messages',
        filter: `channel_id=eq.${activeChannel.id}`,
      }, async (payload) => {
        const row = payload.new;
        // Traer nombre del usuario
        const { data: u } = await supabase.from('users').select('full_name').eq('id', row.user_id).single();
        const msg = { ...row, users: { full_name: u?.full_name || 'Usuario' } };
        setMessages(prev => [...prev, msg]);
        setTimeout(() => scrollToBottom(), 60);
      })
      .subscribe();

    // Notificaciones de otros canales
    const allSub = supabase
      .channel('chat-all-notify')
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'chat_messages',
      }, (payload) => {
        const cid = payload.new.channel_id;
        if (cid !== activeChannel.id) {
          setUnread(u => ({ ...u, [cid]: (u[cid] || 0) + 1 }));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
      supabase.removeChannel(allSub);
    };
  }, [activeChannel]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  /* ── Enviar mensaje ── */
  async function sendMessage(e) {
    e?.preventDefault();
    const t = text.trim();
    if (!t || !activeChannel || sending) return;
    setSending(true);
    setText('');
    await supabase.from('chat_messages').insert({
      channel_id: activeChannel.id,
      user_id:    userId,
      content:    t,
    });
    setSending(false);
    inputRef.current?.focus();
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  function getStoreInfo(orgId) {
    return STORES.find(s => s.id === orgId) || { ico: '💬', color: '#8E8E93' };
  }

  function formatTime(ts) {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
  }

  function formatMsgTime(ts) {
    return new Date(ts).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  }

  if (loading) return (
    <div className="auth-screen"><div className="loading-wrap"><div className="spinner" /></div></div>
  );

  const isCorp     = role === 'superadmin' || role === 'corp';
  const accentColor = activeChannel ? getStoreInfo(activeChannel.org_id).color : '#0A84FF';

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: 'var(--bg)', fontFamily: "'Urbanist','Inter',sans-serif" }}>

      {/* SIDEBAR */}
      <div style={{
        width:        sidebarOpen ? 280 : 0,
        minWidth:     sidebarOpen ? 280 : 0,
        overflow:     'hidden',
        transition:   'all 0.25s ease',
        borderRight:  '1px solid var(--border)',
        display:      'flex',
        flexDirection:'column',
        background:   'var(--surface)',
      }}>
        {/* Sidebar header */}
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>💬 Chat Corp</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={toggleTheme} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-muted)' }}>✕</button>
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {profile?.full_name} · {role?.toUpperCase()}
          </div>
        </div>

        {/* Channel list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
          {channels.length === 0 ? (
            <div style={{ padding: '20px 12px', color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>Sin canales disponibles</div>
          ) : channels.map(ch => {
            const si      = getStoreInfo(ch.org_id);
            const isActive= activeChannel?.id === ch.id;
            const badge   = unread[ch.id] || 0;
            return (
              <div key={ch.id} onClick={() => openChannel(ch)} style={{
                display:      'flex',
                alignItems:   'center',
                gap:          12,
                padding:      '11px 12px',
                borderRadius: 12,
                cursor:       'pointer',
                background:   isActive ? `${si.color}18` : 'transparent',
                border:       isActive ? `1px solid ${si.color}40` : '1px solid transparent',
                marginBottom: 4,
                transition:   'all 0.15s',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: `${si.color}22`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, flexShrink: 0,
                }}>{si.ico}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {isCorp ? ch.name : 'Corp Tech'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>Canal oficial</div>
                </div>
                {badge > 0 && (
                  <div style={{
                    background: si.color, color: '#fff',
                    borderRadius: 10, fontSize: 11, fontWeight: 700,
                    minWidth: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 6px',
                  }}>{badge}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Chat top bar */}
        <div style={{
          padding:      '0 16px',
          height:       56,
          borderBottom: '1px solid var(--border)',
          display:      'flex',
          alignItems:   'center',
          gap:          12,
          background:   'var(--surface)',
          flexShrink:   0,
        }}>
          <button onClick={() => setSidebarOpen(o => !o)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 20, color: 'var(--text)', padding: 4,
          }}>☰</button>

          {activeChannel ? (() => {
            const si = getStoreInfo(activeChannel.org_id);
            return (
              <>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `${si.color}22`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                }}>{si.ico}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                    {isCorp ? activeChannel.name : 'Corp Tech'}
                  </div>
                  <div style={{ fontSize: 11, color: si.color, fontWeight: 500 }}>● En línea</div>
                </div>
              </>
            );
          })() : (
            <div style={{ fontSize: 15, color: 'var(--text-muted)' }}>Selecciona un canal</div>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {!activeChannel ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>Selecciona un canal para chatear</div>
            </div>
          ) : msgLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
              <div className="spinner" />
            </div>
          ) : messages.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80%', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🤝</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>¡Canal listo!</div>
              <div style={{ fontSize: 13, textAlign: 'center', maxWidth: 240 }}>Sé el primero en escribir. Los mensajes aparecen en tiempo real.</div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => {
                const isMe   = msg.user_id === userId;
                const si     = getStoreInfo(activeChannel.org_id);
                const color  = isMe ? accentColor : (isCorp ? si.color : '#0A84FF');
                const prevMsg= messages[i - 1];
                const showName = !isMe && (!prevMsg || prevMsg.user_id !== msg.user_id);
                return (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', marginBottom: 6 }}>
                    {showName && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2, marginLeft: 4 }}>
                        {msg.users?.full_name || 'Usuario'}
                      </div>
                    )}
                    <div style={{
                      maxWidth:     '72%',
                      padding:      '9px 14px',
                      borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background:   isMe ? color : 'var(--card)',
                      color:        isMe ? '#fff' : 'var(--text)',
                      fontSize:     15,
                      lineHeight:   1.45,
                      boxShadow:    '0 1px 4px rgba(0,0,0,0.12)',
                      wordBreak:    'break-word',
                    }}>
                      {msg.content}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, marginLeft: 4, marginRight: 4 }}>
                      {formatMsgTime(msg.created_at)}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        {activeChannel && (
          <div style={{
            padding:      '12px 16px',
            borderTop:    '1px solid var(--border)',
            background:   'var(--surface)',
            flexShrink:   0,
          }}>
            <form onSubmit={sendMessage} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <textarea
                ref={inputRef}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Escribe un mensaje... (Enter para enviar)"
                rows={1}
                style={{
                  flex:         1,
                  padding:      '10px 14px',
                  borderRadius: 20,
                  border:       '1px solid var(--border)',
                  background:   'var(--bg)',
                  color:        'var(--text)',
                  fontSize:     15,
                  resize:       'none',
                  outline:      'none',
                  fontFamily:   'inherit',
                  maxHeight:    120,
                  overflowY:    'auto',
                  lineHeight:   1.4,
                }}
                onInput={e => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
              />
              <button type="submit" disabled={!text.trim() || sending} style={{
                width:        44,
                height:       44,
                borderRadius: '50%',
                border:       'none',
                background:   text.trim() ? accentColor : 'var(--card)',
                color:        text.trim() ? '#fff' : 'var(--text-muted)',
                fontSize:     18,
                cursor:       text.trim() ? 'pointer' : 'default',
                display:      'flex',
                alignItems:   'center',
                justifyContent:'center',
                flexShrink:   0,
                transition:   'all 0.15s',
              }}>
                {sending ? '⏳' : '↑'}
              </button>
            </form>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
              Enter para enviar · Shift+Enter para nueva línea
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
