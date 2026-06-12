"use client";

import React from "react";
import { TradeStudyMeta } from "../types/trade";

interface MetadataSectionProps {
  meta: TradeStudyMeta;
  onChange: (meta: TradeStudyMeta) => void;
}

export default function MetadataSection({ meta, onChange }: MetadataSectionProps) {
  const handleChange = (key: keyof TradeStudyMeta, value: string) => {
    onChange({
      ...meta,
      [key]: value,
    });
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: "1.5rem" }}>
      <h3 className="panel-title" style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>Project Metadata</h3>
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Project / Study Name</label>
          <input
            type="text"
            className="form-input"
            value={meta.project}
            onChange={(e) => handleChange("project", e.target.value)}
            placeholder="e.g. Comms Relay Options"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Sponsor / Program</label>
          <input
            type="text"
            className="form-input"
            value={meta.sponsor}
            onChange={(e) => handleChange("sponsor", e.target.value)}
            placeholder="e.g. Satellite Comms Dept"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Study Lead Analyst</label>
          <input
            type="text"
            className="form-input"
            value={meta.lead}
            onChange={(e) => handleChange("lead", e.target.value)}
            placeholder="e.g. Jane Doe"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Date Conducted</label>
          <input
            type="date"
            className="form-input"
            value={meta.date}
            onChange={(e) => handleChange("date", e.target.value)}
          />
        </div>

        <div className="form-group" style={{ gridColumn: "span 1" }}>
          <label className="form-label">Version</label>
          <input
            type="text"
            className="form-input"
            value={meta.version}
            onChange={(e) => handleChange("version", e.target.value)}
            placeholder="e.g. 1.0"
          />
        </div>
      </div>
    </div>
  );
}
