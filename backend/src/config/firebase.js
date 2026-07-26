const admin = require("firebase-admin");
const logger = require("./logger");

let initialized = false;

function initFirebase() {
  if (initialized) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    logger.warn("Firebase Admin not configured — Google/Apple auth will be unavailable");
    return;
  }

  admin.initializeApp({
    credential: admin.cert({ projectId, clientEmail, privateKey }),
  });

  initialized = true;
  logger.info("Firebase Admin initialized");
}

/**
 * Verify a Firebase ID token and return the decoded payload.
 * Returns null if Firebase is not configured.
 */
async function verifyFirebaseToken(idToken) {
  if (!initialized) return null;
  const { getAuth } = require("firebase-admin/auth");
  return getAuth().verifyIdToken(idToken);
}

module.exports = { initFirebase, verifyFirebaseToken };
