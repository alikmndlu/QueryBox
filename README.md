<div align="center">

# 📦 QueryBox

### High-Performance, Local-First SQL Query Manager & Developer Workbench

[![GitHub Release](https://img.shields.io/github/v/release/alikmndlu/QueryBox?color=6366f1&style=for-the-badge&logo=github)](https://github.com/alikmndlu/QueryBox/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge)](LICENSE)
[![Go Version](https://img.shields.io/badge/Go-1.23+-00ADD8?style=for-the-badge&logo=go)](https://golang.org)
[![Wails v2](https://img.shields.io/badge/Wails-v2.15-df0000?style=for-the-badge)](https://wails.io)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com)

<p align="center">
  <a href="#-key-features"><b>Key Features</b></a> •
  <a href="#-downloads--installation"><b>Downloads</b></a> •
  <a href="#-supported-databases"><b>Databases</b></a> •
  <a href="#-keyboard-shortcuts"><b>Shortcuts</b></a> •
  <a href="#-architecture"><b>Architecture</b></a> •
  <a href="#-راهنمای-کامل-به-زبان-فارسی-persian-documentation"><b>توضیحات فارسی</b></a>
</p>

<p align="center">
  A lightning-fast, privacy-centric desktop SQL query library and workbench.<br />
  Manage, benchmark, visualize, and execute queries across <b>PostgreSQL</b>, <b>MySQL</b>, <b>SQLite</b>, and <b>SQL Server</b> with zero cloud dependencies.
</p>

</div>

---

## ⚡ Why QueryBox?

Most modern database tools are either bloated Electron monsters consuming gigabytes of RAM, or cloud-tethered dashboards that compromise your proprietary schemas and query history.

**QueryBox** takes a different approach:
- **Native Efficiency**: Built on [Wails v2](https://wails.io) and pure Go, launching in under a second with a ~30MB memory footprint.
- **Privacy by Design**: 100% local-first. All connections, queries, revisions, and execution logs reside exclusively on your machine in an encrypted SQLite database.
- **Safety First**: Intelligent query analyzer guards you against accidental production mishaps (intercepting destructive `DELETE`, `UPDATE`, `DROP`, and `TRUNCATE` commands with mandatory confirmations and missing `WHERE` clause warnings).
- **All-in-One Developer Ergonomics**: From Monaco IntelliSense and column pinning to instant statistical data profiling, zero-dependency SVG charts, and in-app self-updating.

---

## 🌟 Key Features

### 1. 🛡️ Intelligent Mutation Safety Guard
- **Accidental Execution Prevention**: Automatically analyzes queries before execution. Whenever a mutating statement (`UPDATE`, `DELETE`, `DROP`, `TRUNCATE`, `ALTER`) is detected, QueryBox halts and presents an explicit confirmation modal.
- **Missing `WHERE` Warning**: Specifically flags destructive `DELETE` and `UPDATE` statements running without a `WHERE` clause to safeguard against accidental bulk data loss.
- **Safe Read-Only Toggle**: Enforce a strict read-only session with a single click.

### 2. 📌 Virtualized Data Grid & Column Pinning
- **High-Performance Virtual Scrolling**: Smooth 60fps rendering capable of scrolling tens of thousands of rows without browser lag.
- **Column Pinning**: Pin critical identifier columns (like `id`, `uuid`, `username`, `email`) to the left of the grid so they remain permanently visible while scrolling horizontally through wide datasets.
- **Dynamic Sorting & Filtering**: Instant client-side text filtering and multi-column sorting.
- **Instant Data Export**: One-click export to **CSV**, **JSON**, and **TSV** formats.

### 3. 📊 Deep Column Profiler & Statistical Breakdown
- **One-Click Distribution**: Inspect data distribution across any result column without writing extra `COUNT(DISTINCT ...)` queries.
- **Metrics Breakdown**: Displays null percentages, unique record ratios, min/max/average numerical metrics, and top frequent values with visual mini-histograms.

### 4. 📈 Zero-Dependency SVG Data Visualizer
- **Instant Chart Generation**: Turn any query output into a presentation-ready **Bar Chart**, **Line Chart**, or **Donut Chart** with zero external chart library overhead.
- **Interactive Legend & Tooltips**: Fully responsive SVG visualization with hover values, dimension selection, and metric aggregation.

### 5. 🧠 Monaco Editor with Live Schema IntelliSense
- **Contextual Autocompletion**: Live autocompletion feeds table names, view names, column names, and data types directly from your active database connection.
- **Multi-Dialect SQL Formatter**: Format SQL cleanly with `Ctrl + Shift + F` tailored for PostgreSQL, MySQL, SQLite, and T-SQL.
- **Syntax Highlighting & Bracket Matching**: Full-featured IDE experience with multi-cursor support, minimap, and fold controls.

### 6. 🧩 Dynamic Parameter Substitution (`:param` & `{{param}}`)
- Automatically detects parameters using `:param_name` or `{{param_name}}` syntax.
- Dynamically renders parameter input fields in an interactive bar directly above the editor.
- Safely interpolates inputs into execution without altering your base template.

### 7. 📐 Live Database Schema Explorer & DDL Generator
- Connect and explore your database structure in a tree-view panel (Databases ➔ Schemas ➔ Tables & Views ➔ Columns).
- Inspect column data types, nullable states, default values, and primary keys.
- Generate dialect-accurate `CREATE TABLE` DDL statements with a single click.

### 8. 🔄 In-App Self-Updater
- **Direct GitHub Releases Integration**: Automatically checks for updates or lets you check on demand from Settings.
- **Changelog Viewer & Progress Bar**: Preview release notes, download the update with a real-time progress bar, and atomically replace the binary with zero manual extraction required.

### 9. 🗂️ Multi-Tab Workspace & Side-by-Side Version Diff
- Work on multiple queries simultaneously using persistent tabs.
- Every save automatically records an immutable snapshot version.
- Compare any two historical versions side-by-side with Monaco's integrated diff engine.

### 10. 💻 "Copy as Code" Generator
- Export your tested SQL query as idiomatic, production-ready code with parameter placeholders for:
  - **Go**: `database/sql` with context
  - **TypeScript / Node.js**: `pg` and `mysql2/promise`
  - **Python**: `psycopg2` and `pymysql`
  - **Rust**: `sqlx` async queries
  - **PHP**: `PDO` prepared statements

### 11. 🌿 Git / Directory Synchronization
- Bidirectional synchronization between your QueryBox collection and any local folder or Git repository.
- Queries are saved as human-readable `.sql` files with clean YAML frontmatter metadata (title, tags, connection target, timestamps).

### 12. ⏱️ Query Benchmarking & EXPLAIN Visualizer
- Benchmark query latency over multiple iterations (calculating minimum, maximum, and average execution times).
- Visualizer for `EXPLAIN` and `EXPLAIN ANALYZE` execution plans to pinpoint expensive sequential scans.

### 13. 🖥️ Native System Tray & Custom 3D Branding
- Native system tray integration across Windows, macOS, and Linux.
- Quick-access tray menu: `Show QueryBox`, `New Query`, `Settings`, and `Quit`.
- High-resolution custom 3D isometric QueryBox icon embedded directly into the Windows Taskbar, macOS Dock, and Linux application launchers.

---

## 🖥️ Downloads & Installation

### Pre-Compiled Packages

Download the latest release for your platform from the **[GitHub Releases Page](https://github.com/alikmndlu/QueryBox/releases)**:

| Platform | Package Format | Description |
| :--- | :--- | :--- |
| **Windows** (x64) | [`.exe` (NSIS Installer)](https://github.com/alikmndlu/QueryBox/releases) | Recommended installer with desktop shortcut & start menu integration |
| **Windows** (x64) | [`.zip` (Portable)](https://github.com/alikmndlu/QueryBox/releases) | Standalone portable executable (no install required) |
| **macOS** (Universal) | [`.dmg` (Disk Image)](https://github.com/alikmndlu/QueryBox/releases) | Drag-and-drop installer for Apple Silicon (M1/M2/M3/M4) & Intel |
| **macOS** (Universal) | [`.tar.gz` (Archive)](https://github.com/alikmndlu/QueryBox/releases) | Standalone `QueryBox.app` bundle |
| **Linux** (amd64) | [`.deb` (Debian/Ubuntu)](https://github.com/alikmndlu/QueryBox/releases) | Native Debian/Ubuntu package (`sudo dpkg -i ...`) |
| **Linux** (amd64) | [`.rpm` (Fedora/RHEL)](https://github.com/alikmndlu/QueryBox/releases) | Native RedHat/Fedora package (`sudo rpm -i ...`) |
| **Linux** (amd64) | [`.tar.gz` (Binary)](https://github.com/alikmndlu/QueryBox/releases) | Standalone binary with desktop file and icons |

---

## 🗄️ Supported Databases

QueryBox uses pure-Go database drivers with **zero external C library dependencies (no CGo)**:

| Database Engine | Driver / Library | Connection Details |
| :--- | :--- | :--- |
| **PostgreSQL** | `github.com/lib/pq` | Standard Host, Port (5432), Database, User, Password, SSL modes (`disable`, `require`) |
| **MySQL** / MariaDB | `github.com/go-sql-driver/mysql` | Host, Port (3306), Database, User, Password, Connection collation |
| **SQLite** | `github.com/glebarez/go-sqlite` | Local file path (`.db`, `.sqlite`, `.sqlite3`) with in-memory WAL support |
| **Microsoft SQL Server** | `github.com/microsoft/go-mssqldb` | Host, Port (1433), Database, User, Password, Encrypt modes |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action | Description |
| :--- | :--- | :--- |
| **`Ctrl + Enter`** | **Execute Query** | Runs the active query against the selected database connection |
| **`Ctrl + S`** | **Save Query** | Saves query name, SQL content, variables, and tags |
| **`Ctrl + Shift + F`** | **Format SQL** | Beautifies SQL using the dialect-specific formatter |
| **`Ctrl + Shift + C`** | **Copy SQL** | Copies the active editor SQL directly to the clipboard |
| **`Ctrl + N`** | **New Tab** | Opens a fresh, empty query tab |
| **`Ctrl + W`** | **Close Tab** | Closes the current query tab |
| **`Ctrl + B`** | **Toggle Sidebar** | Toggles left navigation panel |
| **`Ctrl + K`** / **`Ctrl + Shift + P`** | **Command Palette** | Opens Raycast-style command search |
| **`Ctrl + ,`** | **Settings** | Opens theme, editor, and update preferences |
| **`Ctrl + /`** | **Cheat Sheet** | Opens interactive keyboard shortcuts reference modal |

*(Note: On macOS, substitute `Ctrl` with `Cmd ⌘`)*

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│             React 19 + TypeScript + Tailwind CSS             │
│   (Monaco Editor • Virtual Data Grid • SVG Visualizer)       │
└──────────────────────────────┬───────────────────────────────┘
                               │ Wails v2 IPC Bridge
┌──────────────────────────────┴───────────────────────────────┐
│                     Go Application Core                      │
│             (app.go • Local SQLite WAL Storage)              │
├──────────────────────────────┬───────────────────────────────┤
│    Services & Repositories   │      Native Desktop Tray      │
│  - Query & Version Repo      │  - Windows Native Tray (.ico) │
│  - Connection Profile Repo   │  - macOS / Linux Tray (.png)  │
│  - Query Execution Engine    │  - Minimized-to-Tray Support  │
│  - Git Bidirectional Sync    │  - Global Window Activation   │
│  - Self-Updater (GitHub API) │                               │
└──────────────────────────────┴───────────────────────────────┘
                               │ Pure Go Database Drivers (Zero CGo)
    ┌──────────────┬───────────┴───┬──────────────┬─────────────┐
    ▼              ▼               ▼              ▼             ▼
PostgreSQL       MySQL           SQLite       SQL Server    Local Git
 (lib/pq)    (go-sql-driver)  (go-sqlite)   (go-mssqldb)    (Folder)
```

---

## 🛠️ Building from Source

### Prerequisites
- [Go](https://go.dev/dl/) `1.23` or newer
- [Node.js](https://nodejs.org/) `20.x` or newer & npm
- [Wails CLI v2](https://wails.io/docs/gettingstarted/installation):
  ```bash
  go install github.com/wailsapp/wails/v2/cmd/wails@latest
  ```

### Development Mode (Hot Reload)
```bash
# Clone the repository
git clone https://github.com/alikmndlu/QueryBox.git
cd QueryBox

# Run live development server
wails dev
```

### Production Build
```bash
# Generate high-resolution icons (automatic during build)
go run ./scripts/genicon.go

# Compile native binary for your OS
wails build -clean
```
The compiled binary will be placed in `build/bin/`.

---

## 🇮🇷 راهنمای کامل به زبان فارسی (Persian Documentation)

<div dir="rtl">

**QueryBox** یک ورک‌بنچ و مدیر کوئری مدرن، بسیار پرسرعت و کاملاً آفلاین (Local-First) برای برنامه‌نویسان، مدیران پایگاه داده و مهندسان داده است که با بهره‌گیری از هسته قدرتمند **Go** و رابط کاربری واکنش‌گرای **React 19** ساخته شده است.

### 🌟 قابلیت‌های برجسته:

1. **🛡️ گارد محافظتی عملیات حساس (Mutation Safety Guard)**:
   - کوئری‌باکس قبل از اجرای هر دستور، ساختار آن را بررسی می‌کند.
   - در صورت مشاهده دستورات تغییردهنده داده یا ساختار دیتابیس (`UPDATE`، `DELETE`، `DROP`، `TRUNCATE`، `ALTER`)، اجرای خودکار متوقف شده و یک پنجره تأییدیه امنیتی نمایش داده می‌شود.
   - در صورتی که دستور `UPDATE` یا `DELETE` بدون شرط `WHERE` باشد، هشدار جدی داده می‌شود تا از حذف یا ویرایش تصادفی کل جدول جلوگیری به عمل آید.
   - امکان فعال‌سازی حالت امن (Safe Read-Only) با یک کلیک.

2. **📌 جدول داده‌های مجازی و پین کردن ستون‌ها (Column Pinning)**:
   - نمایش فوق‌العاده روان ده‌ها هزار رکورد بدون افت فریم به لطف Virtual Data Grid.
   - قابلیت **پین کردن (Pin)** ستون‌های کلیدی (مانند `id`، `uuid`، نام و ...) به سمت چپ جدول؛ بدین ترتیب در حین اسکرول افقی در جدول‌های عریض، ستون‌های شناسایی همواره ثابت و خوانا باقی می‌مانند.
   - جستجوی بلادرنگ در نتایج و مرتب‌سازی چندستونه.
   - خروجی سریع به فرمت‌های CSV، JSON و TSV.

3. **📊 پروفایلر آماری داده‌ها (Data Profiler)**:
   - تحلیل آماری ستون‌ها بدون نیاز به نوشتن کوئری‌های پیچیده `COUNT(DISTINCT)`.
   - نمایش درصد رکوردهای خالی (Null Ratio)، تعداد مقادیر منحصربه‌فرد، میانگین/مجموع برای فیلدهای عددی و هیستوگرام گرافیکی داده‌های پرتکرار.

4. **📈 رسم نمودار آنی بدون وابستگی خارجی (Instant SVG Charts)**:
   - تبدیل سریع نتایج کوئری به نمودارهای میله‌ای (Bar)، خطی (Line) و دونات (Donut) با وکتور SVG خالص و بدون سربار کتابخانه‌های سنگین جاوااسکریپت.

5. **🧠 ادیتور پیشرفته Monaco با پیشنهاد هوشمند دیتابیس (IntelliSense)**:
   - تکمیل خودکار نام جداول، نماها و ستون‌ها بر اساس پایگاه داده متصل به صورت زنده.
   - مرتب‌سازی استاندارد و فرمت خودکار کدهای SQL با میانبر `Ctrl + Shift + F` متناسب با گویش دیتابیس فعال (PostgreSQL, MySQL, SQLite, T-SQL).

6. **🧩 پارامترها و متغیرهای پویا (`:param` و `{{param}}`)**:
   - تشخیص خودکار متغیرهای فرمولیزه شده در متن کوئری.
   - ایجاد خودکار فیلدهای ورودی در نوار ابزار بالای ویرایشگر و جایگزینی خودکار بدون دستکاری ساختار اصلی تمپلیت.

7. **📐 کاوشگر ساختار پایگاه داده و تولید DDL**:
   - مشاهده درختی پایگاه داده (دیتابیس ➔ اسکیما ➔ جدول‌ها و ویوها ➔ ستون‌ها و انواع داده).
   - تولید خودکار اسکریپت `CREATE TABLE` هر جدول با یک کلیک.

8. **🔄 سیستم به‌روزرسانی خودکار درون‌برنامه‌ای (In-App Updater)**:
   - بررسی خودکار و دستی نسخه‌های جدید از روی گیت‌هاب ریلیز.
   - مشاهده لیست تغییرات، نوار درصد پیشرفت دانلود و جایگزینی خودکار فایل اجرایی بدون نیاز به نصب دستی.

9. **🗂️ فضای کاری چندتبی و مقایسه تصویری نسخه‌ها (Monaco Diff)**:
   - کار همزمان روی چندین کوئری با سیستم تب‌های پایدار.
   - ثبت تاریخچه خودکار نسخه‌ها در هر بار ذخیره.
   - مقایسه تصویری دو نسخه مختلف کوئری با موتور Diff ادیتور مونکا.

10. **💻 مبدل کوئری به کد آماده ("Copy as Code")**:
    - تولید سریع کد اتصال و اجرای کوئری برای زبان‌های:
      - **Go**: با پکیج استاندارد `database/sql`
      - **TypeScript / Node.js**: درایورهای `pg` و `mysql2`
      - **Python**: کتابخانه‌های `psycopg2` و `pymysql`
      - **Rust**: فریمورک محبوب `sqlx`
      - **PHP**: استفاده از `PDO` ایمن با Prepared Statements

11. **🌿 همگام‌سازی دوطرفه با گیت و پوشه‌های محلی**:
    - ذخیره کوئری‌ها به صورت فایل‌های تمیز `.sql` با متادیتای YAML Frontmatter در هر پوشه یا مخزن گیت محلی.

12. **⏱️ بنچمارک کوئری و تحلیل EXPLAIN**:
    - اجرای آزمایشی کوئری در دفعات مشخص و محاسبه کمترین، بیشترین و میانگین زمان اجرا به میلی‌ثانیه.

13. **🖥️ آیکون اختصاصی سه‌بعدی و یکپارچگی با تسک‌بار و System Tray**:
    - طراحی حرفه‌ای لوگوی ۳ بعدی QueryBox.
    - نمایش کامل در System Tray ویندوز، مک و لینوکس با منوی دسترسی سریع (باز کردن برنامه، کوئری جدید، تنظیمات و خروج).

</div>

---

## 🤝 Contributing

Contributions make the open-source community thrive! Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/IncredibleFeature`)
3. Commit your Changes (`git commit -m 'Add some IncredibleFeature'`)
4. Push to the Branch (`git push origin feature/IncredibleFeature`)
5. Open a Pull Request

---

## 📜 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more details.

---

<div align="center">
  <b>QueryBox</b> — Built with passion by <a href="https://github.com/alikmndlu">Ali Kamandlu</a>
</div>
