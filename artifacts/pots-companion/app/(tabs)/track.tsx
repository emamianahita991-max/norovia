import { StyleSheet, Text, View } from "react-native";

export default function TrackScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.name}>Track</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  name: {
    fontSize: 24,
    fontWeight: "600",
    color: "#111",
  },
});
