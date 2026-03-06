# StoryForge Client

Frontend application for the StoryForge publishing platform.

## Stack

- React 19 + TypeScript
- Vite 7
- React Router
- TanStack Query
- Axios

## Local Development

1. From workspace root, install dependencies:
   `npm install`
2. Configure environment:
   `cp .env.example .env` (or create `.env` manually on Windows)
3. Start full stack from root:
   `npm run dev`

The Vite dev server proxies `/api` requests to `http://localhost:5000`.

## Environment Variables

`VITE_API_URL`:
- Optional in local development
- Defaults to `/api`
- Set this in production when frontend and API are served from different domains

## Build

From root:

`npm run build`

This builds server and client artifacts.

## Main Features

- Public story discovery and search
- Story detail page with view tracking, likes, comments, and bookmarks
- Secure login/register/logout flow
- Email verification and password reset pages
- Author dashboard for draft/published management and bookmark collection
- Rich-text story editor for create and update flows
- Admin moderation dashboard for story review
