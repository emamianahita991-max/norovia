import { useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useDaily } from "@/context/DailyContext";

const BULLETS = [
  "Track sleep",
  "Track symptoms",
  "Track hydration",
  "See simple daily guidance",
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { completeOnboarding } = useDaily();
  const [step, setStep] = useState(0);

  function handleFinish() {
    completeOnboarding();
    router.replace("/sleep");
  }

  const TOTAL_STEPS = 4;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Platform.OS === "web" ? 80 : insets.top + 32,
          paddingBottom: Platform.OS === "web" ? 48 : insets.bottom + 32,
        },
      ]}
    >
      <Text style={styles.wordmark}>Norovia</Text>

      <View style={styles.body}>
        {step === 0 && (
          <>
            <Text style={styles.bodyText}>
              Living with these symptoms is hard. This app won't fix everything, but it can help you notice patterns and feel a little less alone.
            </Text>
            <Text style={styles.bodyText}>
              You don't have to figure it all out today.
            </Text>
          </>
        )}

        {step === 1 && (
          <>
            <Text style={styles.sectionLabel}>What you'll track</Text>
            {BULLETS.map((b) => (
              <View key={b} style={styles.bulletRow}>
                <Text style={styles.bulletDot}>·</Text>
                <Text style={styles.bulletText}>{b}</Text>
              </View>
            ))}
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.sectionLabel}>Before you begin</Text>
            <Text style={styles.bodyText}>
              Norovia is a lifestyle support tool created with clinical insight into POTS and dysautonomia.
            </Text>
            <Text style={styles.bodyText}>
              It does not diagnose, treat, or replace medical care.
            </Text>
            <Text style={styles.bodyText}>
              It helps you track patterns, understand your day, and make supportive lifestyle choices.
            </Text>
            <Text style={styles.emergencyText}>
              If symptoms feel severe, unusual, or concerning, contact emergency services or call 911.
            </Text>
          </>
        )}

        {step === 3 && (
          <Text style={styles.prompt}>
            So, how did you sleep last night?
          </Text>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>

        <TouchableOpacity
          style={styles.btn}
          onPress={step < TOTAL_STEPS - 1 ? () => setStep((s) => s + 1) : handleFinish}
          activeOpacity={0.8}
        >
          <Text style={styles.btnText}>
            {step === 0
              ? "Continue →"
              : step === 1
              ? "Got it →"
              : step === 2
              ? "Understood →"
              : "Log last night's sleep →"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f6f3",
    paddingHorizontal: 28,
    justifyContent: "space-between",
  },
  wordmark: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4a7c7e",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  body: {
    flex: 1,
    justifyContent: "center",
    gap: 20,
  },
  bodyText: {
    fontSize: 20,
    color: "#111",
    lineHeight: 30,
    fontWeight: "400",
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9AA6A2",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  bulletDot: {
    fontSize: 20,
    color: "#4a7c7e",
    lineHeight: 26,
  },
  bulletText: {
    fontSize: 17,
    color: "#333",
    lineHeight: 26,
  },
  prompt: {
    fontSize: 22,
    color: "#111",
    lineHeight: 32,
    fontWeight: "400",
  },
  emergencyText: {
    fontSize: 15,
    color: "#8a3a3a",
    lineHeight: 24,
    fontWeight: "600",
    marginTop: 4,
  },
  footer: {
    gap: 20,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ddd",
  },
  dotActive: {
    backgroundColor: "#4a7c7e",
  },
  btn: {
    backgroundColor: "#2c2c2c",
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
  },
  btnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
