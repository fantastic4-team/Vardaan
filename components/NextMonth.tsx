"use client";

import { useEffect, useState } from "react";

// Names the month after the visitor's current one (October -> November, December -> January).
// The page is statically built, so this is filled in on the client to stay current.
export default function NextMonth({ fallback = "next month" }: { fallback?: string }) {
  const [month, setMonth] = useState(fallback);

  useEffect(() => {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    setMonth(next.toLocaleString("en-US", { month: "long" }));
  }, []);

  return <>{month}</>;
}
