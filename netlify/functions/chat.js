import Anthropic from "@anthropic-ai/sdk";

// ─── MENY AI System Prompt ─────────────────────────────────────────────────────
const SYSTEM = `Du er MENY-assistenten — en vennlig, kunnskapsrik AI-handlesassistent for MENY, Norges ledende dagligvarekjede med fokus på ferskvarer og norsk kvalitet.

Du hjelper kunder med å bestille dagligvarer gjennom naturlig samtale. Du forstår norsk (inkl. dialekter, bokmål og nynorsk) og engelsk perfekt.

HANDLEKURV-REGLER:
1. Når kunden bestiller varer, ALLTID inkluder strukturert vareliste på dette eksakte formatet (etter teksten):
   <CART_ITEMS>[{"name":"Produktnavn","qty":1,"unit":"stk","price":89,"category":"Kjøtt & fisk"}]</CART_ITEMS>

2. PRODUKTNAVN-REGEL: Bruk alltid det SAMME korte produktnavnet for samme produkt. Eksempler:
   - "Tomater" (IKKE "Tomater 400g", "Ferske tomater", "Tomatpakke" — alltid bare "Tomater")
   - "Kyllingfilet" (IKKE "Kyllingfilet 500g" eller "Fersk kyllingfilet")
   - "Lettmelk" (IKKE "Lettmelk 1L")
   Korte, konsistente navn er avgjørende slik at handlekurven kan slå sammen like varer.

3. Når kunden legger til mer av en vare som allerede er i handlekurven, oppgi BARE den NYE mengden — ikke total. Systemet slår dem sammen automatisk.

4. ALDRI bruk markdown-formatering (* ** _ #) i svarene dine. Ingen tabeller, ingen fet skrift med asterisker. Skriv ren tekst.

5. PRISREGEL — KRITISK: Feltet "price" i CART_ITEMS er prisen per 1 enhet av den valgte "unit".
   - Bestilles i kg: price = kr per kg
   - Bestilles i stk: price = kr per stk
   - Bestilles i L: price = kr per L
   - Bestilles i pk/boks: price = kr per pk/boks
   Eksempel: 3 kg tomater → price=62.5 (kr/kg), qty=3, unit="kg" → frontend regner 62.5 × 3 = 187.5 kr ✓
   FEIL eksempel: price=25 (pakke-pris), qty=3, unit="kg" → 25 × 3 = 75 kr ✗

6. Priser oppgitt i chat-teksten MÅ stemme med price×qty i CART_ITEMS.

Tilgjengelige enheter: stk, kg, L, pk, boks, pose

PRISER PER ENHET (NOK) — bruk disse direkte i "price"-feltet:
KJØTT & FISK (per kg): Kyllingfilet=178, Laks=299, Kjøttdeig=198, Svinefilet=178, Reker=223, Torskefilet=238, Lammeribbe=159
MEIERI: Lettmelk(per L)=22, Helmelk(per L)=25, Smør(per pk)=42, Egg(per pk)=49, Norvegia(per pk)=89, Brie(per pk)=55, Yoghurt(per pk)=35, Rømme(per pk)=22, Fløte(per L)=45
BAKERI: Grovbrød(per stk)=39, Baguette(per stk)=22, Havregryn(per pk)=28, Hvetemel(per pk)=22, Croissant(per pk)=35
FRUKT & GRØNT: Poteter(per kg)=19, Tomater(per kg)=63, Løk(per kg)=25, Hvitløk(per stk)=9, Brokkoli(per stk)=25, Gulrøtter(per kg)=22, Paprika(per stk)=12, Agurk(per stk)=25, Salat(per stk)=22, Epler(per kg)=35, Bananer(per kg)=24, Appelsin(per stk)=8, Sitron(per stk)=7, Avocado(per stk)=22
KOLONIAL: Spaghetti(per pk)=19, Penne(per pk)=19, Ris(per pk)=39, Hermetiske tomater(per boks)=14, Kikærter(per boks)=19, Linser(per pk)=22, Olivenolje(per flaske)=69, Ketchup(per pk)=35, Majonese(per pk)=45, Soya(per pk)=29, Tacoskjell(per pk)=29, Tacokrydder(per pk)=15, Kokosmelk(per boks)=22, Buljong(per pk)=18
DRIKKE: Appelsinjuice(per L)=32, Eplejuice(per L)=28, Cola(per flaske)=25, Vann(per flaske)=15, Øl(per stk)=28, Kaffe(per pk)=89, Te(per pk)=45
FRYS: Frossen erter(per pk)=22, Kjøttboller(per pk)=79, Fiskepinner(per pk)=55, Sorbet(per pk)=45
SNACKS: Chips(per pk)=35, Sjokolade(per pk)=45, Müslibar(per pk)=39, Kjeks(per pk)=29

Håndter bulk-bestillinger naturlig (for restaurant, catering, storfamilie, arrangementer).
Svar alltid på samme språk som kunden. Vær vennlig, konkret og kortfattet.
Etter at varer er lagt til, spør alltid om de trenger noe mer.`;

