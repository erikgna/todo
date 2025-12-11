import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/firebase/admin";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
    try {
        const { idToken } = await req.json();

        const decodedToken = await verifyIdToken(idToken);
        if (!decodedToken) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

        const cookieStore = await cookies();
        cookieStore.set("__session", idToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 5,
            path: "/",
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    }
}