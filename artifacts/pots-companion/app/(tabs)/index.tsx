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
import { useDaily, type TodayState } from "@/context/DailyContext";

type DailyPlan = {
  mode: string;
  actions: string[];
  pacing: string;
  permission: string;
};

function getDailyPlan(
  state: TodayState,
  fatigue: number,
  dizziness: number,
  brainFog: number
): DailyPlan {
  const highest = Math.max(fatigue, dizziness, brainFog);

  if (state === "take-it-easy") {
    const actions = [
      "Stay mostly seated or lying down",
      "Keep activity very short (5–10 min at a time)",
      "Hydrate early and consistently",
    ];
    if (fatigue === highest) actions[2] = "Take breaks earlier than usual";
    else if (dizziness === highest) actions[1] = "Move slowly when standing";
    else if (brainFog === highest) actions[2] = "Keep tasks simple and few";
    return {
      mode: "Today is a stabilization day.",
      actions,
      pacing: "Stop early — don't wait for symptoms to build.",
      permission: "Doing less today is the right move.",
    };
  }

  if (state === "mindful") {
    const actions = [
      "Keep movement gentle — seated if needed",
      "Pick 2–3 priorities and start with the smallest version",
      "Pause before walking after standing",
    ];
    if (fatigue === highest) actions[2] = "Take breaks earlier than usual";
    else if (dizziness === highest) actions[2] = "Move slowly when standing";
    else if (brainFog === highest) actions[1] = "Keep tasks simple and few";
    return {
      mode: "Today has usable capacity — handle it deliberately.",
      actions,
      pacing: "Pause before symptoms build.",
      permission: "Leave some capacity unused.",
    };
  }

  const actions = [
    "Do your main tasks earlier in the day",
    "Keep movement steady, not intense",
    "Take short breaks before fatigue builds",
  ];
  if (fatigue === highest) actions[2] = "Take breaks earlier than usual";
  else if (dizziness === highest) actions[1] = "Move slowly when standing";
  else if (brainFog === highest) actions[0] = "Keep tasks simple and few";
  return {
    mode: "You have usable capacity today.",
    actions,
    pacing: "Keep momentum, but don't push to exhaustion.",
    permission: "You can move forward today.",
  };
}


