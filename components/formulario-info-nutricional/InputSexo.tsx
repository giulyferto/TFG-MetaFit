import { IconSymbol } from "@/components/ui/icon-symbol";
import { MetaFitColors } from "@/constants/theme";
import { TextInput, TouchableOpacity, View } from "react-native";
import { estilos } from "./estilos";
import { ModalSexo } from "./ModalSexo";

type InputSexoProps = {
  valor: string;
  mostrarModal: boolean;
  onAbrirModal: () => void;
  onCerrarModal: () => void;
  onSeleccionar: (sexo: "Masculino" | "Femenino") => void;
  editable?: boolean;
};

export function InputSexo({
  valor,
  mostrarModal,
  onAbrirModal,
  onCerrarModal,
  onSeleccionar,
  editable = true,
}: InputSexoProps) {
  return (
    <>
      <TouchableOpacity
        style={[estilos.contenedorInput, !editable && estilos.contenedorInputReadOnly]}
        onPress={editable ? onAbrirModal : undefined}
        activeOpacity={editable ? 0.7 : 1}
        disabled={!editable}
      >
        <View style={estilos.contenedorInputConChevron}>
          <TextInput
            style={[estilos.input, !editable && estilos.inputReadOnly]}
            placeholder="Sexo"
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

      <ModalSexo
        visible={mostrarModal}
        valorSeleccionado={valor}
        onSeleccionar={onSeleccionar}
        onCerrar={onCerrarModal}
      />
    </>
  );
}

