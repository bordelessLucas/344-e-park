import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export type UserAddress = {
  cep?: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string; // UF
};

export async function loadUserAddress(uid: string): Promise<UserAddress | null> {
  const snap = await getDoc(doc(db, "addresses", uid));
  if (!snap.exists()) return null;
  const data = snap.data() as any;
  return (data?.address ?? null) as UserAddress | null;
}

export async function saveUserAddress(uid: string, address: UserAddress): Promise<void> {
  await setDoc(
    doc(db, "addresses", uid),
    {
      address,
      addressUpdatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export type BrasilApiCepResponse = {
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
};

export async function fetchAddressByCepV2(cepDigits: string, signal?: AbortSignal): Promise<BrasilApiCepResponse> {
  const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cepDigits}`, { signal });
  if (!res.ok) {
    throw new Error(`CEP inválido (${res.status})`);
  }
  return (await res.json()) as BrasilApiCepResponse;
}

