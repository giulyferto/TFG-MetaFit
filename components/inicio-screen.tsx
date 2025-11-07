import { Image } from "expo-image";
import { Dimensions, StyleSheet, TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

type InicioScreenProps = {
  onStartPress?: () => void;
};

export function InicioScreen({ onStartPress }: InicioScreenProps) {
  const handleStartPress = () => {
    if (onStartPress) {
      onStartPress();
    }
  };

  return (
    <ThemedView style={styles.container} lightColor="#FFFFFF">
      {/* Background Image */}
      <Image
        source={require("@/assets/images/home-background.png")}
        style={styles.backgroundImage}
        contentFit="cover"
      />
      <View style={styles.logoAndDescriptionContainer}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/images/MetaFitLogo.png")}
            style={styles.logo}
            contentFit="contain"
          />
        </View>
      </View>
      {/* Welcome Message */}
      <View style={styles.welcomeTextContainer}>
        <ThemedText style={styles.welcomeText} lightColor="#666666">
          Bienvenido a MetaFit
        </ThemedText>
      </View>

      {/* Spacer to push button to bottom */}
      <View style={styles.spacer} />

      {/* Start Button */}
      <TouchableOpacity style={styles.startButton} onPress={handleStartPress}>
        <ThemedText style={styles.startButtonText} lightColor="#FFFFFF">
          Empecemos
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    paddingHorizontal: 20,
    position: "relative",
    paddingTop: 60,
    paddingBottom: 20,
  },
  backgroundImage: {
    position: "absolute",
    top: -60,
    left: -20,
    width: screenWidth + 40,
    height: screenHeight + 80,
    zIndex: 0,
  },
  logoAndDescriptionContainer: {
    paddingTop: 80,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    zIndex: 2,
  },
  logo: {
    width: 200,
    height: 200,
  },
  welcomeTextContainer: {
    marginTop: 60,
  },
  welcomeText: {
    fontSize: 34,
    textAlign: "center",
    lineHeight: 42,
  },
  spacer: {
    flex: 1,
  },
  startButton: {
    backgroundColor: "#96b6c5",
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 12,
    marginBottom: 50,
    width: "85%",
    alignItems: "center",
    zIndex: 2,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
