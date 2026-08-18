// Supabase password - e*!ZFAW6Rvq%4U&

//  Project URL    │ http://127.0.0.1:54321
// REST           │ http://127.0.0.1:54321/rest/v1
// GraphQL        │ http://127.0.0.1:54321/graphql/v1
// Edge Functions │ http://127.0.0.1:54321/functions/v1

// ─────────────────────────────────────────────────────────────╮
// │ 🔑 Authentication Keys                                      │
// ├─────────────┬────────────────────────────────────────────────┤
// │ Publishable │ sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH │
// │ Secret      │ sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz

import AppRoutes from "./routes/AppRoutes";
import { Toaster } from "sonner";

function App() {
  return (
    <>
      <AppRoutes />
      <Toaster position="top-center" />
    </>
  );
}

export default App;
