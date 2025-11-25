import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { generateGroupsWithClaude } from './src/services/claudeApi';

/**
 * Vite plugin to handle /api routes in development
 * Uses the same Claude API client as the Vercel route
 */
function apiRoutesPlugin() {
  return {
    name: 'api-routes',
    configureServer(server: { middlewares: { use: (handler: (req: { url?: string; method?: string; on: (event: string, callback: (chunk: Buffer) => void) => void }, res: { statusCode: number; setHeader: (name: string, value: string) => void; end: (data: string) => void }, next: () => void) => void) => void } }) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/generate-groups' && req.method === 'POST') {
          const apiKey = process.env.VITE_ANTHROPIC_API_KEY;

          if (!apiKey) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'VITE_ANTHROPIC_API_KEY not set in environment' }));
            return;
          }

          let body = '';
          req.on('data', (chunk: Buffer) => {
            body += chunk.toString();
          });

          req.on('end', async () => {
            try {
              const { movies, groupCount } = JSON.parse(body);

              if (!movies || !Array.isArray(movies) || movies.length < 20) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'At least 20 movies required' }));
                return;
              }

              const result = await generateGroupsWithClaude(movies, groupCount, apiKey);

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (error) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: `Failed to generate groups: ${error}` }));
            }
          });
        } else {
          next();
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), apiRoutesPlugin()],
  optimizeDeps: {
    include: ['@mond-design-system/theme'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    server: {
      deps: {
        inline: ['@mond-design-system/theme'],
      },
    },
  },
});
