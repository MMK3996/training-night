# Project Specification & Task Roadmap: Minimalist Spaced Repetition System (SRS)

A production-ready, ultra-minimalist, mobile-first Spaced Repetition System (SRS) web application running 100% client-side on **GitHub Pages** (`github.io`). The application unifies **Competitive Programming / ICPC Problem Tracking** (Codeforces, AtCoder, USACO, CSES) and **University Course Priority Scheduling** powered by a modified **Anki SM-2 SRS Algorithm**.

---

## 1. Architecture & Tech Stack

### 1.1 Core Technology Stack
| Layer | Recommended Technology | Rationale |
| :--- | :--- | :--- |
| **Framework** | **Vite + React 18 (TypeScript)** | Blazing fast build time, minimal footprint, 100% static output for GitHub Pages. |
| **State Management** | **Zustand + TanStack Query v5** | Lightweight global state for UI/active filters + async query handling for API metadata fetching with built-in caching. |
| **Persistence Layer** | **Dexie.js (IndexedDB)** | Robust client-side database with reactive live queries; handles large datasets and offline persistence effortlessly compared to 5MB LocalStorage limits. |
| **Styling & System** | **Tailwind CSS / Vanilla CSS Variables** | Utility-first CSS + CSS custom properties for sleek, distraction-free dark/light mode and mobile-first responsiveness. |
| **PWA & Offline** | **`vite-plugin-pwa` + Workbox** | Provides Service Worker offline caching, manifest file, and native-feeling app installation on iOS/Android. |
| **Iconography & UI Components** | **Lucide Icons + Radix Primitives** | Unstyled, accessible primitives ensuring zero UI bloat while retaining high visual quality. |

### 1.2 System Architecture Diagram
```
┌────────────────────────────────────────────────────────────────────────────────┐
│                         GitHub Pages Client Application                        │
│                                                                                │
│  ┌────────────────────┐  ┌────────────────────┐  ┌──────────────────────────┐  │
│  │   UI & Navigation  │  │  PWA / Service     │  │  Backup & Export/Import  │  │
│  │  (Mobile-First UI) │  │  Worker (Workbox)  │  │   (JSON Export Engine)   │  │
│  └─────────┬──────────┘  └─────────┬──────────┘  └────────────┬─────────────┘  │
│            │                       │                          │                │
│            ▼                       ▼                          ▼                │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                    Zustand Application State Store                       │  │
│  └───────┬─────────────────────────┬──────────────────────────┬─────────────┘  │
│          │                         │                          │                │
│          ▼                         ▼                          ▼                │
│  ┌──────────────┐          ┌──────────────┐          ┌──────────────────┐      │
│  │   ICPC CP    │          │  University  │          │   Modified SM-2  │      │
│  │ Tracker Mod  │          │ Academic Mod │          │    SRS Engine    │      │
│  └───────┬──────┘          └───────┬──────┘          └────────┬─────────┘      │
│          │                         │                          │                │
│          ▼                         └───────────┬──────────────┘                │
│  ┌──────────────────────────────┐              │                               │
│  │ Metadata Resolver & Fetcher  │              │                               │
│  │ (CF API, Kenkoooo, Proxy)    │              │                               │
│  └──────────────┬───────────────┘              │                               │
│                 │                              │                               │
│                 ▼                              ▼                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                       Dexie.js (IndexedDB Engine)                        │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Data Models & Schema Definition

Below are the strictly typed TypeScript interfaces defining the database schema for Dexie.js / IndexedDB.

```typescript
// Core SRS Metrics embedded in trackable items
export interface SRSMetrics {
  repetitionCount: number;      // Number of consecutive successful reviews (n)
  interval: number;             // Current review interval in days (I)
  easinessFactor: number;       // SM-2 Easiness Factor (EF, default 2.5, min 1.3)
  dueDate: string;              // ISO string representation (YYYY-MM-DD) of target review date
  lastReviewedAt: string | null;// ISO timestamp of last review execution
  consecutiveFailures: number;  // Leech detection counter
  isLeech: boolean;             // Flagged if consecutiveFailures >= threshold (e.g. 4)
}

