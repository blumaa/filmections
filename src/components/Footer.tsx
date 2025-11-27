import { Box, Text, Link } from "@mond-design-system/theme";
import "./Footer.css";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <Box display="flex" alignItems="center" justifyContent="center" paddingBottom="2" gap="xxs">
        <Text size="2xs" semantic="secondary">
          © {currentYear} Filmecules
        </Text>
        <Text size="2xs" semantic="secondary">
          |
        </Text>
        <Link
          href="https://github.com/blumaa/mond-design-system"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Text size="xs" semantic="secondary">
            Built with Mond Design System
          </Text>
        </Link>
        <Text size="2xs" semantic="secondary">
          |
        </Text>
        <Link href="mailto:blumaa@gmail.com">
          <Text size="2xs" semantic="secondary">
            Contact
          </Text>
        </Link>
      </Box>
    </footer>
  );
}
