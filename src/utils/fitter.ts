export function fit(parent: HTMLElement, child: HTMLElement) {
  const childStyle = getComputedStyle(child);
  const parentStyle = getComputedStyle(parent);

  const childWidth = parseFloat(childStyle.width);
  const childHeight = parseFloat(childStyle.height);
  const childPaddingWidth = parseFloat(childStyle.paddingLeft) + childWidth + parseFloat(childStyle.paddingRight);
  const childPaddingHeight = parseFloat(childStyle.paddingTop) + childHeight + parseFloat(childStyle.paddingBottom);
  const childBorderWidth = parseFloat(childStyle.borderLeftWidth) + childPaddingWidth + parseFloat(childStyle.borderRightWidth);
  const childBorderHeight = parseFloat(childStyle.borderTopWidth) + childPaddingHeight + parseFloat(childStyle.borderBottomWidth);

  const parentWidth = parseFloat(parentStyle.width);
  const parentHeight = parseFloat(parentStyle.height);

  const scaleX = parentWidth / childBorderWidth;
  const scaleY = parentHeight / childBorderHeight;

  const scale = Math.min(scaleX, scaleY);
  // Only modify the scale part of the element's inline transform to avoid
  // wiping other transform functions (translate/rotate/etc.) if present.
  const prev = child.style.transform || '';
  if (/scale\s*\(/i.test(prev) || /scaleX\s*\(/i.test(prev) || /scaleY\s*\(/i.test(prev)) {
    let next = prev.replace(/scale\s*\([^)]*\)/i, `scale(${scale}, ${scale})`);
    next = next.replace(/scaleX\s*\([^)]*\)/i, `scaleX(${scale})`);
    next = next.replace(/scaleY\s*\([^)]*\)/i, `scaleY(${scale})`);
    child.style.transform = next;
  } else {
    // No inline scale present — append scale so we don't remove other inline transforms.
    child.style.transform = `${prev} scale(${scale}, ${scale})`.trim();
  }
}

let activeObserver: MutationObserver | null = null;
let activeResizeHandler: ((_e?: Event) => void) | null = null;

export function fitAll(root: Element | Document = document) {
  const doc = (root as Document) || document;
  const nodes = doc.querySelectorAll?.('.fitting') ?? document.querySelectorAll('.fitting');
  nodes.forEach((node) => {
    const el = node as HTMLElement;
    const parent = el.parentElement as HTMLElement | null;
    if (parent) fit(parent, el);
  });
}

export function startAutoFit(root: Element | Document = document) {
  if (activeObserver) return;

  const target = (root as Element) || document;
  activeObserver = new MutationObserver(() => {
    try {
      fitAll(root);
    } catch {
      // ignore
    }
  });

  activeObserver.observe(target, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['class', 'style'],
  });

  activeResizeHandler = () => { try { fitAll(root); } catch { /* ignore fit errors */ } };
  if (typeof window !== 'undefined') window.addEventListener('resize', activeResizeHandler);

  fitAll(root);
}

export function stopAutoFit() {
  if (activeObserver) {
    activeObserver.disconnect();
    activeObserver = null;
  }
  if (activeResizeHandler && typeof window !== 'undefined') {
    window.removeEventListener('resize', activeResizeHandler);
    activeResizeHandler = null;
  }
}

export function isAutoFitRunning() {
  return !!activeObserver;
}
