import React, { useMemo, useState } from "react";
import { Avatar, Badge, Button, Card, Input, List, Space, Tag, Typography } from "antd";
import { PlusOutlined, UserOutlined } from "@ant-design/icons";

type Friend = {
  id: string;
  name: string;
  level: number;
  online: boolean;
  lastSeen?: string;
};

const mockFriends: Friend[] = [
  { id: "1", name: "Алексей", level: 12, online: true },
  { id: "2", name: "Мария", level: 7, online: false, lastSeen: "вчера" },
  { id: "3", name: "Дмитрий", level: 21, online: true },
  { id: "4", name: "Ольга", level: 3, online: false, lastSeen: "2 дня назад" },
];

const FriendsPage: React.FC = () => {
  const [query, setQuery] = useState("");

  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return mockFriends;
    return mockFriends.filter((f) => f.name.toLowerCase().includes(q));
  }, [query]);

  return (
    <Space orientation="vertical" size={16} style={{ width: "100%" }}>
      <Card>
        <Space style={{ width: "100%", justifyContent: "space-between" }} wrap>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Друзья
          </Typography.Title>

          <Space wrap>
            <Input.Search
              placeholder="Поиск друзей"
              allowClear
              onChange={(e) => setQuery(e.target.value)}
              style={{ width: 260 }}
            />
            <Button type="primary" icon={<PlusOutlined />}>
              Добавить друга
            </Button>
          </Space>
        </Space>
      </Card>

      <Card>
        <List
          dataSource={data}
          grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 4 }}
          renderItem={(friend) => (
            <List.Item>
              <Card hoverable>
                <Space align="start" style={{ width: "100%", justifyContent: "space-between" }}>
                  <Space>
                    <Badge dot={friend.online} offset={[-2, 30]}>
                      <Avatar size={48} icon={<UserOutlined />} />
                    </Badge>

                    <div>
                      <Typography.Text strong>{friend.name}</Typography.Text>
                      <div>
                        <Tag color="blue">Уровень {friend.level}</Tag>
                        {friend.online ? (
                          <Tag color="green">Online</Tag>
                        ) : (
                          <Tag color="default">Offline{friend.lastSeen ? ` • ${friend.lastSeen}` : ""}</Tag>
                        )}
                      </div>
                    </div>
                  </Space>

                  <Button>Профиль</Button>
                </Space>
              </Card>
            </List.Item>
          )}
        />
      </Card>
    </Space>
  );
};

export default FriendsPage;
