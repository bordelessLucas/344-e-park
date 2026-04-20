import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile, reload } from "firebase/auth";
import { auth, storage } from "../lib/firebase";

/**
 * Envia a imagem para Firebase Storage, atualiza photoURL no Auth e recarrega o usuário.
 * Requer regras no Storage permitindo escrita em `avatars/{uid}.jpg` para usuários autenticados.
 */
export async function uploadProfilePhotoFromUri(localUri: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  const response = await fetch(localUri);
  const blob = await response.blob();
  const objectRef = ref(storage, `avatars/${user.uid}.jpg`);

  await uploadBytes(objectRef, blob, {
    contentType: blob.type && blob.type.startsWith("image/") ? blob.type : "image/jpeg",
  });

  const downloadUrl = await getDownloadURL(objectRef);
  await updateProfile(user, { photoURL: downloadUrl });
  await reload(user);
}