// Review Log for historical analytics & statistics
export interface ReviewLog {
  id: string;                   // UUID v4
  itemId: string;               // Reference to ProblemItem.id or CourseTopicItem.id
  itemType: 'cp_problem' | 'academic_topic';
  rating: 0 | 1 | 2 | 3 | 4 | 5; // Raw rating score or mapped from binary
  binaryResult: 'knew' | 'forgot';
  reviewedAt: string;           // ISO Timestamp
  intervalBefore: number;
  intervalAfter: number;
  easinessFactorBefore: number;
  easinessFactorAfter: number;
}

// Module 1: ICPC & Competitive Programming Problem Schema
export type CPPlatform = 'codeforces' | 'atcoder' | 'usaco' | 'cses' | 'custom';

export interface ProblemItem {
  id: string;                   // Internal Unique ID
  url: string;                  // Original problem URL
  platform: CPPlatform;         // Detected target platform
  problemId: string;            // e.g. "158A", "abc240_c", "usaco-1021", "cses-1640"
  title: string;                // Extracted problem title
  difficulty: number | string;  // e.g., CF rating 1400, AtCoder Diff 1200, USACO "Gold"
  platformTags: string[];       // Tags fetched from platform (e.g., "dp", "greedy")
  userTags: string[];           // Custom user-defined tags (e.g., "weak-on-tree", "mock-contest")
  category: string;             // Custom folder/category organization
  notes: string;                // Solution hints / editorial notes / code snippets
  srs: SRSMetrics;              // SRS state parameters
  createdAt: string;            // ISO Timestamp
  updatedAt: string;            // ISO Timestamp
}

// Module 2: University Academics & Subject Schema
export interface CourseTopicItem {
  id: string;                   // Internal Unique ID
  courseId: string;             // e.g., "CS-301"
  courseName: string;           // e.g., "Operating Systems"
  topicName: string;            // e.g., "Virtual Memory & Paging"
  subtopicName?: string;        // e.g., "TLB Hit Ratio & Page Replacement"
  initialMastery: number;       // Self-assessed starting mastery level (1 to 5)
  currentMastery: number;       // Dynamic or current mastery rating (1 to 5)
  courseWeight: number;         // Priority weight factor (1.0 = standard, 2.0 = high priority exam)
  examDate?: string | null;     // ISO Date for exam deadline (for dynamic priority calculation)
  notes: string;                // Formulae, key summaries, or reference links
  srs: SRSMetrics;              // SRS state parameters
  createdAt: string;            // ISO Timestamp
  updatedAt: string;            // ISO Timestamp
}

// Global Application Settings & Customization
export interface UserSettings {
  theme: 'dark' | 'light' | 'system';
  dailyReviewLimit: number;     // Maximum reviews per day (default: 50)
  sm2Defaults: {
    initialEF: number;          // 2.5
    minEF: number;              // 1.3
    easyBonus: number;          // 1.3
  };
  leechThreshold: number;       // Default: 4 failures
  enableAudioEffects: boolean;  // Soft feedback sound toggle
  customCORSProxy: string;      // Custom proxy URL fallback
}

