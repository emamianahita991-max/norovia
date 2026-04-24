import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDaily } from "@/context/DailyContext";

const BULLETS = [
  "Sit or lie down when possible.",
  "Prioritize fluids and salt early.",
  "Avoid prolonged standing and heat.",
  "Delay non-essential tasks if you can.",
];

export default function FlareScreen() {
  const insets = useSafeAreaInsets();
  const { isFlareActive, setFlareActive } = useDaily();

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
        <Text style={styles.heading}>Flare Mode</Text>
        <Text style={styles.subheading}>
          {isFlareActive ? "Active" : "Inactive"}
        </Text>
      </View>

      {isFlareActive && (
        <View style={styles.activeBanner}>
          <Text style={styles.activeBannerTitle}>Flare Mode Active</Text>
          <Text style={styles.activeBannerText}>
            This is a stabilization day. Keep things simple.
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.mainBtn, isFlareActive && styles.mainBtnActive]}
        onPress={() => setFlareActive(!isFlareActive)}
        activeOpacity={0.8}
      >
        <Text style={styles.mainBtnText}>
          {isFlareActive ? "Turn off Flare Mode" : "Turn on Flare Mode"}
        </Text>
      </TouchableOpacity>

      {isFlareActive && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Focus on this today</Text>
          {BULLETS.map((b) => (
            <View key={b} style={styles.bullet}>
              <Text style={styles.bulletDot}>·</Text>
              <Text style={styles.bulletText}>{b}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.safety}>
        <Text style={styles.safetyTitle}>When to seek urgent care</Text>
        <Text style={styles.safetyText}>
          If you have chest pain, severe shortness of breath, fainting with injury, or you cannot keep fluids down, contact emergency services or call 911 right away.
        </Text>
        <Text style={styles.safetyText}>
          If symptoms feel severe, unusual, or concerning, contact emergency services or call 911.
        </Text>
        <Text style={styles.disclaimer}>
          Norovia is a lifestyle support tool. It is not emergency care and does not diagnose POTS or replace medical care.
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
  heading: { fontSize: 28, fontWeight: "700", color: "#111", marginBottom: 0 },
  subheading: { fontSize: 14, color: "#9AA6A2", marginTop: 4 },

  activeBanner: {
    backgroundColor: "#fdf0f0",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e8c4c4",
    padding: 18,
    gap: 6,
  },
  activeBannerTitle: { fontSize: 15, fontWeight: "700", color: "#8a3a3a", letterSpacing: 0.2 },
  activeBannerText: { fontSize: 14, color: "#7a4040", lineHeight: 22 },

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
  sectionTitle: { fontSize: 15, fontWeight: "600", color: "#111" },
  bullet: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  bulletDot: { fontSize: 18, color: "#4a7c7e", lineHeight: 24 },
  bulletText: { fontSize: 15, color: "#333", lineHeight: 24, flex: 1 },

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
