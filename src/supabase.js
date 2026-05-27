import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://cslyuxvinfajetkgencq.supabase.co";

const supabaseAnonKey =
  "sb_publishable_fQMi-Wq3M4qW-DWHcYY9qQ_8RYKaB_P";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);