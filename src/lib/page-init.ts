/**
 * Runs `setup` on first load and again after every client-side navigation.
 *
 * With the view-transition router the body is swapped without a reload, so a
 * module script only ever evaluates once: anything that binds to elements has
 * to run again against the new DOM. `astro:page-load` fires on the first load
 * too, so this covers both.
 *
 * `setup` is handed an AbortSignal. Pass it to every addEventListener on
 * window, document or a MediaQueryList, or those listeners pile up one per
 * navigation and the page slowly gets heavier and starts double-firing.
 * Listeners on elements inside the swapped body don't need it: those elements
 * are discarded with their listeners when the body is replaced.
 */
export function onEachPage(setup: (signal: AbortSignal) => void): void {
  let controller: AbortController | undefined;

  const run = () => {
    controller?.abort();
    controller = new AbortController();
    setup(controller.signal);
  };

  run();
  document.addEventListener('astro:page-load', run);
}
