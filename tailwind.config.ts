import type { Config } from 'tailwindcss';
import daisyui from 'daisyui';

const config: Config = {
  content: [
    './apps/tickist-web/src/**/*.{html,ts}',
    './libs/**/*.{html,ts}',
    './apps/**/*.{html,ts}',
    './index.html',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
      },
      colors: {
        tickist: {
          primary: '#ffea00',
          accent: '#8f929e',
          muted: '#616676',
          surface: '#1f233a',
          panel: '#2c3152',
          lightSurface: '#f7f7fa',
          lightPanel: '#ffffff',
        },
      },
      boxShadow: {
        'tickist-glow': '0 40px 80px rgba(0, 0, 0, 0.35)',
      },
    },
  },
  safelist: [
    {
      pattern:
        /(text|bg|border)-base-(100|200|300)\/((10|20|30|40|50|60|70|80|90|95))/,
    },
    {
      pattern: /(text|bg|border)-primary\/((10|20|40))/,
    },
    {
      pattern: /(text|bg|border)-error\/((10|20|40))/,
    },
    {
      pattern: /(bg|text|border)-warning\/((10|20|40))/,
    },
    'input-bordered',
    'input',
    'btn',
    'btn-ghost',
    'btn-primary',
    'badge',
    'badge-outline',
    'badge-primary',
    'badge-error',
    'badge-warning',
    'badge-info',
  ],
  plugins: [daisyui],
  daisyui: {
    darkTheme: 'tickist',
    themes: [
      {
        tickist: {
          primary: '#6366f1', /* Indigo 500 */
          'primary-content': '#ffffff',
          secondary: '#38bdf8', /* Sky 400 */
          accent: '#818cf8', /* Indigo 400 */
          neutral: '#101729',
          'base-100': '#0f172a', /* Slate 900 */
          'base-200': '#1e293b', /* Slate 800 */
          'base-300': '#020617', /* Slate 950 */
          'base-content': '#f8fafc',
          info: '#38bdf8',
          success: '#4ade80',
          warning: '#facc15',
          error: '#fb7185',
        },
      },
      {
        'tickist-light': {
          primary: '#4f46e5', /* Indigo 600 */
          'primary-content': '#ffffff',
          secondary: '#0ea5e9', /* Sky 500 */
          accent: '#6366f1', /* Indigo 500 */
          neutral: '#15203d',
          'base-100': '#f8fafc', /* Slate 50 */
          'base-200': '#ffffff',
          'base-300': '#f1f5f9', /* Slate 100 */
          'base-content': '#0f172a',
          info: '#0284c7',
          success: '#15803d',
          warning: '#ca8a04',
          error: '#be123c',
        },
      },
    ],
  },
};

export default config;
