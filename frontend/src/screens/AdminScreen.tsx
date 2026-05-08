import React, { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { getWorkers } from "../api/client";

const API_BASE_URL = "http://192.168.1.37:8000";

type Props = NativeStackScreenProps<RootStackParamList, "Admin">;

type RecordItem = {
  id: string;
  email: string;
  type: string;
  timestamp: string;
};

type Summary = {
  total_records: number;
  active_workers: number;
  worker_hours: number;
  last_record: RecordItem | null;
};

type WorkerItem = {
  email: string;
  hours: number;
  last_record: RecordItem | null;
};

export default function AdminScreen({ navigation }: Props) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [workers, setWorkers] = useState<WorkerItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdmin();
  }, []);

  async function loadAdmin() {
    try {
      const summaryResponse = await fetch(`${API_BASE_URL}/admin/summary`);
      const summaryData = await summaryResponse.json();

      const workersData = await getWorkers();

      setSummary(summaryData);
      setWorkers(workersData.workers || []);
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "No se pudo cargar el panel admin");
    } finally {
      setLoading(false);
    }
  }

  async function openCsvExport() {
    const url = `${API_BASE_URL}/admin/export.csv`;

    try {
      await Linking.openURL(url);
    } catch (error) {
      console.log(error);
      Alert.alert("CSV", "No se pudo abrir el CSV");
    }
  }

  function formatRecordType(type?: string) {
    if (type === "in") return "ENTRADA";
    if (type === "out") return "SALIDA";
    return "Sin fichajes";
  }

  function formatDate(timestamp?: string) {
    if (!timestamp) return "Sin fecha";
    return new Date(timestamp).toLocaleString();
  }

  async function logout() {
    await AsyncStorage.removeItem("user_email");
    await AsyncStorage.removeItem("user_role");
    navigation.replace("Login");
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#B07A4F" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin</Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          <View style={styles.statCard}>
            <Text style={styles.label}>Registros</Text>
            <Text style={styles.value}>{summary?.total_records ?? 0}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.label}>Trabajadores</Text>
            <Text style={styles.value}>{summary?.active_workers ?? 0}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.label}>Horas totales</Text>
            <Text style={styles.value}>{summary?.worker_hours ?? 0} h</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.exportButton} onPress={openCsvExport}>
          <Text style={styles.exportButtonText}>Exportar CSV</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Trabajadores</Text>

        <FlatList
          data={workers}
          keyExtractor={(item) => item.email}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.workerCard}>
              <Text style={styles.email}>{item.email}</Text>

              <Text style={styles.hours}>{item.hours} h acumuladas</Text>

              <Text style={styles.type}>
                Último fichaje: {formatRecordType(item.last_record?.type)}
              </Text>

              <Text style={styles.date}>
                {formatDate(item.last_record?.timestamp)}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No hay trabajadores con fichajes todavía</Text>
          }
        />
      </ScrollView>

      <TouchableOpacity
        style={styles.button}
        onPress={logout}
      >
        <Text style={styles.buttonText}>Volver al login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: "#0A0A0A",
    justifyContent: "center",
    alignItems: "center",
  },

  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
    padding: 24,
    paddingTop: 60,
  },

  title: {
    color: "#F3F0EA",
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 24,
  },

  grid: {
    gap: 12,
    marginBottom: 16,
  },

  statCard: {
    backgroundColor: "#111315",
    borderColor: "#B07A4F",
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },

  label: {
    color: "#B07A4F",
    fontSize: 12,
    marginBottom: 8,
  },

  value: {
    color: "#F3F0EA",
    fontSize: 24,
    fontWeight: "700",
  },

  exportButton: {
    backgroundColor: "#F3F0EA",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 24,
  },

  exportButtonText: {
    color: "#0A0A0A",
    fontWeight: "700",
  },

  sectionTitle: {
    color: "#F3F0EA",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },

  workerCard: {
    backgroundColor: "#111315",
    borderColor: "#B07A4F",
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },

  email: {
    color: "#F3F0EA",
    fontWeight: "700",
    marginBottom: 8,
  },

  hours: {
    color: "#7ED957",
    fontWeight: "700",
    marginBottom: 8,
  },

  type: {
    color: "#B07A4F",
    marginBottom: 6,
  },

  date: {
    color: "#F3F0EA",
    opacity: 0.8,
  },

  empty: {
    color: "#F3F0EA",
    opacity: 0.7,
    textAlign: "center",
    marginTop: 24,
  },

  button: {
    backgroundColor: "#B07A4F",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 16,
  },

  buttonText: {
    color: "#0A0A0A",
    fontWeight: "700",
  },
});
