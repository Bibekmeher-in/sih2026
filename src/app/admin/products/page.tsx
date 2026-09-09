import { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { AdminProductsClient } from "@/components/admin/products-client";

export const metadata: Metadata = {
  title: "Produce Catalog Moderation | KISANOVA Admin",
  description: "Live Farm Lot Inspection & Marketplace Moderation Console",
};

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  await requireRole([USER_ROLES.ADMIN]);

  return <AdminProductsClient />;
}
