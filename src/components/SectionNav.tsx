import { useEffect, useState, type ReactNode } from 'react';

interface Section {
  id: string;
  label: string;
}

interface Props {
  label: string;
  sections: Section[];
  /** Extra content at the right end (e.g. the kitchen mode button). */
  end?: ReactNode;
}

/** Sticky section links that mark the section currently in view. */
export function SectionNav({ label, sections, end }: Props) {
  const [current, setCurrent] = useState(sections[0]?.id ?? '');

  useEffect(() => {
    const els = sections
      .map((s) => document.getElementById(s.id))
      .filter((e): e is HTMLElement => !!e);
    if (els.length === 0) return;
    const onScroll = () => {
      const offset = 90;
      let active = els[0]!.id;
      for (const el of els) if (el.getBoundingClientRect().top <= offset) active = el.id;
      // At the very bottom, the last section is the current one.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        active = els[els.length - 1]!.id;
      }
      setCurrent(active);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [sections]);

  return (
    <nav className="section-nav" aria-label={label}>
      <div className="section-nav__links">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="section-nav__link"
            aria-current={current === s.id ? 'true' : undefined}
            onClick={(e) => {
              // HashRouter owns the URL hash: scroll manually.
              e.preventDefault();
              document.getElementById(s.id)?.scrollIntoView({ block: 'start' });
              setCurrent(s.id);
            }}
          >
            {s.label}
          </a>
        ))}
      </div>
      {end}
    </nav>
  );
}
