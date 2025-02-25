import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { CELL_SIZE } from '../constants/gameConstants';

interface PacManProps {
  direction: 'right' | 'left' | 'up' | 'down';
  isMoving: boolean; // Add isMoving prop to control animation
}

const PacMan: React.FC<PacManProps> = ({ direction, isMoving }) => {
  const mouthAnimation = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Animation effect that responds to movement state
  useEffect(() => {
    // Stop any existing animation
    if (animationRef.current) {
      animationRef.current.stop();
    }
    
    // Only animate when moving
    if (isMoving) {
      const animate = () => {
        animationRef.current = Animated.sequence([
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
        ]);
        
        animationRef.current.start(() => {
          if (isMoving) { // Check again in case it changed during animation
            animate();
          }
        });
      };
      
      animate();
    } else {
      // When not moving, reset to closed mouth (or slightly open)
      Animated.timing(mouthAnimation, {
        toValue: 0.1, // Slightly open mouth when stopped
        duration: 100,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [isMoving, direction]); // Re-run when moving state or direction changes

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
                    outputRange: ['-5deg', '-50deg'] // Reversed rotation to fix mouth direction
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
                    outputRange: ['5deg', '50deg'] // Reversed rotation to fix mouth direction
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
