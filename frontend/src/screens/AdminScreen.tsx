import React, { useEffect, useState } from "react";

import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";

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

export default function AdminScreen({ navigation }: Props) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdmin();
  }, []);

  async function loadAdmin() {
    try {
      const summaryResponse = await fetch(`${API_BASE_URL}/admin/summary`);
      const recordsResponse = await fetch(`${API_BASE_URL}/admin/records`);

      const summaryData = await summaryResponse.json();
      const recordsData = await recordsResponse.json();

      setSummary(summaryData);
      setRecords(recordsData.records || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
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
          <Text style={styles.label}>Horas worker</Text>
          <Text style={styles.value}>{summary?.worker_hours ?? 0} h</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Últimos registros</Text>

      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.recordCard}>
            <Text style={styles.email}>{item.email}</Text>
            <Text style={styles.type}>{item.type === "in" ? "ENTRADA" : "SALIDA"}</Text>
            <Text style={styles.date}>{new Date(item.timestamp).toLocaleString()}</Text>
          </View>
        )}
      />

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("WorkerHome")}>
        <Text style={styles.buttonText}>Volver</Text>
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
    marginBottom: 24,
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

  sectionTitle: {
    color: "#F3F0EA",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },

  recordCard: {
    backgroundColor: "#111315",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },

  email: {
    color: "#F3F0EA",
    fontWeight: "700",
    marginBottom: 6,
  },

  type: {
    color: "#B07A4F",
    marginBottom: 6,
  },

  date: {
    color: "#F3F0EA",
    opacity: 0.8,
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
