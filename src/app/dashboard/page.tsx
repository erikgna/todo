// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";

type GiftList = {
    id: string;
    name: string;
    share_token: string;
    created_at: string;
};

export default function DashboardPage() {
    const supabase = createClient();
    const router = useRouter();

    const [user, setUser] = useState<User | null>(null);
    const [lists, setLists] = useState<GiftList[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newListName, setNewListName] = useState("");

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }
            setUser(user);

            const { data: listsData } = await supabase
                .from("gift_lists")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            setLists(listsData || []);
            setLoading(false);
        };
        init();
    }, []);

    const createList = async () => {
        if (!newListName.trim() || !user) return;

        const shareToken = crypto.randomUUID();

        const { data, error } = await supabase
            .from("gift_lists")
            .insert({
                name: newListName,
                user_id: user.id,
                share_token: shareToken,
            })
            .select()
            .single();

        if (!error && data) {
            setLists([data, ...lists]);
            setNewListName("");
            setShowCreateModal(false);
        }
    };

    const deleteList = async (listId: string) => {
        if (!confirm("Are you sure you want to delete this list?")) return;

        await supabase.from("gift_lists").delete().eq("id", listId);
        setLists(lists.filter(l => l.id !== listId));
    };

    const copyShareLink = (token: string) => {
        const url = `${window.location.origin}/list/${token}`;
        navigator.clipboard.writeText(url);
        alert("Share link copied to clipboard!");
    };

    const logout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
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
                    <h1>My Gift Lists</h1>
                    <button onClick={logout}>
                        Logout
                    </button>
                </div>

                <button
                    onClick={() => setShowCreateModal(true)}
                >
                    Create New List
                </button>

                {lists.length === 0 ? (
                    <div>
                        <p>No gift lists yet. Create your first one!</p>
                    </div>
                ) : (
                    <div>
                        {lists.map((list) => (
                            <div key={list.id}>
                                <div>
                                    <h2>{list.name}</h2>
                                    <button onClick={() => deleteList(list.id)}>
                                        Delete
                                    </button>
                                </div>
                                <div>
                                    <button onClick={() => router.push(`/dashboard/list/${list.id}`)}>
                                        Manage Items
                                    </button>
                                    <button onClick={() => copyShareLink(list.share_token)}>
                                        Copy Share Link
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {showCreateModal && (
                    <div>
                        <div>
                            <h2>Create New Gift List</h2>
                            <input
                                type="text"
                                value={newListName}
                                onChange={(e) => setNewListName(e.target.value)}
                                placeholder="List name"
                                onKeyDown={(e) => e.key === "Enter" && createList()}
                            />
                            <div>
                                <button
                                    onClick={createList}
                                >
                                    Create
                                </button>
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setNewListName("");
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