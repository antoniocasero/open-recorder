/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
       colors: {
         'slate-deep': 'rgb(15 23 42)',
         'slate-border': 'rgb(51 65 85)',
         'slate-muted': 'rgb(100 116 139)',
         'slate-surface': 'rgb(30 41 59 / 0.3)',
         'indigo-primary': 'rgb(99 102 241)',
       },
    },
  },
  plugins: [],
}
