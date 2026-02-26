import { Navigate, Route, Routes } from "react-router-dom";
import SeaBattle from "../components/seaBattle";
import Welcome from "../components/welcome";
import TicTacToe from "../components/tictactoe";
import Profile from "../components/profile";
import AuthorizationForm from "../components/auth/authorizationForm";
import MainPage from "../pages/main";
import AchievementsPage from "../components/achievements";
import Leaderboard from "../components/leaderboard";
import AuthorizationWrapper from "../pages/auth";
import RegistrationForm from "../components/auth/registrationForm";

const App = () => {
	return (
		<Routes>
			<Route element={<AuthorizationWrapper />}>
				<Route path="/login" element={<AuthorizationForm />} />
				<Route path="/register" element={<RegistrationForm />} />
			</Route>
			<Route element={<MainPage />}>
				<Route path="/" index element={<Welcome />} />
				<Route path="/tictactoe" element={<TicTacToe />} />
				<Route path="/seabattle" element={<SeaBattle />} />
				<Route path="/profile" element={<Profile />} />
				<Route path="/achievements" element={<AchievementsPage />} />
				<Route path="/leaderboard" element={<Leaderboard />} />
			</Route>

			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
	);
};

export default App;
