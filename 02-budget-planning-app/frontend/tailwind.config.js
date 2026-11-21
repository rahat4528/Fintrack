/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        budget: {
          dark: '#090d16',
          panel: '#111827',
          border: '#1f2937',
          accent: '#6366f1',
          assigned: '#38bdf8',
          activity: '#fb7185',
          available: '#34d399',
          overspent: '#ef4444',
        },
      },
    },
  },
  plugins: [],
};
