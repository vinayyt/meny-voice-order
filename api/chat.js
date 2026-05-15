import Anthropic from "@anthropic-ai/sdk";

// ─── MENY AI System Prompt ─────────────────────────────────────────────────────
const SYSTEM = `Du er MENY-assistenten — en vennlig, kunnskapsrik AI-handlesassistent for MENY, Norges ledende dagligvarekjede med fokus på ferskvarer og norsk kvalitet.

Du hjelper kunder med å bestille dagligvarer gjennom naturlig samtale. Du forstår norsk (inkl. dialekter, bokmål og nynorsk), engelsk, hindi og kannada perfekt.
Svar alltid på samme språk som kunden skriver eller snakker. Hvis kunden skriver på hindi, svar på hindi. Hvis kunden skriver på kannada, svar på kannada. Produktnavn forblir alltid på norsk i CART_ITEMS uavhengig av kundens språk.

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
   Eksempel: 3 kg tomater → price=63 (kr/kg), qty=3, unit="kg" → frontend regner 63 × 3 = 189 kr ✓
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

// ─── Demo mode responses ───────────────────────────────────────────────────────
const DEMO = {
  taco: {
    no: { text: "Perfekt tacokveld! Her er alt du trenger til 4 personer:", cartItems: [
      {name:"Kjøttdeig",qty:0.8,unit:"kg",price:198,category:"Kjøtt & fisk"},
      {name:"Tacokrydder",qty:1,unit:"pk",price:15,category:"Kolonial"},
      {name:"Tacoskjell",qty:1,unit:"pk",price:29,category:"Kolonial"},
      {name:"Rømme",qty:2,unit:"pk",price:22,category:"Meieri"},
      {name:"Salat",qty:1,unit:"stk",price:22,category:"Frukt & grønt"},
      {name:"Norvegia",qty:1,unit:"pk",price:89,category:"Meieri"},
      {name:"Salsa",qty:1,unit:"boks",price:29,category:"Kolonial"},
      {name:"Avocado",qty:2,unit:"stk",price:22,category:"Frukt & grønt"},
    ]},
    en: { text: "Perfect taco night! Here's everything for 4 people:", cartItems: [
      {name:"Kjøttdeig",qty:0.8,unit:"kg",price:198,category:"Kjøtt & fisk"},
      {name:"Tacokrydder",qty:1,unit:"pk",price:15,category:"Kolonial"},
      {name:"Tacoskjell",qty:1,unit:"pk",price:29,category:"Kolonial"},
      {name:"Rømme",qty:2,unit:"pk",price:22,category:"Meieri"},
      {name:"Salat",qty:1,unit:"stk",price:22,category:"Frukt & grønt"},
      {name:"Norvegia",qty:1,unit:"pk",price:89,category:"Meieri"},
      {name:"Salsa",qty:1,unit:"boks",price:29,category:"Kolonial"},
      {name:"Avocado",qty:2,unit:"stk",price:22,category:"Frukt & grønt"},
    ]},
  },
  laks: {
    no: { text: "Norsk laks er alltid et godt valg! Her er det du trenger:", cartItems: [
      {name:"Laks",qty:0.8,unit:"kg",price:299,category:"Kjøtt & fisk"},
      {name:"Brokkoli",qty:1,unit:"stk",price:25,category:"Frukt & grønt"},
      {name:"Sitron",qty:2,unit:"stk",price:7,category:"Frukt & grønt"},
      {name:"Smør",qty:1,unit:"pk",price:42,category:"Meieri"},
      {name:"Hvitløk",qty:1,unit:"stk",price:9,category:"Frukt & grønt"},
      {name:"Poteter",qty:0.5,unit:"kg",price:19,category:"Frukt & grønt"},
    ]},
    en: { text: "Norwegian salmon — excellent choice! Here's what you need:", cartItems: [
      {name:"Laks",qty:0.8,unit:"kg",price:299,category:"Kjøtt & fisk"},
      {name:"Brokkoli",qty:1,unit:"stk",price:25,category:"Frukt & grønt"},
      {name:"Sitron",qty:2,unit:"stk",price:7,category:"Frukt & grønt"},
      {name:"Smør",qty:1,unit:"pk",price:42,category:"Meieri"},
      {name:"Hvitløk",qty:1,unit:"stk",price:9,category:"Frukt & grønt"},
    ]},
  },
  frokost: {
    no: { text: "En god norsk frokost! Her er det du trenger:", cartItems: [
      {name:"Havregryn",qty:1,unit:"pk",price:28,category:"Kolonial"},
      {name:"Lettmelk",qty:2,unit:"L",price:22,category:"Meieri"},
      {name:"Bananer",qty:1,unit:"kg",price:24,category:"Frukt & grønt"},
      {name:"Appelsinjuice",qty:1,unit:"L",price:32,category:"Drikke"},
      {name:"Egg",qty:1,unit:"pk",price:49,category:"Meieri"},
      {name:"Grovbrød",qty:1,unit:"stk",price:39,category:"Bakeri"},
      {name:"Smør",qty:1,unit:"pk",price:42,category:"Meieri"},
    ]},
    en: { text: "A classic Norwegian breakfast! Here's what you need:", cartItems: [
      {name:"Havregryn",qty:1,unit:"pk",price:28,category:"Kolonial"},
      {name:"Lettmelk",qty:2,unit:"L",price:22,category:"Meieri"},
      {name:"Bananer",qty:1,unit:"kg",price:24,category:"Frukt & grønt"},
      {name:"Egg",qty:1,unit:"pk",price:49,category:"Meieri"},
      {name:"Grovbrød",qty:1,unit:"stk",price:39,category:"Bakeri"},
    ]},
  },
  pasta: {
    no: { text: "Deilig pasta bolognese! Her er varene:", cartItems: [
      {name:"Spaghetti",qty:1,unit:"pk",price:19,category:"Kolonial"},
      {name:"Hermetiske tomater",qty:2,unit:"boks",price:14,category:"Kolonial"},
      {name:"Kjøttdeig",qty:0.4,unit:"kg",price:198,category:"Kjøtt & fisk"},
      {name:"Løk",qty:0.3,unit:"kg",price:25,category:"Frukt & grønt"},
      {name:"Hvitløk",qty:1,unit:"stk",price:9,category:"Frukt & grønt"},
      {name:"Norvegia",qty:1,unit:"pk",price:89,category:"Meieri"},
      {name:"Olivenolje",qty:1,unit:"flaske",price:69,category:"Kolonial"},
    ]},
    en: { text: "Delicious pasta bolognese! Here are the items:", cartItems: [
      {name:"Spaghetti",qty:1,unit:"pk",price:19,category:"Kolonial"},
      {name:"Hermetiske tomater",qty:2,unit:"boks",price:14,category:"Kolonial"},
      {name:"Kjøttdeig",qty:0.4,unit:"kg",price:198,category:"Kjøtt & fisk"},
      {name:"Løk",qty:0.3,unit:"kg",price:25,category:"Frukt & grønt"},
      {name:"Hvitløk",qty:1,unit:"stk",price:9,category:"Frukt & grønt"},
      {name:"Norvegia",qty:1,unit:"pk",price:89,category:"Meieri"},
    ]},
  },
};

// Demo responses for all four supported languages
const DEMO_FALLBACK = {
  no: "Selvfølgelig! Prøv å si hva du vil ha til middag, f.eks. «taco til 4 personer», «laksemiddag», «frokost» eller «pasta bolognese».",
  en: "Of course! Try telling me what you'd like — for example \"tacos for 4\", \"salmon dinner\", \"breakfast\" or \"pasta bolognese\".",
  hi: "बिल्कुल! कुछ आज़माएं जैसे «चार लोगों के लिए टैको», «सालमन डिनर», «नाश्ता» या «पास्ता बोलोग्नीज़»।",
  kn: "ಖಂಡಿತ! ಉದಾಹರಣೆಗೆ ಹೇಳಿ «ನಾಲ್ಕು ಜನರಿಗೆ ತಾಕೋ», «ಸಾಲ್ಮನ್ ಡಿನ್ನರ್», «ಉಪಾಹಾರ» ಅಥವಾ «ಪಾಸ್ತಾ ಬೊಲೊಗ್ನೀಸ್».",
};

// Add hi/kn intro texts to DEMO entries
const DEMO_EXTRA = {
  taco:    { hi: "ताकोs के लिए बढ़िया! 4 लोगों के लिए सब कुछ:", kn: "ತಾಕೋ ರಾತ್ರಿಗೆ ಸಿದ್ಧ! 4 ಜನರಿಗೆ ಇದೆಲ್ಲ:" },
  laks:    { hi: "सालमन बेहतरीन चुनाव है! ये चाहिए:", kn: "ಸಾಲ್ಮನ್ — ಉತ್ತಮ ಆಯ್ಕೆ! ನಿಮಗೆ ಇದು ಬೇಕಾಗುತ್ತದೆ:" },
  frokost: { hi: "एक शानदार नाश्ता! ये चाहिए:", kn: "ಒಂದು ಉತ್ತಮ ಉಪಾಹಾರ! ಇದು ಬೇಕಾಗುತ್ತದೆ:" },
  pasta:   { hi: "स्वादिष्ट पास्ता बोलोग्नीज़! ये लें:", kn: "ರುಚಿಕರ ಪಾಸ್ತಾ ಬೊಲೊಗ್ನೀಸ್! ಇದು ತೆಗೆದುಕೊಳ್ಳಿ:" },
};

function getDemoResponse(text, lang) {
  const t = text.toLowerCase();
  // Map any unrecognised lang code to 'en' as default
  const validLangs = ["no", "en", "hi", "kn"];
  const l = validLangs.includes(lang) ? lang : "en";
  // Pick base lang for cart data (same for all langs)
  const base = l === "no" ? "no" : "en";

  let key = null;
  if (t.includes("taco") || t.includes("nacho")) key = "taco";
  else if (t.includes("laks") || t.includes("salmon") || t.includes("सालमन") || t.includes("ಸಾಲ್ಮನ್")) key = "laks";
  else if (t.includes("frokost") || t.includes("breakfast") || t.includes("morgen") || t.includes("havre") || t.includes("नाश्ता") || t.includes("ಉಪಾಹಾರ")) key = "frokost";
  else if (t.includes("pasta") || t.includes("spagett") || t.includes("bolognese") || t.includes("पास्ता") || t.includes("ಪಾಸ್ತಾ")) key = "pasta";

  if (key) {
    const cartData = DEMO[key][base];
    const text = (l === "hi" || l === "kn")
      ? DEMO_EXTRA[key][l]
      : cartData.text;
    return { text, cartItems: cartData.cartItems };
  }
  return { text: DEMO_FALLBACK[l], cartItems: [] };
}

function buildCartContext(cart) {
  if (!cart || cart.length === 0) return "";
  const lines = cart.map(i => `- ${i.name}: ${i.qty} ${i.unit || "stk"}`).join("\n");
  return `\n\nKundens nåværende handlekurv / Customer's current cart:\n${lines}\n\nHvis kunden vil fjerne varer, bruk: <REMOVE_ITEMS>["Eksakt produktnavn"]</REMOVE_ITEMS>\nIf the customer wants to remove items, use: <REMOVE_ITEMS>["Exact product name from cart above"]</REMOVE_ITEMS>`;
}

