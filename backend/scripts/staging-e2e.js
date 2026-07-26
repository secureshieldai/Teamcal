require("dotenv").config();

const crypto = require("crypto");
const app = require("../src/app");
const { supabase } = require("../src/config/supabase");

const runId = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
const email = `e2e-${runId}@example.invalid`;
const password = `E2e-${runId}!`;
let userId;
let challengeId;
let server;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api`;

  async function api(method, path, body, token, expectedStatus = 200) {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const payload = await response.json();
    if (response.status !== expectedStatus) {
      throw new Error(`${method} ${path}: expected ${expectedStatus}, got ${response.status}: ${JSON.stringify(payload)}`);
    }
    return payload;
  }

  const health = await api("GET", "/health");
  assert(health.status === "ok", "health check did not report ok");

  const registered = await api("POST", "/auth/register", { email, password, name: "E2E User" }, null, 201);
  userId = registered.user.id;
  assert(registered.token && userId, "registration did not return a token and user");

  const loggedIn = await api("POST", "/auth/login", { email, password });
  const token = loggedIn.token;
  assert(token, "login did not return a token");

  const me = await api("GET", "/auth/me", undefined, token);
  assert(me.user.id === userId && !Object.hasOwn(me.user, "password_hash"), "auth/me returned an invalid public user");

  const profile = await api("PATCH", "/user/profile", { name: "E2E Updated", bio: `run-${runId}` }, token);
  assert(profile.user.name === "E2E Updated", "profile update was not persisted");

  const goals = await api("PATCH", "/user/goals", { waterMl: 2345, steps: 7654 }, token);
  assert(goals.goals.waterMl === 2345 && goals.goals.steps === 7654, "goal update was not persisted");

  const tracker = await api("POST", "/tracker/e2e-water", { value: 321, meta: { runId } }, token, 201);
  const trackerId = tracker.entry.id;
  const entries = await api("GET", "/tracker/e2e-water", undefined, token);
  assert(entries.entries.some((entry) => entry.id === trackerId), "tracker entry was not returned");
  const today = await api("GET", "/tracker/e2e-water/today", undefined, token);
  assert(Number(today.sum) === 321, "tracker daily sum is incorrect");
  await api("DELETE", `/tracker/e2e-water/${trackerId}`, undefined, token);

  const createdPost = await api("POST", "/posts", { text: `E2E post ${runId}` }, token, 201);
  const postId = createdPost.post.id;
  const mine = await api("GET", "/posts/mine", undefined, token);
  assert(mine.posts.some((post) => post.id === postId), "created post was not returned");
  const liked = await api("POST", `/posts/${postId}/like`, {}, token);
  assert(liked.liked === true && liked.likes === 1, "post like did not persist");
  const unliked = await api("POST", `/posts/${postId}/like`, {}, token);
  assert(unliked.liked === false && unliked.likes === 0, "post unlike did not persist");
  await api("DELETE", `/posts/${postId}`, undefined, token);

  const createdChallenge = await api("POST", "/challenges", {
    title: `E2E Challenge ${runId}`,
    description: "Temporary staging verification",
    durationDays: 3,
    isPublic: false,
  }, token, 201);
  challengeId = createdChallenge.challenge.id;
  const challenge = await api("GET", `/challenges/${challengeId}`, undefined, token);
  assert(challenge.membership && challenge.membership.current_day === 0, "challenge creator was not auto-joined");
  const progress = await api("PATCH", `/challenges/${challengeId}/progress`, { currentDay: 1 }, token);
  assert(progress.membership.current_day === 1, "challenge progress was not persisted");
  const myChallenges = await api("GET", "/challenges?tab=my", undefined, token);
  assert(myChallenges.challenges.some((item) => item.id === challengeId), "challenge was not returned in the user's challenges");
  await api("DELETE", `/challenges/${challengeId}/join`, undefined, token);

  console.log("PASS health, registration, login, auth/me, profile, goals, tracker, posts, and challenges");
}

async function cleanup() {
  if (challengeId) {
    const { error } = await supabase.from("challenges").delete().eq("id", challengeId);
    if (error) throw new Error(`challenge cleanup failed: ${error.message}`);
  }

  if (!userId) {
    const { data } = await supabase.from("users").select("id").eq("email", email).maybeSingle();
    userId = data?.id;
  }
  if (userId) {
    const { error } = await supabase.from("users").delete().eq("id", userId).eq("email", email);
    if (error) throw new Error(`user cleanup failed: ${error.message}`);
  }

  const { data: leftover } = await supabase.from("users").select("id").eq("email", email).maybeSingle();
  assert(!leftover, "test user still exists after cleanup");
  console.log(`CLEANUP verified for ${email}`);
}

(async () => {
  let exitCode = 0;
  try {
    await main();
  } catch (error) {
    exitCode = 1;
    console.error(`FAIL ${error.message}`);
  } finally {
    try {
      await cleanup();
    } catch (error) {
      exitCode = 1;
      console.error(`FAIL ${error.message}`);
    }
    if (server) await new Promise((resolve) => server.close(resolve));
    process.exit(exitCode);
  }
})();
