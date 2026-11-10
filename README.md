<div align="center">

# ⚡ TEMPO
**Master your work tempo, never miss a deadline.**

*A local-first, high-performance desktop productivity engine featuring unmissable reminders that pierce through Windows Do Not Disturb, task dependency graphs, activity vault, and multi-device local companion.*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-brightgreen)](https://github.com/Suruyaa/Tempo)
[![Built with Electron](https://img.shields.io/badge/Built%20with-Electron%20%2B%20Node.js-9cf)](https://www.electronjs.org/)
[![Local-First](https://img.shields.io/badge/Privacy-100%25%20Local--First-orange)](#-privacy--local-first)

</div>

---

## 🌟 Fitur Utama (Key Features)

### 1. 🛡️ Forced Notification System (Bypass Do Not Disturb)
Notifikasi biasa di Windows sering diabaikan atau dibisukan otomatis oleh fitur *Do Not Disturb (Focus Assist)*. **TEMPO** menggunakan jendela sekunder berstatus `alwaysOnTop: true, level: 'screen-saver'` yang melayang di layer tertinggi layar Anda disertai audio alarm mandiri via Web Audio API. 
- Tidak akan tertutup aplikasi lain atau game full-screen.
- Memiliki tombol **"Buka Berkas/Link Langsung"** untuk membuka berkas lampiran tugas dalam 1 klik.

### 2. ⏳ Horizon Peringatan Bertingkat (Countdown H-x)
Sistem peringatan adaptif untuk mencegah kerjaan menumpuk mendadak:
- Peringatan bertahap: **H-7, H-3, H-2, H-1, Hari H (Pagi), dan Jam H (Deadline)**.
- Badge hitung mundur dinamis yang langsung terlihat pada setiap kartu tugas.

### 3. 🗓️ Kalender Hari Libur Nasional & Peringatan Terintegrasi
- Memetakan seluruh **Hari Libur Nasional Indonesia (SKB 3 Menteri)** dan Cuti Bersama.
- Memuat **Hari Peringatan Nasional** (Hari Pahlawan, Sumpah Pemuda, Hari Guru, Hari Kartini, dll) dan **Hari Peringatan Internasional** penting.
- Agenda pribadi pengguna langsung di-plot berdampingan dengan tanggal merah, sehingga Anda langsung tahu jika ada deadline yang mepet liburan panjang.

### 4. 🗄️ Activity Vault (Brankas Berkas & Link Tugas)
- Setiap agenda memiliki brankas pribadi untuk menyimpan file penting (PDF, Word, Excel, Gambar) dan tautan URL (Google Docs, Zoom, Trello).
- Saat notifikasi paksa muncul di layar, cukup klik tombol **"Buka Berkas"** dan file langsung terbuka di aplikasi default komputer Anda.

### 5. 🕸️ Node Preview (Dependency Graph)
- Kanvas visual interaktif untuk menghubungkan **Point A ➜ Point B** (*Task Dependencies*).
- Mengetahui tugas mana yang harus diselesaikan terlebih dahulu sebelum tugas berikutnya dapat dimulai.
- Status visual otomatis: Hijau (Selesai), Kuning (In Progress), Merah (Urgent/Hari H), dan Abu-abu (Blocked / Menunggu Prasyarat).

### 6. 📌 Mini Floating Desktop HUD / Widget
- Widget transparan kecil mengambang di pojok layar desktop.
- Menampilkan countdown tugas berikutnya dan persentase rantai kerjaan tanpa harus membuka jendela utama.

### 7. 📱 Akses Mobile via QR Code (Local Wi-Fi Companion)
- Buka dashboard dari smartphone (Android / iOS) melalui jaringan Wi-Fi lokal dengan memindai QR Code di aplikasi.
- Sinkronisasi real-time 2 arah antara laptop dan HP.
- Ekspor kalender satu klik dalam format standar `.ics` untuk disinkronkan ke Google Calendar / Apple Calendar HP.

---

## 🔒 Privasi & Local-First

- **100% Data Lokal**: Semua agenda, jadwal, dan berkas vault disimpan di dalam komputer Anda (`data/activities.json` & `data/vault/`).
- **Zero Cloud & Zero Tracking**: Tidak ada server cloud pihak ketiga yang mengintip data Anda.
- **Koneksi HP Peer-to-Peer**: Akses dari HP berlangsung langsung melalui jaringan Wi-Fi lokal Anda.

---

## 🚀 Panduan Memulai (Quick Start)

### Prasyarat
- [Node.js](https://nodejs.org/) (versi 16 atau lebih baru)
- npm (bawaan Node.js)
- Git

### Instalasi & Menjalankan Mode Pengembangan
```bash
# 1. Clone repositori
git clone https://github.com/Suruyaa/Tempo.git
cd Tempo

# 2. Install dependensi
npm install

# 3. Jalankan aplikasi
npm start
```

### Membuat File Installer Windows (`.exe`)
Untuk membuat installer resmi mandiri yang bisa dibagikan:
```bash
npm run dist
```
File installer akan otomatis tersedia di folder `dist/`:
- `dist/Tempo Setup 1.0.0.exe` (NSIS Installer resmi Windows)
- `dist/Tempo 1.0.0.exe` (Versi Portable tanpa perlu install)

---

## 📂 Struktur Proyek

```text
Tempo/
├── .gitignore
├── LICENSE
├── README.md
├── package.json
├── main.js                     # Electron Main Process & Lifecycle
├── preload.js                  # IPC Bridge aman
├── data/
│   ├── activities.sample.json  # Template data awal
│   ├── activities.json         # Data lokal pengguna (di-ignore Git)
│   ├── holidays.json           # Database hari libur & peringatan
│   └── vault/                  # Brankas file lampiran
├── src/
│   ├── server/                 # Server lokal pendamping akses HP via Wi-Fi
│   ├── main/                   # Modul backend Electron (Scheduler, Store, AlertManager)
│   └── renderer/               # Antarmuka Bento Grid (HTML/CSS/JS)
```

---

## 📄 Lisensi

Proyek ini berlisensi di bawah [MIT License](LICENSE) - bebas digunakan, dimodifikasi, dan didistribusikan.
