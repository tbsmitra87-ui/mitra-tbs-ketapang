# Mitra TBS Ketapang — versi dengan pembuatan akun di aplikasi

## Fitur
- Login Supabase Auth.
- Admin mengelola harga TBS dan daftar PKS.
- Admin membuat akun pengguna dari menu **Akun & Akses** dengan email, kata sandi awal, nama, peran, status, dan pilihan PKS.
- Pembuatan akun dilakukan melalui Netlify Function yang memeriksa sesi dan peran admin. Service-role key hanya berada di environment variables server, tidak di browser.

## PENTING: sebelum pembuatan akun berfungsi
Aplikasi frontend dapat dibuka seperti biasa, tetapi pembuatan akun baru membutuhkan Netlify Function dan environment variables. Jangan memasukkan service-role key ke halaman aplikasi atau file HTML.

### A. Tambahkan environment variables di Netlify
Buka Netlify Dashboard → pilih situs Mitra TBS Ketapang → **Site configuration** → **Environment variables** (pada beberapa tampilan: Project configuration → Environment variables), lalu tambahkan:

- `SUPABASE_URL` = `https://vjkdgktcauxmgijuevcv.supabase.co`
- `SUPABASE_ANON_KEY` = anon/public key Supabase (nilai yang sama dengan key publik aplikasi)
- `SUPABASE_SERVICE_ROLE_KEY` = secret/service_role key dari Supabase. Rahasiakan; hanya simpan di Netlify Environment Variables.

Setelah menyimpan variabel, lakukan deploy ulang.

### B. Deploy ZIP ini ke Netlify
1. Ekstrak ZIP di komputer, atau gunakan fitur deploy manual Netlify jika tersedia.
2. Unggah folder `mitra_tbs_ketapang_online` sebagai situs (folder ini berisi `index.html` dan folder `netlify/functions`). Jangan hanya unggah `index.html`.
3. Jika situs Netlify lama masih dipakai, deploy folder versi baru ke situs yang sama agar URL tetap sama.
4. Setelah deploy selesai, buka URL situs dan login sebagai admin.
5. Buka **Akun & Akses**, isi email, kata sandi awal minimal 8 karakter, nama, status, dan centang PKS yang boleh dilihat. Tekan **Simpan profil & akses**.
6. Coba login menggunakan akun baru di tab/perangkat lain.

## Catatan keamanan
- Jangan pernah menaruh `SUPABASE_SERVICE_ROLE_KEY` di HTML, ZIP publik, atau browser.
- Fungsi server memeriksa sesi dan memastikan pemanggil adalah admin aktif.
- Sebelum dipakai untuk data penting, uji pembuatan akun, penonaktifan akun, dan akses PKS dengan akun pengguna biasa.
