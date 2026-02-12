import React from "react";
import { Form, Input, Button, Typography, Space } from "antd";
import {
	MailOutlined,
	LockOutlined,
	GoogleOutlined,
	GlobalOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../bootstrap/App";

const { Title, Text } = Typography;

const AuthorizationForm = () => {
	const { login, isAuthenticated } = useAuth();
	const navigate = useNavigate();
	const onFinish = () => {
		login();
		console.log(isAuthenticated);
		navigate("/");
	};

	return (
		<div
			style={{
				maxWidth: 400,
				margin: "auto",
				padding: 20,
				border: "1px solid #d9d9d9",
				borderRadius: 8,
			}}
		>
			<Title level={2} style={{ textAlign: "center" }}>
				Авторизация
			</Title>
			<Form name="authorization" onFinish={onFinish} layout="vertical">
				<Form.Item
					label="Электронная почта *"
					name="email"
					rules={[{ required: true, message: "Введите электронную почту" }]}
				>
					<Input
						prefix={<MailOutlined />}
						placeholder="Введите электронную почту"
					/>
				</Form.Item>
				<Form.Item
					label="Пароль *"
					name="password"
					rules={[{ required: true, message: "Введите пароль" }]}
				>
					<Input.Password prefix={<LockOutlined />} placeholder="********" />
				</Form.Item>
				<Form.Item>
					<Button type="primary" htmlType="submit" block>
						Авторизоваться
					</Button>
				</Form.Item>
			</Form>
			<Text style={{ display: "block", textAlign: "center", marginBottom: 16 }}>
				Забыли пароль?
			</Text>
			<Space orientation="vertical" style={{ width: "100%" }}>
				<Button
					icon={<GoogleOutlined />}
					block
					onClick={() => console.log("Google login placeholder")}
				>
					Войти через аккаунт Google
				</Button>
				<Button
					icon={<GlobalOutlined />}
					block
					onClick={() => console.log("Other service login placeholder")}
				>
					Войти через аккаунт другого сервиса
				</Button>
			</Space>
			<Button
				type="link"
				block
				style={{ marginTop: 16 }}
				onClick={() => console.log("Registration placeholder")}
			>
				Регистрация &gt;
			</Button>
		</div>
	);
};

export default AuthorizationForm;
