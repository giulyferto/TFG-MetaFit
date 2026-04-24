import { IconSymbol } from "@/components/ui/icon-symbol";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { MetaFitColors } from "@/constants/theme";
import { auth, db } from "@/firebase";
import {
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { collection, deleteDoc, getDocs, query, where } from "firebase/firestore";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function MiCuentaScreen() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  const handleChangePassword = async () => {
    if (!currentPassword) {
      Alert.alert("Error", "Ingresa tu contraseña actual");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Error", "La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }

    const user = auth.currentUser;
    if (!user || !user.email) return;

    setIsSaving(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert("Listo", "Contraseña actualizada correctamente");
    } catch (error: any) {
      const msg =
        error.code === "auth/wrong-password" || error.code === "auth/invalid-credential"
          ? "La contraseña actual es incorrecta"
          : error.message || "Error desconocido";
      Alert.alert("Error", msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Eliminar cuenta",
      "Esta acción eliminará tu cuenta y todos tus datos de forma permanente. No se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar cuenta",
          style: "destructive",
          onPress: confirmDeleteAccount,
        },
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    if (!deletePassword) {
      Alert.alert("Error", "Ingresa tu contraseña para confirmar");
      return;
    }

    const user = auth.currentUser;
    if (!user || !user.email) return;

    setIsDeleting(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, deletePassword);
      await reauthenticateWithCredential(user, credential);

      // Delete all user data from Firestore
      const userId = user.uid;
      const collections = ["registrosComidas", "feedback", "comidas", "informacionNutricional"];
      await Promise.all(
        collections.map(async (col) => {
          const q = query(collection(db, col), where("userId", "==", userId));
          const snap = await getDocs(q);
          return Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
        })
      );

      await deleteUser(user);
      router.replace("/login");
    } catch (error: any) {
      const msg =
        error.code === "auth/wrong-password" || error.code === "auth/invalid-credential"
          ? "La contraseña es incorrecta"
          : error.message || "Error desconocido";
      Alert.alert("Error", msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ThemedView style={styles.container} lightColor={MetaFitColors.background.white}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={20} color={MetaFitColors.text.secondary} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle} lightColor={MetaFitColors.text.primary}>
          Mi cuenta
        </ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Change password section */}
        <ThemedText style={styles.sectionLabel} lightColor={MetaFitColors.text.secondary}>
          Cambiar contraseña
        </ThemedText>
        <View style={styles.card}>
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.fieldLabel} lightColor={MetaFitColors.text.secondary}>
              Contraseña actual
            </ThemedText>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={MetaFitColors.text.tertiary}
              autoCapitalize="none"
            />
          </View>
          <View style={styles.separator} />
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.fieldLabel} lightColor={MetaFitColors.text.secondary}>
              Nueva contraseña
            </ThemedText>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={MetaFitColors.text.tertiary}
              autoCapitalize="none"
            />
          </View>
          <View style={styles.separator} />
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.fieldLabel} lightColor={MetaFitColors.text.secondary}>
              Confirmar nueva contraseña
            </ThemedText>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder="Repetir nueva contraseña"
              placeholderTextColor={MetaFitColors.text.tertiary}
              autoCapitalize="none"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, isSaving && styles.buttonDisabled]}
          onPress={handleChangePassword}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={MetaFitColors.text.white} />
          ) : (
            <ThemedText style={styles.primaryButtonText} lightColor={MetaFitColors.text.white}>
              Guardar nueva contraseña
            </ThemedText>
          )}
        </TouchableOpacity>

        {/* Delete account section */}
        <ThemedText style={[styles.sectionLabel, styles.dangerLabel]} lightColor={MetaFitColors.calificacion.baja}>
          Zona de peligro
        </ThemedText>
        <View style={[styles.card, styles.dangerCard]}>
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.fieldLabel} lightColor={MetaFitColors.text.secondary}>
              Confirma tu contraseña para eliminar la cuenta
            </ThemedText>
            <TextInput
              style={styles.input}
              value={deletePassword}
              onChangeText={setDeletePassword}
              secureTextEntry
              placeholder="Tu contraseña actual"
              placeholderTextColor={MetaFitColors.text.tertiary}
              autoCapitalize="none"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.dangerButton, isDeleting && styles.buttonDisabled]}
          onPress={handleDeleteAccount}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color={MetaFitColors.text.white} />
          ) : (
            <ThemedText style={styles.primaryButtonText} lightColor={MetaFitColors.text.white}>
              Eliminar mi cuenta
            </ThemedText>
          )}
        </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 10,
    marginTop: 8,
  },
  dangerLabel: {
    marginTop: 32,
  },
  card: {
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    marginBottom: 16,
    overflow: "hidden",
  },
  dangerCard: {
    borderColor: "rgba(201, 72, 72, 0.25)",
    backgroundColor: "rgba(201, 72, 72, 0.04)",
  },
  fieldGroup: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  input: {
    fontSize: 15,
    color: MetaFitColors.text.primary,
    paddingVertical: 4,
  },
  separator: {
    height: 1,
    backgroundColor: MetaFitColors.border.light,
    marginHorizontal: 16,
  },
  primaryButton: {
    backgroundColor: MetaFitColors.button.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#2C3E50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  dangerButton: {
    backgroundColor: MetaFitColors.calificacion.baja,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#C94848",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
