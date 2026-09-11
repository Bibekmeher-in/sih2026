/**
 * Geolocation & Reverse Geocoding Utility
 * Provides privacy masking and approximate location resolution
 */

export interface GeocodedAddress {
  addressLine?: string;
  district: string;
  state: string;
  pincode: string;
  formattedAddress: string;
}

// Fallback known reference points in Odisha for offline demo resilience
const KNOWN_ODISHA_DISTRICTS: Record<string, { lat: number; lng: number; district: string; state: string; pincode: string }> = {
  bhubaneswar: { lat: 20.2961, lng: 85.8245, district: "Khordha", state: "Odisha", pincode: "751001" },
  cuttack: { lat: 20.4625, lng: 85.8828, district: "Cuttack", state: "Odisha", pincode: "753001" },
  puri: { lat: 19.8135, lng: 85.8312, district: "Puri", state: "Odisha", pincode: "752001" },
  berhampur: { lat: 19.3149, lng: 84.7941, district: "Ganjam", state: "Odisha", pincode: "760001" },
  sambalpur: { lat: 21.4669, lng: 83.9812, district: "Sambalpur", state: "Odisha", pincode: "768001" },
  jajpur: { lat: 20.9547, lng: 85.9123, district: "Jajpur", state: "Odisha", pincode: "755018" },
  balasore: { lat: 21.4934, lng: 86.9135, district: "Balasore", state: "Odisha", pincode: "756001" },
  rourkela: { lat: 22.2604, lng: 84.8536, district: "Sundargarh", state: "Odisha", pincode: "769001" },
};

/**
 * Mask coordinates to ~1.1km approximate precision for public profiles & marketplace
 * Never expose precise user doorstep or farm coordinates to unrelated public users
 */
export function maskCoordinatesForPublic(latitude: number, longitude: number): { latitude: number; longitude: number } {
  return {
    latitude: Math.round(latitude * 100) / 100,
    longitude: Math.round(longitude * 100) / 100,
  };
}

/**
 * Approximate distance in kilometers
 */
export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Reverse geocode coordinates to human-readable address
 * Uses free Nominatim API with timeout and robust fallback
 */
export async function reverseGeocodeCoordinates(
  latitude: number,
  longitude: number
): Promise<GeocodedAddress> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          "User-Agent": "KisanDirect-AgriPlatform/1.0",
        },
      }
    );

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};

      const district =
        addr.state_district ||
        addr.district ||
        addr.county ||
        addr.city ||
        "Khordha";

      const state = addr.state || "Odisha";
      const pincode = addr.postcode || "751001";
      const locality = addr.suburb || addr.neighbourhood || addr.village || addr.road || "";

      return {
        addressLine: locality ? `${locality}, ${district}` : `${district}`,
        district,
        state,
        pincode,
        formattedAddress: `${district}, ${state}`,
      };
    }
  } catch {
    // Network or timeout error — proceed to distance matching fallback
  }

  // Nearest fallback from reference points
  let closestDistrict = "Khordha";
  let closestPincode = "751001";
  let minDistance = Infinity;

  for (const [key, point] of Object.entries(KNOWN_ODISHA_DISTRICTS)) {
    const dist = getDistanceKm(latitude, longitude, point.lat, point.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closestDistrict = point.district;
      closestPincode = point.pincode;
    }
  }

  return {
    addressLine: `${closestDistrict} Region`,
    district: closestDistrict,
    state: "Odisha",
    pincode: closestPincode,
    formattedAddress: `${closestDistrict}, Odisha`,
  };
}
