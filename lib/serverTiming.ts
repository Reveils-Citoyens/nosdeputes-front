/** Durées uniquement : jamais de requête de recherche, d'URL ou de secret. */
export function startServerTiming(name: string) {
  const started = performance.now();
  return () => {
    const duration = (performance.now() - started).toFixed(1);
    if (process.env.PERF_DIAGNOSTICS === "1") {
      console.info(`[performance] ${name} ${duration}ms`);
    }
    return `${name};dur=${duration}`;
  };
}
