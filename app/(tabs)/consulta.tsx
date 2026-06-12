import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { MetaFitColors } from '@/constants/theme';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ConsultaScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={styles.container} lightColor={MetaFitColors.background.white}>
      <View style={[styles.content, { paddingTop: insets.top + 20 }]}>
        <ThemedText style={styles.title} lightColor={MetaFitColors.text.primary}>
          Consulta
        </ThemedText>
        <ThemedText style={styles.subtitle} lightColor={MetaFitColors.text.secondary}>
          Próximamente disponible
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
  },
});
