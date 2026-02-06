import { FC } from "react";
import { Card, Avatar, Typography, Descriptions, Button, Space } from "antd";
import { UserOutlined, MailOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const mockUser = {
	name: "Александр Иванов",
	nickname: "alexdev",
	email: "alex@example.com",
	role: "Игрок",
	level: 12,
	bio: "Люблю веб-разработку и игры 🎮",
};

const Profile: FC = () => {
	return (
		<Card
			style={{ maxWidth: 500, margin: "40px auto" }}
			actions={[
				<Button type="primary" key="edit">
					Редактировать
				</Button>,
				<Button key="logout">Выйти</Button>,
			]}
		>
			<Space orientation="vertical" align="center" style={{ width: "100%" }}>
				<Avatar size={96} icon={<UserOutlined />} />
				<Title level={3} style={{ marginBottom: 0 }}>
					{mockUser.name}
				</Title>
				<Text type="secondary">@{mockUser.nickname}</Text>
			</Space>

			<Descriptions column={1} style={{ marginTop: 24 }}>
				<Descriptions.Item label="Email">
					<MailOutlined /> {mockUser.email}
				</Descriptions.Item>

				<Descriptions.Item label="Роль">{mockUser.role}</Descriptions.Item>

				<Descriptions.Item label="Уровень">{mockUser.level}</Descriptions.Item>

				<Descriptions.Item label="О себе">{mockUser.bio}</Descriptions.Item>
			</Descriptions>
		</Card>
	);
};

export default Profile;
