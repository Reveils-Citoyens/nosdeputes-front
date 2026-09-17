"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ReturnedDebat } from "@/data/getDebats";
import { DebateFilterBar } from "../debat/DebateFilterBar";
import DebatePageSkeleton from "../debat/DebatePageSkeleton";

export default function CommissionNavigationShell({
  debats,
  baseHref,
  children,
}: {
  debats: ReturnedDebat[];
  baseHref: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const navigate = React.useCallback(
    (href: string) => {
      startTransition(() => router.push(href));
    },
    [router]
  );

  return (
    <>
      <DebateFilterBar
        debats={debats}
        basePath="commission"
        baseHref={baseHref}
        onNavigate={navigate}
      />
      <div className="container">
        {isPending ? <DebatePageSkeleton /> : children}
      </div>
    </>
  );
}
