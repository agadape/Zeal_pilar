# Project Documentation & Architecture Blueprint: Tugu Leadership Portal
**GKDI Jogja — Youth & Campus Ministry (ZEAL Tugu)**

---

## 📌 Executive Summary
**Tugu Leadership Portal** adalah sistem manajemen jemaat, pengolahan statistik mingguan, pelacakan pemuridan (Belajar Alkitab), dan koordinasi pelayanan bagi kementerian kepemudaan & mahasiswa **ZEAL GKDI Tugu Jogja** (Gereja Kristus Di Indonesia).

Aplikasi ini dibangun menggunakan **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS v4**, dan **Supabase PostgreSQL** sebagai backend database relasional secara penuh.

---

## 🏬 Business Processes & Ministry Workflows

### 1. Struktur Komunitas & Kelompok Kecil (PDG / Small Group)
* **Gender-Based Discipleship**: Jemaat dibagi menjadi *Brother Group* dan *Sister Group*.
* **Leadership Assignment**: Setiap Small Group dipimpin oleh seorang **Leader** (Senior Disciple/Leader) yang bertanggung jawab atas pengembalaan anggota.
* **Member Mapping**: Setiap anggota jemaat di-assign ke satu Small Group melalui relasi tabel `group_members`.

### 2. Alur Pembinaan & Belajar Alkitab (BA Progress Tracking)
* **Kategori Jemaat**:
  1. `LEADER`: Pemimpin kelompok/kementerian.
  2. `DISCIPLE`: Murid yang sudah dibaptis dan aktif bertumbuh.
  3. `BIBLE_STUDY`: Teman yang sedang menjalani sesi studi Alkitab personal (1-on-1).
  4. `VISITOR`: Tamu ibadah/acara baru.
  5. `WEAK`: Jemaat yang butuh *follow-up* dan *care* khusus (lemah/perlu dijangkau).
  6. `INACTIVE`: Jemaat yang sedang tidak aktif.
* **Weekly BA Session Log (`bible_study_logs`)**:
  * Leader mencatat progres mingguan kandidat BA secara bertahap (Pertemuan 1 s.d. Pertemuan N).
  * Menuliskan topik pelajaran (misal: *Cinta Alkitab*, *Dosa & Pertobatan*, *Salib Kristus*, *Baptis*), tanggal sesi, dan catatan perenungan.
  * Status `study_stage` pada profil orang otomatis ter-update mengikuti pertemuan terbaru.

### 3. Pelaporan Statistika Minggu & Ekspor WhatsApp (Statistika Minggu)
* Setiap hari Minggu setelah ibadah, Leader mengisi laporan mingguan untuk Small Group-nya:
  * Jumlah Disciple aktif.
  * Murid yang tidak hadir ibadah beserta alasan spesifik (`missing_reasons`).
  * Progres murid Belajar Alkitab (`study_progress`).
  * Jumlah Reachout (jiwa terjangkau baru).
  * Jumlah Visitor Ibadah & Visitor Acara.
  * Jumlah Baptis baru.
* **Output 1-Klik**:
  1. Data tersimpan permanen ke tabel `weekly_stats` di Supabase untuk diolah menjadi grafik analytics.
  2. Sistem men-generate teks laporan terformat rapi yang otomatis tersalin ke Clipboard untuk dikirim ke grup WhatsApp Leadership.

### 4. Pelayanan Ibadah & Duty Roster (Events & Roster)
* Koordinasi acara mingguan (PDA Gabungan, PDA Brother/Sister, Doa Youth, P&W Night, Retreat, Outreach PMK).
* Penugasan petugas pelayanan (*Duty Roster*):
  * **Speaker / Pembawa Firman**
  * **Master of Ceremony (MC)**
  * **Praise & Worship (WL / Musisi)**
  * **Operator Zoom / Sound / Tech**

### 5. Komunikasi Visi & Pengumuman (Vision Directives)
* Papan pengumuman visi kerohanian jemaat, pilar komitmen saat teduh harian, dan instruksi kegiatan kepemimpinan yang dapat di-pin di bagian atas.

---

## 🗄️ Database Architecture (Supabase PostgreSQL)

Database menggunakan PostgreSQL di Supabase dengan **Row Level Security (RLS)** yang aktif.

```
┌──────────────────┐       ┌──────────────────────┐       ┌──────────────────┐
│      people      │───────│    group_members     │───────│      groups      │
└──────────────────┘ 1   * └──────────────────────┘ *   1 └──────────────────┘
         │                                                         │
         │ 1                                                       │ 1
         │                                                         │
         │ *                                                       │ *
┌──────────────────┐                                      ┌──────────────────┐
│bible_study_logs  │                                      │   weekly_stats   │
└──────────────────┘                                      └──────────────────┘
```

### DDL Schema SQL Complete

