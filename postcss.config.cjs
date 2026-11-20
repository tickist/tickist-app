const path = require('path');

module.exports = {
  plugins: {
    'tailwindcss/nesting': {},
    // Nx runs Vite from the project folder, so name the config explicitly.
    tailwindcss: { config: path.join(__dirname, 'tailwind.config.ts') },
    autoprefixer: {},
  },
};
