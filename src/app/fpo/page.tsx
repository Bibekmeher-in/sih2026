import React from "react";
import { requireRole } from "@/lib/auth";
import { USER_ROLES } from "@/types";
import { getFpoDashboardData } from "@/lib/fpo-community-service";
import { FpoHubClient } from "@/components/fpo/fpo-hub-client";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function FPODashboardPage(props: PageProps) {
  const user = await requireRole([USER_ROLES.FPO, USER_ROLES.FARMER, USER_ROLES.ADMIN]);
  const searchParams = props.searchParams ? await props.searchParams : undefined;
  const initialTab = (searchParams?.tab as string) || "overview";

  const dashboardData = await getFpoDashboardData(user.id, user.role);

  return (
    <FpoHubClient
      user={user}
      initialDashboard={dashboardData}
      initialTab={initialTab}
    />
  );
}
