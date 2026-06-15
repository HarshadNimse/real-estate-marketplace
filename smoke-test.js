/**
 * End-to-end smoke test (Node 18+ global fetch).
 * Covers register/login/create property/admin approve/inquiry/status transitions.
 * Run with backend up: npm run smoke
 */
const BASE = process.env.SMOKE_API_BASE || "http://localhost:5000/api";

async function parseResponse(res, label) {
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`${label}: invalid JSON (${res.status})`);
  }
  if (!res.ok || body.success === false) {
    throw new Error(`${label}: HTTP ${res.status} — ${body.message || text || "unknown"}`);
  }
  return body;
}

async function request(path, { method = "GET", token, body } = {}, label = path) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return parseResponse(res, label);
}

async function main() {
  try {
    const runId = Date.now();
    const sellerEmail = `seller${runId}@example.com`;
    const buyerEmail = `buyer${runId}@example.com`;
    const password = "Password123";

    const apiOrigin = new URL(BASE.endsWith("/api") ? BASE : `${BASE}/api`).origin;
    await parseResponse(await fetch(`${apiOrigin}/api/health`), "GET /api/health");
    console.log("✅ Health OK");

    await request(
      "/auth/register",
      {
        method: "POST",
        body: {
          fullName: `Smoke Seller ${runId}`,
          email: sellerEmail,
          phone: "9999999999",
          password,
          role: "seller",
        },
      },
      "Register seller"
    );
    await request(
      "/auth/register",
      {
        method: "POST",
        body: {
          fullName: `Smoke Buyer ${runId}`,
          email: buyerEmail,
          phone: "8888888888",
          password,
          role: "buyer",
        },
      },
      "Register buyer"
    );
    console.log("✅ Register seller and buyer");

    const sellerLogin = await request(
      "/auth/login",
      { method: "POST", body: { email: sellerEmail, password } },
      "Login seller"
    );
    const sellerToken = sellerLogin.data?.accessToken || sellerLogin.data?.token;
    if (!sellerToken) throw new Error("Login seller: missing token");
    console.log("✅ Seller login");

    const created = await request(
      "/properties",
      {
        method: "POST",
        token: sellerToken,
        body: {
          title: `Smoke Test Property ${runId}`,
          description: "End-to-end smoke test property.",
          price: 25000,
          city: "Pune",
          address_line: "Kothrud",
          latitude: 18.5074,
          longitude: 73.8077,
          property_type: "rent",
          bhk: 2,
          area_sqft: 950,
          furnishing: "semi",
          amenities: ["Lift", "Parking"],
        },
      },
      "Create property"
    );
    const property = created.data?.property;
    if (!property?.id) throw new Error("Create property: missing property id");
    console.log(`✅ Property created (id=${property.id})`);

    const adminLogin = await request(
      "/auth/login",
      { method: "POST", body: { email: "admin@example.com", password } },
      "Login admin"
    );
    const adminToken = adminLogin.data?.accessToken || adminLogin.data?.token;
    if (!adminToken) throw new Error("Login admin: missing token");
    console.log("✅ Admin login");

    await request(
      `/properties/${property.id}/status`,
      { method: "PATCH", token: adminToken, body: { status: "approved" } },
      "Approve property"
    );
    console.log("✅ Property approved by admin");

    const buyerLogin = await request(
      "/auth/login",
      { method: "POST", body: { email: buyerEmail, password } },
      "Login buyer"
    );
    const buyerToken = buyerLogin.data?.accessToken || buyerLogin.data?.token;
    if (!buyerToken) throw new Error("Login buyer: missing token");
    console.log("✅ Buyer login");

    await request(
      "/inquiries",
      {
        method: "POST",
        token: buyerToken,
        body: {
          property_id: property.id,
          message: "Is this property available for immediate move-in?",
          contact_phone: "7777777777",
        },
      },
      "Create inquiry"
    );
    console.log("✅ Inquiry created");

    const sellerInbox = await request(
      "/inquiries/seller?limit=10&offset=0",
      { token: sellerToken },
      "Seller inbox"
    );
    const inquiry = (sellerInbox.data?.inquiries || []).find(
      (item) => Number(item.property_id) === Number(property.id)
    );
    if (!inquiry?.id) throw new Error("Seller inbox: inquiry not found for created property");
    console.log("✅ Seller sees inquiry");

    await request(
      `/inquiries/${inquiry.id}/status`,
      { method: "PATCH", token: sellerToken, body: { status: "responded" } },
      "Seller mark responded"
    );
    console.log("✅ Seller marked inquiry responded");

    await request(
      `/inquiries/${inquiry.id}/status`,
      { method: "PATCH", token: buyerToken, body: { status: "closed" } },
      "Buyer close inquiry"
    );
    console.log("✅ Buyer closed inquiry");

    await request("/properties?city=Pune&limit=10&offset=0", {}, "Public properties list");
    await request(
      `/properties/${property.id}`,
      { token: buyerToken },
      "Get property (records view)"
    );
    await request("/favourites/" + property.id, {
      method: "POST",
      token: buyerToken,
    }, "Add favourite");
    await request("/favourites", { token: buyerToken }, "List favourites");
    await request("/favourites/" + property.id, {
      method: "DELETE",
      token: buyerToken,
    }, "Remove favourite");
    const adminStats = await request("/admin/stats", { token: adminToken }, "Admin stats");
    if (typeof adminStats.data?.totalViews !== "number") {
      throw new Error("Admin stats: totalViews missing");
    }
    await request("/auth/me", { token: sellerToken }, "Seller profile");
    await request("/auth/me", { token: buyerToken }, "Buyer profile");
    await request("/auth/me", { token: adminToken }, "Admin profile");
    console.log("✅ Public + profile checks passed");

    console.log("\n🧹 Cleaning up test data...");
    try {
      if (result.inquiry?.data?.id) {
        await request(
          `/inquiries/${result.inquiry.data.id}`,
          { method: "DELETE", token: buyerToken },
          "Delete test inquiry"
        );
        console.log("✅ Test inquiry deleted");
      }
    } catch (e) {
      console.log("ℹ️ Inquiry cleanup skipped");
    }

    try {
      if (result.property?.data?.id) {
        await request(
          `/properties/${result.property.data.id}`,
          { method: "DELETE", token: sellerToken },
          "Delete test property"
        );
        console.log("✅ Test property deleted");
      }
    } catch (e) {
      console.log("ℹ️ Property cleanup skipped");
    }

    console.log("\n✅ Smoke E2E passed.");
  } catch (err) {
    console.error("❌ Smoke E2E failed:", err.message);
    process.exit(1);
  }
}

main();
