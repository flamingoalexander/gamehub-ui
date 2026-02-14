import { FC } from "react";
import {Card, Col, Row, Typography} from "antd";
import {Link} from "react-router-dom";

const { Title, Text } = Typography;

const Welcome: FC = () => {
	return (
		<>
			<Title level={2}>Приветственная страница GameHub</Title>

			<Row gutter={[16, 16]}>
				<Col xs={24} sm={12}>
					<Link to="/tictactoe" style={{ display: "block" }}>
						<Card hoverable style={{ height: "100%" }}>
							<Title level={4} style={{ marginBottom: 8 }}>
								Крестики-нолики
							</Title>
							<Text type="secondary">Играть</Text>
						</Card>
					</Link>
				</Col>

				<Col xs={24} sm={12}>
					<Link to="/seabattle" style={{ display: "block" }}>
						<Card hoverable style={{ height: "100%" }}>
							<Title level={4} style={{ marginBottom: 8 }}>
								Морской бой
							</Title>
							<Text type="secondary">Играть</Text>
						</Card>
					</Link>
				</Col>
			</Row>
		</>
	);
};

export default Welcome;
