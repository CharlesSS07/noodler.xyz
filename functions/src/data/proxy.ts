import {onRequest} from "firebase-functions/v2/https";
import cors from "cors";
import * as admin from "firebase-admin";

const corsHandler = cors({origin: true});

export const proxy = onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    // Check authentication for onRequest functions
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).send("Authentication required");
      return;
    }

    try {
      const token = authHeader.split("Bearer ")[1];
      await admin.auth().verifyIdToken(token);
    } catch (authError) {
      res.status(401).send("Invalid authentication token");
      return;
    }

    const url = req.query.url;
    if (!url) {
      res.status(400).send("Missing URL parameter");
      return;
    }

    try {
      const response = await fetch(url as string);

      // Copy headers from the fetched response to the proxy response
      response.headers.forEach((value, name) => {
        // Exclude problematic headers (e.g., for CORS or content handling)
        if (![
          "content-encoding",
          "transfer-encoding",
          "content-length",
        ].includes(name.toLowerCase())) {
          res.set(name, value);
        }
      });

      // Set the status of the proxy response to match the fetched response
      res.status(response.status);

      // Send response body as buffer (preserves content type, e.g., for images)
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error("Proxy error:", error);
      res.status(500).send(
        `Proxy error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });
});
