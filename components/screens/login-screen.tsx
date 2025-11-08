import { IconSymbol } from "@/components/ui/icon-symbol";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { MetaFitColors } from "@/constants/theme";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import {
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

  const handleLoginPress = () => {
    if (onLoginPress) {
      onLoginPress();
    } else {
      // Navegar a la pantalla de inicio después del login
      router.replace("/(tabs)");
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

  const handleSocialLogin = () => {
    // Aquí irá la lógica de login con Google cuando se integre Firebase
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
            size={24}
            color={MetaFitColors.text.primary}
          />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle} lightColor={MetaFitColors.text.primary}>
          Log In
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

        {/* Login Button */}
        <TouchableOpacity style={styles.loginButton} onPress={handleLoginPress}>
          <ThemedText style={styles.loginButtonText} lightColor={MetaFitColors.text.white}>
            Log In
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
          Log in with
        </ThemedText>

        {/* Social Media Icons */}
        <View style={styles.socialContainer}>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={handleSocialLogin}
          >
            <Image
              source={require("@/assets/images/google-icon.png")}
              style={styles.googleIcon}
              contentFit="contain"
            />
          </TouchableOpacity>
        </View>

        {/* Register Link */}
        <View style={styles.registerContainer}>
          <ThemedText style={styles.registerQuestion} lightColor={MetaFitColors.text.secondary}>
            ¿No tienes cuenta?{" "}
          </ThemedText>
          <TouchableOpacity onPress={handleRegisterPress}>
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
  loginButton: {
    backgroundColor: MetaFitColors.button.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: MetaFitColors.text.white,
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
    fontSize: 14,
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
  registerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  registerQuestion: {
    fontSize: 14,
    color: MetaFitColors.text.secondary,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
