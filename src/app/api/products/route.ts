import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const search = searchParams.get("search")?.trim() || "";
  const categoryParam = searchParams.get("category")?.trim() || "";
  const sellerType = searchParams.get("sellerType")?.trim() || "";
  const state = searchParams.get("state")?.trim() || "";
  const grade = searchParams.get("grade")?.trim() || "";
  const minPrice = parseFloat(searchParams.get("minPrice") || "0");
  const maxPrice = parseFloat(searchParams.get("maxPrice") || "100000");
  const sort = searchParams.get("sort") || "newest";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "12", 10)));

  try {
    await connectToDatabase();

    // Build MongoDB query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { hindiName: { $regex: search, $options: "i" } },
        { variety: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { "location.district": { $regex: search, $options: "i" } },
      ];
    }

    if (categoryParam && categoryParam !== "all") {
      const catDoc = await Category.findOne({
        $or: [{ slug: categoryParam }, { _id: categoryParam.match(/^[0-9a-fA-F]{24}$/) ? categoryParam : null }],
      }).lean();

      if (catDoc) {
        query.category = catDoc._id;
      }
    }

    if (sellerType && sellerType !== "all") {
      if (sellerType === "FPO") {
        query.sellerType = "FPO";
      } else if (sellerType === "FARMER" || sellerType === "FarmerProfile") {
        query.sellerType = { $in: ["User", "FarmerProfile"] };
      }
    }

    if (state && state !== "all") {
      query["location.state"] = { $regex: state, $options: "i" };
    }

    if (grade && grade !== "all") {
      query.qualityGrade = grade;
    }

    if (minPrice > 0 || maxPrice < 100000) {
      query.price = { $gte: minPrice, $lte: maxPrice };
    }

    // Sort order
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sortObj: any = {};
    if (sort === "price_asc") sortObj.price = 1;
    else if (sort === "price_desc") sortObj.price = -1;
    else if (sort === "availability_desc") sortObj.availableQuantity = -1;
    else sortObj.harvestDate = -1;

    const totalCount = await Product.countDocuments(query);

    if (totalCount > 0) {
      const skip = (page - 1) * limit;
      const products = await Product.find(query)
        .populate("category", "name slug icon")
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean();

      return NextResponse.json({
        success: true,
        products,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
        },
        source: "database",
      });
    }
    // Empty result — no matching produce in database
    return NextResponse.json({
      success: true,
      products: [],
      pagination: {
        total: 0,
        page,
        limit,
        totalPages: 0,
      },
      source: "database",
    });
  } catch (error) {
    console.error("MongoDB query failed:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
