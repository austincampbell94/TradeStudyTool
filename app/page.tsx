"use client";

import React, { useState, useRef, useEffect } from "react";
import { TradeStudyMeta, Candidate, ScreeningCriterion, TradeCriterion } from "../types/trade";
import MetadataSection from "../components/MetadataSection";
import ListManager from "../components/ListManager";
import ScreeningGrid from "../components/ScreeningGrid";
import ScoringMatrix from "../components/ScoringMatrix";
import DashboardView from "../components/DashboardView";

// Interface for database studies
interface SavedStudy {
  id: string;
  name: string;
  data: {
    meta: TradeStudyMeta;
    candidates: Candidate[];
    screening: ScreeningCriterion[];
    tradeCriteria: TradeCriterion[];
    scores: Record<string, Record<string, number>>;
    screeningScores: Record<string, Record<string, "Pass" | "Fail">>;
    recommendation: string;
  };
  timestamp: string;
}

// Demo trade study template (seeded in browser database)
const DEMO_STUDY = {
  meta: {
    project: "Comms Relay Options",
    sponsor: "Example Project Office",
    lead: "Jane Doe",
    date: "2026-05-15",
    version: "1.0",
  },
  candidates: [
    { id: "C-1", name: "Vendor A Relay", desc: "Mature product, higher cost" },
    { id: "C-2", name: "Vendor B Relay", desc: "Lower cost, emerging product" },
    { id: "C-3", name: "In-house Dev", desc: "Custom build, longer lead time" },
  ],
  screening: [
    { id: "SC-1", name: "Meets MIL-STD baseline", desc: "Basic environmental spec", required: "Y" as const },
    { id: "SC-2", name: "Bandwidth >= 10 Mbps", desc: "Throughput requirement", required: "Y" as const },
    { id: "SC-3", name: "Delivery within 12 months", desc: "Schedule constraint", required: "Y" as const },
  ],
  tradeCriteria: [
    { id: "TC-1", name: "Performance", desc: "Throughput, latency, etc.", weight: 40 },
    { id: "TC-2", name: "Cost", desc: "Lifecycle cost class", weight: 30 },
    { id: "TC-3", name: "Schedule / Maturity", desc: "Time to field & system confidence", weight: 30 },
  ],
  scores: {
    "C-1": { "TC-1": 4, "TC-2": 2, "TC-3": 4 },
    "C-2": { "TC-1": 3, "TC-2": 4, "TC-3": 3 },
    "C-3": { "TC-1": 2, "TC-2": 1, "TC-3": 1 },
  },
  screeningScores: {
    "C-1": { "SC-1": "Pass" as const, "SC-2": "Pass" as const, "SC-3": "Pass" as const },
    "C-2": { "SC-1": "Pass" as const, "SC-2": "Pass" as const, "SC-3": "Fail" as const },
    "C-3": { "SC-1": "Fail" as const, "SC-2": "Pass" as const, "SC-3": "Pass" as const },
  },
  recommendation: "Based on the trade study criteria and weighting, Candidate **Vendor A Relay** is recommended with a total weighted score of **0.680** (68.0%).\n\nIt outperformed the runner-up, **Vendor B Relay** (score: 0.660), by a margin of 0.020.\n\nNote: Candidates In-house Dev was excluded from selection due to failing mandatory screening criteria."
};

// Default empty state for the user's workspace
const initialMeta: TradeStudyMeta = {
  project: "",
  sponsor: "",
  lead: "",
  date: "",
  version: "1.0",
};

const initialCandidates: Candidate[] = [
  { id: "C-1", name: "", desc: "" },
  { id: "C-2", name: "", desc: "" },
  { id: "C-3", name: "", desc: "" },
];

const initialScreening: ScreeningCriterion[] = [
  { id: "SC-1", name: "", desc: "", required: "Y" },
  { id: "SC-2", name: "", desc: "", required: "Y" },
  { id: "SC-3", name: "", desc: "", required: "Y" },
];

const initialTradeCriteria: TradeCriterion[] = [
  { id: "TC-1", name: "", desc: "", weight: 40 },
  { id: "TC-2", name: "", desc: "", weight: 30 },
  { id: "TC-3", name: "", desc: "", weight: 30 },
];

const initialScores: Record<string, Record<string, number>> = {};
const initialScreeningScores: Record<string, Record<string, "Pass" | "Fail">> = {};

