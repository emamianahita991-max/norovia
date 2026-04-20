import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const HELPS = [
  "Better days follow good sleep.",
  "Higher fluid days appear linked to lower symptom scores.",
  "Gentle, paced movement seems to help when done consistently.",
];

const WORSENS = [
  "Symptoms worsen with low fluids.",
  "Short or broken sleep is linked to worse fatigue and brain fog.",
  "Skipping compression on high-dizziness days tends to make things harder.",
];

export default function TrendsScreen() {
  const insets = useSafeAreaInsets();

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
      <Text style={styles.heading}>Trends</Text>

      <Text style={styles.subtitle}>Based on your last few days:</Text>

      <View style={styles.notice}>
        <Text style={styles.noticeText}>
          You're building useful data. Keep logging so the app can learn your pattern.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>What seems to help</Text>
        {HELPS.map((item, i) => (
          <View key={i} style={styles.row}>
            <View style={[styles.dot, styles.dotGood]} />
            <Text style={styles.rowText}>{item}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>What seems to worsen symptoms</Text>
        {WORSENS.map((item, i) => (
          <View key={i} style={styles.row}>
            <View style={[styles.dot, styles.dotBad]} />
            <Text style={styles.rowText}>{item}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#f7f6f3" },
  container: { paddingHorizontal: 20, gap: 16 },
  heading: { fontSize: 28, fontWeight: "700", color: "#111", marginBottom: 4 },

  subtitle: {
    fontSize: 15,
    color: "#777",
    marginTop: -4,
  },
  notice: {
    backgroundColor: "#eef4f4",
    borderRadius: 12,
    padding: 16,
  },
  noticeText: {
    fontSize: 14,
    color: "#3a6a6b",
    lineHeight: 22,
    fontStyle: "italic",
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

  row: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 7,
    flexShrink: 0,
  },
  dotGood: { backgroundColor: "#4a7c7e" },
  dotBad: { backgroundColor: "#b03a3a" },
  rowText: { fontSize: 14, color: "#444", lineHeight: 22, flex: 1 },
});
