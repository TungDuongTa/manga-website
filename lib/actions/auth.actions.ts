"use server";
import { auth } from "../better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
export const signUpWithEmail = async (data: SignUpFormData) => {
  try {
    const response = await auth.api.signUpEmail({
      body: {
        name: data.userName,
        email: data.email,
        password: data.password,
      },
    });
    return { success: true, message: "Sign-up successful" };
  } catch (error) {
    console.error("Sign-up error:", error);
    return { success: false, message: "Sign-up failed" };
  }
};

export const signOut = async () => {
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch (error) {
    console.error("Sign-out error:", error);
    return { success: false, message: "Sign-out failed" };
  }
};

export const signInWithEmail = async (data: SignInFormData) => {
  try {
    const response = await auth.api.signInEmail({
      body: {
        email: data.email,
        password: data.password,
      },
    });
    return { success: true, message: "Sign-in successful" };
  } catch (error) {
    console.error("Sign-in error:", error);
    return {
      success: false,
      message: "Email or password is not correct. Please try again",
    };
  }
};
