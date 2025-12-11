"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { auth } from "../../lib/firebase/client";

const schema = z.object({
    email: z.email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
    const router = useRouter();
    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema)
    });

    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = async (data: FormData) => {
        try {
            setIsLoading(true);
            const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
            const idToken = await userCredential.user.getIdToken();

            const response = await fetch("/api/auth/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken }),
            });

            if (!response.ok) throw new Error("Failed to create session");

            router.push("/dashboard");
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-lg">
                <h1 className="text-2xl font-bold text-center mb-6">Login</h1>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            type="email"
                            className="w-full border rounded-xl p-2 focus:outline-none focus:ring"
                            placeholder="you@example.com"
                            {...register("email")}
                        />
                        {errors.email && (
                            <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <input
                            type="password"
                            className="w-full border rounded-xl p-2 focus:outline-none focus:ring"
                            placeholder="••••••••"
                            {...register("password")}
                        />
                        {errors.password && (
                            <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        {isLoading ? "Loading..." : "Login"}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-600 mt-4">
                    Don't have an account? <a className="text-blue-600" href="/register">Register</a>
                </p>
            </div>
        </div>
    );
}