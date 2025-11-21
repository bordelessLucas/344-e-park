import { useContext } from "react";
import { AuthContext, type AuthContextType } from "../contexts/AuthContext";

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (ctx === undefined) {
        throw new Error("useAuth deve ser usado dentro de um AuthProvider");
    }
    return ctx;
}