// Unified Backup Schema (JSON Import/Export)
export interface DatabaseBackup {
  version: number;              // Schema version (e.g., 1)
  exportedAt: string;           // ISO Timestamp
  problems: ProblemItem[];
  academicTopics: CourseTopicItem[];
  reviewLogs: ReviewLog[];
  settings: UserSettings;
}
```

---

## 3. SRS & Priority Queue Mathematical Engine

### 3.1 Modified SM-2 Algorithm (Anki Variant)

The standard SuperMemo 2 (SM-2) algorithm calculates the review interval ($I$) and Easiness Factor ($EF$) based on historical performance ratings from $0$ to $5$. 

#### Rating Mapping Matrix
To support both simplified **"Knew it / Didn't know it"** binary inputs and full 4-button ratings, ratings are mapped as follows:

| Interface Input | Grade ($q$) | Description | SM-2 Classification |
| :--- | :--- | :--- | :--- |
| **Didn't Know It** | `q = 1` | Complete failure / incorrect recall | **Failure** ($q < 3$) |
| **Knew It (Hard)** | `q = 3` | Correct response after significant hesitation | **Success** ($q \ge 3$) |
| **Knew It (Good)** | `q = 4` | Correct response with brief reflection (Default "Knew It") | **Success** ($q \ge 3$) |
| **Knew It (Easy)** | `q = 5` | Instantaneous, perfect recall | **Success** ($q \ge 3$) |

#### Algorithm Step-by-Step Computation

1. **Easiness Factor Update Formula:**
   $$EF' = \max\left(1.3,\; EF + \left(0.1 - (5 - q) \cdot (0.08 + (5 - q) \cdot 0.02)\right)\right)$$

2. **Repetition Count ($n$) & Interval Calculation ($I$ in days):**
   - If Grade $q < 3$ (**Failure / "Didn't know it"**):
     $$n' = 0$$
     $$I' = 1 \text{ day}$$
     $$\text{consecutiveFailures}' = \text{consecutiveFailures} + 1$$
   - If Grade $q \ge 3$ (**Success / "Knew it"**):
     $$n' = n + 1$$
     $$\text{consecutiveFailures}' = 0$$
     - Interval determination ($I'$):
       $$I' = \begin{cases} 
       1 & \text{if } n' = 1 \\
       6 & \text{if } n' = 2 \\
       \lceil I \cdot EF' \rceil & \text{if } n' > 2 
       \end{cases}$$

3. **Due Date Calculation:**
   $$\text{dueDate}' = \text{CurrentDate} + I' \text{ days}$$

---

### 3.2 University Priority Queue Engine

For university courses, review scheduling combines the standard SM-2 intervals with a **Dynamic Priority Score** ($P$). This ensures subjects with low self-assessed mastery or imminent exam dates are surfaced at the top of daily study queues.

#### Dynamic Priority Score Formula
$$P = W_{\text{course}} \cdot \left(6 - \text{Mastery}\right) \cdot \left(1 + \frac{\max(0, \text{DaysOverdue})}{3}\right) \cdot E_{\text{factor}}$$

Where:
- $W_{\text{course}}$: Course priority weight ($1.0 \le W \le 3.0$, default $1.0$).
- $\text{Mastery}$: Current mastery rating ($1 \le \text{Mastery} \le 5$).
- $\text{DaysOverdue}$: $\max(0, \text{CurrentDate} - \text{DueDate})$.
- $E_{\text{factor}}$: Exam urgency multiplier.
  $$E_{\text{factor}} = \begin{cases} 
  1.0 & \text{if no exam scheduled} \\
  1.0 + \frac{14}{\max(1, \text{DaysUntilExam})} & \text{if exam is within 14 days} 
  \end{cases}$$

#### Queue Sorting Priority Order
Daily study recommendations are ordered by:
1. **Urgency Rank:** Items where $\text{DueDate} \le \text{Today}$, sorted descending by Priority Score ($P$).
2. **Backlog Capacity:** High-priority unmastered topics ($\text{Mastery} \le 2$).

---

## 4. Third-Party Platform Metadata Retrieval Strategies

Because the web app operates **100% client-side without a custom backend server**, fetching metadata from competitive programming platforms requires zero-CORS strategies, official public APIs, and fallback proxies.

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                             Platform Metadata Pipeline                          │
│                                                                                │
│                     Input Problem URL pasted by user                           │
│                                   │                                            │
│                                   ▼                                            │
│                      URL Pattern Router & Matcher                              │
│                                   │                                            │
│       ┌───────────────────┬───────┴───────────┬──────────────────┐             │
│       ▼                   ▼                   ▼                  ▼             │
│  [Codeforces]        [AtCoder]             [CSES]             [USACO]          │
│  Official API      Kenkoooo API /       CORS Proxy /        Static DB /        │
│  (CORS Enabled)    CORS Proxy           Static Index       Client Scraper      │
│       │                   │                   │                  │             │
│       └───────────────────┴───────┬───────────┴──────────────────┘             │
│                                   │                                            │
│                                   ▼                                            │
│                     Unified Metadata Standardizer                              │
│                     { title, difficulty, tags }                                │
│                                   │                                            │
│                                   ▼                                            │
│                   Dexie.js Storage & Offline Cache                             │
└────────────────────────────────────────────────────────────────────────────────┘
```

### 4.1 Platform Integration Details

#### 1. Codeforces (`codeforces.com`)
- **API Endpoint:** `https://codeforces.com/api/problemset.problems`
- **Method:** Standard CORS-enabled client `fetch`.
- **Extraction Logic:**
  - URL pattern: `https://codeforces.com/contest/{contestId}/problem/{index}` or `https://codeforces.com/problemset/problem/{contestId}/{index}`
  - Extract `contestId` (e.g. `158`) and `index` (e.g. `A`).
  - Search cached problemset JSON for matching problem.
- **Fields Extracted:** Title, rating (difficulty), and tags.

