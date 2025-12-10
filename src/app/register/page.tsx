"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { redirect } from "next/navigation";
import { auth } from "../../lib/firebase/client";

const schema = z
    .object({
        name: z.string().min(2, "Name must have at least 2 characters"),
        email: z.email("Invalid email"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export default function RegisterPage() {
    const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = async (data: any) => {
        try {
            setIsLoading(true);
            await createUserWithEmailAndPassword(auth, data.email, data.password);
            redirect("/login");
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-lg">
                <h1 className="text-2xl font-bold text-center mb-6">Create an Account</h1>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <input
                            type="text"
                            className="w-full border rounded-xl p-2 focus:outline-none focus:ring"
                            placeholder="John Doe"
                            {...register("name")}
                        />
                        {errors.name && (
                            <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
                        )}
                    </div>

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

                    <div>
                        <label className="block text-sm font-medium mb-1">Confirm Password</label>
                        <input
                            type="password"
                            className="w-full border rounded-xl p-2 focus:outline-none focus:ring"
                            placeholder="••••••••"
                            {...register("confirmPassword")}
                        />
                        {errors.confirmPassword && (
                            <p className="text-red-600 text-sm mt-1">{errors.confirmPassword.message}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition"
                    >
                        Register
                    </button>
                </form>

                <p className="text-center text-sm text-gray-600 mt-4">
                    Already have an account? <a className="text-blue-600" href="/login">Log in</a>
                </p>
            </div>
        </div>
    );
}
