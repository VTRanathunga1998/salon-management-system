"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";

const REFRESH_INTERVAL_MS = 60_000;

const DashboardAutoRefresh = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      startTransition(() => {
        router.refresh();
      });
    }, REFRESH_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [router]);

  // Pause refreshing while the tab isn't visible — no point re-fetching
  // stats nobody's looking at, and it avoids piling up requests in
  // background tabs.
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden" && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      } else if (
        document.visibilityState === "visible" &&
        !intervalRef.current
      ) {
        intervalRef.current = setInterval(() => {
          startTransition(() => {
            router.refresh();
          });
        }, REFRESH_INTERVAL_MS);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [router]);

  // Small, unobtrusive indicator — purely optional, remove the JSX below
  // if you'd rather it refresh completely silently.
  return isPending ? (
    <span className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 rounded-full bg-slate-800/90 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
      Refreshing…
    </span>
  ) : null;
};

export default DashboardAutoRefresh;
