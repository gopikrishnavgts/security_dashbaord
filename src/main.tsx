import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App.tsx";

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Start MSW in development
async function enableMocking() {
  if (import.meta.env.DEV) {
    try {
      const { worker } = await import("./mocks/browser");
      await worker.start({
        onUnhandledRequest: "bypass",
      });
      console.log("✅ MSW started successfully");
    } catch (error) {
      console.error("❌ MSW failed to start:", error);
    }
  }
}

// Initialize app
console.log("🌟 Starting application initialization...");

enableMocking()
  .then(() => {
    console.log("🚀 MSW initialized, rendering React app...");
    const rootElement = document.getElementById("root");
    console.log("📦 Root element:", rootElement);

    if (!rootElement) {
      throw new Error("Root element not found!");
    }

    createRoot(rootElement).render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </StrictMode>
    );
    console.log("✅ React app rendered successfully");
  })
  .catch((error) => {
    console.error("❌ Failed to initialize app:", error);
    console.error("❌ Error stack:", error.stack);
    // Render error message
    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding: 2rem; font-family: system-ui;">
          <h1 style="color: red;">Application Error</h1>
          <pre style="background: #f5f5f5; padding: 1rem; border-radius: 4px; overflow: auto;">
${error.message || error}

Stack:
${error.stack || 'No stack trace'}
          </pre>
        </div>
      `;
    }
  });
