CREATE TABLE IF NOT EXISTS public."TreatmentResult" (
  "id" TEXT PRIMARY KEY,
  "procedure" TEXT NOT NULL CHECK (char_length("procedure") BETWEEN 2 AND 120),
  "branchName" TEXT NOT NULL CHECK (char_length("branchName") BETWEEN 2 AND 120),
  "beforeImagePath" TEXT,
  "afterImagePath" TEXT,
  "patientConsent" BOOLEAN NOT NULL DEFAULT FALSE,
  "consentReference" TEXT NOT NULL CHECK (char_length("consentReference") BETWEEN 2 AND 120),
  "consentConfirmedAt" TIMESTAMPTZ,
  "consentConfirmedBy" TEXT,
  "consentRevokedAt" TIMESTAMPTZ,
  "consentRevokedBy" TEXT,
  "isPublished" BOOLEAN NOT NULL DEFAULT FALSE,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "TreatmentResult_published_consent_check"
    CHECK (
      NOT "isPublished"
      OR (
        "patientConsent"
        AND "beforeImagePath" IS NOT NULL
        AND "afterImagePath" IS NOT NULL
      )
    )
);

CREATE INDEX IF NOT EXISTS "TreatmentResult_public_order_idx"
  ON public."TreatmentResult" ("displayOrder", "createdAt" DESC)
  WHERE "isPublished" = TRUE AND "patientConsent" = TRUE;

ALTER TABLE public."TreatmentResult" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."TreatmentResult" FROM anon, authenticated;
GRANT SELECT ON public."TreatmentResult" TO anon, authenticated;

DROP POLICY IF EXISTS "Published treatment results are publicly readable"
  ON public."TreatmentResult";
CREATE POLICY "Published treatment results are publicly readable"
  ON public."TreatmentResult"
  FOR SELECT
  TO anon, authenticated
  USING ("isPublished" = TRUE AND "patientConsent" = TRUE);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'treatment-results',
  'treatment-results',
  TRUE,
  8388608,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
