export function getScrollOffset(): number {
  return -116;
}

export function scrollToId(id: string) {
  const target = document.querySelector(id);
  if (!target) return;
  const lenis = (window as Window & { __lenis?: { scrollTo: (el: Element, opts?: { offset?: number }) => void } }).__lenis;
  if (lenis) {
    lenis.scrollTo(target, { offset: getScrollOffset() });
  } else {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
