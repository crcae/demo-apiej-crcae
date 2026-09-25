/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0E1A3D',    // Primario corporativo
          blue: '#4A6CFF',    // Acento / Acción
          emerald: '#10B981', // Éxito / Aprobado
          orange: '#FF7A00',  // Alerta / En revisión
          bg: '#F8FAFC'
        }
      }
    },
  },
  plugins: [],
}