type Props = { index: string; eyebrow: string; title: string; description?: string; id?: string };

export default function SectionHeading({ index, eyebrow, title, description, id }: Props) {
  return (
    <header className="reveal mb-12 max-w-2xl md:mb-16">
      <p className="label-mono flex items-center gap-3">
        <span className="text-cyan">{index}</span>
        <span aria-hidden className="h-px w-8 bg-line" />
        {eyebrow}
      </p>
      <h2 id={id} className="mt-4 text-h2">
        {title}
      </h2>
      {description && <p className="mt-4 text-ink-2">{description}</p>}
    </header>
  );
}
