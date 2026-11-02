import localFont from 'next/font/local';

export const lato = localFont({
  variable: '--font-lato-family',
  display: 'swap',
  src: [
    { path: '../public/fonts/static/Lato-Thin.ttf', weight: '100', style: 'normal' },
    { path: '../public/fonts/static/Lato-Light.ttf', weight: '300', style: 'normal' },
    { path: '../public/fonts/static/Lato-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../public/fonts/static/Lato-Bold.ttf', weight: '700', style: 'normal' },
    { path: '../public/fonts/static/Lato-Black.ttf', weight: '900', style: 'normal' },
    { path: '../public/fonts/static/Lato-ThinItalic.ttf', weight: '100', style: 'italic' },
    { path: '../public/fonts/static/Lato-LightItalic.ttf', weight: '300', style: 'italic' },
    { path: '../public/fonts/static/Lato-Italic.ttf', weight: '400', style: 'italic' },
    { path: '../public/fonts/static/Lato-BoldItalic.ttf', weight: '700', style: 'italic' },
  ],
});

export const workSans = localFont({
  variable: '--font-work-sans',
  display: 'swap',
  src: [
    { path: '../public/fonts/static/WorkSans-VariableFont_wght.ttf', weight: '100 900', style: 'normal' },
    { path: '../public/fonts/static/WorkSans-Italic-VariableFont_wght.ttf', weight: '100 900', style: 'italic' },
    { path: '../public/fonts/static/WorkSans-Thin.ttf', weight: '100', style: 'normal' },
    { path: '../public/fonts/static/WorkSans-ExtraLight.ttf', weight: '200', style: 'normal' },
    { path: '../public/fonts/static/WorkSans-Light.ttf', weight: '300', style: 'normal' },
    { path: '../public/fonts/static/WorkSans-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../public/fonts/static/WorkSans-Medium.ttf', weight: '500', style: 'normal' },
    { path: '../public/fonts/static/WorkSans-SemiBold.ttf', weight: '600', style: 'normal' },
    { path: '../public/fonts/static/WorkSans-Bold.ttf', weight: '700', style: 'normal' },
    { path: '../public/fonts/static/WorkSans-ExtraBold.ttf', weight: '800', style: 'normal' },
    { path: '../public/fonts/static/WorkSans-Black.ttf', weight: '900', style: 'normal' },
    { path: '../public/fonts/static/WorkSans-ThinItalic.ttf', weight: '100', style: 'italic' },
    { path: '../public/fonts/static/WorkSans-ExtraLightItalic.ttf', weight: '200', style: 'italic' },
    { path: '../public/fonts/static/WorkSans-LightItalic.ttf', weight: '300', style: 'italic' },
    { path: '../public/fonts/static/WorkSans-Italic.ttf', weight: '400', style: 'italic' },
    { path: '../public/fonts/static/WorkSans-MediumItalic.ttf', weight: '500', style: 'italic' },
    { path: '../public/fonts/static/WorkSans-SemiBoldItalic.ttf', weight: '600', style: 'italic' },
    { path: '../public/fonts/static/WorkSans-BoldItalic.ttf', weight: '700', style: 'italic' },
    { path: '../public/fonts/static/WorkSans-ExtraBoldItalic.ttf', weight: '800', style: 'italic' },
    { path: '../public/fonts/static/WorkSans-BlackItalic.ttf', weight: '900', style: 'italic' },
  ],
});


