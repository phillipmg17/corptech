'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

const CORP_ID = '00000000-0000-0000-0000-000000000001';
const STORE_COLORS = {
  '00000000-0000-0000-0000-000000000002': '#0A84FF',
  '00000000-0000-0000-0000-000000000003': '#BF5AF2',
  '00000000-0000-0000-0000-000000000004': '#30D158',
};

function playPing() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch {}
}

export default function ChatBubble() {
  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const realtimeRef    = useRef(null);

  const [ready,        setReady]        = useState(false);
  const [open,         setOpen]         = useState(false);
  const [userId,       setUserId]       = useState(null);
  const [profile,      setProfile]      = useState(null);
  const [role,         setRole]         = useState('');
  const [orgId,        setOrgId]        = useState('');

  const [channels,     setChannels]     = useState([]);
  const [activeIdx,    setActiveIdx]    = useState(0);
  const [messages,     setMessages]     = useState([]);
  const [msgLoading,   setMsgLoading]   = useState(false);
  const [text,         setText]         = useState('');
  const [sending,      setSending]      = useState(false);
  const [unread,       setUnread]       = useState({});  // { channelId: count }
  const totalUnread = Object.values(unread).reduce((a,b)=>a+b, 0);

  /* ── INIT ── */
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const uid = session.user.id;
      setUserId(uid);
      const { data: prof }    = await supabase.from('users').select('*, organizations(name)').eq('id', uid).single();
      const { data: roleRow } = await supabase.from('user_roles').select('role').eq('user_id', uid).single();
      const r   = roleRow?.role || 'vendedor';
      const oid = prof?.org_id;
      setProfile(prof);
      setRole(r);
      setOrgId(oid);

      const chs = await loadChannels(r, oid);
      setChannels(chs);
      if (chs.length > 0) {
        await loadMessages(chs[0].id);
        subscribeAll(chs, uid);
      }
      setReady(true);
    });
    return () => { if (realtimeRef.current) supabase.removeChannel(realtimeRef.current); };
  }, []);

  async function loadChannels(r, oid) {
    const isCorp = r === 'superadmin' || r === 'corp';
    if (isCorp) {
      // Corp ve todos los canales corp_store
      const { data } = await supabase
        .from('chat_channels')
        .select('id, name, org_id, channel_type')
        .eq('channel_type', 'corp_store')
        .order('name');
      return data || [];
    } else {
      // Tienda ve: su canal con corp + canal interno
      const { data } = await supabase
        .from('chat_channels')
        .select('id, name, org_id, channel_type')
        .eq('org_id', oid)
        .order('channel_type');
      return data || [];
    }
  }

  async function loadMessages(channelId) {
    setMsgLoading(true);
    const { data } = await supabase
      .from('chat_messages')
      .select('id, content, created_at, user_id, users(full_name)')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true })
      .limit(80);
    setMessages(data || []);
    setMsgLoading(false);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
  }

  /* ── Realtime: escuchar TODOS los canales a la vez ── */
  function subscribeAll(chs, uid) {
    if (realtimeRef.current) supabase.removeChannel(realtimeRef.current);
    const sub = supabase.channel('chat-bubble-all')
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'chat_messages',
      }, async (payload) => {
        const msg = payload.new;
        const isMyChannel = chs.some(c => c.id === msg.channel_id);
        if (!isMyChannel) return;

        // Fetch sender name
        const { data: u } = await supabase.from('users').select('full_name').eq('id', msg.user_id).single();
        const enriched = { ...msg, users: { full_name: u?.full_name || 'Usuario' } };

        setActiveIdx(idx => {
          const activeCh = chs[idx];
          if (activeCh?.id === msg.channel_id) {
            // Mensaje en canal activo
            setMessages(prev => [...prev, enriched]);
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
          } else {
            // Mensaje en canal no activo → unread + sonido
            setUnread(u => ({ ...u, [msg.channel_id]: (u[msg.channel_id] || 0) + 1 }));
            if (msg.user_id !== uid) playPing();
          }
          return idx;
        });

        // Sonido si el panel está cerrado o el mensaje es de otro
        setOpen(o => {
          if (!o && msg.user_id !== uid) playPing();
          return o;
        });
      })
      .subscribe();
    realtimeRef.current = sub;
  }

  /* ── Cambiar canal ── */
  async function switchChannel(idx) {
    setActiveIdx(idx);
    const ch = channels[idx];
    setUnread(u => ({ ...u, [ch.id]: 0 }));
    await loadMessages(ch.id);
  }

  /* ── Enviar ── */
  async function sendMessage(e) {
    e?.preventDefault();
    const t = text.trim();
    if (!t || sending || channels.length === 0) return;
    setSending(true);
    setText('');
    await supabase.from('chat_messages').insert({
      channel_id: channels[activeIdx]?.id,
      user_id:    userId,
      content:    t,
    });
    setSending(false);
    inputRef.current?.focus();
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  function fmtTime(ts) {
    return new Date(ts).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  }

  function channelLabel(ch) {
    if (!ch) return '';
    if (ch.channel_type === 'internal') return '👥 Equipo';
    const color = STORE_COLORS[ch.org_id];
    // Si soy corp, muestro el nombre de la tienda; si soy tienda, muestro "Corp"
    const isCorp = role === 'superadmin' || role === 'corp';
    return isCorp ? ch.name : '🏢 Corp Tech';
  }

  function channelColor(ch) {
    if (!ch) return '#0A84FF';
    if (ch.channel_type === 'internal') return '#FF9F0A';
    return STORE_COLORS[ch.org_id] || '#0A84FF';
  }

  if (!ready) return null;

  const activeChannel = channels[activeIdx];
  const accent        = channelColor(activeChannel);

  return (
    <>
      {/* PANEL */}
      {open && (
        <div style={{
          position:     'fixed',
          bottom:       80,
          right:        16,
          width:        340,
          maxWidth:     'calc(100vw - 32px)',
          height:       500,
          maxHeight:    'calc(100dvh - 100px)',
          borderRadius: 20,
          background:   '#111114',
          border:       '1px solid rgba(255,255,255,0.10)',
          boxShadow:    '0 24px 60px rgba(0,0,0,0.55)',
          display:      'flex',
          flexDirection:'column',
          overflow:     'hidden',
          zIndex:       9999,
          fontFamily:   "'Urbanist','Inter',sans-serif",
          animation:    'chatSlideUp 0.22s ease',
        }}>

          {/* Header */}
          <div style={{
            padding:      '12px 14px 10px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display:      'flex',
            alignItems:   'center',
            gap:          10,
            background:   '#16161a',
            flexShrink:   0,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: `${accent}25`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, flexShrink: 0,
            }}>💬</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Chat Interno</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{profile?.full_name}</div>
            </div>
            <button onClick={() => setOpen(false)} style={{
              background: 'rgba(255,255,255,0.06)', border: 'none',
              color: 'rgba(255,255,255,0.6)', borderRadius: 8,
              width: 28, height: 28, cursor: 'pointer', fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✕</button>
          </div>

          {/* Channel tabs */}
          {channels.length > 1 && (
            <div style={{
              display:    'flex',
              overflowX:  'auto',
              gap:        4,
              padding:    '8px 10px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              flexShrink: 0,
            }}>
              {channels.map((ch, i) => {
                const col   = channelColor(ch);
                const badge = unread[ch.id] || 0;
                const isAct = activeIdx === i;
                return (
                  <button key={ch.id} onClick={() => switchChannel(i)} style={{
                    padding:      '5px 12px',
                    borderRadius: 20,
                    border:       'none',
                    background:   isAct ? `${col}25` : 'rgba(255,255,255,0.05)',
                    color:        isAct ? col : 'rgba(255,255,255,0.5)',
                    fontSize:     12,
                    fontWeight:   isAct ? 700 : 500,
                    cursor:       'pointer',
                    whiteSpace:   'nowrap',
                    position:     'relative',
                    outline:      isAct ? `1px solid ${col}50` : 'none',
                    fontFamily:   'inherit',
                    transition:   'all 0.15s',
                  }}>
                    {channelLabel(ch)}
                    {badge > 0 && (
                      <span style={{
                        position: 'absolute', top: -4, right: -4,
                        background: '#FF3B30', color: '#fff',
                        borderRadius: 10, fontSize: 9, fontWeight: 800,
                        minWidth: 16, height: 16,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '0 3px',
                      }}>{badge}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 4px' }}>
            {msgLoading ? (
              <div style={{ display:'flex', justifyContent:'center', paddingTop:30 }}>
                <div style={{ width:24, height:24, border:'2px solid rgba(255,255,255,0.15)', borderTopColor: accent, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
              </div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign:'center', color:'rgba(255,255,255,0.3)', fontSize:13, paddingTop:40 }}>
                <div style={{ fontSize:30, marginBottom:8 }}>👋</div>
                Sin mensajes aún. ¡Di hola!
              </div>
            ) : (
              messages.map((msg, i) => {
                const isMe   = msg.user_id === userId;
                const prev   = messages[i - 1];
                const showName = !isMe && (!prev || prev.user_id !== msg.user_id);
                return (
                  <div key={msg.id} style={{ marginBottom: 4, display:'flex', flexDirection:'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                    {showName && (
                      <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', marginBottom:1, marginLeft:2 }}>
                        {msg.users?.full_name}
                      </div>
                    )}
                    <div style={{
                      maxWidth:     '78%',
                      padding:      '7px 12px',
                      borderRadius: isMe ? '16px 16px 3px 16px' : '16px 16px 16px 3px',
                      background:   isMe ? accent : 'rgba(255,255,255,0.08)',
                      color:        '#fff',
                      fontSize:     14,
                      lineHeight:   1.4,
                      wordBreak:    'break-word',
                    }}>
                      {msg.content}
                    </div>
                    <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)', marginTop:1, marginLeft:2, marginRight:2 }}>
                      {fmtTime(msg.created_at)}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding:'10px 10px 12px', borderTop:'1px solid rgba(255,255,255,0.07)', flexShrink:0, background:'#16161a' }}>
            <form onSubmit={sendMessage} style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
              <textarea
                ref={inputRef}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Escribe un mensaje..."
                rows={1}
                style={{
                  flex:1, padding:'8px 12px',
                  borderRadius:16, border:'1px solid rgba(255,255,255,0.10)',
                  background:'rgba(255,255,255,0.06)', color:'#fff',
                  fontSize:14, resize:'none', outline:'none',
                  fontFamily:'inherit', maxHeight:80, overflowY:'auto',
                  lineHeight:1.4,
                }}
                onInput={e => {
                  e.target.style.height='auto';
                  e.target.style.height = Math.min(e.target.scrollHeight,80)+'px';
                }}
              />
              <button type="submit" disabled={!text.trim()||sending} style={{
                width:36, height:36, borderRadius:'50%', border:'none',
                background: text.trim() ? accent : 'rgba(255,255,255,0.08)',
                color:'#fff', fontSize:16, cursor: text.trim()?'pointer':'default',
                display:'flex', alignItems:'center', justifyContent:'center',
                flexShrink:0, transition:'all 0.15s',
              }}>
                {sending ? '…' : '↑'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* BURBUJA */}
      <button onClick={() => { setOpen(o=>!o); if(!open && activeChannel) { setUnread(u=>({...u,[activeChannel.id]:0})); } }}
        style={{
          position:      'fixed',
          bottom:        24,
          right:         16,
          width:         56,
          height:        56,
          borderRadius:  '50%',
          border:        'none',
          background:    open ? '#333' : `linear-gradient(135deg, #0A84FF, #5E5CE6)`,
          color:         '#fff',
          fontSize:      24,
          cursor:        'pointer',
          zIndex:        10000,
          boxShadow:     open ? '0 4px 16px rgba(0,0,0,0.4)' : '0 6px 24px rgba(10,132,255,0.45)',
          display:       'flex',
          alignItems:    'center',
          justifyContent:'center',
          transition:    'all 0.2s ease',
        }}>
        {open ? '✕' : '💬'}
        {!open && totalUnread > 0 && (
          <span style={{
            position:'absolute', top:0, right:0,
            background:'#FF3B30', color:'#fff',
            borderRadius:10, fontSize:10, fontWeight:800,
            minWidth:18, height:18,
            display:'flex', alignItems:'center', justifyContent:'center',
            padding:'0 4px', border:'2px solid #050508',
          }}>{totalUnread > 9 ? '9+' : totalUnread}</span>
        )}
      </button>

      <style>{`
        @keyframes chatSlideUp {
          from { opacity:0; transform:translateY(16px) scale(0.97); }
          to   { opacity:1; transform:translateY(0)    scale(1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
