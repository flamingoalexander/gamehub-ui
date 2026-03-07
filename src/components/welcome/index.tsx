import { FC } from "react";
import { Card, Col, Flex, Row, Typography } from "antd";
import { Link } from "react-router-dom";

const { Title, Text } = Typography;

const Welcome: FC = () => {
	return (
		<>
			<Title level={2}>Приветственная страница GameHub</Title>

			<Row gutter={[16, 16]}>
				<Col xs={24} sm={12}>
					<Link to="/tictactoe" style={{ display: "block" }}>
						<Card
							hoverable
							style={{
								height: 180,
								border: 0,
								overflow: "hidden",
								backgroundImage: `linear-gradient(0deg, rgba(0,0,0,.55), rgba(0,0,0,.2)), url(${"tictactoe.png"})`,
								backgroundSize: "cover",
								backgroundPosition: "center",
							}}
						>
							<Flex
								align={"center"}
								orientation={"vertical"}
								justify={"end"}
								style={{ height: "100%" }}
							>
								<Title level={4} style={{ marginBottom: 8 }}>
									Крестики-нолики
								</Title>
								<Text type="secondary">Играть</Text>
							</Flex>
						</Card>
					</Link>
				</Col>

				<Col xs={24} sm={12}>
					<Link to="/seabattle" style={{ display: "block" }}>
						<Card
							hoverable
							size={"small"}
							style={{
								height: 180,
								border: 0,
								overflow: "hidden",
								backgroundImage: `linear-gradient(0deg, rgba(0,0,0,.55), rgba(0,0,0,.2)), url(${"korabli.jpg"})`,
								backgroundSize: "cover",
								backgroundPosition: "center",
							}}
						>
							<Flex
								align={"center"}
								orientation={"vertical"}
								justify={"end"}
								style={{ height: "100%" }}
							>
								<Title level={4} style={{ marginBottom: 8, color: "#fff" }}>
									Морской бой
								</Title>
								<Text style={{ color: "rgba(255,255,255,.85)" }}>Играть</Text>
							</Flex>
						</Card>
					</Link>
				</Col>
			</Row>
		</>
	);
};

export default Welcome;
