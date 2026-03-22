import { FC } from "react";
import { Col, Row, Skeleton, Typography } from "antd";
import { Link } from "react-router-dom";
import { GameCard } from "./card";
import { useQuery } from "@tanstack/react-query";
import { getGames } from "../../api";
import { map } from "lodash";

const { Title } = Typography;

const Welcome: FC = () => {
	const games = useQuery({
		queryFn: getGames,
		queryKey: ["games"],
	});
	if (games.isLoading) {
		return <Skeleton />;
	}
	return (
		<>
			<Title level={2}>Приветственная страница GameHub</Title>
			<Row gutter={[16, 16]}>
				{map(games.data?.slice().reverse(), (game) => (
					<Col key={game.name} xs={24} sm={12}>
						<Link
							to={
								game.name === "Крестики нолики"
									? "/tictactoe"
									: ""
							}
						>
							<GameCard
								title={game.name}
								description={game.description}
								imageUrl={game.picture}
							/>
						</Link>
					</Col>
				))}
			</Row>
		</>
	);
};

export default Welcome;
