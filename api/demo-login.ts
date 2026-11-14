
import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({
      error: "Method not allowed",
    });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const demoEmail = process.env.DEMO_USER_EMAIL;
  const demoPassword = process.env.DEMO_USER_PASSWORD;

  console.warn("Demo login configuration:", {
  hasSupabaseUrl: Boolean(supabaseUrl),
  hasAnonKey: Boolean(supabaseAnonKey),
  hasDemoEmail: Boolean(demoEmail),
  hasDemoPassword: Boolean(demoPassword),
});

  if (!supabaseUrl || !supabaseAnonKey || !demoEmail || !demoPassword) {
    return response.status(500).json({
      error: "Demo sign-in is not configured",
    });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email: demoEmail,
    password: demoPassword,
  });

  if (error || !data.session) {
    // console.error("Demo sign-in failed:", error?.message);
    console.error("Demo sign-in failed:", error);

    return response.status(401).json({
      error: "Demo sign-in failed",
    });
  }

  return response.status(200).json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });
}





