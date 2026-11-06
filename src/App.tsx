import type { ComponentType } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Skills from "@/components/Skills";
import Trajectory from "@/components/Trajectory";
import Projects from "@/components/Projects";
import Certificates from "@/components/Certificates";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import KarstDivider from "@/components/KarstDivider";
import CommandPalette from "@/components/CommandPalette";
import { visibleSections, type SectionId } from "@/data/sections";
import { useReveal } from "@/hooks/useReveal";

const registry: Record<SectionId, ComponentType> = {
  about: About,
  skills: Skills,
  trajectory: Trajectory,
  projects: Projects,
  certificates: Certificates,
  contact: Contact,
};

export default function App() {
  useReveal();
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <Hero />
        <KarstDivider />
        {visibleSections.map(({ id }) => {
          const Section = registry[id];
          return <Section key={id} />;
        })}
      </main>
      <Footer />
      <CommandPalette />
    </div>
  );
}
