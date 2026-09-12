const BASE_URL = "http://localhost:3000";

const extractCookies = (res) => {
  if (res.headers.getSetCookie) {
    return res.headers.getSetCookie().map((c) => c.split(";")[0]);
  }
  const single = res.headers.get("set-cookie");
  return single ? [single.split(";")[0]] : [];
};

async function testAuth(email, password, expectedRole) {
  console.log(`\nTesting login for ${email} (${expectedRole})...`);
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();
  const initialCookies = extractCookies(csrfRes);

  const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: initialCookies.join("; "),
    },
    body: new URLSearchParams({
      csrfToken,
      email,
      password,
      callbackUrl: `${BASE_URL}/`,
      json: "true",
    }),
    redirect: "manual",
  });

  const sessionCookies = extractCookies(loginRes);
  const cookie = [...initialCookies, ...sessionCookies].join("; ");

  const sessionRes = await fetch(`${BASE_URL}/api/auth/session`, {
    headers: { Cookie: cookie },
  });
  const sessionData = await sessionRes.json();
  console.log(`✓ Login success! Role: ${sessionData?.user?.role}, Name: ${sessionData?.user?.name}`);
  return sessionData?.user?.role === expectedRole;
}

async function run() {
  console.log("===============================================================================");
  console.log("   VERIFYING WEBSITE AUTHENTICATION AGAINST ATLAS DATABASE");
  console.log("===============================================================================");

  const r1 = await testAuth("delivery@example.com", "Kisan@1234", "DELIVERY_PARTNER");
  const r2 = await testAuth("farmer@example.com", "Kisan@1234", "FARMER");
  const r3 = await testAuth("admin@example.com", "Kisan@1234", "ADMIN");

  if (r1 && r2 && r3) {
    console.log("\n===============================================================================");
    console.log("   🎉 ALL LOGINS VERIFIED AGAINST MONGODB ATLAS!");
    console.log("===============================================================================");
  } else {
    console.error("❌ Some logins failed");
    process.exit(1);
  }
}

run();