// ─── Demo mode responses (when no API key) ─────────────────────────────────────
const DEMO = {
  taco: {
    no: { text: "Perfekt tacokveld! 🌮 Her er alt du trenger til 4 personer:", cartItems: [
      {name:"Kjøttdeig 400g",qty:2,unit:"pk",price:79,category:"Kjøtt & fisk"},
      {name:"Tacokrydder",qty:1,unit:"pk",price:15,category:"Kolonial"},
      {name:"Tacoskjell 12pk",qty:1,unit:"pk",price:29,category:"Kolonial"},
      {name:"Rømme 200ml",qty:2,unit:"boks",price:22,category:"Meieri"},
      {name:"Salatmix",qty:1,unit:"pose",price:35,category:"Frukt & grønt"},
      {name:"Revet ost",qty:1,unit:"pk",price:49,category:"Meieri"},
      {name:"Salsa",qty:1,unit:"boks",price:29,category:"Kolonial"},
      {name:"Avocado",qty:2,unit:"stk",price:22,category:"Frukt & grønt"},
    ]},
    en: { text: "Perfect taco night! 🌮 Here's everything for 4 people:", cartItems: [
      {name:"Ground beef 400g",qty:2,unit:"pk",price:79,category:"Meat"},
      {name:"Taco seasoning",qty:1,unit:"pk",price:15,category:"Pantry"},
      {name:"Taco shells 12pk",qty:1,unit:"pk",price:29,category:"Pantry"},
      {name:"Sour cream",qty:2,unit:"jar",price:22,category:"Dairy"},
      {name:"Mixed salad",qty:1,unit:"bag",price:35,category:"Produce"},
      {name:"Grated cheese",qty:1,unit:"pk",price:49,category:"Dairy"},
      {name:"Salsa",qty:1,unit:"jar",price:29,category:"Pantry"},
    ]},
  },
  laks: {
    no: { text: "Norsk laks er alltid et godt valg! 🐟 Her er det du trenger til en deilig lakserett:", cartItems: [
      {name:"Norsk laksefilet 400g",qty:2,unit:"pk",price:119,category:"Kjøtt & fisk"},
      {name:"Brokkoli",qty:1,unit:"stk",price:25,category:"Frukt & grønt"},
      {name:"Sitron",qty:2,unit:"stk",price:7,category:"Frukt & grønt"},
      {name:"Meierismør 250g",qty:1,unit:"pk",price:42,category:"Meieri"},
      {name:"Hvitløk",qty:1,unit:"stk",price:9,category:"Frukt & grønt"},
      {name:"Poteter 1kg",qty:1,unit:"pk",price:19,category:"Frukt & grønt"},
    ]},
    en: { text: "Norwegian salmon — excellent choice! 🐟 Here's what you need:", cartItems: [
      {name:"Norwegian salmon fillet 400g",qty:2,unit:"pk",price:119,category:"Fish"},
      {name:"Broccoli",qty:1,unit:"stk",price:25,category:"Produce"},
      {name:"Lemon",qty:2,unit:"stk",price:7,category:"Produce"},
      {name:"Butter 250g",qty:1,unit:"pk",price:42,category:"Dairy"},
      {name:"Garlic",qty:1,unit:"stk",price:9,category:"Produce"},
    ]},
  },
  frokost: {
    no: { text: "En god norsk frokost! 🍳 Her er det du trenger:", cartItems: [
      {name:"Havregryn 750g",qty:1,unit:"pk",price:28,category:"Kolonial"},
      {name:"Lettmelk 1L",qty:2,unit:"L",price:22,category:"Meieri"},
      {name:"Bananer",qty:1,unit:"kg",price:24,category:"Frukt & grønt"},
      {name:"Appelsinjuice 1L",qty:1,unit:"pk",price:32,category:"Kolonial"},
      {name:"Frittgående egg 12pk",qty:1,unit:"pk",price:49,category:"Meieri"},
      {name:"Grovbrød 750g",qty:1,unit:"stk",price:39,category:"Bakeri"},
      {name:"Smør 250g",qty:1,unit:"pk",price:42,category:"Meieri"},
    ]},
    en: { text: "A classic Norwegian breakfast! 🍳", cartItems: [
      {name:"Oats 750g",qty:1,unit:"pk",price:28,category:"Pantry"},
      {name:"Milk 1L",qty:2,unit:"L",price:22,category:"Dairy"},
      {name:"Bananas",qty:1,unit:"kg",price:24,category:"Produce"},
      {name:"Orange juice 1L",qty:1,unit:"pk",price:32,category:"Pantry"},
      {name:"Eggs 12pk",qty:1,unit:"pk",price:49,category:"Dairy"},
      {name:"Wholegrain bread",qty:1,unit:"stk",price:39,category:"Bakery"},
    ]},
  },
  pasta: {
    no: { text: "Deilig pastarett! 🍝 Her er varene:", cartItems: [
      {name:"Spaghetti 500g",qty:1,unit:"pk",price:19,category:"Kolonial"},
      {name:"Hakkede tomater 400g",qty:2,unit:"boks",price:14,category:"Kolonial"},
      {name:"Kjøttdeig 400g",qty:1,unit:"pk",price:79,category:"Kjøtt & fisk"},
      {name:"Løk",qty:1,unit:"stk",price:8,category:"Frukt & grønt"},
      {name:"Hvitløk",qty:1,unit:"stk",price:9,category:"Frukt & grønt"},
      {name:"Parmesan",qty:1,unit:"pk",price:55,category:"Meieri"},
      {name:"Olivenolje",qty:1,unit:"flaske",price:69,category:"Kolonial"},
    ]},
    en: { text: "Delicious pasta! 🍝 Here are the items:", cartItems: [
      {name:"Spaghetti 500g",qty:1,unit:"pk",price:19,category:"Pantry"},
      {name:"Crushed tomatoes 400g",qty:2,unit:"can",price:14,category:"Pantry"},
      {name:"Ground beef 400g",qty:1,unit:"pk",price:79,category:"Meat"},
      {name:"Onion",qty:1,unit:"stk",price:8,category:"Produce"},
      {name:"Garlic",qty:1,unit:"stk",price:9,category:"Produce"},
      {name:"Parmesan",qty:1,unit:"pk",price:55,category:"Dairy"},
    ]},
  },
  kylling: {
    no: { text: "Smakfull kyllingmiddag! 🍗 Her er det du trenger:", cartItems: [
      {name:"Kyllingfilet 500g",qty:2,unit:"pk",price:89,category:"Kjøtt & fisk"},
      {name:"Poteter 1kg",qty:1,unit:"pk",price:19,category:"Frukt & grønt"},
      {name:"Gulrøtter 1kg",qty:1,unit:"pk",price:22,category:"Frukt & grønt"},
      {name:"Løk",qty:1,unit:"stk",price:8,category:"Frukt & grønt"},
      {name:"Smør 250g",qty:1,unit:"pk",price:42,category:"Meieri"},
      {name:"Hvitløk",qty:1,unit:"stk",price:9,category:"Frukt & grønt"},
    ]},
    en: { text: "Tasty chicken dinner! 🍗 Here you go:", cartItems: [
      {name:"Chicken fillet 500g",qty:2,unit:"pk",price:89,category:"Meat"},
      {name:"Potatoes 1kg",qty:1,unit:"pk",price:19,category:"Produce"},
      {name:"Carrots 1kg",qty:1,unit:"pk",price:22,category:"Produce"},
      {name:"Onion",qty:1,unit:"stk",price:8,category:"Produce"},
      {name:"Butter 250g",qty:1,unit:"pk",price:42,category:"Dairy"},
    ]},
  },
};

