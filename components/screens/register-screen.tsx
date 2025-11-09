import { IconSymbol } from "@/components/ui/icon-symbol";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { MetaFitColors } from "@/constants/theme";
import { auth } from "@/firebase";
import { Image } from "expo-image";
import { router } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type RegisterScreenProps = {
  onRegisterPress?: () => void;
  onLoginPress?: () => void;
};

export function RegisterScreen({
  onRegisterPress,
  onLoginPress,
}: RegisterScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Validar formato de email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validar contraseña (mínimo 6 caracteres)
  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const handleRegisterPress = async () => {
    // Limpiar errores previos
    setError("");

    // Validaciones
    if (!email.trim()) {
      setError("Por favor ingresa tu email");
      return;
    }

    if (!validateEmail(email)) {
      setError("Por favor ingresa un email válido");
      return;
    }

    if (!password) {
      setError("Por favor ingresa una contraseña");
      return;
    }

    if (!validatePassword(password)) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setIsLoading(true);

    try {
      // Registrar usuario en Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      console.log("Usuario registrado exitosamente:", userCredential.user.email);

      // Los usuarios nuevos no tienen perfil nutricional, redirigir al formulario
      // Si hay un callback personalizado, usarlo
      if (onRegisterPress) {
        onRegisterPress();
      } else {
        // Navegar directamente al formulario de información nutricional
        router.replace("/info-nutricional");
      }
    } catch (error: any) {
      console.error("Error al registrar usuario:", error);
      
      // Manejar errores específicos de Firebase
      let errorMessage = "Error al registrar usuario. Por favor intenta de nuevo.";
      
      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "Este email ya está registrado. Por favor inicia sesión.";
          break;
        case "auth/invalid-email":
          errorMessage = "El formato del email no es válido.";
          break;
        case "auth/weak-password":
          errorMessage = "La contraseña es muy débil. Debe tener al menos 6 caracteres.";
          break;
        case "auth/network-request-failed":
          errorMessage = "Error de conexión. Verifica tu internet.";
          break;
        default:
          errorMessage = error.message || errorMessage;
      }
      
      setError(errorMessage);
      Alert.alert("Error de registro", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginPress = () => {
    if (onLoginPress) {
      onLoginPress();
    } else {
      router.back();
    }
  };

  const handleSocialRegister = () => {
    // Aquí irá la lógica de registro con Google cuando se integre Firebase
    console.log("Registrar con Google");
    router.replace("/bienvenida");
  };

  return (
    <ThemedView style={styles.container} lightColor={MetaFitColors.background.white}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLoginPress} style={styles.backButton}>
          <IconSymbol
            name="chevron.left"
            size={24}
            color={MetaFitColors.text.primary}
          />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle} lightColor={MetaFitColors.text.primary}>
          Registrarse
        </ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Input Fields */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={MetaFitColors.text.tertiary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.passwordInputWrapper}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Contraseña"
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
                size={20}
                color={MetaFitColors.text.secondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.passwordInputWrapper}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirmar Contraseña"
              placeholderTextColor={MetaFitColors.text.tertiary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
            >
              <IconSymbol
                name={showConfirmPassword ? "eye.slash" : "eye"}
                size={20}
                color={MetaFitColors.text.secondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Error Message */}
        {error ? (
          <View style={styles.errorContainer}>
            <ThemedText style={styles.errorText} lightColor={MetaFitColors.error}>
              {error}
            </ThemedText>
          </View>
        ) : null}

        {/* Register Button */}
        <TouchableOpacity
          style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
          onPress={handleRegisterPress}
          disabled={isLoading}
        >
          <ThemedText style={styles.registerButtonText} lightColor={MetaFitColors.text.white}>
            {isLoading ? "Registrando..." : "Registrarme"}
          </ThemedText>
        </TouchableOpacity>

        {/* Separator */}
        <View style={styles.separatorContainer}>
          <View style={styles.separatorLine} />
          <ThemedText style={styles.separatorText} lightColor={MetaFitColors.text.secondary}>
            O
          </ThemedText>
          <View style={styles.separatorLine} />
        </View>

        <ThemedText style={styles.socialTitle} lightColor={MetaFitColors.text.secondary}>
          Registrarme con
        </ThemedText>

        {/* Social Media Icons */}
        <View style={styles.socialContainer}>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={handleSocialRegister}
          >
            <Image
              source={require("@/assets/images/google-icon.png")}
              style={styles.googleIcon}
              contentFit="contain"
            />
          </TouchableOpacity>
        </View>

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <ThemedText style={styles.loginQuestion} lightColor={MetaFitColors.text.secondary}>
            ¿Ya tienes una cuenta?{" "}
          </ThemedText>
          <TouchableOpacity onPress={handleLoginPress}>
            <ThemedText style={styles.loginLink} lightColor={MetaFitColors.button.primary}>
              Log in
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
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: MetaFitColors.border.divider,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: MetaFitColors.background.white,
    color: MetaFitColors.text.primary,
  },
  passwordInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    borderRadius: 12,
    backgroundColor: MetaFitColors.background.white,
    paddingRight: 16,
  },
  passwordInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 16,
    fontSize: 16,
    color: MetaFitColors.text.primary,
  },
  eyeIcon: {
    padding: 4,
  },
  registerButton: {
    backgroundColor: MetaFitColors.button.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: MetaFitColors.text.white,
  },
  errorContainer: {
    marginTop: 10,
    marginBottom: 10,
    padding: 12,
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: MetaFitColors.error,
  },
  errorText: {
    fontSize: 14,
    color: MetaFitColors.error,
    textAlign: "center",
  },
  separatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 30,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: MetaFitColors.border.divider,
  },
  separatorText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: MetaFitColors.text.secondary,
  },
  socialTitle: {
    fontSize: 20,
    textAlign: "center",
    marginBottom: 20,
    color: MetaFitColors.text.secondary,
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    marginBottom: 40,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: MetaFitColors.background.white,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    justifyContent: "center",
    alignItems: "center",
  },
  googleIcon: {
    width: 24,
    height: 24,
  },
  loginContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loginQuestion: {
    fontSize: 18,
    color: MetaFitColors.text.secondary,
  },
  loginLink: {
    fontSize: 18,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});

