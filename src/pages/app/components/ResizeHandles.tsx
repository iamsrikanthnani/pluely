import { useCallback, useRef } from "react";
import type { PointerEvent } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { STORAGE_KEYS } from "@/config";
import { safeLocalStorage } from "@/lib";

type ResizeEdge = "left" | "right";
type ResizeAnchor = "left" | "right";

const MIN_OVERLAY_WIDTH = 600;

export const ResizeHandles = () => {
  const resizeStateRef = useRef<{
    edge: ResizeEdge;
    pointerId: number;
    startX: number;
    startWidth: number;
  } | null>(null);
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef<{ width: number; anchor: ResizeAnchor } | null>(
    null
  );
  const lastQueuedWidthRef = useRef<number | null>(null);
  const lastWidthRef = useRef<number>(MIN_OVERLAY_WIDTH);
  const cursorRef = useRef<{ cursor?: string; userSelect?: string } | null>(
    null
  );
  const windowRef = useRef(getCurrentWebviewWindow());

  const queueResize = useCallback((width: number, anchor: ResizeAnchor) => {
    pendingRef.current = { width, anchor };
    if (rafRef.current !== null) return;

    rafRef.current = requestAnimationFrame(async () => {
      rafRef.current = null;
      const pending = pendingRef.current;
      if (!pending) return;

      lastWidthRef.current = pending.width;

      try {
        await invoke("set_window_width", {
          window: windowRef.current,
          width: Math.round(pending.width),
          anchor: pending.anchor,
        });
      } catch (error) {
        console.error("Failed to resize window width:", error);
      }
    });
  }, []);

  const startResize = useCallback(
    (edge: ResizeEdge) => (e: PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);

      const startWidth = window.innerWidth || MIN_OVERLAY_WIDTH;

      resizeStateRef.current = {
        edge,
        pointerId: e.pointerId,
        startX: e.clientX,
        startWidth,
      };

      lastWidthRef.current = startWidth;
      lastQueuedWidthRef.current = startWidth;

      if (!cursorRef.current) {
        cursorRef.current = {
          cursor: document.body.style.cursor,
          userSelect: document.body.style.userSelect,
        };
      }

      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      const state = resizeStateRef.current;
      if (!state || state.pointerId !== e.pointerId) return;

      const delta = e.clientX - state.startX;
      const rawWidth =
        state.edge === "right"
          ? state.startWidth + delta
          : state.startWidth - delta;
      const nextWidth = Math.max(
        MIN_OVERLAY_WIDTH,
        Math.round(rawWidth)
      );

      if (nextWidth === lastQueuedWidthRef.current) return;

      lastQueuedWidthRef.current = nextWidth;
      const anchor: ResizeAnchor = state.edge === "right" ? "left" : "right";
      queueResize(nextWidth, anchor);
    },
    [queueResize]
  );

  const stopResize = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const state = resizeStateRef.current;
    if (!state || state.pointerId !== e.pointerId) return;

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    resizeStateRef.current = null;

    if (cursorRef.current) {
      document.body.style.cursor = cursorRef.current.cursor || "";
      document.body.style.userSelect = cursorRef.current.userSelect || "";
      cursorRef.current = null;
    }

    const widthToStore =
      lastQueuedWidthRef.current ?? lastWidthRef.current ?? MIN_OVERLAY_WIDTH;

    safeLocalStorage.setItem(
      STORAGE_KEYS.OVERLAY_WIDTH,
      Math.round(widthToStore).toString()
    );
  }, []);

  return (
    <>
      <div
        className="absolute inset-y-0 left-0 z-20 w-2 cursor-ew-resize touch-none"
        onPointerDown={startResize("left")}
        onPointerMove={handlePointerMove}
        onPointerUp={stopResize}
        onPointerCancel={stopResize}
      />
      <div
        className="absolute inset-y-0 right-0 z-20 w-2 cursor-ew-resize touch-none"
        onPointerDown={startResize("right")}
        onPointerMove={handlePointerMove}
        onPointerUp={stopResize}
        onPointerCancel={stopResize}
      />
    </>
  );
};
