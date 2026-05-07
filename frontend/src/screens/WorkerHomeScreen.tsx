import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "WorkerHome">;

export default function WorkerHomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trabajador</Text>
      <Text style={styles.status}>Estado: pendiente de GPS</Text>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Fichar entrada</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton}>
        <Text style={styles.secondaryText}>Fichar salida</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("History")}>
        <Text style={styles.link}>Ver historial</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A", justifyContent: "center", padding: 24 },
  title: { color: "#F3F0EA", fontSize: 32, fontWeight: "700", marginBottom: 16 },
  status: { color: "#F3F0EA", opacity: 0.8, marginBottom: 32 },
  button: { backgroundColor: "#B07A4F", padding: 18, borderRadius: 14, alignItems: "center", marginBottom: 16 },
  buttonText: { color: "#0A0A0A", fontWeight: "700" },
  secondaryButton: { borderColor: "#B07A4F", borderWidth: 1, padding: 18, borderRadius: 14, alignItems: "center", marginBottom: 24 },
  secondaryText: { color: "#B07A4F", fontWeight: "700" },
  link: { color: "#F3F0EA", textAlign: "center", opacity: 0.9 },
});
