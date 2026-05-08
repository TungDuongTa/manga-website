# VuaTruyen - Next.js Manga Platform

A full-stack manga reader built with Next.js App Router, Better Auth, and MongoDB.

It combines public manga data from OTruyen API with local user features:

- Authentication (email/password + Google OAuth)
- Bookmarks and reading history
- Chapter progress tracking
- Reader level/EXP system
- View-based rankings (daily/weekly/monthly/all-time)
- Nested comments with likes
- Dedicated 18+ library backed by MongoDB collections

## Table of Contents

- [Overview](#overview)
- [Feature Highlights](#feature-highlights)
- [Tech Stack](#tech-stack)
- [Routes](#routes)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Collections](#database-collections)


## Overview

This project is a production-style manga web app focused on:

- Fast content browsing and chapter reading
- Personalized user experience (bookmarks, history, profile, levels)
- Community interaction through threaded comments
- Hybrid data architecture

## Feature Highlights

### Content Discovery

- Home page sections: latest updates, popular, completed, recommendations
- Full browse page with:
  - Search (debounced)
  - Genre filters (multi-select)
  - Status filter (all/ongoing/completed)
  - Grid/list view toggle
- Command palette search (`Ctrl+K`)
- Latest updates page with pagination

### Reading Experience

- Manga detail page with chapter list sorting and read indicators
- Chapter reader with:
  - Prev/next navigation
  - Keyboard shortcuts (`ArrowLeft` / `ArrowRight`)
  - Auto visit tracking with dedupe window
- Bookmark toggle from detail and chapter pages

### Personalization

- Bookmarks tab
  - Sorted by manga latest update timestamp (not bookmark create time)
- Reading history tab
- Reader level system:
  - EXP per chapter
  - Level progress and badge effects
- Profile editing:
  - Display name
  - Avatar URL or local upload (base64)

### Rankings and Community

- Ranking page tabs:
  - Daily, Weekly, Monthly, All Time
- Rankings built from persisted view metrics
- Manga/chapter comments:
  - Threaded replies
  - Likes with optimistic UI updates
  - Pagination
  - Reader level badge per commenter

### 18+ Library

- Fully separate content source from MongoDB
- Routes under `/18+`
- Uses `mangas18` and `chapters18` collections
- Comments disabled on 18+ detail/chapter pages by design

## Tech Stack

- Framework: Next.js 16 (App Router, Server Actions)
- UI: React 19, Tailwind CSS v4, shadcn/ui, Lucide
- Auth: Better Auth + MongoDB adapter
- Database: MongoDB + Mongoose
- Charts/UX utilities: Recharts, Sonner, NProgress, Radix UI
- Language: TypeScript

## Routes

| Route                           | Purpose                                                     |
| ------------------------------- | ----------------------------------------------------------- |
| `/`                             | Home feed (hero, latest, rankings preview, recent comments) |
| `/browse`                       | Search + filters + paginated browsing                       |
| `/latest`                       | Latest manga updates                                        |
| `/ranking`                      | View-based rankings (daily/weekly/monthly/all-time)         |
| `/bookmarks`                    | User bookmarks + reading history                            |
| `/profile`                      | User profile + reader level/EXP                             |
| `/manga/[id]`                   | Manga detail page                                           |
| `/manga/[id]/chapter/[chapter]` | Chapter reader                                              |
| `/18+`                          | 18+ manga library (local DB-driven)                         |
| `/18+/[id]`                     | 18+ manga detail                                            |
| `/18+/[id]/chapter/[chapter]`   | 18+ chapter reader                                          |
| `/sign-in`                      | Email/password + Google sign-in                             |
| `/sign-up`                      | Registration                                                |
| `/api/auth/[...all]`            | Better Auth route handler                                   |

## Project Structure

```text
app/
  (auth)/                # Sign-in/sign-up pages
  api/auth/[...all]/     # Better Auth API route
  manga/, 18+/           # Reader and detail routes
  bookmarks/, profile/   # User pages
  browse/, latest/, ranking/
components/
  manga-*                # Detail, cards, comments, chapter reader UI
database/
  models/                # Mongoose models
  mongoose.ts            # Connection + caching
lib/
  actions/               # Server actions (auth, bookmarks, comments, etc.)
  better-auth/           # Auth client/server setup
  server/                # Server utilities (route inference, level helpers)
scripts/
  test-db.mjs            # Mongo connection smoke test
```

## Getting Started

### 1. Prerequisites

- Node.js 20.9+
- npm 10+
- MongoDB database (local or Atlas)

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Create a `.env` file in the project root. See [Environment Variables](#environment-variables).

### 4. Verify database connection

```bash
npm run test:db
```

### 5. Start development server

```bash
npm run dev
```

Open: `http://localhost:3000`

## Environment Variables

| Variable               | Required   | Purpose                                                    |
| ---------------------- | ---------- | ---------------------------------------------------------- |
| `MONGODB_URI`          | Yes        | MongoDB connection string                                  |
| `BETTER_AUTH_SECRET`   | Yes        | Auth signing/encryption secret                             |
| `BETTER_AUTH_URL`      | Yes        | App base URL for Better Auth (ex: `http://localhost:3000`) |
| `NEXT_PUBLIC_BASE_URL` | Yes        | Public client base URL for Better Auth client              |
| `GOOGLE_CLIENT_ID`     | Optional\* | Google OAuth provider client id                            |
| `GOOGLE_CLIENT_SECRET` | Optional\* | Google OAuth provider client secret                        |

`*` Optional only if you disable Google sign-in in auth configuration. In current code, Google provider is enabled.

### Google OAuth callback URL

For local development, set authorized redirect URI to:

`http://localhost:3000/api/auth/callback/google`

## Database Collections

### App-managed models

- `Bookmark`
- `ReadingProgress`
- `UserReadingStats`
- `MangaView`
- `MangaViewStat`
- `Comment`
- `CommentLike`

Mongoose creates the underlying collection names from these models automatically.
Better Auth also creates its own auth-related collections (users, sessions, accounts, etc.) via MongoDB adapter.

### 18+ collections (you provide data)

- `mangas18`
- `chapters18`

`/18+` routes depend on these collections. Without data, the UI will render empty-state messages.


