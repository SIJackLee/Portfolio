"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { InteractionModeToggle } from "@/components/space/InteractionModeToggle";
import { PlanetDetailsPanel } from "@/components/space/PlanetDetailsPanel";
import { SpaceScene } from "@/components/space/SpaceScene";
import { InteractionMode } from "@/components/space/types";
import { planets } from "@/data/planets";

export default function Home() {
  const [mode, setMode] = useState<InteractionMode>("modal");
  const [selectedPlanetId, setSelectedPlanetId] = useState<(typeof planets)[number]["id"] | null>(null);
  const [hoveredPlanetId, setHoveredPlanetId] = useState<(typeof planets)[number]["id"] | null>(null);
  const [centralExpanded, setCentralExpanded] = useState(false);
  const expandScale = 2.5;
  const lastWheelAtRef = useRef(0);

  const selectedPlanet = useMemo(
    () => planets.find((planet) => planet.id === selectedPlanetId) ?? null,
    [selectedPlanetId]
  );
  const condensedTitle =
    mode === "focus" && selectedPlanet ? selectedPlanet.stackLabel : "IoT";
  const movePlanetBy = useCallback((step: number) => {
    setSelectedPlanetId((currentId) => {
      if (!currentId) return currentId;
      const currentIndex = planets.findIndex((planet) => planet.id === currentId);
      if (currentIndex < 0) return currentId;
      const nextIndex = (currentIndex + step + planets.length) % planets.length;
      return planets[nextIndex].id;
    });
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedPlanetId(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (mode !== "focus" || !selectedPlanetId) return;

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) < 8) return;

      const now = performance.now();
      if (now - lastWheelAtRef.current < 420) {
        event.preventDefault();
        return;
      }

      lastWheelAtRef.current = now;
      event.preventDefault();
      movePlanetBy(event.deltaY > 0 ? 1 : -1);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [mode, selectedPlanetId, movePlanetBy]);

  return (
    <main className="space-page">
      <div className="scene-wrapper" aria-hidden>
        <SpaceScene
          planets={planets}
          selectedPlanetId={selectedPlanetId}
          hoveredPlanetId={hoveredPlanetId}
          interactionMode={mode}
          onHoverPlanet={setHoveredPlanetId}
          onSelectPlanet={setSelectedPlanetId}
          centralExpanded={centralExpanded}
          onToggleCentralExpanded={() => setCentralExpanded((prev) => !prev)}
          expandScale={expandScale}
        />
      </div>
      <div className="vignette-overlay" aria-hidden />
      <InteractionModeToggle mode={mode} onChange={setMode} />

      <PlanetDetailsPanel
        planet={selectedPlanet}
        mode={mode}
        onClose={() => setSelectedPlanetId(null)}
      />

      <section className={`hero-copy ${centralExpanded ? "is-condensed" : ""}`}>
        <div className={`hero-layer hero-layer-full ${centralExpanded ? "is-hidden" : "is-visible"}`}>
          <p className="eyebrow">8 Domains, One Integrated Platform</p>
          <h1>IoT System Architect</h1>
          <p>
            From Simulation to AI, I design the entire lifecycle of intelligent IoT
            systems.
          </p>
        </div>
        <div className={`hero-layer hero-layer-condensed ${centralExpanded ? "is-visible" : "is-hidden"}`}>
          <h1>{condensedTitle}</h1>
        </div>
      </section>
    </main>
  );
}
