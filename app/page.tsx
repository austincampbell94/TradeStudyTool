"use client";

import React, { useState, useRef } from "react";
import { TradeStudyMeta, Candidate, ScreeningCriterion, TradeCriterion } from "../types/trade";
import MetadataSection from "../components/MetadataSection";
import ListManager from "../components/ListManager";
import ScreeningGrid from "../components/ScreeningGrid";
import ScoringMatrix from "../components/ScoringMatrix";
import DashboardView from "../components/DashboardView";

// Default template state based on the user's Comms Relay example
const initialMeta: TradeStudyMeta = {
  project: "Comms Relay Options",
  sponsor: "Example Project Office",
  lead: "Jane Doe",
  date: "2026-05-15",
  version: "1.0",
};

const initialCandidates: Candidate[] = [
  { id: "C-1", name: "Vendor A Relay", desc: "Mature product, higher cost" },
  { id: "C-2", name: "Vendor B Relay", desc: "Lower cost, emerging product" },
  { id: "C-3", name: "In-house Dev", desc: "Custom build, longer lead time" },
];

const initialScreening: ScreeningCriterion[] = [
  { id: "SC-1", name: "Meets MIL-STD baseline", desc: "Basic environmental spec", required: "Y" },
  { id: "SC-2", name: "Bandwidth >= 10 Mbps", desc: "Throughput requirement", required: "Y" },
  { id: "SC-3", name: "Delivery within 12 months", desc: "Schedule constraint", required: "Y" },
];

const initialTradeCriteria: TradeCriterion[] = [
  { id: "TC-1", name: "Performance", desc: "Throughput, latency, etc.", weight: 40 },
  { id: "TC-2", name: "Cost", desc: "Lifecycle cost class", weight: 30 },
  { id: "TC-3", name: "Schedule / Maturity", desc: "Time to field & system confidence", weight: 30 },
];

const initialScores: Record<string, Record<string, number>> = {
  "C-1": { "TC-1": 4, "TC-2": 2, "TC-3": 4 },
  "C-2": { "TC-1": 3, "TC-2": 4, "TC-3": 3 },
  "C-3": { "TC-1": 2, "TC-2": 1, "TC-3": 1 },
};

