import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import "@/models";
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

    // Build search terms — strip common query and unit stop words
    const stopWords = new Set([
      "need", "want", "looking", "require", "send", "give",
      "buy", "get", "find", "search", "show", "for", "some",
      "any", "please", "the", "and", "under", "below", "less",
      "than", "above", "over", "more", "max", "min", "price",
      "rate", "cost", "kg", "quintal", "ton", "tonne", "per", "at",
      "upto", "up", "to", "with", "available"
    ]);

    // Detect numeric price filters like "under 30", "below ₹35", "max 40"
    const maxPriceMatch = query.match(/(?:under|below|less than|max|within|upto|up to|<)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)/i);
    const minPriceMatch = query.match(/(?:above|over|more than|min|minimum|>)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)/i);

    const words = query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w) && isNaN(Number(w)));

    const filter: Record<string, unknown> = {
      status: { $in: ["AVAILABLE", "LOW_STOCK"] },
      availableQuantity: { $gt: 0 },
    };

    const priceCondition: Record<string, number> = {};
    if (maxPriceMatch) {
      priceCondition.$lte = parseFloat(maxPriceMatch[1]);
    }
    if (minPriceMatch) {
      priceCondition.$gte = parseFloat(minPriceMatch[1]);
    }
    if (Object.keys(priceCondition).length > 0) {
      filter.price = priceCondition;
    }

    if (words.length > 0) {
      const stemmed = words.map((w) => {
        if (w.endsWith("es") && w.length > 4) return w.slice(0, -2);
        if (w.endsWith("s") && w.length > 3) return w.slice(0, -1);
        return w;
      });
      const pattern = Array.from(new Set([...words, ...stemmed])).join("|");
      filter.$or = [
        { name: { $regex: pattern, $options: "i" } },
        { variety: { $regex: pattern, $options: "i" } },
        { description: { $regex: pattern, $options: "i" } },
      ];
    }

    // Query ONLY verified, active products from MongoDB (anti-hallucination grounding)
    const rawProducts = await Product.find(filter)
      .populate("seller", "name")
      .limit(6)
      .lean();

    const matchingOptions: MatchingProduceOption[] = rawProducts.map((p) => {
      const sellerObj =
        p.seller && typeof p.seller === "object"
          ? (p.seller as { name?: string })
          : null;

      return {
        _id: p._id.toString(),
        name: p.name,
        variety: p.variety,
        farmerName: sellerObj?.name ?? p.sellerName ?? "Verified Local Producer",
        location: `${p.location?.district ?? "Nashik"}, ${p.location?.state ?? "Maharashtra"}`,
        price: p.price,
        availableQuantity: p.availableQuantity,
        unit: p.unit,
        qualityGrade: p.qualityGrade,
        minimumOrderQuantity: p.minimumOrderQuantity ?? 1,
      };
    });

    const response = await answerBuyerAssistant(matchingOptions, query);

    const totalAvailable = matchingOptions.reduce((acc, curr) => acc + (curr.availableQuantity || 0), 0);

    return NextResponse.json({
      success: true,
      summary: response.summary,
      answer: response.summary,
      matchingOptions: response.matchingOptions,
      matchedProducts: (response.matchingOptions || []).map((m) => ({
        id: m._id,
        name: m.name,
        category: "Produce",
        price: m.price,
        unit: m.unit,
        availableQuantity: m.availableQuantity,
        minimumOrderQuantity: m.minimumOrderQuantity,
        qualityGrade: m.qualityGrade,
        location: {
          district: m.location.split(",")[0]?.trim() || "Odisha",
          state: m.location.split(",")[1]?.trim() || "India",
        },
        sellerName: m.farmerName,
      })),
      totalAvailableInMarket: totalAvailable,
      isAiGenerated: response.isAiGenerated,
      modelUsed: response.modelUsed,
      model: response.modelUsed,
      source: response.isAiGenerated ? "Gemini AI" : "Verified Database",
      ...(response.errorCode && { errorCode: response.errorCode }),
      query,
    });
  } catch (error: unknown) {
    console.error("[Buyer AI Assistant] Unhandled error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process procurement search. Please try again." },
      { status: 500 }
    );
  }
}
