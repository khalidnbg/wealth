import arcjet, { shield, detectBot } from "@arcjet/next";

// Create Arcjet instance
const aj = arcjet({
  key: process.env.ARCJET_KEY,
  rules: [
    // Shield protection for content and security
    shield({
      mode: "LIVE",
    }),
    detectBot({
      mode: "LIVE", // will block requests. Use "DRY_RUN" to log only
      allow: [
        "CATEGORY:SEARCH_ENGINE", // Google, Bing, etc
        "GO_HTTP", // For Inngest
        // See the full list at https://arcjet.com/bot-list
      ],
    }),
  ],
});

// Utility function to protect API routes
export async function protectRoute(req) {
  try {
    const decision = await aj.protect(req);

    if (decision.isDenied()) {
      return {
        blocked: true,
        reason: decision.reason,
        response: Response.json(
          { error: "Request blocked", reason: decision.reason },
          { status: 403 }
        )
      };
    }

    return { blocked: false };
  } catch (error) {
    console.error("ArcJet protection error:", error);
    // Allow request to continue if ArcJet fails
    return { blocked: false };
  }
}

// Higher-order function to wrap API routes with ArcJet protection
export function withArcjetProtection(handler) {
  return async function protectedHandler(req, ...args) {
    const protection = await protectRoute(req);

    if (protection.blocked) {
      return protection.response;
    }

    return handler(req, ...args);
  };
}

export default aj;
