// pages/LeaderboardPage.tsx
import React, { FC } from "react";
import { Card, Skeleton, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { getLeaders, Leader } from "../../api";
import { useQuery } from "@tanstack/react-query";

const { Title } = Typography;

const columns: ColumnsType<Leader> = [
	{
		title: "Место в рейтинге",
		dataIndex: "#",
		key: "#",
		width: 70,
		render: (game) => {
			if (game === 1) return <span style={{ fontSize: 24 }}>🥇</span>;
			if (game === 2) return <span style={{ fontSize: 24 }}>🥈</span>;
			if (game === 3) return <span style={{ fontSize: 24 }}>🥉</span>;
			return <span style={{ marginLeft: 10, fontSize: 24 }}>{game}</span>;
		},
	},
	{
		title: "Никнейм игрока",
		dataIndex: "nickname",
		key: "nickname",
	},
	{
		title: "Всего достижений",
		dataIndex: "total_achievs",
		key: "total_achievs",
		render: (game) => (
			<Tag color={game === "Крестики-нолики" ? "blue" : "geekblue"}>{game}</Tag>
		),
	},
	{
		title: "Средний % достижений за игру",
		dataIndex: "achieve_%",
		key: "achieve_%",
	},
];

const Leaderboard: FC = () => {
	const leadersQuery = useQuery<Leader[]>({
		queryFn: getLeaders,
		queryKey: ["leaders"],
	});
	if (leadersQuery.isLoading) {
		return <Skeleton />;
	}
	return (
		<Space orientation="vertical" size={16} style={{ width: "100%" }}>
			<Card>
				<Title level={3} style={{ margin: 0 }}>
					Таблица лидеров
				</Title>
			</Card>
			<Card>
				<Table
					columns={columns}
					dataSource={leadersQuery.data}
					pagination={{ pageSize: 8 }}
					scroll={{ x: true }}
				/>
			</Card>
		</Space>
	);
};

export default Leaderboard;
