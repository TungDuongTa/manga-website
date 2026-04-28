"use server";
import { auth } from "../better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/database/mongoose";
import { CommentModel } from "@/database/models/comment.model";
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
    const requestHeaders = await headers();
    const session = await auth.api.getSession({
      headers: requestHeaders,
    });
    const userId = session?.user?.id;
    if (!userId) {
      return {
        success: false,
        message: "Please sign in to update your profile.",
      };
    }

    const name = data.displayName.trim();
    if (name.length < 2 || name.length > 40) {
      return {
        success: false,
        message: "Display name must be between 2 and 40 characters.",
      };
    }

    const normalizedAvatar = data.avatar?.trim() || null;

    await auth.api.updateUser({
      headers: requestHeaders,
      body: {
        name,
        image: normalizedAvatar,
      },
    });

    // Keep historical comments in sync with latest profile data.
    await connectToDatabase();
    await CommentModel.updateMany(
      {
        userId,
        $or: [
          { userName: { $ne: name } },
          { userImage: { $ne: normalizedAvatar || "" } },
        ],
      },
      {
        $set: {
          userName: name,
          userImage: normalizedAvatar || "",
        },
      },
    );

    revalidatePath("/");
    revalidatePath("/profile");

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
