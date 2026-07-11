# Hearthlight

A round-based city-defense incremental, sibling to The Ruins Remember.
Something in the dark keeps eating the towns. Light the Heart. Last longer.

## The loop

1. **Day** (~25s, or call the dusk early): Glow trickles in; you are offered a
   draft of three structures and place **one**. That is the whole building
   system — no roads, no zoning, one decision with adjacency depth.
2. **Night**: shades creep from the rim toward what you built. One verb —
   send the Warden. Watchtowers intercept, lanterns slow, palisades taunt.
   Unguarded structures are eaten; every loss dims the Heart.
3. **The fall**: night N sends N shades — the dark always wins eventually.
   When the Heart goes out, nights survived become **Embers**.
4. **The fire**: spend Embers on permanent upgrades (start faster, go longer,
   widen the build space) and begin again, longer.

Round 1 ends inside five minutes with a purchase affordable immediately.

## Running

Served by the root Vite dev server as a second page:

```sh
npm run dev                 # from the repo root
# open http://localhost:5173/hearthlight/index.html
```

## Testing

Everything is deterministic — all randomness flows through an injected rng.

```sh
npx vitest --run hearthlight       # engine unit tests
npm run hearthlight:balance        # bot profiles + loop-promise assertions
```

The bot plays three profiles (passive / builder / keeper) plus a five-round
meta arc, and asserts the loop's promises: a do-nothing round still ends and
pays, playing beats not playing, round 1 is snappy, meta lengthens runs, and
identical seeds produce identical rounds.

## Design doctrine (inherited from The Ruins Remember)

- Decisions, not busywork. One placement per day; one verb per night.
- The wall always wins; how long you delay it is the scoreboard.
- Randomness is bounded and visible (draft pity guarantees a defense option).
- Meta pre-pays costs; it never skips decisions.
- Every change is measured by bots under seeds before it ships.

## Slice status / next work

- [x] Engine: map, structures, draft, day/night cycle, shades, wardens, fall
- [x] Ember shop (6 upgrades), bot harness with assertions, 13 unit tests
- [x] Playable canvas UI at /hearthlight/
- [ ] Multi-seed averaging in the harness (single-seed arcs are noisy)
- [ ] Round-1 length tuning with a human hand on the controls (~13 nights
      may still be long; target 6-8)
- [ ] Save/load persistence (localStorage)
- [ ] More structures + a second meta tier; night events; sound
