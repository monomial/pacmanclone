import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, PanResponder, PanResponderGestureState, Text, Platform, Animated } from 'react-native';
import { MAZE_LAYOUT, CELL_TYPES, GRID_WIDTH, CELL_SIZE } from '../constants/gameConstants';
import PacMan from './PacMan';

const window = Dimensions.get('window');

const INITIAL_PACMAN_POSITION = { row: 17, col: 14 }; // Classic Pac-Man starting position (near bottom of maze)
const MOVEMENT_SPEED = 180; // Base movement speed (higher is slower)
const ACCELERATION = 0.95; // Acceleration factor for smooth movement (higher is less acceleration)
const MIN_SPEED = 120; // Minimum speed cap to prevent getting too fast
const DOT_POINTS = 10;
const POWER_PELLET_POINTS = 50;

const GameBoard: React.FC = () => {
  const [pacmanPosition, setPacmanPosition] = React.useState(INITIAL_PACMAN_POSITION);
  const [pacmanDirection, setPacmanDirection] = React.useState<'right' | 'left' | 'up' | 'down'>('right');
  const [requestedDirection, setRequestedDirection] = React.useState<'right' | 'left' | 'up' | 'down'>('right');
  const [isMoving, setIsMoving] = React.useState(true);
  const [score, setScore] = React.useState(0);
  const [mazeState, setMazeState] = React.useState(MAZE_LAYOUT.map(row => row.split('')));
  const [currentSpeed, setCurrentSpeed] = React.useState(MOVEMENT_SPEED);
  const [debugInfo, setDebugInfo] = React.useState({
    canMoveRequested: true,
    canMoveCurrent: true,
    currentCell: '',
    requestedDir: 'right',
    currentDir: 'right',
    position: INITIAL_PACMAN_POSITION,
    testPosition: INITIAL_PACMAN_POSITION,
    speed: MOVEMENT_SPEED,
    moved: false,
    wallCollisions: 0,
    consecutiveFailedMoves: 0,
    lastMoveTime: Date.now(),
    gameLoopCount: 0,
    movementLog: [] as string[]  // Track recent movement actions
  });
  
  const lastMoveTime = useRef(Date.now());
  const animationFrameId = useRef<number>();
  const currentDirection = useRef(pacmanDirection);
  const requestedDir = useRef(requestedDirection);
  const consecutiveFailedMoves = useRef(0);

  // Update refs when directions change
  useEffect(() => {
    currentDirection.current = pacmanDirection;
  }, [pacmanDirection]);
  
  useEffect(() => {
    requestedDir.current = requestedDirection;
  }, [requestedDirection]);
  
  // CRITICAL: Update position ref when pacmanPosition changes
  useEffect(() => {
    positionRef.current = pacmanPosition;
  }, [pacmanPosition]);

  // State for controlling debug visibility and movement state
  const [showDebug, setShowDebug] = React.useState(false);
  const [isPacmanMoving, setIsPacmanMoving] = React.useState(false);
  
  // Add keyboard controls for web
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Safely access the window object in web environment
      const win = typeof window !== 'undefined' ? window : null;
      
      if (win) {
        const handleKeyDown = (event: KeyboardEvent) => {
          switch (event.key) {
            case 'ArrowUp':
              setRequestedDirection('up');
              event.preventDefault();
              break;
            case 'ArrowDown':
              setRequestedDirection('down');
              event.preventDefault();
              break;
            case 'ArrowLeft':
              setRequestedDirection('left');
              event.preventDefault();
              break;
            case 'ArrowRight':
              setRequestedDirection('right');
              event.preventDefault();
              break;
            case ' ':  // Space bar to pause/resume
              setIsMoving(prev => !prev);
              event.preventDefault();
              break;
            case 'd':
            case 'D': // 'd' key for toggling debug info (case-insensitive)
              console.log('Debug key pressed, toggling debug panel');
              setShowDebug(prev => !prev);
              event.preventDefault();
              break;
          }
        };

        // TypeScript safe way to add event listener
        document.addEventListener('keydown', handleKeyDown);
        
        // Clean up the event listener when component unmounts
        return () => {
          document.removeEventListener('keydown', handleKeyDown);
        };
      }
    }
  }, []);

  // Create a ref to track collected dots to prevent re-collecting
  const collectedDotsRef = useRef(new Set<string>());
  
  const collectDot = (row: number, col: number) => {
    // Create a unique key for this position
    const posKey = `${row}-${col}`;
    
    // Get the cell directly from the current maze state
    const cell = mazeState[row][col];
    
    // Check if we already collected this dot
    if (collectedDotsRef.current.has(posKey)) {
      return; // Already collected, don't do anything
    }
    
    // Only collect dots and power pellets
    if (cell === CELL_TYPES.DOT || cell === CELL_TYPES.POWER_PELLET) {
      // Add points based on what was collected
      if (cell === CELL_TYPES.DOT) {
        setScore(prev => prev + DOT_POINTS);
      } else if (cell === CELL_TYPES.POWER_PELLET) {
        setScore(prev => prev + POWER_PELLET_POINTS);
        // TODO: Implement power pellet effects (ghost vulnerability)
      }
      
      // Create a proper deep copy of the maze state
      const newMazeState = [...mazeState.map(row => [...row])];
      
      // Clear the cell
      newMazeState[row][col] = CELL_TYPES.EMPTY;
      
      // Track this dot as collected
      collectedDotsRef.current.add(posKey);
      
      // Log collection for debugging
      console.log(`Collected ${cell} at (${row},${col}), dots collected: ${collectedDotsRef.current.size}`);
      
      // Set the new maze state
      setMazeState(newMazeState);
    }
  };

  const canMoveInDirection = (direction: 'right' | 'left' | 'up' | 'down', position = positionRef.current) => {
    // CRITICAL FIX: Always use positionRef.current for the most up-to-date position
    const testPosition = { ...position };
    
    switch (direction) {
      case 'right':
        testPosition.col = (testPosition.col + 1) % GRID_WIDTH;
        break;
      case 'left':
        testPosition.col = testPosition.col - 1 < 0 ? GRID_WIDTH - 1 : testPosition.col - 1;
        break;
      case 'up':
        if (testPosition.row > 0) {
          testPosition.row = testPosition.row - 1;
        } else {
          return false;
        }
        break;
      case 'down':
        if (testPosition.row < mazeState.length - 1) {
          testPosition.row = testPosition.row + 1;
        } else {
          return false;
        }
        break;
    }
    
    // Check if the cell exists and get its content
    let cellAtPosition = 'X'; // Default to 'X' for out of bounds
    try {
      if (mazeState[testPosition.row] && typeof mazeState[testPosition.row][testPosition.col] !== 'undefined') {
        cellAtPosition = mazeState[testPosition.row][testPosition.col];
      }
    } catch (e) {
      console.error('Error accessing cell:', e);
    }
    
    const canMove = cellAtPosition !== CELL_TYPES.WALL;
    
    // Always update debug info regardless of direction
    setDebugInfo(prev => {
      const newDebugInfo = { ...prev };
      
      // Always update test position info for more visibility
      newDebugInfo.testPosition = { ...testPosition };
      newDebugInfo.currentCell = cellAtPosition;
      
      if (direction === requestedDir.current) {
        newDebugInfo.canMoveRequested = canMove;
        newDebugInfo.requestedDir = direction;
      }
      if (direction === currentDirection.current) {
        newDebugInfo.canMoveCurrent = canMove;
        newDebugInfo.currentDir = direction;
      }
      
      return newDebugInfo;
    });
    
    return canMove;
  };

  // Counter for game loop iterations - outside the gameLoop function to persist
  const loopCountRef = useRef(0);
  
  const gameLoop = () => {
    // Increment loop counter with every call
    loopCountRef.current += 1;
    
    const now = Date.now();
    const elapsed = now - lastMoveTime.current;
    
    // Track movement log to help diagnose issues
    const logEntries: string[] = [];
    
    // Always add a log entry for the game loop execution
    logEntries.push(`Loop #${loopCountRef.current}: elapsed=${elapsed}ms, speed=${currentSpeed}ms`);
    
    // Only process movement if enough time has elapsed
    if (elapsed >= currentSpeed) {
      // CRITICAL: Update timestamp immediately to prevent timing issues
      lastMoveTime.current = now;
      
      logEntries.push(`Move attempt at ${now}`);
      
      let moved = false;
      let wallCollisionOccurred = false;
      
      // Check movement possibilities - very critical for continuous movement
      const canMoveCurrentDir = canMoveInDirection(currentDirection.current);
      const canMoveRequestedDir = canMoveInDirection(requestedDir.current);
      
      logEntries.push(`Can move: current=${canMoveCurrentDir} (${currentDirection.current}), requested=${canMoveRequestedDir} (${requestedDir.current})`);
      
      // First priority: Handle direction changes ONLY if explicitly requested by the player
      if (requestedDir.current !== currentDirection.current && canMoveRequestedDir) {
        // If we can move in the requested direction, change Pac-Man's direction
        setPacmanDirection(requestedDir.current);
        moved = tryMove(requestedDir.current);
        
        if (moved) {
          logEntries.push(`Changed direction to: ${requestedDir.current}`);
          // Important: Update the current direction ref immediately
          currentDirection.current = requestedDir.current;
          consecutiveFailedMoves.current = 0;
        } else {
          logEntries.push(`Failed direction change to: ${requestedDir.current}`);
        }
      } 
      // Second priority: Continue in current direction regardless
      else if (canMoveCurrentDir) {
        // Always try to continue in the current direction
        moved = tryMove(currentDirection.current);
        
        if (moved) {
          logEntries.push(`Continued in direction: ${currentDirection.current}`);
          consecutiveFailedMoves.current = 0;
        } else {
          logEntries.push(`Failed continuation in: ${currentDirection.current}`);
        }
      } 
      // Handle wall collisions - just stop at walls, no auto-turning
      else {
        // Just increment failed moves counter but don't auto-change direction
        logEntries.push(`Hit wall, staying in place`);
        consecutiveFailedMoves.current++;
        wallCollisionOccurred = true;
      }
      
      // Update Pac-Man's moving state based on movement result
      setIsPacmanMoving(moved);
      
      // If no movement occurred, adjust speed
      if (!moved) {
        // If still no movement, gradually slow down
        setCurrentSpeed(prev => Math.min(prev * 1.5, MOVEMENT_SPEED * 2));
        wallCollisionOccurred = true;
        logEntries.push(`No movement possible, consecutive fails: ${consecutiveFailedMoves.current}`);
      }
      
      // Update debug info with latest state
      setDebugInfo(prev => {
        // Re-check movement abilities for accurate debug info
        const canMoveCurrent = canMoveInDirection(currentDirection.current);
        const canMoveRequested = canMoveInDirection(requestedDir.current);
        
        // Keep only the last 5 log entries
        const allLogs = [...logEntries, ...(prev.movementLog || [])].slice(0, 5);
        
        return {
          ...prev,
          position: pacmanPosition,
          speed: currentSpeed,
          currentDir: currentDirection.current,
          requestedDir: requestedDir.current,
          canMoveCurrent: canMoveCurrent,
          canMoveRequested: canMoveRequested,
          moved: moved,
          wallCollisions: wallCollisionOccurred ? prev.wallCollisions + 1 : prev.wallCollisions,
          consecutiveFailedMoves: consecutiveFailedMoves.current,
          lastMoveTime: now,
          gameLoopCount: loopCountRef.current, // Use the ref value for consistent counting
          movementLog: allLogs
        };
      });
      
      if (moved) {
        // Accelerate movement after successful moves but cap minimum speed
        setCurrentSpeed(prev => Math.max(prev * ACCELERATION, MIN_SPEED));
      }
      
      lastMoveTime.current = now;
    }
    
    animationFrameId.current = requestAnimationFrame(gameLoop);
  };
  
  // Helper function to get possible 90-degree turns based on current direction
  const getPossibleTurns = (dir: 'right' | 'left' | 'up' | 'down') => {
    switch (dir) {
      case 'right':
      case 'left':
        return ['up', 'down'] as const;
      case 'up':
      case 'down':
        return ['left', 'right'] as const;
      default:
        return ['up', 'down', 'left', 'right'] as const;
    }
  };

  // Create a ref for game loop function outside the effect
  const gameLoopRef = useRef<(() => void) | null>(null);
  
  // Start/stop game loop - completely independent from React's rendering
  useEffect(() => {
    // Define the game loop wrapper that runs continuously
    gameLoopRef.current = () => {
      if (!isMoving) return;
      
      // Execute one step of the game logic
      gameLoop();
      
      // CRITICAL: Always request the next frame, even if we're not moving
      // This ensures the loop keeps running
      animationFrameId.current = requestAnimationFrame(() => {
        if (gameLoopRef.current) {
          gameLoopRef.current();
        }
      });
    };
    
    // Start the game loop immediately
    const startGameLoop = () => {
      // Clear any existing animation frame first
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      
      // Start a new animation frame loop
      animationFrameId.current = requestAnimationFrame(() => {
        if (gameLoopRef.current) {
          gameLoopRef.current();
        }
      });
    };
    
    // Start the game loop
    startGameLoop();
    
    // Cleanup function to prevent memory leaks
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
        setRequestedDirection('right');
      } else {
        setRequestedDirection('left');
      }
    } else {
      // Vertical swipe
      if (dy > 0) {
        setRequestedDirection('down');
      } else {
        setRequestedDirection('up');
      }
    }
  };

  // Store grid position as a ref to avoid React state update delays
  const positionRef = useRef(INITIAL_PACMAN_POSITION);
  
  // Store pixel position for smooth animation
  const [pixelPosition, setPixelPosition] = useState({
    x: INITIAL_PACMAN_POSITION.col * CELL_SIZE,
    y: INITIAL_PACMAN_POSITION.row * CELL_SIZE
  });
  
  // Animation value for smooth movement
  const animatedPosition = useRef(new Animated.ValueXY({
    x: INITIAL_PACMAN_POSITION.col * CELL_SIZE,
    y: INITIAL_PACMAN_POSITION.row * CELL_SIZE
  })).current;
  
  // Track if movement animation is in progress
  const isAnimatingRef = useRef(false);
  
  // Subscribe to animation position changes
  useEffect(() => {
    const listener = animatedPosition.addListener(value => {
      setPixelPosition(value);
    });
    
    return () => {
      animatedPosition.removeListener(listener);
    };
  }, []);
  
  const tryMove = (direction: 'right' | 'left' | 'up' | 'down') => {
    // CRITICAL FIX: Use the ref value instead of React state for current position
    // This ensures we're always moving from the most recent position
    const currentPos = positionRef.current;
    
    // Calculate the new grid position
    const newPosition = { ...currentPos };

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
        } else {
          return false; // Can't move up at the top edge
        }
        break;
      case 'down':
        if (newPosition.row < mazeState.length - 1) {
          newPosition.row = newPosition.row + 1;
        } else {
          return false; // Can't move down at the bottom edge
        }
        break;
    }

    // Only make the move if the new position is valid (not a wall)
    try {
      // If position is valid (not a wall)
      const cellType = mazeState[newPosition.row]?.[newPosition.col];
      if (cellType !== CELL_TYPES.WALL) {
        // Debug log
        console.log(`Moving from (${currentPos.row},${currentPos.col}) to (${newPosition.row},${newPosition.col})`);
        
        // Immediately set PacMan as moving
        setIsPacmanMoving(true);
        
        // CRITICAL FIX: Always attempt to collect at the new position
        // This ensures dots are collected as Pac-Man moves over them
        collectDot(newPosition.row, newPosition.col);
        
        // Update both the ref and the React state
        positionRef.current = newPosition;
        setPacmanPosition(newPosition);
        
        return true; // Successfully moved
      }
    } catch (e) {
      console.error("Error in tryMove:", e, newPosition);
    }
    
    return false; // Could not move
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
          <PacMan 
            direction={pacmanDirection} 
            isMoving={isPacmanMoving} // Only animate when actually moving
          />
        </View>
      );
    }

    // Create a unique key for position checking
    const posKey = `${rowIndex}-${colIndex}`;
    
    // Check if this dot has been collected
    const isCollected = collectedDotsRef.current.has(posKey);
    
    // Force empty cell if collected, regardless of maze state
    const effectiveCell = isCollected ? CELL_TYPES.EMPTY : cell;
    
    const cellStyle = [
      styles.cell,
      effectiveCell === CELL_TYPES.WALL && styles.wall,
      effectiveCell === CELL_TYPES.DOT && styles.dot,
      effectiveCell === CELL_TYPES.POWER_PELLET && styles.powerPellet,
    ];

    return (
      <View key={`${rowIndex}-${colIndex}`} style={cellStyle}>
        {effectiveCell === CELL_TYPES.DOT && <View style={styles.dotInner} />}
        {effectiveCell === CELL_TYPES.POWER_PELLET && <View style={styles.powerPelletInner} />}
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <View style={[styles.container, showDebug && styles.containerWithDebug]}>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>Score: {score}</Text>
          <View style={styles.controlsContainer}>
            <Text style={styles.controlsText}>
              {Platform.OS === 'web' 
                ? 'Controls: Arrow Keys to move | Space to pause/resume | Press \'d\' for debug'
                : 'Swipe to control PacMan'
              }
            </Text>
            <View style={styles.debugButtonContainer}>
              <Text 
                style={styles.debugButton} 
                onPress={() => {
                  console.log('Debug button pressed');
                  setShowDebug(prev => !prev);
                }}
              >
                {showDebug ? 'Hide Debug' : 'Show Debug'}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.gameAreaContainer} {...panResponder.panHandlers}>
          {/* Render maze directly */}
          <View style={styles.mazeContainer}>
            {mazeState.map((row, rowIndex) => (
              <View key={`row-${rowIndex}`} style={styles.row}>
                {row.map((cell, colIndex) => (
                  renderCell(cell, rowIndex, colIndex)
                ))}
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Debug information panel - side panel when enabled */}
      {showDebug && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>DEBUG INFORMATION</Text>
          
          <View style={styles.debugSection}>
            <Text style={styles.debugSectionTitle}>PacMan</Text>
            <Text style={styles.debugText}>Position: ({pacmanPosition.row}, {pacmanPosition.col})</Text>
            <Text style={styles.debugText}>Current Direction: {currentDirection.current}</Text>
            <Text style={styles.debugText}>Requested Direction: {requestedDir.current}</Text>
          </View>
          
          <View style={styles.debugSection}>
            <Text style={styles.debugSectionTitle}>Movement</Text>
            <Text style={styles.debugText}>Can Move Current: {debugInfo.canMoveCurrent ? 'Yes' : 'No'}</Text>
            <Text style={styles.debugText}>Can Move Requested: {debugInfo.canMoveRequested ? 'Yes' : 'No'}</Text>
            <Text style={styles.debugText}>Test Position: ({debugInfo.testPosition?.row || '?'}, {debugInfo.testPosition?.col || '?'})</Text>
            <Text style={styles.debugText}>Cell Type: '{debugInfo.currentCell}'</Text>
          </View>
          
          <View style={styles.debugSection}>
            <Text style={styles.debugSectionTitle}>Performance</Text>
            <Text style={styles.debugText}>Speed: {Math.round(currentSpeed)}ms</Text>
            <Text style={styles.debugText}>Last Move: {debugInfo.moved ? 'Success' : 'Failed'}</Text>
            <Text style={styles.debugText}>Wall Collisions: {debugInfo.wallCollisions}</Text>
            <Text style={styles.debugText}>Failed Moves: {debugInfo.consecutiveFailedMoves}</Text>
            <Text style={styles.debugText}>Game Loop Count: {debugInfo.gameLoopCount}</Text>
            <Text style={styles.debugText}>Dots Collected: {collectedDotsRef.current.size}</Text>
          </View>
          
          <View style={styles.debugSection}>
            <Text style={styles.debugSectionTitle}>Movement Log</Text>
            {debugInfo.movementLog?.map((entry, idx) => (
              <Text key={idx} style={styles.debugText}>• {entry}</Text>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#000',
    flexDirection: 'row',
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
  },
  containerWithDebug: {
    width: '65%', // Reduce game width when debug panel is shown
  },
  gameAreaContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden', // Changed to hidden to prevent scrolling issues
  },
  mazeContainer: {
    position: 'relative', // Container for both maze and PacMan
    width: 'auto',
    height: 'auto',
  },
  gameArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pacmanContainer: {
    position: 'absolute',
    width: CELL_SIZE,
    height: CELL_SIZE,
    zIndex: 10, // Make sure PacMan appears above maze
    backgroundColor: 'transparent', // Make sure the background is transparent
  },
  scoreContainer: {
    padding: 10,
    alignItems: 'center',
  },
  scoreText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  controlsContainer: {
    padding: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  controlsText: {
    color: '#FFF',
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 8,
  },
  debugButtonContainer: {
    marginTop: 5,
  },
  debugButton: {
    backgroundColor: '#333',
    color: '#0F0',
    padding: 8,
    paddingHorizontal: 15,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#0F0',
    fontSize: 14,
    fontWeight: 'bold',
  },
  debugContainer: {
    width: '35%',
    backgroundColor: '#111',
    borderLeftWidth: 2,
    borderLeftColor: '#0F0',
    padding: 15,
    height: '100%',
    overflow: 'scroll',
  },
  debugTitle: {
    color: '#FF0', // Yellow for title
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 15,
    textAlign: 'center',
  },
  debugSection: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 10,
  },
  debugSectionTitle: {
    color: '#FF9', // Light yellow for section titles
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 5,
  },
  debugText: {
    color: '#0F0', // Terminal green
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 2,
    textAlign: 'left',
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
