Ini adalah **Product Requirements Document (PRD)** yang disusun untuk memandu pengembangan aplikasi web Expo Kampus kamu.

---

# Product Requirements Document (PRD): Expo Ordering System

## 1. Ringkasan Proyek
Tujuan dari proyek ini adalah membangun platform pemesanan berbasis web untuk memfasilitasi transaksi selama kegiatan expo kampus. Fokus utamanya adalah kemudahan akses bagi pembeli (tanpa login) dan integrasi langsung ke WhatsApp serta database untuk pencatatan laporan yang akurat bagi penjual.

---

## 2. User Persona
* **Pembeli (Guest):** Mahasiswa/pengunjung expo yang ingin memesan makanan/produk dengan cepat dan melihat riwayat tanpa akun.
* **Admin (Penjual):** Mahasiswa panitia stand yang mengelola stok menu, memproses pesanan, dan memantau keuntungan.

---

## 3. Fitur Utama (Functional Requirements)

### A. Fitur Pembeli (Public Side)
| Fitur | Deskripsi |
| :--- | :--- |
| **Katalog Produk** | Menampilkan daftar menu dengan gambar, deskripsi, dan harga. |
| **Keranjang (Cart)** | Menambah/mengurangi jumlah item dan melihat subtotal secara real-time. |
| **Checkout Form** | Input Nama, No. WA Aktif, dan Titik Lokasi. |
| **Kalkulator Ongkir** | Menghitung ongkir otomatis berdasarkan jarak (Radius KM) atau pilihan area kampus. |
| **Integrasi WhatsApp** | Mengirim detail pesanan otomatis ke nomor WA admin saat klik "Pesan". |
| **Cek Riwayat** | Mencari data pesanan sebelumnya hanya dengan input Nama & No. WA. |

### B. Fitur Admin (Private Side)
| Fitur | Deskripsi |
| :--- | :--- |
| **Auth Admin** | Login khusus admin menggunakan Supabase Auth. |
| **Management Menu** | CRUD (Create, Read, Update, Delete) data menu dan ketersediaan stok. |
| **Order Management** | List pesanan masuk. Fitur untuk mengubah status: *Pending*, *Completed*, atau *Cancelled*. |
| **Laporan Penjualan** | Dashboard ringkasan total pendapatan dari pesanan yang berstatus *Completed*. |

---

## 4. Alur Kerja Sistem (User Flow)
1.  **Pemesanan:** Produk -> Keranjang -> Isi Data & Lokasi -> Simpan ke Database -> Redirect ke WhatsApp.
2.  **Pelacakan:** Masukkan Nama + WA -> Filter database `orders` -> Tampilkan daftar transaksi.
3.  **Manajemen:** Admin Login -> Update Status Pesanan -> Database terupdate -> Laporan berubah otomatis.

---

## 5. Spesifikasi Teknis & Stack
* **Framework:** Next.js (App Router)
* **Styling:** Tailwind CSS + Shadcn UI (untuk komponen cepat)
* **Database:** Supabase (PostgreSQL)
* **State Management:** Zustand (untuk keranjang belanja)
* **Deployment:** Vercel
* **Image Storage:** Supabase Storage (untuk foto menu)

---

## 6. Skema Database (Supabase)

### Table: `menus`
* `id` (int8, PK)
* `name` (text)
* `price` (int8)
* `description` (text)
* `image_url` (text)
* `is_available` (boolean)

### Table: `orders`
* `id` (uuid, PK)
* `customer_name` (text)
* `whatsapp` (text)
* `location_detail` (text)
* `items` (jsonb) — *Menyimpan daftar produk yang dibeli*
* `total_price` (int8)
* `shipping_cost` (int8)
* `status` (text) — *('pending', 'completed', 'cancelled')*
* `created_at` (timestamp)

---

## 7. Logika Ongkos Kirim (Logic Proposal)
Untuk perhitungan ongkir tanpa API berbayar (Google Maps), gunakan pendekatan **Zona/Jarak Garis Lurus**:
1.  Admin menetapkan koordinat stand expo ($lat_1, lon_1$).
2.  Gunakan browser Geolocation API untuk mendapat koordinat pembeli ($lat_2, lon_2$).
3.  Hitung jarak menggunakan **Rumus Haversine**:
    $$d = 2r \arcsin\left(\sqrt{\sin^2\left(\frac{\phi_2-\phi_1}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\lambda_2-\lambda_1}{2}\right)}\right)$$
4.  Jika $d > 500$ meter, tambahkan ongkir per KM atau biaya *flat*.

---

## 8. Non-Functional Requirements
* **Mobile First:** UI harus sangat nyaman dibuka di HP karena expo dilakukan secara *on-the-spot*.
* **Performance:** LCP (Largest Contentful Paint) di bawah 2.5 detik agar pembeli tidak malas menunggu.
* **Security:** Mengaktifkan *Row Level Security* (RLS) di Supabase agar pembeli tidak bisa menghapus data menu.

---

## 9. Rencana Rilis (Milestones)
1.  **Phase 1:** Setup Supabase & Integrasi Katalog Menu.
2.  **Phase 2:** Fitur Keranjang & Logika Checkout WA.
3.  **Phase 3:** Dashboard Admin & Laporan Penjualan.
4.  **Phase 4:** Uji coba perhitungan jarak & Deployment ke Vercel.
