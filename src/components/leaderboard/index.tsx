// pages/LeaderboardPage.tsx
import React from "react";
import { Card, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

type LeaderRow = {
	key: string;
	rank: number;
	player: string;
	game: "Крестики-нолики" | "Морской бой";
	rating: number;
	wins: number;
	losses: number;
};

const data: LeaderRow[] = [
	{
		key: "1",
		rank: 1,
		player: "Neo",
		game: "Крестики-нолики",
		rating: 2480,
		wins: 120,
		losses: 33,
	},
	{
		key: "2",
		rank: 2,
		player: "Trinity",
		game: "Морской бой",
		rating: 2395,
		wins: 88,
		losses: 29,
	},
	{
		key: "3",
		rank: 3,
		player: "Morpheus",
		game: "Крестики-нолики",
		rating: 2310,
		wins: 97,
		losses: 41,
	},
	{
		key: "4",
		rank: 4,
		player: "Smith",
		game: "Морской бой",
		rating: 2250,
		wins: 75,
		losses: 40,
	},
];

const columns: ColumnsType<LeaderRow> = [
	{
		title: "#",
		dataIndex: "rank",
		key: "rank",
		width: 70,
		sorter: (a, b) => a.rank - b.rank,
	},
	{
		title: "Игрок",
		dataIndex: "player",
		key: "player",
		sorter: (a, b) => a.player.localeCompare(b.player),
	},
	{
		title: "Игра",
		dataIndex: "game",
		key: "game",
		filters: [
			{ text: "Крестики-нолики", value: "Крестики-нолики" },
			{ text: "Морской бой", value: "Морской бой" },
		],
		onFilter: (value, record) => record.game === value,
		render: (game) => (
			<Tag color={game === "Крестики-нолики" ? "blue" : "geekblue"}>{game}</Tag>
		),
	},
	{
		title: "Рейтинг",
		dataIndex: "rating",
		key: "rating",
		sorter: (a, b) => a.rating - b.rating,
		defaultSortOrder: "descend",
	},
	{
		title: "Победы",
		dataIndex: "wins",
		key: "wins",
		sorter: (a, b) => a.wins - b.wins,
	},
	{
		title: "Поражения",
		dataIndex: "losses",
		key: "losses",
		sorter: (a, b) => a.losses - b.losses,
	},
];

const Leaderboard: React.FC = () => {
	return (
		<Space orientation="vertical" size={16} style={{ width: "100%" }}>
			<Card>
				<Title level={3} style={{ margin: 0 }}>
					Таблица лидеров
				</Title>
				<Text type="secondary">Рейтинг игроков по играм</Text>
			</Card>

			<Card>
				<Table
					columns={columns}
					dataSource={data}
					pagination={{ pageSize: 8 }}
					scroll={{ x: true }}
				/>
			</Card>
		</Space>
	);
};

export default Leaderboard;
