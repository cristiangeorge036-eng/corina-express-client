import { useState, useEffect, useRef } from "react";
import { Bus, Phone, MapPin, Users, Calendar, Check, Search, Mail, MessageCircle, FileText, X } from "lucide-react";
import { createReservation, fetchConfig } from "./firebase";

const C = {
  bg: "#F6F6F7",
  ink: "#1C1C1C",
  inkLight: "#6B6B6B",
  amber: "#DD1919",
  amberDark: "#B01414",
  card: "#FFFFFF",
  border: "#E4E4E7",
  sage: "#3F9A72",
  navy: "#1C1C1C",
  danger: "#B5495B",
};
const LOGO_URL = "https://www.corinaexpressline.ro/wp-content/uploads/2019/08/Corina-Express-Line-Logo.png";

const COUNTRIES = ["Germania", "Austria", "Olanda", "Belgia", "Elveția", "Cehia", "Luxemburg"];
const ADMIN_CODE = "1234";
const CONTACT_PHONE = "0744385394";

const BAIA_MARE = { lat: 47.657, lon: 23.568 };
const ORADEA = { lat: 47.046, lon: 21.928 };

const BOUNDS = {
  Germania: { latMin: 47.2, latMax: 55.0, lonMin: 5.8, lonMax: 15.1 },
  Austria: { latMin: 46.3, latMax: 49.1, lonMin: 9.5, lonMax: 17.2 },
  Elveția: { latMin: 45.8, latMax: 47.9, lonMin: 5.9, lonMax: 10.5 },
  Olanda: { latMin: 50.7, latMax: 53.6, lonMin: 3.3, lonMax: 7.2 },
  Belgia: { latMin: 49.4, latMax: 51.6, lonMin: 2.5, lonMax: 6.4 },
  Cehia: { latMin: 48.5, latMax: 51.1, lonMin: 12.0, lonMax: 18.9 },
  Luxemburg: { latMin: 49.4, latMax: 50.2, lonMin: 5.7, lonMax: 6.6 },
};

// Built-in city dataset (no live network search needed — the preview sandbox blocks external calls)
// Puncte fixe de plecare cunoscute — orașul e găsit prin căutare live,
// dar dacă numele coincide cu unul din aceste orașe, folosim punctul fix.
const ROMANIA_FIXED_INFO = {
  "satu mare": { fixedPickup: null, fixedTime: "15:00" },
  "baia mare": { fixedPickup: "Stația Gară", fixedTime: "13:30" },
  "oradea": { fixedPickup: "Mall, Bulevardul Ștefan cel Mare", fixedTime: "18:00" },
  "zalau": { fixedPickup: "Gară", fixedTime: "13:00" },
  "cluj napoca": { fixedPickup: "Autogara Fany", fixedTime: null },
  "carei": { fixedPickup: "Piața Avram Iancu, fostul BRD", fixedTime: "16:00" },
  "marghita": { fixedPickup: null, fixedTime: "17:00" },
  "valea lui mihai": { fixedPickup: null, fixedTime: "17:00" },
};
function normalizeRoName(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/-/g, " ")
    .trim();
}
function getFixedInfo(name) {
  return ROMANIA_FIXED_INFO[normalizeRoName(name)] || null;
}

// Main pickup corridor used to estimate times for localities without a fixed time
const ROUTE_STOPS = [
  { name: "Baia Mare", lat: 47.6567, lon: 23.5847, minutes: 13 * 60 + 30 },
  { name: "Satu Mare", lat: 47.7908, lon: 22.8857, minutes: 15 * 60 },
  { name: "Carei", lat: 47.6836, lon: 22.4694, minutes: 16 * 60 },
  { name: "Marghita/Valea lui Mihai", lat: 47.4331, lon: 22.2266, minutes: 17 * 60 },
  { name: "Oradea", lat: 47.0465, lon: 21.9189, minutes: 18 * 60 },
];

