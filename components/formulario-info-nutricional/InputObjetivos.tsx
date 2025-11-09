import { IconSymbol } from "@/components/ui/icon-symbol";
import { MetaFitColors } from "@/constants/theme";
import { TextInput, TouchableOpacity, View } from "react-native";
import { estilos } from "./estilos";
import { ModalObjetivos, type ObjetivoNutricional } from "./ModalObjetivos";

type InputObjetivosProps = {
  valor: string;
  mostrarModal: boolean;
  onAbrirModal: () => void;
  onCerrarModal: () => void;
  onSeleccionar: (objetivo: ObjetivoNutricional) => void;
  editable?: boolean;
};

export function InputObjetivos({
  valor,
  mostrarModal,
  onAbrirModal,
  onCerrarModal,
  onSeleccionar,
  editable = true,
}: InputObjetivosProps) {
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
            placeholder="Objetivos"
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

      <ModalObjetivos
        visible={mostrarModal}
        valorSeleccionado={valor}
        onSeleccionar={onSeleccionar}
        onCerrar={onCerrarModal}
      />
    </>
  );
}

