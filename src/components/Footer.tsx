import { ArrowUp } from "lucide-react";
import { site, socials } from "@/data/config";

const year = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="container-x flex flex-col items-start justify-between gap-6 py-10 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <p className="text-sm text-ink-2" suppressHydrationWarning>
            © {year} {site.name}
          </p>
          <p className="font-mono text-xs text-ink-3">Designed & engineered in {site.location.split(",")[0]}</p>
        </div>

        <div className="flex items-center gap-2">
          {socials.map(({ name, href, Icon }) => {
            const external = !href.startsWith("mailto:");
            return (
              <a
                key={name}
                href={href}
                aria-label={name}
                {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
                className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-line text-ink-3 transition-colors hover:bg-elevated hover:text-ink"
              >
                <Icon className="h-4 w-4" aria-hidden />
              </a>
            );
          })}
          <a
            href="#top"
            aria-label="Back to top"
            className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-line text-ink-3 transition-colors hover:bg-elevated hover:text-cyan"
          >
            <ArrowUp className="h-4 w-4" aria-hidden />
          </a>
        </div>
      </div>
    </footer>
  );
}
