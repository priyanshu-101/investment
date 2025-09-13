// App.js
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Defs, LinearGradient, Stop } from "react-native-svg";
import { Area, CartesianChart } from "victory-native";

export function StrategyTemplate() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Strategy Templates</Text>
        <Text style={styles.viewAll}>View All</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Advanced Delta Neutr...</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Max DD <Text style={{ color: "red" }}>0.00</Text>
            </Text>
            <Text style={styles.infoText}>
              Margin <Text style={{ color: "green" }}>₹0.00</Text>
            </Text>
          </View>
        </View>

        <CartesianChart 
          data={[
            { x: "Apr", y: 5000 },
            { x: "2023", y: 20000 },
            { x: "2023-Mid", y: 25000 },
            { x: "Late-2023", y: 40000 },
            { x: "2024", y: 60000 },
          ]}
          xKey="x"
          yKeys={["y"]}
        >
          {({ points }) => (
            <>
              <Area
                points={points.y}
                y0={0}
                color="#4A90E2"
                opacity={0.4}
              />
              <Defs>
                <LinearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor="#4A90E2" stopOpacity={0.4} />
                  <Stop offset="100%" stopColor="#4A90E2" stopOpacity={0.05} />
                </LinearGradient>
              </Defs>
            </>
          )}
        </CartesianChart>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Add to my strategy</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 15,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  viewAll: {
    fontSize: 14,
    color: "#4A90E2",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  infoBox: {
    alignItems: "flex-end",
  },
  infoText: {
    fontSize: 12,
    color: "#777",
  },
  button: {
    backgroundColor: "#EAF1FF",
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    textAlign: "center",
    color: "#4A90E2",
    fontWeight: "600",
  },
});
