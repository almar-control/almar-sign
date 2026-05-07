import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "History">;

export default function HistoryScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historial</Text>
      <Text style={styles.empty}>Sin registros todavía</Text>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.link}>Volver</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A", justifyContent: "center", padding: 24 },
  title: { color: "#F3F0EA", fontSize: 32, fontWeight: "700", marginBottom: 16 },
  empty: { color: "#F3F0EA", opacity: 0.8, marginBottom: 32 },
  link: { color: "#B07A4F", fontWeight: "700" },
});
