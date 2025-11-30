import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";

export const checkUser = async () => {
  try {
    console.log("checkUser: Starting user check...");

    // Test database connection first
    try {
      await db.$queryRaw`SELECT 1`;
      console.log("checkUser: Database connection successful");
    } catch (dbError) {
      console.error("checkUser: Database connection failed:", {
        message: dbError.message,
        code: dbError.code,
        name: dbError.name,
      });
      throw new Error(`Database connection failed: ${dbError.message}`);
    }

    // Get current user from Clerk
    const user = await currentUser();
    console.log("checkUser: Clerk user:", user ? "found" : "null");

    if (!user) {
      console.log("checkUser: No authenticated user found");
      return null;
    }

    console.log("checkUser: Clerk user ID:", user.id);
    console.log(
      "checkUser: User email:",
      user.emailAddresses?.[0]?.emailAddress || "none",
    );

    // Check if user exists in our database
    const loggedInUser = await db.user.findUnique({
      where: {
        clerkUserId: user.id,
      },
    });

    console.log(
      "checkUser: Database user:",
      loggedInUser ? "found" : "not found",
    );

    if (loggedInUser) {
      console.log("checkUser: Returning existing user:", loggedInUser.id);
      return loggedInUser;
    }

    // Create new user if not exists
    console.log("checkUser: Creating new user in database...");

    const name =
      `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User";
    const email = user.emailAddresses?.[0]?.emailAddress;

    if (!email) {
      throw new Error("User email address not found in Clerk data");
    }

    const newUser = await db.user.create({
      data: {
        clerkUserId: user.id,
        name,
        imageUrl: user.imageUrl || "",
        email,
      },
    });

    console.log("checkUser: Successfully created new user:", newUser.id);
    return newUser;
  } catch (error) {
    console.error("checkUser: Complete error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    });

    // Log environment variables status (without exposing values)
    console.error("checkUser: Environment check:", {
      DATABASE_URL_exists: !!process.env.DATABASE_URL,
      CLERK_SECRET_KEY_exists: !!process.env.CLERK_SECRET_KEY,
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_exists:
        !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    });

    // Return null instead of throwing to prevent app crashes
    // The caller should handle the null return value
    return null;
  }
};
