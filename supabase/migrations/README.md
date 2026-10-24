# Supabase migrations

Apply these SQL migrations to the production Supabase project before deploying
the matching application changes. The treatment-results migration creates the
consent-gated public gallery table and its public image bucket.

The application server must have `SUPABASE_SERVICE_ROLE_KEY` configured for
administrative uploads and changes. Keep that key private; never expose it to
the browser.
