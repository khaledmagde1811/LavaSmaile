import "server-only";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import type { Database } from "@/lib/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServerKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? supabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServerKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be configured"
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseServerKey, {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
});

export function createRecordId(): string {
  return randomUUID();
}
