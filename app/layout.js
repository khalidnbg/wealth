import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import ErrorBoundary from "@/components/ErrorBoundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Wealth",
  description: "One stop Finance Platform",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="icon" href="/logo-sm.png" sizes="any" />
        </head>

        <body className={`${inter.className}`} suppressHydrationWarning={true}>
          <ErrorBoundary>
            {/* header */}
            <Header />

            <main className="min-h-screen">{children}</main>

            <Toaster richColors />

            {/* footer */}
            <footer className="bg-blue-50 py-12">
              <div className="container mx-auto text-center text-gray-600">
                <p>Made with ❤️ by Khalid NBG</p>
              </div>
            </footer>
          </ErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  );
}
