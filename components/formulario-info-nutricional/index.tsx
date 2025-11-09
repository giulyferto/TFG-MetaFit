import { ThemedText } from "@/components/ui/themed-text";
import { MetaFitColors } from "@/constants/theme";
import { useFormularioNutricional } from "@/hooks/useFormularioNutricional";
import { forwardRef, useImperativeHandle } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { InputAltura } from "./InputAltura";
import { InputEdad } from "./InputEdad";
import { InputEjercicio } from "./InputEjercicio";
import { InputObjetivos } from "./InputObjetivos";
import { InputPeso } from "./InputPeso";
import { InputPreferenciaNutricional } from "./InputPreferenciaNutricional";
import { InputRestricciones } from "./InputRestricciones";
import { InputSexo } from "./InputSexo";
import type { ObjetivoNutricional } from "./ModalObjetivos";
import type { PreferenciaNutricional } from "./ModalPreferenciaNutricional";
import type { RestriccionNutricional } from "./ModalRestricciones";
import { estilos } from "./estilos";

export type DatosFormularioNutricional = {
  edad: string;
  sexo: string;
  altura: string;
  peso: string;
  ejercicio: string;
  preferenciaNutricional: string;
  restricciones: string[];
  objetivos: string;
};

type PropsFormularioInfoNutricional = {
  alGuardar?: (datosFormulario: DatosFormularioNutricional) => void;
  isSaving?: boolean;
  initialData?: Partial<DatosFormularioNutricional>;
  readOnly?: boolean;
};

export type FormularioInfoNutricionalRef = {
  obtenerDatos: () => DatosFormularioNutricional;
  guardar: () => void;
};

export const FormularioInfoNutricional = forwardRef<FormularioInfoNutricionalRef, PropsFormularioInfoNutricional>(({
  alGuardar,
  isSaving = false,
  initialData,
  readOnly = false,
}, ref) => {
  const {
    datosFormulario,
    errorEdad,
    errorAltura,
    errorPeso,
    mostrarModalSexo,
    setMostrarModalSexo,
    mostrarModalPreferenciaNutricional,
    setMostrarModalPreferenciaNutricional,
    mostrarModalRestricciones,
    setMostrarModalRestricciones,
    mostrarModalObjetivos,
    setMostrarModalObjetivos,
    actualizarCampo,
    actualizarEdad,
    actualizarAltura,
    actualizarPeso,
    toggleRestriccion,
  } = useFormularioNutricional(initialData);

  const manejarGuardar = () => {
    if (alGuardar) {
      alGuardar(datosFormulario);
    }
  };

  // Exponer funciones al componente padre mediante ref
  useImperativeHandle(ref, () => ({
    obtenerDatos: () => datosFormulario,
    guardar: manejarGuardar,
  }));

  const manejarSeleccionarSexo = (sexo: "Masculino" | "Femenino") => {
    actualizarCampo("sexo", sexo);
  };

  const manejarSeleccionarPreferenciaNutricional = (
    preferencia: PreferenciaNutricional
  ) => {
    actualizarCampo("preferenciaNutricional", preferencia);
  };

  const manejarSeleccionarObjetivo = (objetivo: ObjetivoNutricional) => {
    actualizarCampo("objetivos", objetivo);
  };

  return (
    <>
      <ScrollView
        style={estilos.vistaScroll}
        contentContainerStyle={estilos.contenidoScroll}
        showsVerticalScrollIndicator={false}
      >
        <InputEdad
          valor={datosFormulario.edad}
          error={errorEdad}
          onChangeText={actualizarEdad}
          editable={!readOnly}
        />

        <InputSexo
          valor={datosFormulario.sexo}
          mostrarModal={mostrarModalSexo}
          onAbrirModal={() => !readOnly && setMostrarModalSexo(true)}
          onCerrarModal={() => setMostrarModalSexo(false)}
          onSeleccionar={manejarSeleccionarSexo}
          editable={!readOnly}
        />

        <InputAltura
          valor={datosFormulario.altura}
          error={errorAltura}
          onChangeText={actualizarAltura}
          editable={!readOnly}
        />

        <InputPeso
          valor={datosFormulario.peso}
          error={errorPeso}
          onChangeText={actualizarPeso}
          editable={!readOnly}
        />

        <InputEjercicio
          valor={datosFormulario.ejercicio}
          onChangeValue={(valor) => !readOnly && actualizarCampo("ejercicio", valor)}
          editable={!readOnly}
        />

        <InputPreferenciaNutricional
          valor={datosFormulario.preferenciaNutricional}
          mostrarModal={mostrarModalPreferenciaNutricional}
          onAbrirModal={() => !readOnly && setMostrarModalPreferenciaNutricional(true)}
          onCerrarModal={() => setMostrarModalPreferenciaNutricional(false)}
          onSeleccionar={manejarSeleccionarPreferenciaNutricional}
          editable={!readOnly}
        />

        <InputRestricciones
          valores={datosFormulario.restricciones}
          mostrarModal={mostrarModalRestricciones}
          onAbrirModal={() => !readOnly && setMostrarModalRestricciones(true)}
          onCerrarModal={() => setMostrarModalRestricciones(false)}
          onToggleRestriccion={(restriccion: RestriccionNutricional) =>
            !readOnly && toggleRestriccion(restriccion)
          }
          editable={!readOnly}
        />

        <InputObjetivos
          valor={datosFormulario.objetivos}
          mostrarModal={mostrarModalObjetivos}
          onAbrirModal={() => !readOnly && setMostrarModalObjetivos(true)}
          onCerrarModal={() => setMostrarModalObjetivos(false)}
          onSeleccionar={manejarSeleccionarObjetivo}
          editable={!readOnly}
        />
      </ScrollView>

      {!readOnly && (
        <View style={estilos.contenedorBoton}>
          <TouchableOpacity
            style={[estilos.botonGuardar, isSaving && estilos.botonGuardarDisabled]}
            onPress={manejarGuardar}
            disabled={isSaving}
          >
            <ThemedText
              style={estilos.textoBotonGuardar}
              lightColor={MetaFitColors.text.white}
            >
              {isSaving ? "Guardando..." : "Guardar"}
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
});

