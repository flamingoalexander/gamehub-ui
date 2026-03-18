import { FC, useState } from "react";
import {
	Avatar,
	Typography,
	Button,
	Space,
	Modal,
	Form,
	Input,
	Upload,
} from "antd";
import type { UploadProps } from "antd";
import { UserOutlined, UploadOutlined } from "@ant-design/icons";
import { useStore } from "../../store";
import { MePatchPayload } from "../../api";

const { Text } = Typography;

type ProfileModalPatchInitialValues = {
	avatarUrl: string | null;
	username: string | null;
	description: string | null;
	onClose: () => void;
	isOpen: boolean;
};

const ProfileModalPatch: FC<ProfileModalPatchInitialValues> = ({
	avatarUrl,
	username,
	description,
	onClose,
	isOpen,
}) => {
	const userState = useStore();
	const [form] = Form.useForm<MePatchPayload>();
	const state = useStore();
	const [avatar, setAvatar] = useState<string | null>(avatarUrl);
	const [loading, setLoading] = useState(false);
	const submitEdit = async () => {
		setLoading(true);
		const values = await form.validateFields();
		const payload: MePatchPayload = {};
		if (values.username !== userState.username)
			payload.username = values.username;
		if (values.description !== userState.description)
			payload.description = values.description;

		await state.patchMe(payload);
		if (avatar) {
			const blob = await fetch(avatar).then((r) => r.blob());
			await state.patchAvatar(new File([blob], "avatar.png"));
		}
		setLoading(false);
		onClose();
	};

	const uploadProps: UploadProps = {
		accept: "image/*",
		showUploadList: false,
		beforeUpload: (file) => {
			const isImage = file.type.startsWith("image/");
			if (!isImage) return Upload.LIST_IGNORE;
			const isLt5mb = file.size / 1024 / 1024 < 5;
			if (!isLt5mb) return Upload.LIST_IGNORE;
			setAvatar(URL.createObjectURL(file));
			return false;
		},
	};
	return (
		<Modal
			title="Редактирование профиля"
			open={isOpen}
			onCancel={() => {
				onClose();
				setAvatar(avatarUrl);
				form.resetFields();
			}}
			onOk={submitEdit}
			okText="Сохранить"
			cancelText="Отмена"
			destroyOnHidden
			okButtonProps={{ loading }}
		>
			<Space orientation="vertical" style={{ width: "100%" }} size={16}>
				<Space
					align="center"
					style={{ justifyContent: "space-between", width: "100%" }}
				>
					<Space align="center">
						<Avatar size={64} icon={<UserOutlined />} src={avatar} />

						<div>
							<div style={{ fontWeight: 600 }}>Аватар</div>
							<Text type="secondary">JPG/PNG, до 5MB</Text>
						</div>
					</Space>

					<Upload {...uploadProps}>
						<Button icon={<UploadOutlined />}>Загрузить</Button>
					</Upload>
				</Space>
				<Form
					form={form}
					layout="vertical"
					initialValues={{ username, description }}
				>
					<Form.Item
						label="Имя пользователя"
						name="username"
						rules={[
							{ required: true, message: "Введите имя пользователя" },
							{ min: 3, message: "Минимум 3 символа" },
							{ pattern: /^[A-Za-z0-9]+$/, message: "Только буквы и цифры" },
						]}
					>
						<Input placeholder="username" />
					</Form.Item>
					<Form.Item label="О себе" name="description">
						<Input.TextArea placeholder="Описание" rows={4} />
					</Form.Item>
				</Form>
			</Space>
		</Modal>
	);
};

export default ProfileModalPatch;
