import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listPosts, createPost } from "@/lib/fpo-community-service";
import { CommunityPostType } from "@/models";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId") || undefined;
    const productName = searchParams.get("productName") || undefined;
    const postType = (searchParams.get("postType") as CommunityPostType) || undefined;
    const search = searchParams.get("search") || undefined;
    const limit = parseInt(searchParams.get("limit") || "25", 10);

    const posts = await listPosts({
      groupId,
      productName,
      postType,
      search,
      limit,
    });

    return NextResponse.json({ success: true, posts });
  } catch (error) {
    console.error("Error listing community posts:", error);
    const message = (error as Error)?.message || "Failed to list community posts";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Authentication required to post" }, { status: 401 });
    }

    const body = await req.json();
    if (!body.content || !body.content.trim()) {
      return NextResponse.json(
        { message: "Post content is required" },
        { status: 400 }
      );
    }

    const post = await createPost(user.id, body);
    return NextResponse.json({ success: true, post }, { status: 201 });
  } catch (error) {
    console.error("Error creating community post:", error);
    const message = (error as Error)?.message || "Failed to create post";
    return NextResponse.json({ message }, { status: 500 });
  }
}
