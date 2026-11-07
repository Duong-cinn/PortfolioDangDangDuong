import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { ArrowDownToLine, ArrowUp, AtSign, Copy, CornerDownLeft, Hash, Layers, Search } from "lucide-react";
import { filled, has, site, skillGroups, socials, type IconComponent } from "@/data/config";
import { visibleSections } from "@/data/sections";
import { OPEN_PALETTE_EVENT } from "@/lib/palette";
import { scrollToId } from "@/lib/smoothScroll";
import { cn } from "@/lib/utils";


type Command = {
  id: string;
  group: "Navigate" | "Skills" | "Contact";
  label: string;
  hint?: string;
  keywords?: string;
  Icon: IconComponent;
  /** Leave the palette open after running (it closes itself, e.g. after a "copied" notice). */
  keepOpen?: boolean;
  run: () => void;
};

const goTo = scrollToId;

/** Jump to the skills console and switch its filter to the group. */
function openSkillGroup(groupId: string) {
  scrollToId("console");
  const btn = document.getElementById(`skill-${groupId}`);
  if (btn && btn.getAttribute("aria-pressed") !== "true") btn.click();
}

/** Ctrl/⌘ + K quick actions: jump to a section or skill group, copy email, open CV/socials. */
export default function CommandPalette() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const [notice, setNotice] = useState("");
  const listId = useId();

  const commands = useMemo<Command[]>(() => {
    const list: Command[] = [
      { id: "top", group: "Navigate", label: "Home", keywords: "top hero start", Icon: ArrowUp, run: () => goTo("top") },
      ...visibleSections.map<Command>((s) => ({
        id: s.id,
        group: "Navigate",
        label: s.label,
        keywords: s.id,
        Icon: Hash,
        run: () => goTo(s.id),
      })),
      ...skillGroups
        .filter((g) => has(g.items))
        .map<Command>((g) => ({
          id: `skill-${g.id}`,
          group: "Skills",
          label: g.label,
          hint: `${g.items.length} skills`,
          keywords: g.items.map((i) => i.name).join(" "),
          Icon: Layers,
          run: () => openSkillGroup(g.id),
        })),
      {
        id: "copy-email",
        group: "Contact",
        label: "Copy email address",
        hint: site.email,
        keywords: "mail contact",
        Icon: Copy,
        keepOpen: true,
        run: () => {
          navigator.clipboard
            ?.writeText(site.email)
            .then(() => {
              setNotice("Email copied to clipboard");
              window.setTimeout(() => dialogRef.current?.close(), 700);
            })
            .catch(() => setNotice("Clipboard blocked — use “Send an email” instead"));
        },
      },
      {
        id: "mailto",
        group: "Contact",
        label: "Send an email",
        keywords: "mail contact write",
        Icon: AtSign,
        run: () => void (location.href = `mailto:${site.email}`),
      },
    ];
    if (filled(site.cvUrl)) {
      list.push({
        id: "cv",
        group: "Contact",
        label: "Download CV",
        keywords: "resume pdf",
        Icon: ArrowDownToLine,
        run: () => {
          const a = document.createElement("a");
          a.href = site.cvUrl;
          a.download = "";
          a.click();
        },
      });
    }
    for (const s of socials.filter((s) => !s.href.startsWith("mailto:"))) {
      list.push({
        id: `social-${s.name}`,
        group: "Contact",
        label: `Open ${s.name}`,
        Icon: s.Icon,
        run: () => void window.open(s.href, "_blank", "noopener,noreferrer"),
      });
    }
    return list;
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => `${c.label} ${c.group} ${c.keywords ?? ""} ${c.hint ?? ""}`.toLowerCase().includes(q));
  }, [commands, query]);

  const show = useCallback(() => {
    const d = dialogRef.current;
    if (!d || d.open) return;
    setQuery("");
    setIndex(0);
    setNotice("");
    d.showModal();
    setOpen(true);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // global shortcut + external open requests (navbar button)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey) && !e.altKey) {
        e.preventDefault();
        if (dialogRef.current?.open) dialogRef.current.close();
        else show();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_PALETTE_EVENT, show);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_PALETTE_EVENT, show);
    };
  }, [show]);

  // keep the active option in view
  useEffect(() => {
    if (!open) return;
    document.getElementById(`${listId}-${index}`)?.scrollIntoView({ block: "nearest" });
  }, [index, open, listId]);

  const execute = (cmd: Command | undefined) => {
    if (!cmd) return;
    // close first so the dialog's focus restore doesn't fight goTo()'s focus move
    if (!cmd.keepOpen) dialogRef.current?.close();
    cmd.run();
  };

  const onInputKey = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (e.key === "Home") {
      e.preventDefault();
      setIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setIndex(Math.max(0, results.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      execute(results[index]);
    }
  };

  let lastGroup = "";

  return (
    <dialog
      ref={dialogRef}
      aria-label="Quick actions"
      onClose={() => setOpen(false)}
      onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
      className="palette m-0 w-full max-w-none bg-transparent p-0 text-ink backdrop:bg-bg/70 backdrop:backdrop-blur-sm"
    >
      {open && (
        <div className="palette-panel mx-auto mt-[12vh] w-[min(560px,calc(100vw-2rem))] overflow-hidden rounded-lg border border-line bg-elevated shadow-elev">
          <div className="flex items-center gap-3 border-b border-line px-4">
            <Search className="h-4 w-4 shrink-0 text-ink-3" aria-hidden />
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded="true"
              aria-controls={listId}
              aria-activedescendant={results.length ? `${listId}-${index}` : undefined}
              aria-autocomplete="list"
              aria-label="Search sections, skills and actions"
              placeholder="Jump to… or type a skill"
              autoComplete="off"
              spellCheck={false}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIndex(0);
              }}
              onKeyDown={onInputKey}
              className="h-14 w-full bg-transparent text-base text-ink placeholder:text-ink-3 focus:outline-none"
            />
            <kbd className="hidden rounded border border-line px-1.5 py-0.5 font-mono text-[11px] text-ink-3 sm:block">Esc</kbd>
          </div>

          <ul id={listId} role="listbox" aria-label="Results" className="max-h-[min(55vh,380px)] overflow-y-auto p-2">
            {results.length === 0 && <li className="px-3 py-8 text-center text-sm text-ink-3">No matches for “{query}”.</li>}
            {results.map((c, i) => {
              const header = c.group !== lastGroup;
              lastGroup = c.group;
              const selected = i === index;
              return (
                <li key={c.id} role="presentation">
                  {header && (
                    <p role="presentation" className="label-mono px-3 pb-1.5 pt-3 first:pt-1">
                      {c.group}
                    </p>
                  )}
                  <div
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={selected}
                    onPointerMove={() => i !== index && setIndex(i)}
                    onClick={() => execute(c)}
                    className={cn(
                      "flex h-11 cursor-pointer items-center gap-3 rounded-md px-3 text-sm transition-colors duration-fast",
                      selected ? "bg-surface text-ink" : "text-ink-2",
                    )}
                  >
                    <c.Icon className={cn("h-4 w-4 shrink-0", selected ? "text-cyan" : "text-ink-3")} aria-hidden />
                    <span className="truncate">{c.label}</span>
                    {c.hint && <span className="ml-auto truncate pl-3 font-mono text-xs text-ink-3">{c.hint}</span>}
                    {selected && <CornerDownLeft className={cn("h-3.5 w-3.5 shrink-0 text-ink-3", !c.hint && "ml-auto")} aria-hidden />}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center justify-between gap-4 border-t border-line px-4 py-2.5 font-mono text-[11px] text-ink-3">
            <span aria-live="polite" className={cn(notice && "text-success")}>
              {notice || "↑↓ navigate · ↵ select"}
            </span>
            <span className="hidden sm:inline">{site.shortName}.</span>
          </div>
        </div>
      )}
    </dialog>
  );
}
