const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const tables = [
  "Branch",
  "User",
  "Doctor",
  "Patient",
  "Service",
  "MedicalSolution",
  "Offer",
  "Appointment",
  "MedicalRecord",
  "FollowUp",
];

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Set NEXT_PUBLIC_SUPABASE_URL and a Supabase key before checking the database."
  );
}

async function checkTables() {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select("id", { count: "exact", head: true });
    if (error) {
      throw new Error(`Supabase table "${table}" check failed: ${error.message}`, {
        cause: error,
      });
    }
    console.log(`${table}: ${count ?? 0} rows`);
  }
}
checkTables().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
