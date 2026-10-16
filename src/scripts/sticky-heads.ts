/**
 * The page's running head stays at the top of the window all the way down, and the progress bar sticks under it.
 * Its height is published as --head-h on the root (global.css, Progress.astro).
 */
export function stickHeads() {
  const page = document.querySelector<HTMLElement>('.sheet-inner > header.rhead');
  const measure = () => document.documentElement.style.setProperty('--head-h', `${page?.offsetHeight ?? 0}px`);
  // The sheet walk sets the running head's final height.
  document.addEventListener('sheet:snapped', measure);
  measure();
}
