/**
 * Phase 12 — Notifications & UX Polish Test Suite
 * Run: node scratch/test-phase12-notifications.mjs
 */

import { existsSync, readFileSync } from "fs";
import path from "path";

const BASE = "d:/sih2026/src";
const results = [];

function pass(name) {
  results.push({ name, passed: true });
}

function fail(name, err) {
  results.push({ name, passed: false, error: err.message || String(err) });
}

function fileExists(relPath) {
  return existsSync(path.join(BASE, relPath));
}

function readFile(relPath) {
  return readFileSync(path.join(BASE, relPath), "utf-8");
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || "Assertion failed");
}

// ── Test 1 ────────────────────────────────────────────────────────────────────
try {
  assert(fileExists("app/api/notifications/route.ts"), "Missing: app/api/notifications/route.ts");
  pass("Notification API route exists");
} catch (e) { fail("Notification API route exists", e); }

// ── Test 2 ────────────────────────────────────────────────────────────────────
try {
  assert(
    fileExists("app/api/notifications/[id]/route.ts"),
    "Missing: app/api/notifications/[id]/route.ts"
  );
  pass("Individual notification [id] route exists");
} catch (e) { fail("Individual notification [id] route exists", e); }

// ── Test 3 ────────────────────────────────────────────────────────────────────
try {
  assert(fileExists("components/shared/notification-bell.tsx"), "Missing: notification-bell.tsx");
  const content = readFile("components/shared/notification-bell.tsx");
  assert(content.includes("aria-label"), "Missing aria-label in NotificationBell");
  assert(content.includes("aria-haspopup"), "Missing aria-haspopup");
  assert(content.includes("unreadCount"), "Missing unreadCount logic");
  assert(content.includes("Mark all read"), "Missing mark-all-read button");
  assert(content.includes("all caught up"), "Missing empty state message");
  pass("NotificationBell component has accessibility + key features");
} catch (e) { fail("NotificationBell component has accessibility + key features", e); }

// ── Test 4 ────────────────────────────────────────────────────────────────────
try {
  assert(fileExists("components/providers/toast-provider.tsx"), "Missing: toast-provider.tsx");
  const content = readFile("components/providers/toast-provider.tsx");
  assert(content.includes("export function ToastProvider"), "Missing ToastProvider export");
  assert(content.includes("export function useToast"), "Missing useToast export");
  assert(content.includes("aria-live"), "Missing aria-live for accessibility");
  assert(content.includes("auto-dismiss") || content.includes("setTimeout"), "Missing auto-dismiss timer");
  pass("ToastProvider exports useToast with a11y aria-live region");
} catch (e) { fail("ToastProvider exports useToast with a11y aria-live region", e); }

// ── Test 5 ────────────────────────────────────────────────────────────────────
try {
  assert(fileExists("components/ui/skeleton.tsx"), "Missing: skeleton.tsx");
  assert(fileExists("components/ui/skeletons.tsx"), "Missing: skeletons.tsx");
  const presets = readFile("components/ui/skeletons.tsx");
  assert(presets.includes("DashboardSkeleton"), "Missing DashboardSkeleton preset");
  assert(presets.includes("TableSkeleton"), "Missing TableSkeleton preset");
  assert(presets.includes("ProductGridSkeleton"), "Missing ProductGridSkeleton preset");
  pass("Skeleton components exist with DashboardSkeleton, TableSkeleton, ProductGridSkeleton");
} catch (e) { fail("Skeleton components exist with DashboardSkeleton, TableSkeleton, ProductGridSkeleton", e); }

// ── Test 6 ────────────────────────────────────────────────────────────────────
try {
  assert(fileExists("components/ui/empty-state.tsx"), "Missing: empty-state.tsx");
  const content = readFile("components/ui/empty-state.tsx");
  assert(content.includes("export function EmptyState"), "Missing EmptyState export");
  assert(content.includes("action"), "Missing action prop for CTA");
  pass("EmptyState component exists with action CTA support");
} catch (e) { fail("EmptyState component exists with action CTA support", e); }

// ── Test 7 ────────────────────────────────────────────────────────────────────
try {
  assert(fileExists("components/ui/error-display.tsx"), "Missing: error-display.tsx");
  const content = readFile("components/ui/error-display.tsx");
  assert(content.includes("role=\"alert\""), "Missing role=alert for accessibility");
  assert(!content.toLowerCase().includes("stacktrace"), "ErrorDisplay should not expose stack traces");
  assert(content.includes("retry"), "Missing retry prop");
  pass("ErrorDisplay component has role=alert, retry, no stack traces");
} catch (e) { fail("ErrorDisplay component has role=alert, retry, no stack traces", e); }

