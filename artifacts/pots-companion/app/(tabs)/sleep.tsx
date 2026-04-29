import { useState, useMemo, useEffect } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useDaily, type TodayState } from "@/context/DailyContext";

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

function calcHours(
  bedHour: number, bedMin: number,
  wakeHour: number, wakeMin: number
): number {
  let start = bedHour * 60 + bedMin;
  let end = wakeHour * 60 + wakeMin;
  if (end <= start) end += 24 * 60;
  return parseFloat(((end - start) / 60).toFixed(1));
}

function sleepScore(hours: number, awakenings: number): number {
  let score = 100;

  if (hours < 6) score -= 30;
  else if (hours < 7) score -= 15;

  if (awakenings === 0) score += 5;
  else if (awakenings <= 2) {
    // 1–2 awakenings: no score adjustment
  } else if (awakenings === 3) {
    score -= 5;
  } else if (awakenings >= 4) {
    score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

function scoreFeedback(sleepHours: number) {
  if (sleepHours >= 7) {
    return {
      message: "Your sleep may be supportive today.",
      bg: "#eef4f4",
      textColor: "#3a6a6b",
    };
  }
  if (sleepHours >= 6) {
    return {
      message: "Your sleep may need a little support today.",
      bg: "#f0f3f5",
      textColor: "#4a5560",
    };
  }
  return {
    message: "Short sleep may make symptoms feel harder today.",
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
  style,
}: any) {
  const minIdx = MINUTES.indexOf(minute);

  function stepHour(dir: 1 | -1) {
    onHourChange((hour + dir + 24) % 24);
  }

  function stepMinute(dir: 1 | -1) {
    const next = (minIdx + dir + MINUTES.length) % MINUTES.length;
    onMinuteChange(MINUTES[next]);
  }

  return (
    <View style={[tp.wrap, style]}>
      <Text style={tp.label}>{label}</Text>

      <View style={tp.row}>
        <View style={tp.col}>
          <Text style={tp.unit}>Hour</Text>
          <View style={tp.controls}>
            <TouchableOpacity style={tp.btn} onPress={() => stepHour(-1)}>
              <Text style={tp.btnText}>−</Text>
            </TouchableOpacity>
            <Text style={tp.value}>{formatHour(hour)}</Text>
            <TouchableOpacity style={tp.btn} onPress={() => stepHour(1)}>
              <Text style={tp.btnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={tp.separator} />

        <View style={tp.col}>
          <Text style={tp.unit}>Minute</Text>
          <View style={tp.controls}>
            <TouchableOpacity style={tp.btn} onPress={() => stepMinute(-1)}>
              <Text style={tp.btnText}>−</Text>
            </TouchableOpacity>
            <Text style={tp.value}>:{formatMinute(minute)}</Text>
            <TouchableOpacity style={tp.btn} onPress={() => stepMinute(1)}>
              <Text style={tp.btnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

function StepperRow({ label, value, onDecrement, onIncrement }: any) {
  return (
    <View style={step.wrap}>
      <Text style={step.label}>{label}</Text>
      <View style={step.controls}>
        <TouchableOpacity onPress={onDecrement} style={step.btn}>
          <Text style={step.btnText}>−</Text>
        </TouchableOpacity>
        <Text style={step.count}>{value}</Text>
        <TouchableOpacity onPress={onIncrement} style={step.btn}>
          <Text style={step.btnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function SleepScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    sleepLoggedToday,
    setSleepLogged,
    setPendingSleep,
    pendingSleep,
    checkInCompletedToday,
    entries,
    lockTodayState,
  } = useDaily();

  const [bedHour, setBedHour] = useState(pendingSleep?.bedHour ?? 22);
  const [bedMinute, setBedMinute] = useState(pendingSleep?.bedMinute ?? 30);
  const [wakeHour, setWakeHour] = useState(pendingSleep?.wakeHour ?? 7);
  const [wakeMinute, setWakeMinute] = useState(pendingSleep?.wakeMinute ?? 0);
  const [awakenings, setAwakenings] = useState(pendingSleep?.awakenings ?? 0);

  useEffect(() => {
    setBedHour(pendingSleep?.bedHour ?? 22);
    setBedMinute(pendingSleep?.bedMinute ?? 30);
    setWakeHour(pendingSleep?.wakeHour ?? 7);
    setWakeMinute(pendingSleep?.wakeMinute ?? 0);
    setAwakenings(pendingSleep?.awakenings ?? 0);
  }, [pendingSleep]);

  const hours = useMemo(() => {
    return calcHours(bedHour, bedMinute, wakeHour, wakeMinute);
  }, [bedHour, bedMinute, wakeHour, wakeMinute]);

  const score = sleepScore(hours, awakenings);

  function handleSave() {
    setPendingSleep({ score, hours, awakenings, bedHour, bedMinute, wakeHour, wakeMinute });
    setSleepLogged(true);

    if (checkInCompletedToday && entries.length > 0) {
      const latest = entries[entries.length - 1];
      const { avgSymptom, maxSymptom, energy } = latest;
      const effectiveSleep = Math.max(0, hours - (awakenings ?? 0) * 0.25);
      let recomputed: TodayState;
      if (effectiveSleep < 4) {
        recomputed = "take-it-easy";
      } else if (maxSymptom >= 8 || avgSymptom >= 6) {
        recomputed = "take-it-easy";
      } else if (effectiveSleep < 6) {
        recomputed = "mindful";
      } else if (maxSymptom >= 6 || energy <= 4 || avgSymptom >= 4) {
        recomputed = "mindful";
      } else {
        recomputed = "steady";
      }

      lockTodayState(recomputed);
    }

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
        <Text style={styles.heading}>Sleep</Text>
      </View>

      {!sleepLoggedToday && (
        <View style={styles.promptBanner}>
          <Text style={styles.promptText}>
            So, how did you sleep last night?
          </Text>
        </View>
      )}

      <View style={styles.card}>
        <TimePicker
          label="Bedtime"
          hour={bedHour}
          minute={bedMinute}
          onHourChange={setBedHour}
          onMinuteChange={setBedMinute}
        />

        <TimePicker
          label="Wake time"
          hour={wakeHour}
          minute={wakeMinute}
          onHourChange={setWakeHour}
          onMinuteChange={setWakeMinute}
          style={{ marginTop: 18 }}
        />

        <View style={{ gap: 6, marginTop: 18 }}>
          <StepperRow
            label="Awakenings"
            value={awakenings}
            onDecrement={() => setAwakenings(Math.max(0, awakenings - 1))}
            onIncrement={() => setAwakenings(Math.min(10, awakenings + 1))}
          />
          <Text style={{ fontSize: 12, color: "#888" }}>
            How many times did you wake up during the night?
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Summary</Text>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Total sleep</Text>
          <Text style={styles.statValue}>{hours} h</Text>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Awakenings</Text>
          <Text style={styles.statValue}>{awakenings}</Text>
        </View>

        {sleepLoggedToday && pendingSleep ? (
          <View style={[styles.summaryBox, { backgroundColor: scoreFeedback(pendingSleep.hours).bg }]}>
            <Text style={[styles.summaryText, { color: scoreFeedback(pendingSleep.hours).textColor }]}>
              {scoreFeedback(pendingSleep.hours).message}
            </Text>
          </View>
        ) : (
          <View style={[styles.summaryBox, { backgroundColor: "#f0f3f5" }]}>
            <Text style={[styles.summaryText, { color: "#4a5560" }]}>
              Log your sleep to see today's sleep note.
            </Text>
          </View>
        )}
      </View>

      {sleepLoggedToday && (
        <View style={styles.savedMsg}>
          <Text style={styles.savedMsgTitle}>Sleep logged ✓</Text>
          <Text style={styles.savedMsgSub}>You can update it anytime.</Text>
        </View>
      )}

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>
          {sleepLoggedToday ? "Update sleep" : "Save sleep"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#f7f6f3" },
  container: { paddingHorizontal: 20, gap: 16 },
  pageHeader: { marginBottom: 0 },
  heading: { fontSize: 28, fontWeight: "700" },
  promptBanner: { backgroundColor: "#f0f3f5", padding: 14, borderRadius: 12 },
  promptText: { fontSize: 14, color: "#4a5560" },
  card: { backgroundColor: "#fff", padding: 20, borderRadius: 14, gap: 16 },
  sectionTitle: { fontSize: 15, fontWeight: "600" },
  statRow: { flexDirection: "row", justifyContent: "space-between" },
  statLabel: { fontSize: 14, color: "#555" },
  statValue: { fontSize: 18, fontWeight: "600" },
  summaryBox: { padding: 14, borderRadius: 10 },
  summaryText: { fontSize: 14 },
  saveBtn: { backgroundColor: "#2c2c2c", padding: 16, borderRadius: 14 },
  saveBtnText: { color: "#fff", textAlign: "center", fontWeight: "600" },
  savedMsg: {
    backgroundColor: "#eef4f4",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    gap: 4,
  },
  savedMsgTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#3a6a6b",
  },
  savedMsgSub: {
    fontSize: 13,
    color: "#6a9496",
  },
});

const step = StyleSheet.create({
  wrap: { flexDirection: "row", justifyContent: "space-between" },
  label: { fontSize: 14 },
  controls: { flexDirection: "row", gap: 16 },
  btn: { width: 34, height: 34, backgroundColor: ACCENT, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  btnText: { color: "#fff", fontSize: 20 },
  count: { fontSize: 18 },
});

const tp = StyleSheet.create({
  wrap: { gap: 8 },
  label: { fontSize: 13, color: "#777" },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  col: { flex: 1, gap: 6 },
  separator: { width: 1, height: 48, backgroundColor: "#eee" },
  unit: { fontSize: 11, color: "#ccc", textAlign: "center" },
  controls: { flexDirection: "row", justifyContent: "center", gap: 12 },
  btn: { width: 34, height: 34, backgroundColor: ACCENT, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  btnText: { color: "#fff", fontSize: 20 },
  value: { fontSize: 16, textAlign: "center" },
});
