import React, { useEffect, useState } from "react";

import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import type {
  NativeStackScreenProps,
} from "@react-navigation/native-stack";

import type {
  RootStackParamList,
} from "../navigation/AppNavigator";

import { getRecords } from "../api/client";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "History"
>;

type RecordItem = {
  id: string;
  type: string;
  timestamp: string;
  status: string;
};

export default function HistoryScreen({
  navigation,
}: Props) {
  const [records, setRecords] =
    useState<RecordItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    loadRecords();
  }, []);

  async function loadRecords() {
    try {
      const data = await getRecords();

      setRecords(data.records || []);
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
      <Text style={styles.title}>
        Historial
      </Text>

      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.type}>
              {item.type === "in"
                ? "ENTRADA"
                : "SALIDA"}
            </Text>

            <Text style={styles.date}>
              {new Date(
                item.timestamp
              ).toLocaleString()}
            </Text>

            <Text style={styles.status}>
              {item.status}
            </Text>
          </View>
        )}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          navigation.goBack()
        }
      >
        <Text style={styles.buttonText}>
          Volver
        </Text>
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

  card: {
    backgroundColor: "#111315",
    borderColor: "#B07A4F",
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },

  type: {
    color: "#B07A4F",
    fontWeight: "700",
    marginBottom: 6,
  },

  date: {
    color: "#F3F0EA",
    marginBottom: 6,
  },

  status: {
    color: "#7ED957",
  },

  button: {
    backgroundColor: "#B07A4F",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 24,
  },

  buttonText: {
    color: "#0A0A0A",
    fontWeight: "700",
  },
});
