import { IconSymbol } from "@/components/ui/icon-symbol";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { MetaFitColors } from "@/constants/theme";
import { router } from "expo-router";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

type RegistroComidaScreenProps = {
  onRegistroManualPress?: () => void;
  onCargarImagenComidaPress?: () => void;
  onCargarImagenEtiquetaPress?: () => void;
};

export function RegistroComidaScreen({
  onRegistroManualPress,
  onCargarImagenComidaPress,
  onCargarImagenEtiquetaPress,
}: RegistroComidaScreenProps) {
  const handleRegistroManual = () => {
    if (onRegistroManualPress) {
      onRegistroManualPress();
    } else {
      // Navegar a la pantalla de registro manual (cuando se cree)
      console.log("Registro manual");
    }
  };

  const handleCargarImagenComida = () => {
    if (onCargarImagenComidaPress) {
      onCargarImagenComidaPress();
    } else {
      // Navegar a la pantalla de cargar imagen de comida (cuando se cree)
      console.log("Cargar imagen de mi comida");
    }
  };

  const handleCargarImagenEtiqueta = () => {
    if (onCargarImagenEtiquetaPress) {
      onCargarImagenEtiquetaPress();
    } else {
      // Navegar a la pantalla de cargar imagen de etiqueta (cuando se cree)
      console.log("Cargar imagen etiqueta nutricional");
    }
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
          Registro de comida
        </ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Botones del menú */}
        <TouchableOpacity style={styles.menuButton} onPress={handleRegistroManual}>
          <ThemedText style={styles.menuButtonText} lightColor={MetaFitColors.text.primary}>
            Registro manual
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={handleCargarImagenComida}
        >
          <ThemedText style={styles.menuButtonText} lightColor={MetaFitColors.text.primary}>
            Cargar imagen de mi comida
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={handleCargarImagenEtiqueta}
        >
          <ThemedText style={styles.menuButtonText} lightColor={MetaFitColors.text.primary}>
            Cargar imagen etiqueta nutricional
          </ThemedText>
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
    paddingTop: 30,
  },
  menuButton: {
    backgroundColor: MetaFitColors.button.secondary,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: "center",
  },
  menuButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: MetaFitColors.text.primary,
  },
});

