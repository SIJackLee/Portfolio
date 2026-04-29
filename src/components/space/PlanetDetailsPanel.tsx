"use client";

import { PlanetDomain } from "@/components/space/types";

interface PlanetDetailsPanelProps {
  planet: PlanetDomain | null;
  mode: "modal" | "focus";
  onClose: () => void;
}

export function PlanetDetailsPanel({
  planet,
  mode,
  onClose,
}: PlanetDetailsPanelProps) {
  if (!planet) return null;

  return (
    <aside className={`planet-details ${mode === "modal" ? "is-modal" : "is-side"}`}>
      <button type="button" className="panel-close" onClick={onClose} aria-label="Close">
        ×
      </button>
      <p className="panel-domain" style={{ color: planet.color }}>
        {planet.label}
      </p>
      <h3>{planet.summary}</h3>
      <ul>
        {planet.projects.map((project) => (
          <li key={project.title}>
            <a href={project.url} target="_blank" rel="noreferrer">
              {project.title}
            </a>
            <p>{project.description}</p>
            <small>
              {project.status.toUpperCase()} · {project.tags.join(" / ")}
            </small>
          </li>
        ))}
      </ul>
    </aside>
  );
}
