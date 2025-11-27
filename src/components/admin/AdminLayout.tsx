import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Box, Heading, Button } from "@mond-design-system/theme";
import { useAuth } from "../../providers/useAuth";
import "./AdminLayout.css";

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavLink {
  path: string;
  label: string;
}

const NAV_LINKS: NavLink[] = [
  { path: "/admin", label: "Dashboard" },
  { path: "/admin/generate", label: "Generate Groups" },
  { path: "/admin/groups", label: "Group Pool" },
  { path: "/admin/build", label: "Build Puzzle" },
  { path: "/admin/puzzles", label: "Puzzle Queue" },
  { path: "/admin/themes", label: "Theme Manager" },
  { path: "/admin/analytics", label: "Analytics" },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <Box display="flex" className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <Box display="flex" flexDirection="column" gap="lg" padding="4">
          <Box display="flex" flexDirection="column" gap="sm">
            <Heading level={2} size="lg">
              Filmecules Admin
            </Heading>
            {user?.email && (
              <div className="admin-user-email">{user.email}</div>
            )}
          </Box>

          <nav className="admin-nav">
            <Box display="flex" flexDirection="column" gap="xs">
              {NAV_LINKS.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`admin-nav-link ${isActive ? "active" : ""}`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </Box>
          </nav>

          <div style={{ marginTop: "auto" }}>
            <Button
              variant="primary"
              size="md"
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </div>
        </Box>
      </aside>

      {/* Main content */}
      <main className="admin-main">
        {children}
      </main>
    </Box>
  );
}