function minutesToHHMM(m) {
  const h = Math.floor(m / 60) % 24;
  const mm = Math.round(m % 60);
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
function estimateDepartureTime(selected) {
  const fixed = getFixedInfo(selected.name);
  if (fixed && fixed.fixedTime) return fixed.fixedTime;
  if (fixed) return null; // fixed stop but no time set (ex: Cluj-Napoca) — se comunică telefonic
  let best = null;
  for (let i = 0; i < ROUTE_STOPS.length - 1; i++) {
    const a = ROUTE_STOPS[i], b = ROUTE_STOPS[i + 1];
    const da = haversine(selected.lat, selected.lon, a.lat, a.lon);
    const db = haversine(selected.lat, selected.lon, b.lat, b.lon);
    const score = da + db;
    if (!best || score < best.score) {
      const t = da + db === 0 ? 0 : da / (da + db);
      best = { score, minutes: a.minutes + t * (b.minutes - a.minutes) };
    }
  }
  return best ? minutesToHHMM(best.minutes) : null;
}


const COUNTRY_CODE_TO_NAME = { de: "Germania", at: "Austria", nl: "Olanda", be: "Belgia", ch: "Elveția", cz: "Cehia", lu: "Luxemburg" };
const DEST_COUNTRY_CODES = Object.keys(COUNTRY_CODE_TO_NAME).join(",");

const DEFAULT_ZONES = [
  { id: "z1", country: "Germania", label: "A8 / A7 / A3 (Ulm–Nürnberg)", lat: 48.9, lon: 10.3, radiusKm: 90, price: 130 },
  { id: "z2", country: "Germania", label: "A3 Passau–Nürnberg", lat: 49.1, lon: 12.2, radiusKm: 90, price: 130 },
  { id: "z3", country: "Germania", label: "A7–A81", lat: 48.6, lon: 9.2, radiusKm: 60, price: 140 },
  { id: "z4", country: "Germania", label: "Spre granița Franța (A81 vest)", lat: 48.0, lon: 7.9, radiusKm: 60, price: 150 },
  { id: "z5", country: "Germania", label: "A8 spre Elveția/Austria", lat: 47.9, lon: 10.0, radiusKm: 70, price: 150 },
  { id: "z6", country: "Germania", label: "Stuttgart–Karlsruhe spre Elveția/Franța", lat: 48.6, lon: 8.6, radiusKm: 70, price: 160 },
  { id: "z7", country: "Germania", label: "A3–A61 (Köln)", lat: 50.4, lon: 7.6, radiusKm: 80, price: 150 },
  { id: "z8", country: "Germania", label: "A3 lângă Dortmund (20km)", lat: 51.5, lon: 7.5, radiusKm: 30, price: 150 },
  { id: "z9", country: "Germania", label: "Kassel–Würzburg–Nürnberg", lat: 50.5, lon: 9.7, radiusKm: 90, price: 150 },
  { id: "z10", country: "Germania", label: "A3 până la A4 (rest)", lat: 50.9, lon: 8.5, radiusKm: 100, price: 160 },
  { id: "z11", country: "Germania", label: "Cehia granița–Berlin + Magdeburg/Bayreuth/Marktredwitz", lat: 51.3, lon: 12.7, radiusKm: 130, price: 160 },
  { id: "z12", country: "Germania", label: "A4–A2 (Hannover)", lat: 52.2, lon: 9.8, radiusKm: 60, price: 160 },
  { id: "z13", country: "Germania", label: "A30/A2 spre Berlin/Polonia", lat: 52.3, lon: 11.5, radiusKm: 110, price: 160 },
  { id: "z14", country: "Germania", label: "Nord de linia Bremen–Hamburg–Berlin", lat: 53.5, lon: 10.5, radiusKm: 150, price: 190 },
  { id: "z15", country: "Germania", label: "Perimetru Stuttgart–Würzburg–Koblenz–Trier–Karlsruhe (+20km)", lat: 49.85, lon: 8.15, radiusKm: 130, price: 150 },

  { id: "a1", country: "Austria", label: "Viena + 10km", lat: 48.15, lon: 16.6, radiusKm: 60, price: 100 },
  { id: "a2", country: "Austria", label: "Viena–Linz autostradă (15km)", lat: 48.25, lon: 15.3, radiusKm: 50, price: 110 },
  { id: "a3", country: "Austria", label: "Linz–Salzburg–Passau (A1/A8)", lat: 48.05, lon: 13.6, radiusKm: 60, price: 130 },
  { id: "a4", country: "Austria", label: "Tirol", lat: 47.27, lon: 11.39, radiusKm: 80, price: 160 },
  { id: "a5", country: "Austria", label: "Tirol lângă autostradă (5km)", lat: 47.27, lon: 11.39, radiusKm: 20, price: 150 },
  { id: "a6", country: "Austria", label: "Vorarlberg", lat: 47.5, lon: 9.75, radiusKm: 40, price: 160 },
  { id: "a7", country: "Austria", label: "Vorarlberg lângă autostradă", lat: 47.5, lon: 9.75, radiusKm: 15, price: 150 },
  { id: "a8", country: "Austria", label: "Sud — Graz/Villach", lat: 46.85, lon: 14.6, radiusKm: 90, price: 160 },
  { id: "a9", country: "Austria", label: "Graz/Villach oraș", lat: 47.07, lon: 15.44, radiusKm: 15, price: 150 },
  { id: "a10", country: "Austria", label: "Spre granița Cehia ≤45km", lat: 48.9, lon: 14.5, radiusKm: 45, price: 130 },
  { id: "a11", country: "Austria", label: "Spre granița Cehia >45km", lat: 48.9, lon: 14.5, radiusKm: 90, price: 150 },

  { id: "ch1", country: "Elveția", label: "≤40km de granița Germania", lat: 47.55, lon: 8.3, radiusKm: 50, price: 160 },
  { id: "ch2", country: "Elveția", label: "≤80km de granița Germania", lat: 47.55, lon: 8.3, radiusKm: 110, price: 170 },

  { id: "nl1", country: "Olanda", label: "≤40km de Germania", lat: 51.5, lon: 6.5, radiusKm: 50, price: 160 },
  { id: "nl2", country: "Olanda", label: "Coasta oceanului", lat: 52.0, lon: 4.3, radiusKm: 60, price: 190 },

  { id: "be1", country: "Belgia", label: "≤40km de Germania", lat: 50.6, lon: 6.0, radiusKm: 45, price: 160 },
  { id: "be2", country: "Belgia", label: "Coasta oceanului", lat: 51.1, lon: 3.0, radiusKm: 50, price: 190 },

  { id: "cz1", country: "Cehia", label: "Lângă autostrăzi (20km)", lat: 49.9, lon: 14.0, radiusKm: 60, price: 150 },
];

const DEFAULT_FALLBACK = { Germania: 170, Austria: 150, Elveția: 190, Olanda: 170, Belgia: 170, Cehia: 160, Luxemburg: 160 };

function toRad(d) { return (d * Math.PI) / 180; }
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
function distanceToSegmentKm(p, a, b) {
  const meanLat = (a.lat + b.lat + p.lat) / 3;
  const kx = 111.32 * Math.cos(toRad(meanLat));
  const ky = 110.57;
  const ax = a.lon * kx, ay = a.lat * ky;
  const bx = b.lon * kx, by = b.lat * ky;
  const px = p.lon * kx, py = p.lat * ky;
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx, cy = ay + t * dy;
  return Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
}
function getZonePrice(zones, country, lat, lon) {
  const matches = zones.filter((z) => z.country === country && haversine(lat, lon, z.lat, z.lon) <= z.radiusKm);
  if (matches.length === 0) return null;
  return Math.min(...matches.map((z) => z.price));
}
function dn19Surcharge(depLat, depLon, basePrice) {
  let minDist = Infinity;
  for (let i = 0; i < ROUTE_STOPS.length - 1; i++) {
    const a = ROUTE_STOPS[i], b = ROUTE_STOPS[i + 1];
    const d = distanceToSegmentKm({ lat: depLat, lon: depLon }, a, b);
    if (d < minDist) minDist = d;
  }
  if (minDist <= 10) return 0;
  return basePrice <= 149 ? 20 : 10;
}
function todayISO() { return new Date().toISOString().slice(0, 10); }
function formatDateRo(iso) {
  if (!iso) return "";
  return new Date(iso + "T00:00:00").toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric" });
}
function newId() { return "res_" + Date.now() + "_" + Math.floor(Math.random() * 1000); }
function resizePassengers(list, seats) {
  const next = [...list];
  while (next.length < seats) next.push({ prenume: "", nume: "" });
  while (next.length > seats) next.pop();
  return next;
}

const inputStyle = { border: `1px solid ${C.border}`, borderRadius: 10, color: C.ink, padding: "8px 10px" };

export default function App() {
  const [direction, setDirection] = useState("dus");
  const [zones, setZones] = useState(DEFAULT_ZONES);
  const [fallback, setFallback] = useState(DEFAULT_FALLBACK);
  const [submitted, setSubmitted] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    try { setZones(await fetchConfig("price-zones", DEFAULT_ZONES)); } catch (e) { console.error(e); }
    try { setFallback(await fetchConfig("price-fallback", DEFAULT_FALLBACK)); } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function handleSubmit(record) {
    const saved = await createReservation(record);
    setSubmitted(saved);
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>
      <FontImport />
      <header className="max-w-3xl mx-auto px-5 pt-8 pb-2 flex items-center justify-between">
        <Logo />
      </header>

      <main className="max-w-3xl mx-auto px-5 pb-16">
        {loading ? (
          <p style={{ color: C.inkLight }} className="text-sm text-center mt-10">Se încarcă…</p>
        ) : submitted ? (
          <ConfirmationStamp record={submitted} onNew={() => setSubmitted(null)} />
        ) : (
          <>
            <div className="flex gap-2 mb-5">
              <SubTabButton active={direction === "dus"} onClick={() => setDirection("dus")}>Plecare din țară</SubTabButton>
              <SubTabButton active={direction === "retur"} onClick={() => setDirection("retur")}>Întoarcere spre țară</SubTabButton>
            </div>
            {direction === "dus" ? (
              <OutboundForm zones={zones} fallback={fallback} onSubmit={handleSubmit} />
            ) : (
              <ReturnForm zones={zones} fallback={fallback} onSubmit={handleSubmit} />
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

const LEGAL_TABS = [
  {
    id: "termeni",
    label: "Termeni și Condiții",
    body: `Deschiderea, accesarea, vizitarea, folosirea paginilor sau cumpararea produselor prezentate pe pagina magazinului electronic corinaexpressline.ro implica acceptarea termenilor si conditiilor ce urmeaza a fi enumerate.

SC Corina Express Line SRL isi rezerva dreptul de a face modificari si actualizari la acesti termeni si conditii, precum si la oferta disponibila, fara o notificare prealabila si fara precizarea motivelor.

Continutul acestui site (descrieri, elemente grafice, animatii etc.) este proprietatea SC Corina Express Line SRL si este aparat de legea pentru protectia drepturilor de autor. Folosirea fara acordul scris al SC Corina Express Line SRL a oricaror elemente regasite pe site atrage dupa sine consecintele prevazute de legislatia in vigoare.

Plata
Plata serviciilor se poate efectua doar in numerar, la soferi, inainte de inceperea calatoriei.

Anularea rezervarii
In cazul in care doriti sa renuntati la locul rezervat, trebuie sa notificati imediat SC Corina Express Line SRL, de preferinta prin telefon, transmitand data si numele pe care s-a efectuat rezervarea.

SC Corina Express Line SRL nu isi asuma raspunderea cu privire la documentele de trecere a frontierei, necorespunzatoare sau incomplete, respectiv asupra continutului si cantitatii bagajelor, inclusiv raspunderea vamala. Obligatia asupra respectarii legislatiei in vigoare revine calatorului.

In cazul intreruperii calatoriei din vina calatorului (inclusiv intoarcerile din vama), biletul de calatorie isi pierde valabilitatea, iar contravaloarea biletului nu se restituie, precum nici transportul inapoi la domiciliul clientului nu se asigura.

Litigii
Pentru orice conflict aparut intre SC Corina Express Line SRL si clientii sai se va cauta o rezolvare pe cale amiabila. Daca acest lucru nu este posibil, litigiul va fi solutionat de catre instanta judecatoreasca pe a carei raza teritoriala se afla sediul SC Corina Express Line SRL.`,
  },
  {
    id: "anulare",
    label: "Anularea Rezervării",
    body: `In cazul in care doriti sa renuntati la locul rezervat, trebuie sa notificati imediat SC Corina Express Line SRL, de preferinta prin telefon, transmitand data si numele pe care s-a efectuat rezervarea.

SC Corina Express Line SRL nu isi asuma raspunderea cu privire la documentele de trecere a frontierei, necorespunzatoare sau incomplete, respectiv asupra continutului si cantitatii bagajelor, inclusiv raspunderea vamala. Obligatia asupra respectarii legislatiei in vigoare revine calatorului.

In cazul intreruperii calatoriei din vina calatorului (inclusiv intoarcerile din vama), biletul de calatorie isi pierde valabilitatea, iar contravaloarea biletului nu se restituie, precum nici transportul inapoi la domiciliul clientului nu se asigura.`,
  },
  {
    id: "confidentialitate",
    label: "Politica de Confidențialitate",
    body: `Conform cerintelor Legii nr. 677/2001 pentru protectia persoanelor cu privire la prelucrarea datelor cu caracter personal si libera circulatie a acestor date, modificata si completata, SC Corina Express Line SRL are obligatia de a administra in conditii de siguranta si numai pentru scopurile specificate, datele personale pe care ni le furnizati despre dumneavoastra.

Scopul colectarii datelor este: informarea utilizatorilor/clientilor privind situatia rezervarilor lor, evolutia si starea comenzilor, evaluarea serviciilor oferite, activitati comerciale, de promovare a serviciilor, de marketing, de publicitate, de media, administrative, de dezvoltare, de cercetare de piata, de urmarire si monitorizare a vanzarilor si comportamentul consumatorului. Prin completarea datelor dvs. in formularul de rezervare declarati ca acceptati neconditionat ca datele dvs. personale sa fie incluse in baza de date a SC Corina Express Line SRL si va dati acordul expres si neechivoc ca toate aceste date personale sa fie stocate, utilizate si prelucrate de catre SC Corina Express Line SRL.

Prin citirea prezentei Politici ati luat la cunostinta faptul ca va sunt garantate drepturile prevazute de lege, respectiv dreptul de informare, dreptul de acces la date, dreptul de interventie, dreptul de opozitie, dreptul de a nu fi supus unei decizii individuale, dreptul de a se adresa justitiei in caz de incalcare a drepturilor sale garantate de Legea 677/2001. Totodata, aveti dreptul de a va opune prelucrarii datelor dvs. personale si de a solicita stergerea totala sau partiala a acestora. SC Corina Express Line SRL nu promoveaza SPAM-ul. Orice utilizator/client care a furnizat explicit adresa sa de email poate opta pentru stergerea acesteia din baza noastra de date.

Informatiile dumneavoastra cu caracter personal pot fi furnizate si catre Parchet, Politie, Instantele judecatoresti si altor organe abilitate ale statului, in baza si in limitele prevederilor legale si ca urmare a unor cereri expres formulate.`,
  },
];

function LegalModal({ tabId, onClose }) {
  const [active, setActive] = useState(tabId);
  const tab = LEGAL_TABS.find((t) => t.id === active) || LEGAL_TABS[0];
  return (
    <div style={{ background: "rgba(0,0,0,0.5)" }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-5" onClick={onClose}>
      <div
        style={{ background: C.card, borderRadius: 18, maxHeight: "85vh" }}
        className="w-full sm:max-w-lg flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ borderBottom: `1px solid ${C.border}` }} className="flex items-center justify-between px-5 py-4 shrink-0">
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", color: C.ink, fontWeight: 700, fontSize: 15 }}>Informații legale</span>
          <button onClick={onClose} style={{ color: C.inkLight }} aria-label="Închide"><X size={20} /></button>
        </div>
        <div style={{ borderBottom: `1px solid ${C.border}` }} className="flex overflow-x-auto shrink-0">
          {LEGAL_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              style={{
                color: active === t.id ? C.amberDark : C.inkLight,
                borderBottom: active === t.id ? `2px solid ${C.amberDark}` : "2px solid transparent",
                fontWeight: active === t.id ? 700 : 500,
              }}
              className="px-4 py-2.5 text-xs whitespace-nowrap transition"
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="px-5 py-4 overflow-y-auto text-xs leading-relaxed" style={{ color: C.inkLight, whiteSpace: "pre-line" }}>
          {tab.body}
        </div>
      </div>
    </div>
  );
}

function Footer() {
  const [openTab, setOpenTab] = useState(null);
  const CONTACT_EMAIL = "corinaexpresslinee@gmail.com";
  return (
    <footer style={{ borderTop: `1px solid ${C.border}` }} className="mt-6 pt-6 pb-10">
      <div className="max-w-3xl mx-auto px-5 flex flex-col items-center gap-3 text-center">
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
          <a href={`tel:+${CONTACT_PHONE.startsWith("0") ? "40" + CONTACT_PHONE.slice(1) : CONTACT_PHONE}`}
            style={{ color: C.ink }} className="flex items-center gap-1.5 font-medium">
            <Phone size={14} color={C.inkLight} /> +40 {CONTACT_PHONE.slice(1)}
          </a>
          <a href={`https://wa.me/40${CONTACT_PHONE.slice(1)}`} target="_blank" rel="noreferrer"
            style={{ color: C.ink }} className="flex items-center gap-1.5 font-medium">
            <MessageCircle size={14} color={C.inkLight} /> WhatsApp
          </a>
          <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: C.ink }} className="flex items-center gap-1.5 font-medium">
            <Mail size={14} color={C.inkLight} /> {CONTACT_EMAIL}
          </a>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs">
          {LEGAL_TABS.map((t) => (
            <button key={t.id} onClick={() => setOpenTab(t.id)} style={{ color: C.inkLight }} className="flex items-center gap-1 underline underline-offset-2">
              <FileText size={12} /> {t.label}
            </button>
          ))}
        </div>
        <p style={{ color: C.inkLight, fontSize: 11 }}>© {new Date().getFullYear()} Corina Express Line SRL. Toate drepturile rezervate.</p>
      </div>
      {openTab && <LegalModal tabId={openTab} onClose={() => setOpenTab(null)} />}
    </footer>
  );
}

function Logo() {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="flex items-center gap-2">
        <Bus size={24} color={C.amberDark} />
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", color: C.ink, fontSize: 21, fontWeight: 700 }}>
          Corina Express Line
        </span>
      </div>
    );
  }
  return <img src={LOGO_URL} alt="Corina Express Line" style={{ height: 40 }} onError={() => setFailed(true)} />;
}

function SubTabButton({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      background: active ? C.amber : "white", color: active ? "white" : C.inkLight,
      borderRadius: 8, border: `1px solid ${active ? C.amber : C.border}`,
    }} className="px-3 py-1.5 text-xs font-medium transition">{children}</button>
  );
}

function OutboundForm({ zones, fallback, onSubmit }) {
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [seats, setSeats] = useState(1);
  const [departureCity, setDepartureCity] = useState(null);
  const [streetAddress, setStreetAddress] = useState("");
  const [destination, setDestination] = useState(null);
  const [passengers, setPassengers] = useState([{ prenume: "", nume: "" }]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { setPassengers((p) => resizePassengers(p, seats)); }, [seats]);

  const departure = departureCity ? { ...departureCity, country: "România" } : null;
  const priceInfo = computePrice(zones, fallback, departure, destination);
  const fixedInfo = departureCity ? getFixedInfo(departureCity.name) : null;
  const fixedPickup = fixedInfo ? fixedInfo.fixedPickup : null;
  const needsAddress = departureCity && !fixedPickup;
  const departureTime = departureCity ? estimateDepartureTime(departureCity) : null;
  const passengersFilled = passengers.every((p) => p.prenume.trim() && p.nume.trim());
  const name = passengersFilled ? `${passengers[0].prenume.trim()} ${passengers[0].nume.trim()}` : "";
  const canSubmit = phone.trim() && date && departureCity && (!needsAddress || streetAddress.trim()) && destination && seats >= 1 && passengersFilled;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    const pickupPoint = fixedPickup || streetAddress;
    const record = {
      id: newId(), name, phone, date, seats: Number(seats), direction: "dus",
      departureLabel: `${pickupPoint}, ${departureCity.name}`,
      destinationLabel: destination.label,
      departureTime, passengers, notes: notes.trim(),
      basePrice: priceInfo.base, surcharge: priceInfo.surcharge, total: priceInfo.total,
      status: "nou", createdAt: new Date().toISOString(),
    };
    await onSubmit(record);
    setSubmitting(false);
  }

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18 }} className="p-6">
      <div className="flex flex-col gap-4">
        <Field label="Localitatea de plecare" icon={<MapPin size={14} color={C.inkLight} />}>
          <LiveSearch countrycodes="ro" forRomania placeholder="ex: Satu Mare" value={departureCity} onSelect={setDepartureCity} />
        </Field>

        {departureCity && (
          fixedPickup ? (
            <div style={{ background: C.bg, borderRadius: 10 }} className="px-3 py-2 text-xs">
              <span style={{ color: C.inkLight }}>Punct de plecare fix: </span>
              <span style={{ color: C.ink, fontWeight: 600 }}>{fixedPickup}</span>
            </div>
          ) : (
            <Field label="Stradă și număr (adresă exactă de preluare)" icon={<MapPin size={14} color={C.inkLight} />}>
              <input value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} placeholder="ex: Str. Victoriei nr. 12"
                style={inputStyle} className="w-full outline-none text-sm" />
            </Field>
          )
        )}

        {departureCity && (
          <div style={{ background: "#FFF7F2", borderRadius: 10, border: `1px solid ${C.border}` }} className="px-3 py-2 text-xs">
            <span style={{ color: C.inkLight }}>Ora de plecare: </span>
            <span style={{ color: C.amberDark, fontWeight: 700 }}>{departureTime || "se comunică telefonic"}</span>
          </div>
        )}

        <Field label="Destinație (oraș)" icon={<MapPin size={14} color={C.amberDark} />}>
          <LiveSearch countrycodes={DEST_COUNTRY_CODES} placeholder="ex: Nurnberg" value={destination} onSelect={setDestination} />
        </Field>

        <Field label="Număr de telefon" icon={<Phone size={14} color={C.inkLight} />}>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07xx xxx xxx" style={inputStyle} className="w-full outline-none text-sm" />
        </Field>

        <Field label="Data plecării" icon={<Calendar size={14} color={C.inkLight} />}>
          <input type="date" value={date} min={todayISO()} onChange={(e) => setDate(e.target.value)} style={inputStyle} className="w-full outline-none text-sm" />
        </Field>

        <Field label="Număr de locuri" icon={<Users size={14} color={C.inkLight} />}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSeats(Math.max(1, seats - 1))} style={{ border: `1px solid ${C.border}`, color: C.ink, borderRadius: 8 }} className="w-8 h-8 text-sm font-semibold">−</button>
            <span style={{ color: C.ink, fontWeight: 600 }} className="w-6 text-center">{seats}</span>
            <button onClick={() => setSeats(Math.min(8, seats + 1))} style={{ border: `1px solid ${C.border}`, color: C.ink, borderRadius: 8 }} className="w-8 h-8 text-sm font-semibold">+</button>
          </div>
        </Field>

        <PassengerList passengers={passengers} setPassengers={setPassengers} />

        <Field label="Mențiuni (opțional)" icon={<Users size={14} color={C.inkLight} />}>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ex: bagaj în plus, scaun copil, altă rugăminte…"
            style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} className="w-full outline-none text-sm" />
        </Field>

        {departureCity && destination && (
          <div style={{ background: C.bg, borderRadius: 12 }} className="p-4 text-sm">
            {priceInfo.total == null ? (
              <p style={{ color: C.inkLight }}>Nu avem încă un preț definit pentru această zonă — vei fi contactat cu o ofertă.</p>
            ) : (
              <Row label="Preț total" value={`${priceInfo.total}€`} bold />
            )}
            <p style={{ color: C.inkLight, fontSize: 11 }} className="mt-2 pt-2">
              50 kg bagaje incluse în preț. Bicicletele, televizoarele și alte obiecte voluminoase se taxează separat.
            </p>
          </div>
        )}
      </div>

      <button onClick={handleSubmit} disabled={!canSubmit || submitting}
        style={{ background: canSubmit ? C.amber : C.border, color: canSubmit ? "white" : C.inkLight, borderRadius: 12 }}
        className="w-full mt-6 py-3 text-sm font-semibold transition disabled:cursor-not-allowed">
        {submitting ? "Se trimite…" : "Trimite cererea de rezervare"}
      </button>
    </div>
  );
}

