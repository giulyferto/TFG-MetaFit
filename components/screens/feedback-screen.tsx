import type { DatosComida } from "@/components/formulario-comida/DetallesComidaCard";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { MetaFitColors } from "@/constants/theme";
import { guardarFeedback } from "@/utils/feedback";
import { generarFeedbackNutricional } from "@/utils/openai";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import Markdown from "react-native-markdown-display";

const FeedbackFoodImage = require("@/assets/images/feedback-food-image.png");

type FeedbackScreenProps = {
  onGuardarPress?: () => void;
  datosComida?: DatosComida;
  tipoComida?: string;
  registroComidaId?: string;
};

export function FeedbackScreen({ onGuardarPress, datosComida, tipoComida, registroComidaId }: FeedbackScreenProps) {
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [calificacion, setCalificacion] = useState<"Alta" | "Media" | "Baja" | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarFeedback = async () => {
      if (!datosComida) {
        setError("No se proporcionaron datos de la comida");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const feedback = await generarFeedbackNutricional(datosComida, tipoComida);
        setFeedbackText(feedback.texto);
        setCalificacion(feedback.calificacion);
      } catch (err: any) {
        console.error("Error al cargar feedback:", err);
        setError(err.message || "Error al generar el feedback");
        setFeedbackText(
          "No se pudo generar el feedback en este momento. Por favor, verifica tu conexión a internet e intenta nuevamente."
        );
        setCalificacion(null);
      } finally {
        setIsLoading(false);
      }
    };

    cargarFeedback();
  }, [datosComida, tipoComida]);

  const handleGuardar = async () => {
    try {
      if (!registroComidaId) {
        Alert.alert("Error", "No se encontró el registro de comida asociado");
        return;
      }

      if (!feedbackText || !calificacion) {
        Alert.alert("Error", "No hay feedback para guardar");
        return;
      }

      await guardarFeedback({
        texto: feedbackText,
        calificacion: calificacion,
        registroComidaId: registroComidaId,
      });

      if (onGuardarPress) {
        onGuardarPress();
      } else {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      console.error("Error al guardar feedback:", error);
      Alert.alert("Error", `No se pudo guardar el feedback: ${error.message || "Error desconocido"}`);
    }
  };

  const getCalificacionColor = () => {
    if (!calificacion) return MetaFitColors.text.tertiary;
    if (calificacion === "Alta") return MetaFitColors.calificacion.alta;
    if (calificacion === "Media") return MetaFitColors.calificacion.media;
    return MetaFitColors.calificacion.baja;
  };

  const getCalificacionBg = () => {
    if (!calificacion) return MetaFitColors.background.card;
    if (calificacion === "Alta") return "rgba(74, 158, 107, 0.1)";
    if (calificacion === "Media") return "rgba(201, 148, 58, 0.1)";
    return "rgba(201, 72, 72, 0.1)";
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
          Análisis nutricional
        </ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Rating badge */}
        {calificacion && (
          <View style={styles.ratingSection}>
            <View
              style={[
                styles.ratingBadge,
                { backgroundColor: getCalificacionBg() },
              ]}
            >
              <View style={[styles.ratingDot, { backgroundColor: getCalificacionColor() }]} />
              <ThemedText style={styles.ratingLabel} lightColor={MetaFitColors.text.secondary}>
                Calificación:
              </ThemedText>
              <ThemedText
                style={styles.ratingValue}
                lightColor={getCalificacionColor()}
              >
                {calificacion}
              </ThemedText>
            </View>
          </View>
        )}

        {/* Food image */}
        <View style={styles.imageSection}>
          <View style={styles.imageGlowRing}>
            <View style={styles.imageContainer}>
              <Image
                source={FeedbackFoodImage}
                style={styles.foodImage}
                contentFit="contain"
              />
            </View>
          </View>
        </View>

        {/* Feedback content */}
        <View style={styles.feedbackCard}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={MetaFitColors.button.primary} />
              <ThemedText
                style={styles.loadingText}
                lightColor={MetaFitColors.text.secondary}
              >
                Analizando tu comida con IA...
              </ThemedText>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <ThemedText style={styles.errorText} lightColor={MetaFitColors.error}>
                {error}
              </ThemedText>
            </View>
          ) : (
            <Markdown style={markdownStyles}>
              {feedbackText}
            </Markdown>
          )}
        </View>

        {/* Save button */}
        {!isLoading && (
          <TouchableOpacity
            style={styles.guardarButton}
            onPress={handleGuardar}
            activeOpacity={0.85}
          >
            <ThemedText style={styles.guardarButtonText} lightColor={MetaFitColors.text.white}>
              Guardar análisis
            </ThemedText>
          </TouchableOpacity>
        )}
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
  content: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
  ratingSection: {
    marginBottom: 20,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
  },
  ratingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  imageSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  imageGlowRing: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: MetaFitColors.background.elevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: MetaFitColors.border.accent,
    shadowColor: MetaFitColors.button.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 2,
  },
  imageContainer: {
    width: 148,
    height: 148,
    borderRadius: 74,
    overflow: "hidden",
    backgroundColor: MetaFitColors.background.card,
  },
  foodImage: {
    width: "100%",
    height: "100%",
  },
  feedbackCard: {
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    textAlign: "center",
  },
  errorContainer: {
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  guardarButton: {
    backgroundColor: MetaFitColors.button.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#2C3E50",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  guardarButtonText: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});

const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 14,
    lineHeight: 22,
    color: MetaFitColors.text.primary,
  },
  heading1: {
    fontSize: 20,
    fontWeight: "700",
    color: MetaFitColors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  heading2: {
    fontSize: 17,
    fontWeight: "700",
    color: MetaFitColors.text.primary,
    marginTop: 14,
    marginBottom: 6,
  },
  heading3: {
    fontSize: 15,
    fontWeight: "600",
    color: MetaFitColors.button.primary,
    marginTop: 12,
    marginBottom: 6,
  },
  heading4: {
    fontSize: 14,
    fontWeight: "600",
    color: MetaFitColors.text.primary,
    marginTop: 10,
    marginBottom: 4,
  },
  heading5: {
    fontSize: 14,
    fontWeight: "600",
    color: MetaFitColors.text.secondary,
    marginTop: 8,
    marginBottom: 4,
  },
  heading6: {
    fontSize: 14,
    fontWeight: "600",
    color: MetaFitColors.text.secondary,
    marginTop: 6,
    marginBottom: 4,
  },
  strong: {
    fontWeight: "700",
    color: MetaFitColors.text.primary,
  },
  em: {
    fontStyle: "italic",
    color: MetaFitColors.text.secondary,
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
    color: MetaFitColors.text.primary,
  },
  bullet_list: {
    marginTop: 8,
    marginBottom: 8,
  },
  ordered_list: {
    marginTop: 8,
    marginBottom: 8,
  },
  list_item: {
    marginBottom: 6,
  },
  paragraph: {
    marginTop: 8,
    marginBottom: 8,
  },
  code_inline: {
    backgroundColor: MetaFitColors.background.elevated,
    color: MetaFitColors.button.primary,
    borderRadius: 4,
    paddingHorizontal: 4,
    fontSize: 13,
  },
});
