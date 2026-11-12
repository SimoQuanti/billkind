// BillKind demo data. Every person, bill, story and donor below is fictional.
// Amounts are in the local currency of the request; the leaderboard is in EUR.
window.BK_DATA = (() => {
  const RATES = { EUR: 1, CHF: 1.06, GBP: 1.18 }; // rough demo rates to EUR

  // type: "bill" (a single bill, paid in full) | "story" (a goal people chip in to)
  // anon: true -> the person chose to stay anonymous: no name, no bio, only the essentials.
  const REQUESTS = [
    {
      id: "giulia", type: "bill", cat: "electricity", amount: 96, cur: "EUR",
      city: "Milano", country: "IT", anon: false, name: "Giulia R.", age: 34, since: 2026, hue: 28,
      short: {
        it: "Una mano per tenere la luce accesa mentre aspetto il primo stipendio.",
        en: "A hand keeping the lights on while I wait for my first paycheck.",
      },
      bio: {
        it: "Sono mamma di Tommaso, sei anni, e vivo in zona Lorenteggio. Ho lavorato dieci anni in una mensa scolastica finché l'appalto è cambiato. Da poco ho ripreso a lavorare in una panetteria: mi alzo alle quattro e mi piace da matti.",
        en: "I'm mum to Tommaso, six, and we live in the Lorenteggio area. I worked ten years in a school canteen until the contract changed hands. I've just started again in a bakery: I get up at four and I love it.",
      },
      story: {
        it: "Tra un lavoro e l'altro sono passati quattro mesi. L'affitto l'ho sempre pagato, ma questa bolletta della luce è rimasta indietro e il primo stipendio arriva tra tre settimane. Non chiedo altro: solo questa.",
        en: "Four months went by between one job and the next. I always paid the rent, but this electricity bill fell behind and my first paycheck is three weeks away. I'm not asking for anything else: just this one.",
      },
    },
    {
      id: "anon-torino", type: "bill", cat: "gas", amount: 142, cur: "EUR",
      city: "Torino", country: "IT", anon: true,
      short: {
        it: "Il conguaglio del gas è arrivato nel mese sbagliato.",
        en: "The gas balancing bill arrived in the wrong month.",
      },
    },
    {
      id: "elena", type: "story", cat: "medical", goal: 2400, raised: 1310, cur: "CHF",
      city: "Lugano", country: "CH", anon: false, name: "Elena B.", age: 41, since: 2026, hue: 345,
      short: {
        it: "La fisioterapia di mio figlio dopo l'incidente: la cassa malati ne copre solo una parte.",
        en: "My son's physiotherapy after his accident: insurance only covers part of it.",
      },
      bio: {
        it: "Faccio l'assistente di cura a domicilio e cresco da sola Mattia, che ha undici anni e una passione smisurata per l'hockey. Viviamo a Molino Nuovo da sempre.",
        en: "I work as a home-care assistant and I'm raising Mattia on my own. He's eleven and has an enormous passion for hockey. We've always lived in Molino Nuovo.",
      },
      story: {
        it: "A marzo Mattia è caduto in bici e si è rotto il femore. L'operazione è andata bene, ma servono ancora quaranta sedute di fisioterapia e la franchigia più le sedute non coperte superano quello che riesco a mettere da parte. Ogni seduta costa 60 franchi: ogni contributo è una seduta in più.",
        en: "In March Mattia fell off his bike and broke his femur. Surgery went well, but he still needs forty physiotherapy sessions, and the deductible plus the uncovered sessions add up to more than I can set aside. Each session costs 60 francs: every contribution is one more session.",
      },
      updates: [
        { date: "2026-10-28", it: "Mattia ha camminato senza stampelle per tutto il corridoio. Grazie a chi c'è.", en: "Mattia walked the whole corridor without crutches. Thank you to everyone who is there." },
        { date: "2026-09-15", it: "Prime dieci sedute pagate. Il fisioterapista è ottimista.", en: "First ten sessions paid. The physiotherapist is optimistic." },
      ],
    },
    {
      id: "anon-zurich", type: "bill", cat: "health", amount: 389, cur: "CHF",
      city: "Zürich", country: "CH", anon: true,
      short: {
        it: "Il premio della cassa malati di questo mese, dopo una riduzione di ore al lavoro.",
        en: "This month's health insurance premium, after my hours at work were cut.",
      },
    },
    {
      id: "aisha", type: "bill", cat: "electricity", amount: 118, cur: "GBP",
      city: "Manchester", country: "UK", anon: false, name: "Aisha K.", age: 29, since: 2026, hue: 200,
      short: {
        it: "La bolletta dell'energia di un inverno iniziato troppo presto.",
        en: "The energy bill from a winter that started too early.",
      },
      bio: {
        it: "Studio infermieristica all'ultimo anno e lavoro nei weekend in una casa di riposo. Vivo con mia nonna a Longsight: è lei che mi ha insegnato a cucinare e a non arrendermi.",
        en: "I'm a final-year nursing student and I work weekends in a care home. I live with my nan in Longsight: she's the one who taught me to cook and not to give up.",
      },
      story: {
        it: "La nonna deve stare al caldo per la sua artrite e il riscaldamento resta acceso quasi tutto il giorno. Con il tirocinio non retribuito di questo semestre la bolletta è più grande del nostro margine. A giugno mi laureo: voglio arrivarci senza debiti con il fornitore.",
        en: "Nan has to keep warm for her arthritis, so the heating stays on most of the day. With this term's unpaid placement, the bill is bigger than our margin. I graduate in June: I want to get there without owing the supplier.",
      },
    },
    {
      id: "tom", type: "story", cat: "home", goal: 1800, raised: 640, cur: "GBP",
      city: "Leeds", country: "UK", anon: false, name: "Tom H.", age: 67, since: 2026, hue: 150,
      short: {
        it: "La caldaia si è rotta e l'inverno è alle porte.",
        en: "The boiler has broken down and winter is on the doorstep.",
      },
      bio: {
        it: "Ho guidato autobus per trentun anni, linea 56. Sono vedovo, ho un cane di nome Biscuit e un orto condiviso dove coltivo più zucchine di quante il quartiere riesca a mangiare.",
        en: "I drove buses for thirty-one years, route 56. I'm a widower, I have a dog called Biscuit and an allotment where I grow more courgettes than the street can eat.",
      },
      story: {
        it: "La caldaia ha ventidue anni e il tecnico dice che non vale la pena ripararla. Con la pensione ce la faccio a vivere, non a sostituire una caldaia. Ho già messo da parte quello che potevo: mi manca il resto per non passare l'inverno con le stufette.",
        en: "The boiler is twenty-two years old and the engineer says it's not worth repairing. My pension is enough to live on, not to replace a boiler. I've already put aside what I could: I need the rest so I don't spend winter with plug-in heaters.",
      },
      updates: [
        { date: "2026-11-02", it: "Ho ricevuto due preventivi. Scelgo quello dell'artigiano del quartiere.", en: "I've had two quotes in. Going with the local tradesman." },
      ],
    },
    {
      id: "marco", type: "bill", cat: "water", amount: 61, cur: "EUR",
      city: "Napoli", country: "IT", anon: false, name: "Marco B.", age: 58, since: 2026, hue: 215,
      short: {
        it: "Una bolletta dell'acqua rimasta indietro dopo un mese in ospedale.",
        en: "A water bill that fell behind after a month in hospital.",
      },
      bio: {
        it: "Faccio il restauratore di mobili da quando avevo sedici anni, in una bottega ai Vergini. Ho due figlie grandi e un nipote che mi chiama «nonno segatura».",
        en: "I've been restoring furniture since I was sixteen, in a workshop in the Vergini district. I have two grown-up daughters and a grandson who calls me \"grandpa sawdust\".",
      },
      story: {
        it: "A settembre sono stato operato al cuore e la bottega è rimasta chiusa cinque settimane. Sto bene e ho ripreso a lavorare, ma chi lavora in proprio lo sa: un mese fermo si sente per sei.",
        en: "In September I had heart surgery and the workshop stayed closed for five weeks. I'm fine and back at work, but anyone self-employed knows it: one month off is felt for six.",
      },
    },
    {
      id: "anon-bologna", type: "story", cat: "medical", goal: 900, raised: 275, cur: "EUR",
      city: "Bologna", country: "IT", anon: true,
      short: {
        it: "I viaggi in treno per le terapie, due volte a settimana fino a primavera.",
        en: "Train journeys to treatment, twice a week until spring.",
      },
    },
    {
      id: "sofia", type: "bill", cat: "phone", amount: 64, cur: "CHF",
      city: "Bellinzona", country: "CH", anon: false, name: "Sofia M.", age: 22, since: 2026, hue: 265,
      short: {
        it: "Internet e telefono: senza non posso seguire i corsi serali.",
        en: "Internet and phone: without them I can't follow my evening classes.",
      },
      bio: {
        it: "Di giorno lavoro in una lavanderia industriale, la sera studio per diventare tecnica di laboratorio. Sono la prima della mia famiglia a fare una formazione superiore.",
        en: "By day I work in an industrial laundry, in the evening I study to become a lab technician. I'm the first in my family to go into higher education.",
      },
      story: {
        it: "Metà delle lezioni è online. Questo mese ho dovuto scegliere tra i libri del semestre e la bolletta, e ho scelto i libri. Mi serve solo non perdere la connessione prima degli esami.",
        en: "Half of my lessons are online. This month I had to choose between the term's books and the bill, and I chose the books. I just need not to lose the connection before exams.",
      },
    },
    {
      id: "anon-glasgow", type: "bill", cat: "rent", amount: 210, cur: "GBP",
      city: "Glasgow", country: "UK", anon: true,
      short: {
        it: "Una parte dell'affitto, per non perdere la stanza mentre cambio lavoro.",
        en: "Part of the rent, so I don't lose my room while I change jobs.",
      },
    },
  ];

  // Leaderboard of givers. Amounts in EUR, already converted.
  // kind: person | creator (influencer) | company. anon: true -> only "Anonymous giver".
  const DONORS = [
    {
      id: "luca", name: "Luca Ferraris", kind: "person", city: "Milano", anon: false, hue: 190, since: 2026,
      month: 2840, year: 21650, all: 21650, gifts: 187,
      bio: {
        it: "Ho fondato e venduto un'azienda di logistica. Sono cresciuto in una casa dove a fine mese si spegneva il riscaldamento: so cosa vuol dire una bolletta sul tavolo.",
        en: "I founded and sold a logistics company. I grew up in a home where the heating went off at the end of the month: I know what a bill on the table means.",
      },
      why: {
        it: "Preferisco cento piccole bollette a una grande cena di gala.",
        en: "I'd rather pay a hundred small bills than attend one big gala dinner.",
      },
    },
    {
      id: "chiara", name: "Chiara Viaggia", handle: "@chiara.viaggia", kind: "creator", city: "Roma", anon: false, hue: 330, since: 2026,
      month: 4120, year: 14300, all: 14300, gifts: 96,
      bio: {
        it: "Racconto viaggi lenti a 480 mila persone. Ogni mese la community sceglie con me le storie da sostenere: i miei follower vedono dove va ogni euro.",
        en: "I share slow travel with 480 thousand people. Every month my community picks the stories to support with me: my followers see where every euro goes.",
      },
      why: {
        it: "Se ho un pubblico, tanto vale usarlo per qualcosa che resta.",
        en: "If I have an audience, I might as well use it for something that lasts.",
      },
    },
    { id: "anon-1", kind: "person", anon: true, month: 3300, year: 9800, all: 18900, gifts: 141 },
    {
      id: "james", name: "James Okafor", kind: "person", city: "London", anon: false, hue: 150, since: 2026,
      month: 1950, year: 12400, all: 12400, gifts: 88,
      bio: {
        it: "Chirurgo ortopedico. Mia madre ha cresciuto quattro figli facendo le pulizie di notte: qualcuno, una volta, le pagò il riscaldamento per un inverno intero.",
        en: "Orthopaedic surgeon. My mother raised four children cleaning offices at night: someone once paid her heating for a whole winter.",
      },
      why: { it: "Sto restituendo quell'inverno.", en: "I'm paying that winter back." },
    },
    {
      id: "bernasconi", name: "Officine Bernasconi", kind: "company", city: "Mendrisio", anon: false, hue: 40, since: 2026,
      month: 1500, year: 16000, all: 16000, gifts: 132,
      bio: {
        it: "Azienda di famiglia, 46 persone. Invece dei regali di Natale ai clienti, da quest'anno paghiamo bollette in Ticino e lo diciamo ai clienti.",
        en: "A family business with 46 people. Instead of Christmas gifts for clients, this year we pay bills in Ticino and tell our clients about it.",
      },
      why: { it: "Il territorio ci ha dato lavoro per tre generazioni.", en: "This region has given us work for three generations." },
    },
    {
      id: "nadia", name: "Nadia & Paul", kind: "person", city: "Genève", anon: false, hue: 280, since: 2026,
      month: 880, year: 6200, all: 6200, gifts: 71,
      bio: {
        it: "Siamo in pensione, lei insegnante e lui ferroviere. Ogni domenica mattina, con il caffè, scegliamo insieme due bollette.",
        en: "We're retired, a teacher and a railwayman. Every Sunday morning, over coffee, we choose two bills together.",
      },
      why: { it: "È diventato il nostro rito.", en: "It has become our ritual." },
    },
    { id: "anon-2", kind: "person", anon: true, month: 2100, year: 5400, all: 5400, gifts: 39 },
    {
      id: "matteo", name: "Matteo Gaming", handle: "@matteo.plays", kind: "creator", city: "Torino", anon: false, hue: 250, since: 2026,
      month: 2650, year: 7900, all: 7900, gifts: 64,
      bio: {
        it: "Streamer. Una volta al mese faccio una live benefica: ogni obiettivo raggiunto in chat è una bolletta pagata in diretta.",
        en: "Streamer. Once a month I run a charity stream: every goal reached in chat is a bill paid live.",
      },
      why: { it: "La chat è più generosa di quanto si pensi.", en: "Chat is more generous than people think." },
    },
    {
      id: "hannah", name: "Hannah Whitfield", kind: "person", city: "Bristol", anon: false, hue: 100, since: 2026,
      month: 640, year: 4850, all: 4850, gifts: 52,
      bio: {
        it: "Architetta. Dono soprattutto a chi ha problemi di riscaldamento: ho passato la vita a progettare case, vorrei che fossero anche calde.",
        en: "Architect. I mostly give to people with heating problems: I've spent my life designing homes, I'd like them to be warm too.",
      },
      why: { it: "Una casa fredda non è una casa.", en: "A cold home is not a home." },
    },
    { id: "anon-3", kind: "company", anon: true, month: 450, year: 9100, all: 9100, gifts: 58 },
    {
      id: "davide", name: "Davide Colombo", kind: "person", city: "Bergamo", anon: false, hue: 15, since: 2026,
      month: 320, year: 2900, all: 2900, gifts: 33,
      bio: {
        it: "Elettricista. Non sono ricco, ma una bolletta della luce al mese ci sta: è il mio mestiere, in fondo.",
        en: "Electrician. I'm not rich, but one electricity bill a month is doable: it's my trade, after all.",
      },
      why: { it: "Non serve essere milionari per esserci.", en: "You don't need to be a millionaire to show up." },
    },
    { id: "anon-4", kind: "person", anon: true, month: 150, year: 1750, all: 1750, gifts: 21 },
  ];

  return { RATES, REQUESTS, DONORS };
})();
