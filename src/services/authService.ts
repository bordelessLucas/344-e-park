import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    type User
} from "firebase/auth";
import { auth } from "../lib/firebase";

export const login = async (email: string, password: string): Promise<User> => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        console.error("Erro no login:", error);
        throw error;
    }
};

export const register = async (
    email: string,
    password: string,
    displayName?: string
): Promise<User> => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName) {
            await updateProfile(userCredential.user, { displayName });
        }
        return userCredential.user;
    } catch (error) {
        console.error("Erro no registro:", error);
        throw error;
    }
};

export const logout = async (): Promise<void> => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Erro no logout:", error);
        throw error;
    }
};

export const onAuthChange = (callback: (user: User | null) => void) => {
    
    return onAuthStateChanged(auth, callback);
};
