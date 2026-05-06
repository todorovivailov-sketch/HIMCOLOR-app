import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1E2422",
        panel: "#F7F5EF",
        line: "#D8D2C4",
        accent: "#0F766E",
        danger: "#B42318",
      },
    },
  },
  plugins: [],
};

export default config;
