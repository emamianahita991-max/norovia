import Slider from "@react-native-community/slider";
import { useState } from "react";
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

type CheckIn = {
  dizziness: number;
  palpitations: number;
  fatigue: number;
  brainFog: number;
  nausea: number;
  headache: number;
  functionScore: number;
};

type Habits = {
  salt: boolean;
  compression: boolean;
  movement: boolean;
};

const WATER_RANGES = ["0–500 mL", "500 mL–1 L", "1–2 L", "2 L+"] as const;
type WaterRange = (typeof WATER_RANGES)[number];

const SYMPTOMS: { key: keyof CheckIn; label: string }[] = [
  { key: "dizziness", label: "Dizziness / lightheadedness" },
  { key: "palpitations", label: "Palpitations" },
  { key: "fatigue", label: "Fatigue" },
  { key: "brainFog", label: "Brain fog" },
  { key: "nausea", label: "Nausea" },
  { key: "headache", label: "Headache" },
];

const ACCENT = "#4a7c7e";

function SliderRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
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
  const { sleepLoggedToday, checkInCompletedToday, setCheckInCompleted, pendingSleep, addEntry } = useDaily();

  const [checkIn, setCheckIn] = useState<CheckIn>({
    dizziness: 0,
    palpitations: 0,
    fatigue: 0,
    brainFog: 0,
    nausea: 0,
    headache: 0,
    functionScore: 5,
  });

  const [habits, setHabits] = useState<Habits>({
    salt: false,
    compression: false,
    movement: false,
  });

  const [waterRange, setWaterRange] = useState<WaterRange | null>(null);

  function setSymptom(key: keyof CheckIn) {
    return (v: number) => setCheckIn((prev) => ({ ...prev, [key]: v }));
  }

  function setHabit(key: keyof Habits) {
    return (v: boolean) => setHabits((prev) => ({ ...prev, [key]: v }));
  }

  function handleFinish() {
    const symptomKeys: (keyof typeof checkIn)[] = [
      "dizziness", "palpitations", "fatigue", "brainFog", "nausea", "headache",
    ];
    const avgSymptom =
      symptomKeys.reduce((sum, k) => sum + checkIn[k], 0) / symptomKeys.length;

    addEntry({
      functionScore: checkIn.functionScore,
      avgSymptom: parseFloat(avgSymptom.toFixed(1)),
      dizziness: checkIn.dizziness,
      fatigue: checkIn.fatigue,
      waterRange,
      compression: habits.compression,
      movement: habits.movement,
      sleepScore: pendingSleep?.score ?? null,
      sleepHours: pendingSleep?.hours ?? null,
    });
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
          <Text style={styles.promptText}>Let's log how you feel — takes 30 seconds.</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Symptoms</Text>
        {SYMPTOMS.map(({ key, label }) => (
          <SliderRow
            key={key}
            label={label}
            value={checkIn[key]}
            onChange={setSymptom(key)}
          />
        ))}
        <View style={styles.divider} />
        <SliderRow
          label="How functional do you feel today?"
          value={checkIn.functionScore}
          onChange={setSymptom("functionScore")}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Habits today</Text>

        <View style={waterStyles.wrap}>
          <Text style={waterStyles.label}>Water today</Text>
          <View style={waterStyles.pills}>
            {WATER_RANGES.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  waterStyles.pill,
                  waterRange === option && waterStyles.pillActive,
                ]}
                onPress={() => setWaterRange(option)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    waterStyles.pillText,
                    waterRange === option && waterStyles.pillTextActive,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          This is a lifestyle support tool. It does not diagnose POTS or replace medical care.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.saveBtn}
        onPress={handleFinish}
        activeOpacity={0.8}
      >
        <Text style={styles.saveBtnText}>
          {checkInCompletedToday ? "Update check-in" : "Finish check-in"}
        </Text>
      </TouchableOpacity>

      {checkInCompletedToday && (
        <View style={styles.savedMsg}>
          <Text style={styles.savedMsgText}>Done. You're learning your pattern.</Text>
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
  divider: { height: 1, backgroundColor: "#eee", marginVertical: 2 },
  disclaimer: {
    backgroundColor: "#fef9ec",
    borderRadius: 12,
    padding: 16,
  },
  disclaimerText: { fontSize: 13, color: "#8a7340", lineHeight: 20 },
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

const waterStyles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { fontSize: 14, color: "#444" },
  pills: {
    flexDirection: "row",
    gap: 8,
  },
  pill: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f7f6f3",
    alignItems: "center",
  },
  pillActive: {
    borderColor: "#4a7c7e",
    backgroundColor: "#eef4f4",
  },
  pillText: {
    fontSize: 13,
    color: "#666",
  },
  pillTextActive: {
    color: "#4a7c7e",
    fontWeight: "600",
  },
});
