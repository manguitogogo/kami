const { createClient } = require('@supabase/supabase-js');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const USER_ID = '0fc35c70-9b02-4487-9636-45c567d037ba';

async function sendTelegram(msg) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: msg })
  });
}

module.exports = async function handler(req, res) {
  const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

  const now = new Date();
  const monterreyNow = new Date(now.getTime() - 6 * 60 * 60 * 1000);
  const todayStr = monterreyNow.toISOString().split('T')[0];

  const { data: items, error } = await sb
    .from('items')
    .select('*')
    .eq('user_id', USER_ID)
    .eq('done', false);

  if (error) {
    await sendTelegram('ERROR: ' + error.message);
    return res.status(500).json({ error: error.message });
  }

  const debug = items.map(i => `${i.category}|${i.date}|${i.text.slice(0,20)}`).join('\n');
  await sendTelegram(`DEBUG hoy=${todayStr}\n\n${debug}`);

  return res.status(200).json({ ok: true });
};
