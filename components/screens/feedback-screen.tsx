import { IconSymbol } from "@/components/ui/icon-symbol";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { MetaFitColors } from "@/constants/theme";
import { Image } from "expo-image";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const FeedbackFoodImage = require("@/assets/images/feedback-food-image.png");

type FeedbackScreenProps = {
  onGuardarPress?: () => void;
};

export function FeedbackScreen({ onGuardarPress }: FeedbackScreenProps) {
  const handleGuardar = () => {
    if (onGuardarPress) {
      onGuardarPress();
    } else {
      // Aquí irá la lógica para guardar el feedback cuando se integre Firebase
      console.log("Guardar feedback");
      router.back();
    }
  };

  // Texto hardcodeado por ahora (será generado con OpenAI en el futuro)
  const feedbackText =
    "Para un plan orientado al **aumento de masa muscular**, este alimento representa una **buena fuente de energía** que ayuda a reponer el glucógeno muscular después del entrenamiento. Sin embargo, su **aporte proteico es bajo**, por lo que se recomienda combinarlo con una fuente de proteínas magras como pollo, atún, huevo o legumbres, para favorecer la recuperación y el crecimiento muscular.";

  const calificacion = "Alto";

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
          Feedback
        </ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {/* Calificación */}
        <View style={styles.calificacionContainer}>
          <ThemedText style={styles.calificacionLabel} lightColor={MetaFitColors.text.primary}>
            Calificación:{" "}
          </ThemedText>
          <ThemedText
            style={styles.calificacionValue}
            lightColor={MetaFitColors.calificacion.alto}
          >
            {calificacion}
          </ThemedText>
        </View>

        {/* Ilustración del plato */}
        <View style={styles.platoContainer}>
          <View style={styles.plato}>
            <Image
              source={FeedbackFoodImage}
              style={styles.platoImage}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Texto de feedback */}
        <View style={styles.feedbackContainer}>
          <Text style={styles.feedbackText}>
            {feedbackText.split("**").map((part, index) => {
              // Alternar entre texto normal y texto en negrita
              if (index % 2 === 0) {
                return <Text key={index}>{part}</Text>;
              } else {
                return (
                  <Text key={index} style={styles.feedbackBold}>
                    {part}
                  </Text>
                );
              }
            })}
          </Text>
        </View>

        {/* Botón Guardar Feedback */}
        <TouchableOpacity style={styles.guardarButton} onPress={handleGuardar}>
          <ThemedText style={styles.guardarButtonText} lightColor={MetaFitColors.text.white}>
            Guardar Feedback
          </ThemedText>
        </TouchableOpacity>
      </View>
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
  content: {
    flex: 1,
    padding: 20,
  },
  calificacionContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  calificacionLabel: {
    fontSize: 16,
    fontWeight: "400",
  },
  calificacionValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  platoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  plato: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: MetaFitColors.background.beige,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: MetaFitColors.border.light,
    overflow: "hidden",
  },
  platoImage: {
    width: "100%",
    height: "100%",
  },
  feedbackContainer: {
    backgroundColor: MetaFitColors.background.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
  },
  feedbackText: {
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 22,
    color: MetaFitColors.text.primary,
  },
  feedbackBold: {
    fontWeight: "600",
  },
  guardarButton: {
    backgroundColor: MetaFitColors.button.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  guardarButtonText: {
    fontSize: 18,
    fontWeight: "600",
  },
});

