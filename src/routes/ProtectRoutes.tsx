import React, { type ReactNode } from "react";
import { useNavigation } from "@react-navigation/native";
import { paths } from "./paths";
import { useAuth } from "../hooks/useAuth";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";

interface ProtectRoutesProps {
  children: ReactNode;
}

export const ProtectedRoutes = ({ children }: ProtectRoutesProps) => {
  const { user, loading } = useAuth();
  const navigation = useNavigation<any>();

  React.useEffect(() => {
    if (!loading && !user) {
      navigation.replace(paths.login);
    }
  }, [user, loading, navigation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
  },
});
