export const colors = {
  primary: {
    main: '#58CC02',      // Зеленый Duolingo (изменено с Navy Blue)
    light: '#89E219',
    dark: '#46A302',
  },
  accent: {
    main: '#FFC729',      // Golden Yellow
    light: '#FFD666',
    dark: '#E5B024',
  },
  success: {
    main: '#58CC02',      // Green
    light: '#7BE004',
    dark: '#46A302',
  },
  warning: {
    main: '#FFC800',
    light: '#FFD740',
    dark: '#FFB300',
  },
  error: {
    main: '#FF4B4B',     // Red
    light: '#FF6B6B',
    dark: '#E53838',
  },
  info: {
    main: '#1CB0F6',      // Blue
    light: '#3DC0FF',
    dark: '#0E9CD9',
  },
  secondary: {
    main: '#8549BA',      // Purple
    light: '#A560E8',
    dark: '#6A3A94',
  },
  background: {
    default: '#F7F7F7',
    paper: '#FFFFFF',
    dark: '#2C4058',
    secondary: '#F0F0F0',
  },
  text: {
    primary: '#3C3C3C',
    secondary: '#AFAFAF',
    disabled: '#D3D3D3',
    inverse: '#FFFFFF',
  },
  mastery: {
    none: '#9E9E9E',
    beginner: '#FF9800',
    learning: '#FFC107',
    knows: '#4CAF50',
    confident: '#2196F3',
    master: '#673AB7',
  },
  // ДОБАВЛЕНО: Градиенты для мультяшного дизайна
  gradient: {
    green: ['#58CC02', '#89E219'] as const,
    blue: ['#1CB0F6', '#4FC3F7'] as const,
    purple: ['#CE82FF', '#B967FF'] as const,
    orange: ['#FF9600', '#FFB800'] as const,
    red: ['#FF4B4B', '#FF6B6B'] as const,
  },
  // ДОБАВЛЕНО: Дополнительные цвета
  border: '#E5E5E5',
  disabled: '#DEDEDE',
  shadow: 'rgba(0, 0, 0, 0.1)',
  heart: '#FF4B4B',
  star: '#FFC800',
  xp: '#FFA500',
  streak: '#FF9600',
};