function ReturnForm({ zones, fallback, onSubmit }) {
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [seats, setSeats] = useState(1);
  const [pickupCity, setPickupCity] = useState(null);
  const [streetAddress, setStreetAddress] = useState("");
  const [destinationCity, setDestinationCity] = useState(null);
  const [passengers, setPassengers] = useState([{ prenume: "", nume: "" }]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { setPassengers((p) => resizePassengers(p, seats)); }, [seats]);

  const destination = destinationCity ? { ...destinationCity, country: "România" } : null;
  const priceInfo = computePrice(zones, fallback, destination, pickupCity);
  const passengersFilled = passengers.every((p) => p.prenume.trim() && p.nume.trim());
  const name = passengersFilled ? `${passengers[0].prenume.trim()} ${passengers[0].nume.trim()}` : "";
  const canSubmit = phone.trim() && date && pickupCity && streetAddress.trim() && destinationCity && seats >= 1 && passengersFilled;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    const record = {
      id: newId(), name, phone, date, seats: Number(seats), direction: "retur",
      departureLabel: `${streetAddress}, ${pickupCity.name}, ${pickupCity.country}`,
      destinationLabel: destinationCity.name,
      departureTime: null, passengers, notes: notes.trim(),
      basePrice: priceInfo.base, surcharge: priceInfo.surcharge, total: priceInfo.total,
      status: "nou", createdAt: new Date().toISOString(),
    };
    await onSubmit(record);
    setSubmitting(false);
  }

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18 }} className="p-6">
      <div className="flex flex-col gap-4">
        <Field label="Orașul de unde vă luăm (străinătate)" icon={<MapPin size={14} color={C.amberDark} />}>
          <LiveSearch countrycodes={DEST_COUNTRY_CODES} placeholder="ex: Nurnberg" value={pickupCity} onSelect={setPickupCity} />
        </Field>

        <Field label="Stradă și număr (adresă exactă de preluare)" icon={<MapPin size={14} color={C.inkLight} />}>
          <input value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} placeholder="ex: Musterstraße 12"
            style={inputStyle} className="w-full outline-none text-sm" />
        </Field>

        <Field label="Localitatea de destinație (România)" icon={<MapPin size={14} color={C.inkLight} />}>
          <LiveSearch countrycodes="ro" forRomania placeholder="ex: Satu Mare" value={destinationCity} onSelect={setDestinationCity} />
        </Field>

        <div style={{ background: "#FFF7F2", borderRadius: 10, border: `1px solid ${C.border}` }} className="px-3 py-2 text-xs">
          <span style={{ color: C.inkLight }}>Ora exactă de plecare se comunică telefonic, cu o zi înainte.</span>
        </div>

        <Field label="Număr de telefon" icon={<Phone size={14} color={C.inkLight} />}>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07xx xxx xxx" style={inputStyle} className="w-full outline-none text-sm" />
        </Field>

        <Field label="Data plecării" icon={<Calendar size={14} color={C.inkLight} />}>
          <input type="date" value={date} min={todayISO()} onChange={(e) => setDate(e.target.value)} style={inputStyle} className="w-full outline-none text-sm" />
        </Field>

        <Field label="Număr de locuri" icon={<Users size={14} color={C.inkLight} />}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSeats(Math.max(1, seats - 1))} style={{ border: `1px solid ${C.border}`, color: C.ink, borderRadius: 8 }} className="w-8 h-8 text-sm font-semibold">−</button>
            <span style={{ color: C.ink, fontWeight: 600 }} className="w-6 text-center">{seats}</span>
            <button onClick={() => setSeats(Math.min(8, seats + 1))} style={{ border: `1px solid ${C.border}`, color: C.ink, borderRadius: 8 }} className="w-8 h-8 text-sm font-semibold">+</button>
          </div>
        </Field>

        <PassengerList passengers={passengers} setPassengers={setPassengers} />

        <Field label="Mențiuni (opțional)" icon={<Users size={14} color={C.inkLight} />}>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ex: bagaj în plus, scaun copil, altă rugăminte…"
            style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} className="w-full outline-none text-sm" />
        </Field>

        {pickupCity && destinationCity && (
          <div style={{ background: C.bg, borderRadius: 12 }} className="p-4 text-sm">
            {priceInfo.total == null ? (
              <p style={{ color: C.inkLight }}>Nu avem încă un preț definit pentru această zonă — vei fi contactat cu o ofertă.</p>
            ) : (
              <Row label="Preț total" value={`${priceInfo.total}€`} bold />
            )}
            <p style={{ color: C.inkLight, fontSize: 11 }} className="mt-2 pt-2">
              50 kg bagaje incluse în preț. Bicicletele, televizoarele și alte obiecte voluminoase se taxează separat.
            </p>
          </div>
        )}
      </div>

      <button onClick={handleSubmit} disabled={!canSubmit || submitting}
        style={{ background: canSubmit ? C.amber : C.border, color: canSubmit ? "white" : C.inkLight, borderRadius: 12 }}
        className="w-full mt-6 py-3 text-sm font-semibold transition disabled:cursor-not-allowed">
        {submitting ? "Se trimite…" : "Trimite cererea de rezervare"}
      </button>
    </div>
  );
}

