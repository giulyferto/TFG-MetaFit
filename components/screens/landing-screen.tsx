import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { MetaFitColors } from "@/constants/theme";
import { Image } from "expo-image";
import { router } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";

type LandingScreenProps = {
  onLoginPress?: () => void;
  onRegisterPress?: () => void;
};

export function LandingScreen({
  onLoginPress,
  onRegisterPress,
}: LandingScreenProps) {
  const handleLoginPress = () => {
    if (onLoginPress) {
      onLoginPress();
    } else {
      // Navegar a la pantalla de login
      router.push("/login");
    }
  };

  const handleRegisterPress = () => {
    if (onRegisterPress) {
      onRegisterPress();
    } else {
      // Navegar a la pantalla de registro
      router.push("/register");
    }
  };

  return (
    <ThemedView
      style={styles.container}
      lightColor={MetaFitColors.background.white}
    >
      {/* Logo circular */}
      <Image
        source={require("@/assets/images/MetaFitLogo.png")}
        style={styles.logo}
        contentFit="contain"
      />

      {/* Spacer para empujar el botón hacia abajo */}
      <View style={styles.spacer} />

      {/* Botón de Login */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.loginButton} onPress={handleLoginPress}>
          <ThemedText
            style={styles.loginButtonText}
            lightColor={MetaFitColors.text.white}
          >
            Log in
          </ThemedText>
        </TouchableOpacity>

        {/* Opción de registro */}
        <View style={styles.registerContainer}>
          <ThemedText
            style={styles.registerQuestion}
            lightColor={MetaFitColors.text.secondary}
          >
            ¿No tienes cuenta?{" "}
          </ThemedText>
          <TouchableOpacity onPress={handleRegisterPress}>
            <ThemedText
              style={styles.registerLink}
              lightColor={MetaFitColors.button.primary}
            >
              Registrarme
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MetaFitColors.background.white,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  appName: {
    fontSize: 28,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  spacer: {
    flex: 0.3,
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
  },
  loginButton: {
    backgroundColor: MetaFitColors.button.primary,
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 12,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    marginBottom: 20,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: MetaFitColors.text.white,
  },
  registerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  registerQuestion: {
    fontSize: 14,
    color: MetaFitColors.text.secondary,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: "600",
    color: MetaFitColors.button.primary,
    textDecorationLine: "underline",
  },
});
