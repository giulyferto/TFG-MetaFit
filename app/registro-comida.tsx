import { RegistroComidaScreen } from '@/components/screens/registro-comida-screen';
import { router } from 'expo-router';

export default function RegistroComidaPage() {
  const handleBuscarComidasAnteriores = () => {
    // Navegar a la pantalla de buscar comidas anteriores (cuando se cree)
    console.log('Buscar comidas anteriores');
  };

  const handleRegistroManual = () => {
    // Navegar a la pantalla de registro manual
    router.push('/registro-manual');
  };

  const handleCargarImagenComida = () => {
    // Navegar a la pantalla de cargar imagen de comida (cuando se cree)
    console.log('Cargar imagen de mi comida');
  };

  const handleCargarImagenEtiqueta = () => {
    // Navegar a la pantalla de cargar imagen de etiqueta (cuando se cree)
    console.log('Cargar imagen etiqueta nutricional');
  };

  return (
    <RegistroComidaScreen
      onBuscarComidasAnterioresPress={handleBuscarComidasAnteriores}
      onRegistroManualPress={handleRegistroManual}
      onCargarImagenComidaPress={handleCargarImagenComida}
      onCargarImagenEtiquetaPress={handleCargarImagenEtiqueta}
    />
  );
}

