import { cookies } from "next/headers";

export async function getAuthToken() {
    return (await cookies()).get("__session")?.value ?? null;
}
