"use client";

import React from "react";
import NextLink from "next/link";
import { usePageNavigation } from "./PageNavigation";

/** Use onNavigate, not onClick: modified/middle clicks, download and external
 * links remain native. The ref and all Next/MUI/analytics props are forwarded. */
const NavigationLink = React.forwardRef<HTMLAnchorElement, React.ComponentProps<typeof NextLink>>(
  function NavigationLink({ href, onNavigate, replace, scroll, ...props }, ref) {
    const navigation = usePageNavigation();
    return <NextLink {...props} ref={ref} href={href} replace={replace} scroll={scroll}
      onNavigate={event => {
        let cancelled = false;
        onNavigate?.({ preventDefault() { cancelled = true; event.preventDefault(); } });
        if (cancelled || !navigation || typeof href !== "string" || !href.startsWith("/") || href.startsWith("//")) return;
        event.preventDefault();
        navigation.navigate(href, { replace, scroll });
      }} />;
  },
);

export default NavigationLink;
