/** @type {import('tailwindcss').Config} */
module.exports = {
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
         'indigo-primary': 'rgb(79 70 229)',
       },
    },
  },
  plugins: [],
}
