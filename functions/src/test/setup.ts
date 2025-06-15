import * as admin from "firebase-admin";
import {config} from "dotenv";

// Load environment variables from .env file
config();

// Mock auth token for testing
export const mockAuthToken = "mock-auth-token";

// Mock request helper
export const createMockRequest = (body: any, headers: any = {}) =>
    ({
      body,
      headers: {
        "authorization": `Bearer ${mockAuthToken}`,
        "content-type": "application/json",
        ...headers,
      },
      query: {},
    }) as any;

// Mock response helper
export const createMockResponse = () => {
  const res: any = {
    statusCode: 200,
    data: null,
    status: function(code: number) {
      this.statusCode = code;
      return this;
    },
    json: function(data: any) {
      this.data = data;
      return this;
    },
  };
  return res;
};

// Mock DecodedIdToken
export const mockDecodedToken: admin.auth.DecodedIdToken = {
  uid: "test-uid",
  aud: "test-project",
  auth_time: Date.now() / 1000,
  exp: Date.now() / 1000 + 3600,
  firebase: {
    identities: {},
    sign_in_provider: "custom",
  },
  iat: Date.now() / 1000,
  iss: "https://securetoken.google.com/test-project",
  sub: "test-uid",
};

// Initialize Firebase Admin for testing
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "test-project",
  });
}

// Cleanup function
export const cleanup = () => {
  // No cleanup needed for now
};
