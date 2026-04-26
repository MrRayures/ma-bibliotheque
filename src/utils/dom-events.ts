// Attache un listener qui se nettoie automatiquement avant la prochaine navigation
// Astro (event `astro:before-preparation`). Évite l'accumulation de handlers sur
// document/window à chaque `astro:page-load` quand ClientRouter est actif.
export function addPageScopedListener<E extends Event>(
  target: EventTarget,
  event: string,
  handler: (e: E) => void,
  options?: AddEventListenerOptions,
): void {
  const listener = handler as EventListener;
  target.addEventListener(event, listener, options);
  document.addEventListener(
    'astro:before-preparation',
    () => target.removeEventListener(event, listener, options),
    { once: true },
  );
}
