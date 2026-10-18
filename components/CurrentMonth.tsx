"use client";

import { useEffect, useState } from "react";

// The page is statically built, so the month is filled in on the client to stay current.
export default function CurrentMonth({ fallback = "this month" }: { fallback?: string }) {
  const [month, setMonth] = useState(fallback);

  useEffect(() => {
    setMonth(new Date().toLocaleString("en-US", { month: "long" }));
  }, []);

  return <>{month}</>;
}
