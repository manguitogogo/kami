const { createClient } = require('@supabase/supabase-js');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const USER_ID = '0fc35c70-9b02-4487-9636-45c567d037ba';

function fmtTime(s) {
  if (!s) return '';
  const normalized = s.replace(' ', 'T').replace('+00:00','').replace('+00','');
  if (!normalized.includes('T')) return '';
  const d = new Date(normalized + 'Z');
  // Convertir a hora Monterrey (UTC-6)
  const monterrey = new Date(d.getTime() - 6 * 60 * 60 * 1000);
  return monterrey.toISOString().slice(11,16).replace(':',':');
}

function normalizeDate(s) {
  if (!s) return null;
  // "2026-04-12T14:32:00+00:00" o "2026-04-12 14:32:00+00"
  return s.replace(' ', 'T').slice(0, 10);
}

async function sendTelegram(msg) {
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: msg,
      parse_mode: 'Markdown'
    })
  });
  const json = await res.json();
  console.log('Telegram:', json.ok, json.description||'');
  return json;
}

module.exports = async function handler(req, res) {
  console.log('daily-summary v3 called');

  try {
    const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

    const now = new Date();
    const monterreyNow = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    const todayStr = monterreyNow.toISOString().split('T')[0];
    const todayMMDD = todayStr.slice(5);

    const days = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
    const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    const dayName = days[monterreyNow.getUTCDay()];
    const dateLabel = `${dayName} ${monterreyNow.getUTCDate()} ${months[monterreyNow.getUTCMonth()]}`;

    const { data: items, error } = await sb
      .from('items')
      .select('*')
      .eq('user_id', USER_ID)
      .eq('done', false);

    if (error) throw new Error(error.message);

    console.log('Items:', items?.length, 'Today:', todayStr);

    const emojis = { eventos:'📅', citas:'🤝', ejercicio:'🏃', salud:'💊', bts:'💜', cultura:'✨' };

    // Eventos de hoy
    const todayEvents = (items || []).filter(item => {
      if (!item.date) return false;
      const cats = ['eventos','citas','ejercicio','salud','bts','cultura'];
      if (!cats.includes(item.category)) return false;
      return normalizeDate(item.date) === todayStr;
    }).sort((a,b) => (a.date||'').localeCompare(b.date||''));

    // Cumpleaños de hoy
    const todayCumples = (items || []).filter(item =>
      item.category === 'cumples' && item.date && normalizeDate(item.date).slice(5) === todayMMDD
    );

    // To-Do: solo los que tienen fecha <= hoy
const pendingTodos = (items || []).filter(item => {
  if (item.category !== 'recordatorios') return false;
  if (!item.date) return false;
  return normalizeDate(item.date) <= todayStr;
});

    // Compras pendientes
    const pendingCompras = (items || []).filter(i => i.category === 'compras');

    console.log('Events today:', todayEvents.length, 'Todos:', pendingTodos.length, 'Compras:', pendingCompras.length);

    let msg = `☀️ *Buenos días\\! Tu día — ${dateLabel}*\n`;

    if (todayCumples.length) {
      msg += `\n🎂 *Cumpleaños hoy*\n`;
      todayCumples.forEach(c => { msg += `  🎉 ${c.text}\n`; });
    }

    if (todayEvents.length) {
      msg += `\n📋 *Agenda del día*\n`;
      todayEvents.forEach(item => {
        const emoji = emojis[item.category] || '•';
        const t = fmtTime(item.date);
        msg += `  ${emoji} ${t ? t + ' — ' : ''}*${item.text}*\n`;
      });
    } else {
      msg += `\n📋 *Agenda del día*\n  Sin eventos programados ✨\n`;
    }

    if (pendingTodos.length) {
      msg += `\n✅ *To\\-Do pendiente*\n`;
      pendingTodos.slice(0,5).forEach(item => {
        const isLaboral = (item.location||'').startsWith('laboral:');
        msg += `  ${isLaboral ? '💼' : '🏠'} ${item.text}\n`;
      });
      if (pendingTodos.length > 5) msg += `  _\\.\\.\\. y ${pendingTodos.length - 5} más_\n`;
    }

    if (pendingCompras.length) {
      msg += `\n🛒 *Compras pendientes* \\(${pendingCompras.length}\\)\n`;
      pendingCompras.slice(0,3).forEach(item => { msg += `  • ${item.text}\n`; });
      if (pendingCompras.length > 3) msg += `  _\\.\\.\\. y ${pendingCompras.length - 3} más_\n`;
    }

    msg += `\n_vía kami 🌸_`;

    await sendTelegram(msg);

    return res.status(200).json({ ok: true, today: todayStr, todos: pendingTodos.length });

  } catch (err) {
    console.error('Error:', err.message);
    try { await sendTelegram(`⚠️ Kami error: ${err.message}`); } catch(e) {}
    return res.status(500).json({ error: err.message });
  }
};
