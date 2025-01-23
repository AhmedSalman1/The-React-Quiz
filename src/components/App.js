import { useEffect, useReducer } from 'react';
import Header from './Header';
import Main from './Main';
import Loader from './Loader';
import Error from './Error';
import StartScreen from './StartScreen';
import Question from './Question';
import NextButton from './NextButton';
import Progress from './Progress';

const initialState = {
	questions: [],
	status: 'loading', // 'loading', 'error', 'ready', 'active', 'finished'
	index: 0,
	answer: null,
	points: 0,
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
		default:
			throw new Error('Unknown action');
	}
}

export default function App() {
	const [{ questions, status, index, answer, points }, dispatch] = useReducer(
		reducer,
		initialState
	);

	const numQuestions = questions.length;
	const maxPoints = questions.reduce((prev, curr) => prev + curr.points, 0);

	useEffect(() => {
		async function fetchData() {
			try {
				const res = await fetch('http://localhost:8000/questions');
				const questions = await res.json();

				dispatch({ type: 'dataReceived', payload: questions });
				// console.log(questions);
			} catch (error) {
				// console.error('Error fetching questions:', error);
				dispatch({ type: 'dataFailed' });
			}
		}
		fetchData();
	}, []);

	return (
		<div className="app">
			<Header />

			<Main>
				{status === 'loading' && <Loader />}
				{status === 'error' && <Error />}
				{status === 'ready' && <StartScreen numQuestions={numQuestions} dispatch={dispatch} />}
				{status === 'active' && (
					<>
						<Progress
							numQuestions={numQuestions}
							index={index}
							points={points}
							maxPoints={maxPoints}
							answer={answer}
						/>
						<Question question={questions[index]} dispatch={dispatch} answer={answer} />
						<NextButton dispatch={dispatch} answer={answer} />
					</>
				)}
			</Main>
		</div>
	);
}