function computePrice(zones, fallback, departure, destination) {
  if (!departure || !destination) return { base: null, surcharge: 0, total: null };
  const base = getZonePrice(zones, destination.country, destination.lat, destination.lon) ?? fallback[destination.country] ?? null;
  if (base == null) return { base: null, surcharge: 0, total: null };
  let surcharge = dn19Surcharge(departure.lat, departure.lon, base);
  if (departure.name === "Cluj-Napoca") surcharge += 10;
  return { base, surcharge, total: base + surcharge };
}

function Field({ label, icon, children }) {
  return (
    <div>
      <label style={{ color: C.ink, fontSize: 12, fontWeight: 600 }} className="flex items-center gap-1.5 mb-1.5">{icon} {label}</label>
      {children}
    </div>
  );
}
function Row({ label, value, bold }) {
  return (
    <div className="flex justify-between py-0.5">
      <span style={{ color: C.inkLight }}>{label}</span>
      <span style={{ color: C.ink, fontWeight: bold ? 700 : 600 }}>{value}</span>
    </div>
  );
}

function PassengerList({ passengers, setPassengers }) {
  function update(i, field, value) {
    setPassengers((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)));
  }
  if (passengers.length <= 1) {
    return (
      <Field label="Prenume și nume pasager" icon={<Users size={14} color={C.inkLight} />}>
        <div className="flex gap-2">
          <input value={passengers[0]?.prenume || ""} onChange={(e) => update(0, "prenume", e.target.value)} placeholder="Prenume" style={inputStyle} className="w-1/2 outline-none text-sm" />
          <input value={passengers[0]?.nume || ""} onChange={(e) => update(0, "nume", e.target.value)} placeholder="Nume" style={inputStyle} className="w-1/2 outline-none text-sm" />
        </div>
      </Field>
    );
  }
  return (
    <Field label={`Pasageri (${passengers.length} locuri — câte un nume complet pentru fiecare)`} icon={<Users size={14} color={C.inkLight} />}>
      <div className="flex flex-col gap-2">
        {passengers.map((p, i) => (
          <div key={i} className="flex gap-2 items-center">
            <span style={{ color: C.inkLight, fontSize: 11 }} className="w-4">{i + 1}.</span>
            <input value={p.prenume} onChange={(e) => update(i, "prenume", e.target.value)} placeholder="Prenume" style={inputStyle} className="w-1/2 outline-none text-sm" />
            <input value={p.nume} onChange={(e) => update(i, "nume", e.target.value)} placeholder="Nume" style={inputStyle} className="w-1/2 outline-none text-sm" />
          </div>
        ))}
      </div>
    </Field>
  );
}

