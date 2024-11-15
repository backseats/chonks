import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'chonk-blue': '#2F7BA7',
        'chonk-orange': '#efb15e',
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['"Source Code Pro"', 'monospace'],
        'source-code-pro': ['"Source Code Pro"', 'monospace'], // need to amalgate this properly
        'inter': ['Inter', 'sans-serif'] // need to amalgate this properly
      },
    },
  },
  plugins: [],
};
export default config;
