import type { ComponentType } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Skills from "@/components/Skills";
import Projects from "@/components/Projects";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import { visibleSections, type SectionId } from "@/data/sections";
import { useReveal } from "@/hooks/useReveal";

const registry: Record<SectionId, ComponentType> = {
  about: About,
  skills: Skills,
  projects: Projects,
  contact: Contact,
};

export default function App() {
  useReveal();
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <Hero />
        {visibleSections.map(({ id }) => {
          const Section = registry[id];
          return <Section key={id} />;
        })}
      </main>
      <Footer />
    </div>
  );
}