#### 2. AtCoder (`atcoder.jp`)
- **API Endpoints:**
  - Problems: `https://kenkoooo.com/atcoder/resources/problems.json`
  - Difficulty Models: `https://kenkoooo.com/atcoder/resources/problem-models.json`
- **Method:** `fetch` from Kenkoooo's CORS-friendly open API.
- **Extraction Logic:**
  - URL pattern: `https://atcoder.jp/contests/{contestId}/tasks/{problemId}`
  - Match `problemId` (e.g. `abc240_c`) against `problems.json` for title and `problem-models.json` for difficulty rating.

#### 3. CSES (`cses.fi`)
- **Method:** Client-side CORS Proxy (`https://api.allorigins.win/raw?url=...`) OR lightweight embedded static dictionary mapping common CSES problem IDs (e.g. `1640` $\rightarrow$ "Sum of Two Values").
- **Fallback Logic:**
  - URL pattern: `https://cses.fi/problemset/task/{id}`
  - Fetch HTML through CORS proxy, parse `<title>` and main content header DOM nodes using standard DOMParser.

#### 4. USACO (`usaco.org`)
- **Method:** Embedded JSON catalog of historical USACO problems (Division, Year, Month, Title) + CORS Proxy fallback.
- **Extraction Logic:**
  - URL pattern: `http://usaco.org/index.php?page=viewproblem2&cpid={cpid}`
  - Look up `cpid` in local lookup table or scrape title from HTML via CORS proxy.

---

## 5. Detailed Implementation Roadmap & Checklist

---

### Phase 1: Core Architecture, Database & Data Layer
> **Goal:** Set up Vite + React + TypeScript environment, Dexie.js persistence database, and global Zustand stores.

- [x] **Task 1.1: Project Initialization**
  - [x] Initialize Vite project with React and TypeScript (`npx create-vite@latest ./ --template react-ts`).
  - [x] Configure `vite.config.ts`, Tailwind CSS, and aliases (`@/components`, `@/lib`, `@/services`).
- [x] **Task 1.2: Database Layer with Dexie.js**
  - [x] Create `db.ts` file defining IndexedDB schema and tables (`problems`, `academicTopics`, `reviewLogs`, `settings`).
  - [x] Implement CRUD database utility functions with Dexie live query hooks (`useLiveQuery`).
- [x] **Task 1.3: Data Backup & Restore Engine**
  - [x] Create `backupService.ts` for full JSON export (schema validation with Zod).
  - [x] Create import service with safety validation, conflict resolution, and data migration support.
- [x] **Task 1.4: Global State Store (Zustand)**
  - [x] Define `useAppStore` for active filters, selected categories, theme toggles, and UI modal states.

---

### Phase 2: SRS Math Engine & Priority Scheduler
> **Goal:** Build unit-tested mathematical algorithms for SM-2 review scheduling and university subject priority queue calculations.

- [x] **Task 2.1: SM-2 Algorithm Implementation**
  - [x] Write `sm2.ts` library function taking current `SRSMetrics` + rating ($0..5$) and returning new `SRSMetrics`.
  - [x] Handle binary input mapping ("Knew it" $\rightarrow q=4$, "Didn't know it" $\rightarrow q=1$).
  - [x] Implement Leech Detection logic (flag item if `consecutiveFailures >= threshold`).
- [x] **Task 2.2: University Priority Scheduler**
  - [x] Write `priorityScheduler.ts` implementing the dynamic priority formula ($P$).
  - [x] Create unit tests covering overdue calculation, exam proximity weighting, and mastery adjustments.
- [x] **Task 2.3: Unit Test Suite**
  - [x] Set up Vitest for automated testing of `sm2.ts`, `priorityScheduler.ts`, and backup parsers.

---

### Phase 3: Module 1 — Competitive Programming / ICPC Tracker
> **Goal:** Enable URL parsing, automatic metadata extraction, custom tagging, and SRS review flow for CP problems.

- [x] **Task 3.1: URL Parser & Router**
  - [x] Create `urlParser.ts` to detect platform (Codeforces, AtCoder, USACO, CSES) and extract problem identifiers.
- [x] **Task 3.2: Metadata Fetchers & API Integrations**
  - [x] Implement `codeforcesFetcher.ts` with local caching of problemset JSON.
  - [x] Implement `atcoderFetcher.ts` targeting Kenkoooo API endpoints.
  - [x] Implement `csesFetcher.ts` & `usacoFetcher.ts` with CORS proxy and lookup tables.
