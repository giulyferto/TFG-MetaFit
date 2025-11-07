import type { DatosFormularioNutricional } from "@/components/formulario-info-nutricional";
import { useState } from "react";

export function useFormularioNutricional() {
  const [datosFormulario, setDatosFormulario] =
    useState<DatosFormularioNutricional>({
      edad: "",
      sexo: "",
      altura: "",
      peso: "",
      ejercicio: "Sí",
      preferenciaNutricional: "",
      restricciones: [],
      objetivos: "",
    });
  const [errorEdad, setErrorEdad] = useState(false);
  const [errorAltura, setErrorAltura] = useState<string | null>(null);
  const [errorPeso, setErrorPeso] = useState<string | null>(null);
  const [mostrarModalSexo, setMostrarModalSexo] = useState(false);
  const [mostrarModalPreferenciaNutricional, setMostrarModalPreferenciaNutricional] =
    useState(false);
  const [mostrarModalRestricciones, setMostrarModalRestricciones] =
    useState(false);
  const [mostrarModalObjetivos, setMostrarModalObjetivos] = useState(false);

  const actualizarCampo = (
    campo: keyof DatosFormularioNutricional,
    valor: string | string[]
  ) => {
    setDatosFormulario((prev) => ({ ...prev, [campo]: valor }));
  };

  const toggleRestriccion = (restriccion: string) => {
    setDatosFormulario((prev) => {
      const restricciones = prev.restricciones;
      const index = restricciones.indexOf(restriccion);
      if (index > -1) {
        // Si ya está seleccionada, la removemos
        return {
          ...prev,
          restricciones: restricciones.filter((r) => r !== restriccion),
        };
      } else {
        // Si no está seleccionada, la agregamos
        return {
          ...prev,
          restricciones: [...restricciones, restriccion],
        };
      }
    });
  };

  const actualizarEdad = (valor: string) => {
    const tieneLetras = /[a-zA-Z]/.test(valor);
    setErrorEdad(tieneLetras);

    const valorNumerico = valor.replace(/[^0-9]/g, "");
    actualizarCampo("edad", valorNumerico);

    if (!tieneLetras && errorEdad) {
      setTimeout(() => setErrorEdad(false), 2000);
    }
  };

  const actualizarAltura = (valor: string) => {
    const tieneLetras = /[a-zA-Z]/.test(valor);
    const valorNumerico = valor.replace(/[^0-9]/g, "");
    actualizarCampo("altura", valorNumerico);

    if (tieneLetras) {
      setErrorAltura("Solo se permiten números");
    } else if (valorNumerico && parseInt(valorNumerico, 10) > 250) {
      setErrorAltura("La altura no puede ser mayor a 250 cm");
    } else {
      setErrorAltura(null);
    }
  };

  const actualizarPeso = (valor: string) => {
    const tieneLetras = /[a-zA-Z]/.test(valor);
    const valorNumerico = valor.replace(/[^0-9]/g, "");
    actualizarCampo("peso", valorNumerico);

    if (tieneLetras) {
      setErrorPeso("Solo se permiten números");
    } else if (valorNumerico && parseInt(valorNumerico, 10) > 400) {
      setErrorPeso("El peso no puede ser mayor a 400 kg");
    } else {
      setErrorPeso(null);
    }
  };

  return {
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
  };
}

