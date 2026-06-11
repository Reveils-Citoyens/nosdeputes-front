// Helper de tracking d'événements Umami (sans cookie). Sûr côté SSR : ne fait
// rien si le script n'est pas chargé.

declare global {
  interface Window {
    umami?: {
      track: (
        event: string,
        data?: Record<string, string | number | boolean>
      ) => void;
    };
  }
}

export function trackEvent(
  event: string,
  data?: Record<string, string | number | boolean>
): void {
  if (typeof window !== "undefined" && window.umami) {
    try {
      window.umami.track(event, data);
    } catch {
      // tracking best-effort : on n'interrompt jamais l'UX
    }
  }
}

export {};
