# MENY AI — Chat ↔ Handlekurv Test Suite

**Golden rule:** Every price, quantity, and item mentioned in the chat response must exactly match what appears in the cart. No exceptions.

---

## How to verify

For each test:
1. Send the input message
2. Check the **chat response** (text content)
3. Open the cart (handlekurv icon) and check **cart state**
4. Compare the two — they must agree on item name, quantity, unit, and price

---

## TC-01  Basic add — single item, sold per stk

**Input:** `1 avocado`

| Check | Expected |
|-------|----------|
| Chat says | "Avocado lagt til — 22 kr" |
| Cart: item | Avocado |
| Cart: qty | 1 stk |
| Cart: line total | 22 kr |
| Cart: grand total | 22 kr |

**Verify:** Chat price = cart price ✓

---

## TC-02  Basic add — weight item (the bug from the screenshot)

**Input:** `3 kg tomat`

| Check | Expected |
|-------|----------|
| Chat says | "3 kg tomater til ca. 189 kr" |
| Cart: item | Tomater |
| Cart: qty | 3 kg |
| Cart: price/unit | 63 kr/kg |
| Cart: line total | 189 kr (63 × 3) |

**Common failure:** Chat says 75 kr (3 × 25 pkg-price) while cart also shows 75 kr.  
**Root cause:** `price` field set to package price (25 kr/400g) instead of per-kg price (63 kr/kg).

---

## TC-03  Add multiple items in one message

**Input:** `taco til 4 personer`

| Check | Expected |
|-------|----------|
| Chat mentions | Kjøttdeig, Tacokrydder, Tacoskjell, Rømme, Salsa, Ost |
| Cart count | ≥ 5 items |
| Each cart item price | matches what chat describes |
| Cart total | = sum of all line totals |

**Verify:** No item in chat that's missing from cart; no item in cart not mentioned in chat.

---

## TC-04  Add same item twice — must merge, not duplicate

**Step 1 — Input:** `3 kg tomater`  
Cart state after: Tomater 3 kg / 189 kr

**Step 2 — Input:** `legg til 2 kg tomater til`

| Check | Expected |
|-------|----------|
| Chat says | "Lagt til 2 kg, du har nå 5 kg tomater til ca. 315 kr" |
| Cart: item count | 1 (not 2 separate Tomater entries) |
| Cart: qty | 5 kg |
| Cart: line total | 315 kr (63 × 5) |

**Common failure:** Two separate "Tomater" rows in cart (3 kg + 2 kg).

---

## TC-05  Add same item — name variant must still merge

**Step 1 — Input:** `kjøp tomater 400g`  
**Step 2 — Input:** `og 2 kg ferske tomater`

| Check | Expected |
|-------|----------|
| Cart: item count | 1 merged Tomater entry |
| Quantities | summed correctly |

**Root cause of failure:** "Tomater 400g" and "ferske Tomater" treated as different products.  
**Fix:** fuzzy name normalisation (strips weight suffixes and adjectives before comparing).

---

## TC-06  Remove a specific item

**Setup:** Cart contains Tomater (3 kg) + Laks (2 pk)

**Input:** `fjern tomatene`

| Check | Expected |
|-------|----------|
| Chat says | "Tomater er fjernet fra handlekurven" |
| Cart: Tomater | gone |
| Cart: Laks | still present, unchanged |
| Cart total | only Laks amount remaining |

**Common failure:** Both items removed, or cart total not updated.

---

## TC-07  Remove item not in cart

**Setup:** Empty cart

**Input:** `fjern laks`

| Check | Expected |
|-------|----------|
| Chat says | Something like "Fant ikke laks i handlekurven" |
| Cart state | unchanged (still empty) |
| No REMOVE_ITEMS sent | (or REMOVE_ITEMS with no matching names) |

---

## TC-08  Clear entire cart via chat

**Setup:** Cart has 4 items

**Input:** `tøm handlekurven` / `start på nytt`

| Check | Expected |
|-------|----------|
| Chat says | "Handlekurven er tømt" |
| Cart | empty (0 items) |
| Cart total | 0 kr |

---

## TC-09  Ask for total — chat total must match cart total

**Setup:** Cart has:
- Tomater 3 kg @ 63 kr/kg = 189 kr  
- Kyllingfilet 1 kg @ 178 kr/kg = 178 kr  
- Lettmelk 2 L @ 22 kr/L = 44 kr

**Input:** `hva er totalen?` / `total`

