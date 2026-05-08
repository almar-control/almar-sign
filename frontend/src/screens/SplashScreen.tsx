import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Splash">;

export default function SplashScreen({ navigation }: Props) {
  const [checking, setChecking] = useState(true);
  const [savedEmail, setSavedEmail] = useState<string | null>(null);
  const [savedRole, setSavedRole] = useState<string | null>(null);

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      const email = await AsyncStorage.getItem("user_email");
      const role = await AsyncStorage.getItem("user_role");

      setSavedEmail(email);
      setSavedRole(role);
    } catch (error) {
      console.log(error);
    } finally {
      setChecking(false);
    }
  }

  function continueSession() {
    if (savedRole === "admin") {
      navigation.replace("Admin");
      return;
    }

    navigation.replace("WorkerHome", {
      email: savedEmail || "worker@almar.com",
      role: savedRole || "worker",
    });
  }

  async function changeUser() {
    await AsyncStorage.removeItem("user_email");
    await AsyncStorage.removeItem("user_role");
    navigation.replace("Login");
  }

  if (checking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#B07A4F" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/logo_negro.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.text}>Sistema de control horario</Text>

      {savedEmail ? (
        <>
          <Text style={styles.sessionText}>Sesión guardada</Text>
          <Text style={styles.email}>{savedEmail}</Text>

          <TouchableOpacity style={styles.button} onPress={continueSession}>
            <Text style={styles.buttonText}>Continuar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={changeUser}>
            <Text style={styles.secondaryButtonText}>Cambiar usuario</Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.replace("Login")}
        >
          <Text style={styles.buttonText}>Entrar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  logo: {
    width: 320,
    height: 220,
    marginBottom: 32,
  },
  text: {
    color: "#F3F0EA",
    fontSize: 16,
    marginBottom: 24,
  },
  sessionText: {
    color: "#B07A4F",
    fontSize: 13,
    marginBottom: 6,
  },
  email: {
    color: "#F3F0EA",
    fontSize: 14,
    marginBottom: 28,
  },
  button: {
    backgroundColor: "#B07A4F",
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 14,
    minWidth: 220,
    alignItems: "center",
    marginBottom: 14,
  },
  buttonText: {
    color: "#0A0A0A",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    borderColor: "#B07A4F",
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 14,
    minWidth: 220,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#B07A4F",
    fontSize: 16,
    fontWeight: "700",
  },
});
