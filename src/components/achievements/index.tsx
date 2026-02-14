import React, { useMemo, useState } from "react";
import { Card, Progress, Segmented, Space, Tag, Typography, List } from "antd";

type Achievement = {
  id: string;
  title: string;
  description: string;
  progress: number;
  category: "Игры" | "Социальные" | "Серия";
};

const mock: Achievement[] = [
  { id: "a1", title: "Первая победа", description: "Выиграй 1 матч", progress: 100, category: "Игры" },
  { id: "a2", title: "Серия побед", description: "Выиграй 5 матчей подряд", progress: 40, category: "Серия" },
  { id: "a3", title: "Командный игрок", description: "Добавь 3 друзей", progress: 66, category: "Социальные" },
  { id: "a4", title: "Ветеран", description: "Сыграй 100 матчей", progress: 10, category: "Игры" },
];

type Filter = "Все" | "Полученные" | "В процессе";

const AchievementsPage: React.FC = () => {
  const [filter, setFilter] = useState<Filter>("Все");

  const { done, total } = useMemo(() => {
    const total = mock.length;
    const done = mock.filter((a) => a.progress >= 100).length;
    return { done, total };
  }, []);

  const data = useMemo(() => {
    if (filter === "Все") return mock;
    if (filter === "Полученные") return mock.filter((a) => a.progress >= 100);
    return mock.filter((a) => a.progress < 100);
  }, [filter]);

  const percent = total ? Math.round((done / total) * 100) : 0;

  return (
    <Space orientation="vertical" size={16} style={{ width: "100%" }}>
      <Card>
        <Space style={{ width: "100%", justifyContent: "space-between" }} wrap>
          <div>
            <Typography.Title level={3} style={{ margin: 0 }}>
              Достижения
            </Typography.Title>
            <Typography.Text type="secondary">
              Получено: {done} из {total}
            </Typography.Text>
          </div>

          <div style={{ minWidth: 260 }}>
            <Typography.Text type="secondary">Общий прогресс</Typography.Text>
            <Progress percent={percent} />
          </div>
        </Space>
      </Card>

      <Card>
        <Space style={{ width: "100%", justifyContent: "space-between" }} wrap>
          <Typography.Text strong>Список</Typography.Text>
          <Segmented
            options={["Все", "Полученные", "В процессе"]}
            value={filter}
            onChange={(v) => setFilter(v as Filter)}
          />
        </Space>

        <div style={{ marginTop: 16 }}>
          <List
            dataSource={data}
            grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3 }}
            renderItem={(a) => {
              const completed = a.progress >= 100;
              return (
                <List.Item>
                  <Card hoverable>
                    <Space orientation="vertical" style={{ width: "100%" }} size={8}>
                      <Space style={{ width: "100%", justifyContent: "space-between" }} align="start">
                        <div>
                          <Typography.Text strong>{a.title}</Typography.Text>
                          <div>
                            <Typography.Text type="secondary">{a.description}</Typography.Text>
                          </div>
                        </div>
                        <Tag color={completed ? "green" : "gold"}>{a.category}</Tag>
                      </Space>

                      <Progress
                        percent={a.progress}
                        status={completed ? "success" : "active"}
                        showInfo
                      />
                    </Space>
                  </Card>
                </List.Item>
              );
            }}
          />
        </div>
      </Card>
    </Space>
  );
};

export default AchievementsPage;
