import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
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
          duration: 160, // Classic arcade speed
          useNativeDriver: false, // SVG paths can't use native driver
        }),
        Animated.timing(mouthAnimation, {
          toValue: 0,
          duration: 160,
          useNativeDriver: false,
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

  // Create the classic Pac-Man SVG path
  const AnimatedPath = Animated.createAnimatedComponent(Path);
  
  // Generate the Pac-Man SVG arc path with dynamic mouth angle
  const getPacManPath = (mouthAngle: number) => {
    const size = CELL_SIZE * 0.8;
    const radius = size / 2;
    const center = radius;
    
    // Convert angle from degrees to radians
    const angleRad = (mouthAngle * Math.PI) / 180;
    const startAngle = angleRad / 2;
    const endAngle = 2 * Math.PI - (angleRad / 2);
    
    // Calculate start and end points
    const startX = center + radius * Math.cos(startAngle);
    const startY = center - radius * Math.sin(startAngle);
    const endX = center + radius * Math.cos(endAngle);
    const endY = center - radius * Math.sin(endAngle);
    
    // Large arc flag is 1 for angles > 180 degrees
    const largeArcFlag = mouthAngle > 180 ? 0 : 1;
    
    // Move to center, line to start point, arc to end point, line back to center
    return `M ${center},${center} L ${startX},${startY} A ${radius},${radius} 0 ${largeArcFlag} 1 ${endX},${endY} Z`;
  };

  return (
    <View style={[styles.container, { transform: [{ rotate: getRotationDegrees() }] }]}>
      {/* First draw a full yellow circle as the base */}
      <View style={styles.fullCircle} />
      
      {/* Then overlay the SVG with a "mouth" cutout */}
      <Svg 
        width={CELL_SIZE * 0.8} 
        height={CELL_SIZE * 0.8} 
        viewBox={`0 0 ${CELL_SIZE * 0.8} ${CELL_SIZE * 0.8}`}
        style={styles.svgOverlay}
      >
        <AnimatedPath
          d={mouthAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [getPacManPath(30), getPacManPath(60)]  // 30° to 60° mouth angle
          })}
          fill="black" // The mouth cutout is black
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  fullCircle: {
    position: 'absolute',
    width: CELL_SIZE * 0.8,
    height: CELL_SIZE * 0.8,
    borderRadius: CELL_SIZE * 0.4,
    backgroundColor: '#FFFF00', // Classic Pac-Man yellow
  },
  svgOverlay: {
    position: 'absolute',
  }
});

export default PacMan;
