import { collection, getDocs, query, setDoc, doc, serverTimestamp, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { VehicleData } from "../pages/AddVehicle/AddVehicle";

export type VehicleDoc = VehicleData & {
  uid: string;
  updatedAt?: unknown;
  createdAt?: unknown;
};

const vehicleDocId = (uid: string, placa: string) => `${uid}_${placa.toUpperCase()}`;

export async function loadVehicles(uid: string): Promise<VehicleData[]> {
  // Só `where` — evita índice composto obrigatório (where + orderBy). Ordenação em memória.
  const q = query(collection(db, "vehicles"), where("uid", "==", uid));
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => {
    const data = d.data() as any;
    const v: VehicleData = {
      placa: String(data.placa ?? "").toUpperCase(),
      tipo: String(data.tipo ?? ""),
      modelo: String(data.modelo ?? ""),
      ano: String(data.ano ?? ""),
      possuiSeguro: Boolean(data.possuiSeguro),
      insurance: data.insurance ? { ...data.insurance } : undefined,
    };
    return v;
  });
  return list.sort((a, b) => a.placa.localeCompare(b.placa, "pt-BR"));
}

export async function upsertVehicle(uid: string, vehicle: VehicleData): Promise<void> {
  const placa = vehicle.placa.toUpperCase();
  const id = vehicleDocId(uid, placa);
  await setDoc(
    doc(db, "vehicles", id),
    {
      uid,
      ...vehicle,
      placa,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}

