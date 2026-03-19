import { FC, useEffect, useState } from "react";
import {
	Card,
	Avatar,
	Typography,
	Descriptions,
	Button,
	Space,
	Form,
} from "antd";
import { UserOutlined, MailOutlined } from "@ant-design/icons";
import { useMutation } from "@tanstack/react-query";
import { useStore } from "../../store";
import { MePatchPayload } from "../../api";
import ProfileModalPatch from "./modal";

const { Title } = Typography;

const Profile: FC = () => {
	const userState = useStore();
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [form] = Form.useForm<MePatchPayload>();
	const logoutMutation = useMutation({ mutationFn: userState.logout });

	useEffect(() => {
		if (isEditOpen && userState) {
			form.setFieldsValue({
				username: userState.username ?? undefined,
				description: userState.description ?? undefined,
			});
		}
	}, [isEditOpen, userState, form]);

	const openEdit = () => setIsEditOpen(true);

	const isLoading = !userState.username;
	return (
		<>
			<Card
				style={{ maxWidth: 500, margin: "40px auto" }}
				loading={isLoading}
				actions={[
					<Button type="primary" key="edit" onClick={openEdit}>
						Редактировать
					</Button>,
					<Button
						key="logout"
						onClick={() => logoutMutation.mutate()}
						loading={logoutMutation.isPending}
						disabled={logoutMutation.isPending}
					>
						Выйти
					</Button>,
				]}
			>
				<Space orientation="vertical" align="center" style={{ width: "100%" }}>
					<Avatar size={96} icon={<UserOutlined />} src={userState.avatarUrl} />
					<Title level={3} style={{ marginBottom: 0 }}>
						{userState.username}
					</Title>
				</Space>

				<Descriptions column={1} style={{ marginTop: 24 }}>
					<Descriptions.Item label={"Почта"}>
						{userState.email}
					</Descriptions.Item>
					<Descriptions.Item label="Роль">{userState.email}</Descriptions.Item>
					<Descriptions.Item label="О себе">
						{userState.description}
					</Descriptions.Item>
				</Descriptions>
			</Card>
			<ProfileModalPatch
				avatarUrl={userState.avatarUrl}
				username={userState.username}
				description={userState.description}
				onClose={() => setIsEditOpen(false)}
				isOpen={isEditOpen}
			/>
		</>
	);
};

export default Profile;
