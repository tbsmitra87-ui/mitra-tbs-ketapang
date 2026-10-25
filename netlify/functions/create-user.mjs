const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Metode tidak diizinkan.' });
  const url = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const anon = process.env.SUPABASE_ANON_KEY || '';
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !anon || !service) return json(500, { error: 'Konfigurasi server belum lengkap. Admin harus mengatur environment variables di Netlify.' });

  const auth = event.headers?.authorization || event.headers?.Authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return json(401, { error: 'Sesi admin tidak ditemukan. Silakan login ulang.' });

  try {
    const authRes = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` } });
    if (!authRes.ok) return json(401, { error: 'Sesi login tidak valid. Silakan login ulang.' });
    const authUser = await authRes.json();

    const profileRes = await fetch(`${url}/rest/v1/profil_pengguna?id=eq.${encodeURIComponent(authUser.id)}&select=peran,aktif`, {
      headers: { apikey: service, Authorization: `Bearer ${service}`, Accept: 'application/json' },
    });
    const profiles = await profileRes.json();
    if (!profileRes.ok || !profiles?.some(p => p.peran === 'admin' && p.aktif === true)) {
      return json(403, { error: 'Hanya admin aktif yang boleh membuat akun.' });
    }

    const body = JSON.parse(event.body || '{}');
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const nama = String(body.nama || '').trim();
    const peran = body.peran === 'admin' ? 'admin' : 'pengguna';
    const aktif = body.aktif === true;
    const pksIds = [...new Set((Array.isArray(body.pks_ids) ? body.pks_ids : []).map(Number).filter(n => Number.isInteger(n) && n > 0))];
    if (!email || !email.includes('@') || password.length < 8 || !nama) return json(400, { error: 'Email, nama, dan kata sandi minimal 8 karakter wajib diisi.' });

    const createRes = await fetch(`${url}/auth/v1/admin/users`, {
      method: 'POST',
      headers: { apikey: service, Authorization: `Bearer ${service}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { nama } }),
    });
    const created = await createRes.json();
    if (!createRes.ok) return json(createRes.status, { error: created.msg || created.message || created.error_description || created.error || 'Supabase menolak pembuatan akun.' });
    const uid = created.id;

    const profileWrite = await fetch(`${url}/rest/v1/profil_pengguna`, {
      method: 'POST',
      headers: { apikey: service, Authorization: `Bearer ${service}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ id: uid, nama, peran, aktif }),
    });
    if (!profileWrite.ok) {
      const err = await profileWrite.text();
      await fetch(`${url}/auth/v1/admin/users/${uid}`, { method: 'DELETE', headers: { apikey: service, Authorization: `Bearer ${service}` } });
      return json(500, { error: `Akun login dibuat tetapi profil gagal disimpan: ${err.slice(0, 240)}` });
    }

    if (pksIds.length) {
      const accessWrite = await fetch(`${url}/rest/v1/akses_pks`, {
        method: 'POST',
        headers: { apikey: service, Authorization: `Bearer ${service}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify(pksIds.map(pks_id => ({ pengguna_id: uid, pks_id }))),
      });
      if (!accessWrite.ok) return json(500, { error: 'Akun dan profil berhasil dibuat, tetapi akses PKS gagal disimpan. Gunakan Edit akses untuk memperbaikinya.' });
    }
    return json(200, { ok: true, id: uid });
  } catch (e) {
    return json(500, { error: 'Kesalahan server saat membuat akun. Coba lagi.' });
  }
};
