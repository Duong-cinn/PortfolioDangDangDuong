import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { site, socials } from "@/data/config";
import { sectionIndex } from "@/data/sections";
import { Btn, BtnLink, Eyebrow } from "./ui/Btn";

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
    <section id="contact" aria-labelledby="contact-title" className="section end">
      <div className="cta glass spot reveal">
        <Eyebrow index={sectionIndex("contact")} className="eyebrow--center">
          Say hello
        </Eyebrow>
        <h2 id="contact-title" className="cta__title">
          Let&rsquo;s build something
          <br />
          <em className="serif">remarkable</em> together.
        </h2>
        <p className="lede">Have a role, a project or an idea in mind? My inbox is open.</p>
        <a href={`mailto:${site.email}`} className="cta__email">
          {site.email}
        </a>
        <div className="btn-row btn-row--center">
          <BtnLink href={`mailto:${site.email}`}>Email me</BtnLink>
          <Btn variant="ghost" onClick={copyEmail}>
            {copied ? <Check className="h-4 w-4 text-mint" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
            {copied ? "Copied" : "Copy email"}
          </Btn>
          {others.map(({ name, href, Icon }) => (
            <BtnLink key={name} href={href} variant="ghost" target="_blank" rel="noreferrer noopener">
              <Icon className="h-4 w-4" aria-hidden /> {name}
            </BtnLink>
          ))}
        </div>
        <p className="cta__note">
          {site.location} &nbsp;·&nbsp; {site.timezone} &nbsp;·&nbsp; {site.availability}
        </p>
        <span className="sr-only" aria-live="polite">
          {copied ? "Email address copied to clipboard" : ""}
        </span>
      </div>
    </section>
  );
}
