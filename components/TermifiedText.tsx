"use client";

import * as React from "react";
import Term from "./Term";
import { GLOSSAIRE } from "@/data/glossaire";

type TermifiedTextProps = {
  text: string;
  variant?: "default" | "onDark";
};

type Match = {
  start: number;
  end: number;
  slug: string;
};

// Pre-built list of (pattern, slug) pairs, sorted by length descending so that
// "commission mixte paritaire" matches before "commission".
const PATTERNS: Array<{ pattern: string; slug: string }> = Object.values(GLOSSAIRE)
  .flatMap((entry) => {
    const variants = new Set<string>([
      entry.titre.toLowerCase(),
      entry.slug.replace(/-/g, " "),
    ]);
    return Array.from(variants).map((pattern) => ({ pattern, slug: entry.slug }));
  })
  .sort((a, b) => b.pattern.length - a.pattern.length);

function findMatches(text: string): Match[] {
  const lower = text.toLowerCase();
  const matches: Match[] = [];
  const seenSlugs = new Set<string>();

  for (const { pattern, slug } of PATTERNS) {
    if (seenSlugs.has(slug)) continue;
    const idx = lower.indexOf(pattern);
    if (idx === -1) continue;

    // Skip if this span overlaps with an already-found match.
    const end = idx + pattern.length;
    const overlaps = matches.some(
      (m) => !(end <= m.start || idx >= m.end)
    );
    if (overlaps) continue;

    matches.push({ start: idx, end, slug });
    seenSlugs.add(slug);
  }

  return matches.sort((a, b) => a.start - b.start);
}

export default function TermifiedText({ text, variant }: TermifiedTextProps) {
  const matches = React.useMemo(() => findMatches(text), [text]);

  if (matches.length === 0) {
    return <>{text}</>;
  }

  const nodes: React.ReactNode[] = [];
  let cursor = 0;

  matches.forEach((m, i) => {
    if (m.start > cursor) {
      nodes.push(text.slice(cursor, m.start));
    }
    nodes.push(
      <Term key={`${m.slug}-${i}`} term={m.slug} variant={variant}>
        {text.slice(m.start, m.end)}
      </Term>
    );
    cursor = m.end;
  });
  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }

  return <>{nodes}</>;
}
