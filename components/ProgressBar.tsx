"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

export default function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.configure({
      showSpinner: false,
    });

    NProgress.start();

    const timeout = setTimeout(() => {
      NProgress.done();
    }, 300); // helps it actually be visible

    return () => clearTimeout(timeout);
  }, [pathname, searchParams]);

  return null;
}
