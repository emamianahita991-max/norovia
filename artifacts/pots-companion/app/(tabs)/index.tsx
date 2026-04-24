import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Modal,
  Pressable,
} from "react-native";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useDaily } from "@/context/DailyContext";


const CONTEXTS = ["seated", "standing", "other"] as const;
type VitalContext = (typeof CONTEXTS)[number];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { sleepLoggedToday, checkInCompletedToday, addVitalReading, entries, isFlareActive } = useDaily();

  const latestEntry = entries.length > 0 ? entries[entries.length - 1] : null;
  const avgSymptom: number | null = latestEntry ? latestEntry.avgSymptom : null;
  const sleepHours: number | null = latestEntry ? latestEntry.sleepHours : null;
  const sleepScore: number | null = latestEntry ? latestEntry.sleepScore : null;
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

  const { movementText, standingCaution } = getMovementGuidance(todayState ?? "steady", dizziness);

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
    if (waterLiters === null || waterLiters < 1)
      return "Prioritize fluids early in the day.";
    if (waterLiters < 2)
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
    : (() => {
        const base =
          todayState !== null
            ? BASE_BULLETS[todayState]
            : [
                "Keep movement gentle and paced today.",
                "Listen to what your body needs today.",
              ];
        return hydrationBullet
          ? [hydrationBullet, ...base].slice(0, 3)
          : base.slice(0, 3);
      })();

  const microNudge: string = (() => {
    if (waterLiters === null || waterLiters < 1)
      return "A small glass of water now could help.";
    if (waterLiters < 2)
      return "You're building well—keep fluids steady.";
    return "You're on track—keep the pace gentle.";
  })();

  const insight: string = (() => {
    if (sleepScore !== null && sleepScore < 60)
      return "Short or disrupted sleep may make symptoms harder today.";
    if (todayState === "take-it-easy") return "Your body may need a bit more support today.";
    if (todayState === "mindful") return "A steadier pace may help today feel more manageable.";
    if (todayState === "steady") return "Today looks steadier so far — keep it simple.";
    return "You seem to do better on days when fluids are stronger.";
  })();

  const [vitalsOpen, setVitalsOpen] = useState(false);
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [vitalCtx, setVitalCtx] = useState<VitalContext>("seated");
  const [vitalsSaved, setVitalsSaved] = useState(false);
  const [showMeasureModal, setShowMeasureModal] = useState(false);

  function handleSaveVitals() {
    const hasAnyValue = systolic || diastolic || heartRate;
    if (!hasAnyValue) {
      setVitalsOpen(false);
      return;
    }

    addVitalReading({
      systolic: systolic ? parseInt(systolic, 10) : null,
      diastolic: diastolic ? parseInt(diastolic, 10) : null,
      heartRate: heartRate ? parseInt(heartRate, 10) : null,
      context: vitalCtx,
      timestamp: Date.now(),
    });

    setVitalsSaved(true);
    setTimeout(() => {
      setVitalsSaved(false);
      setVitalsOpen(false);
      setSystolic("");
      setDiastolic("");
      setHeartRate("");
      setVitalCtx("seated");
    }, 1800);
  }

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
        {(!isFlareActive && todayState !== null) && (() => {
          const stateLabel =
            todayState === "take-it-easy"
              ? "Take It Easy (Very Low Reserve)"
              : todayState === "mindful"
              ? "Mindful (Low Reserve)"
              : "Steady";
          const stateSignal =
            todayState === "take-it-easy"
              ? "Your system may need a lighter day today."
              : todayState === "mindful"
              ? "Your body may have less tolerance today."
              : "Your body seems more stable today.";
          const stateAction =
            todayState === "take-it-easy"
              ? "Prioritize essentials, reduce upright time, and pace everything."
              : todayState === "mindful"
              ? "Use shorter activity blocks with built-in breaks."
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
          <Text style={styles.flareBannerText}>This is a stabilization day. Keep things simple.</Text>
          <Text style={styles.flareReassurance}>
            You're not doing anything wrong. Your system needs more support today.
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

      {/* Vitals card */}
      <View style={styles.vitalsCard}>
        <TouchableOpacity
          style={styles.vitalsHeader}
          onPress={() => setVitalsOpen((v) => !v)}
          activeOpacity={0.7}
        >
          <View>
            <Text style={styles.vitalsTitle}>Vitals</Text>
            <Text style={styles.vitalsHint}>Log a reading anytime.</Text>
          </View>
          <Text style={styles.vitalsToggle}>{vitalsOpen ? "−" : "+"}</Text>
        </TouchableOpacity>

        {vitalsOpen && (
          <View style={styles.vitalsBody}>
            <View style={styles.inputRow}>
              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>Systolic</Text>
                <TextInput
                  style={styles.input}
                  value={systolic}
                  onChangeText={setSystolic}
                  placeholder="120"
                  placeholderTextColor="#ccc"
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>Diastolic</Text>
                <TextInput
                  style={styles.input}
                  value={diastolic}
                  onChangeText={setDiastolic}
                  placeholder="80"
                  placeholderTextColor="#ccc"
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>Heart rate</Text>
                <TextInput
                  style={styles.input}
                  value={heartRate}
                  onChangeText={setHeartRate}
                  placeholder="72"
                  placeholderTextColor="#ccc"
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
            </View>

            <View style={styles.ctxRow}>
              {CONTEXTS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.ctxPill, vitalCtx === c && styles.ctxPillActive]}
                  onPress={() => setVitalCtx(c)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.ctxText, vitalCtx === c && styles.ctxTextActive]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity onPress={() => setShowMeasureModal(true)} activeOpacity={0.6}>
              <Text style={styles.measureLink}>How to measure</Text>
            </TouchableOpacity>

            {vitalsSaved ? (
              <View style={styles.savedMsg}>
                <Text style={styles.savedMsgText}>Saved.</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.saveVitalsBtn} onPress={handleSaveVitals} activeOpacity={0.8}>
                <Text style={styles.saveVitalsBtnText}>Save vitals</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daily plan</Text>
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
      </View>

      {!isFlareActive && (
        <View style={styles.insight}>
          <Text style={styles.insightText}>{insight}</Text>
        </View>
      )}

      <Modal
        visible={showMeasureModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMeasureModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowMeasureModal(false)}>
          <Pressable style={styles.modalBox} onPress={() => {}}>
            <Text style={styles.modalTitle}>How to measure</Text>
            {[
              "Sit quietly for 2–3 minutes",
              "Keep your arm supported at heart level",
              "Avoid talking during the reading",
              "Take a second reading if unsure",
            ].map((tip, i) => (
              <View key={i} style={styles.modalRow}>
                <Text style={styles.modalDot}>·</Text>
                <Text style={styles.modalTip}>{tip}</Text>
              </View>
            ))}
            <Text style={styles.modalFooter}>Consistency matters more than perfection.</Text>
            <TouchableOpacity onPress={() => setShowMeasureModal(false)} activeOpacity={0.7} style={styles.modalClose}>
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

  vitalsCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
    overflow: "hidden",
  },
  vitalsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  vitalsTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },
  vitalsHint: {
    fontSize: 13,
    color: "#999",
    marginTop: 2,
  },
  vitalsToggle: {
    fontSize: 22,
    color: "#9AA6A2",
    fontWeight: "300",
    lineHeight: 26,
  },
  vitalsBody: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  inputRow: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 14,
  },
  inputWrap: {
    flex: 1,
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    color: "#888",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e4e4e4",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 17,
    fontWeight: "600",
    color: "#111",
    textAlign: "center",
  },
  ctxRow: {
    flexDirection: "row",
    gap: 8,
  },
  ctxPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f7f6f3",
  },
  ctxPillActive: {
    backgroundColor: "#eef4f4",
    borderColor: "#4a7c7e",
  },
  ctxText: {
    fontSize: 13,
    color: "#888",
  },
  ctxTextActive: {
    color: "#4a7c7e",
    fontWeight: "600",
  },
  saveVitalsBtn: {
    backgroundColor: "#2c2c2c",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveVitalsBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  measureLink: {
    fontSize: 13,
    color: "#9AA6A2",
    textDecorationLine: "underline",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 24,
    width: "100%",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111",
    marginBottom: 2,
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  modalDot: {
    fontSize: 18,
    color: "#9AA6A2",
    lineHeight: 22,
  },
  modalTip: {
    fontSize: 14,
    color: "#444",
    lineHeight: 22,
    flex: 1,
  },
  modalFooter: {
    fontSize: 13,
    color: "#aaa",
    fontStyle: "italic",
    marginTop: 4,
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
  savedMsg: {
    alignItems: "center",
    paddingVertical: 10,
  },
  savedMsgText: {
    fontSize: 14,
    color: "#4a7c7e",
    fontStyle: "italic",
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
