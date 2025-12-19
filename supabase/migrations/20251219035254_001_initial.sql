create extension if not exists "uuid-ossp";

create table gift_lists (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    share_token uuid default uuid_generate_v4() unique,
    created_at timestamptz default now()
);

create table gifts (
    id uuid primary key default uuid_generate_v4(),
    list_id uuid not null references gift_lists(id) on delete cascade,
    name text not null,
    url text,
    is_removed boolean default false,
    is_bought boolean default false,
    bought_by uuid references auth.users(id) on delete
    set
        null,
        created_at timestamptz default now()
);

create index idx_gift_lists_user_id on gift_lists(user_id);

create index idx_gift_lists_share_token on gift_lists(share_token);

create index idx_gifts_list_id on gifts(list_id);

alter table
    gift_lists enable row level security;

alter table
    gifts enable row level security;

create policy "Users can view own lists" on gift_lists for
select
    using (auth.uid() = user_id);

create policy "Users can view shared lists" on gift_lists for
select
    using (share_token is not null);

create policy "Users can insert own lists" on gift_lists for
insert
    with check (auth.uid() = user_id);

create policy "Users can update own lists" on gift_lists for
update
    using (auth.uid() = user_id);

create policy "Users can delete own lists" on gift_lists for delete using (auth.uid() = user_id);

create policy "Users can view gifts in accessible lists" on gifts for
select
    using (
        exists (
            select
                1
            from
                gift_lists
            where
                gift_lists.id = gifts.list_id
                and (
                    gift_lists.user_id = auth.uid()
                    or gift_lists.share_token is not null
                )
        )
    );

create policy "List owners can insert gifts" on gifts for
insert
    with check (
        exists (
            select
                1
            from
                gift_lists
            where
                gift_lists.id = gifts.list_id
                and gift_lists.user_id = auth.uid()
        )
    );

create policy "List owners can update own gifts" on gifts for
update
    using (
        exists (
            select
                1
            from
                gift_lists
            where
                gift_lists.id = gifts.list_id
                and gift_lists.user_id = auth.uid()
        )
    );

create policy "Others can mark gifts as bought" on gifts for
update
    using (
        exists (
            select
                1
            from
                gift_lists
            where
                gift_lists.id = gifts.list_id
                and gift_lists.user_id != auth.uid()
                and gift_lists.share_token is not null
        )
    );