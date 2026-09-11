import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listComments, createComment } from "@/lib/fpo-community-service";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const comments = await listComments(id);
    return NextResponse.json({ success: true, comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    const message = (error as Error)?.message || "Failed to fetch comments";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Authentication required to comment" }, { status: 401 });
    }

    const body = await req.json();
    if (!body.content || !body.content.trim()) {
      return NextResponse.json({ message: "Comment content is required" }, { status: 400 });
    }

    const comment = await createComment(
      user.id,
      id,
      body.content,
      body.parentCommentId
    );

    return NextResponse.json({ success: true, comment }, { status: 201 });
  } catch (error) {
    console.error("Error adding comment:", error);
    const message = (error as Error)?.message || "Failed to add comment";
    return NextResponse.json({ message }, { status: 500 });
  }
}
