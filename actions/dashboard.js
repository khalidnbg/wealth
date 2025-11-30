"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

const serializedTransaction = (obj) => {
  const serialized = { ...obj };

  if (obj.balance) serialized.balance = obj.balance.toNumber();

  if (obj.amount) serialized.amount = obj.amount.toNumber();

  return serialized;
};

export async function createAccount(data) {
  try {
    const { userId } = await auth();

    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    // convert balance to float before saving
    const balanceFloat = parseFloat(data.balance);
    if (isNaN(balanceFloat)) throw new Error("Invalid balance value");

    // check if this is the first account for the user
    const existingAccounts = await db.account.findMany({
      where: { userId: user.id },
    });

    const shouldBeDefault =
      existingAccounts.length === 0 ? true : data.isDefault;

    // if isDefault is true, set all other accounts to false
    if (shouldBeDefault) {
      await db.account.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const account = await db.account.create({
      data: {
        ...data,
        balance: balanceFloat,
        userId: user.id,
        isDefault: shouldBeDefault,
      },
    });

    const serializedAccount = serializedTransaction(account);

    revalidatePath("/dashboard");

    return serializedAccount;
  } catch (error) {
    throw new Error("Failed to create account: " + error.message);
  }
}

export async function getUserAccounts() {
  try {
    console.log("getUserAccounts: Starting...");

    const { userId } = await auth();
    console.log(
      "getUserAccounts: Auth userId:",
      userId ? "present" : "missing",
    );

    if (!userId) throw new Error("Unauthorized - no userId from auth()");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    console.log(
      "getUserAccounts: Database user:",
      user ? "found" : "not found",
    );

    if (!user)
      throw new Error("User not found in database with clerkUserId: " + userId);

    console.log("getUserAccounts: Fetching accounts for user:", user.id);

    const accounts = await db.account.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    console.log("getUserAccounts: Found", accounts.length, "accounts");

    // Serialize accounts before sending to client
    const serializedAccounts = accounts.map(serializedTransaction);

    console.log("getUserAccounts: Successfully serialized accounts");
    return serializedAccounts;
  } catch (error) {
    console.error("getUserAccounts: Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    });
    throw new Error("Failed to get user accounts: " + error.message);
  }
}

export async function getDashboardData() {
  try {
    console.log("getDashboardData: Starting...");

    const { userId } = await auth();
    console.log(
      "getDashboardData: Auth userId:",
      userId ? "present" : "missing",
    );

    if (!userId) throw new Error("Unauthorized - no userId from auth()");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    console.log(
      "getDashboardData: Database user:",
      user ? "found" : "not found",
    );

    if (!user) {
      throw new Error("User not found in database with clerkUserId: " + userId);
    }

    console.log("getDashboardData: Fetching transactions for user:", user.id);

    // Get all user transactions
    const transactions = await db.transaction.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
    });

    console.log("getDashboardData: Found", transactions.length, "transactions");

    const serializedTransactions = transactions.map(serializedTransaction);
    console.log("getDashboardData: Successfully serialized transactions");

    return serializedTransactions;
  } catch (error) {
    console.error("getDashboardData: Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    });
    throw new Error("Failed to get dashboard data: " + error.message);
  }
}
