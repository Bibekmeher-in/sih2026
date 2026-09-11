import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listGroups, createGroup } from "@/lib/fpo-community-service";
import { GroupPrivacy } from "@/models";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;
    const product = searchParams.get("product") || undefined;
    const district = searchParams.get("district") || undefined;
    const search = searchParams.get("search") || undefined;
    const privacy = (searchParams.get("privacy") as GroupPrivacy) || undefined;

    const groups = await listGroups({
      category,
      product,
      district,
      search,
      privacy,
    });

    return NextResponse.json({ success: true, groups });
  } catch (error) {
    console.error("Error listing farmer groups:", error);
    const message = (error as Error)?.message || "Failed to list farmer groups";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { message: "Authentication required to create a group" },
        { status: 401 }
      );
    }

    const body = await req.json();
    if (!body.name || !body.product || !body.district || !body.state) {
      return NextResponse.json(
        { message: "Name, product, district, and state are required" },
        { status: 400 }
      );
    }

    const group = await createGroup(user.id, body);
    return NextResponse.json({ success: true, group }, { status: 201 });
  } catch (error) {
    console.error("Error creating farmer group:", error);
    const message = (error as Error)?.message || "Failed to create farmer group";
    return NextResponse.json({ message }, { status: 500 });
  }
}
