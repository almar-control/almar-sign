import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("WorkerHome")}>
        <Text style={styles.buttonText}>Entrar como trabajador</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate("Admin")}>
        <Text style={styles.secondaryText}>Entrar como admin</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A", justifyContent: "center", padding: 24 },
  title: { color: "#F3F0EA", fontSize: 32, fontWeight: "700", marginBottom: 32 },
  button: { backgroundColor: "#B07A4F", padding: 16, borderRadius: 14, alignItems: "center", marginBottom: 16 },
  buttonText: { color: "#0A0A0A", fontWeight: "700" },
  secondaryButton: { borderColor: "#B07A4F", borderWidth: 1, padding: 16, borderRadius: 14, alignItems: "center" },
  secondaryText: { color: "#B07A4F", fontWeight: "700" },
});
