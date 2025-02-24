import { Dimensions } from 'react-native';

export const GRID_WIDTH = 28;
export const GRID_HEIGHT = 31;

// Cell types
export const CELL_TYPES = {
  WALL: 'W',
  DOT: '.',
  EMPTY: ' ',
  POWER_PELLET: 'O',
  PACMAN: 'P',
} as const;

// Original Pacman maze layout
export const MAZE_LAYOUT = [
  'WWWWWWWWWWWWWWWWWWWWWWWWWWWW',
  'W............WW............W',
  'W.WWWW.WWWWW.WW.WWWWW.WWWW.W',
  'W.WWWW.WWWWW.WW.WWWWW.WWWW.W',
  'W.WWWW.WWWWW.WW.WWWWW.WWWW.W',
  'W..........................W',
  'W.WWWW.WW.WWWWWWWW.WW.WWWW.W',
  'W.WWWW.WW.WWWWWWWW.WW.WWWW.W',
  'W......WW....WW....WW......W',
  'WWWWWW.WWWWW WW WWWWW.WWWWWW',
  '     W.WWWWW WW WWWWW.W     ',
  '     W.WW          WW.W     ',
  '     W.WW WWW--WWW WW.W     ',
  'WWWWWW.WW W      W WW.WWWWWW',
  '      .   W      W   .      ',
  'WWWWWW.WW W      W WW.WWWWWW',
  '     W.WW WWWWWWWW WW.W     ',
  '     W.WW          WW.W     ',
  '     W.WW WWWWWWWW WW.W     ',
  'WWWWWW.WW WWWWWWWW WW.WWWWWW',
  'W............WW............W',
  'W.WWWW.WWWWW.WW.WWWWW.WWWW.W',
  'W.WWWW.WWWWW.WW.WWWWW.WWWW.W',
  'W...WW................WW...W',
  'WWW.WW.WW.WWWWWWWW.WW.WW.WWW',
  'WWW.WW.WW.WWWWWWWW.WW.WW.WWW',
  'W......WW....WW....WW......W',
  'W.WWWWWWWWWW.WW.WWWWWWWWWW.W',
  'W.WWWWWWWWWW.WW.WWWWWWWWWW.W',
  'W..........................W',
  'WWWWWWWWWWWWWWWWWWWWWWWWWWWW',
];

const window = Dimensions.get('window');
export const CELL_SIZE = Math.floor(window.width / GRID_WIDTH); 