import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { MetaFitColors } from '@/constants/theme';
import { StyleSheet } from 'react-native';

export default function ConfiguracionScreen() {
  return (
    <ThemedView style={styles.container} lightColor={MetaFitColors.background.white}>
      <ThemedText style={styles.title} lightColor={MetaFitColors.text.primary}>
        Configuración
      </ThemedText>
      <ThemedText style={styles.subtitle} lightColor={MetaFitColors.text.secondary}>
        Pantalla de configuración en desarrollo
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
  },
});

