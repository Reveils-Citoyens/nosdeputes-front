"use client";

import React from "react";
import { useParams } from "next/navigation";
import ThemeDestinationSkeleton from "./ThemeDestinationSkeleton";

// Keep the destination label even if Next commits a loading boundary first.
export function DomainRouteSkeleton() {
  const { id } = useParams<{ id: string }>();
  return <ThemeDestinationSkeleton kind="domain" slug={id} />;
}

export function ThemeRouteSkeleton() {
  const { slug } = useParams<{ slug: string }>();
  return <ThemeDestinationSkeleton kind="theme" slug={slug} />;
}
