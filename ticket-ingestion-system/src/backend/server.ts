import { connectDB } from './db';
import { apiHandler } from './routes';

// Connect to MongoDB
await connectDB();

const server = Bun.serve({
    port: process.env.PORT || 3000,
    async fetch(req) {
        const url = new URL(req.url);

        // 1. API Requests
        if (url.pathname.startsWith('/api')) {
            return apiHandler(req);
        }

        // 2. Static Files (Frontend Build)
        // We assume the frontend is built into 'dist' folder at the project root
        let filePath = url.pathname;

        // Default to index.html for root
        if (filePath === '/') {
            filePath = '/index.html';
        }

        // Try to serve the exact file from dist
        const file = Bun.file(`dist${filePath}`); // e.g. dist/assets/index.js
        if (await file.exists()) {
            return new Response(file);
        }

        // 3. SPA Fallback
        // If it's not an API call and file doesn't exist, serving index.html
        // provided it's not looking like a specific asset (js, css, png)
        const isAsset = /\.(js|css|png|jpg|jpeg|gif|svg|ico)$/.test(url.pathname);
        if (!isAsset) {
            const indexFile = Bun.file('dist/index.html');
            if (await indexFile.exists()) {
                return new Response(indexFile);
            }
        }

        return new Response('Not Found. Did you run "bun run build:frontend"?', { status: 404 });
    },
});

console.log(`Server running on http://localhost:${server.port}`);
console.log(`API accessible at http://localhost:${server.port}/api/tickets`);
