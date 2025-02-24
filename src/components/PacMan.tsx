import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { CELL_SIZE } from '../constants/gameConstants';

interface PacManProps {
  direction: 'right' | 'left' | 'up' | 'down';
}

const PacMan: React.FC<PacManProps> = ({ direction }) => {
  const mouthAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(mouthAnimation, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(mouthAnimation, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => animate());
    };

    animate();

    return () => {
      mouthAnimation.stopAnimation();
    };
  }, []);

  const getRotationDegrees = () => {
    switch (direction) {
      case 'right': return '0deg';
      case 'left': return '180deg';
      case 'up': return '270deg';
      case 'down': return '90deg';
      default: return '0deg';
    }
  };

  const mouthAngle = mouthAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 30]
  });

  return (
    <View style={[styles.container, { transform: [{ rotate: getRotationDegrees() }] }]}>
      <Animated.View 
        style={[
          styles.pacman,
          {
            borderTopRightRadius: mouthAngle.interpolate({
              inputRange: [0, 30],
              outputRange: [CELL_SIZE * 0.4, 0]
            }),
            borderBottomRightRadius: mouthAngle.interpolate({
              inputRange: [0, 30],
              outputRange: [CELL_SIZE * 0.4, 0]
            })
          }
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pacman: {
    width: CELL_SIZE * 0.8,
    height: CELL_SIZE * 0.8,
    backgroundColor: '#FFFF00',
    borderTopLeftRadius: CELL_SIZE * 0.4,
    borderBottomLeftRadius: CELL_SIZE * 0.4,
  }
});

export default PacMan;
