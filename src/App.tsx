import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Box, ThemeProvider } from "@mond-design-system/theme";
import { ToastProvider } from "./providers/ToastProvider";
import { ThemeContextProvider } from "./providers/ThemeContext";
import { useThemeContext } from "./providers/useThemeContext";
import { StorageProvider } from "./providers/StorageProvider";
import { StatsProvider } from "./providers/StatsProvider";
import { HomePage } from "./pages/HomePage";
import { ThemeToggle } from "./components/ThemeToggle";
import { Footer } from "./components/Footer";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60, // 1 hour
      refetchOnWindowFocus: false,
    },
  },
});

function ThemedApp() {
  const { theme } = useThemeContext();

  return (
    <ThemeProvider colorScheme={theme}>
      <ToastProvider>
        <BrowserRouter>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              minHeight: "100vh",
            }}
          >
            <Box display="flex" justifyContent="flex-end" padding="1">
              <ThemeToggle />
            </Box>
            <Routes>
              <Route path="/" element={<HomePage />} />
            </Routes>
            <Footer />
          </div>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StorageProvider>
        <StatsProvider>
          <ThemeContextProvider>
            <ThemedApp />
          </ThemeContextProvider>
        </StatsProvider>
      </StorageProvider>
    </QueryClientProvider>
  );
}

export default App;
