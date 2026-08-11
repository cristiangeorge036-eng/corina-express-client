import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, doc, getDoc } from "firebase/firestore";

// Completează aceste valori din .env (vezi .env.example) — trebuie să fie
// EXACT ACELEAȘI ca în proiectul Firebase folosit de site-ul de administrare,
// ca rezervările trimise aici să apară acolo.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

const NOTIFY_EMAIL = "corinaexpresslinee@gmail.com";

async function queueReservationEmail(record) {
  const dir = record.direction === "retur" ? "ÎNTOARCERE spre țară" : "PLECARE din țară";
  const passengers = (record.passengers || [])
    .map((p, i) => `  ${i + 1}. ${p.prenume} ${p.nume}`)
    .join("\n");
  const text = [
    `Rezervare nouă (${dir})`,
    `Contact: ${record.name} — ${record.phone}`,
    `De la: ${record.departureLabel}`,
    `Până la: ${record.destinationLabel}`,
    `Data: ${record.date}${record.departureTime ? " — ora " + record.departureTime : ""}`,
    `Locuri: ${record.seats}`,
    passengers ? `Pasageri:\n${passengers}` : "",
    `Plată: ${record.payment}`,
    record.total != null ? `Total: ${record.total}€` : "",
    record.notes ? `Mențiuni client: ${record.notes}` : "",
  ].filter(Boolean).join("\n");

  await addDoc(collection(db, "mail"), {
    to: [NOTIFY_EMAIL],
    message: { subject: `Rezervare nouă — ${record.name}`, text },
  });
}

// Clientul doar CREEAZĂ rezervări — nu poate citi, edita sau șterge rezervări existente.
export async function createReservation(record) {
  const { id, ...data } = record;
  const ref = await addDoc(collection(db, "reservations"), data);
  const saved = { id: ref.id, ...data };
  try { await queueReservationEmail(saved); } catch (e) { console.error("email notification failed:", e); }
  return saved;
}

// Citește prețurile stabilite de administrator (doar citire).
export async function fetchConfig(key, fallbackValue) {
  const snap = await getDoc(doc(db, "config", key));
  return snap.exists() ? snap.data().value : fallbackValue;
}
