/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        node: {
          control: '#3B82F6',
          literature: '#0EA5E9',
          genomics: '#8B5CF6',
          biochemistry: '#F59E0B',
          lab: '#10B981',
          codegen: '#EF4444',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
