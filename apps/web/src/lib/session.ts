import { cookies } from "next/headers";

export async function readTokenServer(): Promise<string | null> {
  return (await cookies()).get("token")?.value ?? null;
}
