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
  "Sit or lie down whenever you can",
  "Start fluids and salt early in the day",
  "Avoid prolonged standing",
];

export default function FlareScreen() {
  const insets = useSafeAreaInsets();
  const { isFlareActive, setFlareActive } = useDaily();

  const emergencyBlock = (
    <View style={styles.safety}>
      <Text style={styles.safetyTitle}>When to seek urgent care</Text>
      <Text style={styles.safetyText}>
        If you have chest pain, severe shortness of breath, fainting with
        injury, or cannot keep fluids down, call 911 right away.
      </Text>
      <Text style={styles.safetyText}>
        If something feels seriously wrong, call 911.
      </Text>
      <Text style={styles.disclaimer}>
        Norovia is a lifestyle support tool. It does not provide medical care.
      </Text>
    </View>
  );

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

      {isFlareActive ? (
        <>
          <View style={styles.activeBanner}>
            <Text style={styles.activeBannerTitle}>Flare Mode Active</Text>
            <Text style={styles.activeBannerText}>
              Today is a stabilization day.
            </Text>
            <Text style={styles.activeBannerText}>
              Your priority is staying stable.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Focus on this today</Text>
            {BULLETS.map((b, i) => (
              <View key={i} style={styles.bullet}>
                <Text style={styles.bulletDot}>·</Text>
                <Text style={styles.bulletText}>{b}</Text>
              </View>
            ))}
            <Text style={styles.pacing}>Stop early if symptoms rise.</Text>
            <Text style={styles.permission}>
              Doing less today is the right move.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.toggleBtnOn}
            onPress={() => setFlareActive(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.toggleBtnText}>Turn off Flare Mode</Text>
          </TouchableOpacity>

          {emergencyBlock}
        </>
      ) : (
        <>
          <TouchableOpacity
            style={styles.toggleBtnOff}
            onPress={() => setFlareActive(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.toggleBtnText}>Turn on Flare Mode</Text>
          </TouchableOpacity>

          {emergencyBlock}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#f7f6f3" },
  container: { paddingHorizontal: 20, gap: 16 },
  pageHeader: { marginBottom: 0 },
  appName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4a7c7e",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
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
  activeBannerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#8a3a3a",
    letterSpacing: 0.2,
  },
  activeBannerText: { fontSize: 14, color: "#7a4040", lineHeight: 22 },

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

  pacing: {
    fontSize: 13,
    color: "#888",
    fontStyle: "italic",
    marginTop: 10,
  },
  permission: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },

  toggleBtnOff: {
    backgroundColor: "#2c2c2c",
    borderRadius: 16,
    paddingVertical: 22,
    alignItems: "center",
  },
  toggleBtnOn: {
    backgroundColor: "#b03a3a",
    borderRadius: 16,
    paddingVertical: 22,
    alignItems: "center",
  },
  toggleBtnText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.2,
  },

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
