import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./bootstrap/App";
import { ConfigProvider } from "antd";
const root = ReactDOM.createRoot(
	document.getElementById("root") as HTMLElement,
);
const themeToken = {
	token: {
		colorPrimary: "#1890ff",
		colorBgContainer: "#ffffff",
		colorBgLayout: "#f8fafc",
	},
	components: {
		Layout: {
			siderBg: "#ffffff",
			colorBgHeader: "#ffffff",
			colorBgBody: "#f8fafc",
			colorBgTrigger: "#edf2f7",
			colorBgContainer: "#ffffff",
			colorBgElevated: "#ffffff",
			triggerBg: "#edf2f7",
			triggerColor: "#4a5568",
		},

		Menu: {
			colorItemBg: "transparent",
			colorItemBgSelected: "#ebf8ff",
			colorItemText: "#4a5568",
			colorItemTextSelected: "#1890ff",
			colorItemBgHover: "#f7fafc",
			colorBgContainer: "#ffffff",
		},
	},
};

root.render(
	<React.StrictMode>
		<ConfigProvider>
			<App />
		</ConfigProvider>
	</React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
