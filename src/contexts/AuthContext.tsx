import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { User as FirebaseUser } from "firebase/auth";
import { login, register, logout, onAuthChange} from "../services/authService";

export interface AuthContextType {
    user: FirebaseUser | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, displayName?: string) => Promise<void>;
    logout: () => Promise<void>;
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
        displayName?: string
    ): Promise<void> => {
        try {
            await register(email, password, displayName);
        } catch (error) {
            console.error("Erro no registro:", error);
            throw error;
        }
    };

    const handleLogout = async (): Promise<void> => {
        try {
            await logout();
        } catch (error){
            console.error("Erro no logout:", error);
            throw error;
        }
    };

    const value: AuthContextType = {
        user,
        loading,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
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