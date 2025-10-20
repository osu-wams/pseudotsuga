import { withThemeByDataAttribute } from '@storybook/addon-themes';

// Import the CSS variables produced by Style Dictionary
import '../css/tokens-mode-1.css';
import '../css/tokens-light.css';
import '../css/tokens-dark.css';

export const decorators = [
  withThemeByDataAttribute({
    themes: {
      'mode-1': 'mode-1', // key = toolbar label, value = data attribute value
      'light': 'light', // key = toolbar label, value = data attribute value
      'dark': 'dark', // key = toolbar label, value = data attribute value
    },
    defaultTheme: 'mode-1',
    attributeName: 'data-theme', // will set <html data-theme="mode-1">
  }),
];

// If you installed storybook-design-token and want the panel to parse your CSS:
// No extra config needed for basic usage; it reads CSS custom properties.
// To improve categorization, you can later add comment annotations in CSS.