function getDemoResponse(text, lang) {
  const t = text.toLowerCase();
  const l = lang === "en" ? "en" : "no";
  if (t.includes("taco") || t.includes("nacho")) return DEMO.taco[l];
  if (t.includes("laks") || t.includes("salmon")) return DEMO.laks[l];
  if (t.includes("frokost") || t.includes("breakfast") || t.includes("morgen") || t.includes("havre")) return DEMO.frokost[l];
  if (t.includes("pasta") || t.includes("spagett") || t.includes("spaghetti") || t.includes("bolognese")) return DEMO.pasta[l];
  if (t.includes("kylling") || t.includes("chicken")) return DEMO.kylling[l];
  return {
    text: l === "no"
      ? "Selvfølgelig! 😊 Prøv å si hva du vil ha til middag, f.eks. «taco til 4 personer», «laksemiddag», «frokost» eller «pasta bolognese»."
      : "Of course! 😊 Try telling me what you'd like — for example \"tacos for 4\", \"salmon dinner\", \"breakfast\" or \"pasta bolognese\".",
    cartItems: [],
  };
}

// ─── CORS headers ──────────────────────────────────────────────────────────────
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── Build cart context string ─────────────────────────────────────────────────
function buildCartContext(cart) {
  if (!cart || cart.length === 0) return "";
  const lines = cart.map(i => `- ${i.name}: ${i.qty} ${i.unit || "stk"}`).join("\n");
  return `\n\nKundens nåværende handlekurv / Customer's current cart:\n${lines}\n\nHvis kunden vil fjerne varer, bruk: <REMOVE_ITEMS>["Eksakt produktnavn"]</REMOVE_ITEMS>\nIf the customer wants to remove items, use: <REMOVE_ITEMS>["Exact product name from cart above"]</REMOVE_ITEMS>`;
}

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers: CORS, body: "Method Not Allowed" };

  try {
    const { messages, lang = "no", cart = [] } = JSON.parse(event.body);
    const apiKey = process.env.ANTHROPIC_API_KEY;

    // ── Demo mode: no API key ────────────────────────────────────────────────
    if (!apiKey || apiKey === "sk-ant-your-key-here") {
      const lastMsg = messages[messages.length - 1]?.content || "";
      const demo = getDemoResponse(lastMsg, lang);
      return {
        statusCode: 200,
        headers: { ...CORS, "Content-Type": "application/json" },
        body: JSON.stringify({ ...demo, removeItems: [], demo: true }),
      };
    }

    // ── Real Claude API ──────────────────────────────────────────────────────
    const client = new Anthropic({ apiKey });
    const systemPrompt = SYSTEM + buildCartContext(cart);
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const content = response.content[0].text;

    // Parse structured cart items to add
    let cartItems = [];
    const addMatch = content.match(/<CART_ITEMS>([\s\S]*?)<\/CART_ITEMS>/);
    if (addMatch) {
      try { cartItems = JSON.parse(addMatch[1]); } catch (e) { console.error("Cart parse error:", e); }
    }

    // Parse items to remove
    let removeItems = [];
    const removeMatch = content.match(/<REMOVE_ITEMS>([\s\S]*?)<\/REMOVE_ITEMS>/);
    if (removeMatch) {
      try { removeItems = JSON.parse(removeMatch[1]); } catch (e) { console.error("Remove parse error:", e); }
    }

    const text = content
      .replace(/<CART_ITEMS>[\s\S]*?<\/CART_ITEMS>/g, "")
      .replace(/<REMOVE_ITEMS>[\s\S]*?<\/REMOVE_ITEMS>/g, "")
      .trim();

    return {
      statusCode: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
      body: JSON.stringify({ text, cartItems, removeItems }),
    };
  } catch (error) {
    console.error("Chat error:", error);
    return {
      statusCode: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message, text: "Beklager, en feil oppstod. Prøv igjen.", cartItems: [], removeItems: [] }),
    };
  }
}
