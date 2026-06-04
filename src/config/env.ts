const apiUrl = import.meta.env.VITE_API_URL;
if (!apiUrl) throw new Error("VITE_API_URL is not defined, please check your .env file");

export const env = {
    apiUrl,
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
} as const;
