export const metadata = {
  title: 'My Personal Dashboard',
  description: 'A modern personal productivity dashboard backed by PostgreSQL & Neon.',
  icons: {
    icon: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/locals.svg',
    shortcut: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/locals.svg',
    apple: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/locals.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" type="image/svg+xml" href="https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/locals.svg" />
        <link rel="shortcut icon" href="https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/locals.svg" />
        <link rel="apple-touch-icon" href="https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/locals.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@300;400;500;600;700;800&family=Oswald:wght@500;600;700&family=Pathway+Gothic+One&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="/style.css?v=10.0" />
      </head>
      <body>
        {children}
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
        <script src="/app.js?v=10.0" defer></script>
      </body>
    </html>
  );
}
