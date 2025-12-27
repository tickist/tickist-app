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
          primary: '#ffea00',
          'primary-content': '#1f1f1f',
          secondary: '#8f929e',
          accent: '#616676',
          neutral: '#1f1f1f',
          'base-100': '#19213a',
          'base-200': '#1b2236',
          'base-300': '#101529',
          'base-content': '#f7f7fa',
          info: '#38bdf8',
          success: '#34d399',
          warning: '#facc15',
          error: '#f87171',
        },
      },
      {
        'tickist-light': {
          primary: '#1f233a',
          'primary-content': '#f7f7fa',
          secondary: '#8f929e',
          accent: '#616676',
          neutral: '#1f1f1f',
          'base-100': '#f7f7fa',
          'base-200': '#ffffff',
          'base-300': '#f2f2f7',
          'base-content': '#1f1f1f',
          info: '#0ea5e9',
          success: '#16a34a',
          warning: '#ca8a04',
          error: '#dc2626',
        },
      },
    ],
  },
};

export default config;