export default function Home() {
  const [activeTab, setActiveTab] = useState<"setup" | "scoring" | "dashboard">("setup");
  const [meta, setMeta] = useState<TradeStudyMeta>(initialMeta);
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [screening, setScreening] = useState<ScreeningCriterion[]>(initialScreening);
  const [tradeCriteria, setTradeCriteria] = useState<TradeCriterion[]>(initialTradeCriteria);
  const [scores, setScores] = useState<Record<string, Record<string, number>>>(initialScores);
  const [screeningScores, setScreeningScores] = useState<Record<string, Record<string, "Pass" | "Fail">>>(initialScreeningScores);
  const [recommendation, setRecommendation] = useState<string>("");

  // Database States
  const [savedStudies, setSavedStudies] = useState<SavedStudy[]>([]);
  const [selectedStudyId, setSelectedStudyId] = useState<string>("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize browser localStorage database and load active workspace
  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem("trade_studies");
    let studiesList: SavedStudy[] = [];

    if (!stored) {
      studiesList = [
        {
          id: "demo",
          name: "Comms Relay Options (Demo)",
          data: DEMO_STUDY,
          timestamp: new Date().toISOString()
        }
      ];
      localStorage.setItem("trade_studies", JSON.stringify(studiesList));
    } else {
      try {
        studiesList = JSON.parse(stored);
      } catch {
        studiesList = [];
      }
    }

    // Wrap state updates in setTimeout to avoid synchronous setState inside useEffect warning
    setTimeout(() => {
      setSavedStudies(studiesList);

      // Load last session workspace if it exists
      const currentActive = localStorage.getItem("current_trade_study");
      if (currentActive) {
        try {
          const parsed = JSON.parse(currentActive);
          setMeta(parsed.meta || initialMeta);
          setCandidates(parsed.candidates || initialCandidates);
          setScreening(parsed.screening || initialScreening);
          setTradeCriteria(parsed.tradeCriteria || initialTradeCriteria);
          setScores(parsed.scores || {});
          setScreeningScores(parsed.screeningScores || {});
          setRecommendation(parsed.recommendation || "");
        } catch (e) {
          console.error("Failed to parse current active study", e);
        }
      }
    }, 0);
  }, []);

  // Auto-save active workspace state to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const activeData = {
      meta,
      candidates,
      screening,
      tradeCriteria,
      scores,
      screeningScores,
      recommendation
    };
    localStorage.setItem("current_trade_study", JSON.stringify(activeData));
  }, [meta, candidates, screening, tradeCriteria, scores, screeningScores, recommendation]);

  // Database functions
  const handleLoadStudy = (id: string) => {
    if (!id) return;
    
    if (id === "new") {
      if (confirm("Are you sure you want to start a new blank study? Unsaved changes to your current study may be lost.")) {
        setMeta(initialMeta);
        setCandidates(initialCandidates);
        setScreening(initialScreening);
        setTradeCriteria(initialTradeCriteria);
        setScores(initialScores);
        setScreeningScores(initialScreeningScores);
        setRecommendation("");
        setSelectedStudyId("");
      }
      return;
    }

    const study = savedStudies.find(s => s.id === id);
    if (!study) return;

    if (confirm(`Load study "${study.name}"? Unsaved changes to your current study may be lost.`)) {
      const d = study.data;
      setMeta(d.meta);
      setCandidates(d.candidates);
      setScreening(d.screening);
      setTradeCriteria(d.tradeCriteria);
      setScores(d.scores || {});
      setScreeningScores(d.screeningScores || {});
      setRecommendation(d.recommendation || "");
      setSelectedStudyId(id);
    }
  };

  const handleSaveStudyToDb = () => {
    const studyName = meta.project.trim() || prompt("Enter a name for this trade study:")?.trim();
    if (!studyName) {
      alert("Please enter a name to save your study.");
      return;
    }

    const newId = selectedStudyId && selectedStudyId !== "demo" ? selectedStudyId : `study-${Date.now()}`;
    const studyData = {
      meta,
      candidates,
      screening,
      tradeCriteria,
      scores,
      screeningScores,
      recommendation
    };

    const updatedStudies = savedStudies.filter(s => s.id !== newId);
    updatedStudies.push({
      id: newId,
      name: studyName,
      data: studyData,
      timestamp: new Date().toISOString()
    });

    localStorage.setItem("trade_studies", JSON.stringify(updatedStudies));
    setSavedStudies(updatedStudies);
    setSelectedStudyId(newId);
    
    if (!meta.project.trim()) {
      setMeta(prev => ({ ...prev, project: studyName }));
    }
    
    alert(`Study "${studyName}" successfully saved to local database!`);
  };

  const handleDeleteStudyFromDb = (id: string) => {
    if (id === "demo") return;
    const study = savedStudies.find(s => s.id === id);
    if (!study) return;

    if (confirm(`Are you sure you want to delete "${study.name}" from the database?`)) {
      const updatedStudies = savedStudies.filter(s => s.id !== id);
      localStorage.setItem("trade_studies", JSON.stringify(updatedStudies));
      setSavedStudies(updatedStudies);
      setSelectedStudyId("");
    }
  };

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
          weightedScore.toFixed(2),
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
      return `${tc.weight}% | ${raw.toFixed(1)} | ${wScore.toFixed(2)}`;
    });
    const total = getScoringTotal(cand.id);
    return `| ${cand.name} | ${rowList.join(" | ")} | **${total.toFixed(2)}** |`;
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

  // State adjustment helper functions to keep scores & screening results in sync

  // Candidates Handlers
  const handleAddCandidate = () => {
    const nextNum = candidates.length + 1;
    const newCand: Candidate = {
      id: `C-${nextNum}`,
      name: `Candidate ${nextNum}`,
      desc: "",
    };
    setCandidates([...candidates, newCand]);
    setScores(prev => ({
      ...prev,
      [newCand.id]: tradeCriteria.reduce((acc, tc) => ({ ...acc, [tc.id]: 3.0 }), {} as Record<string, number>)
    }));
    setScreeningScores(prev => ({
      ...prev,
      [newCand.id]: screening.reduce((acc, sc) => ({ ...acc, [sc.id]: "Pass" }), {} as Record<string, "Pass" | "Fail">)
    }));
  };

  const handleRemoveCandidate = (index: number) => {
    if (candidates.length <= 3) return;
    const newCands = [...candidates];
    newCands.splice(index, 1);

    // Re-index remaining candidates sequentially
    const updatedCands = newCands.map((c, idx) => ({
      ...c,
      id: `C-${idx + 1}`
    }));

    // Re-map scores & screeningScores
    const newScores: Record<string, Record<string, number>> = {};
    const newScreeningScores: Record<string, Record<string, "Pass" | "Fail">> = {};

    updatedCands.forEach((cand, idx) => {
      const oldId = idx < index ? `C-${idx + 1}` : `C-${idx + 2}`;
      if (scores[oldId]) {
        newScores[cand.id] = scores[oldId];
      }
      if (screeningScores[oldId]) {
        newScreeningScores[cand.id] = screeningScores[oldId];
      }
    });

    setCandidates(updatedCands);
    setScores(newScores);
    setScreeningScores(newScreeningScores);
  };

  const handleChangeCandidate = (index: number, key: string, value: string | number) => {
    const newCands = [...candidates];
    newCands[index] = {
      ...newCands[index],
      [key]: value as string,
    };
    setCandidates(newCands);
  };

  // Screening Criteria Handlers
  const handleAddScreening = () => {
    const nextNum = screening.length + 1;
    const newSc: ScreeningCriterion = {
      id: `SC-${nextNum}`,
      name: `Screening Criterion ${nextNum}`,
      desc: "",
      required: "Y",
    };
    setScreening([...screening, newSc]);
    setScreeningScores(prev => {
      const updated = { ...prev };
      candidates.forEach(cand => {
        if (!updated[cand.id]) updated[cand.id] = {};
        updated[cand.id] = {
          ...updated[cand.id],
          [newSc.id]: "Pass"
        };
      });
      return updated;
    });
  };

  const handleRemoveScreening = (index: number) => {
    if (screening.length <= 3) return;
    const newScreening = [...screening];
    newScreening.splice(index, 1);

    // Re-index remaining screening criteria
    const updatedScreening = newScreening.map((sc, idx) => ({
      ...sc,
      id: `SC-${idx + 1}`
    }));

    const newScreeningScores: Record<string, Record<string, "Pass" | "Fail">> = {};
    
    candidates.forEach(cand => {
      const candScores = screeningScores[cand.id] || {};
      const newCandScores: Record<string, "Pass" | "Fail"> = {};
      
      updatedScreening.forEach((sc, idx) => {
        const oldId = idx < index ? `SC-${idx + 1}` : `SC-${idx + 2}`;
        if (candScores[oldId] !== undefined) {
          newCandScores[sc.id] = candScores[oldId];
        }
      });
      newScreeningScores[cand.id] = newCandScores;
    });

    setScreening(updatedScreening);
    setScreeningScores(newScreeningScores);
  };

  const handleChangeScreening = (index: number, key: string, value: string | number) => {
    const newScreening = [...screening];
    newScreening[index] = {
      ...newScreening[index],
      [key]: value as "Y" | "N",
    };
    setScreening(newScreening);
  };

  // Trade Criteria Handlers
  const handleAddTradeCriterion = () => {
    const nextNum = tradeCriteria.length + 1;
    const newTc: TradeCriterion = {
      id: `TC-${nextNum}`,
      name: `Trade Criterion ${nextNum}`,
      desc: "",
      weight: 0,
    };
    setTradeCriteria([...tradeCriteria, newTc]);
    setScores(prev => {
      const updated = { ...prev };
      candidates.forEach(cand => {
        if (!updated[cand.id]) updated[cand.id] = {};
        updated[cand.id] = {
          ...updated[cand.id],
          [newTc.id]: 3.0
        };
      });
      return updated;
    });
  };

  const handleRemoveTradeCriterion = (index: number) => {
    if (tradeCriteria.length <= 3) return;
    const newTradeCriteria = [...tradeCriteria];
    newTradeCriteria.splice(index, 1);

    // Re-index remaining trade criteria
    const updatedTradeCriteria = newTradeCriteria.map((tc, idx) => ({
      ...tc,
      id: `TC-${idx + 1}`
    }));

    const newScores: Record<string, Record<string, number>> = {};
    
    candidates.forEach(cand => {
      const candScores = scores[cand.id] || {};
      const newCandScores: Record<string, number> = {};
      
      updatedTradeCriteria.forEach((tc, idx) => {
        const oldId = idx < index ? `TC-${idx + 1}` : `TC-${idx + 2}`;
        if (candScores[oldId] !== undefined) {
          newCandScores[tc.id] = candScores[oldId];
        }
      });
      newScores[cand.id] = newCandScores;
    });

    setTradeCriteria(updatedTradeCriteria);
    setScores(newScores);
  };

  const handleChangeTradeCriterion = (index: number, key: string, value: string | number) => {
    const newTradeCriteria = [...tradeCriteria];
    newTradeCriteria[index] = {
      ...newTradeCriteria[index],
      [key]: value,
    } as TradeCriterion;
    setTradeCriteria(newTradeCriteria);
  };

  return (
    <main className="app-container">
      {/* App Header */}
      <header className="app-header">
        <div className="logo-section" style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3V21M12 21H9M12 21H15M12 6L4 9M12 6L20 9" stroke="url(#logo-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 9C4 13 6 15 6 15M6 15C6 15 8 13 8 9M6 15V19M6 19H5M6 19H7" stroke="url(#logo-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M20 9C20 13 22 15 22 15M22 15C22 15 24 13 24 9M22 15V19M22 19H21M22 19H23" stroke="url(#logo-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <defs>
              <linearGradient id="logo-grad" x1="4" y1="3" x2="24" y2="21" gradientUnits="userSpaceOnUse">
                <stop stopColor="var(--accent-blue)" />
                <stop offset="0.5" stopColor="var(--accent-indigo)" />
                <stop offset="1" stopColor="var(--accent-purple)" />
              </linearGradient>
            </defs>
          </svg>
          <span style={{ letterSpacing: "-0.01em" }}>
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

      {/* Quick Action Dashboard Toolbar with Dynamic Inline-Editable Metadata */}
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
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.1rem" }}>📋</span>
              <input
                type="text"
                value={meta.project}
                onChange={(e) => setMeta({ ...meta, project: e.target.value })}
                placeholder="Project Name"
                className="editable-input"
                style={{ fontSize: "1.1rem", fontWeight: 700, padding: "0.1rem 0.3rem", width: "250px" }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.8rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <span>Lead:</span>
                <input
                  type="text"
                  value={meta.lead}
                  onChange={(e) => setMeta({ ...meta, lead: e.target.value })}
                  placeholder="Lead Analyst"
                  className="editable-input"
                  style={{ fontSize: "0.8rem", color: "var(--text-secondary)", width: "100px", padding: "0 0.2rem" }}
                />
              </div>
              <span>|</span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <span>Date:</span>
                <input
                  type="date"
                  value={meta.date}
                  onChange={(e) => setMeta({ ...meta, date: e.target.value })}
                  className="editable-input"
                  style={{ fontSize: "0.8rem", color: "var(--text-secondary)", width: "125px", padding: "0 0.2rem" }}
                />
              </div>
              <span>|</span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <span>Ver:</span>
                <input
                  type="text"
                  value={meta.version}
                  onChange={(e) => setMeta({ ...meta, version: e.target.value })}
                  placeholder="1.0"
                  className="editable-input"
                  style={{ fontSize: "0.8rem", color: "var(--text-secondary)", width: "50px", padding: "0 0.2rem" }}
                />
              </div>
            </div>
          </div>
          {!isWeightValid && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                color: "var(--accent-red)",
                padding: "0.25rem 0.5rem",
                borderRadius: "4px",
                fontSize: "0.75rem",
                fontWeight: "bold",
                alignSelf: "center"
              }}
            >
              Weighted criteria sum is {weightSum}% (must sum to exactly 100%)
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
          {/* Browser Local Database Panel */}
          <div className="glass-panel animate-fade-in" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h3 className="panel-title" style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>Study Database</h3>
                <p className="panel-subtitle" style={{ fontSize: "0.85rem" }}>Save your work locally in the browser or load templates.</p>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                <select
                  value={selectedStudyId}
                  onChange={(e) => handleLoadStudy(e.target.value)}
                  className="form-input form-select"
                  style={{ width: "220px", padding: "0.5rem 2rem 0.5rem 1rem", fontSize: "0.85rem" }}
                >
                  <option value="">-- Load Saved Study --</option>
                  <option value="new">🆕 Create New Blank Study</option>
                  {savedStudies.map((study) => (
                    <option key={study.id} value={study.id}>
                      📁 {study.name}
                    </option>
                  ))}
                </select>
                
                <button
                  onClick={handleSaveStudyToDb}
                  className="btn-primary"
                  style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
                >
                  💾 Save Current Study
                </button>
                
                {selectedStudyId && selectedStudyId !== "demo" && (
                  <button
                    onClick={() => handleDeleteStudyFromDb(selectedStudyId)}
                    className="btn-danger"
                    style={{ padding: "0.5rem", borderRadius: "10px" }}
                    title="Delete study from database"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          </div>

          <MetadataSection meta={meta} onChange={setMeta} />
          
          <ListManager
            type="screening"
            title="Screening Criteria (3 to 10)"
            subtitle="Mandatory filters (Pass/Fail) applied to exclude unqualified options early."
            items={screening}
            onAdd={handleAddScreening}
            onRemove={handleRemoveScreening}
            onChange={handleChangeScreening}
          />

          <ListManager
            type="candidates"
            title="Candidates (3 to 10)"
            subtitle="The options, designs, systems, or providers being evaluated."
            items={candidates}
            onAdd={handleAddCandidate}
            onRemove={handleRemoveCandidate}
            onChange={handleChangeCandidate}
          />
          
          <ListManager
            type="tradeCriteria"
            title="Weighted Criteria (3 to 10)"
            subtitle="Scored criteria with weights summing to exactly 100%. Adjust weights here or on Step 3."
            items={tradeCriteria}
            onAdd={handleAddTradeCriterion}
            onRemove={handleRemoveTradeCriterion}
            onChange={handleChangeTradeCriterion}
          />

          {/* Button to proceed to Step 2 */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: "1rem" }}>
            <button
              onClick={() => {
                if (candidates.some(c => !c.name) || screening.some(s => !s.name) || tradeCriteria.some(tc => !tc.name)) {
                  if (!confirm("Some fields are still empty. Do you want to proceed to Step 2 with defaults?")) {
                    return;
                  }
                }
                setActiveTab("scoring");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="btn-primary"
              style={{ padding: "1rem 2.5rem", fontSize: "1.05rem", borderRadius: "12px" }}
            >
              🚀 Generate Scoring Grid (Proceed to Step 2)
            </button>
          </div>
        </div>
      )}

      {activeTab === "scoring" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <ScreeningGrid
            candidates={candidates}
            screening={screening}
            screeningScores={screeningScores}
            onChange={setScreeningScores}
            onCandidatesChange={setCandidates}
            onScreeningChange={setScreening}
          />
          
          <ScoringMatrix
            candidates={candidates}
            tradeCriteria={tradeCriteria}
            scores={scores}
            screeningScores={screeningScores}
            screening={screening}
            onChange={setScores}
            onCandidatesChange={setCandidates}
            onTradeCriteriaChange={setTradeCriteria}
          />

          {/* Button to proceed to Step 3 */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: "1rem" }}>
            <button
              onClick={() => {
                setActiveTab("dashboard");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="btn-primary"
              style={{ padding: "1rem 2.5rem", fontSize: "1.05rem", borderRadius: "12px" }}
            >
              📊 Generate Dashboard (Proceed to Step 3)
            </button>
          </div>
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
          onCandidatesChange={setCandidates}
        />
      )}
    </main>
  );
}
