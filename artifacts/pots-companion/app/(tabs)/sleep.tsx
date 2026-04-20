import { useState, useMemo } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useDaily } from "@/context/DailyContext";

const ACCENT = "#4a7c7e";

function parseSleepHours(start: string, end: string): number | null {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if (
    isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em) ||
    sh > 23 || sm > 59 || eh > 23 || em > 59
  ) return null;
  let startMins = sh * 60 + sm;
  let endMins = eh * 60 + em;
  if (endMins <= startMins) endMins += 24 * 60;
  return parseFloat(((endMins - startMins) / 60).toFixed(1));
}

function sleepScore(hours: number, interruptions: number): number {
  let score = 100;
  if (hours < 6) score -= 30;
  else if (hours < 7) score -= 15;
  if (interruptions >= 3) score -= 20;
  else if (interruptions >= 1) score -= 10;
  return Math.max(25, score);
}

function scoreFeedback(score: number): { message: string; bg: string; textColor: string } {
  if (score > 80) return {
    message: "Your sleep looks supportive today.",
    bg: "#eef4f4",
    textColor: "#3a6a6b",
  };
  if (score >= 60) return {
    message: "Your sleep was okay. Small adjustments could help.",
    bg: "#f0f3f5",
    textColor: "#4a5560",
  };
  return {
    message: "Short sleep may make symptoms harder today.",
    bg: "#fff4e6",
    textColor: "#9a5a00",
  };
}

function StepperRow({
  label,
  value,
  onDecrement,
  onIncrement,
  min = 0,
  max = 10,
}: {
  label: string;
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  min?: number;
  max?: number;
}) {
  return (
    <View style={step.wrap}>
      <Text style={step.label}>{label}</Text>
      <View style={step.controls}>
        <TouchableOpacity
          onPress={onDecrement}
          disabled={value <= min}
          style={[step.btn, value <= min && step.btnDisabled]}
        >
          <Text style={step.btnText}>−</Text>
        </TouchableOpacity>
        <Text style={step.count}>{value}</Text>
        <TouchableOpacity
          onPress={onIncrement}
          disabled={value >= max}
          style={[step.btn, value >= max && step.btnDisabled]}
        >
          <Text style={step.btnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function TimeInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={time.wrap}>
      <Text style={time.label}>{label}</Text>
      <TextInput
        style={time.input}
        value={value}
        onChangeText={onChange}
        placeholder="HH:MM"
        placeholderTextColor="#bbb"
        keyboardType="numbers-and-punctuation"
        maxLength={5}
      />
    </View>
  );
}

export default function SleepScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { sleepLoggedToday, setSleepLogged } = useDaily();

  const [bedtime, setBedtime] = useState("22:30");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [interruptions, setInterruptions] = useState(0);
  const [useWearable, setUseWearable] = useState(false);
  const [wearableHours, setWearableHours] = useState(7);

  const hours = useMemo<number | null>(() => {
    if (useWearable) return wearableHours;
    return parseSleepHours(bedtime, wakeTime);
  }, [useWearable, wearableHours, bedtime, wakeTime]);

  const score = hours !== null ? sleepScore(hours, interruptions) : null;

  function handleSave() {
    setSleepLogged(true);
    router.navigate("/");
  }

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
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.companion}>Norovia — let's log last night</Text>
      <Text style={styles.heading}>Sleep</Text>

      {!sleepLoggedToday && (
        <View style={styles.promptBanner}>
          <Text style={styles.promptText}>Let's log last night's sleep — takes 20 seconds.</Text>
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.toggleRow}>
          <Text style={styles.sectionTitle}>Use wearable data</Text>
          <Switch
            value={useWearable}
            onValueChange={setUseWearable}
            trackColor={{ false: "#ddd", true: ACCENT }}
            thumbColor="#fff"
          />
        </View>

        {useWearable ? (
          <StepperRow
            label="Total sleep (hours)"
            value={wearableHours}
            onDecrement={() => setWearableHours((h) => Math.max(0, h - 0.5))}
            onIncrement={() => setWearableHours((h) => Math.min(14, h + 0.5))}
            min={0}
            max={14}
          />
        ) : (
          <View style={styles.timeRow}>
            <TimeInput label="Bedtime" value={bedtime} onChange={setBedtime} />
            <TimeInput label="Wake time" value={wakeTime} onChange={setWakeTime} />
          </View>
        )}

        <StepperRow
          label="Interruptions"
          value={interruptions}
          onDecrement={() => setInterruptions((n) => Math.max(0, n - 1))}
          onIncrement={() => setInterruptions((n) => Math.min(10, n + 1))}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Summary</Text>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Total sleep</Text>
          <Text style={styles.statValue}>
            {hours !== null ? `${hours} h` : "—"}
          </Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Interruptions</Text>
          <Text style={styles.statValue}>{interruptions}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Sleep score</Text>
          <Text style={[styles.statValue, score !== null && score >= 85 ? styles.good : score !== null && score < 65 ? styles.low : null]}>
            {score !== null ? `${score} / 100` : "—"}
          </Text>
        </View>
        {score !== null && (() => {
          const fb = scoreFeedback(score);
          return (
            <View style={[styles.summaryBox, { backgroundColor: fb.bg }]}>
              <Text style={[styles.summaryText, { color: fb.textColor }]}>{fb.message}</Text>
            </View>
          );
        })()}
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
        <Text style={styles.saveBtnText}>Save sleep</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#f7f6f3" },
  container: { paddingHorizontal: 20, gap: 16 },
  companion: { fontSize: 12, color: "#aaa", marginBottom: -6 },
  heading: { fontSize: 28, fontWeight: "700", color: "#111", marginBottom: 4 },
  promptBanner: {
    backgroundColor: "#f0f3f5",
    borderRadius: 12,
    padding: 14,
  },
  promptText: {
    fontSize: 14,
    color: "#4a5560",
    fontStyle: "italic",
    lineHeight: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
    gap: 18,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  sectionTitle: { fontSize: 15, fontWeight: "600", color: "#111" },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timeRow: { flexDirection: "row", gap: 12 },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: { fontSize: 14, color: "#555" },
  statValue: { fontSize: 18, fontWeight: "600", color: "#111" },
  good: { color: "#3a7a4a" },
  low: { color: "#b04a4a" },
  summaryBox: {
    backgroundColor: "#eef4f4",
    borderRadius: 10,
    padding: 14,
  },
  summaryText: {
    fontSize: 14,
    color: "#3a6a6b",
    lineHeight: 22,
  },
  saveBtn: {
    backgroundColor: "#2c2c2c",
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});

const step = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: { fontSize: 14, color: "#444", flex: 1 },
  controls: { flexDirection: "row", alignItems: "center", gap: 16 },
  btn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
  },
  btnDisabled: { backgroundColor: "#ddd" },
  btnText: { fontSize: 20, color: "#fff", lineHeight: 24 },
  count: { fontSize: 18, fontWeight: "600", color: "#111", minWidth: 28, textAlign: "center" },
});

const time = StyleSheet.create({
  wrap: { flex: 1, gap: 6 },
  label: { fontSize: 13, color: "#777" },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
    textAlign: "center",
  },
});
