<div align="center">

<img src="src/renderer/assets/tempo-logo.png" alt="TEMPO Logo" width="120" style="border-radius: 20px; box-shadow: 0 8px 30px rgba(56, 189, 248, 0.35); margin-bottom: 16px;">

# TEMPO
### Master your work tempo, never miss a deadline.

*A local-first, high-performance desktop productivity engine featuring unmissable reminders that pierce through Windows Do Not Disturb, interactive force-directed graph view, markdown logbook journal, global quick scratchpad, and activity vault.*

[![License: MIT](https://img.shields.io/badge/License-MIT-38bdf8.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-10b981)](https://github.com/Suruyaa/Tempo)
[![Built with Electron](https://img.shields.io/badge/Built%20with-Electron%20%2B%20Node.js-6366f1)](https://www.electronjs.org/)
[![Local-First](https://img.shields.io/badge/Privacy-100%25%20Local--First-f59e0b)](#-privasi--arsitektur-local-first)
[![Design](https://img.shields.io/badge/Iconography-100%25%20SVG%20Vector-ef4444)](#-desain--pengalaman-pengguna)

</div>

---

## ⚡ Mengapa TEMPO Dibuat?

Notifikasi bawaan sistem operasi sering kali gagal menyelamatkan tenggat waktu kritis karena tertelan oleh fitur **Windows Focus Assist (Do Not Disturb)**, tertutup game full-screen, atau terabaikan begitu saja. 

**TEMPO** hadir sebagai mesin pengingat agresif dan terstruktur yang menjamin Anda tidak akan pernah melewatkan tugas berprioritas tinggi, sembari tetap menjaga privasi data Anda 100% tersimpan di perangkat lokal tanpa koneksi cloud pihak ketiga.

---

## 🌟 Fitur Utama (Core Features)

### 1. Agenda, Horizon Warning & Penyuntingan Mandiri
- Kelola jadwal dengan batas waktu presisi, kategori tag, skala prioritas, dan dependensi prasyarat antar tugas.
- **Penyuntingan Fleksibel**: Anda dapat menyunting kembali agenda kapan saja dengan **klik kanan** pada kartu tugas atau menekan **tombol titik 3 (`...`)**.
- **Horizon Peringatan Bertingkat**:
  - **H-7**: Peringatan awal 1 minggu sebelumnya.
  - **H-3 & H-2**: Fase persiapan berkas.
  - **H-1**: Peringatan intensif malam sebelum tenggat.
  - **Hari H & Jam H**: Notifikasi layar penuh tepat waktu.

### 2. Forced Notification Engine (Bypass Windows Do Not Disturb)
- Memunculkan jendela darurat sekunder berstatus `alwaysOnTop: true, level: 'screen-saver'` di layer teratas layar Anda.
- **Synthesizer Alarm Mandiri & 7 Pilihan Suara**: Bunyi peringatan dinamis dihasilkan secara langsung melalui Web Audio API offline tanpa koneksi internet. Pengguna dapat memilih, menguji, dan mengatur volume nada favorit dari menu *Suara Notifikasi*:
  - 🔔 **Tempo Chime (Default)**: Kristal modern dengan akor 3 nada naik yang elegan dan jernih.
  - 📡 **Radar Pulse**: Sonar radar dua nada turun berkarakter taktikal cyber/sci-fi.
  - ⌚ **Digital Retro**: Bip-bip ganda arloji digital 80-an yang tajam dan nostalgia.
  - 🪵 **Warm Marimba**: Petikan kayu pentatonik yang santai dan ramah di telinga.
  - 🚨 **Siren Alarm**: Sirine bergetar cepat ekstrem untuk membongkar fokus yang menunda tugas.
  - 🧘 **Zen Singing Bowl**: Dentang mangkuk meditasi 432Hz yang bergaung meditatif dan dalam.
  - ⚡ **Space Ping**: Drop frekuensi laser arcade yang tajam dan futuristik.
- **Kustomisasi Global & Khusus**: Nada dapat diatur secara global untuk seluruh alarm, atau disesuaikan khusus untuk agenda spesifik.
- **Anti-Procrastination Math Challenge**: Untuk tugas berkategori *Mendesak (Urgent)* atau *Hari H*, tombol penunda/penutup alarm dilindungi oleh tantangan perhitungan matematika cepat untuk memaksa otak Anda sadar dan tidak menunda pekerjaan.
- **One-Click Vault Access**: Akses instan ke draft dokumen kerja langsung dari popup notifikasi saat alarm berbunyi.

### 2. Interactive Force-Directed Graph View
- Visualisasi hubungan prasyarat tugas (**Point A ➜ Point B**) menggunakan simulasi fisika partikel kanvas HTML5 interaktif.
- **Bebas Geser & Pinning Posisi (Free Drag-and-Drop)**: Seluruh node tugas dapat ditarik dan digeser bebas ke mana pun di seluruh kanvas. Saat ditaruh, posisi node terkunci otomatis (*pinned*) agar tidak kembali membal ke tengah, dan dapat dilepas kembali dengan klik dua kali (*double-click*).
- **Kanvas Luas & Navigasi Bebas (Pan & Zoom)**: Geser kanvas ke segala arah (*drag to pan*) serta perbesar/perkecil tampilan dengan scroll mouse wheel atau tombol kontrol zoom (+ / -).
- **Physics Simulation**: Dilengkapi kalkulasi gaya tolak (*repulsion*), pegas elastis (*spring damping*), dan inersia gerak antar node yang saling terhubung.
- **Dual Mode**:
  - **Force Galaxy View**: Node orbs dinamis dengan glow status (Hijau = Selesai, Cyan = Normal, Kuning = Mendekati Tenggat, Merah = Urgent, Abu-abu = Terkunci).
  - **Timeline Flowchart**: Tata letak berurutan berdasarkan kronologi tenggat waktu.
- **Node Inspector Drawer**: Klik sembarang node untuk memfokuskan kamera, menginspeksi detail, membuka link vault, atau menandai selesai secara real-time.

### 3. Logbook & Jurnal Produktivitas (Modern Canvas & Markdown Native)
- Ruang pencatatan refleksi harian, evaluasi sprint kerja, dan log pencapaian tugas dengan pengalaman menulis kanvas yang bersih, lapang, dan bebas distraksi.
- **Penyuntingan Langsung**: Edit entri jurnal yang telah tersimpan kapan saja via klik kanan (`contextmenu`) atau tombol titik 3 (`...`).
- **Ekspor ke `.MD`**: Kompilasi seluruh entri jurnal dan riwayat tugas selesai ke dalam format standar Markdown untuk diarsipkan di aplikasi catatan personal pilihan Anda atau repositori dokumen.
- **Impor dari `.MD`**: Baca kembali berkas Markdown eksternal dan masukkan secara otomatis ke dalam database lokal TEMPO.
- **Auto Milestone Logger**: Setiap tugas yang ditandai selesai otomatis tercatat ke dalam feed pencapaian logbook.

### 4. Quick Scratchpad (Global Shortcut: `Alt + Space`)
- Catat ide kilat, draft teks, atau tautan penting dari aplikasi apa pun tanpa perlu membuka jendela utama.
- Cukup tekan kombinasi keyboard **`Alt + Space`** atau **`Ctrl + Shift + Space`** untuk memunculkan floating notepad transparan.
- **Dual Conversion Workflow**:
  - 🚀 **Ke Agenda**: Ubah catatan kilat menjadi agenda kerja resmi dengan tenggat waktu otomatis.
  - 📖 **Ke Jurnal**: Pindahkan catatan kilat langsung ke entri logbook refleksi harian.
- Auto-save instan setiap kali Anda mengetik.

### 5. Horizon Peringatan Bertingkat (Countdown H-x)
- Mencegah *panic working* dengan skema peringatan bertahap:
  - **H-7**: Peringatan awal 1 minggu sebelumnya.
  - **H-3 & H-2**: Fase persiapan berkas.
  - **H-1**: Peringatan intensif malam sebelum tenggat.
  - **Hari H & Jam H**: Notifikasi layar penuh tepat waktu.

### 6. Kalender Terintegrasi dengan Konteks Edukatif (SKB 3 Menteri, PBB, & UNESCO)
- **Hari Libur Nasional Resmi (SKB 3 Menteri)**: Tanggal merah resmi pemerintah Indonesia lengkap dengan makna dan latar belakang penetapannya.
- **Hari Peringatan Nasional Bersejarah RI**: Dilengkapi ikon bendera Merah Putih dan uraian sejarah mendalam (Hari Pahlawan, Sumpah Pemuda, Hardiknas, Hari Kartini, Hari Kesaktian Pancasila, dll).
- **Hari Internasional Resmi (PBB / United Nations & UNESCO)**: Dikurasi langsung dari daftar observasi resmi PBB & UNESCO (Hari Sains Sedunia, Hari Bahasa Ibu, Hari Perdamaian, Hari Kebebasan Pers, Hari HAM, Hari Bumi, dll) lengkap dengan simbol Globe dan penjelasan tujuan globalnya.
- **Panel Konteks & Edukasi**: Klik sembarang tanggal di kalender untuk membaca ringkasan sejarah, tujuan, dan urgensi di balik setiap hari peringatan secara komprehensif.
- **Ekspor Kalender Standar (`.ICS`)**: Unduh jadwal lengkap dalam format `.ics` untuk disinkronkan ke Google Calendar, Apple Calendar, atau kalender ponsel Anda.

### 7. Activity Vault (Brankas Berkas & Dokumen)
- Brankas berkas per agenda untuk mengaitkan draft lokal (PDF, Word, Excel, source code) serta tautan dokumen online (Google Docs, Figma, PRD).
- Terintegrasi langsung dengan notifikasi layar paksa untuk pembukaan berkas satu ketukan.

### 8. Mini Desktop HUD dengan Animasi Dropdown Interaktif
- Widget mengambang transparan di sudut layar desktop (`alwaysOnTop: true, level: 'floating'`).
- **Interactive Bouncy Dropdown**: Cukup klik widget HUD atau ikon chevron untuk membuka daftar agenda mendatang dengan animasi spring dropdown yang membal halus (*overshoot bounce*).
- **One-Click Task Completion**: Centang status selesai tugas langsung dari dropdown HUD tanpa perlu membuka jendela utama.
- **Cascading Reveal & Status Badges**: Setiap item agenda beranimasi muncul secara berjenjang (*staggered slide-down*) lengkap dengan badge horizon (*Hari H, H-1, H-2*).

---

## 🎨 Desain & Pengalaman Pengguna

- **100% SVG Vector Iconography**: Bebas dari emotikon bergaya "AI slop". Seluruh elemen navigasi, status bar, kartu tugas, dan tombol aksi menggunakan icon vektor yang tajam, presisi, dan konsisten.
- **Custom In-App Dark Dialogs**: Tidak ada lagi dialog browser putih bawaan (`confirm()` / `alert()`). Seluruh konfirmasi aksi menggunakan modal bernuansa gelap dengan aksen crimson dan cyan glow yang serasi.
- **Responsive Sidebar Architecture**: Navigasi menyamping modular yang fleksibel saat jendela di-maximize atau diubah ukurannya.

---

## 🔒 Privasi & Arsitektur Local-First

- **Zero Cloud & Zero Telemetry**: Tidak ada API eksternal yang melacak aktivitas Anda.
- **Penyimpanan Lokal**: Seluruh agenda, catatan scratchpad, berkas vault, dan jurnal logbook tersimpan murni di sistem berkas lokal Anda (`data/activities.json`, `data/logbook.json`, `data/vault/`).
- **Git Friendly**: Berkas rahasia dan vault pribadi secara otomatis dimasukkan ke `.gitignore` sehingga Anda bebas meng-push source code ke GitHub publik tanpa khawatir data pribadi bocor.

---

## ⌨️ Pintasan Keyboard Global (Shortcuts)

| Pintasan Keyboard | Aksi |
| :--- | :--- |
| **`Alt + Space`** | Buka / Tutup Quick Scratchpad di mana saja |
| **`Ctrl + Shift + Space`** | Pintasan alternatif untuk Quick Scratchpad |
| **`Esc`** | Menutup modal atau jendela popup aktif |

---

## 🚀 Panduan Memulai (Quick Start)

### Prasyarat
- [Node.js](https://nodejs.org/) (versi 18 atau lebih baru disarankan)
- npm (terpasang bersama Node.js)
- Git

### 1. Clone Repositori
```bash
git clone https://github.com/Suruyaa/Tempo.git
cd Tempo
```

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Menjalankan Aplikasi
```bash
npm start
```

---

## 📦 Membuat File Installer (Windows & Linux)

TEMPO telah dikonfigurasikan menggunakan `electron-builder` untuk menghasilkan installer resmi multi-platform yang siap pakai:

### Windows (`.exe` NSIS & Portable)
```bash
# Membuat installer NSIS dan versi Portable Windows
npm run dist:win
# atau cukup jalankan:
npm run dist
```
Hasil kompilasi akan otomatis tersedia di direktori `dist/`:
- `dist/Tempo Setup 1.0.0.exe` — File installer resmi Windows dengan wizard instalasi dan desktop shortcut.
- `dist/Tempo 1.0.0.exe` — Versi Portable siap pakai tanpa perlu proses instalasi.

### Linux (`.AppImage` & `.deb`)
```bash
# Membuat paket distribusi Linux
npm run dist:linux
```
Hasil kompilasi akan otomatis tersedia di direktori `dist/`:
- `dist/Tempo-1.0.0.AppImage` — Paket mandiri (standalone executable) universal untuk seluruh distro Linux (Ubuntu, Debian, Fedora, Arch, dll).
- `dist/tempo_1.0.0_amd64.deb` — Paket instalasi berbasis Debian/Ubuntu.

Untuk mengompilasi semua target sekaligus:
```bash
npm run dist:all
```

---

## 📁 Struktur Repositori

```text
Tempo/
├── assets/                       # Asset icon resmi Tempo Clockmark
├── data/
│   ├── activities.json           # Database lokal agenda & tenggat waktu
│   ├── holidays.json             # Database Hari Libur SKB 3 Menteri & Hari Besar
│   ├── logbook.json              # Database catatan jurnal refleksi
│   └── vault/                    # Folder penyimpanan berkas terlampir
├── src/
│   ├── main/
│   │   ├── alertManager.js       # Window manager untuk notifikasi paksa screen-saver
│   │   ├── icsExporter.js        # Generator ekspor kalender standar RFC 5545
│   │   ├── scheduler.js          # Background cron checker interval H-x
│   │   └── store.js              # Local storage JSON engine & MD parser
│   └── renderer/
│       ├── assets/               # Gambar logo Clockmark dan vector
│       ├── components/
│       │   ├── agendaView.js     # Tampilan to-do list, filter, dan countdown cards
│       │   ├── calendarView.js   # Kalender bulanan, libur nasional & perencana
│       │   ├── logbookView.js    # Editor jurnal & ekspor/impor Markdown
│       │   ├── nodeGraph.js      # Interactive force-directed physics graph
│       │   └── vaultView.js      # Brankas berkas & tautan online
│       ├── alert.html / alert.js # Antarmuka peringatan darurat anti-procrastination
│       ├── scratchpad.html / js  # Floating quick notes widget
│       ├── widget.html / widget.js# Mini HUD desktop
│       ├── index.html            # Layout utama aplikasi
│       ├── index.js              # State manager & controller
│       └── styles.css            # Dark mode glassmorphism design system
├── main.js                       # Electron lifecycle, tray, & global shortcuts
├── preload.js                    # Secure context-bridge IPC
├── package.json                  # Konfigurasi builder & dependensi
└── LICENSE                       # MIT License
```

---

## 📜 Lisensi

Proyek ini dilisensikan di bawah naungan **[MIT License](LICENSE)**. Bebas dikembangkan, dimodifikasi, dan didistribusikan untuk keperluan personal maupun profesional.
