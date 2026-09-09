import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Product } from "@/models/Product";
import { answerBuyerAssistant, MatchingProduceOption } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Please log in to consult Buyer Assistant" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const query = body.query;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: "Search query is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Extract search terms (e.g., "tomato", "onion", "chilli", "garlic")
    const words = query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !["need", "want", "looking", "require", "send", "give"].includes(w));

    const regexPattern = words.length > 0 ? words.join("|") : query.trim();

    // Query VERIFIED active products from MongoDB (Anti-Hallucination)
    // Note: Only populate seller name (not phone) to limit PII in Gemini context
    const rawProducts = await Product.find({
      status: "AVAILABLE",
      availableQuantity: { $gt: 0 },
      $or: [
        { name: { $regex: regexPattern, $options: "i" } },
        { variety: { $regex: regexPattern, $options: "i" } },
        { description: { $regex: regexPattern, $options: "i" } },
      ],
    })
      .populate("seller", "name")
      .limit(6)
      .lean();

    const matchingOptions: MatchingProduceOption[] = rawProducts.map((p) => {
      const sellerObj =
        p.seller && typeof p.seller === "object"
          ? (p.seller as { name?: string; phone?: string })
          : null;

      return {
        _id: p._id.toString(),
        name: p.name,
        variety: p.variety,
        farmerName: sellerObj?.name || p.sellerName || "Verified Local Producer",
        location: `${p.location?.district || "Nashik"}, ${p.location?.state || "Maharashtra"}`,
        price: p.price,
        availableQuantity: p.availableQuantity,
        unit: p.unit,
        qualityGrade: p.qualityGrade,
        minimumOrderQuantity: p.minimumOrderQuantity || 1,
      };
    });

    const response = await answerBuyerAssistant(matchingOptions, query);

    return NextResponse.json({
      success: true,
      summary: response.summary,
      matchingOptions: response.matchingOptions,
      isAiGenerated: response.isAiGenerated,
      modelUsed: response.modelUsed,
      query,
    });
  } catch (error: unknown) {
    console.error("Error in buyer procurement copilot:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process procurement search. Please try again." },
      { status: 500 }
    );
  }
}
