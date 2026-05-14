import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDaily, Entry } from "@/context/DailyContext";

type Analysis = {
  helps: string[];
  worsens: string[];
  tryNext: string[];
};

function avg(nums: number[]): number | null {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
}

function pct(days: Entry[], pred: (e: Entry) => boolean): number {
  return days.length ? days.filter(pred).length / days.length : 0;
}

function analyze(entries: Entry[]): Analysis | null {
  if (entries.length < 7) return null;

  const goodDays = entries.filter((e) => e.energy >= 6 && e.avgSymptom <= 4);
  const badDays = entries.filter((e) => e.energy <= 4 || e.avgSymptom >= 6);

  const helps: string[] = [];
  const worsens: string[] = [];
  const tryNext: string[] = [];

  if (goodDays.length >= 1 && badDays.length >= 1) {
    const wellHydrated = (e: Entry) => e.waterLiters >= 2.0;

    const waterGood = pct(goodDays, wellHydrated);
    const waterBad = pct(badDays, wellHydrated);
    if (waterGood >= 0.6 && waterBad < 0.4) {
      helps.push("On days with higher hydration, symptoms were lower.");
    }
    if (waterBad > 0.6) {
      worsens.push("Low hydration days have coincided with higher symptoms.");
    }

    const sleepHrsGood = goodDays.filter((e) => e.sleepHours !== null).map((e) => e.sleepHours!);
    const sleepHrsBad = badDays.filter((e) => e.sleepHours !== null).map((e) => e.sleepHours!);
    const sleepAvgGood = avg(sleepHrsGood);
    const sleepAvgBad = avg(sleepHrsBad);
    if (sleepAvgGood !== null && sleepAvgBad !== null && sleepAvgGood >= 7 && sleepAvgBad < 6) {
      helps.push("Days with more sleep have coincided with lower symptoms.");
    }

    const comprGood = pct(goodDays, (e) => e.compression);
    const comprBad = pct(badDays, (e) => e.compression);
    if (comprGood > 0.6 && comprBad < 0.4) {
      helps.push("Days with compression have coincided with lower symptoms.");
    }

    const moveGood = pct(goodDays, (e) => e.movement);
    const moveBad = pct(badDays, (e) => e.movement);
    if (moveGood > 0.6 && moveBad < 0.4) {
      helps.push("Days with gentle movement have coincided with lower symptoms.");
    }
  }

  const recentHours = entries.slice(-3).filter((e) => e.sleepHours !== null).map((e) => e.sleepHours!);
  if (recentHours.length >= 2 && recentHours.every((h) => h < 6)) {
    worsens.push("Short sleep days have coincided with higher fatigue.");
  }

  const recentWindow = entries.slice(-7);
  const noComprHighDizz = recentWindow.filter((e) => !e.compression && e.dizziness >= 6).length >= 2;
  if (noComprHighDizz) {
    worsens.push("Days without compression have coincided with higher dizziness.");
  }

  const highFatigueLowSleep = recentWindow.filter(
    (e) => e.fatigue >= 7 && e.sleepHours !== null && e.sleepHours < 6,
  ).length >= 2;
  if (highFatigueLowSleep) {
    worsens.push("High fatigue days have coincided with poor sleep.");
  }

  const recent = entries.slice(-3);
  const lowSleepRecent = recent.filter((e) => e.sleepHours !== null && e.sleepHours < 6).length >= 1;
  const lowWaterRecent = recent.filter((e) => e.waterLiters < 2.0).length >= 2;
  const lowComprRecent = recent.filter((e) => !e.compression).length >= 2;

  if (lowSleepRecent) {
    tryNext.push("Next step: plan a lower-demand day after short sleep.");
  } else if (lowWaterRecent) {
    tryNext.push("Next step: prioritize fluids earlier in the day.");
  } else if (lowComprRecent) {
    tryNext.push("Next step: try compression on higher symptom days.");
  }

  return { helps, worsens, tryNext };
}

function InsightRow({ text, dotStyle }: { text: string; dotStyle: object }) {
  return (
    <View style={styles.row}>
      <View style={[styles.dot, dotStyle]} />
      <Text style={styles.rowText}>{text}</Text>
    </View>
  );
}

export default function TrendsScreen() {
  const insets = useSafeAreaInsets();
  const { entries } = useDaily();
  const result = analyze(entries);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.container,
        {
          paddingBottom: insets.bottom + 24,
          paddingTop: 16,
        },
      ]}
    >
      <View style={styles.pageHeader}>
        <Text style={styles.appName}>Norovia</Text>
        <Text style={styles.companion}>Your patterns are starting to take shape.</Text>
        <Text style={styles.heading}>Trends</Text>
      </View>

      {!result ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>You're building your pattern</Text>
          <Text style={styles.emptyBody}>
            A few days of check-ins will help this become clearer.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>What seems to help</Text>
            {result.helps.length > 0 ? (
              result.helps.map((item, i) => (
                <InsightRow key={i} text={item} dotStyle={styles.dotGood} />
              ))
            ) : (
              <Text style={styles.emptySection}>Not enough data yet.</Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>What seems to make symptoms worse</Text>
            {result.worsens.length > 0 ? (
              result.worsens.map((item, i) => (
                <InsightRow key={i} text={item} dotStyle={styles.dotBad} />
              ))
            ) : (
              <Text style={styles.emptySection}>Not enough data yet.</Text>
            )}
          </View>

          {result.tryNext.length > 0 && (
            <View style={styles.tryCard}>
              <Text style={styles.sectionTitle}>What to try next</Text>
              <Text style={styles.tryText}>{result.tryNext[0]}</Text>
            </View>
          )}
        </>
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
  heading: { fontSize: 28, fontWeight: "700", color: "#111" },

  emptyCard: {
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
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111",
  },
  emptyBody: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
  },
  emptySection: {
    fontSize: 13,
    color: "#aaa",
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

  tryCard: {
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
  tryText: {
    fontSize: 14,
    color: "#444",
    lineHeight: 22,
  },

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
