// app/api/auth/[...all]/route.ts
import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/better-auth/auth";

export const GET = async (request: Request) =>
  toNextJsHandler(await getAuth()).GET(request);

export const POST = async (request: Request) =>
  toNextJsHandler(await getAuth()).POST(request);
