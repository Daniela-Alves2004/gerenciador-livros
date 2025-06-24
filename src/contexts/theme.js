import { createTheme } from "@mui/material";

const theme = createTheme({
    palette: {
        primary: {
            main: "#b3a1d4",
        },
        secondary: {
            main: "#76366e",
        },
        background: {
            default: "#09060d",

        },
        text: {
            primary: "#eae4f3",
            accent: {
                main: "#b45b91",
            },

        },
    },

    typography: {
        fontFamily: "Inter, sans-serif",

        h1: {
            fontSize: '2.5rem',
            fontWeight: 500,
        },
        h2: {
            fontSize: '2rem',
            fontWeight: 500,
        },
        h3: {
            fontSize: '1.75rem',
            fontWeight: 500,
        },
        h4: {
            fontSize: '1.5rem',
            fontWeight: 500,
        },
        h5: {
            fontSize: '1.25rem',
            fontWeight: 500,
        },
        h6: {
            fontSize: '1rem',
            fontWeight: 500,
        },
        body1: {
            fontSize: "1rem",
            fontWeight: 400,
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: "8px",
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: "12px",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                },
            },
        },
    },
});
export default theme;

