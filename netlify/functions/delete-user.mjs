exports.handler = async function (event) {
  const headers = {
    "Content-Type": "application/json"
  };

  const reply = (statusCode, body) => ({
    statusCode,
    headers,
    body: JSON.stringify(body)
  });

  if (event.httpMethod !== "POST") {
    return reply(405, { error: "Metode tidak diizinkan." });
  }

  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceKey) {
    return reply(500, { error: "Konfigurasi server belum lengkap." });
  }

  try {
    const token = (event.headers.authorization || "")
      .replace(/^Bearer\s+/i, "");

    if (!token) {
      return reply(401, { error: "Sesi admin diperlukan." });
    }

    const authHeaders = {
      apikey: anonKey,
      Authorization: "Bearer " + token
    };

    const meRes = await fetch(url + "/auth/v1/user", {
      headers: authHeaders
    });

    if (!meRes.ok) {
      return reply(401, { error: "Sesi tidak valid." });
    }

    const me = await meRes.json();

    const adminRes = await fetch(
      url + "/rest/v1/profil_pengguna?id=eq." +
      encodeURIComponent(me.id) + "&select=peran",
      {
        headers: {
          apikey: serviceKey,
          Authorization: "Bearer " + serviceKey
        }
      }
    );

    const adminRows = await adminRes.json();

    if (!adminRes.ok || !adminRows.length ||
        adminRows[0].peran !== "admin") {
      return reply(403, { error: "Hanya admin yang boleh menghapus pengguna." });
    }

    const input = JSON.parse(event.body || "{}");
    const id = input.id;

    if (!id || id === me.id) {
      return reply(400, { error: "ID pengguna tidak valid." });
    }

    const targetRes = await fetch(
      url + "/rest/v1/profil_pengguna?id=eq." +
      encodeURIComponent(id) + "&select=id,peran",
      {
        headers: {
          apikey: serviceKey,
          Authorization: "Bearer " + serviceKey
        }
      }
    );

    const targets = await targetRes.json();

    if (!targetRes.ok || !targets.length) {
      return reply(404, { error: "Pengguna tidak ditemukan." });
    }

    if (targets[0].peran === "admin") {
      return reply(403, { error: "Akun admin tidak boleh dihapus." });
    }

    const deleteRes = await fetch(
      url + "/auth/v1/admin/users/" + encodeURIComponent(id),
      {
        method: "DELETE",
        headers: {
          apikey: serviceKey,
          Authorization: "Bearer " + serviceKey
        }
      }
    );

    if (!deleteRes.ok) {
      return reply(500, { error: "Gagal menghapus akun login." });
    }

    return reply(200, { message: "Akun pengguna berhasil dihapus." });
  } catch (error) {
    return reply(500, { error: "Terjadi kesalahan server." });
  }
};
