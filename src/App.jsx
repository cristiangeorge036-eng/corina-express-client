import { useState, useEffect } from "react";
import { Bus, Phone, MapPin, Users, CreditCard, Calendar, Check, Search } from "lucide-react";
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
const PAYMENTS = ["Numerar la autocar", "Card", "Transfer bancar"];
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
const ROMANIA_CITIES = [
  { name: "Satu Mare", lat: 47.7908, lon: 22.8857, fixedPickup: null, fixedTime: "15:00" },
  { name: "Baia Mare", lat: 47.6567, lon: 23.5847, fixedPickup: "Stația Gară", fixedTime: "13:30" },
  { name: "Oradea", lat: 47.0465, lon: 21.9189, fixedPickup: "Mall, Bulevardul Ștefan cel Mare", fixedTime: "18:00" },
  { name: "Zalău", lat: 47.1911, lon: 23.0575, fixedPickup: "Gară", fixedTime: "13:00" },
  { name: "Cluj-Napoca", lat: 46.7712, lon: 23.6236, fixedPickup: "Autogara Fany", fixedTime: null },
  { name: "Carei", lat: 47.6836, lon: 22.4694, fixedPickup: "Piața Avram Iancu, fostul BRD", fixedTime: "16:00" },
  { name: "Marghita", lat: 47.3494, lon: 22.3364, fixedPickup: null, fixedTime: "17:00" },
  { name: "Valea lui Mihai", lat: 47.5167, lon: 22.1167, fixedPickup: null, fixedTime: "17:00" },
  { name: "Negrești-Oaș", lat: 47.8697, lon: 23.4256, fixedPickup: null, fixedTime: null },
  { name: "Sighetu Marmației", lat: 47.9257, lon: 23.8919, fixedPickup: null, fixedTime: null },
  { name: "Beiuș", lat: 46.6689, lon: 22.3536, fixedPickup: null, fixedTime: null },
  { name: "Dej", lat: 47.1428, lon: 23.8736, fixedPickup: null, fixedTime: null },
  { name: "Turda", lat: 46.5667, lon: 23.7833, fixedPickup: null, fixedTime: null },
  // Bihor — sate/localități pentru testare
  { name: "Aleșd", lat: 47.0667, lon: 22.4, fixedPickup: null, fixedTime: null },
  { name: "Ștei", lat: 46.5167, lon: 22.3833, fixedPickup: null, fixedTime: null },
  { name: "Salonta", lat: 46.8, lon: 21.65, fixedPickup: null, fixedTime: null },
  { name: "Săcueni", lat: 47.35, lon: 22.1167, fixedPickup: null, fixedTime: null },
  { name: "Nucet", lat: 46.4667, lon: 22.6167, fixedPickup: null, fixedTime: null },
  { name: "Vașcău", lat: 46.4667, lon: 22.4667, fixedPickup: null, fixedTime: null },
  { name: "Tinca", lat: 46.7833, lon: 21.95, fixedPickup: null, fixedTime: null },
  { name: "Diosig", lat: 47.2833, lon: 21.9333, fixedPickup: null, fixedTime: null },
  { name: "Sânmartin (Bihor)", lat: 46.9833, lon: 21.95, fixedPickup: null, fixedTime: null },
  { name: "Biharia", lat: 47.1167, lon: 21.8833, fixedPickup: null, fixedTime: null },
  { name: "Borș", lat: 47.0667, lon: 21.7167, fixedPickup: null, fixedTime: null },
  { name: "Șuncuiuș", lat: 46.9333, lon: 22.6, fixedPickup: null, fixedTime: null },
  { name: "Vadu Crișului", lat: 46.9333, lon: 22.4833, fixedPickup: null, fixedTime: null },
  { name: "Popești (Bihor)", lat: 47.2167, lon: 22.2, fixedPickup: null, fixedTime: null },
  { name: "Curtuișeni", lat: 47.3667, lon: 22.0, fixedPickup: null, fixedTime: null },
  { name: "Cefa", lat: 46.9333, lon: 21.7167, fixedPickup: null, fixedTime: null },
  { name: "Sălard", lat: 47.2, lon: 21.9167, fixedPickup: null, fixedTime: null },
  { name: "Girișu de Criș", lat: 47.0, lon: 21.7833, fixedPickup: null, fixedTime: null },
  { name: "Oșorhei", lat: 47.0167, lon: 21.85, fixedPickup: null, fixedTime: null },
  { name: "Chișlaz", lat: 47.15, lon: 22.15, fixedPickup: null, fixedTime: null },
  // Sălaj — sate/localități pentru testare
  { name: "Jibou", lat: 47.26, lon: 23.25, fixedPickup: null, fixedTime: null },
  { name: "Șimleu Silvaniei", lat: 47.2333, lon: 22.8, fixedPickup: null, fixedTime: null },
  { name: "Cehu Silvaniei", lat: 47.4, lon: 23.1667, fixedPickup: null, fixedTime: null },
  { name: "Crasna", lat: 47.25, lon: 22.5833, fixedPickup: null, fixedTime: null },
  { name: "Hida", lat: 47.05, lon: 23.1833, fixedPickup: null, fixedTime: null },
  { name: "Românași", lat: 47.1167, lon: 23.2667, fixedPickup: null, fixedTime: null },
  { name: "Zimbor", lat: 46.9833, lon: 23.2, fixedPickup: null, fixedTime: null },
  { name: "Sânmihaiu Almașului", lat: 46.95, lon: 23.1167, fixedPickup: null, fixedTime: null },
  { name: "Ileanda", lat: 47.3333, lon: 23.7, fixedPickup: null, fixedTime: null },
  { name: "Năpradea", lat: 47.3333, lon: 23.2833, fixedPickup: null, fixedTime: null },
];

