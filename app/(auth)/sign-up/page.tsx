"use client";
import InputField from "@/components/forms/InputField";
import SocialButton from "@/components/social-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { signUpWithEmail } from "@/lib/actions/auth.actions";
import { signUpSchema } from "@/lib/zod/auth.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      userName: "",
      email: "",
      password: "",
    },
    mode: "onBlur",
  });
  const onSubmit = async (data: SignUpFormData) => {
    try {
      const result = await signUpWithEmail(data);
      if (result.success) {
        router.replace("/");
        console.log("success");
      }
    } catch (error) {
      console.error("Sign-up error:", error);
      toast.error("Sign-up failed. Please try again.", {
        description:
          error instanceof Error
            ? error.message
            : "Failed to create an account",
      });
    }
  };
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-md px-4 py-16">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Welcome to VuaTruyen
          </h1>
          <p className="text-muted-foreground">
            Sign up to track your reading progress and bookmarks
          </p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader className="pb-4"></CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <InputField
                name="userName"
                label="UserName"
                Icon={User}
                type="text"
                placeholder="Enter your username"
                register={register}
                error={errors.userName}
              />
              <InputField
                name="email"
                label="Email"
                Icon={Mail}
                type="text"
                placeholder="your@gmail.com"
                register={register}
                error={errors.email}
              />
              <InputField
                name="password"
                label="Password"
                Icon={Lock}
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                register={register}
                error={errors.password}
                children={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                }
              />
              <div>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" className="rounded border-border" />I
                  agree to the Terms of Service and Privacy Policy
                </label>
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Creating Account ..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-center text-sm text-muted-foreground mb-3">
                Already have an account?{" "}
                <Link href="/sign-in" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
              <p className="text-center text-sm text-muted-foreground mb-4">
                Or continue with
              </p>
              <SocialButton />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SignUp;
