import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Heading, Text, Button } from "@mond-design-system/theme";
import { Input } from "@mond-design-system/theme/client";
import { useAuth } from "../providers/useAuth";
import "./LoginPage.css";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { error: authError } = await signIn(email, password);

      if (authError) {
        setError(authError.message || "Failed to sign in");
        setIsLoading(false);
        return;
      }

      // Auth context will update, RequireAdmin will handle redirect
      navigate("/admin");
    } catch {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      className="login-container"
    >
      <Box
        display="flex"
        flexDirection="column"
        gap="lg"
        className="login-card"
      >
        <Box display="flex" flexDirection="column" gap="sm" alignItems="center">
          <Heading level={1} size="2xl">
            Admin Login
          </Heading>
          <Text variant="body">
            Sign in to access the admin panel
          </Text>
        </Box>

        <form onSubmit={handleSubmit} className="login-form">
          <Box display="flex" flexDirection="column" gap="md">
            <Box display="flex" flexDirection="column" gap="xs">
              <label htmlFor="email">
                <Text variant="body" weight="medium">
                  Email
                </Text>
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@filmections.com"
                required
                disabled={isLoading}
              />
            </Box>

            <Box display="flex" flexDirection="column" gap="xs">
              <label htmlFor="password">
                <Text variant="body" weight="medium">
                  Password
                </Text>
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </Box>

            {error && (
              <Box padding="2" className="login-error">
                <Text variant="body">{error}</Text>
              </Box>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </Box>
        </form>
      </Box>
    </Box>
  );
}
