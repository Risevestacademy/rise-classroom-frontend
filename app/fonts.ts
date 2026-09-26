import localFont from 'next/font/local';

export const tomatoGrotesk = localFont({
  variable: '--font-tomato-grotesk',
  display: 'swap',
  src: [
    { path: '../public/fonts/static/TomatoGrotesk-Thin.otf', weight: '100', style: 'normal' },
    { path: '../public/fonts/static/TomatoGrotesk-ExtraLight.otf', weight: '200', style: 'normal' },
    { path: '../public/fonts/static/TomatoGrotesk-Light.otf', weight: '300', style: 'normal' },
    { path: '../public/fonts/static/TomatoGrotesk-Regular.otf', weight: '400', style: 'normal' },
    { path: '../public/fonts/static/TomatoGrotesk-Medium.otf', weight: '500', style: 'normal' },
    { path: '../public/fonts/static/TomatoGrotesk-SemiBold.otf', weight: '600', style: 'normal' },
    { path: '../public/fonts/static/TomatoGrotesk-Bold.otf', weight: '700', style: 'normal' },
    { path: '../public/fonts/static/TomatoGrotesk-ExtraBold.otf', weight: '800', style: 'normal' },
    { path: '../public/fonts/static/TomatoGrotesk-Black.otf', weight: '900', style: 'normal' },
    { path: '../public/fonts/static/TomatoGrotesk-ThinSlanted.otf', weight: '100', style: 'italic' },
    { path: '../public/fonts/static/TomatoGrotesk-ExtraLightSlanted.otf', weight: '200', style: 'italic' },
    { path: '../public/fonts/static/TomatoGrotesk-LightSlanted.otf', weight: '300', style: 'italic' },
    { path: '../public/fonts/static/TomatoGrotesk-Slanted.otf', weight: '400', style: 'italic' },
    { path: '../public/fonts/static/TomatoGrotesk-MediumSlanted.otf', weight: '500', style: 'italic' },
    { path: '../public/fonts/static/TomatoGrotesk-SemiBoldSlanted.otf', weight: '600', style: 'italic' },
    { path: '../public/fonts/static/TomatoGrotesk-BoldSlanted.otf', weight: '700', style: 'italic' },
    { path: '../public/fonts/static/TomatoGrotesk-ExtraBoldSlanted.otf', weight: '800', style: 'italic' },
    { path: '../public/fonts/static/TomatoGrotesk-BlackSlanted.otf', weight: '900', style: 'italic' },
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


