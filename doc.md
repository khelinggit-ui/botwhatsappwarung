# 🛒 WhatsApp Order Bot — Project Documentation

## 📋 Overview

Sistem pemesanan barang menggunakan WhatsApp Bot sebagai antarmuka pengguna, Laravel sebagai backend API, dan MySQL sebagai database.

**Arsitektur:**
```
WhatsApp (User) → Baileys Bot (Node.js/Express) → Laravel API → MySQL
```

**Status:** ✅ Backend Laravel berjalan, Bot Baileys siap, Database MySQL terhubung

---

## 📁 Struktur Project (Monorepo)

```
D:\laragon\www\waserver\
│
├── backend/                          # Laravel 12 Application
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/
│   │   │   │   ├── OrderController.php
│   │   │   │   ├── ProductController.php
│   │   │   │   ├── AuthController.php
│   │   │   │   ├── PaymentController.php
│   │   │   │   └── WebhookController.php
│   │   │   ├── Middleware/BotAuthMiddleware.php
│   │   │   └── Kernel.php
│   │   ├── Models/
│   │   │   ├── User.php (role: admin/user)
│   │   │   ├── Customer.php
│   │   │   ├── Product.php
│   │   │   ├── Order.php
│   │   │   ├── OrderItem.php
│   │   │   ├── OrderStatus.php
│   │   │   ├── Payment.php
│   │   │   └── Notification.php
│   │   ├── Services/
│   │   │   ├── OrderService.php
│   │   │   └── NotificationService.php
│   │   ├── Events/
│   │   │   ├── OrderCreated.php
│   │   │   └── OrderUpdated.php
│   │   └── Jobs/
│   │       └── SendWhatsAppMessage.php
│   │
│   ├── config/
│   │   ├── bot.php
│   │   └── services.php
│   │
│   ├── routes/
│   │   ├── api.php                   # 23 routes (orders, products, payments, webhook, auth)
│   │   ├── bot.php                   # Webhook route
│   │   ├── web.php                   # Admin routes
│   │   └── console.php
│   │
│   ├── database/
│   │   ├── migrations/               # 9 migrations (all created & migrated)
│   │   │   ├── 2024_01_01_000001_create_customers_table.php
│   │   │   ├── 2024_01_01_000002_create_products_table.php
│   │   │   ├── 2024_01_01_000003_create_orders_table.php
│   │   │   ├── 2024_01_01_000004_create_order_items_table.php
│   │   │   ├── 2024_01_01_000005_create_order_statuses_table.php
│   │   │   ├── 2024_01_01_000006_create_payments_table.php
│   │   │   ├── 2024_01_01_000007_create_notifications_table.php
│   │   │   └── 0001_01_01_000000_create_users_table.php (modified with role)
│   │   ├── seeders/
│   │   │   ├── DatabaseSeeder.php    # Creates admin + products
│   │   │   └── ProductSeeder.php     # 6 sample products
│   │   └── factories/
│   │       └── OrderFactory.php
│   │
│   ├── public/
│   │   └── uploads/
│   │       ├── products/
│   │       ├── payments/
│   │       └── invoices/
│   │
│   ├── bootstrap/app.php             # BotAuthMiddleware registered
│   ├── .env                          # DB, BOT_API_URL configured
│   ├── composer.json
│   └── artisan
│
│
├── bot/                              # Baileys WhatsApp Bot
│   ├── src/
│   │   ├── index.ts                  # Entry point (Express webhook server)
│   │   ├── config/index.ts           # Config from .env
│   │   ├── types/index.ts            # TypeScript interfaces (Order, Product, Customer, etc.)
│   │   ├── utils/
│   │   │   ├── constants.ts          # PREFIX, ORDER_STATUSES, CATEGORIES, COMMANDS, formatRupiah()
│   │   │   ├── validators.ts         # validateOrderInput(), validateWaId(), sanitizeInput()
│   │   │   └── formatters.ts         # formatOrderMessage(), formatProductList()
│   │   ├── services/
│   │   │   ├── apiService.ts         # Axios HTTP client to Laravel API
│   │   │   ├── messageService.ts     # Message templates (welcome, menu, success, help)
│   │   │   └── sessionService.ts     # Session directory management
│   │   ├── handlers/
│   │   │   ├── messageHandler.ts     # Main router: MENU, PRODUCTS, ORDER, ORDER_STATUS, MY_ORDERS, CUSTOMER, HELP, ADMIN
│   │   │   ├── commandParser.ts      # Parse /command and text commands
│   │   │   ├── orderHandler.ts       # Order processing logic
│   │   │   ├── productHandler.ts     # Product catalog
│   │   │   ├── paymentHandler.ts     # Payment verification
│   │   │   └── adminHandler.ts       # Admin commands
│   │   └── index.ts                  # Express app: POST /webhook, GET /health
│   │
│   ├── package.json                  # Dependencies installed (266 packages)
│   ├── tsconfig.json
│   └── .env
│
├── start_mysql.bat                   # Batch script to start MySQL
├── doc.md                            # File ini
└── README.md
```

---

## 🗄️ Database Schema (MySQL)

Database: `whatsapp_bot` ✅

### Tabel yang Ada (9 tabel)

| Tabel | Deskripsi |
|-------|-----------|
| `users` | Admin user dengan role `admin`/`user` |
| `customers` | Data pelanggan (wa_id, wa_name, phone, address) |
| `products` | Daftar produk (6 sample products sudah di-seed) |
| `orders` | Header pesanan (order_number, total_price, status, payment_status) |
| `order_items` | Detail item dalam pesanan |
| `order_statuses` | Status order (pending, processing, shipped, delivered, cancelled) |
| `payments` | Riwayat pembayaran (amount, method, proof_url, status) |
| `notifications` | Notifikasi ke pelanggan |
| `products` | 6 produk sample (Masker, Kemeja, Organizer, Buku, Powerbank, Kopi) |

