const { createClient } = require('@supabase/supabase-js');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const USER_ID = '0fc35c70-9b02-4487-9636-45c567d037ba';

function fmtTime(s) {
  if (!s || !s.includes('T') && !s.includes(' ')) return '';
  const normalized = s.replace(' ', 'T').replace('+00','');
  const d = new Date(normalized);
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
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
  console.log('Telegram response:', JSON.stringify(json));
  return json;
}

module.exports = async function handler(req, res) {
  console.log('daily-summary handler called');

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

    console.log('Today:', todayStr, dateLabel);

    const { data: items, error } = await sb
      .from('items')
      .select('*')
      .eq('user_id', USER_ID)
      .eq('done', false);

    if (error) throw new Error(error.message);

    console.log('Items found:', items?.length || 0);
    console.log('Items categories:', (items||[]).map(i => i.category + '|' + i.date?.slice(0,10)).join(', '));

    const normalizeDate = (s) => s ? s.replace(' ', 'T').slice(0,10) : null;

    const todayEvents = (items || []).filter(item => {
      if (!item.date) return false;
      const cats = ['eventos','citas','ejercicio','salud','bts','cultura'];
      if (!cats.includes(item.category)) return false;
      return normalizeDate(item.date) === todayStr;
    }).sort((a,b) => (a.date||'').localeCompare(b.date||''));

    const todayCumples = (items || []).filter(item => {
      if (item.category !== 'cumples' || !item.date) return false;
      return item.date.slice(5,10) === todayMMDD;
    });

    const pendingTodos = (items || []).filter(item => {
      if (item.category !== 'recordatorios') return false;
      if (!item.date) return true;
      return normalizeDate(item.date) <= todayStr;
    });

    const pendingCompras = (items || []).filter(i => i.category === 'compras');

    const emojis = { eventos:'📅', citas:'🤝', ejercicio:'🏃', salud:'💊', bts:'💜', cultura:'✨' };

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
      if (pendingTodos.length > 5) msg += `  _...y ${pendingTodos.length - 5} más_\n`;
    }

    if (pendingCompras.length) {
      msg += `\n🛒 *Compras pendientes* \\(${pendingCompras.length}\\)\n`;
      pendingCompras.slice(0,3).forEach(item => { msg += `  • ${item.text}\n`; });
      if (pendingCompras.length > 3) msg += `  _...y ${pendingCompras.length - 3} más_\n`;
    }

    msg += `\n_vía kami 🌸_`;

    await sendTelegram(msg);

    return res.status(200).json({ ok: true, sent: true, today: todayStr, itemsFound: items?.length || 0 });

  } catch (err) {
    console.error('Cron error:', err.message);
    try { await sendTelegram(`⚠️ Kami error: ${err.message}`); } catch(e) {}
    return res.status(500).json({ error: err.message });
  }
};
