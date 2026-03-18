import React from "react";
import {
	Form,
	Input,
	Button,
	Typography,
	Space,
	Card,
	Checkbox,
	message,
} from "antd";
import {
	MailOutlined,
	LockOutlined,
	GoogleOutlined,
	GlobalOutlined,
	UserOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { register, Credentials } from "../../api";
import { AxiosError } from "axios";

const { Title, Text } = Typography;

type RegisterFormValues = Credentials & {
	confirmPassword: string;
	consentPersonalData: boolean;
	consentRecommendations: boolean;
	username: string;
};

const RegistrationForm = () => {
	const navigate = useNavigate();

	const onFinish = async (values: RegisterFormValues) => {
		const { email, password, username } = values;

		try {
			await register({ email, password, username });
			message.success("Регистрация успешна");
			navigate("/");
		} catch (err) {
			if (err instanceof AxiosError) {
				const emailError = err.response?.data?.email;
				if (emailError) {
					message.error("Такая почта уже существует");
					return;
				}
			}
			message.error("Ошибка регистрации. Попробуйте позже.");
		}
	};

	const onGoToAuth = () => {
		navigate("/login");
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
					label="Имя пользователя"
					name="username"
					rules={[
						{ required: true, message: "Введите электронную имя пользователя" },
						{ min: 3, message: "Минимум 3 символа" },
						{ pattern: /^[A-Za-z0-9]+$/, message: "Только буквы и цифры" },
					]}
				>
					<Input
						prefix={<UserOutlined />}
						placeholder="Введите имя пользователя"
					/>
				</Form.Item>
				<Form.Item
					label="Пароль *"
					name="password"
					rules={[
						{ required: true, message: "Введите пароль" },
						{ min: 8, message: "Пароль должен быть не менее 8 символов" },
						{
							pattern: /[A-Z]/,
							message:
								"Пароль должен содержать хотя бы 1 заглавную букву (A-Z)",
						},
						{
							pattern: /[a-z]/,
							message: "Пароль должен содержать хотя бы 1 строчную букву (a-z)",
						},
						{
							pattern: /\d/,
							message: "Пароль должен содержать хотя бы 1 цифру (0-9)",
						},
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

				<Space
					orientation="vertical"
					style={{ width: "100%", marginBottom: 8 }}
				>
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
