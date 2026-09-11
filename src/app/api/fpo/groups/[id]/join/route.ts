import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { joinGroup } from "@/lib/fpo-community-service";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Authentication required to join group" }, { status: 401 });
    }

    const result = await joinGroup(user.id, id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error joining group:", error);
    const message = (error as Error)?.message || "Failed to join group";
    return NextResponse.json({ message }, { status: 400 });
  }
}
