/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  important: '#root', // This ensures Tailwind doesn't conflict with MUI
  theme: {
    extend: {},
  },
  plugins: [],
  corePlugins: {
    // Disable preflight to prevent conflicts with MUI
    preflight: false,
  },
};
