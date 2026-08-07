# 🏔️ GKDI Tugu — Leaders Portal

> **Website internal untuk core ZEAL Yogyakarta** — kelola statistik ibadah, track progress murid Belajar Alkitab, atur small group, dan pantau pertumbuhan jemaat dari satu dashboard.

[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://vercel.com)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?logo=supabase)](https://supabase.com)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)

---

## ✨ Apa ini?

Portal kepemimpinan all-in-one untuk **ZEAL (GKDI) Pilar → Tugu Yogyakarta**. Dari nge-track siapa aja yang hadir ibadah Minggu, sampai tau siapa yang lagi Belajar Alkitab di pertemuan ke berapa — semua ada di sini. Bukan spreadsheet Excel yang ribet. Bukan grup WA yang berantakan. Ini dashboard-nya para pemimpin.

---

## 🚀 Features

| Fitur | Deskripsi |
|---|---|
| 📊 **Statistika Minggu** | Input laporan mingguan per group: disciple aktif, missing, reachout, visitor, baptis |
| 📈 **Trend Grafik** | Visualisasi area chart interaktif perkembangan reachout & visitor per minggu |
| 👥 **Direktori Jemaat** | Kelola data lengkap jemaat dengan filter kampus, status, dan gender |
| 📖 **BA Progress Tracker** | Track progres Belajar Alkitab per orang, per minggu, per pertemuan |
| 🏠 **Small Group Manager** | Buat & atur PDG Brother/Sister, mapping anggota, tugaskan pemimpin |
| 🔄 **Leader Handover Wizard** | Transfer kepemimpinan group dengan histori resmi & alasan pergantian |
| 🎂 **Milestone Tracker** | Pengingat ulang tahun jasmani & spiritual birthday (tanggal baptis) jemaat |
| 🗓️ **Events & Duty Roster** | Jadwal PDA, PW Night, Retreat — lengkap dengan pembagian tugas pelayanan |
| 📢 **Pengumuman** | Papan visi & pengumuman yang bisa di-pin oleh pemimpin |
| 📥 **CSV Export** | Export data jemaat & statistik mingguan langsung ke Excel 1-klik |
| 🌄 **Discipleship Funnel** | Dashboard visual alur pertumbuhan: Visitor → BA → Disciple → Leader |

---

## 🗄️ Database Schema

Dibangun di atas **Supabase PostgreSQL** dengan relational schema yang proper:

```
people
├── bible_study_logs        (weekly BA progress per person)
│
groups
├── group_members           (many-to-many: people ↔ groups)
├── group_leadership_history (auto-logged via DB trigger)
│
weekly_stats
├── weekly_stat_absences    (normalized: siapa missing + alasan)
└── weekly_stat_study_progress (normalized: siapa di stage BA apa)
```

**Views:**
- `upcoming_milestones` — birthday & spiritual birthday 30 hari ke depan (live, no cron)
- `leadership_tenure` — histori & durasi kepemimpinan per group

**Keamanan data:** `archived_at` soft delete + `updated_at` audit trail + upsert constraint `UNIQUE(group_id, week_date)` untuk mencegah laporan ganda.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 15 (App Router) + Tailwind CSS v4
- **Database:** Supabase (PostgreSQL + RLS + DB Triggers)
- **Charts:** Recharts (AreaChart interaktif)
- **Icons:** Tabler Icons
- **Deploy:** Vercel (auto-deploy dari GitHub `main`)
- **Fallback:** LocalStorage untuk offline/dev mode

---

## 🏃 Run Locally

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.local.example .env.local
# Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY

# Dev server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

---

## 🗂️ Project Structure

```
src/
├── app/
│   ├── page.tsx            # Root state orchestration
│   └── globals.css         # Design tokens & utilities
├── components/
│   ├── DashboardView.tsx   # Overview + milestone widget + funnel
│   ├── PeopleView.tsx      # Direktori jemaat + BA tracker
│   ├── GroupsView.tsx      # Small groups + handover wizard
│   ├── StatistikaView.tsx  # Laporan mingguan + charts
│   ├── EventsView.tsx      # Event & duty roster
│   └── AnnouncementsView.tsx
└── lib/
    ├── supabase.ts         # All DB queries & API functions
    ├── types.ts            # TypeScript interfaces
    ├── exportUtils.ts      # CSV export utilities
    └── initialData.ts      # Fallback seed data
```

---

## 📋 Database Migrations

Jalankan secara berurutan di **Supabase SQL Editor**:

| File | Isi |
|---|---|
| `supabase_schema_v2.sql` | Indexes, soft delete, normalized absence tables, upsert constraint |
| `supabase_schema_v3.sql` | Birthday/baptism columns, milestone view, leadership history + trigger |

---

## 🙏 Built for

**ZEAL Youth & Campus Ministry — GKDI Jogja**  
*"Inilah Rumah Tuhan & Kamu Semua Diundang"*
