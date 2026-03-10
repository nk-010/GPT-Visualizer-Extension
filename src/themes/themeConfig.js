import { theme } from "antd";

export const lightTheme = {
    algorithm: theme.defaultAlgorithm,
    token: {
        colorBgLayout: "#f5f5f5",
        colorBgContainer: "#ffffff",
        colorPrimary: "#74AA9C",
        colorText: "#000000",
    },
    components: {
        Layout: {
            headerBg: "#ffffff",
            headerColor: "#000000",
            headerHeight: 64,
            headerPadding: "0 24px",
        },
    },
};

export const darkTheme = {
    algorithm: theme.darkAlgorithm,
    token: {
        colorBgLayout: "#000000",
        colorBgContainer: "#141414",
        colorPrimary: "#74aa89ff",
        colorText: "rgba(255, 255, 255, 0.88)",
    },
    components: {
        Layout: {
            headerBg: "#141414",
            headerColor: "rgba(255, 255, 255, 0.88)",
            headerHeight: 64,
            headerPadding: "0 24px",
        },
    },
};

