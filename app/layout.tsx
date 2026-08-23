import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolio Day Reviews — Creative Cargo Festival",
  description: "Book an 8-minute portfolio review with the artists. Saturday 29 August, BIRD Rotterdam, first hour of the day: 15:00–16:00.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;700;800&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