// ---------- Local (offline) search over a built-in list ----------
// ---------- Căutare live (Nominatim / OpenStreetMap) ----------
async function nominatimSearch(query, countrycodes) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&accept-language=ro&limit=7&countrycodes=${countrycodes}&q=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("search failed");
  return res.json();
}

function LiveSearch({ countrycodes, placeholder, value, onSelect, forRomania }) {
  const [query, setQuery] = useState(value ? value.label : "");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);

  function handleChange(v) {
    setQuery(v);
    onSelect(null);
    if (timer.current) clearTimeout(timer.current);
    if (v.trim().length < 3) { setResults([]); setOpen(false); return; }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const data = await nominatimSearch(v, countrycodes);
        setResults(data);
        setOpen(true);
      } catch (e) { console.error(e); setResults([]); }
      setLoading(false);
    }, 450);
  }

  function pick(r) {
    const addr = r.address || {};
    const cityName = addr.city || addr.town || addr.village || addr.municipality || addr.county || r.display_name.split(",")[0];
    const postcode = addr.postcode || "";
    const countryCode = (addr.country_code || "").toLowerCase();
    const country = forRomania ? "România" : (COUNTRY_CODE_TO_NAME[countryCode] || addr.country || "");
    const label = forRomania
      ? cityName
      : (postcode ? `${postcode} ${cityName}, ${country}` : `${cityName}, ${country}`);
    const item = { name: cityName, label, lat: parseFloat(r.lat), lon: parseFloat(r.lon), country, postcode };
    onSelect(item);
    setQuery(label);
    setOpen(false);
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search size={14} color={C.inkLight} className="absolute left-3 top-1/2 -translate-y-1/2" />
        <input value={query} onChange={(e) => handleChange(e.target.value)} onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder} style={{ ...inputStyle, paddingLeft: 30 }} className="w-full outline-none text-sm" />
      </div>
      {open && (
        <div style={{ background: "white", border: `1px solid ${C.border}`, borderRadius: 10 }} className="absolute z-10 w-full mt-1 max-h-52 overflow-y-auto shadow-md">
          {results.length === 0 && <p style={{ color: C.inkLight }} className="px-3 py-2 text-xs">Niciun rezultat.</p>}
          {results.map((r) => (
            <button key={r.place_id} onClick={() => pick(r)} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 border-b last:border-b-0" style={{ borderColor: C.border, color: C.ink }}>
              {r.display_name}
            </button>
          ))}
        </div>
      )}
      {loading && <p style={{ color: C.inkLight, fontSize: 11 }} className="mt-1">Se caută…</p>}
    </div>
  );
}

