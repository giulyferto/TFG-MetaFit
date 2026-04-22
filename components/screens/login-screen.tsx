import { IconSymbol } from "@/components/ui/icon-symbol";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { MetaFitColors } from "@/constants/theme";
import { auth } from "@/firebase";
import { hasCompleteNutritionalProfile } from "@/utils/nutritional-profile";
import { Image } from "expo-image";
import { router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type LoginScreenProps = {
  onLoginPress?: () => void;
  onRegisterPress?: () => void;
};

export function LoginScreen({ onLoginPress, onRegisterPress }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLoginPress = async () => {
    setError("");

    if (!email.trim()) {
      setError("Por favor ingresa tu email");
      return;
    }

    if (!validateEmail(email)) {
      setError("Por favor ingresa un email válido");
      return;
    }

    if (!password) {
      setError("Por favor ingresa tu contraseña");
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      console.log("Usuario autenticado exitosamente:", userCredential.user.email);

      const hasProfile = await hasCompleteNutritionalProfile();

      if (onLoginPress) {
        onLoginPress();
      } else {
        if (!hasProfile) {
          router.replace("/info-nutricional");
        } else {
          router.replace("/(tabs)");
        }
      }
    } catch (error: any) {
      console.error("Error al iniciar sesión:", error);

      let errorMessage = "Error al iniciar sesión. Por favor intenta de nuevo.";

      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "No existe una cuenta con este email.";
          break;
        case "auth/wrong-password":
          errorMessage = "Contraseña incorrecta.";
          break;
        case "auth/invalid-email":
          errorMessage = "El formato del email no es válido.";
          break;
        case "auth/invalid-credential":
          errorMessage = "Email o contraseña incorrectos.";
          break;
        case "auth/too-many-requests":
          errorMessage = "Demasiados intentos fallidos. Por favor intenta más tarde.";
          break;
        case "auth/network-request-failed":
          errorMessage = "Error de conexión. Verifica tu internet.";
          break;
        default:
          errorMessage = error.message || errorMessage;
      }

      setError(errorMessage);
      Alert.alert("Error de inicio de sesión", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterPress = () => {
    if (onRegisterPress) {
      onRegisterPress();
    } else {
      router.push("/register");
    }
  };

  const handleSocialLogin = () => {
    console.log("Log in con Google");
    router.replace("/bienvenida");
  };

  return (
    <ThemedView style={styles.container} lightColor={MetaFitColors.background.white}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            name="chevron.left"
            size={20}
            color={MetaFitColors.text.secondary}
          />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle} lightColor={MetaFitColors.text.primary}>
          Iniciar sesión
        </ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome text */}
        <View style={styles.welcomeSection}>
          <ThemedText style={styles.welcomeTitle} lightColor={MetaFitColors.text.primary}>
            Bienvenido de vuelta
          </ThemedText>
          <ThemedText style={styles.welcomeSubtitle} lightColor={MetaFitColors.text.secondary}>
            Ingresa tus credenciales para continuar
          </ThemedText>
        </View>

        {/* Input Fields */}
        <View style={styles.inputGroup}>
          <ThemedText style={styles.inputLabel} lightColor={MetaFitColors.text.secondary}>
            Email
          </ThemedText>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="tu@email.com"
              placeholderTextColor={MetaFitColors.text.tertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.inputLabel} lightColor={MetaFitColors.text.secondary}>
            Contraseña
          </ThemedText>
          <View style={[styles.inputWrapper, styles.passwordWrapper]}>
            <TextInput
              style={styles.passwordInput}
              placeholder="••••••••"
              placeholderTextColor={MetaFitColors.text.tertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <IconSymbol
                name={showPassword ? "eye.slash" : "eye"}
                size={18}
                color={MetaFitColors.text.tertiary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Error Message */}
        {error ? (
          <View style={styles.errorContainer}>
            <IconSymbol name="exclamationmark.circle" size={14} color={MetaFitColors.error} />
            <ThemedText style={styles.errorText} lightColor={MetaFitColors.error}>
              {error}
            </ThemedText>
          </View>
        ) : null}

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
          onPress={handleLoginPress}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          <ThemedText style={styles.loginButtonText} lightColor={MetaFitColors.text.white}>
            {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
          </ThemedText>
        </TouchableOpacity>

        {/* Separator */}
        <View style={styles.separatorContainer}>
          <View style={styles.separatorLine} />
          <ThemedText style={styles.separatorText} lightColor={MetaFitColors.text.tertiary}>
            o continúa con
          </ThemedText>
          <View style={styles.separatorLine} />
        </View>

        {/* Social Login */}
        <TouchableOpacity
          style={styles.socialButton}
          onPress={handleSocialLogin}
          activeOpacity={0.8}
        >
          <Image
            source={require("@/assets/images/google-icon.png")}
            style={styles.googleIcon}
            contentFit="contain"
          />
          <ThemedText style={styles.socialButtonText} lightColor={MetaFitColors.text.secondary}>
            Google
          </ThemedText>
        </TouchableOpacity>

        {/* Register Link */}
        <View style={styles.registerContainer}>
          <ThemedText style={styles.registerQuestion} lightColor={MetaFitColors.text.secondary}>
            ¿No tienes cuenta?{" "}
          </ThemedText>
          <TouchableOpacity onPress={handleRegisterPress} activeOpacity={0.7}>
            <ThemedText style={styles.registerLink} lightColor={MetaFitColors.button.primary}>
              Registrarme
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MetaFitColors.background.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: MetaFitColors.background.card,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  headerSpacer: {
    width: 48,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  welcomeSection: {
    marginTop: 12,
    marginBottom: 36,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 36,
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 15,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
  },
  input: {
    height: 52,
    paddingHorizontal: 16,
    fontSize: 16,
    color: MetaFitColors.text.primary,
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 4,
  },
  passwordInput: {
    flex: 1,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 16,
    color: MetaFitColors.text.primary,
  },
  eyeIcon: {
    padding: 12,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
    padding: 12,
    backgroundColor: "rgba(252, 129, 129, 0.1)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(252, 129, 129, 0.25)",
  },
  errorText: {
    fontSize: 13,
    flex: 1,
  },
  loginButton: {
    backgroundColor: MetaFitColors.button.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 28,
    shadowColor: "#2C3E50",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  loginButtonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  separatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: MetaFitColors.border.light,
  },
  separatorText: {
    fontSize: 13,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: MetaFitColors.background.card,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    marginBottom: 36,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  socialButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  registerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  registerQuestion: {
    fontSize: 15,
  },
  registerLink: {
    fontSize: 15,
    fontWeight: "700",
  },
});
