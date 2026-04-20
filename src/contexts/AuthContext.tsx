import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { User as FirebaseUser } from "firebase/auth";
import {
    login,
    register,
    logout,
    onAuthChange,
    sendPasswordReset,
    changePasswordWithReauth,
} from "../services/authService";
import { auth } from "../lib/firebase";
import { uploadProfilePhotoFromUri } from "../services/profilePhotoService";
import { saveUserProfile } from "../services/userProfileService";

export interface AuthContextType {
    user: FirebaseUser | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (
        email: string,
        password: string,
        displayName?: string,
        cpfDigits?: string
    ) => Promise<void>;
    sendPasswordReset: (email: string) => Promise<void>;
    changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
    logout: () => Promise<void>;
    updateProfilePhoto: (localUri: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: {children: ReactNode}) => {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const unsubscribe = onAuthChange((user) => {
            setUser(user);
            setLoading(false);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const handleLogin = async (email: string, password: string): Promise<void> => {
        try {
            await login(email, password);

        } catch (error) {
            console.error("Erro no login:", error);
            throw error;
        }
    };

    const handleRegister = async (
        email: string,
        password: string,
        displayName?: string,
        cpfDigits?: string
    ): Promise<void> => {
        try {
            await register(email, password, displayName);
            const u = auth.currentUser;
            if (u && cpfDigits && cpfDigits.length === 11) {
                await saveUserProfile(u.uid, {
                    cpfDigits,
                    displayName,
                    email: u.email ?? email,
                });
            }
        } catch (error) {
            console.error("Erro no registro:", error);
            throw error;
        }
    };

    const handleSendPasswordReset = async (email: string): Promise<void> => {
        await sendPasswordReset(email);
    };

    const handleChangePassword = async (
        currentPassword: string,
        newPassword: string
    ): Promise<void> => {
        await changePasswordWithReauth(currentPassword, newPassword);
    };

    const handleLogout = async (): Promise<void> => {
        try {
            await logout();
        } catch (error){
            console.error("Erro no logout:", error);
            throw error;
        }
    };

    const updateProfilePhoto = async (localUri: string): Promise<void> => {
        await uploadProfilePhotoFromUri(localUri);
        if (auth.currentUser) {
            setUser(auth.currentUser);
        }
    };

    const value: AuthContextType = {
        user,
        loading,
        login: handleLogin,
        register: handleRegister,
        sendPasswordReset: handleSendPasswordReset,
        changePassword: handleChangePassword,
        logout: handleLogout,
        updateProfilePhoto,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = (): AuthContextType => {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error("useAuth deve ser usado dentro de um AuthProvider");
    }

    return context;
};