// ─── Vercel serverless handler ─────────────────────────────────────────────────
export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const { messages, lang = "no", cart = [] } = req.body;
    const apiKey = process.env.ANTHROPIC_API_KEY;

    // Demo mode when no API key
    if (!apiKey || apiKey === "sk-ant-your-key-here") {
      const lastMsg = messages[messages.length - 1]?.content || "";
      const demo = getDemoResponse(lastMsg, lang);
      return res.status(200).json({ ...demo, removeItems: [], demo: true });
    }

    const client = new Anthropic({ apiKey });
    const systemPrompt = SYSTEM + buildCartContext(cart);
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const content = response.content[0].text;

    let cartItems = [];
    const addMatch = content.match(/<CART_ITEMS>([\s\S]*?)<\/CART_ITEMS>/);
    if (addMatch) {
      try { cartItems = JSON.parse(addMatch[1]); } catch (e) { console.error("Cart parse error:", e); }
    }

    let removeItems = [];
    const removeMatch = content.match(/<REMOVE_ITEMS>([\s\S]*?)<\/REMOVE_ITEMS>/);
    if (removeMatch) {
      try { removeItems = JSON.parse(removeMatch[1]); } catch (e) { console.error("Remove parse error:", e); }
    }

    const text = content
      .replace(/<CART_ITEMS>[\s\S]*?<\/CART_ITEMS>/g, "")
      .replace(/<REMOVE_ITEMS>[\s\S]*?<\/REMOVE_ITEMS>/g, "")
      .trim();

    return res.status(200).json({ text, cartItems, removeItems });
  } catch (error) {
    console.error("Chat error:", error);
    return res.status(500).json({
      error: error.message,
      text: "Beklager, en feil oppstod. Prøv igjen.",
      cartItems: [],
      removeItems: [],
    });
  }
}
