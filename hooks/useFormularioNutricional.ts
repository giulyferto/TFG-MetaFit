import type { DatosFormularioNutricional } from "@/components/formulario-info-nutricional";
import { useEffect, useMemo, useState } from "react";

export function useFormularioNutricional(initialData?: Partial<DatosFormularioNutricional>) {
  const [datosFormulario, setDatosFormulario] =
    useState<DatosFormularioNutricional>({
      edad: initialData?.edad || "",
      sexo: initialData?.sexo || "",
      altura: initialData?.altura || "",
      peso: initialData?.peso || "",
      ejercicio: initialData?.ejercicio || "Sí",
      preferenciaNutricional: initialData?.preferenciaNutricional || "",
      restricciones: initialData?.restricciones || [],
      objetivos: initialData?.objetivos || "",
    });

  // Serializar restricciones para usar en dependencias
  const restriccionesKey = useMemo(
    () => JSON.stringify(initialData?.restricciones || []),
    [initialData?.restricciones]
  );

  // Actualizar datos cuando cambien los datos iniciales
  useEffect(() => {
    if (initialData) {
      const nuevosDatos = {
        edad: initialData.edad || "",
        sexo: initialData.sexo || "",
        altura: initialData.altura || "",
        peso: initialData.peso || "",
        ejercicio: initialData.ejercicio || "Sí",
        preferenciaNutricional: initialData.preferenciaNutricional || "",
        restricciones: initialData.restricciones || [],
        objetivos: initialData.objetivos || "",
      };
      
      // Comparar si los datos realmente cambiaron para evitar actualizaciones innecesarias
      setDatosFormulario((prev) => {
        const hasChanged = 
          prev.edad !== nuevosDatos.edad ||
          prev.sexo !== nuevosDatos.sexo ||
          prev.altura !== nuevosDatos.altura ||
          prev.peso !== nuevosDatos.peso ||
          prev.ejercicio !== nuevosDatos.ejercicio ||
          prev.preferenciaNutricional !== nuevosDatos.preferenciaNutricional ||
          prev.objetivos !== nuevosDatos.objetivos ||
          JSON.stringify(prev.restricciones) !== JSON.stringify(nuevosDatos.restricciones);
        
        return hasChanged ? nuevosDatos : prev;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    initialData?.edad,
    initialData?.sexo,
    initialData?.altura,
    initialData?.peso,
    initialData?.ejercicio,
    initialData?.preferenciaNutricional,
    initialData?.objetivos,
    restriccionesKey,
  ]);
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

