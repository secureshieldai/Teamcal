const request = require("supertest");

jest.mock("../config/supabase", () => ({
  supabase: { from: jest.fn() },
  testConnection: jest.fn(),
}));

const app = require("../app");

describe("API shell", () => {
  test("GET /api/health reports a healthy process", async () => {
    const response = await request(app).get("/api/health").expect(200);

    expect(response.body.status).toBe("ok");
    expect(typeof response.body.ts).toBe("number");
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
  });

  test("unknown routes return the standard JSON error", async () => {
    const response = await request(app).get("/api/not-a-route").expect(404);

    expect(response.body).toEqual({ success: false, message: "Route not found" });
  });

  test("malformed JSON is handled as a client error", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send('{"email":')
      .expect(400);

    expect(response.body.success).toBe(false);
  });

  test("disallowed browser origins are rejected", async () => {
    const response = await request(app)
      .get("/api/health")
      .set("Origin", "https://untrusted.example")
      .expect(403);

    expect(response.body).toEqual({ success: false, message: "Not allowed by CORS" });
  });

  test("Expo Web's development origin is allowed", async () => {
    const response = await request(app)
      .get("/api/health")
      .set("Origin", "http://localhost:8081")
      .expect(200);

    expect(response.headers["access-control-allow-origin"]).toBe("http://localhost:8081");
  });
});

describe("authentication validation", () => {
  test.each([
    [{}, ["email", "password"]],
    [{ email: "invalid", password: "123" }, ["email", "password"]],
  ])("registration rejects invalid payload %#", async (payload, fields) => {
    const response = await request(app).post("/api/auth/register").send(payload).expect(422);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Validation failed");
    expect(response.body.errors.map((error) => error.field)).toEqual(expect.arrayContaining(fields));
  });

  test("login requires a valid email and password", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "bad", password: "" })
      .expect(422);

    expect(response.body.errors).toHaveLength(2);
  });

  test("Firebase authentication requires an ID token", async () => {
    await request(app).post("/api/auth/firebase").send({}).expect(422);
  });

  test("email verification requires a six-digit code and verification token", async () => {
    const response = await request(app)
      .post("/api/auth/verification/verify")
      .send({ verificationToken: "token", code: "123" })
      .expect(422);

    expect(response.body.errors.map((error) => error.field)).toContain("code");
  });

  test("resending verification requires a verification token", async () => {
    await request(app).post("/api/auth/verification/resend").send({}).expect(422);
  });
});

describe("protected route boundaries", () => {
  const protectedRequests = [
    ["get", "/api/auth/me"],
    ["get", "/api/user/profile"],
    ["get", "/api/fasting/active"],
    ["get", "/api/tracker/water"],
    ["get", "/api/posts/feed"],
    ["get", "/api/goals"],
    ["get", "/api/earn/entries"],
    ["get", "/api/blogs/sites"],
    ["post", "/api/coach/chat"],
    ["get", "/api/meals/today"],
    ["get", "/api/social/feed"],
    ["get", "/api/notifications/prefs"],
    ["get", "/api/health-team"],
    ["get", "/api/appointments"],
    ["get", "/api/shopping"],
    ["get", "/api/challenges"],
    ["get", "/api/groups"],
    ["get", "/api/workouts"],
    ["get", "/api/marketplace/products"],
  ];

  test.each(protectedRequests)("%s %s requires a bearer token", async (method, path) => {
    const response = await request(app)[method](path).expect(401);

    expect(response.body).toEqual({ success: false, message: "No token provided" });
  });

  test("removed client-controlled XP endpoint is not exposed", async () => {
    await request(app).post("/api/user/xp").send({ amount: 999999 }).expect(401);
  });
});
