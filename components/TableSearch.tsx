// "use client";

// import Image from "next/image";
// import { useRouter } from "next/navigation";

// const TableSearch = () => {
//   const router = useRouter();
//   const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();

//     const value = (e.currentTarget[0] as HTMLInputElement).value;

//     const params = new URLSearchParams(window.location.search);
//     params.set("search", value);
//     router.push(`${window.location.pathname}?${params}`);
//   };

//   return (
//     <form
//       onSubmit={handleSubmit}
//       className="w-full md:w-auto flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 p-2"
//     >
//       <Image src="/search.png" alt="" width={14} height={14} />
//       <input
//         type="text"
//         placeholder="Search..."
//         className="w-[200px] p-0.5 bg-transparent outline-none"
//       />
//     </form>
//   );
// };

// export default TableSearch;

"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

const DEBOUNCE_MS = 350;

const TableSearch = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Seed from the URL so the field is correct on load/back-nav, and stays
  // correct if the user navigates via browser back/forward.
  const [value, setValue] = useState(searchParams.get("search") ?? "");

  // useTransition marks the resulting navigation as low-priority, so React
  // keeps the input responsive to every keystroke instead of blocking on
  // the (server-rendered) route update.
  const [isPending, startTransition] = useTransition();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestValueRef = useRef(value);

  useEffect(() => {
    latestValueRef.current = value;
  }, [value]);

  // Keep the field synced if the URL changes from elsewhere (e.g. a
  // "clear filters" button, or browser back/forward).
  useEffect(() => {
    const urlValue = searchParams.get("search") ?? "";
    if (urlValue !== latestValueRef.current) {
      setValue(urlValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const applySearch = (nextValue: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (nextValue) {
      params.set("search", nextValue);
    } else {
      params.delete("search");
    }

    // A new search term invalidates whatever page the user was on —
    // otherwise typing while on page 3 can land on an empty page 3 of
    // the new, smaller result set.
    params.delete("page");

    startTransition(() => {
      // replace, not push: every keystroke shouldn't add a browser-history
      // entry, or "back" would step through each intermediate character.
      // scroll: false avoids an unwanted scroll-to-top on every update.
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      applySearch(value.trim());
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        // Enter submits immediately, skipping the debounce wait.
        if (debounceRef.current) clearTimeout(debounceRef.current);
        applySearch(value.trim());
      }}
      className="w-full md:w-auto flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 p-2"
    >
      <button
        type="submit"
        aria-label="Search"
        disabled={isPending}
        className="flex items-center justify-center shrink-0 cursor-pointer disabled:cursor-not-allowed"
      >
        {isPending ? (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            className="animate-spin text-gray-400"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth="3"
              strokeOpacity="0.25"
            />
            <path
              d="M21 12a9 9 0 0 0-9-9"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <Image src="/search.png" alt="" width={14} height={14} />
        )}
      </button>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search..."
        className="w-[200px] p-0.5 bg-transparent outline-none"
      />
    </form>
  );
};

export default TableSearch;
