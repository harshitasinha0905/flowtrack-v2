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
            toast: "ml-10 !w-[250px] !h-[50px] !justify-center",
            content: "!text-center",
            title: "!text-center",
            description: "!text-center",
            success: "bg-black! text-white! border-black!",
          },
        }}
      />
    </>
  );
}

export default App;
