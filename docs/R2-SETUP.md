# Enable organizer photo uploads

The gallery is implemented, but uploads remain disabled until real R2 credentials and a media domain are configured. Keep credentials in `.env.local` and Vercel environment settings, never in Git or browser code.

## 1. Create a bucket and credentials

In Cloudflare R2, create a bucket for this application. Create an R2 API token with **Object Read & Write** access limited to that bucket. Copy its Access Key ID and Secret Access Key, and your Cloudflare account ID into these existing `.env.local` variables:

```dotenv
R2_ACCOUNT_ID=your_32_character_account_id
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=your_bucket_name
MAX_IMAGE_BYTES=10485760
MEDIA_CDN_BASE_URL=https://media.your-domain.com
```

Use the R2 S3 credentials, not a general Cloudflare API token. Do not add `NEXT_PUBLIC_` to any credential. The SDK derives the S3 endpoint from the account ID. Do not set `R2_ENDPOINT`; it is restricted to isolated localhost test fixtures.

## 2. Connect the media domain

Under the bucket's settings, connect a custom domain you control and use that HTTPS URL as `MEDIA_CDN_BASE_URL`, without the bucket name or a trailing slash. A public `r2.dev` development URL can be used temporarily for local checks; use a custom domain for production.

**Photos are publicly readable by direct URL.** Wedding membership protects the gallery API and controls, not the media URL. Invite-only events and website unpublishing do not make an uploaded file private. Do not upload confidential images. Photos are not automatically displayed on the guest website in this increment.

Final gallery objects have `Cache-Control: no-store`. Ensure Cloudflare cache rules and any other proxy honor this header; do not override it with Cache Everything, Edge TTL, or browser cache rules. Deletion cannot erase copies someone has already downloaded. Existing files are retained as originals; EXIF/location metadata is not stripped.

## 3. Allow browser uploads (CORS)

Add a bucket CORS rule using your **exact** development and deployed application origins. Replace the example production hostname; add a preview hostname only when you need to test that deployment.

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://your-app.vercel.app"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["Content-Type", "If-None-Match"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

If you open the local app at `http://127.0.0.1:3000`, add that exact origin too and keep `APP_BASE_URL` aligned. Upload URLs target R2's S3 endpoint, not the custom media domain. The browser supplies Content-Length automatically; do not try setting it in application JavaScript. The signed request also fixes the file type and requires `If-None-Match: *` to prevent overwriting staging uploads.

## 4. Expire staging files

Add an R2 object lifecycle rule applying **only to the `staging/` prefix**, expiring objects after **1 day**. Do not expire the `weddings/` prefix: it holds saved gallery photos.

Uploads first enter staging. The server verifies length, MIME and image signature, then conditionally copies the object to a permanent gallery key. Staging files are deliberately retained until lifecycle cleanup so a reusable five-minute upload URL cannot replace the source during finalization. Abandoned uploads also expire under this rule. MongoDB upload-intent records have a matching 24-hour TTL.

Rare storage success/database commit failures may leave an unreferenced permanent object, or metadata referring to a removed object. A user retry repairs the ordinary case. There is no automatic orphan reconciliation worker in this increment: compare keys against `photos` and nonexpired `photoUploadIntents` before any manual cleanup; never bulk-delete `weddings/` based on age.

## 5. Apply indexes and restart

With Node 24 and the correct MongoDB configuration:

```powershell
npm run db:photo-indexes
npm run dev
```

The index command is repeatable and creates no photo records. Stop a previous local server before restarting it. Add the same variables to the intended Vercel environment and redeploy after configuration changes; local `.env.local` is not deployed automatically.

## 6. Verify with one photo

1. Sign in as an Admin or Manager and open **Gallery** in a wedding.
2. Upload a JPEG, PNG or WebP under 10 MB. Select a celebration or General wedding photos.
3. Confirm the queue says **Saved to gallery**, refresh, open the photo, and check its event details.
4. Delete that test photo with confirmation and verify that its direct media URL no longer loads. Verify the lifecycle rule later clears staging.

These live checks are still required: automated checks use disposable MongoDB and a local S3 HTTP fixture, not your R2 account. A blocked PUT usually means CORS, an expired signature, changed headers, or incorrect credentials. A successful PUT followed by a failed save can be retried from the same upload queue without duplicating the photo. Keep the dialog open during uploads. Refresh the gallery after an unexpected browser close before choosing the files again.

Provider references: [R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/), [bucket CORS](https://developers.cloudflare.com/r2/buckets/cors/), and [S3 compatibility](https://developers.cloudflare.com/r2/api/s3/api/).
