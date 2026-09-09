export const siteConfig = {
  name: "Kisanova",
  shortName: "Kisanova",
  description:
    "India's premier direct agricultural trade network connecting farmers and FPOs directly with consumers and bulk buyers.",
  url: "https://kisanova.in",
  navItems: [
    { label: "About Problem", href: "#problem" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "For Farmers & FPOs", href: "#farmers" },
    { label: "For Buyers", href: "#buyers" },
    { label: "AI Engine", href: "#ai" },
    { label: "Logistics", href: "#logistics" },
    { label: "Live Produce", href: "#marketplace-preview" },
  ],
  roles: [
    { id: "farmer", label: "Farmer Portal", path: "/farmer", description: "List produce, check AI mandi rates, track earnings" },
    { id: "fpo", label: "FPO Hub", path: "/fpo", description: "Aggregate harvests, manage multi-member bulk supply" },
    { id: "buyer", label: "Bulk Buyer", path: "/bulk-buyer", description: "Procure by quintals/tons directly from verified growers" },
    { id: "consumer", label: "Consumer Market", path: "/consumer", description: "Farm-fresh produce delivered within hours" },
    { id: "admin", label: "Admin Console", path: "/admin", description: "Fleet logistics, price benchmarks, dispute resolution" },
  ],
  contacts: {
    supportEmail: "support@kisanova.in",
    helpline: "1800-KISANOVA",
  },
};

export type SiteConfig = typeof siteConfig;