```sql
-- 1. TABEL JEMAAT / ORANG (people)
CREATE TABLE IF NOT EXISTS people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('BROTHER', 'SISTER')),
    phone_number TEXT,
    campus TEXT,
    status TEXT NOT NULL DEFAULT 'DISCIPLE' CHECK (status IN ('LEADER', 'DISCIPLE', 'BIBLE_STUDY', 'VISITOR', 'WEAK', 'INACTIVE')),
    study_stage TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL SMALL GROUPS (groups)
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('BROTHER', 'SISTER')),
    leader_id UUID REFERENCES people(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL ANGGOTA GROUP (group_members)
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    person_id UUID REFERENCES people(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, person_id)
);

-- 4. TABEL STATISTIK MINGGUAN (weekly_stats)
CREATE TABLE IF NOT EXISTS weekly_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    week_date DATE NOT NULL,
    active_disciples_count INT DEFAULT 0,
    missing_ibadah_count INT DEFAULT 0,
    missing_reasons JSONB DEFAULT '[]'::jsonb,
    study_progress JSONB DEFAULT '[]'::jsonb,
    reachout_count INT DEFAULT 0,
    sunday_visitors_count INT DEFAULT 0,
    event_visitors_count INT DEFAULT 0,
    baptisms_count INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL PROGRES BELAJAR ALKITAB MINGGUAN (bible_study_logs)
CREATE TABLE IF NOT EXISTS bible_study_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID REFERENCES people(id) ON DELETE CASCADE,
    week_number INT NOT NULL,
    study_date DATE NOT NULL,
    lesson_topic TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABEL EVENTS & ACARA (events)
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('PDA_BRO', 'PDA_SIS', 'PDA_COMBINED', 'DOA_YOUTH', 'PW_NIGHT', 'RETREAT', 'PMK_OUTREACH')),
    event_date TIMESTAMPTZ NOT NULL,
    location TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABEL PETUGAS PELAYANAN (event_rosters)
CREATE TABLE IF NOT EXISTS event_rosters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    person_id UUID REFERENCES people(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('SPEAKER', 'MC', 'OPERATOR', 'WORSHIP', 'PRAYER')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABEL VISI & PENGUMUMAN (announcements)
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROW LEVEL SECURITY POLICIES
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE bible_study_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read/Write people" ON people FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write groups" ON groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write group_members" ON group_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write weekly_stats" ON weekly_stats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write bible_study_logs" ON bible_study_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write events" ON events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write event_rosters" ON event_rosters FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write announcements" ON announcements FOR ALL USING (true) WITH CHECK (true);
```

---

## 💻 Tech Stack & Application Architecture

* **Framework**: Next.js 15.5 App Router (React 19)
* **Styling**: Tailwind CSS v4, Geist Sans font family, GKDI Warm Light Theme (`#f8fafc` bg, `#b5852e` gold accent, `#0f172a` primary text)
* **Iconography**: `@tabler/icons-react`
* **Micro-interactions**: `canvas-confetti` (efek penyelesaian pelaporan)
* **State & Data Layer**: Client-side state sync ke Supabase API (`src/lib/supabase.ts`) dengan fallback aman ke LocalStorage browser jika offline.
* **Build Target**: Fully Static/SSR Vercel ready (`npx next build` verified clean with 0 errors).

---

## 🛠️ File Structure

```
D:\Zeal\Tugu\
├── src/
│   ├── app/
│   │   ├── globals.css      # CSS Variables & GKDI Design System Tokens
│   │   ├── layout.tsx       # Root Layout
│   │   └── page.tsx         # Main Portal Orchestrator & State Container
│   ├── components/
│   │   ├── Navbar.tsx            # Header with GKDI Branding & Tab Controls
│   │   ├── DashboardView.tsx     # Overview Metrics, Motto, & Disciple Care
│   │   ├── PeopleView.tsx        # Directory (Disciples, BA Progress, Reachout)
│   │   ├── GroupsView.tsx        # Small Groups (PDG) & Member Assignment
│   │   ├── StatistikaView.tsx    # Weekly Stats, WA Formatter, & Analytics Dashboard
│   │   ├── EventsView.tsx        # Event Schedules & Duty Roster
│   │   └── AnnouncementsView.tsx # Spiritual Vision & Announcement Directives
│   └── lib/
│       ├── types.ts         # TypeScript Interfaces
│       ├── supabase.ts      # Supabase Client & CRUD API Handlers
│       └── mockData.ts      # Zero-state empty initial arrays
└── PROJECT_DOCUMENTATION.md # Architecture Blueprint (This file)
```

---

## 🚀 Future Roadmap & Optimization Potential
1. **Authentication & Multi-Role Permissions**: Integrasi Supabase Auth (misal: Role `Admin` bisa edit semua, Role `Leader` hanya bisa input kelompok sendiri).
2. **Export Excel / PDF Report**: Fitur unduh laporan bulanan jemaat dan statistik pertumbuhan per kuartal.
3. **Grafik Visual Interaktif Tambahan (Chart.js / Recharts)**: Visualisasi tren pertumbuhan jemaat bulanan dalam bentuk Line Chart & Bar Chart interaktif.
4. **Push Notification / Reminder WA**: Integrasi API WhatsApp Gateway (WAPI/Fonnte) untuk otomatis mengingatkan Leader mengabdi di hari Minggu.

---

*(Dokumen ini dibuat otomatis sebagai acuan arsitektur sistem dan audit independen oleh tim AI / Developer).*
