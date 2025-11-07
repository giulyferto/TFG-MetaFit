import { ThemedText } from "@/components/themed-text";
import { MetaFitColors } from "@/constants/theme";
import { Modal, Pressable, ScrollView, TouchableOpacity, View } from "react-native";
import { estilos } from "./estilos";

const OBJETIVOS_NUTRICIONALES = [
  "Perder peso",
  "Ganar peso",
  "Mantener peso",
  "Ganar masa muscular",
  "Mejorar condición física",
  "Reducir grasa corporal",
  "Aumentar energía",
  "Mejorar digestión",
  "Mejorar rendimiento deportivo",
  "Alimentación saludable",
] as const;

export type ObjetivoNutricional = (typeof OBJETIVOS_NUTRICIONALES)[number];

type ModalObjetivosProps = {
  visible: boolean;
  valorSeleccionado: string;
  onSeleccionar: (objetivo: ObjetivoNutricional) => void;
  onCerrar: () => void;
};

export function ModalObjetivos({
  visible,
  valorSeleccionado,
  onSeleccionar,
  onCerrar,
}: ModalObjetivosProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCerrar}
    >
      <Pressable
        style={estilos.overlayModal}
        onPress={onCerrar}
      >
        <View
          style={estilos.contenidoModal}
          onStartShouldSetResponder={() => true}
          onResponderTerminationRequest={() => false}
        >
          <ThemedText
            style={estilos.tituloModal}
            lightColor={MetaFitColors.text.primary}
          >
            Seleccionar Objetivo
          </ThemedText>
          <ScrollView
            style={{ maxHeight: 350 }}
            contentContainerStyle={{ paddingBottom: 8 }}
            showsVerticalScrollIndicator={true}
            scrollEnabled={true}
            bounces={true}
          >
            {OBJETIVOS_NUTRICIONALES.map((objetivo) => (
              <TouchableOpacity
                key={objetivo}
                style={[
                  estilos.opcionModal,
                  valorSeleccionado === objetivo &&
                    estilos.opcionModalSeleccionada,
                ]}
                onPress={() => {
                  onSeleccionar(objetivo);
                  onCerrar();
                }}
              >
                <ThemedText
                  style={[
                    estilos.textoOpcionModal,
                    valorSeleccionado === objetivo &&
                      estilos.textoOpcionModalSeleccionada,
                  ]}
                  lightColor={
                    valorSeleccionado === objetivo
                      ? MetaFitColors.text.primary
                      : MetaFitColors.text.secondary
                  }
                >
                  {objetivo}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={estilos.botonCancelarModal}
            onPress={onCerrar}
          >
            <ThemedText
              style={estilos.textoCancelarModal}
              lightColor={MetaFitColors.text.secondary}
            >
              Cancelar
            </ThemedText>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

