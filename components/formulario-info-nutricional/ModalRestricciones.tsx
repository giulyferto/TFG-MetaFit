import { ThemedText } from "@/components/ui/themed-text";
import { MetaFitColors } from "@/constants/theme";
import { Modal, Pressable, ScrollView, TouchableOpacity, View } from "react-native";
import { estilos } from "./estilos";

const RESTRICCIONES_NUTRICIONALES = [
  "Nueces",
  "Maní",
  "Mariscos",
  "Huevos",
  "Lácteos",
  "Soja",
  "Trigo",
  "Gluten",
  "Pescado",
  "Carne",
  "Carnes rojas",
  "Carnes blancas",
] as const;

export type RestriccionNutricional = (typeof RESTRICCIONES_NUTRICIONALES)[number];

type ModalRestriccionesProps = {
  visible: boolean;
  valoresSeleccionados: string[];
  onSeleccionar: (restriccion: RestriccionNutricional) => void;
  onCerrar: () => void;
};

export function ModalRestricciones({
  visible,
  valoresSeleccionados,
  onSeleccionar,
  onCerrar,
}: ModalRestriccionesProps) {
  const estaSeleccionada = (restriccion: RestriccionNutricional) => {
    return valoresSeleccionados.includes(restriccion);
  };

  const manejarToggle = (restriccion: RestriccionNutricional) => {
    onSeleccionar(restriccion);
  };

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
            Seleccionar Restricciones
          </ThemedText>
          <ThemedText
            style={{ fontSize: 14, marginBottom: 16, textAlign: "center" }}
            lightColor={MetaFitColors.text.secondary}
          >
            Puedes seleccionar múltiples opciones
          </ThemedText>
          <ScrollView
            style={{ maxHeight: 400 }}
            contentContainerStyle={{ paddingBottom: 8 }}
            showsVerticalScrollIndicator={true}
            scrollEnabled={true}
            bounces={true}
          >
            {RESTRICCIONES_NUTRICIONALES.map((restriccion) => {
              const seleccionada = estaSeleccionada(restriccion);
              return (
                <TouchableOpacity
                  key={restriccion}
                  style={[
                    estilos.opcionModal,
                    seleccionada && estilos.opcionModalSeleccionada,
                  ]}
                  onPress={() => manejarToggle(restriccion)}
                >
                  <ThemedText
                    style={[
                      estilos.textoOpcionModal,
                      seleccionada && estilos.textoOpcionModalSeleccionada,
                    ]}
                    lightColor={
                      seleccionada
                        ? MetaFitColors.text.primary
                        : MetaFitColors.text.secondary
                    }
                  >
                    {restriccion}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity
            style={estilos.botonCancelarModal}
            onPress={onCerrar}
          >
            <ThemedText
              style={estilos.textoCancelarModal}
              lightColor={MetaFitColors.text.secondary}
            >
              Cerrar
            </ThemedText>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

