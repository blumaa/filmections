import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Box, Spinner, Text } from "@mond-design-system/theme";
import { useAuth } from "../../providers/useAuth";

interface RequireAdminProps {
  children: ReactNode;
}

export function RequireAdmin({ children }: RequireAdminProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          gap="lg"
        >
          <Spinner size="lg" />
          <Text>Checking authorization...</Text>
        </Box>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to home if not admin
  if (!user.isAdmin) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          gap="lg"
        >
          <Text>
            You do not have permission to access this page.
          </Text>
          <Text semantic="secondary">
            Please contact an administrator if you believe this is an error.
          </Text>
        </Box>
      </div>
    );
  }

  // User is authenticated and is admin, render children
  return <>{children}</>;
}
