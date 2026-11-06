import { useState, type CSSProperties } from "react";
import { ArrowDownToLine, ArrowUpRight, Check, Copy } from "lucide-react";
import { filled, site, socials } from "@/data/config";
import { sectionIndex } from "@/data/sections";
import SectionHeading from "./SectionHeading";
import { Button, ButtonLink } from "./ui/Button";

export default function Contact() {
  const [copied, setCopied] = useState(false);
  const others = socials.filter((s) => !s.href.startsWith("mailto:"));

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(site.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the mailto link still works */
    }
  }

  return (
    <section id="contact" aria-labelledby="contact-title" className="section-y container-x">
      <SectionHeading
        id="contact-title"
        index={sectionIndex("contact")}
        eyebrow="Say hello"
        title="Contact"
        description="Have a role, a project or an idea in mind? My inbox is open."
      />

      <div className="reveal flex flex-col gap-6" style={{ "--i": 1 } as CSSProperties}>
        <a
          href={`mailto:${site.email}`}
          className="group inline-flex max-w-full items-center gap-2 self-start font-display text-[clamp(1.05rem,4.6vw,1.5rem)] font-medium text-ink [overflow-wrap:anywhere] sm:gap-3 sm:text-h2"
        >
          <span className="bg-gradient-to-r from-cyan to-cyan bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-1 transition-[background-size] duration-slow ease-out-expo group-hover:bg-[length:100%_1px]">
            {site.email}
          </span>
          <ArrowUpRight className="h-5 w-5 shrink-0 text-cyan sm:h-6 sm:w-6 transition-transform duration-base ease-out-expo group-hover:-translate-y-1 group-hover:translate-x-1" aria-hidden />
        </a>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" size="sm" onClick={copyEmail}>
            {copied ? <Check className="h-4 w-4 text-success" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
            {copied ? "Copied" : "Copy email"}
          </Button>
          {filled(site.cvUrl) && (
            <ButtonLink href={site.cvUrl} variant="secondary" size="sm" download>
              <ArrowDownToLine className="h-4 w-4" aria-hidden />
              Download CV
            </ButtonLink>
          )}
          {others.map(({ name, href, Icon }) => (
            <ButtonLink key={name} href={href} variant="ghost" size="sm" target="_blank" rel="noreferrer noopener">
              <Icon className="h-4 w-4" aria-hidden />
              {name}
            </ButtonLink>
          ))}
          <span className="sr-only" aria-live="polite">
            {copied ? "Email address copied to clipboard" : ""}
          </span>
        </div>
      </div>
    </section>
  );
}
