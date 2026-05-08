import { useState } from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { login } from "../api/client";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState("worker@almar.com");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    try {
      setLoading(true);
      setError("");

      const data = await login(email.trim(), password);

      if (data.role === "admin") {
        navigation.replace("Admin");
        return;
      }

      navigation.replace("WorkerHome", {
        email: data.email,
        role: data.role,
      });
    } catch {
      setError("Email o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Acceso</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#8F8A82"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor="#8F8A82"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#0A0A0A" />
        ) : (
          <Text style={styles.buttonText}>Entrar</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.hint}>Demo: worker@almar.com / 123456</Text>
      <Text style={styles.hint}>Admin: admin@almar.com / 123456</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    color: "#F3F0EA",
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 32,
  },
  input: {
    backgroundColor: "#111315",
    borderColor: "#B07A4F",
    borderWidth: 1,
    borderRadius: 14,
    color: "#F3F0EA",
    padding: 16,
    marginBottom: 16,
  },
  error: {
    color: "#B84C4C",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#B07A4F",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#0A0A0A",
    fontWeight: "700",
  },
  hint: {
    color: "#F3F0EA",
    opacity: 0.5,
    marginTop: 16,
    fontSize: 12,
  },
});

