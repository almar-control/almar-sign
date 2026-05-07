import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Admin">;

export default function AdminScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin</Text>
      <Text style={styles.item}>Empleados: pendiente</Text>
      <Text style={styles.item}>Registros: pendiente</Text>
      <Text style={styles.item}>Radio GPS: pendiente</Text>

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.link}>Salir</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A", justifyContent: "center", padding: 24 },
  title: { color: "#F3F0EA", fontSize: 32, fontWeight: "700", marginBottom: 24 },
  item: { color: "#F3F0EA", opacity: 0.8, marginBottom: 12 },
  link: { color: "#B07A4F", fontWeight: "700", marginTop: 24 },
});