- [x] **Task 3.3: Problem Management Interface**
  - [x] Build "Add Problem" modal with URL paste listener and auto-filling metadata preview.
  - [x] Build multi-tag selector, category dropdown, and notes editor.
  - [x] Build Problem Filter & Search bar (by platform, difficulty range, tag, due status).

---

### Phase 4: Module 2 — University Academics & Subject Tracker
> **Goal:** Create subject and topic management with initial self-assessed mastery, priority queue sorting, and SRS reviews.

- [x] **Task 4.1: Course & Topic Schema UI**
  - [x] Build "Add Course/Topic" form with inputs: Course Code/Name, Topic, Subtopic, Initial Mastery (1-5 scale star rating), Course Weight, and optional Exam Date.
- [x] **Task 4.2: Dynamic Priority Queue Dashboard View**
  - [x] Implement sorted list view powered by `priorityScheduler.ts`.
  - [x] Visual indicators for mastery level, overdue status, and upcoming exam urgency.
- [x] **Task 4.3: Quick Mastery Adjuster**
  - [x] Allow manual adjustments to mastery level (1-5) triggering instant SRS interval recalculation.

---

### Phase 5: Minimalist UI, Visual Dashboard & Review Flow
> **Goal:** Design a modern, distraction-free, ultra-fast mobile-first interface featuring an interactive review flashcard interface and visual analytics.

- [x] **Task 5.1: Review Execution Flow ("Anki Mode")**
  - [x] Mobile-optimized review card interface: Problem / Topic display $\rightarrow$ "Show Notes/Solution" toggle $\rightarrow$ "Didn't Know It" vs. "Knew It" action buttons.
  - [x] Keyboard shortcut listeners (`Space` = reveal, `1` = Fail, `2`/`Enter` = Pass).
- [x] **Task 5.2: Analytics & Visual Dashboard**
  - [x] Daily Due Counter & Review Forecast (Next 7 days due bar chart using Recharts / Lightweight SVG).
  - [x] GitHub-style Review Heatmap showing daily study activity.
  - [x] Distribution breakdown by platform and mastery levels.
- [x] **Task 5.3: Minimalist Design System & Dark Mode**
  - [x] Clean dark/light theme implementation with zero layout shift.
  - [x] Mobile navigation tab bar (Dashboard, CP Problems, University, Reviews, Settings).

---

### Phase 6: PWA Support, Optimization & Deployment
> **Goal:** Make the web app fully installable, offline-ready, and deployable to GitHub Pages.

- [x] **Task 6.1: Progressive Web App Configuration**
  - [x] Configure `vite-plugin-pwa` with service worker caching for standard static assets and APIs.
  - [x] Add `manifest.json` icons, theme color, and offline fallback shell.
- [x] **Task 6.2: GitHub Pages CI/CD Workflow**
  - [x] Create `.github/workflows/deploy.yml` for automated build and GitHub Pages deployment on push to `main`.
  - [x] Ensure correct base path configuration in `vite.config.ts` (`base: './'`).
- [x] **Task 6.3: Final Verification & Smoke Testing**
  - [x] Test JSON export and import across different browser instances.
  - [x] Verify complete offline functionality with network disconnected.

---

## 6. Architectural Optimizations & Advanced Proposals

### 6.1 Data Integrity & Backup Reliability
- **Automatic Auto-Export Schedule:** Trigger a background JSON download or copy prompt every 7 days or after completing > 20 reviews to prevent accidental browser cache clearing data loss.
- **Web Locks API Integration:** Prevent database write conflicts when opening the app across multiple browser tabs simultaneously using `navigator.locks`.

### 6.2 Leech Management Strategy
- Automatically flag items with $\ge 4$ consecutive failures as **"Leeches"**.
- Display a dedicated "Leech Banner" allowing users to restructure their study notes or break down complex problem topics into smaller subtopics.

### 6.3 Performance & Offline Optimizations
- **Static Metadata Pre-Bundling:** Pre-pack lightweight compressed JSON files containing CSES task titles and USACO problem mappings directly into the app bundle to guarantee 100% offline metadata availability without CORS dependency.
- **Virtualization for Long Lists:** Use `@tanstack/react-virtual` for rendering problem and topic lists exceeding 1,000 items on mobile browsers without dropping frames.
