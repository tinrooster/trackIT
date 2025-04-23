"use client"

    import { useEffect } from "react";

    export function DebugInfo({ data, name = "Debug" }: { data: any, name?: string }) {
      useEffect(() => {
        console.log(`${name} data:`, data);
      }, [data, name]);

      return null; // This component doesn't render anything, just logs
    }