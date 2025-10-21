export default {
  source: ['tokens/*.tokens.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      files: [
        {
          destination: 'css/tokens-mode-1.css',
          format: 'css/variables',
          options: { selector: ':root[data-theme="mode-1"]' }
        }
      ]
    },
    cssLight: {
      transformGroup: 'css',
      files: [{
        destination: 'css/tokens-light.css',
        format: 'css/variables',
        options: { selector: ':root[data-theme="light"]' } // scope variables
      }]
    },
    cssDark: {
      transformGroup: 'css',
      files: [{
        destination: 'css/tokens-dark.css',
        format: 'css/variables',
        options: { selector: ':root[data-theme="dark"]' }
      }]
    }
  }
};

