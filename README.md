# Instrument Parts Tracker

Next.js 14 app for tracking instrument parts and photos.

## Local development

Run `npm install` and `npm run dev` from this directory. Local development uses a SQLite database created automatically at `data/instrumentdata.sqlite`; PostgreSQL is not needed to try the app locally. Photos use Vercel Blob, so configure `BLOB_READ_WRITE_TOKEN` in `.env.local` to enable uploads.

## Deploy to Vercel

Vercel Functions do not provide durable local disk storage. SQLite is only a local-development fallback; production records must use PostgreSQL.

1. In the Vercel project, open **Storage** and connect a PostgreSQL provider (for example, Neon). Link it to the project and enable the deployment environments you use. The project must receive `POSTGRES_URL` or `POSTGRES_URL_NON_POOLING`.
2. Create and link a Vercel Blob store from **Storage**. It supplies `BLOB_READ_WRITE_TOKEN`, required by the image upload endpoint.
3. Redeploy after linking both stores. The app creates the `items` table and index automatically on the first database request.
4. Open the deployment URL and submit a test entry with an image. PostgreSQL stores the record and Blob stores the image, preserving both across deployments and function instances.

Never commit `.env.local` or paste database/blob credentials into source files. If adding variables manually, set them in Vercel's project Environment Variables and redeploy.

## Checks

- `npm run lint`
- `npm run build`
