import { IconSymbol } from "@/components/ui/icon-symbol";
import { MetaFitColors } from "@/constants/theme";
import { TextInput, TouchableOpacity, View } from "react-native";
import { estilos } from "./estilos";
import {
    ModalPreferenciaNutricional,
    type PreferenciaNutricional,
} from "./ModalPreferenciaNutricional";

type InputPreferenciaNutricionalProps = {
  valor: string;
  mostrarModal: boolean;
  onAbrirModal: () => void;
  onCerrarModal: () => void;
  onSeleccionar: (preferencia: PreferenciaNutricional) => void;
};

export function InputPreferenciaNutricional({
  valor,
  mostrarModal,
  onAbrirModal,
  onCerrarModal,
  onSeleccionar,
}: InputPreferenciaNutricionalProps) {
  return (
    <>
      <TouchableOpacity
        style={estilos.contenedorInput}
        onPress={onAbrirModal}
        activeOpacity={0.7}
      >
        <View style={estilos.contenedorInputConChevron}>
          <TextInput
            style={estilos.input}
            placeholder="Preferencia nutricional"
            placeholderTextColor={MetaFitColors.text.tertiary}
            value={valor}
            editable={false}
            pointerEvents="none"
          />
          <View style={estilos.contenedorChevron}>
            <IconSymbol
              name="chevron.right"
              size={20}
              color={MetaFitColors.text.tertiary}
            />
          </View>
        </View>
      </TouchableOpacity>

      <ModalPreferenciaNutricional
        visible={mostrarModal}
        valorSeleccionado={valor}
        onSeleccionar={onSeleccionar}
        onCerrar={onCerrarModal}
      />
    </>
  );
}

