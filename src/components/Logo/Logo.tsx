import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LogoProps {
  showSubtitle?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const Logo: React.FC<LogoProps> = ({ showSubtitle = true, size = 'medium' }) => {
  const iconSize = size === 'small' ? 24 : size === 'medium' ? 32 : 40;
  const textSize = size === 'small' ? 20 : size === 'medium' ? 28 : 36;

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={[styles.iconContainer, { width: iconSize + 12, height: iconSize + 12 }]}>
          <Ionicons name="location" size={iconSize} color="#FFFFFF" style={styles.icon} />
        </View>
        <Text style={[styles.logoText, { fontSize: textSize }]}>
          <Text style={styles.logoTextDark}>e-</Text>
          <Text style={styles.logoTextLight}>park</Text>
        </Text>
      </View>
      {showSubtitle && (
        <View style={styles.subtitleContainer}>
          <Text style={styles.subtitleBold}>ZONA AZUL SALVADOR</Text>
          <Text style={styles.subtitle}>Estacione fácil. Viva Salvador.</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    backgroundColor: '#0055FF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  icon: {
    marginTop: 2,
  },
  logoText: {
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  logoTextDark: {
    color: '#0055FF',
  },
  logoTextLight: {
    color: '#33A1FF',
  },
  subtitleContainer: {
    alignItems: 'center',
  },
  subtitleBold: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0055FF',
    marginBottom: 4,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#0055FF',
    fontWeight: '400',
  },
});

