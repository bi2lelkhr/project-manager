/** @type {import('tailwindcss').Config} */

export default {
  important: true, // Adds !important to all Tailwind styles

  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "node_modules/flowbite-react/**/*.{js,jsx,ts,tsx}", // Include Flowbite components
    "./index.html", // Ensure this is correct for Vite

  ],
  theme: {
    extend: {
      spacing: {
        'svh': '100svh', // Add a custom unit for small viewport height

      },
      colors:{
        'light-gray':'#F9FAFB'  

      }
    },
  },
  plugins: [
    require('flowbite/plugin'), // Add the Flowbite plugin
  ],
}

