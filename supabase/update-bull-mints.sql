update public.bulls as bull
set token_mint = values.token_mint
from (
  values
    ('cented', 'DvXrGq4gFaaq2CjYxvesrC2ybGVDpfrkVshvKnRZpump'),
    ('gake', '9sErMXkXJdNyffGAh6QraTwC5VsbgGJbCnErXBxepump'),
    ('traderpow', 'GhtHMugsmxbMh7kH8Jgo6bdUWhXjrGk8oVWVKRstpump'),
    ('jack-duval', 'A28PG8tKxMfmgsTzPq2ncWQwNcrLWUVtDKeSmk5kpump'),
    ('scharo', '368Rs66tV8gKHZvP8wsbpgey25y1iGAyiKB2PWJTpump'),
    ('yenni', '941GhZTNcB2wYKhYoLYfvx9TdWY1iyRbR3YR24Mypump'),
    ('alxcooks', 'FB6e9Sk4pA5w7E7tBygKu933oDn26bJ44ck9577zpump'),
    ('alon', 'FEgv4fW4DdCywHf7WpL8cEY6VQnCtwFvikP6DGgzpump'),
    ('beanz', '6U1t42phUpvoMHz4qjR8T1mMr1DatWRMY3gSpp1Tpump'),
    ('daumen', 'FLdBASHFHY8ZH6cd3Gh3WYyQcTPRhhtWjvhKy41vpump'),
    ('cupsey', 'FLdBASHFHY8ZH6cd3Gh3WYyQcTPRhhtWjvhKy41vpump'),
    ('orangie', 'FUVJiqgg6iQGowe6bDqKW4Gs8KBi6sxDkZdDFD9Jpump'),
    ('the-black-bull', 'GU2HSvF4AUNxctTKbH716U3CFXMyKFoGeRymLmA2pump'),
    ('murad', 'GJp1eD4dBRKYRNBcdbvCRXaQws3EVqJMdSqa6Vs7pump'),
    ('shaams', '55V4cXcczcLNtXJb1A67dYWDzZtAogwSVuKtvkfspump'),
    ('ethan-prosper', 'Ff6J4ZBMjq4YbZ6cvKgGb4jYRN5DqAB9U7YDHoCJpump')
) as values(id, token_mint)
where bull.id = values.id;

select id, name, ticker, token_mint
from public.bulls
order by season_rank;

select token_mint, array_agg(ticker order by ticker) as tickers, count(*) as duplicate_count
from public.bulls
group by token_mint
having count(*) > 1;
