module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        Changa: ["Changa", "serif"],
        press: ["'Press Start 2P'", "serif"],
      },
    },
  },
  plugins: [require("tailwind-scrollbar")],
};
