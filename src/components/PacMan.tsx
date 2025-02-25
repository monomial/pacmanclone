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

  // Map animation value to mouth angle
  const mouthAngle = mouthAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [5, 50] // 5 to 50 degrees (almost closed to wide open)
  });
  
  return (
    <View style={[styles.container, { transform: [{ rotate: getRotationDegrees() }] }]}>
      <View style={styles.pacmanBase}>
        <Animated.View 
          style={[
            styles.pacmanTop,
            {
              transform: [
                { 
                  rotate: mouthAngle.interpolate({
                    inputRange: [5, 50],
                    outputRange: ['5deg', '50deg']
                  })
                }
              ]
            }
          ]}
        />
        <Animated.View 
          style={[
            styles.pacmanBottom,
            {
              transform: [
                { 
                  rotate: mouthAngle.interpolate({
                    inputRange: [5, 50],
                    outputRange: ['-5deg', '-50deg']
                  })
                }
              ]
            }
          ]}
        />
      </View>
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
  pacmanBase: {
    width: CELL_SIZE * 0.8,
    height: CELL_SIZE * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pacmanTop: {
    width: CELL_SIZE * 0.8,
    height: CELL_SIZE * 0.4,
    backgroundColor: '#FFFF00', // Classic Pac-Man yellow
    borderTopLeftRadius: CELL_SIZE * 0.4,
    borderTopRightRadius: CELL_SIZE * 0.4,
    position: 'absolute',
    top: 0,
    transformOrigin: 'center bottom',
  },
  pacmanBottom: {
    width: CELL_SIZE * 0.8,
    height: CELL_SIZE * 0.4,
    backgroundColor: '#FFFF00', // Classic Pac-Man yellow
    borderBottomLeftRadius: CELL_SIZE * 0.4,
    borderBottomRightRadius: CELL_SIZE * 0.4,
    position: 'absolute',
    bottom: 0,
    transformOrigin: 'center top',
  }
});

export default PacMan;
