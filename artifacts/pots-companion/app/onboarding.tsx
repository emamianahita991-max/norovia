import { useState, useEffect } from "react";
import {
  AccessibilityInfo,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useDaily } from "@/context/DailyContext";

const TOTAL_STEPS = 4;

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { completeOnboarding } = useDaily();
  const [step, setStep] = useState(0);
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  function handleFinish() {
    completeOnboarding();
    router.replace("/sleep");
  }

  const animate = reduceMotion === false;
  const entering = animate ? FadeIn.duration(220) : undefined;
  const exiting = animate ? FadeOut.duration(140) : undefined;

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
        <Animated.View key={step} entering={entering} exiting={exiting} style={styles.stepContent}>
          {step === 0 && (
            <>
              <Text style={styles.bodyText}>
                This app is for people who deal with symptoms like dizziness, brain fog, fatigue, or just feeling off during the day.
              </Text>
              <Text style={styles.bodyText}>
                You don't need a diagnosis to use this.
              </Text>
            </>
          )}

          {step === 1 && (
            <>
              <Text style={styles.bodyText}>
                Living with these symptoms can feel unpredictable.
              </Text>
              <Text style={styles.bodyText}>
                This app helps you check in, understand your state, and adjust your day.
              </Text>
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.bodyText}>
                This app tracks energy, dizziness, and brain fog — along with sleep, hydration, and habits like salt, compression, and movement.
              </Text>
              <Text style={styles.dataNote}>
                Your data is currently stored on your device. If you delete the app or switch devices, your data may not carry over yet.
              </Text>
            </>
          )}

          {step === 3 && (
            <>
              <Text style={styles.disclaimerText}>
                This is not medical care.
              </Text>
              <Text style={styles.disclaimerEmergency}>
                If you feel unsafe or your symptoms are severe, seek medical help or call emergency services.
              </Text>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setAcknowledged((v) => !v)}
                activeOpacity={0.7}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: acknowledged }}
              >
                <View style={[styles.checkbox, acknowledged && styles.checkboxChecked]}>
                  {acknowledged && <Text style={styles.checkboxTick}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>I understand</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
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
            {step < TOTAL_STEPS - 1 ? "Continue →" : "Start →"}
          </Text>
        </TouchableOpacity>

        {step > 0 && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setStep((s) => s - 1)}
            activeOpacity={0.6}
          >
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
        )}
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
  },
  stepContent: {
    gap: 20,
  },
  bodyText: {
    fontSize: 20,
    color: "#111",
    lineHeight: 30,
    fontWeight: "400",
  },
  disclaimerText: {
    fontSize: 20,
    color: "#333",
    lineHeight: 30,
    fontWeight: "400",
    textAlign: "center",
  },
  disclaimerEmergency: {
    fontSize: 16,
    color: "#666",
    lineHeight: 26,
    fontWeight: "400",
    textAlign: "center",
    marginTop: 8,
  },
  dataNote: {
    fontSize: 13,
    color: "#888",
    lineHeight: 20,
    textAlign: "center",
    marginTop: 12,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
    alignSelf: "center",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#9AA6A2",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f7f6f3",
  },
  checkboxChecked: {
    backgroundColor: "#4a7c7e",
    borderColor: "#4a7c7e",
  },
  checkboxTick: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "700",
    lineHeight: 16,
  },
  checkboxLabel: {
    fontSize: 15,
    color: "#555",
    fontWeight: "400",
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
  backBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  backBtnText: {
    fontSize: 15,
    color: "#9AA6A2",
    fontWeight: "400",
  },
});