// ---------- Confirmation ----------
function ConfirmationStamp({ record, onNew }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18 }} className="p-8 text-center">
      <div style={{ border: `3px solid ${C.sage}`, color: C.sage, borderRadius: "50%" }} className="w-16 h-16 mx-auto flex items-center justify-center mb-4 rotate-[-6deg]">
        <Check size={28} />
      </div>
      <p style={{ fontFamily: "'Space Grotesk', sans-serif", color: C.ink, fontSize: 18, fontWeight: 700 }} className="mb-1">Cerere trimisă</p>
      <p style={{ color: C.inkLight, fontSize: 13 }} className="mb-5">
        Vei fi contactat/ă la {record.phone} pentru confirmare, sau ne poți scrie pe WhatsApp la {CONTACT_PHONE}.
      </p>
      <div style={{ background: C.bg, borderRadius: 12 }} className="text-left p-4 text-xs mb-5">
        <Row label="Cursă" value={record.direction === "retur" ? "Întoarcere spre țară" : "Plecare din țară"} />
        <Row label="De la" value={record.departureLabel} />
        <Row label="Până la" value={record.destinationLabel} />
        <Row label="Data" value={formatDateRo(record.date)} />
        {record.departureTime && <Row label="Ora de plecare" value={record.departureTime} />}
        <Row label="Locuri" value={String(record.seats)} />
        {record.passengers?.length > 0 && (
          <Row label="Pasageri" value={record.passengers.map((p) => `${p.prenume} ${p.nume}`).join(", ")} />
        )}
        {record.notes && <Row label="Mențiuni" value={record.notes} />}
        {record.total != null && <Row label="Total" value={`${record.total}€`} bold />}
      </div>
      <button onClick={onNew} style={{ background: C.navy, color: "white", borderRadius: 10 }} className="px-5 py-2 text-sm font-medium">Fă o altă rezervare</button>
    </div>
  );
}

function FontImport() {
  return <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');`}</style>;
}
