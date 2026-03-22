import {
	Button,
	Card,
	Space,
	Tag,
	Image,
	Typography,
	Row,
	Col,
	Flex,
} from "antd";
import { FC } from "react";
import { CaretLeftOutlined } from "@ant-design/icons";
const { Title, Paragraph } = Typography;
export type GameCardProps = {
	title: string;
	description: string;
	imageUrl: string;

	achievementsText?: string;
	onPlay?: () => void;
};

export const GameCard: FC<GameCardProps> = ({
	title,
	description,
	imageUrl,
	achievementsText = "Достижений 0/0",
	onPlay,
}) => {
	const canPlay = title === "Крестики нолики";
	return (
		<Card>
			<Row gutter={16} align="top" wrap={false}>
				<Col flex="160px">
					<Flex vertical gap={12}>
						<Card
							size="small"
							style={{ padding: 0, margin: 0, backgroundColor: "white" }}
						>
							<Image src={imageUrl} alt={title} preview={false} />
						</Card>
						<Button
							type="default"
							icon={<CaretLeftOutlined />}
							onClick={onPlay}
						>
							{canPlay ? "Играть" : "В разработке"}
						</Button>
					</Flex>
				</Col>
				<Col flex="auto">
					<Flex vertical gap={8}>
						<Title level={4}>{title}</Title>
						<Paragraph ellipsis={{ rows: 4 }}>{description}</Paragraph>
						<Space>
							<Tag>{achievementsText}</Tag>
						</Space>
					</Flex>
				</Col>
			</Row>
		</Card>
	);
};