const initialScreeningScores: Record<string, Record<string, "Pass" | "Fail">> = {
  "C-1": { "SC-1": "Pass", "SC-2": "Pass", "SC-3": "Pass" },
  "C-2": { "SC-1": "Pass", "SC-2": "Pass", "SC-3": "Fail" }, // Fails SC-3 -> Excluded
  "C-3": { "SC-1": "Fail", "SC-2": "Pass", "SC-3": "Pass" }, // Fails SC-1 -> Excluded
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<"setup" | "scoring" | "dashboard">("dashboard");
  const [meta, setMeta] = useState<TradeStudyMeta>(initialMeta);
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [screening, setScreening] = useState<ScreeningCriterion[]>(initialScreening);
  const [tradeCriteria, setTradeCriteria] = useState<TradeCriterion[]>(initialTradeCriteria);
  const [scores, setScores] = useState<Record<string, Record<string, number>>>(initialScores);
  const [screeningScores, setScreeningScores] = useState<Record<string, Record<string, "Pass" | "Fail">>>(initialScreeningScores);
  const [recommendation, setRecommendation] = useState<string>("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate weight sum
  const weightSum = tradeCriteria.reduce((sum, tc) => sum + tc.weight, 0);
  const isWeightValid = Math.abs(weightSum - 100) < 0.05;

  // JSON Import handler
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        
        // Basic validations
        if (!data.meta || !data.candidates || !data.screening || !data.tradeCriteria) {
          alert("Invalid trade study file structure. Required fields missing.");
          return;
        }

        setMeta({
          project: data.meta.project || "",
          sponsor: data.meta.sponsor || "",
          lead: data.meta.lead || "",
          date: data.meta.date || "",
          version: data.meta.version || "1.0",
        });
        setCandidates(data.candidates);
        setScreening(data.screening);
        setTradeCriteria(data.tradeCriteria);
        setScores(data.scores || {});
        setScreeningScores(data.screeningScores || {});
        setRecommendation(data.recommendation || "");
        setActiveTab("dashboard");
      } catch {
        alert("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
  };

  // Export JSON
  const handleExportJson = () => {
    const data = {
      meta,
      candidates,
      screening,
      tradeCriteria,
      scores,
      screeningScores,
      recommendation,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${meta.project.toLowerCase().replace(/\s+/g, "-")}-study.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export CSV
  const handleExportCsv = () => {
    const rows = [
      ["Metadata - Project", meta.project],
      ["Metadata - Sponsor", meta.sponsor],
      ["Metadata - Lead Analyst", meta.lead],
      ["Metadata - Date", meta.date],
      ["Metadata - Version", meta.version],
      [],
      ["Candidate Scoring Details"],
      ["Candidate ID", "Candidate Name", "Criterion ID", "Criterion Name", "Weight %", "Raw Score (0-5)", "Weighted Score"],
    ];

    candidates.forEach((cand) => {
      tradeCriteria.forEach((tc) => {
        const rawScore = (scores[cand.id] && scores[cand.id][tc.id] !== undefined) ? scores[cand.id][tc.id] : 3.0;
        const weightedScore = (rawScore / 5) * (tc.weight / 100);
        rows.push([
          cand.id,
          cand.name,
          tc.id,
          tc.name,
          `${tc.weight}%`,
          rawScore.toString(),
          weightedScore.toFixed(3),
        ]);
      });
    });

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const a = document.createElement("a");
    a.href = encodedUri;
    a.download = `${meta.project.toLowerCase().replace(/\s+/g, "-")}-study.csv`;
    a.click();
  };

  // Export Markdown (Aligned with user's trade-study-template.md)
  const handleExportMarkdown = () => {
    // Determine overall screening result per candidate
    const getOverallScreening = (candId: string) => {
      const candScores = screeningScores[candId] || {};
      for (const sc of screening) {
        if (sc.required === "Y") {
          const val = candScores[sc.id] || "Pass";
          if (val === "Fail") return "Fail";
        }
      }
      return "Pass";
    };

    // Calculate total score per candidate
    const getScoringTotal = (candId: string) => {
      let total = 0;
      const candScores = scores[candId] || {};
      tradeCriteria.forEach((tc) => {
        const score = candScores[tc.id] !== undefined ? candScores[tc.id] : 3.0;
        total += (score / 5) * (tc.weight / 100);
      });
      return total;
    };

    const md = `---
title: "Trade Study — ${meta.project}"
author: "${meta.lead}"
date: "${meta.date}"
version: ${meta.version}
---

# Trade Study: ${meta.project}

## Metadata
- Sponsor / Project: ${meta.sponsor || "N/A"}
- Study Lead: ${meta.lead || "N/A"}
- Date Conducted: ${meta.date || "N/A"}
- Version: ${meta.version}

## Screening Criteria
| ID | Screening Criterion | Description | Required? (Y/N) |
|---:|---|---|:---:|
${screening.map((sc) => `| ${sc.id} | ${sc.name} | ${sc.desc || "N/A"} | ${sc.required} |`).join("\n")}

## Trade Candidates
| ID | Candidate | Short Description |
|---:|---|---|
${candidates.map((c) => `| ${c.id} | ${c.name} | ${c.desc || "N/A"} |`).join("\n")}

## Trade Criteria (scored)
| ID | Criterion | Description | Weight (%) |
|---:|---|---|---:|
${tradeCriteria.map((tc) => `| ${tc.id} | ${tc.name} | ${tc.desc || "N/A"} | ${tc.weight}% |`).join("\n")}

## Screening Results
| Candidate | ${screening.map((sc) => sc.id).join(" | ")} | Overall Status |
|---:|${screening.map(() => ":---:").join("|")}|:---:|
${candidates
  .map((cand) => {
    const scList = screening.map((sc) => (screeningScores[cand.id]?.[sc.id] || "Pass"));
    const status = getOverallScreening(cand.id) === "Fail" ? "Fail" : "Pass";
    return `| ${cand.name} | ${scList.join(" | ")} | ${status.toUpperCase()} |`;
  })
  .join("\n")}

## Scoring Matrix
| Candidate | ${tradeCriteria.map((tc) => `${tc.id} (${tc.weight}%) | Raw Score | Weighted`).join(" | ")} | Total Weighted Score (0-1) |
|---:|${tradeCriteria.map(() => "---:|---:|---:").join("|")}|---:|
${candidates
  .map((cand) => {
    const isFailed = getOverallScreening(cand.id) === "Fail";
    if (isFailed) {
      return `| ${cand.name} | *Excluded from trade study scoring due to screening failure* | | | | | | |`;
    }
    const rowList = tradeCriteria.map((tc) => {
      const raw = (scores[cand.id]?.[tc.id] !== undefined) ? scores[cand.id][tc.id] : 3.0;
      const wScore = (raw / 5) * (tc.weight / 100);
      return `${tc.weight}% | ${raw.toFixed(1)} | ${wScore.toFixed(3)}`;
    });
    const total = getScoringTotal(cand.id);
    return `| ${cand.name} | ${rowList.join(" | ")} | **${total.toFixed(3)}** |`;
  })
  .join("\n")}

## Recommendation & Decision
${recommendation || "No recommendation documented."}
`;

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${meta.project.toLowerCase().replace(/\s+/g, "-")}-study.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="app-container">
      {/* App Header */}
      <header className="app-header">
        <div className="logo-section">
          <span>⚖️</span>
          <span>
            TradeStudy<span className="logo-text-highlight">Tool</span>
          </span>
        </div>

        {/* Tab Switcher Navigation */}
        <div className="nav-links">
          <button
            onClick={() => setActiveTab("setup")}
            className={`nav-btn ${activeTab === "setup" ? "active" : ""}`}
          >
            Step 1: Setup
          </button>
          <button
            onClick={() => setActiveTab("scoring")}
            className={`nav-btn ${activeTab === "scoring" ? "active" : ""}`}
          >
            Step 2: Scoring Grid
          </button>
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`nav-btn ${activeTab === "dashboard" ? "active" : ""}`}
          >
            Step 3: Dashboard
            {!isWeightValid && (
              <span
                style={{
                  marginLeft: "0.5rem",
                  fontSize: "0.75rem",
                  color: "var(--accent-yellow)",
                  fontWeight: "bold",
                }}
              >
                ⚠️
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Quick Action Dashboard Toolbar */}
      <div
        className="glass-panel animate-fade-in"
        style={{
          padding: "1rem 1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.1rem", fontWeight: 700 }}>{meta.project || "Unnamed Study"}</h1>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Lead: {meta.lead || "N/A"} | Date: {meta.date || "N/A"} | Version: {meta.version}
            </p>
          </div>
          {!isWeightValid && (
            <div
              style={{
                background: "rgba(245, 158, 11, 0.1)",
                color: "var(--accent-yellow)",
                padding: "0.25rem 0.5rem",
                borderRadius: "4px",
                fontSize: "0.75rem",
                fontWeight: "bold",
              }}
            >
              Weights sum to {weightSum}% (must be 100%)
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {/* Hidden File Input */}
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleImportJson}
            style={{ display: "none" }}
          />
          <button onClick={() => fileInputRef.current?.click()} className="btn-secondary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
            📥 Import JSON
          </button>
          
          <button onClick={handleExportJson} className="btn-secondary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
            💾 Export JSON
          </button>
          
          <button onClick={handleExportCsv} className="btn-secondary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
            📊 Export CSV
          </button>

          <button onClick={handleExportMarkdown} className="btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
            📝 Export Markdown
          </button>
        </div>
      </div>

      {/* Main Tab Panels */}
      {activeTab === "setup" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <MetadataSection meta={meta} onChange={setMeta} />
          
          <ListManager
            type="candidates"
            title="Candidates (3 to 10)"
            subtitle="The options, designs, systems, or providers being evaluated."
            items={candidates}
            onUpdate={setCandidates}
          />
          
          <ListManager
            type="screening"
            title="Screening Criteria (3 to 10)"
            subtitle="Mandatory filters (Pass/Fail) applied to exclude unqualified options early."
            items={screening}
            onUpdate={setScreening}
          />
          
          <ListManager
            type="tradeCriteria"
            title="Trade Criteria (3 to 10)"
            subtitle="Scored criteria with weights summing to 100%. Adjust weights here or on Step 3."
            items={tradeCriteria}
            onUpdate={setTradeCriteria}
          />
        </div>
      )}

      {activeTab === "scoring" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <ScreeningGrid
            candidates={candidates}
            screening={screening}
            screeningScores={screeningScores}
            onChange={setScreeningScores}
          />
          
          <ScoringMatrix
            candidates={candidates}
            tradeCriteria={tradeCriteria}
            scores={scores}
            screeningScores={screeningScores}
            screening={screening}
            onChange={setScores}
          />
        </div>
      )}

      {activeTab === "dashboard" && (
        <DashboardView
          candidates={candidates}
          tradeCriteria={tradeCriteria}
          scores={scores}
          screeningScores={screeningScores}
          screening={screening}
          recommendation={recommendation}
          onRecommendationChange={setRecommendation}
          onWeightsChange={setTradeCriteria}
        />
      )}
    </main>
  );
}