export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    sleepLoggedToday,
    checkInCompletedToday,
    entries,
    isFlareActive,
    setFlareActive,
    pendingSleep,
    lockedTodayState,
    resetAll,
  } = useDaily();

  const FLARE_BULLETS = [
    "Sit or lie down whenever you can",
    "Start fluids and salt early in the day",
    "Avoid prolonged standing",
  ];

  const latestEntry = entries.length > 0 ? entries[entries.length - 1] : null;
  const avgSymptom: number | null = latestEntry ? latestEntry.avgSymptom : null;
  const sleepHours: number | null = pendingSleep?.hours ?? latestEntry?.sleepHours ?? null;
  const sleepAwakenings: number | null =
    pendingSleep?.awakenings ?? latestEntry?.sleepAwakenings ?? null;
  const fatigue: number = latestEntry?.fatigue ?? 0;
  const dizziness: number = latestEntry?.dizziness ?? 0;
  const brainFog: number = latestEntry?.brainFog ?? 0;

  const dailyPlan: DailyPlan | null =
    !isFlareActive && checkInCompletedToday && lockedTodayState !== null
      ? getDailyPlan(lockedTodayState, fatigue, dizziness, brainFog)
      : null;

  const isSevereLowReserve =
    lockedTodayState === "take-it-easy" &&
    avgSymptom !== null &&
    avgSymptom >= 7;

  const showSymptomScore =
    !isFlareActive &&
    lockedTodayState === "steady";

  const showSleepCard =
    !isFlareActive &&
    sleepHours !== null &&
    !(lockedTodayState === "take-it-easy" && (avgSymptom ?? 0) >= 7);

  const showAwakeningsCard =
    !isFlareActive &&
    lockedTodayState === "steady" &&
    sleepAwakenings !== null;

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
            Complete today's check-in to better guide your day.
          </Text>
        )}
        {(!isFlareActive && checkInCompletedToday && lockedTodayState !== null) && (() => {
          const stateLabel =
            lockedTodayState === "take-it-easy"
              ? "Take It Easy"
              : lockedTodayState === "mindful"
              ? "Mindful (Low Reserve)"
              : "Steady";

          if (isSevereLowReserve) {
            return (
              <View>
                <Text style={styles.todayStateLabel}>{stateLabel}</Text>
                <Text style={styles.todayStateQualifier}>(very low reserve)</Text>
              </View>
            );
          }

          const subLine =
            lockedTodayState === "take-it-easy"
              ? "Today is a stabilization day."
              : lockedTodayState === "mindful"
              ? "Work in shorter blocks. Pause before symptoms build."
              : "You have usable capacity today.";

          return (
            <View>
              <Text style={styles.todayStateLabel}>{stateLabel}</Text>
              {lockedTodayState === "take-it-easy" && (
                <Text style={styles.todayStateQualifier}>(very low reserve)</Text>
              )}
              <Text style={styles.todayStateExplanation}>{subLine}</Text>
            </View>
          );
        })()}
      </View>

      {isFlareActive && (
        <>
          <View style={styles.flareBanner}>
            <Text style={styles.flareBannerTitle}>Flare Mode Active</Text>
            <Text style={styles.flareBannerText}>Today is a stabilization day.</Text>
            <Text style={styles.flareBannerText}>Your priority is staying stable.</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Focus today</Text>
            {FLARE_BULLETS.map((b, i) => (
              <View key={i} style={styles.bullet}>
                <Text style={styles.bulletDot}>·</Text>
                <Text style={styles.bulletText}>{b}</Text>
              </View>
            ))}
            <Text style={styles.flarePacing}>Stop early — don't wait for symptoms to build.</Text>
            <Text style={styles.flarePermission}>Doing less today is the right move.</Text>
          </View>

          <TouchableOpacity
            style={styles.flareOffBtn}
            onPress={() => setFlareActive(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.flareOffBtnText}>Turn off Flare Mode</Text>
          </TouchableOpacity>
        </>
      )}

      {!isFlareActive && !isSevereLowReserve && renderCTA()}

      {showSymptomScore && avgSymptom !== null && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Average symptom score</Text>
          <Text style={styles.cardValue}>{avgSymptom.toFixed(1)}</Text>
        </View>
      )}

      {showSleepCard && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Sleep last night</Text>
          <Text style={styles.cardValue}>{sleepHours} h</Text>
        </View>
      )}

      {showAwakeningsCard && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Awakenings</Text>
          <Text style={styles.cardValue}>{sleepAwakenings}</Text>
        </View>
      )}

      {!isFlareActive && (
        <View style={styles.section}>
          {!checkInCompletedToday ? (
            <Text style={styles.todayStatePlaceholder}>
              Complete your check-in to see today's plan.
            </Text>
          ) : dailyPlan !== null ? (
            <>
              <Text style={styles.planMode}>{dailyPlan.mode}</Text>
              {dailyPlan.actions.map((action, i) => (
                <View key={i} style={styles.bullet}>
                  <Text style={styles.bulletDot}>·</Text>
                  <Text style={styles.bulletText}>{action}</Text>
                </View>
              ))}
              <Text style={styles.planPacing}>{dailyPlan.pacing}</Text>
              <Text style={styles.planPermission}>{dailyPlan.permission}</Text>
            </>
          ) : null}
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
            <TouchableOpacity
              onPress={() => { setShowAboutModal(false); resetAll(); }}
              activeOpacity={0.6}
              style={styles.resetLink}
            >
              <Text style={styles.resetLinkText}>Reset app data</Text>
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
  todayStateQualifier: {
    fontSize: 12,
    color: "#b0bcb8",
    marginTop: 1,
  },
  todayStateExplanation: {
    fontSize: 13,
    color: "#6a7d7e",
    marginTop: 6,
    lineHeight: 20,
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
  resetLink: {
    alignItems: "center",
    paddingVertical: 6,
    marginTop: 4,
  },
  resetLinkText: {
    fontSize: 11,
    color: "#bbb",
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
  planMode: {
    fontSize: 14,
    color: "#4a7c7e",
    fontWeight: "600",
    marginBottom: 8,
  },
  planPacing: {
    fontSize: 13,
    color: "#888",
    marginTop: 10,
    fontStyle: "italic",
  },
  planPermission: {
    fontSize: 13,
    color: "#555",
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
  flarePacing: {
    fontSize: 13,
    color: "#888",
    fontStyle: "italic",
    marginTop: 10,
  },
  flarePermission: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  flareOffBtn: {
    backgroundColor: "#b03a3a",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
  },
  flareOffBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.2,
  },
});
