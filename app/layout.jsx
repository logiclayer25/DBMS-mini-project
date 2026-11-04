import "./globals.css";

export const metadata = {
  title: "ReliefOps | Disaster Response",
  description: "Disaster response coordination dashboard for incidents, relief camps, aid requests and volunteers.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
