"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

const MIN_VISIBLE_MS = 180;

export default function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  const isFirstRender = useRef(true);
  const isNavigating = useRef(false);
  const startedAt = useRef(0);
  const doneTimeout = useRef<number | null>(null);

  const startProgress = useCallback(() => {
    if (doneTimeout.current) {
      window.clearTimeout(doneTimeout.current);
      doneTimeout.current = null;
    }

    if (isNavigating.current) {
      return;
    }

    isNavigating.current = true;
    startedAt.current = Date.now();
    NProgress.start();
  }, []);

  const finishProgress = useCallback(() => {
    if (!isNavigating.current) {
      return;
    }

    const elapsed = Date.now() - startedAt.current;
    const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);

    doneTimeout.current = window.setTimeout(() => {
      isNavigating.current = false;
      doneTimeout.current = null;
      NProgress.done();
    }, remaining);
  }, []);

  useEffect(() => {
    NProgress.configure({
      showSpinner: false,
    });

    const handleDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a");
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      if (anchor.target === "_blank" || anchor.hasAttribute("download")) {
        return;
      }

      const rawHref = anchor.getAttribute("href");
      if (
        !rawHref ||
        rawHref.startsWith("#") ||
        rawHref.startsWith("mailto:") ||
        rawHref.startsWith("tel:")
      ) {
        return;
      }

      const nextUrl = new URL(anchor.href, window.location.href);
      if (nextUrl.origin !== window.location.origin) {
        return;
      }

      if (
        nextUrl.pathname === window.location.pathname &&
        nextUrl.search === window.location.search
      ) {
        return;
      }

      startProgress();
    };

    const handlePopState = () => {
      startProgress();
    };

    document.addEventListener("click", handleDocumentClick, true);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
      window.removeEventListener("popstate", handlePopState);
      if (doneTimeout.current) {
        window.clearTimeout(doneTimeout.current);
      }
      NProgress.done();
    };
  }, [startProgress]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    finishProgress();
  }, [finishProgress, pathname, queryString]);

  return null;
}
