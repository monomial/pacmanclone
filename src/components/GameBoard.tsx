import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, PanResponder, PanResponderGestureState, Text } from 'react-native';
import { MAZE_LAYOUT, CELL_TYPES, GRID_WIDTH, CELL_SIZE } from '../constants/gameConstants';
import PacMan from './PacMan';

const window = Dimensions.get('window');

const INITIAL_PACMAN_POSITION = { row: 14, col: 14 }; // Starting position - middle of the maze
const MOVEMENT_SPEED = 150; // milliseconds per cell - adjust for faster/slower movement
const DOT_POINTS = 10;
const POWER_PELLET_POINTS = 50;

const GameBoard: React.FC = () => {
  const [pacmanPosition, setPacmanPosition] = React.useState(INITIAL_PACMAN_POSITION);
  const [pacmanDirection, setPacmanDirection] = React.useState<'right' | 'left' | 'up' | 'down'>('right');
  const [isMoving, setIsMoving] = React.useState(true);
  const [score, setScore] = React.useState(0);
  const [mazeState, setMazeState] = React.useState(MAZE_LAYOUT.map(row => row.split('')));
  
  const lastMoveTime = useRef(Date.now());
  const animationFrameId = useRef<number>();
  const currentDirection = useRef(pacmanDirection);

  // Update ref when direction changes
  useEffect(() => {
    currentDirection.current = pacmanDirection;
  }, [pacmanDirection]);

  const collectDot = (row: number, col: number) => {
    const cell = mazeState[row][col];
    if (cell === CELL_TYPES.DOT) {
      setScore(prev => prev + DOT_POINTS);
      const newMazeState = mazeState.map(row => [...row]);
      newMazeState[row][col] = ' ';
      setMazeState(newMazeState);
    } else if (cell === CELL_TYPES.POWER_PELLET) {
      setScore(prev => prev + POWER_PELLET_POINTS);
      const newMazeState = mazeState.map(row => [...row]);
      newMazeState[row][col] = ' ';
      setMazeState(newMazeState);
      // TODO: Implement power pellet effects (ghost vulnerability)
    }
  };

  const gameLoop = () => {
    const now = Date.now();
    if (now - lastMoveTime.current >= MOVEMENT_SPEED) {
      tryMove(currentDirection.current);
      lastMoveTime.current = now;
    }
    animationFrameId.current = requestAnimationFrame(gameLoop);
  };

  // Start/stop game loop
  useEffect(() => {
    if (isMoving) {
      animationFrameId.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isMoving]);

  const handleSwipe = (gestureState: PanResponderGestureState) => {
    const { dx, dy } = gestureState;

    // Determine swipe direction based on which axis had larger movement
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal swipe
      if (dx > 0) {
        setPacmanDirection('right');
      } else {
        setPacmanDirection('left');
      }
    } else {
      // Vertical swipe
      if (dy > 0) {
        setPacmanDirection('down');
      } else {
        setPacmanDirection('up');
      }
    }
  };

  const tryMove = (direction: 'right' | 'left' | 'up' | 'down') => {
    const newPosition = { ...pacmanPosition };

    switch (direction) {
      case 'right':
        newPosition.col = (newPosition.col + 1) % GRID_WIDTH;
        break;
      case 'left':
        newPosition.col = newPosition.col - 1 < 0 ? GRID_WIDTH - 1 : newPosition.col - 1;
        break;
      case 'up':
        if (newPosition.row > 0) {
          newPosition.row = newPosition.row - 1;
        }
        break;
      case 'down':
        if (newPosition.row < mazeState.length - 1) {
          newPosition.row = newPosition.row + 1;
        }
        break;
    }

    // Check if the new position is valid (not a wall)
    if (mazeState[newPosition.row]?.[newPosition.col] !== CELL_TYPES.WALL) {
      collectDot(newPosition.row, newPosition.col);
      setPacmanPosition(newPosition);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, gestureState) => handleSwipe(gestureState),
      onPanResponderTerminate: (_, gestureState) => handleSwipe(gestureState),
    })
  ).current;

  const renderCell = (cell: string, rowIndex: number, colIndex: number) => {
    // Check if current cell is PacMan's position
    if (rowIndex === pacmanPosition.row && colIndex === pacmanPosition.col) {
      return (
        <View key={`${rowIndex}-${colIndex}`} style={styles.cell}>
          <PacMan direction={pacmanDirection} />
        </View>
      );
    }

    const cellStyle = [
      styles.cell,
      cell === CELL_TYPES.WALL && styles.wall,
      cell === CELL_TYPES.DOT && styles.dot,
      cell === CELL_TYPES.POWER_PELLET && styles.powerPellet,
    ];

    return (
      <View key={`${rowIndex}-${colIndex}`} style={cellStyle}>
        {cell === CELL_TYPES.DOT && <View style={styles.dotInner} />}
        {cell === CELL_TYPES.POWER_PELLET && <View style={styles.powerPelletInner} />}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreText}>Score: {score}</Text>
      </View>
      <View {...panResponder.panHandlers}>
        {mazeState.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((cell, colIndex) => renderCell(cell, rowIndex, colIndex))}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    padding: 10,
  },
  scoreContainer: {
    padding: 10,
    alignItems: 'center',
  },
  scoreText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wall: {
    backgroundColor: '#2121DE', // Classic Pacman blue
  },
  dot: {
    backgroundColor: 'transparent',
  },
  dotInner: {
    width: CELL_SIZE * 0.2,
    height: CELL_SIZE * 0.2,
    backgroundColor: '#FFF',
    borderRadius: CELL_SIZE * 0.1,
  },
  powerPellet: {
    backgroundColor: 'transparent',
  },
  powerPelletInner: {
    width: CELL_SIZE * 0.5,
    height: CELL_SIZE * 0.5,
    backgroundColor: '#FFF',
    borderRadius: CELL_SIZE * 0.25,
  },
});

export default GameBoard;
