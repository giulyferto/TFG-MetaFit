import { ThemedText } from "@/components/ui/themed-text";
import { MetaFitColors } from "@/constants/theme";
import { Modal, Pressable, ScrollView, TouchableOpacity, View } from "react-native";
import { estilos } from "./estilos";

const PREFERENCIAS_NUTRICIONALES = [
  "Vegana",
  "Vegetariana",
  "Omnívora",
  "Paleo",
  "Keto",
  "Mediterránea",
  "Sin gluten",
  "Sin lactosa",
  "Pescetariana",
  "Flexitariana",
] as const;

export type PreferenciaNutricional = (typeof PREFERENCIAS_NUTRICIONALES)[number];

type ModalPreferenciaNutricionalProps = {
  visible: boolean;
  valorSeleccionado: string;
  onSeleccionar: (preferencia: PreferenciaNutricional) => void;
  onCerrar: () => void;
};

export function ModalPreferenciaNutricional({
  visible,
  valorSeleccionado,
  onSeleccionar,
  onCerrar,
}: ModalPreferenciaNutricionalProps) {
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
            Seleccionar Preferencia Nutricional
          </ThemedText>
          <ScrollView
            style={{ maxHeight: 350 }}
            contentContainerStyle={{ paddingBottom: 8 }}
            showsVerticalScrollIndicator={true}
            scrollEnabled={true}
            bounces={true}
          >
            {PREFERENCIAS_NUTRICIONALES.map((preferencia) => (
              <TouchableOpacity
                key={preferencia}
                style={[
                  estilos.opcionModal,
                  valorSeleccionado === preferencia &&
                    estilos.opcionModalSeleccionada,
                ]}
                onPress={() => {
                  onSeleccionar(preferencia);
                  onCerrar();
                }}
              >
                <ThemedText
                  style={[
                    estilos.textoOpcionModal,
                    valorSeleccionado === preferencia &&
                      estilos.textoOpcionModalSeleccionada,
                  ]}
                  lightColor={
                    valorSeleccionado === preferencia
                      ? MetaFitColors.text.primary
                      : MetaFitColors.text.secondary
                  }
                >
                  {preferencia}
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

