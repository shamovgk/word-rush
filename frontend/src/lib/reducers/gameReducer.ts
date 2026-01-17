// frontend/src/lib/reducers/gameReducer.ts
export interface GameState {
  currentQuestionIndex: number;
  score: number;
  lives: number;
  correctAnswers: number;
  wrongAnswers: number;
  combo: number;
  gameStatus: 'playing' | 'paused' | 'ended';
  answeredQuestions: Set<string>;
}

export const initialGameState: GameState = {
  currentQuestionIndex: 0,
  score: 0,
  lives: 3,
  correctAnswers: 0,
  wrongAnswers: 0,
  combo: 0,
  gameStatus: 'playing',
  answeredQuestions: new Set(),
};

export type GameAction =
  | { type: 'ANSWER'; payload: { lexemeId: string; isCorrect: boolean } }
  | { type: 'NEXT_QUESTION' }
  | { type: 'LOSE_LIFE' }
  | { type: 'SET_LIVES'; payload: number }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'RESET' };

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'ANSWER':
      const { lexemeId, isCorrect } = action.payload;
      const newAnsweredQuestions = new Set(state.answeredQuestions);
      newAnsweredQuestions.add(lexemeId);

      if (isCorrect) {
        const comboMultiplier = Math.floor(state.combo / 3) + 1;
        const baseScore = 10;
        const scoreToAdd = baseScore * comboMultiplier;

        return {
          ...state,
          score: state.score + scoreToAdd,
          correctAnswers: state.correctAnswers + 1,
          combo: state.combo + 1,
          answeredQuestions: newAnsweredQuestions,
        };
      } else {
        return {
          ...state,
          wrongAnswers: state.wrongAnswers + 1,
          combo: 0,
          answeredQuestions: newAnsweredQuestions,
        };
      }

    case 'NEXT_QUESTION':
      return {
        ...state,
        currentQuestionIndex: state.currentQuestionIndex + 1,
      };

    case 'LOSE_LIFE':
      return {
        ...state,
        lives: Math.max(0, state.lives - 1),
      };

    case 'SET_LIVES':
      return {
        ...state,
        lives: action.payload,
      };

    case 'PAUSE':
      return {
        ...state,
        gameStatus: 'paused',
      };

    case 'RESUME':
      return {
        ...state,
        gameStatus: 'playing',
      };

    case 'RESET':
      return initialGameState;

    default:
      return state;
  }
};
