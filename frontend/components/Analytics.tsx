"use client";

import { useEffect } from "react";

export function Analytics() {
  useEffect(() => {
    // Analytics disabled or moved to local tracking
    console.log("Analytics initialized (Local Stub)");
  }, []);

  return null;
}
