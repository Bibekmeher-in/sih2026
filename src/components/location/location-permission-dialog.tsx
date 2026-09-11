"use client";

import React from "react";
import { MapPin, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LocationPermissionDialogProps {
  open: boolean;
  onAllow: () => void;
  onManual: () => void;
  onClose: () => void;
}

export function LocationPermissionDialog({
  open,
  onAllow,
  onManual,
  onClose,
}: LocationPermissionDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-full p-1"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <MapPin className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Use Your Location</h3>
            <p className="text-xs text-slate-500">Enhanced farm-to-door delivery</p>
          </div>
        </div>

        <div className="space-y-2 rounded-2xl bg-slate-50 p-4 border border-slate-100 text-xs text-slate-700">
          <p className="font-semibold text-slate-900">Your location helps us:</p>
          <ul className="space-y-1.5 text-slate-600">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Find nearby smallholder farmers &amp; fresh produce</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Suggest optimal logistics &amp; cold-chain delivery options</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Autofill your doorstep delivery address accurately</span>
            </li>
          </ul>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          We never track your live device in the background, and we never expose your exact coordinates publicly.
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <Button
            onClick={() => {
              onClose();
              onAllow();
            }}
            className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs py-2.5 shadow-xs"
          >
            Allow Location Access
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              onClose();
              onManual();
            }}
            className="flex-1 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs py-2.5"
          >
            Enter Address Manually
          </Button>
        </div>
      </div>
    </div>
  );
}
