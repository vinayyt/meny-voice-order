# MENY AI Bestillingsassistent 🛒

AI-drevet stemme- og chatbasert bestillingsløsning for MENY Norge.  
Støtter norsk (inkl. dialekter) og engelsk, med stemmegjenkjenning og automatisk ordre-e-post.

---

## ✨ Funksjoner

- 🎙️ **Stemmegjenkjenning** – norsk (`nb-NO`) og engelsk (`en-US`) via Web Speech API
- 🤖 **Claude AI chat** – forstår naturlig tale, dialekter og bulk-bestillinger
- 🛒 **Automatisk handlekurv** – AI ekstraherer varer og mengder direkte i kurven
- 📧 **Ordre som e-post** – vakker HTML-e-post med varedetaljer og samtalehistorikk
- 🌐 **Demo-modus** – fungerer uten API-nøkler (forhåndsdefinerte svar)
- 📱 **Mobilvennlig** – responsivt design som fungerer på alle skjermstørrelser

---

## 🚀 Deploy til Netlify

### Alternativ 1 – Dra og slipp (enklest)

1. Gå til [app.netlify.com](https://app.netlify.com)
2. Dra hele `meny-voice-order/`-mappen inn på siden
3. Vent til deploy er ferdig (~30 sek)
4. Sett miljøvariabler (se nedenfor)

### Alternativ 2 – GitHub

```bash
cd meny-voice-order
git init && git add . && git commit -m "Initial commit"
# Push til GitHub, koble til Netlify
```

---

## 🔑 Miljøvariabler

Sett disse i **Netlify → Site settings → Environment variables**:

| Variabel | Beskrivelse | Påkrevd |
|---|---|---|
| `ANTHROPIC_API_KEY` | Claude API-nøkkel fra [console.anthropic.com](https://console.anthropic.com) | Ja (for ekte AI) |
| `RESEND_API_KEY` | E-postnøkkel fra [resend.com](https://resend.com) – gratis 100 e-poster/dag | Ja (for ekte e-post) |
| `ORDER_EMAIL` | E-post for å motta bestillinger (f.eks. `orders@dinbutikk.no`) | Anbefalt |
| `FROM_EMAIL` | Avsenderadresse (må være verifisert i Resend) | Valgfritt |

> **Uten nøkler** kjører appen i **demo-modus**: stemmeinput fungerer, AI svarer med forhåndsdefinerte svar, og bestillinger logges i Netlify Functions-logger.

---

## 💬 Bruk

1. Klikk **Kom i gang** på onboarding-skjermen
2. Skriv eller klikk 🎤 for å snakke
3. Si f.eks. *"Taco til 4 personer"* eller *"Laks til middag"*
4. Varer legges automatisk i handlekurven
5. Klikk kurv-ikonet → **Send bestilling**
6. Fyll inn navn og e-post → bestillingen sendes som e-post

---

## 🧱 Teknisk

```
meny-voice-order/
├── public/
│   └── index.html          # React-app (CDN, ingen bygg nødvendig)
├── netlify/
│   └── functions/
│       ├── chat.js          # Claude API-proxy med MENY-systemmelding
│       └── send-order.js    # E-postsending via Resend
├── netlify.toml             # Netlify-konfigurasjon
└── package.json
```

- **Frontend**: React 18 + Babel (CDN, ingen bygg)
- **Stemme**: Web Speech API – Chrome/Edge anbefalt
- **AI**: Anthropic Claude (claude-sonnet-4-6)
- **E-post**: Resend API
- **Hosting**: Netlify (gratis tier fungerer)

---

*Bygget med ❤️ for MENY Norge*
