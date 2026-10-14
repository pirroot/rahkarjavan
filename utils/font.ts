import LocalFont from 'next/font/local';

const raviFont = LocalFont({
  src: [
    {
      path: '../public/fonts/RaviFaNum-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/RaviFaNum-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/RaviFaNum-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../public/fonts/RaviFaNum-Black.woff2',
      weight: '800',
      style: 'normal',
    },
    {
      path: '../public/fonts/RaviFaNum-ExtraBlack.woff2',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: '--font-ravi',
  style: 'normal',
});

export default raviFont;
