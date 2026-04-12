import { createClient } from '@supabase/supabase-js';

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const LABELS = {
  compras:'Compras', eventos:'Evento', citas:'Cita',
  salud:'Salud', cumples:'Cumpleaños', ejercicio:'Ejercicio',
  recordatorios:'To-Do', ideas:'Idea', cultura:'Cultura', bts:'BTS 💜'
};

function fmtTime(s) {
  if (!s || !s.includes('T')) return '';
  const d = new Date(s.replace('Z','').replace(/[+-]\d{2}:\d{2}$/, ''));
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(s) {
  if (!s) return '';
  const d = new Date(s.length <= 10 ? s + 'T12:00:00' : s.replace('Z','').replace(/[+-]\d{2}:\d{2}$/, ''));
  return d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
}

async function sendTelegram(msg) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: msg,
      parse_mode: 'Markdown'
    })
  });
}

export default async function handler(req, res) {
  // Seguridad: solo Vercel puede llamar esto
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Obtener todos los usuarios
    const { data: users, error: usersError } = await sb
      .from('items')
      .select('user_id')
      .limit(1000);

    if (usersError) throw usersError;

    // Usuario único por ahora (Meli)
    const userId = [...new Set((users || []).map(u => u.user_id))][0];
    if (!userId) {
      return res.status(200).json({ ok: true, message: 'No users found' });
    }

    // Obtener items del usuario
    const { data: items, error: itemsError } = await sb
      .from('items')
      .select('*')
      .eq('user_id', userId)
      .eq('done', false);

    if (itemsError) throw itemsError;

    // Fecha de hoy en Monterrey (UTC-6)
    const now = new Date();
    const monterreyOffset = -6 * 60;
    const monterreyNow = new Date(now.getTime() + (monterreyOffset - now.getTimezoneOffset()) * 60000);
    const todayStr = monterreyNow.toISOString().split('T')[0];
    const todayMMDD = todayStr.slice(5);

    const days = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
    const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    const dayName = days[monterreyNow.getDay()];
    const dateLabel = `${dayName} ${monterreyNow.getDate()} ${months[monterreyNow.getMonth()]}`;

    // Items de hoy (eventos, citas, ejercicio)
    const todayEvents = (items || []).filter(item => {
      if (!item.date) return false;
      const cats = ['eventos', 'citas', 'ejercicio', 'salud', 'bts', 'cultura'];
      if (!cats.includes(item.category)) return false;
      return item.date.startsWith(todayStr);
    }).sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    // Cumpleaños de hoy
    const todayCumples = (items || []).filter(item => {
      if (item.category !== 'cumples' || !item.date) return false;
      return item.date.slice(5) === todayMMDD;
    });

    // To-Do pendientes (sin fecha o con fecha de hoy o pasada)
    const pendingTodos = (items || []).filter(item => {
      if (item.category !== 'recordatorios') return false;
      if (!item.date) return true;
      return item.date.slice(0, 10) <= todayStr;
    });

    // Compras pendientes
    const pendingCompras = (items || []).filter(i => i.category === 'compras');

    // Armar mensaje
    const emojis = { eventos:'📅', citas:'🤝', ejercicio:'🏃', salud:'💊', bts:'💜', cultura:'✨' };

    let msg = `☀️ *Buenos días\\! Tu día — ${dateLabel}*\n`;

    if (todayCumples.length) {
      msg += `\n🎂 *Cumpleaños hoy*\n`;
      todayCumples.forEach(c => {
        msg += `  🎉 ${c.text}\n`;
      });
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
      pendingTodos.slice(0, 5).forEach(item => {
        const isLaboral = (item.location || '').startsWith('laboral:');
        msg += `  ${isLaboral ? '💼' : '🏠'} ${item.text}\n`;
      });
      if (pendingTodos.length > 5) {
        msg += `  _...y ${pendingTodos.length - 5} más_\n`;
      }
    }

    if (pendingCompras.length) {
      msg += `\n🛒 *Compras pendientes* \\(${pendingCompras.length}\\)\n`;
      pendingCompras.slice(0, 3).forEach(item => {
        msg += `  • ${item.text}\n`;
      });
      if (pendingCompras.length > 3) {
        msg += `  _...y ${pendingCompras.length - 3} más_\n`;
      }
    }

    msg += `\n_vía kami 🌸_`;

    await sendTelegram(msg);

    return res.status(200).json({ ok: true, sent: true });

  } catch (err) {
    console.error('Cron error:', err);
    await sendTelegram(`⚠️ Kami: error en el resumen diario\\. ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
}
