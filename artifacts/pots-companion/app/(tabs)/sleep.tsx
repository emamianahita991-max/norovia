import { useState, useMemo } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useDaily } from "@/context/DailyContext";

const ACCENT = "#4a7c7e";
const MINUTES = [0, 15, 30, 45];

function formatHour(h: number): string {
  const period = h < 12 ? "AM" : "PM";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display} ${period}`;
}

function formatMinute(m: number): string {
  return m.toString().padStart(2, "0");
}

function formatTime(hour: number, minute: number): string {
  const period = hour < 12 ? "AM" : "PM";
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}:${formatMinute(minute)} ${period}`;
}

function calcHours(
  bedHour: number, bedMin: number,
  wakeHour: number, wakeMin: number
): number {
  let start = bedHour * 60 + bedMin;
  let end = wakeHour * 60 + wakeMin;
  if (end <= start) end += 24 * 60;
  return parseFloat(((end - start) / 60).toFixed(1));
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

function TimePicker({
  label,
  hour,
  minute,
  onHourChange,
  onMinuteChange,
}: {
  label: string;
  hour: number;
  minute: number;
  onHourChange: (h: number) => void;
  onMinuteChange: (m: number) => void;
}) {
  const minIdx = MINUTES.indexOf(minute);

  function stepHour(dir: 1 | -1) {
    onHourChange((hour + dir + 24) % 24);
  }

  function stepMinute(dir: 1 | -1) {
    const next = (minIdx + dir + MINUTES.length) % MINUTES.length;
    onMinuteChange(MINUTES[next]);
  }

  return (
    <View style={tp.wrap}>
      <Text style={tp.label}>{label}</Text>
      <Text style={tp.timeDisplay}>{formatTime(hour, minute)}</Text>
      <View style={tp.row}>
        <View style={tp.col}>
          <Text style={tp.unit}>Hour</Text>
          <View style={tp.controls}>
            <TouchableOpacity style={tp.btn} onPress={() => stepHour(-1)} activeOpacity={0.7}>
              <Text style={tp.btnText}>−</Text>
            </TouchableOpacity>
            <Text style={tp.value}>{formatHour(hour)}</Text>
            <TouchableOpacity style={tp.btn} onPress={() => stepHour(1)} activeOpacity={0.7}>
              <Text style={tp.btnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={tp.separator} />

        <View style={tp.col}>
          <Text style={tp.unit}>Minute</Text>
          <View style={tp.controls}>
            <TouchableOpacity style={tp.btn} onPress={() => stepMinute(-1)} activeOpacity={0.7}>
              <Text style={tp.btnText}>−</Text>
            </TouchableOpacity>
            <Text style={tp.value}>:{formatMinute(minute)}</Text>
            <TouchableOpacity style={tp.btn} onPress={() => stepMinute(1)} activeOpacity={0.7}>
              <Text style={tp.btnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

function StepperRow({
  label,
  hint,
  value,
  onDecrement,
  onIncrement,
  min = 0,
  max = 10,
  displayValue,
}: {
  label: string;
  hint?: string;
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  min?: number;
  max?: number;
  displayValue?: string;
}) {
  return (
    <View style={step.wrap}>
      <View style={step.labelWrap}>
        <Text style={step.label}>{label}</Text>
        {hint && <Text style={step.hint}>{hint}</Text>}
      </View>
      <View style={step.controls}>
        <TouchableOpacity
          onPress={onDecrement}
          disabled={value <= min}
          style={[step.btn, value <= min && step.btnDisabled]}
        >
          <Text style={step.btnText}>−</Text>
        </TouchableOpacity>
        <Text style={step.count}>{displayValue ?? value}</Text>
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

export default function SleepScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { sleepLoggedToday, setSleepLogged, setPendingSleep } = useDaily();

  const [bedHour, setBedHour] = useState(22);
  const [bedMinute, setBedMinute] = useState(30);
  const [wakeHour, setWakeHour] = useState(7);
  const [wakeMinute, setWakeMinute] = useState(0);
  const [interruptions, setInterruptions] = useState(0);
  const [useWearable, setUseWearable] = useState(false);
  const [wearableHours, setWearableHours] = useState(7);

  const hours = useMemo<number>(() => {
    if (useWearable) return wearableHours;
    return calcHours(bedHour, bedMinute, wakeHour, wakeMinute);
  }, [useWearable, wearableHours, bedHour, bedMinute, wakeHour, wakeMinute]);

  const score = sleepScore(hours, interruptions);

  function handleSave() {
    setPendingSleep({ score, hours });
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
    >
      <View style={styles.pageHeader}>
        <Text style={styles.appName}>Norovia</Text>
        <Text style={styles.companion}>Last night shapes how today feels.</Text>
        <Text style={styles.heading}>Sleep</Text>
      </View>

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
            displayValue={`${wearableHours} h`}
          />
        ) : (
          <View style={styles.timePickers}>
            <TimePicker
              label="Bedtime"
              hour={bedHour}
              minute={bedMinute}
              onHourChange={setBedHour}
              onMinuteChange={setBedMinute}
            />
            <View style={styles.timePickerDivider} />
            <TimePicker
              label="Wake time"
              hour={wakeHour}
              minute={wakeMinute}
              onHourChange={setWakeHour}
              onMinuteChange={setWakeMinute}
            />
          </View>
        )}

        <StepperRow
          label="Interruptions"
          hint="Times you woke during the night"
          value={interruptions}
          onDecrement={() => setInterruptions((n) => Math.max(0, n - 1))}
          onIncrement={() => setInterruptions((n) => Math.min(10, n + 1))}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Summary</Text>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Total sleep</Text>
          <Text style={styles.statValue}>{hours} h</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Interruptions</Text>
          <Text style={styles.statValue}>{interruptions}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Sleep score</Text>
          <Text style={[
            styles.statValue,
            score >= 85 ? styles.good : score < 65 ? styles.low : null,
          ]}>
            {score} / 100
          </Text>
        </View>
        {(() => {
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
  pageHeader: { marginBottom: 0 },
  appName: { fontSize: 12, fontWeight: "600", color: "#4a7c7e", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 },
  companion: { fontSize: 13, color: "#9AA6A2", lineHeight: 20, marginBottom: 10 },
  heading: { fontSize: 28, fontWeight: "700", color: "#111", marginBottom: 0 },
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
  timePickers: { gap: 20 },
  timePickerDivider: { height: 1, backgroundColor: "#f0f0f0" },
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
    borderRadius: 10,
    padding: 14,
  },
  summaryText: {
    fontSize: 14,
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
  labelWrap: { flex: 1, gap: 2 },
  label: { fontSize: 14, fontWeight: "600", color: "#222" },
  hint: { fontSize: 12, color: "#9AA6A2", lineHeight: 17 },
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
  count: { fontSize: 18, fontWeight: "600", color: "#111", minWidth: 40, textAlign: "center" },
});

const tp = StyleSheet.create({
  wrap: { gap: 8 },
  label: { fontSize: 13, color: "#777", fontWeight: "500" },
  timeDisplay: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  col: {
    flex: 1,
    gap: 6,
  },
  separator: {
    width: 1,
    height: 48,
    backgroundColor: "#eee",
  },
  unit: {
    fontSize: 11,
    color: "#aaa",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  btn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { fontSize: 20, color: "#fff", lineHeight: 24 },
  value: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
    minWidth: 52,
    textAlign: "center",
  },
});
