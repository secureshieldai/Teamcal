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

  test("Stripe webhook rejects unsigned payloads", async () => {
    await request(app).post("/api/stripe/webhook").set("Content-Type","application/json").send(Buffer.from("{}")) .expect(400);
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
    ["delete", "/api/auth/account"],
    ["get", "/api/user/profile"],
    ["get", "/api/fasting/active"],
    ["get", "/api/tracker/water"],
    ["get", "/api/posts/feed"],
    ["get", "/api/goals"],
    ["get", "/api/earn/entries"],
    ["get", "/api/earn/summary"],
    ["get", "/api/earn/assets"],
    ["get", "/api/earn/memberships/test-id/public"],
    ["post", "/api/earn/assets"],
    ["patch", "/api/earn/assets/test-id"],
    ["delete", "/api/earn/assets/test-id"],
    ["get", "/api/blogs/sites"],
    ["get", "/api/blogs/sites/test-id/analytics"],
    ["get", "/api/blogs/articles/test-id"],
    ["post", "/api/blogs/articles"],
    ["patch", "/api/blogs/articles/test-id"],
    ["post", "/api/coach/chat"],
    ["post", "/api/coach/audience/generate"],
    ["post", "/api/coach/article-helper"],
    ["get", "/api/meals/today"],
    ["get", "/api/social/feed"],
    ["post", "/api/social/reports"],
    ["post", "/api/social/users/test-user/block"],
    ["get", "/api/social/content/blogs"],
    ["get", "/api/social/content/blogs/test-id/engagement"],
    ["post", "/api/social/content/blogs/test-id/like"],
    ["post", "/api/social/content/blogs/test-id/comments"],
    ["post", "/api/social/content/blogs/test-id/comments/test-comment/like"],
    ["delete", "/api/social/content/blogs/test-id/comments/test-comment"],
    ["post", "/api/social/content/blogs/test-blog/follow"],
    ["get", "/api/social/content/videos"],
    ["get", "/api/social/stories"],
    ["get", "/api/social/messages/conversations"],
    ["get", "/api/social/messages/requests"],
    ["get", "/api/social/messages/test-user"],
    ["post", "/api/social/messages/test-user"],
    ["post", "/api/social/messages/requests/test-user"],
    ["get", "/api/notifications/prefs"],
    ["get", "/api/health-team"],
    ["get", "/api/appointments"],
    ["get", "/api/shopping"],
    ["get", "/api/challenges"],
    ["patch", "/api/challenges/test-id"],
    ["get", "/api/groups"],
    ["post", "/api/groups"],
    ["patch", "/api/groups/test-id"],
    ["post", "/api/groups/test-id/join"],
    ["get", "/api/groups/test-id/activity"],
    ["get", "/api/workouts"],
  ["get", "/api/marketplace/products"],
  ["get", "/api/personal"],
  ["get", "/api/social-auth/platforms"],
  ["post", "/api/social-auth/connect/instagram"],
  ["get", "/api/earn/payout/status"],
  ["post", "/api/earn/payout/login-link"],
  ["post", "/api/marketplace/checkout"],
  ["get", "/api/marketplace/disputes"],
  ];

  test.each(protectedRequests)("%s %s requires a bearer token", async (method, path) => {
    const response = await request(app)[method](path).expect(401);

    expect(response.body).toEqual({ success: false, message: "No token provided" });
  });

  test("removed client-controlled XP endpoint is not exposed", async () => {
    await request(app).post("/api/user/xp").send({ amount: 999999 }).expect(401);
  });
});
