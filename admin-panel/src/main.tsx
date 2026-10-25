
import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { connectAdminSocket } from "./api/socket";
import App from "./App";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});


function RealtimeQuerySync() {
  const client = useQueryClient();

  useEffect(() => {
    // Connect when an authenticated session already exists.
    connectAdminSocket();

    const refreshActiveQueries = () => {
      void client.invalidateQueries({
        refetchType: "active",
      });
    };

    window.addEventListener(
      "excart:data-changed",
      refreshActiveQueries,
    );

    window.addEventListener(
      "excart:reconnected",
      refreshActiveQueries,
    );

    return () => {
      window.removeEventListener(
        "excart:data-changed",
        refreshActiveQueries,
      );

      window.removeEventListener(
        "excart:reconnected",
        refreshActiveQueries,
      );
    };
  }, [client]);

  return null;
}


ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RealtimeQuerySync />
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
