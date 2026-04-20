import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";
import { useRouter } from "expo-router";
import { useDaily } from "@/context/DailyContext";

const PLAN = [
  "Aim for steady fluids throughout the day.",
  "Use compression if upright symptoms are active.",
  "Keep movement gentle and paced today.",
];

const INSIGHT = "You seem to do better on days when fluids are stronger.";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { sleepLoggedToday, checkInCompletedToday } = useDaily();

  function renderCTA() {
    if (!sleepLoggedToday) {
      return (
        <View style={styles.ctaWrap}>
          <TouchableOpacity
            style={styles.checkInBtn}
            onPress={() => router.navigate("/sleep")}
            activeOpacity={0.8}
          >
            <Text style={styles.checkInBtnText}>Log last night's sleep</Text>
          </TouchableOpacity>
          <Text style={styles.ctaHint}>Takes 20 seconds</Text>
        </View>
      );
    }

    if (!checkInCompletedToday) {
      return (
        <TouchableOpacity
          style={styles.checkInBtn}
          onPress={() => router.navigate("/track")}
          activeOpacity={0.8}
        >
          <Text style={styles.checkInBtnText}>Complete today's check-in</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.ctaWrap}>
        <View style={styles.doneCard}>
          <Text style={styles.doneBtnText}>Today's check-in complete ✓</Text>
        </View>
        <Text style={styles.ctaHint}>You can update it anytime.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.container,
        { paddingBottom: insets.bottom + 24, paddingTop: Platform.OS === "web" ? 67 : 16 },
      ]}
    >
      <Text style={styles.appName}>Norovia</Text>
      <Text style={styles.tagline}>You don't have to figure this out all at once.</Text>
      <Text style={styles.heading}>Today</Text>

      {renderCTA()}

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Average symptom score</Text>
        <Text style={styles.cardValue}>—</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Sleep last night</Text>
        <Text style={styles.cardValue}>— h</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daily plan</Text>
        {PLAN.map((item, i) => (
          <View key={i} style={styles.bullet}>
            <Text style={styles.bulletDot}>·</Text>
            <Text style={styles.bulletText}>{item}</Text>
          </View>
        ))}
      </View>

      <View style={styles.insight}>
        <Text style={styles.insightText}>{INSIGHT}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: "#f7f6f3",
  },
  container: {
    paddingHorizontal: 20,
    gap: 16,
  },
  appName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4a7c7e",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: -8,
  },
  tagline: {
    fontSize: 14,
    color: "#888",
    fontStyle: "italic",
    marginBottom: -4,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111",
    marginBottom: 4,
  },
  ctaWrap: {
    gap: 8,
  },
  checkInBtn: {
    backgroundColor: "#2c2c2c",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  checkInBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  ctaHint: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
    fontStyle: "italic",
  },
  doneCard: {
    backgroundColor: "#eef4f4",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d0e4e4",
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4a7c7e",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  cardLabel: {
    fontSize: 15,
    color: "#555",
  },
  cardValue: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111",
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
    marginBottom: 4,
  },
  bullet: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  bulletDot: {
    fontSize: 18,
    color: "#4a7c7e",
    lineHeight: 22,
  },
  bulletText: {
    fontSize: 14,
    color: "#444",
    lineHeight: 22,
    flex: 1,
  },
  insight: {
    backgroundColor: "#eef4f4",
    borderRadius: 14,
    padding: 18,
  },
  insightText: {
    fontSize: 14,
    color: "#3a6a6b",
    lineHeight: 22,
    fontStyle: "italic",
  },
});
