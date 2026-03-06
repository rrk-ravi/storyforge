# StoryForge - Full Stack Story Publishing Platform

StoryForge is a production-ready full stack web application inspired by platforms like Short Story Lovers.
It allows readers to discover stories and authors to register, log in, draft, edit, publish, and manage their writing.

## Monorepo Structure

- `client/`: React + TypeScript + Vite frontend
- `server/`: Express + TypeScript backend API
- `server/prisma/`: Prisma schema and migrations

## Core Capabilities

- Secure authentication with HTTP-only JWT cookies
- Email verification flow with secure one-time token
- Forgot-password and reset-password flow
- Protected author dashboard
- Story CRUD for authenticated users
- Rich-text story editor with sanitized HTML content
- Draft and publish workflow
- Story moderation queue (admin approve/reject)
- Reader engagement: likes, comments, bookmarks
- Slug-based public story URLs
- Search and tag filtering for readers
- API validation with Zod
- Typed Prisma data access layer

## Tech Stack

- Frontend: React, React Router, TanStack Query, Axios, TypeScript, Vite
- Backend: Express, Prisma, PostgreSQL, Zod, JWT, bcrypt, nodemailer, sanitize-html
- Security: Helmet, CORS, cookie-parser, strict env validation

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 14+

## Environment Setup

### Server

Create `server/.env` from `server/.env.example` and provide:

- `DATABASE_URL`
- `JWT_SECRET` (24+ characters)
- `CLIENT_ORIGIN`
- Optional: `PORT`, `JWT_EXPIRES_IN`, `BCRYPT_SALT_ROUNDS`, `APP_BASE_URL`, SMTP values

### Client

Create `client/.env` from `client/.env.example`.

- `VITE_API_URL` is optional locally (`/api` is used by default)

## First Run

1. Install all dependencies:
   `npm install`
2. Generate Prisma client:
   `npm run prisma:generate`
3. Run migrations:
   `npm run prisma:migrate`
4. Start both apps:
   `npm run dev`

## Admin Setup

Promote an existing user to admin for moderation:

`npm run make-admin --workspace server -- user@example.com`

This sets role to `ADMIN` and marks the account as verified.

## Fully Free Online Setup

You can run this app with a zero-cost cloud stack:

- Database: Neon (PostgreSQL free tier)
- Image storage: Cloudinary free tier
- Frontend hosting: Vercel free tier
- Backend hosting: Render free web service

Deployment helper files are included:

- `render.yaml` for Render Blueprint deploy
- `client/vercel.json` for `/api` proxy to Render and SPA routing
- `.node-version` pinned to `22.13.0`

### 1. Neon database

Create a Neon project and copy the pooled connection string.
Set `DATABASE_URL` in backend env to the Neon URL.

### 2. Cloudinary image uploads

Create a Cloudinary account and copy:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Set these in backend env. Story editor now supports direct cover upload through `/api/uploads/image`.

### 3. Apply schema in cloud

Run:

`npm run prisma:generate`

`npm run prisma:deploy`

### 4. Vercel frontend

Set project root to `client`, then set:

- `VITE_API_URL=/api`

In `client/vercel.json`, replace:

- `https://YOUR_RENDER_SERVICE.onrender.com`

with your actual Render backend URL.

Frontend: `http://localhost:5173`
Backend: `http://localhost:5000`

## Production Commands

- Build all: `npm run build`
- Start API: `npm run start`
- Deploy migrations: `npm run prisma:deploy`

## Deployment Notes

- Set `NODE_ENV=production` on the server
- Configure `CLIENT_ORIGIN` to the deployed frontend URL
- Use HTTPS in production so secure cookies are enforced
- Put client and server behind a reverse proxy/CDN as needed
