import React from "react";
import { Form, Input, Button, Typography, Space, Card, Checkbox } from "antd";
import {
	MailOutlined,
	LockOutlined,
	GoogleOutlined,
	GlobalOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { register, Credentials } from "../../api";

const { Title, Text } = Typography;

type RegisterFormValues = Credentials & {
	confirmPassword: string;
	consentPersonalData: boolean;
	consentRecommendations: boolean;
};

const RegistrationForm = () => {
	const navigate = useNavigate();

	const onFinish = async (values: RegisterFormValues) => {
		const { email, password } = values;

		try {
			await register({ email, password });
			navigate("/"); // или navigate("/login") — как у тебя принято
		} catch {
			alert("error");
		}
	};

	const onGoToAuth = () => {
		navigate("/login"); // поменяй на "/auth" если у тебя другой роут
	};

	return (
		<Card>
			<Title level={2} style={{ textAlign: "center" }}>
				Регистрация
			</Title>

			<Form<RegisterFormValues>
				name="registration"
				onFinish={onFinish}
				layout="vertical"
				scrollToFirstError
			>
				<Form.Item
					label="Электронная почта *"
					name="email"
					rules={[
						{ required: true, message: "Введите электронную почту" },
						{ type: "email", message: "Введите корректный E-mail" },
					]}
				>
					<Input
						prefix={<MailOutlined />}
						placeholder="Введите электронную почту"
					/>
				</Form.Item>

				<Form.Item
					label="Пароль *"
					name="password"
					rules={[
						{ required: true, message: "Введите пароль" },
						{ min: 6, message: "Пароль должен быть не менее 6 символов" },
					]}
					hasFeedback
				>
					<Input.Password prefix={<LockOutlined />} placeholder="********" />
				</Form.Item>

				<Form.Item
					label="Повторите пароль *"
					name="confirmPassword"
					dependencies={["password"]}
					hasFeedback
					rules={[
						{ required: true, message: "Повторите пароль" },
						({ getFieldValue }) => ({
							validator(_, value) {
								if (!value || getFieldValue("password") === value) {
									return Promise.resolve();
								}
								return Promise.reject(new Error("Пароли не совпадают"));
							},
						}),
					]}
				>
					<Input.Password prefix={<LockOutlined />} placeholder="********" />
				</Form.Item>

				<Space direction="vertical" style={{ width: "100%", marginBottom: 8 }}>
					<Form.Item
						name="consentPersonalData"
						valuePropName="checked"
						rules={[
							{
								validator: (_, checked) =>
									checked
										? Promise.resolve()
										: Promise.reject(
												new Error(
													"Необходимо согласие на обработку персональных данных",
												),
											),
							},
						]}
					>
						<Checkbox>Даю согласие на обработку персональных данных</Checkbox>
					</Form.Item>

					<Form.Item
						name="consentRecommendations"
						valuePropName="checked"
						initialValue={false}
					>
						<Checkbox>Даю согласие на предоставление рекомендаций</Checkbox>
					</Form.Item>
				</Space>

				<Form.Item>
					<Button type="primary" htmlType="submit" block>
						Зарегистрироваться
					</Button>
				</Form.Item>

				<Space orientation="vertical" style={{ width: "100%" }}>
					<Button
						icon={<GoogleOutlined />}
						block
						onClick={() => console.log("Google register placeholder")}
					>
						Войти через аккаунт Google
					</Button>

					<Button
						icon={<GlobalOutlined />}
						block
						onClick={() => console.log("Other service register placeholder")}
					>
						Войти через аккаунт другого сервиса
					</Button>
				</Space>

				<Text style={{ display: "block", textAlign: "center", marginTop: 16 }}>
					<Button type="link" block onClick={onGoToAuth}>
						Авторизация &gt;
					</Button>
				</Text>
			</Form>
		</Card>
	);
};

export default RegistrationForm;
