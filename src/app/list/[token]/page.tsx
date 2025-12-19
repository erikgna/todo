"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import { User } from "@supabase/supabase-js";

type GiftList = {
    id: string;
    name: string;
    user_id: string;
};

type Gift = {
    id: string;
    name: string;
    url: string | null;
    is_removed: boolean;
    is_bought: boolean;
    bought_by: string | null;
};

export default function SharedListPage() {
    const supabase = createClient();
    const router = useRouter();
    const params = useParams();
    const token = params.token as string;

    const [user, setUser] = useState<User | null>(null);
    const [list, setList] = useState<GiftList | null>(null);
    const [gifts, setGifts] = useState<Gift[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push(`/login?redirect=/list/${token}`);
                return;
            }
            setUser(user);

            const { data: listData, error: listError } = await supabase
                .from("gift_lists")
                .select("*")
                .eq("share_token", token)
                .single();

            if (listData?.user_id === user?.id) {
                router.push("/dashboard");
                return;
            }

            if (listError || !listData) {
                setError("List not found");
                setLoading(false);
                return;
            }

            setList(listData);

            const { data: giftsData } = await supabase
                .from("gifts")
                .select("*")
                .eq("list_id", listData.id)
                .order("created_at", { ascending: true });

            setGifts(giftsData || []);
            setLoading(false);
        };
        init();
    }, [token]);

    const markAsBought = async (giftId: string) => {
        await supabase
            .from("gifts")
            .update({ is_bought: true, bought_by: user?.id })
            .eq("id", giftId);
        setGifts(gifts.map(g => g.id === giftId ? { ...g, is_bought: true, bought_by: user?.id ?? null } : g));
    };

    const unmarkAsBought = async (giftId: string) => {
        await supabase
            .from("gifts")
            .update({ is_bought: false, bought_by: null })
            .eq("id", giftId);
        setGifts(gifts.map(g => g.id === giftId ? { ...g, is_bought: false, bought_by: null } : g));
    };

    if (loading) {
        return (
            <div>
                <p>Loading...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <p>{error}</p>
            </div>
        );
    }

    const isOwner = user?.id === list?.user_id;

    return (
        <div>
            <div>
                <div>
                    <div>
                        <h1>{list?.name}</h1>
                        {isOwner && (
                            <p>This is your list</p>
                        )}
                    </div>
                    <a href="/dashboard">
                        My Dashboard
                    </a>
                </div>

                <div>
                    {gifts.length === 0 ? (
                        <p>No gifts in this list</p>
                    ) : (
                        <ul>
                            {gifts
                                .filter(gift => {
                                    if (isOwner) return !gift.is_bought;
                                    return true;
                                })
                                .map((gift) => (
                                    <li key={gift.id}>
                                        <div>
                                            <span>
                                                {gift.name}
                                            </span>
                                            {gift.url && (
                                                <a
                                                    href={gift.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    Link
                                                </a>
                                            )}
                                            {gift.is_removed && (
                                                <span>(removed by owner)</span>
                                            )}
                                            {gift.is_bought && (
                                                <span>(bought)</span>
                                            )}
                                        </div>
                                        {!isOwner && !gift.is_removed && (
                                            gift.is_bought ? (
                                                gift.bought_by === user?.id && (
                                                    <button onClick={() => unmarkAsBought(gift.id)}>
                                                        Unmark
                                                    </button>
                                                )
                                            ) : (
                                                <button onClick={() => markAsBought(gift.id)}>
                                                    Mark as Bought
                                                </button>
                                            )
                                        )}
                                    </li>
                                ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}