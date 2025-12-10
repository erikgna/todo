import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/firebase/admin";
import { getAuthToken } from "@/lib/cookies";

export const config = {
    matcher: ["/dashboard/:path*"],
};

export async function proxy(req: NextRequest) {
    const token = await getAuthToken();

    if (!token) return NextResponse.redirect(new URL("/login", req.url));
    const user = await verifyIdToken(token);
    if (!user) return NextResponse.redirect(new URL("/login", req.url));

    const res = NextResponse.next();
    res.headers.set("x-user-id", user.uid);
    return res;
}
