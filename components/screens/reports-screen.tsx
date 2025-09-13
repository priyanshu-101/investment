import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
} from "react-native";
import { Header } from "../header";

export function ReportsScreen() {
  const [selectedTab, setSelectedTab] = useState("Dashboard");
  const [selectedTest, setSelectedTest] = useState("Live");

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Header />
        <View style={styles.container}>
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, selectedTab === "Dashboard" && styles.activeTab]}
              onPress={() => setSelectedTab("Dashboard")}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === "Dashboard" && styles.activeTabText,
                ]}
              >
                Dashboard
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, selectedTab === "Logs" && styles.activeTab]}
              onPress={() => setSelectedTab("Logs")}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === "Logs" && styles.activeTabText,
                ]}
              >
                Trade Engine Logs
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dateRow}>
            <View style={styles.dateBox}>
              <Text style={styles.dateLabel}>From</Text>
              <TextInput
                style={styles.dateInput}
                value="09/13/2024"
                editable={false}
              />
            </View>
            <View style={styles.dateBox}>
              <Text style={styles.dateLabel}>To</Text>
              <TextInput
                style={styles.dateInput}
                value="09/13/2025"
                editable={false}
              />
            </View>
          </View>
          <View style={styles.segmentedContainer}>
            <TouchableOpacity
              style={[
                styles.segment,
                selectedTest === "Live" && styles.segmentActive,
              ]}
              onPress={() => setSelectedTest("Live")}
            >
              <Text
                style={[
                  styles.segmentText,
                  selectedTest === "Live" && styles.segmentActiveText,
                ]}
              >
                Live
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segment,
                selectedTest === "Forward Test" && styles.segmentActive,
              ]}
              onPress={() => setSelectedTest("Forward Test")}
            >
              <Text
                style={[
                  styles.segmentText,
                  selectedTest === "Forward Test" && styles.segmentActiveText,
                ]}
              >
                Forward Test
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.reportButton}>
            <Text style={styles.reportButtonText}>Get Reports ⬇️</Text>
          </TouchableOpacity>

          <View style={styles.emptyState}>
            <Image
              source={require("@/assets/images/backtest.png")}
              style={styles.emptyImage}
              resizeMode="contain"
            />
            <Text style={styles.emptyText}>
              No user reports found for the selected dates!
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16, 
  },
  tabs: {
    flexDirection: "row",
    marginBottom: 20, 
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    marginRight: 16,
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: "#f0f0ff",
    borderBottomColor: "#4a4aff",
  },
  tabText: {
    fontSize: 16,
    color: "#444",
  },
  activeTabText: {
    fontWeight: "bold",
    color: "#222",
  },
  dateRow: {
    flexDirection: "row",
    marginBottom: 20,
    justifyContent: "space-between",
  },
  dateBox: {
    flex: 1,
    marginHorizontal: 5,
  },
  dateLabel: {
    fontSize: 14,
    color: "#444",
    marginBottom: 6,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  segmentedContainer: {
    flexDirection: "row",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 20,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  segmentActive: {
    backgroundColor: "#f0f0ff",
  },
  segmentText: {
    color: "#444",
    fontSize: 14,
  },
  segmentActiveText: {
    fontWeight: "bold",
    color: "#222",
  },
  reportButton: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  reportButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#222",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 30, 
  },
  emptyImage: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
