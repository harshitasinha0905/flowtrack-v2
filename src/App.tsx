import AppRoutes from "./routes/AppRoutes";
import { Toaster } from "sonner";

function App() {
  return (
    <>
      <AppRoutes />
      <Toaster
        position="bottom-center"
        richColors
        toastOptions={{
          classNames: {
            toast: "!w-[320px] !h-[64px] !justify-center",
            content: "!text-center",
            title: "!text-left",
            description: "!text-left",
            success: "bg-black! text-white! border-black!",
          },
        }}
      />
    </>
  );
}

export default App;
