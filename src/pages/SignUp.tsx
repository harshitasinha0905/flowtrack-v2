import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import FormField from "../components/ui/FormField";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

const signupSchema = z
  .object({
    fullName: z.string().trim().min(2, "Please enter your full name"),

    email: z.string().email("Please enter a valid email address"),

    password: z.string().min(6, "Password must be at least 6 characters"),

    confirmPassword: z.string(),
  })
  .refine(
    function (data) {
      return data.password === data.confirmPassword;
    },
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    },
  );

type SignupFormData = z.infer<typeof signupSchema>;

function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  async function onSubmit(data: SignupFormData) {
    try {
      const result = await signup(data.email, data.password, data.fullName);

      if (result.session) {
        toast.success("Account created successfully!");
        navigate("/");
        return;
      }

      toast.success(
        "Account created! Please check your email to verify your account.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to create your account. Please try again.",
      );
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md rounded-3xl p-10 shadow-xl shadow-slate-900/5">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-2xl font-bold text-white">
            F
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Create your account
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Sign up to get started with FlowTrack.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            id="fullName"
            label="Full name"
            type="text"
            placeholder="Enter your full name"
            autoComplete="name"
            error={errors.fullName?.message}
            {...register("fullName")}
          />

          <FormField
            id="email"
            label="Email"
            type="email"
            placeholder="Enter your email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />

          <FormField
            id="password"
            label="Password"
            type="password"
            placeholder="Create a password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
          />

          <FormField
            id="confirmPassword"
            label="Confirm password"
            type="password"
            placeholder="Confirm your password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-violet-600 transition-colors hover:text-violet-700 cursor-pointer"
          >
            Sign in
          </Link>
        </p>
      </Card>
    </main>
  );
}

export default Signup;
