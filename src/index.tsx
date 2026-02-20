import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./bootstrap/App";
import { ConfigProvider, ThemeConfig } from "antd";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export const gameHubTheme: ThemeConfig = {
	token: {
		colorPrimary: "#7C3AED",
		colorInfo: "#38BDF8",
		colorSuccess: "#22C55E",
		colorWarning: "#F59E0B",
		colorError: "#EF4444",

		colorBgBase: "#0B1020",
		colorBgContainer: "#0F172A",
		colorBgElevated: "#111C33",

		colorText: "rgba(255,255,255,.92)",
		colorTextSecondary: "rgba(255,255,255,.68)",
		colorTextTertiary: "rgba(255,255,255,.50)",

		colorBorder: "rgba(148,163,184,.22)",
		colorSplit: "rgba(148,163,184,.16)",

		borderRadius: 14,
		borderRadiusLG: 18,
		controlHeight: 40,
		fontSize: 14,

		controlOutline: "rgba(124,58,237,.25)",
	},

	components: {
		Layout: {
			bodyBg: "#0B1020",
			siderBg: "#0B1020",
			headerBg: "#0B1020",
		},

		Menu: {
			darkItemBg: "#0B1020",
			darkSubMenuItemBg: "#0B1020",
			darkItemSelectedBg: "rgba(124,58,237,.22)",
			darkItemSelectedColor: "#E9D5FF",
			darkItemColor: "rgba(255,255,255,.78)",
			darkItemHoverColor: "#FFFFFF",
			darkItemHoverBg: "rgba(56,189,248,.14)",
			itemBorderRadius: 10,
		},

		Card: {
			colorBgContainer: "#0F172A",
			borderRadiusLG: 18,
			paddingLG: 18,
			boxShadowTertiary: "0 12px 40px rgba(0,0,0,.35)",
		},

		Table: {
			colorBgContainer: "#0F172A",
			headerBg: "rgba(255,255,255,.04)",
			headerColor: "rgba(255,255,255,.86)",
			borderColor: "rgba(148,163,184,.18)",
			rowHoverBg: "rgba(124,58,237,.12)",
		},

		Button: {
			borderRadius: 12,
			primaryShadow: "0 10px 24px rgba(124,58,237,.28)",
			defaultShadow: "0 8px 18px rgba(0,0,0,.25)",
		},

		Input: {
			borderRadius: 12,
			colorBgContainer: "rgba(255,255,255,.04)",
			colorBorder: "rgba(148,163,184,.20)",
			activeBorderColor: "rgba(56,189,248,.65)",
			hoverBorderColor: "rgba(56,189,248,.55)",
		},

		Tag: {
			borderRadiusSM: 999,
		},

		Progress: {
			defaultColor: "#38BDF8",
		},
	},
};
const root = ReactDOM.createRoot(
	document.getElementById("root") as HTMLElement,
);

const queryClient = new QueryClient();

root.render(
	<React.StrictMode>
		<ConfigProvider theme={gameHubTheme}>
			<BrowserRouter>
				<QueryClientProvider client={queryClient}>
					<App />
				</QueryClientProvider>
			</BrowserRouter>
		</ConfigProvider>
	</React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
