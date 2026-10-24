This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Supabase setup

The application uses `@supabase/supabase-js` for database access. Add these
variables to `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=https://www.your-production-domain.example
JWT_SECRET=replace-with-a-random-secret-at-least-32-bytes
```

Set `NEXT_PUBLIC_SITE_URL` to the canonical production origin before deployment;
it is used to build canonical, Open Graph, and structured-data URLs. If unset,
the metadata currently falls back to `https://lavasmile.com`.
Set `JWT_SECRET` to a randomly generated secret of at least 32 bytes in local
and deployment environments. The application fails closed if it is missing or
too short; do not commit its value. Rotating it invalidates all existing sessions.
Patients whose records do not yet have a password can no longer sign in with
their phone number or a shared default password. Establish their credentials
through an identity-verified process before enabling patient-portal access; this
project does not currently provide an SMS/OTP password-recovery flow.

Apply `supabase/migrations/20261102000000_user_doctor_link.sql` to add the
one-to-one account-to-doctor link. Existing doctor accounts are automatically
linked only when exactly one doctor record has the same email in the same
branch. Link any remaining doctor accounts from the super-admin user screen.
Doctors can then access only appointments and follow-ups assigned to their
linked doctor record; receptionists and branch admins remain limited to their
branch.

For projects with Row Level Security enabled, configure the private
`SUPABASE_SERVICE_ROLE_KEY` on the server. It is never exposed to the browser;
never prefix it with `NEXT_PUBLIC_`. Without that private key, API requests use
the anon key and are subject to the project's RLS policies.

Create the existing tables in the `public` schema using these exact,
case-sensitive names: `Branch`, `User`, `Doctor`, `Patient`, `Service`,
`MedicalSolution`, `Offer`, `Appointment`, `MedicalRecord`, and `FollowUp`.
Keep the existing camel-cased column names and foreign keys in the Prisma
schema; PostgREST uses those foreign keys for embedded selections. The API
generates string IDs and sets `updatedAt` when inserting or updating records.
The existing `prisma/schema.prisma` and local `prisma/dev.db` are retained as
legacy references and are not used by the running application.

Apply the SQL files in `supabase/migrations` to add application-managed
features such as the consent-gated treatment-results gallery. The gallery
requires the `treatment-results` Supabase Storage bucket and the private
`SUPABASE_SERVICE_ROLE_KEY` for signed image uploads and administration.
Only published cases with recorded patient consent are returned to public
visitors; uploaded cases remain drafts until a super admin publishes them.

Run `npm run db:check` to verify that the Supabase key can read all ten tables.
The script prints row counts only and does not read or print patient records.

## Medical solutions management

Medical solutions are stored independently from promotional offers in the
`MedicalSolution` table. Each solution can optionally have a non-negative
price, displayed in Egyptian pounds on the homepage and admin list.

Super admins can create, edit, activate/deactivate, and delete homepage
solutions at `/admin/medical-solutions`. Public clients read active, sorted
solutions from `GET /api/medical-solutions`; requesting
`GET /api/medical-solutions?all=true` requires a super-admin session.
Solution slugs use lowercase English letters, numbers, and hyphens.

## Booking services and offers

The booking form loads active `Service` records, active medical solutions, and
currently valid offers from their public APIs. Super admins can activate or
deactivate legacy booking services at `/admin/services`. Appointment records
store the selected type, title, related IDs, and booking-time price; the server
validates that the selected item is still active and calculates the stored
price from the database.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
