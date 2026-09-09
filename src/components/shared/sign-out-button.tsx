"use client";

import React from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-red-700 hover:border-red-200"
    >
      <LogOut className="h-3.5 w-3.5" />
      <span>Sign Out</span>
    </Button>
  );
}
