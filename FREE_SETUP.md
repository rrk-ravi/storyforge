# StoryForge Free-Tier Setup

This guide configures StoryForge with a fully free cloud stack.

## Recommended Free Stack

- Database: Neon (free PostgreSQL)
- Media storage: Cloudinary (free image/video tier)
- Frontend: Vercel (free)
- Backend: Render (free)

## 0) Repository deployment files already included

This repo now includes:

- `render.yaml` (Render Blueprint for backend)
- `client/vercel.json` (Vercel API proxy + SPA fallback)
- `.node-version` (Node 22.13.0)

Before deploying, replace this placeholder in `client/vercel.json`:

- `https://YOUR_RENDER_SERVICE.onrender.com`

## 1) Create free services

1. Create Neon account and project.
2. Create Cloudinary account.
3. Create Vercel account.
4. Create Render account.

## 2) Deploy backend on Render (Blueprint)

1. In Render dashboard, choose **Blueprint** and connect your GitHub repo.
2. Render detects `render.yaml` and creates the `storyforge-api` web service.
3. Keep the generated defaults for build/start commands from the file.
4. Fill required secret env vars in Render:
	- `DATABASE_URL`
	- `JWT_SECRET`
	- `CLIENT_ORIGIN`
	- `APP_BASE_URL`
	- `CLOUDINARY_CLOUD_NAME`
	- `CLOUDINARY_API_KEY`
	- `CLOUDINARY_API_SECRET`

Optional email env vars:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

## 3) Configure backend environment manually (if not using Blueprint)

Set these variables on backend host:

- NODE_ENV=production
- PORT=5000
- DATABASE_URL=<Neon pooled URL>
- JWT_SECRET=<long random string>
- JWT_EXPIRES_IN=7d
- CLIENT_ORIGIN=<your Vercel app URL>
- APP_BASE_URL=<your Vercel app URL>
- BCRYPT_SALT_ROUNDS=12
- CLOUDINARY_CLOUD_NAME=<from Cloudinary>
- CLOUDINARY_API_KEY=<from Cloudinary>
- CLOUDINARY_API_SECRET=<from Cloudinary>

Optional SMTP:

- SMTP_HOST
- SMTP_PORT
- SMTP_USER
- SMTP_PASS
- SMTP_FROM

## 4) Configure frontend on Vercel

1. Import same GitHub repo in Vercel.
2. Set **Root Directory** to `client`.
3. Build command: `npm run build`
4. Output directory: `dist`
5. Environment variable:
	- `VITE_API_URL=/api`

Because `client/vercel.json` proxies `/api/*` to Render, auth cookies are more reliable than direct cross-origin calls.

## 5) Configure frontend environment

Set on Vercel:

- VITE_API_URL=<your backend public URL>/api

If using `client/vercel.json` proxy, keep this as `VITE_API_URL=/api`.

## 6) Initialize schema on cloud DB

From project root:

```bash
npm install
npm run prisma:generate
npm run prisma:deploy
```

## 7) Build and run checks

```bash
npm run lint
npm run build
```

## 8) Promote admin account

After creating your first user account:

```bash
npm run make-admin --workspace server -- you@example.com
```

## Notes

- Free plans can sleep or throttle; this is normal.
- Keep database backups regularly.
- Use HTTPS in production so secure cookies work as expected.
- After backend deploy URL is known, update `client/vercel.json` placeholder and redeploy Vercel.
