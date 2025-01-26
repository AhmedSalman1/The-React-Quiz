import { createContext, useContext, useEffect, useReducer } from 'react';

const QuizContext = createContext();

const SECS_PER_QUESTION = 20;

const initialState = {
	questions: [],
	status: 'loading', // 'loading', 'error', 'ready', 'active', 'finished'
	index: 0,
	answer: null,
	points: 0,
	highscore: 0,
	secondsRemaining: null,
};

function reducer(state, action) {
	switch (action.type) {
		case 'dataReceived':
			return {
				...state,
				questions: action.payload,
				status: 'ready',
			};
		case 'dataFailed':
			return {
				...state,
				status: 'error',
			};
		case 'start':
			return {
				...state,
				status: 'active',
				secondsRemaining: state.questions.length * SECS_PER_QUESTION,
			};
		case 'newAnswer':
			const question = state.questions.at(state.index);

			return {
				...state,
				answer: action.payload,
				points:
					action.payload === question.correctOption ? state.points + question.points : state.points,
			};
		case 'nextQuestion':
			return {
				...state,
				index: state.index + 1,
				answer: null,
			};
		case 'finish':
			return {
				...state,
				status: 'finished',
				highscore: state.points > state.highscore ? state.points : state.highscore,
			};
		case 'restart':
			return {
				...initialState,
				questions: state.questions,
				highscore: state.highscore,
				status: 'ready',
			};
		case 'tick':
			return {
				...state,
				secondsRemaining: state.secondsRemaining - 1,
				status: state.secondsRemaining === 0 ? 'finished' : state.status,
			};
		default:
			throw new Error('Unknown action');
	}
}

function QuizProvider({ children }) {
	const [{ questions, status, index, answer, points, highscore, secondsRemaining }, dispatch] =
		useReducer(reducer, initialState);

	const numQuestions = questions.length;
	const maxPoints = questions.reduce((prev, curr) => prev + curr.points, 0);

	useEffect(() => {
		async function fetchData() {
			try {
				const res = await fetch('http://localhost:8000/questions');
				const questions = await res.json();

				dispatch({ type: 'dataReceived', payload: questions });
			} catch (error) {
				dispatch({ type: 'dataFailed' });
			}
		}
		fetchData();
	}, []);

	return (
		<QuizContext.Provider
			value={{
				questions,
				status,
				index,
				answer,
				points,
				highscore,
				secondsRemaining,
				numQuestions,
				maxPoints,
				dispatch,
			}}>
			{children}
		</QuizContext.Provider>
	);
}

const useQuiz = () => {
	const context = useContext(QuizContext);
	if (context === undefined) {
		throw new Error('useQuiz must be used within a QuizProvider');
	}
	return context;
};

export { useQuiz, QuizProvider };
