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
};

export default function ManageListPage() {
    const supabase = createClient();
    const router = useRouter();
    const params = useParams();
    const listId = params.id as string;

    const [user, setUser] = useState<User | null>(null);
    const [list, setList] = useState<GiftList | null>(null);
    const [gifts, setGifts] = useState<Gift[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newGiftName, setNewGiftName] = useState("");
    const [newGiftUrl, setNewGiftUrl] = useState("");

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }
            setUser(user);

            const { data: listData, error: listError } = await supabase
                .from("gift_lists")
                .select("*")
                .eq("id", listId)
                .single();

            if (listError || !listData || listData.user_id !== user.id) {
                router.push("/dashboard");
                return;
            }

            setList(listData);

            const { data: giftsData } = await supabase
                .from("gifts")
                .select("*")
                .eq("list_id", listId)
                .order("created_at", { ascending: true });

            setGifts(giftsData || []);
            setLoading(false);
        };
        init();
    }, [listId]);

    const addGift = async () => {
        if (!newGiftName.trim() || !user) return;

        const { data, error } = await supabase
            .from("gifts")
            .insert({
                list_id: listId,
                name: newGiftName,
                url: newGiftUrl.trim() || null,
                is_removed: false,
                is_bought: false,
            })
            .select()
            .single();

        if (!error && data) {
            setGifts([...gifts, data]);
            setNewGiftName("");
            setNewGiftUrl("");
            setShowAddModal(false);
        }
    };

    const removeGift = async (giftId: string) => {
        await supabase
            .from("gifts")
            .update({ is_removed: true })
            .eq("id", giftId);
        setGifts(gifts.map(g => g.id === giftId ? { ...g, is_removed: true } : g));
    };

    if (loading) {
        return (
            <div>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div>
            <div>
                <div>
                    <h1>{list?.name}</h1>
                    <a href="/dashboard">
                        Back to Dashboard
                    </a>
                </div>

                <button onClick={() => setShowAddModal(true)}>
                    Add Gift
                </button>

                <div>
                    {gifts.length === 0 ? (
                        <p>No gifts in this list yet</p>
                    ) : (
                        <ul>
                            {gifts.map((gift) => (
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
                                            <span>(removed)</span>
                                        )}
                                    </div>
                                    {!gift.is_removed && (
                                        <button onClick={() => removeGift(gift.id)}>
                                            Remove
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {showAddModal && (
                    <div>
                        <div>
                            <h2>Add Gift</h2>
                            <input
                                type="text"
                                value={newGiftName}
                                onChange={(e) => setNewGiftName(e.target.value)}
                                placeholder="Gift name"
                            />
                            <input
                                type="url"
                                value={newGiftUrl}
                                onChange={(e) => setNewGiftUrl(e.target.value)}
                                placeholder="Link (optional)"
                            />
                            <div>
                                <button onClick={addGift}>
                                    Add
                                </button>
                                <button
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setNewGiftName("");
                                        setNewGiftUrl("");
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}