| Check | Expected |
|-------|----------|
| Chat calculates | 189 + 178 + 44 = 411 kr |
| Chat says | "ca. 411 kr" |
| Cart grand total | 411 kr |

**Common failure:** Chat calculates wrong total because it re-reads package prices instead of per-unit prices.

---

## TC-10  Bulk / catering order

**Input:** `50 kg poteter til restaurant`

| Check | Expected |
|-------|----------|
| Chat says | "50 kg poteter til ca. 950 kr" (50 × 19) |
| Cart: qty | 50 kg |
| Cart: price/unit | 19 kr/kg |
| Cart: line total | 950 kr |

**Common failure:** Cart shows 950 kr but chat says 50 × package price.

---

## TC-11  Language switch mid-session — cart labels unchanged

**Step 1:** Order in Norwegian → `3 kg laks`  
**Step 2:** Switch language to EN (globe icon)  
**Step 3 — Input:** `add 2 more kg of salmon`

| Check | Expected |
|-------|----------|
| Chat responds | in English |
| Cart item name | merges (both "Laks" / "Salmon" → same entry) |
| Cart qty | 5 kg |
| Cart total | 5 × 299 = 1495 kr |

---

## TC-12  Modify quantity via chat

**Setup:** Cart has Bananer 1 kg

**Input:** `endre bananer til 3 kg`

| Check | Expected |
|-------|----------|
| Chat says | "Bananer oppdatert til 3 kg, ca. 72 kr" |
| Cart: qty | 3 kg (not 4 kg / not 1+3) |
| Cart: line total | 72 kr (24 × 3) |

---

## TC-13  Fractional weight

**Input:** `0.5 kg laks`

| Check | Expected |
|-------|----------|
| Chat says | "0,5 kg laks til ca. 150 kr" (0.5 × 299 ≈ 150) |
| Cart: qty | 0.5 kg |
| Cart: line total | ~150 kr |

---

## TC-14  Decimal rounding consistency

**Input:** `3 kg tomater` (63 kr/kg × 3 = 189 kr exactly)

| Check | Expected |
|-------|----------|
| Chat says | "ca. 189 kr" |
| Cart total | 189 kr |

No situation where chat says "ca. 188 kr" but cart shows 189 kr (or vice versa due to rounding differences).

---

## TC-15  Items sold per pack — qty in stk not weight

**Input:** `2 pakker spaghetti`

| Check | Expected |
|-------|----------|
| Cart unit | pk |
| Cart: price/unit | 19 kr/pk |
| Cart: line total | 38 kr (19 × 2) |
| Chat says | "2 pakker spaghetti til 38 kr" |

**Do not** use kg as unit for pasta even though it has a weight on the package.

---

## TC-16  No markdown in chat bubbles

**Input:** Any order

| Check | Expected |
|-------|----------|
| Chat bubble | Renders visually bold text (HTML `<strong>`) |
| No raw `**` or `*` | visible in the bubble |
| No raw `|` pipe characters | (no markdown tables) |

---

## TC-17  Cart persists across page refresh

**Setup:** Add 3 items, then refresh the page (F5)

| Check | Expected |
|-------|----------|
| Cart after refresh | same 3 items |
| Cart totals | unchanged |
| Chat history | restored |

---

## TC-18  Price shown in chat matches cart line total (not unit price)

This is the meta-rule that TC-02 through TC-10 all enforce.

When Claude says "X kr" in the chat message, that number must equal `price × qty` as stored in CART_ITEMS — never the raw package/reference price.

| Scenario | Chat says | Cart shows | Pass? |
|----------|-----------|------------|-------|
| 3 kg tomater | ~189 kr | 189 kr | ✓ |
| 3 kg tomater | ~75 kr | 75 kr | ✗ (wrong price) |
| 3 kg tomater | ~189 kr | 75 kr | ✗ (mismatch) |
| 3 kg tomater | ~75 kr | 189 kr | ✗ (mismatch) |

---

## Known bugs fixed (reference)

| Bug | Root cause | Fix |
|-----|-----------|-----|
| 75 kr for 3 kg tomater | `price` field = package price (25 kr/400g), not per-kg (63 kr/kg) | Rewrote price table to per-unit; added explicit rule in system prompt |
| Pipe table in chat | Claude using markdown table syntax | System prompt: "ALDRI bruk markdown-tabeller" |
| `**bold**` asterisks visible | Frontend rendering raw text | Added `renderMarkdown()` to chat bubble renderer |
| Duplicate cart entries | "Tomater 400g" ≠ "Tomater" in name match | Fuzzy merge (`normName()`) strips weights/adjectives before comparing |
