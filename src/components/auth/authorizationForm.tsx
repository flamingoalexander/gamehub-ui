import { useMutation } from "@tanstack/react-query";
import { Button, Card, Form, Input, Space, Typography } from "antd";
import {
	GlobalOutlined,
	GoogleOutlined,
	LockOutlined,
	MailOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { Credentials } from "../../api";
import { useStore } from "../../store";

const { Title, Text } = Typography;

const AuthorizationForm = () => {
	const login = useStore((state) => state.login);
	const navigate = useNavigate();
	const [form] = Form.useForm<Credentials>();

	const loginMutation = useMutation({
		mutationFn: (credentials: Credentials) => login(credentials),
		onSuccess: () => {
			navigate("/");
		},
		onError: () => {
			form.setFields([
				{ name: "email", errors: ["Неправильный логин или пароль"] },
				{ name: "password", errors: ["Неправильный логин или пароль"] },
			]);
			form.setFieldValue("password", "");
		},
	});

	const onFinish = (credentials: Credentials) => {
		form.setFields([
			{ name: "email", errors: [] },
			{ name: "password", errors: [] },
		]);
		loginMutation.mutate(credentials);
	};

	const onRegister = () => {
		navigate("/register");
	};

	return (
		<Card>
			<Title level={2} style={{ textAlign: "center" }}>
				Авторизация
			</Title>

			<Form<Credentials>
				form={form}
				name="authorization"
				onFinish={onFinish}
				layout="vertical"
			>
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
					<Button
						type="primary"
						htmlType="submit"
						block
						loading={loginMutation.isPending}
						disabled={loginMutation.isPending}
					>
						Авторизоваться
					</Button>
				</Form.Item>
			</Form>

			<Text style={{ display: "block", textAlign: "center", marginBottom: 16 }}>
				<Button type="link">Забыли пароль?</Button>
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

			<Button type="link" block style={{ marginTop: 16 }} onClick={onRegister}>
				Регистрация &gt;
			</Button>
		</Card>
	);
};

export default AuthorizationForm;
