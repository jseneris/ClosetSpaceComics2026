# ClosetSpaceComics 2026

Monorepo MVP for the comic book database: a TypeScript/Express backend on Azure SQL Database
+ Azure Blob Storage, and a React (Vite + TypeScript) frontend. This replaces the legacy
.NET backend (`ClosetSpaceComicsApiPublic`) and the CRA frontend (`ClosetSpaceComics2020`),
porting the same domain model (Publishers, Titles, Issues, Locations, Boxes, Purchases,
Purchase Items) and UI sections (Catalog, Collection, Purchases, About, Footer).

## Structure

```
backend/    Express + TypeScript API, Prisma ORM (Azure SQL), Azure Blob Storage for images, Auth0 JWT auth
frontend/   React + TypeScript + Vite SPA, MUI components, Auth0 login
```

## Prerequisites

- Node.js 20+
- An Azure SQL Database (or local SQL Server for dev)
- An Azure Storage account (Blob Storage) for comic/issue images
- An Auth0 tenant (SPA application + API)

## Getting started

```bash
npm install

# Backend
cp backend/.env.example backend/.env   # fill in DB + Azure + Auth0 values
npm run prisma:generate
npm run prisma:migrate
npm run dev:backend

# Frontend (separate terminal)
cp frontend/.env.example frontend/.env
npm run dev:frontend
```

Backend runs on http://localhost:4000, frontend on http://localhost:5173.

## Notes on migration from the legacy apps

- Domain model ported from `ClosetSpaceComics.Domain` / `ClosetSpaceComics.ServiceNew` (EF entities)
  into `backend/prisma/schema.prisma`.
- API routes ported from `ClosetSpaceComicsAPI/Controllers` (`CatalogController`, `UserController`)
  into `backend/src/routes/catalog.ts` and `backend/src/routes/user.ts`.
- Auth switched from the legacy Firebase-header (`userId`) scheme to Auth0 JWT bearer tokens;
  the authenticated user's Auth0 `sub` claim maps to `User.auth0Id`.
- Frontend components ported from `ClosetSpaceComics2020/src/components/*.js` to TypeScript
  (`frontend/src/components/*.tsx`), same section layout (Header, Catalog, Collection, Purchases,
  About, Footer). CSS (grid/normalize/index/queries) copied as-is.
- Image blobs: legacy `MigrationRepository` used `Microsoft.WindowsAzure.Storage` blob containers;
  the new `backend/src/services/blobStorageService.ts` uses `@azure/storage-blob` for the same purpose.
