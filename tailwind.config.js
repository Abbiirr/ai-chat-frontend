// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#10A37F", // ChatGPT green
        chatBg: "#F7F7F8", // overall page
      },
    },
  },
  plugins: [],
};
