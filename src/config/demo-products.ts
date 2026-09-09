export interface MarketProduct {
  _id: string;
  name: string;
  hindiName?: string;
  variety: string;
  category: {
    _id: string;
    name: string;
    slug: string;
  };
  sellerName: string;
  sellerType: "User" | "FarmerProfile" | "FPO";
  description: string;
  price: number;
  mandiBenchmarkPrice: number;
  unit: "kg" | "quintal" | "ton" | "crate";
  availableQuantity: number;
  minimumOrderQuantity: number;
  qualityGrade: "Grade A" | "Grade B" | "Premium Organic";
  harvestDate: string;
  location: {
    district: string;
    state: string;
    pincode?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  images: string[];
  status: "AVAILABLE" | "LOW_STOCK" | "OUT_OF_STOCK";
}

export const DEMO_MARKETPLACE_PRODUCTS: MarketProduct[] = [
  {
    _id: "prod_tomato_01",
    name: "Hybrid Red Table Tomato",
    hindiName: "Tamatar",
    variety: "Abhinav 1057",
    category: {
      _id: "cat_veg_01",
      name: "Fresh Vegetables",
      slug: "vegetables",
    },
    sellerName: "Ramesh Kumar",
    sellerType: "FarmerProfile",
    description:
      "Uniform deep red color, firm pulp with high brix sweetness. Harvested at pink stage for maximum transit shelf life. Zero synthetic chemical residues.",
    price: 24,
    mandiBenchmarkPrice: 16,
    unit: "kg",
    availableQuantity: 10500,
    minimumOrderQuantity: 10,
    qualityGrade: "Grade A",
    harvestDate: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    location: {
      district: "Cuttack",
      state: "Odisha",
      pincode: "753001",
      coordinates: { latitude: 20.4625, longitude: 85.8828 },
    },
    images: ["/crops/tomato.jpg"],
    status: "AVAILABLE",
  },
  {
    _id: "prod_potato_02",
    name: "Kufri Jyoti Table Potato",
    hindiName: "Aloo",
    variety: "Kufri Jyoti",
    category: {
      _id: "cat_veg_01",
      name: "Fresh Vegetables",
      slug: "vegetables",
    },
    sellerName: "Ramesh Kumar",
    sellerType: "FarmerProfile",
    description:
      "Oval cream-flesh potatoes with smooth thin skin. High dry matter ideal for everyday culinary preparation with long storage life.",
    price: 18,
    mandiBenchmarkPrice: 13,
    unit: "kg",
    availableQuantity: 25000,
    minimumOrderQuantity: 15,
    qualityGrade: "Grade A",
    harvestDate: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    location: {
      district: "Cuttack",
      state: "Odisha",
      pincode: "753001",
      coordinates: { latitude: 20.4625, longitude: 85.8828 },
    },
    images: ["/crops/potato.jpg"],
    status: "AVAILABLE",
  },
  {
    _id: "prod_onion_03",
    name: "Sukinda Medium Red Onion",
    hindiName: "Pyaaz",
    variety: "Gavran Summer Red",
    category: {
      _id: "cat_veg_01",
      name: "Fresh Vegetables",
      slug: "vegetables",
    },
    sellerName: "Odisha Farmers Producer Organization",
    sellerType: "FPO",
    description:
      "Naturally cured under ambient ventilated sheds. Standard 45-55mm grading with 3 outer protective skin layers. High pungency and long transit tolerance.",
    price: 28,
    mandiBenchmarkPrice: 21,
    unit: "kg",
    availableQuantity: 35000,
    minimumOrderQuantity: 25,
    qualityGrade: "Grade A",
    harvestDate: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    location: {
      district: "Jajpur",
      state: "Odisha",
      pincode: "755018",
      coordinates: { latitude: 20.9547, longitude: 85.9123 },
    },
    images: ["/crops/onion.jpg"],
    status: "AVAILABLE",
  },
  {
    _id: "prod_rice_04",
    name: "Pusa 1121 Premium Basmati Rice",
    hindiName: "Basmati Chawal",
    variety: "Pusa 1121 Steam Milled",
    category: {
      _id: "cat_grain_03",
      name: "Grains & Cereals",
      slug: "grains-cereals",
    },
    sellerName: "Odisha Farmers Producer Organization",
    sellerType: "FPO",
    description:
      "Extra-long slender aromatic grains. Steam-milled and cured for optimum elongation, non-sticky cooking, and rich natural fragrance.",
    price: 82,
    mandiBenchmarkPrice: 70,
    unit: "kg",
    availableQuantity: 18000,
    minimumOrderQuantity: 25,
    qualityGrade: "Premium Organic",
    harvestDate: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString(),
    location: {
      district: "Sambalpur",
      state: "Odisha",
      pincode: "768001",
      coordinates: { latitude: 21.4669, longitude: 83.9812 },
    },
    images: ["/crops/basmati.jpg"],
    status: "AVAILABLE",
  },
  {
    _id: "prod_cauliflower_05",
    name: "Snowball Fresh Cauliflower",
    hindiName: "Phool Gobhi",
    variety: "Snowball 16",
    category: {
      _id: "cat_veg_01",
      name: "Fresh Vegetables",
      slug: "vegetables",
    },
    sellerName: "Ramesh Kumar",
    sellerType: "FarmerProfile",
    description:
      "Compact snowball-white curds jacketed in crisp outer leaves. Crisp texture, freshly harvested early morning for maximum farm-to-table crunch.",
    price: 22,
    mandiBenchmarkPrice: 15,
    unit: "kg",
    availableQuantity: 8000,
    minimumOrderQuantity: 10,
    qualityGrade: "Grade A",
    harvestDate: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    location: {
      district: "Cuttack",
      state: "Odisha",
      pincode: "753001",
      coordinates: { latitude: 20.4625, longitude: 85.8828 },
    },
    images: ["/crops/cauliflower.jpg"],
    status: "AVAILABLE",
  },
];
