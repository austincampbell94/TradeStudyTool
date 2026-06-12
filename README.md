# Trade Study Tool (Next.js Application)

A modern, responsive web application designed to help analysts, project managers, and engineers perform systematic trade-off studies. Built using **Next.js (App Router)**, **TypeScript**, and **Vanilla CSS** with a premium dark-themed glassmorphism aesthetic.

---

## 🌟 Core Features

- **Setup Workspace (Step 1)**: Configure project metadata (Sponsor, Lead, Date, Version) and dynamically manage lists of Candidates, Screening Criteria, and Weighted Criteria (enforcing bounds of 3 to 10 items).
- **Evaluation Matrices (Step 2)**:
  - **Screening Matrix**: Toggle Pass/Fail parameters. If a candidate fails any *required* screening criterion, they are instantly flagged as `EXCLUDED`.
  - **Scoring Matrix**: Evaluate candidates against weighted criteria on a 0–5 scale (with real-time computation of raw and weighted scores). Includes a hoverable guide/tooltip describing the scoring equations.
- **Inline Results & Rankings**:
  - **Animated Rankings**: Real-time progress bars sorting candidates by overall score. Excluded candidates are isolated in a separate diagnostics section.
  - **Editable Decision Summary**: Auto-generates a text summary based on results, which can be custom-edited inline.
- **🌓 Theme Switcher**: Switch between **Light**, **Dark**, and **System** themes using the toggle inside the sticky header.
- **Data Portability**:
  - **📥 Import JSON**: Reload previous trade studies from `.json` files.
  - **💾 Export JSON**: Backup and save your trade study data.
  - **📊 Export CSV**: Export raw and weighted scoring matrices for spreadsheet analysis.
  - **📝 Export Markdown**: Download a formatted, shareable report structure conforming to standard Microsoft/MITRE templates.

---

## 💾 Browser-Based Local Database

To enable persistent data storage without requiring a dedicated backend server, the application implements a fully functional client-side database using browser **`localStorage`**:

1. **Database Seeding**: On the initial visit, the database is automatically seeded with a sample trade study (**Comms Relay Options Demo**) so users can explore the tool's features immediately.
2. **Auto-Save Workspace**: The active workspace is continually synchronized to browser storage. If you refresh the page or return later, your active metadata, lists, raw scores, and evaluations are restored exactly where you left off.
3. **Saved Studies Registry**: 
   - You can save your current workspace under a custom name, creating an entry in the local database.
   - The **Study Database** dropdown in the database panel lists all stored entries. Selecting one loads its metadata, candidates, screening rules, weighted criteria, raw score grids, and recommendations.
   - User studies can be deleted from the database using the trash icon.
4. **Data Schema**: Saved studies are stored as a JSON array under the `"trade_studies"` key:
   - `id`: Unique string or timestamp
   - `name`: Human-readable project title
   - `timestamp`: Creation or modification ISO string
   - `data`: Complete study state object including `meta`, `candidates`, `screening`, `tradeCriteria`, `scores`, `screeningScores`, and `recommendation`.

---

## 📁 Project Structure

```text
├── app/
│   ├── favicon.ico    # Browser icon
│   ├── globals.css    # Global styling tokens, glassmorphism templates, background glow orbs
│   ├── layout.tsx     # App shell setting up background layouts & head metadata
│   └── page.tsx       # Main page controller handling state, sequential flow (Step 1 -> Step 2 -> Results), and file exports
├── components/
│   ├── ListManager.tsx      # Generic, type-safe list builder (Candidates / Criteria)
│   ├── MetadataSection.tsx  # Input controls for study metadata
│   ├── ScreeningGrid.tsx    # Interactive Pass/Fail evaluation grid
│   ├── ScoringMatrix.tsx    # detailed scoring grid (0-5 scale)
│   └── DashboardView.tsx   # Visual rankings and decision summary rationale
├── types/
│   └── trade.ts       # Shared TypeScript models and interface structures
├── package.json       # Dependencies (Next.js, React, TypeScript, ESLint)
└── tsconfig.json      # TypeScript configuration compiler rules
```

---

## 🛠️ Local Development Setup

To run the application locally on your computer:

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start the Development Server**:
   ```bash
   npm run dev
   ```

3. **Open the App**:
   Navigate to [http://localhost:3000](http://localhost:3000) in your web browser.

4. **Verify / Run Production Builds**:
   ```bash
   npm run build
   ```

---

## 🚀 Hosting & Deployment on Vercel

This repository is optimized for direct hosting on Vercel:
- **Automatic Builds**: Pushing updates to the `main` branch on GitHub triggers an automatic deployment build on Vercel.
- **Zero Config**: Vercel natively recognizes the Next.js App Router framework and configures serverless page routing and typescript compile steps automatically.