// ── Test 8 ────────────────────────────────────────────────────────────────────
try {
  const routes = [
    "app/farmer/dashboard/loading.tsx",
    "app/farmer/products/loading.tsx",
    "app/farmer/orders/loading.tsx",
    "app/consumer/dashboard/loading.tsx",
    "app/consumer/orders/loading.tsx",
    "app/admin/dashboard/loading.tsx",
    "app/buyer/dashboard/loading.tsx",
  ];
  for (const r of routes) {
    assert(fileExists(r), `Missing loading.tsx: ${r}`);
  }
  pass("Loading.tsx files exist for all 7 key routes");
} catch (e) { fail("Loading.tsx files exist for all 7 key routes", e); }

// ── Test 9 ────────────────────────────────────────────────────────────────────
try {
  const layouts = [
    "app/farmer/layout.tsx",
    "app/consumer/layout.tsx",
    "app/buyer/layout.tsx",
    "app/admin/layout.tsx",
  ];
  for (const l of layouts) {
    const content = readFile(l);
    assert(content.includes("NotificationBell"), `NotificationBell not found in ${l}`);
  }
  pass("NotificationBell integrated in all 4 portal layouts");
} catch (e) { fail("NotificationBell integrated in all 4 portal layouts", e); }

// ── Test 10 ───────────────────────────────────────────────────────────────────
try {
  const content = readFile("app/layout.tsx");
  assert(content.includes("ToastProvider"), "ToastProvider not found in root layout");
  pass("Root layout wraps app in ToastProvider");
} catch (e) { fail("Root layout wraps app in ToastProvider", e); }

// ── Test 11 ───────────────────────────────────────────────────────────────────
try {
  const content = readFile("app/globals.css");
  assert(content.includes(":focus-visible"), "Missing :focus-visible rule");
  assert(content.includes("animate-pulse"), "Missing animate-pulse keyframe");
  assert(content.includes("scrollbar-none"), "Missing .scrollbar-none utility");
  assert(content.includes("slideInFromBottom"), "Missing toast slide-in animation");
  pass("globals.css has focus-visible, pulse, scrollbar-none, toast animations");
} catch (e) { fail("globals.css has focus-visible, pulse, scrollbar-none, toast animations", e); }

// ── Test 12 ───────────────────────────────────────────────────────────────────
try {
  const content = readFile("app/farmer/dashboard/page.tsx");
  assert(content.includes("DashboardSkeleton"), "Missing DashboardSkeleton");
  assert(content.includes("ErrorDisplay"), "Missing ErrorDisplay");
  assert(content.includes("setError"), "Missing error state management");
  pass("Farmer dashboard uses DashboardSkeleton and ErrorDisplay with error state");
} catch (e) { fail("Farmer dashboard uses DashboardSkeleton and ErrorDisplay with error state", e); }

// ── Test 13 ───────────────────────────────────────────────────────────────────
try {
  const content = readFile("app/farmer/orders/page.tsx");
  assert(content.includes("TableSkeleton"), "Missing TableSkeleton");
  assert(content.includes("ErrorDisplay"), "Missing ErrorDisplay");
  assert(content.includes("EmptyState"), "Missing EmptyState");
  assert(content.includes("retry={loadOrders}"), "Missing retry callback");
  pass("Farmer orders page uses TableSkeleton, ErrorDisplay, EmptyState with retry");
} catch (e) { fail("Farmer orders page uses TableSkeleton, ErrorDisplay, EmptyState with retry", e); }

// ── Print results ──────────────────────────────────────────────────────────────
const passed = results.filter((r) => r.passed);
const failed = results.filter((r) => !r.passed);

console.log("\n╔══════════════════════════════════════════════════════╗");
console.log("║   Phase 12 — Notifications & UX Polish Test Suite   ║");
console.log("╚══════════════════════════════════════════════════════╝\n");

for (const t of results) {
  console.log(`${t.passed ? "✅" : "❌"} ${t.name}${t.error ? `\n   → ${t.error}` : ""}`);
}

console.log(`\n──────────────────────────────────────────────────────`);
console.log(`Passed: ${passed.length} / ${results.length}`);
if (failed.length > 0) {
  console.log(`Failed: ${failed.length}`);
  process.exit(1);
} else {
  console.log("All tests passed ✨");
}
