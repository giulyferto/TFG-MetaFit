import { IconSymbol } from "@/components/ui/icon-symbol";
import { MetaFitColors } from "@/constants/theme";
import { TextInput, TouchableOpacity, View } from "react-native";
import { estilos } from "./estilos";
import {
  ModalRestricciones,
  type RestriccionNutricional,
} from "./ModalRestricciones";

type InputRestriccionesProps = {
  valores: string[];
  mostrarModal: boolean;
  onAbrirModal: () => void;
  onCerrarModal: () => void;
  onToggleRestriccion: (restriccion: RestriccionNutricional) => void;
  editable?: boolean;
};

export function InputRestricciones({
  valores,
  mostrarModal,
  onAbrirModal,
  onCerrarModal,
  onToggleRestriccion,
  editable = true,
}: InputRestriccionesProps) {
  const textoMostrado =
    valores.length > 0
      ? valores.length === 1
        ? valores[0]
        : `${valores.length} restricciones seleccionadas`
      : "";

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
            placeholder="Restricciones"
            placeholderTextColor={MetaFitColors.text.tertiary}
            value={textoMostrado}
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

      <ModalRestricciones
        visible={mostrarModal}
        valoresSeleccionados={valores}
        onSeleccionar={onToggleRestriccion}
        onCerrar={onCerrarModal}
      />
    </>
  );
}

