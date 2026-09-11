import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { toggleLikePost } from "@/lib/fpo-community-service";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const result = await toggleLikePost(user.id, id);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Error toggling post like:", error);
    const message = (error as Error)?.message || "Failed to like post";
    return NextResponse.json({ message }, { status: 500 });
  }
}
