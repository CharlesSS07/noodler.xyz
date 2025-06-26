import {onCall, HttpsError} from "firebase-functions/v2/https";

export const publicHealthCheck = onCall(async () => {
  return {
    status: "ok",
    message: "Public health check - accessible to all users",
    timestamp: new Date().toISOString(),
    endpoint: "public",
  };
});

export const authenticatedHealthCheck = onCall(
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Authentication required"
      );
    }

    return {
      status: "ok",
      message: "Authenticated health check - user is logged in",
      timestamp: new Date().toISOString(),
      endpoint: "authenticated",
      uid: request.auth.uid,
    };
  });

export const verifiedEmailHealthCheck = onCall(
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Authentication required"
      );
    }

    if (!request.auth.token.email_verified) {
      throw new HttpsError(
        "permission-denied",
        "Email verification required"
      );
    }

    return {
      status: "ok",
      message: "Verified email health check - user has verified email",
      timestamp: new Date().toISOString(),
      endpoint: "verified-email",
      uid: request.auth.uid,
      email: request.auth.token.email,
    };
  });
