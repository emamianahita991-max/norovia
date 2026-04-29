import Slider from "@react-native-community/slider";
import { useState, useCallback } from "react";
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
import { useFocusEffect } from "@react-navigation/native";
import { useDaily, type TodayState } from "@/context/DailyContext";

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

type CheckIn = {
  energy: number;
  dizziness: number;
  brainFog: number;
};

type Habits = {
  salt: boolean;
  compression: boolean;
  movement: boolean;
};

const WATER_GOAL = 3.0;
const WATER_INCREMENTS = [0.25, 0.5, 1.0];

const ACCENT = "#4a7c7e";

function SliderRow({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <View style={row.wrap}>
      <View style={row.header}>
        <Text style={row.label}>{label}</Text>
        <Text style={row.value}>{value}</Text>
      </View>
      <Slider
        style={row.slider}
        minimumValue={0}
        maximumValue={10}
        step={1}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={ACCENT}
        maximumTrackTintColor="#ddd"
        thumbTintColor={ACCENT}
      />
      {hint ? <Text style={row.hint}>{hint}</Text> : null}
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={toggle.wrap}>
      <Text style={toggle.label}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: "#ddd", true: ACCENT }}
        thumbColor="#fff"
      />
    </View>
  );
}

export default function TrackScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { sleepLoggedToday, checkInCompletedToday, setCheckInCompleted, pendingSleep, entries, addEntry, lockTodayState } = useDaily();

  useFocusEffect(
    useCallback(() => {
      const last = entries[entries.length - 1];

      if (
        checkInCompletedToday &&
        last &&
        isSameDay(new Date(last.date), new Date())
      ) {
        setCheckIn({
          energy: last.energy,
          dizziness: last.dizziness,
          brainFog: last.brainFog,
        });
      } else {
        setCheckIn({
          energy: 5,
          dizziness: 0,
          brainFog: 0,
        });
      }
    }, [entries, checkInCompletedToday])
  );

  const [checkIn, setCheckIn] = useState<CheckIn>({
    energy: 5,
    dizziness: 0,
    brainFog: 0,
  });

  const [habits, setHabits] = useState<Habits>({
    salt: false,
    compression: false,
    movement: false,
  });

  const [observation, setObservation] = useState("");

  const [waterHistory, setWaterHistory] = useState<number[]>([]);
  const waterLiters = parseFloat(waterHistory.reduce((a, b) => a + b, 0).toFixed(2));

  function addWater(inc: number) {
    setWaterHistory((prev) => [...prev, inc]);
  }

  function undoWater() {
    setWaterHistory((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));
  }

  function setField(key: keyof CheckIn) {
    return (v: number) => setCheckIn((prev) => ({ ...prev, [key]: v }));
  }

  function setHabit(key: keyof Habits) {
    return (v: boolean) => setHabits((prev) => ({ ...prev, [key]: v }));
  }

  function handleFinish() {
    const fatigue = 10 - checkIn.energy;
    const { dizziness, brainFog } = checkIn;
    const avgSymptom = parseFloat(((fatigue + dizziness + brainFog) / 3).toFixed(1));
    const maxSymptom = Math.max(fatigue, dizziness, brainFog);

    const sleepHours = pendingSleep?.hours ?? null;

    addEntry({
      date: Date.now(),
      energy: checkIn.energy,
      dizziness,
      brainFog,
      fatigue,
      avgSymptom,
      maxSymptom,
      waterLiters,
      salt: habits.salt,
      compression: habits.compression,
      movement: habits.movement,
      sleepHours,
      sleepAwakenings: pendingSleep?.awakenings ?? null,
      observation: observation.trim(),
    });

    const sleepAwakenings = pendingSleep?.awakenings ?? null;
    const effectiveSleep = sleepHours !== null
      ? Math.max(0, sleepHours - (sleepAwakenings ?? 0) * 0.25)
      : 8;

    let computed: TodayState;
    if (effectiveSleep < 4) {
      computed = "take-it-easy";
    } else if (maxSymptom >= 8 || avgSymptom >= 6) {
      computed = "take-it-easy";
    } else if (effectiveSleep < 6) {
      computed = "mindful";
    } else if (maxSymptom >= 6 || checkIn.energy <= 4 || avgSymptom >= 4) {
      computed = "mindful";
    } else {
      computed = "steady";
    }

    lockTodayState(computed);
    setCheckInCompleted(true);
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
        <Text style={styles.companion}>Stay close to how your body feels.</Text>
        <Text style={styles.heading}>Track</Text>
      </View>

      {sleepLoggedToday && !checkInCompletedToday && (
        <View style={styles.promptBanner}>
          <Text style={styles.promptText}>Even a rough day is worth logging. Takes 30 seconds.</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>How are you feeling right now?</Text>
        <SliderRow
          label="Energy"
          value={checkIn.energy}
          onChange={setField("energy")}
          hint="0 = no energy · 10 = full energy"
        />
        <SliderRow
          label="Dizziness / lightheadedness"
          value={checkIn.dizziness}
          onChange={setField("dizziness")}
        />
        <SliderRow
          label="Brain fog"
          value={checkIn.brainFog}
          onChange={setField("brainFog")}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Support your day</Text>
        <Text style={styles.sectionSubtitle}>Add as your day goes.</Text>

        <View style={waterStyles.wrap}>
          <View style={waterStyles.headerRow}>
            <Text style={waterStyles.label}>Water today</Text>
            <Text style={waterStyles.total}>
              {waterLiters.toFixed(2).replace(/\.?0+$/, "")} L
              <Text style={waterStyles.goal}> / {WATER_GOAL} L</Text>
            </Text>
          </View>

          <View style={waterStyles.barTrack}>
            <View
              style={[
                waterStyles.barFill,
                { width: `${Math.min(waterLiters / WATER_GOAL, 1) * 100}%` },
              ]}
            />
          </View>

          <View style={waterStyles.buttons}>
            {WATER_INCREMENTS.map((inc) => (
              <TouchableOpacity
                key={inc}
                style={waterStyles.addBtn}
                onPress={() => addWater(inc)}
                activeOpacity={0.7}
              >
                <Text style={waterStyles.addBtnText}>
                  +{inc < 1 ? `${inc * 1000} mL` : `${inc} L`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {waterHistory.length > 0 && (
            <TouchableOpacity onPress={undoWater} activeOpacity={0.6}>
              <Text style={waterStyles.undo}>Undo last add</Text>
            </TouchableOpacity>
          )}
        </View>

        <ToggleRow
          label="Salt support used"
          value={habits.salt}
          onChange={setHabit("salt")}
        />
        <ToggleRow
          label="Compression worn"
          value={habits.compression}
          onChange={setHabit("compression")}
        />
        <ToggleRow
          label="Movement or exercise done"
          value={habits.movement}
          onChange={setHabit("movement")}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Anything you noticed today?</Text>
        <TextInput
          style={obs.input}
          value={observation}
          onChangeText={setObservation}
          maxLength={200}
          multiline={false}
          returnKeyType="done"
          blurOnSubmit
          placeholderTextColor="#bbb"
        />
      </View>

      <TouchableOpacity
        style={styles.saveBtn}
        onPress={handleFinish}
        activeOpacity={0.8}
      >
        <Text style={styles.saveBtnText}>
          {checkInCompletedToday ? "Update baseline" : "Set today's baseline"}
        </Text>
      </TouchableOpacity>

      {checkInCompletedToday && (
        <View style={styles.savedMsg}>
          <Text style={styles.savedMsgText}>Logged. Tracking on hard days takes real effort. It matters.</Text>
        </View>
      )}
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
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  sectionTitle: { fontSize: 15, fontWeight: "600", color: "#111" },
  sectionSubtitle: { fontSize: 13, color: "#9AA6A2", marginTop: -6 },
  sectionLabel: { fontSize: 13, fontWeight: "600", color: "#9AA6A2" },
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
  savedMsg: {
    backgroundColor: "#eef4f4",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  savedMsgText: {
    fontSize: 14,
    color: "#3a6a6b",
    fontStyle: "italic",
  },
});

const row = StyleSheet.create({
  wrap: { gap: 4 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: 14, color: "#444", flex: 1 },
  value: { fontSize: 16, fontWeight: "600", color: "#111", minWidth: 24, textAlign: "right" },
  slider: { width: "100%", height: 36 },
  hint: { fontSize: 11, color: "#bbb", marginTop: -2 },
});

const toggle = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  label: { fontSize: 14, color: "#444", flex: 1 },
});

const obs = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#e8edec",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111",
    backgroundColor: "#fafafa",
  },
});

const waterStyles = StyleSheet.create({
  wrap: { gap: 10 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  label: { fontSize: 14, color: "#444" },
  total: { fontSize: 15, fontWeight: "600", color: "#2c2c2c" },
  goal: { fontSize: 13, fontWeight: "400", color: "#9AA6A2" },
  barTrack: {
    height: 6,
    borderRadius: 4,
    backgroundColor: "#e8edec",
    overflow: "hidden",
  },
  barFill: {
    height: 6,
    borderRadius: 4,
    backgroundColor: "#4a7c7e",
  },
  buttons: {
    flexDirection: "row",
    gap: 8,
  },
  addBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#c8dada",
    backgroundColor: "#eef4f4",
    alignItems: "center",
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4a7c7e",
  },
  undo: {
    fontSize: 12,
    color: "#9AA6A2",
    textDecorationLine: "underline",
    textAlign: "right",
  },
});
