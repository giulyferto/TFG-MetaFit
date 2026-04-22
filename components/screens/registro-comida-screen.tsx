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

type MenuOption = {
  title: string;
  description: string;
  icon: string;
  accentColor: string;
  onPress: () => void;
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
      console.log("Registro manual");
    }
  };

  const handleCargarImagenComida = () => {
    if (onCargarImagenComidaPress) {
      onCargarImagenComidaPress();
    } else {
      console.log("Cargar imagen de mi comida");
    }
  };

  const handleCargarImagenEtiqueta = () => {
    if (onCargarImagenEtiquetaPress) {
      onCargarImagenEtiquetaPress();
    } else {
      console.log("Cargar imagen etiqueta nutricional");
    }
  };

  const menuOptions: MenuOption[] = [
    {
      title: "Registro manual",
      description: "Ingresa los datos nutricionales de tu comida manualmente",
      icon: "pencil.and.list.clipboard",
      accentColor: MetaFitColors.button.primary,
      onPress: handleRegistroManual,
    },
    {
      title: "Foto de mi comida",
      description: "Toma o sube una foto y la IA analizará tu comida",
      icon: "camera.fill",
      accentColor: "#A78BFA",
      onPress: handleCargarImagenComida,
    },
    {
      title: "Etiqueta nutricional",
      description: "Escanea la etiqueta del producto para importar sus datos",
      icon: "barcode.viewfinder",
      accentColor: MetaFitColors.calificacion.media,
      onPress: handleCargarImagenEtiqueta,
    },
  ];

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
          Registrar comida
        </ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Subtitle */}
        <ThemedText style={styles.subtitle} lightColor={MetaFitColors.text.secondary}>
          ¿Cómo quieres registrar tu comida?
        </ThemedText>

        {/* Option cards */}
        <View style={styles.optionsList}>
          {menuOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionCard}
              onPress={option.onPress}
              activeOpacity={0.75}
            >
              {/* Left accent stripe */}
              <View style={[styles.accentStripe, { backgroundColor: option.accentColor }]} />

              {/* Icon */}
              <View style={[styles.iconContainer, { backgroundColor: `${option.accentColor}18` }]}>
                <IconSymbol
                  name={option.icon as any}
                  size={24}
                  color={option.accentColor}
                />
              </View>

              {/* Text */}
              <View style={styles.optionTextGroup}>
                <ThemedText style={styles.optionTitle} lightColor={MetaFitColors.text.primary}>
                  {option.title}
                </ThemedText>
                <ThemedText style={styles.optionDescription} lightColor={MetaFitColors.text.secondary}>
                  {option.description}
                </ThemedText>
              </View>

              {/* Chevron */}
              <IconSymbol
                name="chevron.right"
                size={16}
                color={MetaFitColors.text.tertiary}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Info note */}
        <View style={styles.infoNote}>
          <IconSymbol
            name="sparkles"
            size={14}
            color={MetaFitColors.button.primary}
          />
          <ThemedText style={styles.infoNoteText} lightColor={MetaFitColors.text.secondary}>
            La IA analizará tu comida y te dará retroalimentación nutricional personalizada
          </ThemedText>
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 48,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 24,
  },
  optionsList: {
    gap: 12,
    marginBottom: 28,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    overflow: "hidden",
    paddingRight: 16,
    gap: 14,
  },
  accentStripe: {
    width: 4,
    height: "100%",
    minHeight: 80,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
  },
  optionTextGroup: {
    flex: 1,
    paddingVertical: 18,
    gap: 4,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  optionDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  infoNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 14,
    backgroundColor: MetaFitColors.background.elevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: MetaFitColors.border.accent,
  },
  infoNoteText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
});
