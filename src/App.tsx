import { useEffect, type ComponentType } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Skills from "@/components/Skills";
import Trajectory from "@/components/Trajectory";
import Projects from "@/components/Projects";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import Backdrop from "@/components/Backdrop";
import CommandPalette from "@/components/CommandPalette";
import AltitudeRail from "@/components/AltitudeRail";
import { visibleSections, type SectionId } from "@/data/sections";
import { useInteractions } from "@/hooks/useInteractions";
import { useReveal } from "@/hooks/useReveal";
import { startSmoothScroll, stopSmoothScroll } from "@/lib/smoothScroll";

const registry: Record<SectionId, ComponentType> = {
  about: About,
  skills: Skills,
  projects: Projects,
  trajectory: Trajectory,
  contact: Contact,
};

export default function App() {
  useReveal();
  useInteractions();
  useEffect(() => {
    void startSmoothScroll();
    return stopSmoothScroll;
  }, []);

  return (
    <>
      <Backdrop />
      <div className="page">
        <Navbar />
        <main id="main" tabIndex={-1} className="outline-none">
          <Hero />
          {visibleSections.map(({ id }) => {
            const Section = registry[id];
            return <Section key={id} />;
          })}
        </main>
        <Footer />
      </div>
      <AltitudeRail />
      <CommandPalette />
    </>
  );
}
