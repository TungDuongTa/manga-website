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

type UpdateUserProfileInput = {
  displayName: string;
  avatar?: string | null;
};

export const updateUserProfile = async (data: UpdateUserProfileInput) => {
  try {
    const name = data.displayName.trim();
    if (name.length < 2 || name.length > 40) {
      return {
        success: false,
        message: "Display name must be between 2 and 40 characters.",
      };
    }

    const normalizedAvatar = data.avatar?.trim() || null;

    await auth.api.updateUser({
      headers: await headers(),
      body: {
        name,
        image: normalizedAvatar,
      },
    });

    return {
      success: true,
      message: "Profile updated successfully.",
    };
  } catch (error) {
    console.error("Update profile error:", error);
    return { success: false, message: "Failed to update profile." };
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
export const signInWithGoogle = async () => {
  const response = await auth.api.signInSocial({
    body: {
      provider: "google",
      callbackURL: "/",
      disableRedirect: true,
    },
  });

  if (!response.url) {
    throw new Error("Failed to create Google sign-in URL");
  }

  redirect(response.url);
};
