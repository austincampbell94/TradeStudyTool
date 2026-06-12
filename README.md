# Trade Study Tool (Next.js Application)

A modern, responsive web application designed to help analysts, project managers, and engineers perform systematic trade-off studies. Built using **Next.js (App Router)**, **TypeScript**, and **Vanilla CSS** with a premium dark-themed glassmorphism aesthetic.

---

## 🌟 Core Features

- **Setup Workspace (Step 1)**: Configure project metadata (Sponsor, Lead, Date, Version) and dynamically manage lists of Candidates, Screening Criteria, and Trade Criteria (enforcing bounds of 3 to 10 items).
- **Evaluation Matrices (Step 2)**:
  - **Screening Matrix**: Toggle Pass/Fail parameters. If a candidate fails any *required* screening criterion, they are instantly flagged as `EXCLUDED`.
  - **Scoring Matrix**: Evaluate candidates against trade criteria on a 0–5 scale (with real-time computation of raw and weighted scores).
- **Interactive Dashboard (Step 3)**:
  - **Animated Rankings**: Real-time progress bars sorting candidates by overall score. Excluded candidates are isolated in a separate diagnostics section.
  - **Proportional Sensitivity Analysis**: Sliders to adjust criteria weights. Adjusting a slider automatically shifts other weights proportionally to maintain a total sum of exactly **100%**, instantly animating rank changes.
  - **Editable Decision Summary**: Auto-generates a text summary based on results, which can be custom-edited.
- **Data Portability**:
  - **📥 Import JSON**: Reload previous trade studies from `.json` files.
  - **💾 Export JSON**: Backup and save your trade study data.
  - **📊 Export CSV**: Export raw and weighted scoring matrices for spreadsheet analysis.
  - **📝 Export Markdown**: Download a formatted, shareable report structure conforming to standard Microsoft/MITRE templates.

---

## 📁 Project Structure

```text
├── app/
│   ├── favicon.ico    # Browser icon
│   ├── globals.css    # Global styling tokens, glassmorphism templates, background glow orbs
│   ├── layout.tsx     # App shell setting up background layouts & head metadata
│   └── page.tsx       # Main page controller handling state, tab navigation, and file exports
├── components/
│   ├── ListManager.tsx      # Generic, type-safe list builder (Candidates / Criteria)
│   ├── MetadataSection.tsx  # Input controls for study metadata
│   ├── ScreeningGrid.tsx    # Interactive Pass/Fail evaluation grid
│   ├── ScoringMatrix.tsx    # detailed scoring grid (0-5 scale)
│   └── DashboardView.tsx   # Visual rankings, sensitivity analysis, and rationale
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
