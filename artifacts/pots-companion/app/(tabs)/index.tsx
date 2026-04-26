import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  Pressable,
} from "react-native";

import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useDaily } from "@/context/DailyContext";




export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { sleepLoggedToday, checkInCompletedToday, entries, isFlareActive, pendingSleep } = useDaily();

  const latestEntry = entries.length > 0 ? entries[entries.length - 1] : null;
  const avgSymptom: number | null = latestEntry ? latestEntry.avgSymptom : null;
  const sleepHours: number | null = pendingSleep?.hours ?? latestEntry?.sleepHours ?? null;
  const sleepScore: number | null = pendingSleep?.score ?? latestEntry?.sleepScore ?? null;
  const sleepAwakenings: number | null =
    pendingSleep?.awakenings ?? latestEntry?.sleepAwakenings ?? null;
  const waterLiters: number | null = latestEntry ? latestEntry.waterLiters : null;
  const dizziness: number = latestEntry ? latestEntry.dizziness : 0;

  function getMovementGuidance(state: string, diz: number) {
    const movementText =
      state === "steady"
        ? "Keep your routine steady today."
        : "Keep movement gentle. Use recumbent or seated movement if needed.";

    const standingCaution =
      diz >= 5 ? "Pause before standing. Make a fist or rise slowly." : "";

    return { movementText, standingCaution };
  }

  type TodayState = "take-it-easy" | "mindful" | "steady";
  const todayState: TodayState | null = (() => {
    if (!checkInCompletedToday) return null;
    if (avgSymptom === null && sleepScore === null && sleepHours === null) return null;
    const sym = avgSymptom ?? 0;
    const badSleep =
      sleepScore !== null ? sleepScore < 60 : sleepHours !== null ? sleepHours < 6 : false;
    const moderateSleep =
      sleepScore !== null
        ? sleepScore >= 60 && sleepScore < 80
        : sleepHours !== null
        ? sleepHours < 7
        : false;
    if (sym >= 6 || badSleep) return "take-it-easy";
    if (sym >= 4 || moderateSleep) return "mindful";
    return "steady";
  })();

  const { movementText, standingCaution } = todayState !== null
    ? getMovementGuidance(todayState, dizziness)
    : { movementText: "", standingCaution: "" };

  const BASE_BULLETS: Record<TodayState, string[]> = {
    "take-it-easy": [
      "Reduce standing time where you can.",
      movementText,
    ],
    mindful: [
      "If standing feels harder, compression may help.",
      movementText,
    ],
    steady: [
      movementText,
      "Use gentle movement if it feels supportive.",
    ],
  };

  const hydrationBullet: string | null = (() => {
    if (waterLiters !== null && waterLiters < 1)
      return "Prioritize fluids early in the day.";
    if (waterLiters !== null && waterLiters < 2)
      return "Keep fluids steady through the rest of the day.";
    return null;
  })();

  const FLARE_PLAN = [
    "Sit or lie down when possible.",
    "Prioritize fluids and salt early.",
    "Avoid prolonged standing and heat.",
    "Delay non-essential tasks if you can.",
  ];

  const plan: string[] = isFlareActive
    ? FLARE_PLAN
    : todayState !== null
    ? (() => {
        const base = BASE_BULLETS[todayState];
        return hydrationBullet
          ? [hydrationBullet, ...base].slice(0, 3)
          : base.slice(0, 3);
      })()
    : [];

  const microNudge: string = (() => {
    if (waterLiters === null || waterLiters < 1)
      return "A small glass of water now could help.";
    if (waterLiters < 2)
      return "You're building well. Keep fluids steady.";
    return "You're on track. Keep the pace gentle.";
  })();

  const insight: string = (() => {
    if (entries.length < 3)
      return "We'll start noticing patterns as you log a few days.";
    if (sleepScore !== null && sleepScore < 60)
      return "Short or disrupted sleep may make symptoms harder today.";
    if (todayState === "take-it-easy") return "Harder days happen. You're not doing anything wrong.";
    if (todayState === "mindful") return "A gentler pace isn't giving up. It's working with what you have.";
    if (todayState === "steady") return "Today looks steadier so far. Keep it simple.";
    return "You seem to do better on days when fluids are stronger.";
  })();

  const [showAboutModal, setShowAboutModal] = useState(false);

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
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.pageHeader}>
        <Text style={styles.appName}>Norovia</Text>
        <Text style={styles.companion}>You don't have to figure this out all at once.</Text>
        <Text style={styles.heading}>Today</Text>
        {!isFlareActive && !checkInCompletedToday && (
          <Text style={styles.todayStatePlaceholder}>
            Complete today's check-in to see your Today State.
          </Text>
        )}
        {(!isFlareActive && checkInCompletedToday && todayState !== null) && (() => {
          const stateLabel =
            todayState === "take-it-easy"
              ? "Take It Easy (Very Low Reserve)"
              : todayState === "mindful"
              ? "Mindful (Low Reserve)"
              : "Steady";
          const stateSignal =
            todayState === "take-it-easy"
              ? "Your body is working hard right now."
              : todayState === "mindful"
              ? "Your body may have less in reserve today."
              : "Your inputs suggest a steadier day.";
          const stateAction =
            todayState === "take-it-easy"
              ? "Rest is doing something. Reduce upright time and let the day come to you."
              : todayState === "mindful"
              ? "Work in shorter blocks and give yourself permission to stop early."
              : "Keep your routine steady and avoid overdoing it.";
          return (
            <View>
              <Text style={styles.todayStateLabel}>{stateLabel}</Text>
              <Text style={styles.todayStateLabel}>{stateSignal}</Text>
              <Text style={styles.todayStateLabel}>{stateAction}</Text>
            </View>
          );
        })()}
      </View>

      {isFlareActive && (
        <View style={styles.flareBanner}>
          <Text style={styles.flareBannerTitle}>Flare Mode Active</Text>
          <Text style={styles.flareBannerText}>This is a stabilization day. Rest counts as care.</Text>
          <Text style={styles.flareReassurance}>
            You're not doing anything wrong. Your body needs more support right now, and that's enough reason to slow down.
          </Text>
        </View>
      )}

      {renderCTA()}

      {avgSymptom !== null && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Average symptom score</Text>
          <Text style={styles.cardValue}>{avgSymptom.toFixed(1)}</Text>
        </View>
      )}

      {sleepHours !== null && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Sleep last night</Text>
          <Text style={styles.cardValue}>{sleepHours} h</Text>
        </View>
      )}

      {sleepAwakenings !== null && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Awakenings</Text>
          <Text style={styles.cardValue}>{sleepAwakenings}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daily plan</Text>
        {!checkInCompletedToday ? (
          <Text style={styles.todayStatePlaceholder}>
            Complete your check-in to see today's plan.
          </Text>
        ) : (
          <>
            {plan.map((item, i) => (
              <View key={i} style={styles.bullet}>
                <Text style={styles.bulletDot}>·</Text>
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
            {!isFlareActive && latestEntry !== null && (
              <Text style={styles.microNudge}>{microNudge}</Text>
            )}
            {!isFlareActive && standingCaution !== "" && (
              <Text style={styles.standingCaution}>{standingCaution}</Text>
            )}
          </>
        )}
      </View>

      {!isFlareActive && checkInCompletedToday && (
        <View style={styles.insight}>
          <Text style={styles.insightText}>{insight}</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.aboutLink}
        onPress={() => setShowAboutModal(true)}
        activeOpacity={0.6}
      >
        <Text style={styles.aboutLinkText}>About Norovia</Text>
      </TouchableOpacity>

      <Modal
        visible={showAboutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAboutModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowAboutModal(false)}>
          <Pressable style={styles.aboutModalBox} onPress={() => {}}>
            <Text style={styles.modalTitle}>About Norovia</Text>
            <ScrollView
              style={styles.aboutModalScroll}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <Text style={styles.aboutModalBody}>
                Norovia is a simple tool to help you notice patterns and understand your symptoms.
              </Text>
              <Text style={styles.aboutModalBody}>
                It helps you track your day and make small, supportive adjustments.
              </Text>

              <Text style={styles.aboutSectionLabel}>Disclaimer</Text>
              <Text style={styles.aboutModalBody}>
                This app helps you notice patterns and better understand your symptoms.
              </Text>
              <Text style={styles.aboutModalBody}>
                It does not provide medical advice, diagnosis, or treatment — and does not replace medical care.
              </Text>
              <Text style={styles.aboutModalEmergency}>
                If you feel unsafe or your symptoms are severe, seek medical care or call emergency services (911).
              </Text>
            </ScrollView>
            <TouchableOpacity
              onPress={() => setShowAboutModal(false)}
              activeOpacity={0.7}
              style={styles.modalClose}
            >
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

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
  pageHeader: {
    marginBottom: 0,
  },
  appName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4a7c7e",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  companion: {
    fontSize: 13,
    color: "#9AA6A2",
    lineHeight: 20,
    marginBottom: 10,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111",
    marginBottom: 0,
  },
  todayStateLabel: {
    fontSize: 14,
    fontWeight: "400",
    color: "#9AA6A2",
    marginTop: 3,
  },
  todayStatePlaceholder: {
    fontSize: 14,
    fontWeight: "400",
    color: "#9AA6A2",
    marginTop: 4,
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

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111",
    marginBottom: 2,
  },
  modalClose: {
    marginTop: 4,
    backgroundColor: "#f7f6f3",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalCloseText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4a7c7e",
  },
  aboutLink: {
    alignItems: "center",
    paddingVertical: 8,
  },
  aboutLinkText: {
    fontSize: 12,
    color: "#bbb",
    textDecorationLine: "underline",
  },
  aboutModalBox: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 24,
    width: "100%",
    maxHeight: "80%",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
    elevation: 8,
  },
  aboutModalScroll: {
    flexGrow: 0,
  },
  aboutModalBody: {
    fontSize: 14,
    color: "#444",
    lineHeight: 22,
    marginBottom: 8,
  },
  aboutModalEmergency: {
    fontSize: 14,
    color: "#8a3a3a",
    lineHeight: 22,
    fontWeight: "600",
    marginTop: 4,
    marginBottom: 8,
  },
  aboutSectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9AA6A2",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 12,
    marginBottom: 6,
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
  microNudge: {
    fontSize: 13,
    color: "#9AA6A2",
    lineHeight: 20,
    fontStyle: "italic",
    marginTop: 6,
  },
  standingCaution: {
    fontSize: 13,
    color: "#6a9496",
    lineHeight: 20,
    fontStyle: "italic",
    marginTop: 4,
  },
  flareBanner: {
    backgroundColor: "#fdf0f0",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e8c4c4",
    padding: 18,
    gap: 6,
  },
  flareBannerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#8a3a3a",
    letterSpacing: 0.2,
  },
  flareBannerText: {
    fontSize: 14,
    color: "#7a4040",
    lineHeight: 20,
  },
  flareReassurance: {
    fontSize: 13,
    color: "#9a5a5a",
    lineHeight: 20,
    fontStyle: "italic",
    marginTop: 4,
  },
});