---

## 🔄 Alur Order (Flow)

```
1. Pengguna kirim pesan WhatsApp: "ORDER Masker 3"
          │
          ▼
2. Baileys Bot terima pesan
          │
          ▼
3. Bot kirim ke Laravel API: POST /api/orders
          │
          ▼
4. Laravel validasi, simpan ke database
          │
          ▼
5. Bot kirim konfirmasi ke WhatsApp pengguna
          │
          ▼
6. Pengguna kirim bukti transfer
          │
          ▼
7. Bot kirim ke Laravel: POST /api/payments
          │
          ▼
8. Admin verifikasi di dashboard Laravel
          │
          ▼
9. Bot kirim pesan konfirmasi ke pengguna
```

---

## 📝 Contoh Perintah WhatsApp Bot

| Perintah | Keterangan |
|----------|------------|
| `MENU` | Tampilkan menu utama |
| `PRODUCTS` | Lihat daftar produk |
| `ORDER <nama> <jumlah>` | Buat pesanan (contoh: `ORDER Masker 3`) |
| `ORDER_STATUS <nomor>` | Cek status pesanan |
| `MY_ORDERS` | Lihat semua pesanan saya |
| `CUSTOMER <nama> <alamat>` | Daftarkan alamat pengiriman |
| `HELP` | Bantuan |
| `ADMIN` | Menu admin (login) |
| `ADMIN REPORT` | Laporan penjualan (admin only) |

---

## ⚙️ Konfigurasi Lingkungan

### `.env` (Laravel)
```env
APP_NAME=WhatsAppOrderBot
APP_URL=http://localhost:8000
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=whatsapp_bot
DB_USERNAME=root
DB_PASSWORD=
```

### `.env` (Baileys Bot)
```env
BOT_API_URL=http://localhost:8000
BOT_WEBHOOK_PATH=/bot/webhook
SESSION_PATH=./session
PORT=3000
```

### Admin Credentials
- Email: `admin@bot.com`
- Password: `admin123`

---

## 📦 Cara Menjalankan

### 1. Mulai MySQL
```bash
# Sudah jalan via Laragon (port 3306)
# Atau jalankan: D:\laragon\www\waserver\start_mysql.bat
```

### 2. Jalankan Laravel Backend
```bash
cd D:\laragon\www\waserver\backend
php artisan serve --host=0.0.0.0 --port=8000
```

### 3. Jalankan Baileys Bot
```bash
cd D:\laragon\www\waserver\bot
npm install  # (sudah dijalankan sebelumnya)
npx ts-node src/index.ts
```

### 4. Test API
```bash
# Cek products
curl http://localhost:8000/api/products

# Cek health
curl http://localhost:8000/health

# Buat order (via webhook)
curl -X POST http://localhost:8000/bot/webhook -H "Content-Type: application/json" -d "{\"waId\":\"6281234567890@s.whatsapp.net\",\"waName\":\"Test User\",\"message\":\"ORDER Masker 3\"}"
```

---

## 🔐 Keamanan

- **BotAuthMiddleware** — Memvalidasi setiap request API
- **Rate Limiting** — Dikonfigurasi di Laravel
- **Input Sanitization** — Semua input WhatsApp disanitasi di `validators.ts`
- **Admin Role** — Endpoint admin dilindungi role `admin`
- **SQL Injection Prevention** — Laravel Eloquent ORM

---

## 📦 Dependencies yang Terinstall

### Backend (Laravel)
- Laravel Framework v12.69.2
- PHP 8.2.29
- 111 composer packages

### Bot (Baileys)
- `@whiskeysockets/baileys` — WhatsApp library
- `express` — Webhook server
- `axios` — HTTP client
- `winston` — Logging
- `typescript` — Type checking
- `ts-node` — TypeScript execution
- 266 npm packages total

---

## 🧪 Testing

```bash
# Laravel
cd backend
php artisan test
php artisan migrate:fresh --seed  # Reset dan seed ulang

# Bot
cd bot
npx tsc --noEmit  # Type check
npx tsc           # Compile
```

---

## 📈 Fitur Mendatang (Roadmap)

- [ ] Payment integration (QRIS, Dana, OVO, GoPay)
- [ ] Invoice PDF auto-generated via WhatsApp
- [ ] Stock notification (habis → notification ke admin)
- [ ] Report dashboard (grafik penjualan)
- [ ] Multi-user order tracking
- [ ] Promocode & discount system
- [ ] Baileys real-time WhatsApp connection (saat ini webhook mode)

---

## 📄 Lisensi

MIT License

---

## ✅ Checklist Status Project

- [x] Laravel backend dibuat dan berjalan
- [x] Database `whatsapp_bot` dibuat dan di-migrate (9 tabel)
- [x] 6 produk sample di-seed
- [x] 23 API route aktif (orders, products, payments, webhook, auth)
- [x] Bot Baileys dibuat (TypeScript + Express)
- [x] Message handler dengan 8 perintah (MENU, PRODUCTS, ORDER, dsb.)
- [x] API service untuk koneksi bot ↔ Laravel
- [x] `doc.md` diperbarui dengan struktur actual project
- [ ] Baileys real-time connection (tahap berikutnya)
- [ ] Admin dashboard (tahap berikutnya)
- [ ] Payment integration (tahap berikutnya)
