/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ocean: {
          DEFAULT: "#1657CC",
          light: "#4C8DFF",
          dark: "#0E3E96",
        },
        palm: {
          DEFAULT: "#0E9F6E",
          light: "#34D399",
          dark: "#0B7A55",
        },
        sun: "#F5A623",
        ink: "#0B1F3A",
        mist: "#F5F8FC",
        cloud: "#E7EEF7",
      },
      fontFamily: {
        display: ["Sora", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      boxShadow: {
        card: "0 12px 32px -12px rgba(22, 87, 204, 0.18)",
        "card-hover": "0 20px 44px -14px rgba(22, 87, 204, 0.28)",
        glass: "0 8px 32px rgba(11, 31, 58, 0.08)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(135deg, #0E3E96 0%, #1657CC 45%, #0E9F6E 100%)",
      },
    },
  },
  plugins: [],
};
