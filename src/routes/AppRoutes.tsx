import React from "react";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator, NativeStackNavigationProp } from "@react-navigation/native-stack";
import { paths } from "./paths";
import { RootStackParamList } from "./types";
import { ProtectedRoutes } from "./ProtectRoutes";
import { Login, Register } from "../pages";
import { View, Text, StyleSheet } from "react-native";

const Stack = createNativeStackNavigator<RootStackParamList>();

const Menu = () => (
  <View style={styles.menuContainer}>
    <Text style={styles.menuText}>Menu</Text>
  </View>
);

const ProtectedMenu = () => (
  <ProtectedRoutes>
    <Menu />
  </ProtectedRoutes>
);

const RegisterWrapper = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const handleLogin = () => {
    navigation.replace(paths.menu);
  };

  const handleGoToLogin = () => {
    navigation.navigate(paths.login);
  };

  return <Register onLogin={handleLogin} onGoToLogin={handleGoToLogin} />;
};

export const AppRoutes = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={paths.home}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name={paths.home} component={Login} />
        <Stack.Screen name={paths.login} component={Login} />
        <Stack.Screen name={paths.register} component={RegisterWrapper} />
        <Stack.Screen name={paths.menu} component={ProtectedMenu} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  menuContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  menuText: {
    fontSize: 24,
    fontWeight: "bold",
  },
});
