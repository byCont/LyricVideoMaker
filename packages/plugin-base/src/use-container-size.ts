import { useLayoutEffect, useState, type RefObject } from "react";

export interface ContainerSize {
  width: number;
  height: number;
}

const ZERO_SIZE: ContainerSize = { width: 0, height: 0 };

/**
 * Pure helper: read an element's current box. Safe to call before the
 * element has been laid out — returns zeros in that case.
 */
export function readContainerSize(node: Element | null): ContainerSize {
  if (!node) return ZERO_SIZE;
  const rect = node.getBoundingClientRect();
  return { width: rect.width, height: rect.height };
}

/**
 * React hook for reading the size of a component's own wrapper element.
 *
 * Components are blind to the modifier stack that wraps them; when they
 * need pixel dimensions for internal layout (canvas allocation, text
 * wrapping, audio-reactive bar spans) they call this hook against the
 * innermost container ref provided by the render shell.
 *
 * The hook seeds synchronously from getBoundingClientRect inside a
 * useLayoutEffect so frame 0 has real numbers. Subsequent resize events
 * (driven by user edits to Transform modifier options, for example)
 * arrive via ResizeObserver.
 */
export function useContainerSize(ref: RefObject<Element | null>): ContainerSize {
  const [size, setSize] = useState<ContainerSize>(ZERO_SIZE);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    setSize(readContainerSize(node));
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const box = entry.contentRect;
      setSize({ width: box.width, height: box.height });
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [ref]);

  return size;
}
