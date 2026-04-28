import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDaily, Entry, VitalReading } from "@/context/DailyContext";
import * as Print from "expo-print";

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
  const noComprHighDizz = recentWindow.some((e) => !e.compression && e.dizziness >= 6);
  if (noComprHighDizz) {
    worsens.push("Days without compression have coincided with higher dizziness.");
  }

  const highFatigueLowSleep = recentWindow.some(
    (e) => e.fatigue >= 7 && e.sleepHours !== null && e.sleepHours < 6,
  );
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

  return {
    helps: helps.slice(0, 1),
    worsens: worsens.slice(0, 1),
    tryNext: tryNext.slice(0, 1),
  };
}

function n(val: number | null, decimals = 0): string {
  if (val === null) return "—";
  return val.toFixed(decimals);
}

function buildReportHtml(entries: Entry[], vitals: VitalReading[]): string {
  const now = new Date();
  const exportDate = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const hrs = vitals.map((v) => v.heartRate).filter((h): h is number => h !== null);
  const sys = vitals.map((v) => v.systolic).filter((s): s is number => s !== null);
  const dia = vitals.map((v) => v.diastolic).filter((d): d is number => d !== null);
  const sleepHours = entries
    .map((e) => e.sleepHours)
    .filter((h): h is number => h !== null);
  const awakenings = entries
    .map((e) => e.sleepAwakenings)
    .filter((a): a is number => a !== null);

  const meanHR = avg(hrs);
  const minHR = hrs.length ? Math.min(...hrs) : null;
  const maxHR = hrs.length ? Math.max(...hrs) : null;
  const meanSys = avg(sys);
  const meanDia = avg(dia);

  const seatedReadings = vitals.filter((v) => v.context === "seated" && v.heartRate !== null);
  const standingReadings = vitals.filter((v) => v.context === "standing" && v.heartRate !== null);
  const meanHRSeated = avg(seatedReadings.map((v) => v.heartRate!));
  const meanHRStanding = avg(standingReadings.map((v) => v.heartRate!));
  const deltaHR = meanHRSeated !== null && meanHRStanding !== null
    ? meanHRStanding - meanHRSeated : null;

  const pctHighHR = hrs.length ? ((hrs.filter((h) => h >= 100).length / hrs.length) * 100) : null;

  const daysHydrated = entries.filter((e) => e.waterLiters >= 2.0).length;
  const daysCompression = entries.filter((e) => e.compression).length;

  const tableRows = vitals.map((v) => {
    const d = new Date(v.timestamp);
    const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const timeStr = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    return `
      <tr>
        <td>${dateStr}</td>
        <td>${timeStr}</td>
        <td>${v.systolic ?? "—"}</td>
        <td>${v.diastolic ?? "—"}</td>
        <td>${v.heartRate ?? "—"}</td>
        <td>${v.context}</td>
      </tr>`;
  }).join("");

  const row = (label: string, value: string) =>
    `<tr><td class="label">${label}</td><td class="value">${value}</td></tr>`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; font-size: 13px; color: #222; padding: 36px; line-height: 1.5; }
  h1 { font-size: 20px; font-weight: 700; color: #4a7c7e; letter-spacing: 1px; margin-bottom: 2px; }
  .meta { font-size: 12px; color: #888; margin-bottom: 28px; }
  h2 { font-size: 13px; font-weight: 600; color: #333; text-transform: uppercase; letter-spacing: 0.6px; border-bottom: 1px solid #e0e0e0; padding-bottom: 5px; margin: 22px 0 10px; }
  table.data { width: 100%; border-collapse: collapse; }
  table.data td { padding: 5px 8px; vertical-align: top; }
  table.data td.label { color: #666; width: 50%; }
  table.data td.value { font-weight: 600; color: #111; }
  table.vitals { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 12px; }
  table.vitals th { text-align: left; padding: 6px 8px; background: #f5f5f5; color: #555; font-weight: 600; border-bottom: 1px solid #ddd; }
  table.vitals td { padding: 5px 8px; border-bottom: 1px solid #f0f0f0; color: #333; }
  .empty { color: #aaa; font-style: italic; font-size: 12px; margin-top: 4px; }
  .footer { margin-top: 36px; padding-top: 14px; border-top: 1px solid #e0e0e0; font-size: 11px; color: #aaa; }
</style>
</head>
<body>

<h1>Norovia</h1>
<div class="meta">Export date: ${exportDate}</div>

<h2>Logging Summary</h2>
<table class="data">
  ${row("Check-ins logged", String(entries.length))}
  ${row("Vitals entries", String(vitals.length))}
</table>

<h2>Vitals Summary</h2>
${vitals.length === 0 ? '<p class="empty">No vitals logged yet.</p>' : `
<table class="data">
  ${row("Mean systolic BP", sys.length ? `${n(meanSys, 0)} mmHg` : "—")}
  ${row("Mean diastolic BP", dia.length ? `${n(meanDia, 0)} mmHg` : "—")}
  ${row("Mean heart rate", hrs.length ? `${n(meanHR, 0)} bpm` : "—")}
  ${row("Min heart rate", minHR !== null ? `${minHR} bpm` : "—")}
  ${row("Max heart rate", maxHR !== null ? `${maxHR} bpm` : "—")}
</table>`}

${seatedReadings.length >= 1 && standingReadings.length >= 1 ? `
<h2>Orthostatic Summary</h2>
<table class="data">
  ${row("Mean HR seated", `${n(meanHRSeated, 0)} bpm`)}
  ${row("Mean HR standing", `${n(meanHRStanding, 0)} bpm`)}
  ${row("Mean ΔHR (standing − seated)", `${deltaHR !== null && deltaHR >= 0 ? "+" : ""}${n(deltaHR, 0)} bpm`)}
</table>` : ""}

${hrs.length > 0 ? `
<h2>HR Distribution</h2>
<table class="data">
  ${row("Readings ≥ 100 bpm", `${n(pctHighHR, 0)}% (${hrs.filter((h) => h >= 100).length} of ${hrs.length})`)}
</table>` : ""}

<h2>Hydration and Habits</h2>
<table class="data">
  ${row("Average sleep hours", sleepHours.length ? `${n(avg(sleepHours), 1)} h` : "—")}
  ${row("Average night awakenings", awakenings.length ? n(avg(awakenings), 1) : "—")}
  ${row("Days with adequate hydration", entries.length ? `${daysHydrated} of ${entries.length}` : "—")}
  ${row("Days with compression worn", entries.length ? `${daysCompression} of ${entries.length}` : "—")}
</table>

${vitals.length > 0 ? `
<h2>Vitals Log</h2>
<table class="vitals">
  <thead>
    <tr>
      <th>Date</th><th>Time</th><th>Systolic</th><th>Diastolic</th><th>HR</th><th>Context</th>
    </tr>
  </thead>
  <tbody>${tableRows}</tbody>
</table>` : ""}

<div class="footer">
  This is self-reported tracking data from Norovia and is not a medical diagnosis.
</div>

</body>
</html>`;
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
  const { entries, vitalsReadings } = useDaily();
  const result = analyze(entries);
  const [exportDone, setExportDone] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    if (exporting) return;
    setExporting(true);
    try {
      const html = buildReportHtml(entries, vitalsReadings);
      await Print.printAsync({ html });
      setExportDone(true);
      setTimeout(() => setExportDone(false), 3000);
    } catch {
      // user cancelled or error — no-op
    } finally {
      setExporting(false);
    }
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
        <Text style={styles.companion}>Your patterns are starting to take shape.</Text>
        <View style={styles.headingRow}>
          <Text style={styles.heading}>Trends</Text>
          <TouchableOpacity
            style={[styles.exportBtn, exporting && styles.exportBtnDisabled]}
            onPress={handleExport}
            activeOpacity={0.7}
            disabled={exporting}
          >
            <Text style={styles.exportBtnText}>
              {exporting ? "Preparing…" : "Export summary"}
            </Text>
          </TouchableOpacity>
        </View>
        {exportDone && (
          <Text style={styles.exportConfirm}>Summary ready to share.</Text>
        )}
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
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heading: { fontSize: 28, fontWeight: "700", color: "#111" },
  exportBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d0e4e4",
    backgroundColor: "#eef4f4",
  },
  exportBtnDisabled: {
    opacity: 0.5,
  },
  exportBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4a7c7e",
  },
  exportConfirm: {
    fontSize: 12,
    color: "#9AA6A2",
    fontStyle: "italic",
    marginTop: 6,
  },

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
