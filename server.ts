import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import apiRoutes from './src/server/routes/apiRoutes';
import { connectDB } from './src/server/config/db';
import { seedDatabaseIfEmpty } from './src/server/seed/seedData';
import { errorHandler } from './src/server/middleware/errorHandler';
import { warnIfAdminUnconfigured } from './src/server/config/adminCredentials';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

/**
 * `npm run dev` passes --dev so the storefront is served by Vite straight from
 * `src`. Previously the mode was decided purely by NODE_ENV, which this
 * repository's `.env` sets to "production" for deployment reasons - so `dev`
 * silently served the prebuilt `dist/` bundle and every source change appeared
 * to have no effect until `npm run build` was run by hand. `npm start` keeps the
 * NODE_ENV behaviour so Render still serves the compiled app.
 */
const isDevServer = process.argv.includes('--dev');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve generated images from /src/assets/images
app.use('/src/assets/images', express.static(path.resolve(__dirname, 'src/assets/images')));

// Mount API Routes
app.use('/api', apiRoutes);

// API Error Handler
app.use('/api', errorHandler);

async function startServer() {
  try {
    // Fail loudly at boot if the administrator cannot sign in at all, instead of
    // letting every login attempt return an indistinguishable 401.
    warnIfAdminUnconfigured();

    // Initialize Database
    await connectDB();
    await seedDatabaseIfEmpty();

    if (!isDevServer && process.env.NODE_ENV === 'production') {
      const distPath = path.resolve(__dirname, 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        // The static catch-all must never swallow an API path: a mistyped or
        // unimplemented /api route previously returned index.html with HTTP 200,
        // so the client parsed the SPA shell as JSON (null) and reported a
        // misleading "Request failed with status 200" instead of a real 404.
        if (req.path.startsWith('/api')) {
          res.status(404).json({ success: false, message: 'API endpoint not found.' });
          return;
        }
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    } else {
      // In dev mode, mount Vite middlewares
      const { createServer } = await import('vite');
      const vite = await createServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(
        `🚀 Marketly Full-Stack Commerce Engine listening on port ${PORT} (${
          isDevServer ? 'vite dev server' : 'static build'
        })`
      );
    });
  } catch (error) {
    console.error('Fatal server startup error:', error);
  }
}

startServer();
