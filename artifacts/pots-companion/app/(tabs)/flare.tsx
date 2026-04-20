import { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const STEPS = [
  { number: "1", text: "Sit or lie down right away." },
  { number: "2", text: "Hydrate — sip fluids if you can safely tolerate them." },
  { number: "3", text: "Avoid standing, heat, and rushing." },
  { number: "4", text: "Use compression if that usually helps you." },
];

export default function FlareScreen() {
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState(false);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.container,
        {
          paddingBottom: insets.bottom + 24,
          paddingTop: Platform.OS === "web" ? 67 : 16,
        },
      ]}
    >
      <View style={styles.pageHeader}>
        <Text style={styles.appName}>Norovia</Text>
        <Text style={styles.companion}>Stay with your body.</Text>
        <Text style={styles.heading}>Flare</Text>
      </View>

      <TouchableOpacity
        style={[styles.mainBtn, active && styles.mainBtnActive]}
        onPress={() => setActive((v) => !v)}
        activeOpacity={0.8}
      >
        <Text style={styles.mainBtnText}>
          {active ? "Flare mode is on" : "I feel bad right now"}
        </Text>
      </TouchableOpacity>

      {active && (
        <>
          <View style={styles.card}>
            <Text style={styles.empathy}>
              You're not doing anything wrong. Your system just needs support.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>What to do now</Text>
            {STEPS.map((s) => (
              <View key={s.number} style={styles.step}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepNumber}>{s.number}</Text>
                </View>
                <Text style={styles.stepText}>{s.text}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      <View style={styles.safety}>
        <Text style={styles.safetyTitle}>When to seek urgent care</Text>
        <Text style={styles.safetyText}>
          If you have chest pain, severe shortness of breath, loss of consciousness with injury, or cannot keep fluids down — seek emergency medical care immediately.
        </Text>
        <Text style={styles.disclaimer}>
          Norovia is a lifestyle support tool. It is not emergency care and does not diagnose POTS or any other condition.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#f7f6f3" },
  container: { paddingHorizontal: 20, gap: 16 },
  pageHeader: { marginBottom: 0 },
  appName: { fontSize: 12, fontWeight: "600", color: "#4a7c7e", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 },
  companion: { fontSize: 13, color: "#9AA6A2", lineHeight: 20, marginBottom: 10 },
  heading: { fontSize: 28, fontWeight: "700", color: "#111", marginBottom: 0 },

  mainBtn: {
    backgroundColor: "#2c2c2c",
    borderRadius: 16,
    paddingVertical: 22,
    alignItems: "center",
  },
  mainBtnActive: {
    backgroundColor: "#b03a3a",
  },
  mainBtnText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.2,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  empathy: {
    fontSize: 16,
    color: "#3a6a6b",
    lineHeight: 26,
    fontStyle: "italic",
    textAlign: "center",
  },
  sectionTitle: { fontSize: 15, fontWeight: "600", color: "#111" },

  step: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  stepBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#eef4f4",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  stepNumber: { fontSize: 14, fontWeight: "700", color: "#4a7c7e" },
  stepText: { fontSize: 15, color: "#333", lineHeight: 24, flex: 1 },

  safety: {
    backgroundColor: "#fff5f5",
    borderRadius: 14,
    padding: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: "#f0d0d0",
  },
  safetyTitle: { fontSize: 14, fontWeight: "700", color: "#b03a3a" },
  safetyText: { fontSize: 14, color: "#7a3030", lineHeight: 22 },
  disclaimer: { fontSize: 12, color: "#aaa", lineHeight: 18, marginTop: 4 },
});
