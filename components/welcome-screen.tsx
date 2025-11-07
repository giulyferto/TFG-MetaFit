import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Confetti data for background decoration (using percentages that will be converted to pixels)
const confettiData = [
  { topPercent: 10, leftPercent: 15, color: '#FFB6C1', size: 12, rotation: 45 },
  { topPercent: 20, leftPercent: 75, color: '#DDA0DD', size: 10, rotation: -30 },
  { topPercent: 30, leftPercent: 25, color: '#98FB98', size: 14, rotation: 60 },
  { topPercent: 40, leftPercent: 80, color: '#87CEEB', size: 11, rotation: -45 },
  { topPercent: 50, leftPercent: 10, color: '#FFDAB9', size: 13, rotation: 30 },
  { topPercent: 15, leftPercent: 50, color: '#FFB6C1', size: 9, rotation: -60 },
  { topPercent: 25, leftPercent: 90, color: '#DDA0DD', size: 12, rotation: 75 },
  { topPercent: 35, leftPercent: 5, color: '#98FB98', size: 10, rotation: -20 },
  { topPercent: 45, leftPercent: 60, color: '#87CEEB', size: 15, rotation: 45 },
  { topPercent: 55, leftPercent: 30, color: '#FFDAB9', size: 11, rotation: -50 },
  { topPercent: 60, leftPercent: 85, color: '#FFB6C1', size: 13, rotation: 25 },
  { topPercent: 70, leftPercent: 20, color: '#DDA0DD', size: 9, rotation: -40 },
  { topPercent: 65, leftPercent: 70, color: '#98FB98', size: 12, rotation: 55 },
  { topPercent: 75, leftPercent: 40, color: '#87CEEB', size: 10, rotation: -35 },
  { topPercent: 80, leftPercent: 10, color: '#FFDAB9', size: 14, rotation: 40 },
];

type WelcomeScreenProps = {
  onStartPress?: () => void;
};

export function WelcomeScreen({ onStartPress }: WelcomeScreenProps) {
  const handleStartPress = () => {
    if (onStartPress) {
      onStartPress();
    } else {
      // Default behavior - can be removed if always providing onStartPress
      console.log('Empecemos pressed');
    }
  };

  return (
    <ThemedView style={styles.container} lightColor="#FFFFFF">
      {/* Confetti Background */}
      <View style={styles.confettiContainer}>
        {confettiData.map((item, index) => (
          <View
            key={index}
            style={[
              styles.confetti,
              {
                top: (screenHeight * item.topPercent) / 100,
                left: (screenWidth * item.leftPercent) / 100,
                backgroundColor: item.color,
                width: item.size,
                height: item.size,
                transform: [{ rotate: `${item.rotation}deg` }],
              },
            ]}
          />
        ))}
      </View>

      {/* Subtle background circle */}
      <View style={[styles.backgroundCircle, { top: (screenHeight * 15) / 100 }]} />

      {/* Logo - Three concentric circles */}
      <View style={styles.logoContainer}>
        {/* Outer circle - light blue-gray outline */}
        <View style={styles.outerCircle}>
          {/* Middle circle - beige/cream fill */}
          <View style={styles.middleCircle}>
            {/* Inner circle - orange-brown outline */}
            <View style={styles.innerCircle} />
          </View>
        </View>

        {/* App Name */}
        <ThemedText style={styles.appName} type="defaultSemiBold" lightColor="#333333">
          MetaFit
        </ThemedText>
      </View>

      {/* Welcome Message */}
      <ThemedText style={styles.welcomeText} lightColor="#333333">
        Bienvenido a MetaFit
      </ThemedText>

      {/* Spacer to push button to bottom */}
      <View style={styles.spacer} />

      {/* Start Button */}
      <TouchableOpacity style={styles.startButton} onPress={handleStartPress}>
        <ThemedText style={styles.startButtonText} lightColor="#FFFFFF">
          Empecemos
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingHorizontal: 20,
    position: 'relative',
    paddingTop: 100,
    paddingBottom: 20,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  confetti: {
    position: 'absolute',
    borderRadius: 2,
  },
  backgroundCircle: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#F5F5F5',
    opacity: 0.3,
    alignSelf: 'center',
    zIndex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    zIndex: 2,
  },
  outerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#B0C4DE',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  middleCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F5DEB3',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    top: -5,
    left: -5,
  },
  innerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#DEB887',
    position: 'relative',
    top: -8,
    left: 5,
  },
  appName: {
    fontSize: 28,
    fontWeight: '600',
    marginTop: 20,
    zIndex: 2,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 40,
    textAlign: 'center',
    zIndex: 2,
  },
  spacer: {
    flex: 1,
  },
  startButton: {
    backgroundColor: '#B0C4DE',
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 12,
    marginBottom: 50,
    width: '85%',
    alignItems: 'center',
    zIndex: 2,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

