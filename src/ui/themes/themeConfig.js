import { theme } from "antd";

export const lightTheme = {
    algorithm: theme.defaultAlgorithm,
    token: {
        colorBgLayout: "#f5f5f5",
        colorBgContainer: "#ffffff",
        colorPrimary: "#74AA9C",
        colorText: "#000000",
        colorTextDescription: "rgba(0, 0, 0, 0.45)",
        colorTextLightSolid: "#ffffff",
    },
    components: {
        Layout: {
            headerBg: "#ffffff",
            headerColor: "#000000",
            headerHeight: 64,
            headerPadding: "0 24px",
        },
        Button: {
            colorPrimary: "#74AA9C",
            colorPrimaryHover: "#5f988a",
            colorPrimaryActive: "#4d7f73",
            colorText: "#ffffff",
        }
    },
};

export const darkTheme = {
    algorithm: theme.darkAlgorithm,
    token: {
        colorBgLayout: "#0a0a0a",
        colorBgContainer: "#1f1f1f",
        colorPrimary: "#8cc3b5",
        colorText: "rgba(255, 255, 255, 0.95)",
        colorTextSecondary: "rgba(255, 255, 255, 0.65)",
        colorTextDescription: "rgba(255, 255, 255, 0.45)",
        colorBorder: "#303030",
        colorTextLightSolid: "#ffffff",
    },
    components: {
        Layout: {
            headerBg: "#1f1f1f",
            headerColor: "rgba(255, 255, 255, 0.95)",
            headerHeight: 64,
            headerPadding: "0 24px",
        },
        Button: {
            colorText: "#ffffff",
        }
    },
};