// Main pickup corridor used to estimate times for localities without a fixed time
const ROUTE_STOPS = [
  { name: "Baia Mare", lat: 47.6567, lon: 23.5847, minutes: 13 * 60 + 30 },
  { name: "Satu Mare", lat: 47.7908, lon: 22.8857, minutes: 15 * 60 },
  { name: "Carei", lat: 47.6836, lon: 22.4694, minutes: 16 * 60 },
  { name: "Marghita/Valea lui Mihai", lat: 47.4331, lon: 22.2266, minutes: 17 * 60 },
  { name: "Oradea", lat: 47.0465, lon: 21.9189, minutes: 18 * 60 },
];
const TIME_INTERP_ELIGIBLE = ["Negrești-Oaș", "Sighetu Marmației", "Beiuș"];

function minutesToHHMM(m) {
  const h = Math.floor(m / 60) % 24;
  const mm = Math.round(m % 60);
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
function estimateDepartureTime(city) {
  if (city.fixedTime) return city.fixedTime;
  if (!TIME_INTERP_ELIGIBLE.includes(city.name)) return null;
  let best = null;
  for (let i = 0; i < ROUTE_STOPS.length - 1; i++) {
    const a = ROUTE_STOPS[i], b = ROUTE_STOPS[i + 1];
    const da = haversine(city.lat, city.lon, a.lat, a.lon);
    const db = haversine(city.lat, city.lon, b.lat, b.lon);
    const score = da + db;
    if (!best || score < best.score) {
      const t = da + db === 0 ? 0 : da / (da + db);
      best = { score, minutes: a.minutes + t * (b.minutes - a.minutes) };
    }
  }
  return best ? minutesToHHMM(best.minutes) : null;
}

const DESTINATION_CITIES = [
  { country: "Germania", name: "Nürnberg", postcode: "90402", lat: 49.4521, lon: 11.0767 },
  { country: "Germania", name: "Illertissen", postcode: "89257", lat: 48.2298, lon: 10.1002 },
  { country: "Germania", name: "Ulm", postcode: "89073", lat: 48.4011, lon: 9.9876 },
  { country: "Germania", name: "Stuttgart", postcode: "70173", lat: 48.7758, lon: 9.1829 },
  { country: "Germania", name: "Karlsruhe", postcode: "76131", lat: 49.0069, lon: 8.4037 },
  { country: "Germania", name: "Freiburg im Breisgau", postcode: "79098", lat: 47.999, lon: 7.8421 },
  { country: "Germania", name: "Frankfurt am Main", postcode: "60306", lat: 50.1109, lon: 8.6821 },
  { country: "Germania", name: "Köln", postcode: "50667", lat: 50.9375, lon: 6.9603 },
  { country: "Germania", name: "Dortmund", postcode: "44135", lat: 51.5136, lon: 7.4653 },
  { country: "Germania", name: "Bochum", postcode: "44787", lat: 51.4818, lon: 7.2162 },
  { country: "Germania", name: "Kassel", postcode: "34117", lat: 51.3127, lon: 9.4797 },
  { country: "Germania", name: "Würzburg", postcode: "97070", lat: 49.7913, lon: 9.9534 },
  { country: "Germania", name: "Hannover", postcode: "30159", lat: 52.3759, lon: 9.732 },
  { country: "Germania", name: "Bremen", postcode: "28195", lat: 53.0793, lon: 8.8017 },
  { country: "Germania", name: "Bremerhaven", postcode: "27568", lat: 53.5396, lon: 8.5809 },
  { country: "Germania", name: "Hamburg", postcode: "20095", lat: 53.5511, lon: 9.9937 },
  { country: "Germania", name: "Berlin", postcode: "10115", lat: 52.52, lon: 13.405 },
  { country: "Germania", name: "Magdeburg", postcode: "39104", lat: 52.1205, lon: 11.6276 },
  { country: "Germania", name: "Bayreuth", postcode: "95444", lat: 49.9456, lon: 11.5713 },
  { country: "Germania", name: "Marktredwitz", postcode: "95615", lat: 50.0, lon: 12.0866 },
  { country: "Germania", name: "Dresden", postcode: "01067", lat: 51.0504, lon: 13.7373 },
  { country: "Germania", name: "Cottbus", postcode: "03046", lat: 51.7563, lon: 14.3329 },
  { country: "Germania", name: "Passau", postcode: "94032", lat: 48.5665, lon: 13.4312 },
  { country: "Germania", name: "München", postcode: "80331", lat: 48.1351, lon: 11.582 },
  { country: "Germania", name: "Rostock", postcode: "18055", lat: 54.0887, lon: 12.1414 },
  { country: "Germania", name: "Plauen", postcode: "08523", lat: 50.4947, lon: 12.1382 },

  { country: "Austria", name: "Wien", postcode: "1010", lat: 48.2082, lon: 16.3738 },
  { country: "Austria", name: "Linz", postcode: "4020", lat: 48.3069, lon: 14.2858 },
  { country: "Austria", name: "Salzburg", postcode: "5020", lat: 47.8095, lon: 13.055 },
  { country: "Austria", name: "Graz", postcode: "8010", lat: 47.0707, lon: 15.4395 },
  { country: "Austria", name: "Villach", postcode: "9500", lat: 46.6111, lon: 13.8558 },
  { country: "Austria", name: "Innsbruck", postcode: "6020", lat: 47.2692, lon: 11.4041 },
  { country: "Austria", name: "Bregenz", postcode: "6900", lat: 47.5031, lon: 9.7471 },

  { country: "Elveția", name: "Zürich", postcode: "8001", lat: 47.3769, lon: 8.5417 },
  { country: "Elveția", name: "Basel", postcode: "4001", lat: 47.5596, lon: 7.5886 },
  { country: "Elveția", name: "Bern", postcode: "3011", lat: 46.948, lon: 7.4474 },
  { country: "Elveția", name: "Genève", postcode: "1201", lat: 46.2044, lon: 6.1432 },

  { country: "Olanda", name: "Amsterdam", postcode: "1012", lat: 52.3676, lon: 4.9041 },
  { country: "Olanda", name: "Rotterdam", postcode: "3011", lat: 51.9244, lon: 4.4777 },
  { country: "Olanda", name: "Venlo", postcode: "5911", lat: 51.3704, lon: 6.1724 },
  { country: "Olanda", name: "Etten-Leur", postcode: "4870", lat: 51.5719, lon: 4.6353 },
  { country: "Olanda", name: "Groningen", postcode: "9711", lat: 53.2194, lon: 6.5665 },

  { country: "Belgia", name: "Bruxelles", postcode: "1000", lat: 50.8503, lon: 4.3517 },
  { country: "Belgia", name: "Gent", postcode: "9000", lat: 51.0543, lon: 3.7174 },
  { country: "Belgia", name: "Charleroi", postcode: "6000", lat: 50.4108, lon: 4.4446 },
  { country: "Belgia", name: "Antwerpen", postcode: "2000", lat: 51.2194, lon: 4.4025 },
  { country: "Belgia", name: "Bouillon", postcode: "6830", lat: 49.7942, lon: 5.0678 },

  { country: "Cehia", name: "Praha", postcode: "11000", lat: 50.0755, lon: 14.4378 },
  { country: "Cehia", name: "Plzeň", postcode: "30100", lat: 49.7384, lon: 13.3736 },

  { country: "Luxemburg", name: "Luxembourg", postcode: "1009", lat: 49.6117, lon: 6.1319 },
];

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
    </div>
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
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [seats, setSeats] = useState(1);
  const [payment, setPayment] = useState("");
  const [departureCity, setDepartureCity] = useState(null);
  const [streetAddress, setStreetAddress] = useState("");
  const [destination, setDestination] = useState(null);
  const [passengers, setPassengers] = useState([{ prenume: "", nume: "" }]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { setPassengers((p) => resizePassengers(p, seats)); }, [seats]);

  const departure = departureCity ? { ...departureCity, country: "România" } : null;
  const priceInfo = computePrice(zones, fallback, departure, destination);
  const needsAddress = departureCity && !departureCity.fixedPickup;
  const departureTime = departureCity ? estimateDepartureTime(departureCity) : null;
  const passengersFilled = passengers.every((p) => p.prenume.trim() && p.nume.trim());
  const canSubmit = name.trim() && phone.trim() && date && payment && departureCity && (!needsAddress || streetAddress.trim()) && destination && seats >= 1 && passengersFilled;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    const pickupPoint = departureCity.fixedPickup || streetAddress;
    const record = {
      id: newId(), name, phone, date, seats: Number(seats), payment, direction: "dus",
      departureLabel: `${pickupPoint}, ${departureCity.name}`,
      destinationLabel: `${destination.postcode} ${destination.name}, ${destination.country}`,
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
          <LocalSearch list={ROMANIA_CITIES} getLabel={(c) => c.name} placeholder="ex: Satu Mare" value={departureCity} onSelect={setDepartureCity} />
        </Field>

        {departureCity && (
          departureCity.fixedPickup ? (
            <div style={{ background: C.bg, borderRadius: 10 }} className="px-3 py-2 text-xs">
              <span style={{ color: C.inkLight }}>Punct de plecare fix: </span>
              <span style={{ color: C.ink, fontWeight: 600 }}>{departureCity.fixedPickup}</span>
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
          <LocalSearch list={DESTINATION_CITIES} getLabel={(c) => `${c.name} — ${c.country}`} placeholder="ex: Nurnberg" value={destination} onSelect={setDestination} />
        </Field>

        <Field label="Nume complet" icon={<Users size={14} color={C.inkLight} />}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ex: Maria Ionescu" style={inputStyle} className="w-full outline-none text-sm" />
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

        <Field label="Metodă de plată" icon={<CreditCard size={14} color={C.inkLight} />}>
          <div className="flex flex-col gap-2">
            {PAYMENTS.map((p) => (
              <button key={p} onClick={() => setPayment(p)} style={{
                border: `1px solid ${payment === p ? C.amberDark : C.border}`, background: payment === p ? "#FDF1E7" : "white", color: C.ink, borderRadius: 10,
              }} className="text-left px-3 py-2 text-sm transition">{p}</button>
            ))}
          </div>
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
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [seats, setSeats] = useState(1);
  const [payment, setPayment] = useState("");
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
  const canSubmit = name.trim() && phone.trim() && date && payment && pickupCity && streetAddress.trim() && destinationCity && seats >= 1 && passengersFilled;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    const record = {
      id: newId(), name, phone, date, seats: Number(seats), payment, direction: "retur",
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
          <LocalSearch list={DESTINATION_CITIES} getLabel={(c) => `${c.name} — ${c.country}`} placeholder="ex: Nurnberg" value={pickupCity} onSelect={setPickupCity} />
        </Field>

        <Field label="Stradă și număr (adresă exactă de preluare)" icon={<MapPin size={14} color={C.inkLight} />}>
          <input value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} placeholder="ex: Musterstraße 12"
            style={inputStyle} className="w-full outline-none text-sm" />
        </Field>

        <Field label="Localitatea de destinație (România)" icon={<MapPin size={14} color={C.inkLight} />}>
          <LocalSearch list={ROMANIA_CITIES} getLabel={(c) => c.name} placeholder="ex: Satu Mare" value={destinationCity} onSelect={setDestinationCity} />
        </Field>

        <div style={{ background: "#FFF7F2", borderRadius: 10, border: `1px solid ${C.border}` }} className="px-3 py-2 text-xs">
          <span style={{ color: C.inkLight }}>Ora exactă de plecare se comunică telefonic, cu o zi înainte.</span>
        </div>

        <Field label="Nume complet" icon={<Users size={14} color={C.inkLight} />}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ex: Maria Ionescu" style={inputStyle} className="w-full outline-none text-sm" />
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

        <Field label="Metodă de plată" icon={<CreditCard size={14} color={C.inkLight} />}>
          <div className="flex flex-col gap-2">
            {PAYMENTS.map((p) => (
              <button key={p} onClick={() => setPayment(p)} style={{
                border: `1px solid ${payment === p ? C.amberDark : C.border}`, background: payment === p ? "#FDF1E7" : "white", color: C.ink, borderRadius: 10,
              }} className="text-left px-3 py-2 text-sm transition">{p}</button>
            ))}
          </div>
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
function LocalSearch({ list, getLabel, placeholder, value, onSelect }) {
  const [query, setQuery] = useState(value ? getLabel(value) : "");
  const [open, setOpen] = useState(false);

  const results = query.trim().length > 0
    ? list.filter((c) => getLabel(c).toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8)
    : list.slice(0, 8);

  function handleChange(v) {
    setQuery(v);
    onSelect(null);
    setOpen(true);
  }
  function pick(item) {
    onSelect(item);
    setQuery(getLabel(item));
    setOpen(false);
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search size={14} color={C.inkLight} className="absolute left-3 top-1/2 -translate-y-1/2" />
        <input value={query} onChange={(e) => handleChange(e.target.value)} onFocus={() => setOpen(true)}
          placeholder={placeholder} style={{ ...inputStyle, paddingLeft: 30 }} className="w-full outline-none text-sm" />
      </div>
      {open && (
        <div style={{ background: "white", border: `1px solid ${C.border}`, borderRadius: 10 }} className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto shadow-md">
          {results.length === 0 && <p style={{ color: C.inkLight }} className="px-3 py-2 text-xs">Niciun rezultat.</p>}
          {results.map((item, i) => (
            <button key={i} onClick={() => pick(item)} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 border-b last:border-b-0" style={{ borderColor: C.border, color: C.ink }}>
              {getLabel(item)}{item.postcode ? ` · ${item.postcode}` : ""}
            </button>
          ))}
        </div>
      )}
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
        <Row label="Plată" value={record.payment} />
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
