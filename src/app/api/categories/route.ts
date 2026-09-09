import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Category } from "@/models/Category";

export const dynamic = "force-dynamic";

const FALLBACK_CATEGORIES = [
  {
    _id: "cat_veg_01",
    name: "Fresh Vegetables",
    slug: "vegetables",
    description: "Farm-harvested green, root, and table vegetables",
    icon: "Carrot",
  },
  {
    _id: "cat_fruit_02",
    name: "Fresh Fruits",
    slug: "fruits",
    description: "Orchard-fresh seasonal and tropical fruits",
    icon: "Apple",
  },
  {
    _id: "cat_grain_03",
    name: "Grains & Cereals",
    slug: "grains-cereals",
    description: "Basmati paddy, wheat, maize, and millets directly from growers",
    icon: "Wheat",
  },
  {
    _id: "cat_spice_04",
    name: "Spices & Condiments",
    slug: "spices",
    description: "Authentic dried chillies, turmeric, and whole spices",
    icon: "Flame",
  },
  {
    _id: "cat_pulse_05",
    name: "Pulses & Lentils",
    slug: "pulses",
    description: "Arhar, chana, moong, and urad dals from farm clusters",
    icon: "CircleDot",
  },
];

export async function GET() {
  try {
    await connectToDatabase();
    const categories = await Category.find({ isActive: true }).sort({ name: 1 }).lean();

    if (categories && categories.length > 0) {
      return NextResponse.json({
        success: true,
        categories,
      });
    }

    return NextResponse.json({
      success: true,
      categories: FALLBACK_CATEGORIES,
    });
  } catch {
    return NextResponse.json({
      success: true,
      categories: FALLBACK_CATEGORIES,
    });
  }
}
