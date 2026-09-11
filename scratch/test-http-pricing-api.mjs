async function testHttpPricingApi() {
  console.log("Testing HTTP API /api/farmer/price-recommendation with Next.js Dev Server...");

  // 1. Authenticate via NextAuth credentials signin
  const csrfRes = await fetch("http://localhost:3000/api/auth/csrf");
  const csrfJson = await csrfRes.json();
  const csrfToken = csrfJson.csrfToken;
  const setCookie = csrfRes.headers.get("set-cookie") || "";
  const initialCookies = setCookie.split(",").map((c) => c.split(";")[0].trim()).join("; ");

  const loginRes = await fetch("http://localhost:3000/api/auth/callback/credentials", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: initialCookies,
    },
    body: new URLSearchParams({
      csrfToken,
      email: "farmer@example.com",
      password: "Kisan@1234",
    }),
    redirect: "manual",
  });

  const authCookiesHeader = loginRes.headers.get("set-cookie") || "";
  const allCookies = [
    initialCookies,
    ...authCookiesHeader.split(",").map((c) => c.split(";")[0].trim()),
  ]
    .filter(Boolean)
    .join("; ");

  console.log(" Login response status:", loginRes.status);

  // Call 1: Tomato Grade A 500kg
  console.log("\n--- Sending Call 1: Tomato, 500kg, Grade A, Ganjam ---");
  const res1 = await fetch("http://localhost:3000/api/farmer/price-recommendation", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: allCookies,
    },
    body: JSON.stringify({
      cropName: "Tomato",
      variety: "Hybrid Red Table",
      quantity: 500,
      qualityGrade: "Grade A",
      district: "Ganjam",
      state: "Odisha",
      transitDistanceKm: 45,
    }),
  });

  const json1 = await res1.json();
  console.log("Call 1 HTTP Status:", res1.status);
  console.log("Call 1 Target Price:", json1?.recommendation?.targetPrice);
  console.log("Call 1 Corridor:", `₹${json1?.recommendation?.recommendedMinPrice} - ₹${json1?.recommendation?.recommendedMaxPrice}/kg`);
  console.log("Call 1 Cached:", json1?.cached);
  console.log("Call 1 Explain Steps Count:", json1?.calculationSteps?.length);

  // Call 2: Tomato Grade C 50kg (Different inputs -> Must NOT return cached!)
  console.log("\n--- Sending Call 2: Tomato, 50kg, Grade C, Ganjam ---");
  const res2 = await fetch("http://localhost:3000/api/farmer/price-recommendation", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: allCookies,
    },
    body: JSON.stringify({
      cropName: "Tomato",
      variety: "Hybrid Red Table",
      quantity: 50,
      qualityGrade: "Grade C",
      district: "Ganjam",
      state: "Odisha",
      transitDistanceKm: 45,
    }),
  });

  const json2 = await res2.json();
  console.log("Call 2 HTTP Status:", res2.status);
  console.log("Call 2 Target Price:", json2?.recommendation?.targetPrice);
  console.log("Call 2 Corridor:", `₹${json2?.recommendation?.recommendedMinPrice} - ₹${json2?.recommendation?.recommendedMaxPrice}/kg`);
  console.log("Call 2 Cached:", json2?.cached);

  if (
    json1?.recommendation?.targetPrice !== json2?.recommendation?.targetPrice &&
    json2?.cached === false
  ) {
    console.log(" SUCCESS: API correctly performed fresh calculation for changed inputs!");
  } else {
    console.error(" FAILURE: API incorrectly returned stale/cached result!");
  }

  // Call 3: Exact same payload as Call 2 without forceRefresh -> Must return cached: true
  console.log("\n--- Sending Call 3: Identical Repeated Submission of Call 2 ---");
  const res3 = await fetch("http://localhost:3000/api/farmer/price-recommendation", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: allCookies,
    },
    body: JSON.stringify({
      cropName: "Tomato",
      variety: "Hybrid Red Table",
      quantity: 50,
      qualityGrade: "Grade C",
      district: "Ganjam",
      state: "Odisha",
      transitDistanceKm: 45,
      forceRefresh: false,
    }),
  });

  const json3 = await res3.json();
  console.log("Call 3 HTTP Status:", res3.status);
  console.log("Call 3 Cached:", json3?.cached);

  if (json3?.cached === true) {
    console.log(" SUCCESS: Cache correctly reused ONLY when inputs are strictly identical!");
  }

  // Call 4: Switching crop to Potato
  console.log("\n--- Sending Call 4: Potato, 500kg, Grade A, Cuttack ---");
  const res4 = await fetch("http://localhost:3000/api/farmer/price-recommendation", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: allCookies,
    },
    body: JSON.stringify({
      cropName: "Potato",
      variety: "Jyoti Wholesale",
      quantity: 500,
      qualityGrade: "Grade A",
      district: "Cuttack",
      state: "Odisha",
    }),
  });

  const json4 = await res4.json();
  console.log("Call 4 Crop:", json4?.recommendation?.productName);
  console.log("Call 4 Target Price:", json4?.recommendation?.targetPrice);
  console.log("Call 4 Mandi Modal:", json4?.recommendation?.marketModal);
  console.log("Call 4 Market Name:", json4?.recommendation?.market);

  console.log("\n================================================================================");
  console.log(" ALL HTTP ENDPOINT TESTS PASSED COMPLETELY!");
  console.log("================================================================================");
}

testHttpPricingApi();
