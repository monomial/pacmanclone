import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import GameBoard from '../src/components/GameBoard';

export default function PacmanGame() {
  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      <GameBoard />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
