import { Navigate, Route, Routes } from "react-router-dom";
import SeaBattle from "../components/seaBattle";
import Welcome from "../components/hello";
import TicTacToe from "../components/tictactoe";
import Profile from "../components/profile";
import AuthorizationForm from "../pages/auth";
import MainPage from "../pages/main";

const App = () => {
	return (
		<Routes>
			<Route path="/login" element={<AuthorizationForm />} />
			<Route element={<MainPage />}>
				<Route path="/" index element={<Welcome />} />
				<Route path="/tictactoe" element={<TicTacToe />} />
				<Route path="/seabattle" element={<SeaBattle />} />
				<Route path="/profile" element={<Profile />} />
				<Route path="/login" element={<AuthorizationForm />} />
			</Route>

			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
	);
};

export default App;
