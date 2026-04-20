import {
  Platform,
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
  if (entries.length < 3) return null;

  const goodDays = entries.filter((e) => e.functionScore >= 6 && e.avgSymptom <= 4);
  const badDays = entries.filter((e) => e.functionScore <= 4 || e.avgSymptom >= 6);

  const helps: string[] = [];
  const worsens: string[] = [];
  const tryNext: string[] = [];

  if (goodDays.length >= 1 && badDays.length >= 1) {
    const waterGood = pct(goodDays, (e) => e.water);
    const waterBad = pct(badDays, (e) => e.water);
    if (waterGood >= 0.6 && waterBad < 0.4) {
      helps.push("You seem to feel better on days with stronger hydration.");
    }
    if (waterBad > 0.6) {
      worsens.push("Lower hydration days may be linked to worse symptoms.");
    }

    const sleepScoresGood = goodDays.filter((e) => e.sleepScore !== null).map((e) => e.sleepScore!);
    const sleepScoresBad = badDays.filter((e) => e.sleepScore !== null).map((e) => e.sleepScore!);
    const sleepAvgGood = avg(sleepScoresGood);
    const sleepAvgBad = avg(sleepScoresBad);
    if (sleepAvgGood !== null && sleepAvgBad !== null && sleepAvgGood >= 75 && sleepAvgBad < 65) {
      helps.push("Your symptoms appear worse after shorter or more disrupted sleep.");
    }

    const comprGood = pct(goodDays, (e) => e.compression);
    const comprBad = pct(badDays, (e) => e.compression);
    if (comprGood > 0.6 && comprBad < 0.4) {
      helps.push("Compression may be helping reduce your symptoms.");
    }

    const moveGood = pct(goodDays, (e) => e.movement);
    const moveBad = pct(badDays, (e) => e.movement);
    if (moveGood > 0.6 && moveBad < 0.4) {
      helps.push("Gentle movement seems to support how you feel.");
    }
  }

  const recentHours = entries.slice(-3).filter((e) => e.sleepHours !== null).map((e) => e.sleepHours!);
  if (recentHours.length >= 2 && recentHours.every((h) => h < 6)) {
    worsens.push("Short sleep may be contributing to fatigue and brain fog.");
  }

  const noComprHighDizz = entries.some((e) => !e.compression && e.dizziness >= 6);
  if (noComprHighDizz) {
    worsens.push("Skipping compression on high-symptom days may be making things harder.");
  }

  const highFatigueLowSleep = entries.some(
    (e) => e.fatigue >= 7 && e.sleepScore !== null && e.sleepScore < 60,
  );
  if (highFatigueLowSleep) {
    worsens.push("Fatigue seems to increase after poor sleep.");
  }

  const recent = entries.slice(-3);
  const lowSleepRecent = recent.filter((e) => e.sleepScore !== null && e.sleepScore < 60).length >= 1;
  const lowWaterRecent = recent.filter((e) => !e.water).length >= 2;
  const lowComprRecent = recent.filter((e) => !e.compression).length >= 2;

  if (lowSleepRecent) {
    tryNext.push("Prioritize a lower-demand day when sleep is short.");
  } else if (lowWaterRecent) {
    tryNext.push("Try focusing on fluids earlier in the day.");
  } else if (lowComprRecent) {
    tryNext.push("Consider using compression on higher symptom days.");
  }

  return {
    helps: helps.slice(0, 2),
    worsens: worsens.slice(0, 2),
    tryNext: tryNext.slice(0, 1),
  };
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
          paddingTop: Platform.OS === "web" ? 67 : 16,
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
          <Text style={styles.emptyText}>
            You're still building your pattern. Keep logging.
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
              <Text style={styles.emptySection}>Not enough data yet for this section.</Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>What seems to make symptoms worse</Text>
            {result.worsens.length > 0 ? (
              result.worsens.map((item, i) => (
                <InsightRow key={i} text={item} dotStyle={styles.dotBad} />
              ))
            ) : (
              <Text style={styles.emptySection}>Not enough data yet for this section.</Text>
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
  heading: { fontSize: 28, fontWeight: "700", color: "#111", marginBottom: 0 },

  emptyCard: {
    backgroundColor: "#eef4f4",
    borderRadius: 14,
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
    color: "#4a7c7e",
    lineHeight: 22,
    fontStyle: "italic",
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
