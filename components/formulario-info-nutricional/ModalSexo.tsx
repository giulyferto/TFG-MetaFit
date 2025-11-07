import { ThemedText } from "@/components/themed-text";
import { MetaFitColors } from "@/constants/theme";
import { Modal, TouchableOpacity, View } from "react-native";
import { estilos } from "./estilos";

type ModalSexoProps = {
  visible: boolean;
  valorSeleccionado: string;
  onSeleccionar: (sexo: "Masculino" | "Femenino") => void;
  onCerrar: () => void;
};

export function ModalSexo({
  visible,
  valorSeleccionado,
  onSeleccionar,
  onCerrar,
}: ModalSexoProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCerrar}
    >
      <TouchableOpacity
        style={estilos.overlayModal}
        activeOpacity={1}
        onPress={onCerrar}
      >
        <View
          style={estilos.contenidoModal}
          onStartShouldSetResponder={() => true}
        >
          <ThemedText
            style={estilos.tituloModal}
            lightColor={MetaFitColors.text.primary}
          >
            Seleccionar Sexo
          </ThemedText>
          <TouchableOpacity
            style={[
              estilos.opcionModal,
              valorSeleccionado === "Masculino" &&
                estilos.opcionModalSeleccionada,
            ]}
            onPress={() => {
              onSeleccionar("Masculino");
              onCerrar();
            }}
          >
            <ThemedText
              style={[
                estilos.textoOpcionModal,
                valorSeleccionado === "Masculino" &&
                  estilos.textoOpcionModalSeleccionada,
              ]}
              lightColor={
                valorSeleccionado === "Masculino"
                  ? MetaFitColors.text.primary
                  : MetaFitColors.text.secondary
              }
            >
              Masculino
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              estilos.opcionModal,
              valorSeleccionado === "Femenino" &&
                estilos.opcionModalSeleccionada,
            ]}
            onPress={() => {
              onSeleccionar("Femenino");
              onCerrar();
            }}
          >
            <ThemedText
              style={[
                estilos.textoOpcionModal,
                valorSeleccionado === "Femenino" &&
                  estilos.textoOpcionModalSeleccionada,
              ]}
              lightColor={
                valorSeleccionado === "Femenino"
                  ? MetaFitColors.text.primary
                  : MetaFitColors.text.secondary
              }
            >
              Femenino
            </ThemedText>
          </TouchableOpacity>
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
      </TouchableOpacity>
    </Modal>
  );
}

