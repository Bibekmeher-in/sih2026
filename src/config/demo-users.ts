import { UserRole, USER_ROLES } from "@/types";

export const DEMO_PASSWORD = "Kisan@1234";

export interface DemoAccountInfo {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone: string;
  location: {
    district: string;
    state: string;
    pincode: string;
    address: string;
  };
  description: string;
}

export const DEMO_ACCOUNTS: DemoAccountInfo[] = [
  {
    name: "Ramesh Kumar",
    email: "farmer@example.com",
    password: DEMO_PASSWORD,
    role: USER_ROLES.FARMER,
    phone: "9822012345",
    location: {
      district: "Cuttack",
      state: "Odisha",
      pincode: "753001",
      address: "Village Badamba, Athagarh Block",
    },
    description: "Progressive vegetable grower cultivating Tomato, Cauliflower, and Onion.",
  },
  {
    name: "Odisha Farmers Producer Organization",
    email: "fpo@example.com",
    password: DEMO_PASSWORD,
    role: USER_ROLES.FPO,
    phone: "9823023456",
    location: {
      district: "Khordha",
      state: "Odisha",
      pincode: "751001",
      address: "APMC Complex, Baramunda",
    },
    description: "Federation of 450+ smallholder agriculture producers in Odisha.",
  },
  {
    name: "Bhubaneswar Fresh Foods",
    email: "buyer@example.com",
    password: DEMO_PASSWORD,
    role: USER_ROLES.BULK_BUYER,
    phone: "9824034567",
    location: {
      district: "Khordha",
      state: "Odisha",
      pincode: "751024",
      address: "Infocity Industrial Estate, Patia",
    },
    description: "Institutional food procurement enterprise supplying regional retail chains.",
  },
  {
    name: "Demo Consumer",
    email: "consumer@example.com",
    password: DEMO_PASSWORD,
    role: USER_ROLES.CONSUMER,
    phone: "9825045678",
    location: {
      district: "Khordha",
      state: "Odisha",
      pincode: "751003",
      address: "Flat 302, Niladri Vihar, Chandrasekharpur",
    },
    description: "Household consumer purchasing farm-fresh direct produce.",
  },
  {
    name: "KISANOVA Administrator",
    email: "admin@example.com",
    password: DEMO_PASSWORD,
    role: USER_ROLES.ADMIN,
    phone: "9826056789",
    location: {
      district: "Khordha",
      state: "Odisha",
      pincode: "751001",
      address: "Krishi Bhavan, Keshari Nagar",
    },
    description: "Platform administrator overseeing marketplace logistics, AI models, and fair prices.",
  },
  {
    name: "Bikash Mohanty",
    email: "delivery@example.com",
    password: DEMO_PASSWORD,
    role: USER_ROLES.DELIVERY_PARTNER,
    phone: "9827012345",
    location: {
      district: "Khordha",
      state: "Odisha",
      pincode: "751024",
      address: "Patia Square, Bhubaneswar",
    },
    description: "Verified delivery partner with Honda Activa (50kg capacity) operating in Bhubaneswar.",
  },
  {
    name: "Manoj Rout",
    email: "truck@example.com",
    password: DEMO_PASSWORD,
    role: USER_ROLES.DELIVERY_PARTNER,
    phone: "9828023456",
    location: {
      district: "Cuttack",
      state: "Odisha",
      pincode: "753001",
      address: "Badambadi Bus Stand Colony, Cuttack",
    },
    description: "Verified logistics transporter with Tata Ace Mini Truck (1000kg capacity) handling bulk farm gate dispatch.",
  },
];
