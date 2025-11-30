import { getDashboardData, getUserAccounts } from "@/actions/dashboard";
import CreateAccountDrawer from "@/components/create-account-drawer";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, AlertTriangle } from "lucide-react";
import React, { Suspense } from "react";
import AccountCard from "./_components/Account-card";
import { getCurrentBudget } from "@/actions/budget";
import BudgetProgress from "./_components/budget-progress";
import DashboardOverview from "./_components/transaction-overview";

// Loading component
function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
      <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}

// Error component
function DashboardError({ error, retry }) {
  console.error("Dashboard error:", error);

  return (
    <div className="space-y-8">
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-red-700">
            <AlertTriangle className="h-6 w-6" />
            <div>
              <h3 className="font-semibold">Dashboard Error</h3>
              <p className="text-sm text-red-600">
                {process.env.NODE_ENV === "development"
                  ? error.message
                  : "Unable to load dashboard data. Please try again."}
              </p>
              <button
                onClick={retry}
                className="mt-2 text-sm underline hover:no-underline"
              >
                Try Again
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Accounts section component
async function AccountsSection() {
  try {
    console.log("Loading accounts...");
    const accounts = await getUserAccounts();
    console.log("Accounts loaded:", accounts?.length || 0);

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CreateAccountDrawer>
          <Card className="hover:shadow-md transition cursor-pointer border-dashed">
            <CardContent className="flex flex-col items-center justify-center text-muted-foreground h-full pt-5">
              <Plus className="h-10 w-10 mb-2" />
              <p className="text-sm font-medium">Create New Account</p>
            </CardContent>
          </Card>
        </CreateAccountDrawer>
        {accounts?.length > 0 &&
          accounts?.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
      </div>
    );
  } catch (error) {
    console.error("Error in AccountsSection:", error);
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-red-700">
            <AlertTriangle className="h-5 w-5 inline mr-2" />
            Failed to load accounts: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }
}

// Budget section component
async function BudgetSection({ defaultAccount }) {
  if (!defaultAccount) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">
            Create an account to set up budgets
          </p>
        </CardContent>
      </Card>
    );
  }

  try {
    console.log("Loading budget for account:", defaultAccount.id);
    const budgetData = await getCurrentBudget(defaultAccount.id);
    console.log("Budget loaded:", !!budgetData);

    return (
      <BudgetProgress
        initialBudget={budgetData?.budget}
        currentExpenses={budgetData?.currentExpenses || 0}
      />
    );
  } catch (error) {
    console.error("Error in BudgetSection:", error);
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="text-yellow-700">
            <AlertTriangle className="h-5 w-5 inline mr-2" />
            Budget data unavailable: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }
}

// Overview section component
async function OverviewSection({ accounts, transactions }) {
  try {
    return (
      <DashboardOverview
        accounts={accounts}
        transactions={transactions || []}
      />
    );
  } catch (error) {
    console.error("Error in OverviewSection:", error);
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-red-700">
            <AlertTriangle className="h-5 w-5 inline mr-2" />
            Failed to load overview: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }
}

async function DashboardPage() {
  try {
    console.log("=== Dashboard Page Loading ===");

    // Load data step by step with better error handling
    let accounts, transactions;

    try {
      console.log("Step 1: Loading accounts...");
      accounts = await getUserAccounts();
      console.log(
        "Accounts result:",
        accounts ? `${accounts.length} accounts` : "null",
      );
    } catch (error) {
      console.error("Step 1 failed - getUserAccounts:", error);
      accounts = [];
    }

    try {
      console.log("Step 2: Loading transactions...");
      transactions = await getDashboardData();
      console.log(
        "Transactions result:",
        transactions ? `${transactions.length} transactions` : "null",
      );
    } catch (error) {
      console.error("Step 2 failed - getDashboardData:", error);
      transactions = [];
    }

    const defaultAccount = accounts?.find((account) => account.isDefault);
    console.log(
      "Default account:",
      defaultAccount ? defaultAccount.id : "none",
    );

    console.log("=== Dashboard Page Data Loaded Successfully ===");

    return (
      <div className="space-y-8">
        {/* Budget Progress */}
        <Suspense
          fallback={
            <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
          }
        >
          <BudgetSection defaultAccount={defaultAccount} />
        </Suspense>

        {/* Dashboard Overview */}
        <Suspense
          fallback={
            <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
          }
        >
          <OverviewSection accounts={accounts} transactions={transactions} />
        </Suspense>

        {/* Accounts Grid */}
        <Suspense
          fallback={
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-32 bg-gray-100 rounded-lg animate-pulse"
                />
              ))}
            </div>
          }
        >
          <AccountsSection />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error("=== Dashboard Page Error ===", error);

    // Return error UI
    return (
      <DashboardError error={error} retry={() => window.location.reload()} />
    );
  }
}

export default DashboardPage;
