import { site, socials } from "@/data/config";
import { visibleSections } from "@/data/sections";
import { Chip } from "./ui/Btn";

const year = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <a href="#top" className="nav-logo">
            <span aria-hidden className="orb" />
            <span>
              {site.shortName}
              <span className="text-cyan">.</span>
            </span>
          </a>
          <p>{site.role} — interfaces, motion and practical AI, built from Ninh Bình.</p>
          <Chip live>{site.availability}</Chip>
        </div>

        <nav aria-label="Footer">
          <p className="footer-head">Explore</p>
          <ul>
            {visibleSections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`}>{s.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="footer-head">Connect</p>
          <ul>
            {socials.map(({ name, href }) => (
              <li key={name}>
                <a href={href} {...(href.startsWith("mailto:") ? {} : { target: "_blank", rel: "noreferrer noopener" })}>
                  {name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="footer-head">Coordinates</p>
          <ul className="footer-plain">
            <li>{site.location}</li>
            <li className="mono">{site.coords}</li>
            <li className="mono">{site.timezone}</li>
          </ul>
        </div>
      </div>

      <div className="footer-legal">
        <span suppressHydrationWarning>
          © {year} {site.name}
        </span>
        <span>
          Designed &amp; engineered in {site.location.split(",")[0]} · <a href="#top">Back to top ↑</a>
        </span>
      </div>

      <p aria-hidden className="footer-wordmark">
        {site.shortName}
      </p>
    </footer>
  );
}
