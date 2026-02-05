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
          primary: '#ffdd63',
          'primary-content': '#172039',
          secondary: '#9ba7c3',
          accent: '#7f8eaf',
          neutral: '#101729',
          'base-100': '#222d4d',
          'base-200': '#2b365b',
          'base-300': '#1a2441',
          'base-content': '#eff4ff',
          info: '#38bdf8',
          success: '#4ade80',
          warning: '#facc15',
          error: '#fb7185',
        },
      },
      {
        'tickist-light': {
          primary: '#1f2b4d',
          'primary-content': '#f8fbff',
          secondary: '#55607d',
          accent: '#7b86a4',
          neutral: '#15203d',
          'base-100': '#f3f6fc',
          'base-200': '#ffffff',
          'base-300': '#e5ebf7',
          'base-content': '#16203b',
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
