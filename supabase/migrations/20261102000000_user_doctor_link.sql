ALTER TABLE public."User"
  ADD COLUMN IF NOT EXISTS "doctorId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "User_doctorId_key"
  ON public."User" ("doctorId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'User_doctorId_fkey'
      AND conrelid = 'public."User"'::regclass
  ) THEN
    ALTER TABLE public."User"
      ADD CONSTRAINT "User_doctorId_fkey"
      FOREIGN KEY ("doctorId")
      REFERENCES public."Doctor" ("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;

UPDATE public."User" AS users
SET "doctorId" = (
  SELECT doctors.id
  FROM public."Doctor" AS doctors
  WHERE users."branchId" IS NOT NULL
    AND doctors."branchId" = users."branchId"
    AND lower(doctors.email) = lower(users.email)
  LIMIT 1
)
WHERE users.role = 'DOCTOR'
  AND users."doctorId" IS NULL
  AND (
    SELECT count(*)
    FROM public."Doctor" AS doctors
    WHERE users."branchId" IS NOT NULL
      AND doctors."branchId" = users."branchId"
      AND lower(doctors.email) = lower(users.email)
  ) = 1;
