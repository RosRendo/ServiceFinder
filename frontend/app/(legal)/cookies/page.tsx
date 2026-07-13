import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy | ServiceFinder",
  description: "Learn about how ServiceFinder uses cookies and tracking technologies.",
};

const SECTIONS = [
  {
    title: "1. What Are Cookies?",
    body: `Cookies are small text files stored on your device (computer, tablet, or mobile) when you visit a website. They are widely used to make websites work efficiently, as well as to provide information to the owners of the site.`,
  },
  {
    title: "2. How We Use Cookies",
    body: `ServiceFinder uses cookies to:
• Keep you signed in to your account.
• Remember your preferences (e.g., light/dark mode, language).
• Understand how you use our platform so we can improve the user experience.
• Process secure payments.
• Protect against fraud and unauthorized access.`,
  },
  {
    title: "3. Types of Cookies We Use",
    body: `We use the following categories of cookies:

1. Strictly Necessary Cookies: These are essential for the platform to function. They include authentication cookies and security tokens. You cannot opt out of these.
2. Functional Cookies: These remember your choices (like your preferred location or UI theme) to provide a more personalized experience.
3. Analytical/Performance Cookies: These allow us to recognize and count the number of visitors and see how they move around the platform. This helps us improve the way the site works.`,
  },
  {
    title: "4. Third-Party Cookies",
    body: `Some cookies are placed by third-party services that appear on our pages. For example:
• Payment Processors: Uses cookies for fraud prevention and to securely process transactions.
• Mapbox: Uses cookies to render interactive maps and store temporary location preferences.`,
  },
  {
    title: "5. Managing Your Cookies",
    body: `You can control and manage cookies in various ways. Please keep in mind that removing or blocking cookies can negatively impact your user experience and parts of our website may no longer be fully accessible.
    
Most browsers allow you to view, manage, delete and block cookies for a website. Be aware that if you delete all cookies then any preferences you have set will be lost, including the ability to opt-out from cookies as this function itself requires placement of an opt-out cookie on your device.`,
  },
  {
    title: "6. Changes to this Cookie Policy",
    body: `We may update this Cookie Policy from time to time in order to reflect changes to the cookies we use or for other operational, legal, or regulatory reasons. Please revisit this page regularly to stay informed.`,
  },
];

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-slate-400 text-sm font-semibold uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Cookie Policy</h1>
          <p className="text-slate-300 text-lg">Last updated: May 17, 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="prose prose-slate max-w-none">
          <p className="text-slate-600 text-lg leading-relaxed mb-12">
            This Cookie Policy explains what cookies are and how ServiceFinder uses them. You should read this policy so you can understand what type of cookies we use, or the information we collect using cookies and how that information is used.
          </p>

          <div className="space-y-10">
            {SECTIONS.map((s) => (
               <section key={s.title}>
                <h2 className="text-xl font-bold text-slate-900 mb-3">{s.title}</h2>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line">{s.body}</p>
              </section>
            ))}
          </div>

          {/* Contact */}
          <div className="mt-16 rounded-2xl bg-slate-50 border border-slate-200 p-8 text-center">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Questions about our use of cookies?</h3>
            <p className="text-slate-500 text-sm">
              Email us at{" "}
              <a href="mailto:privacy@servicefinder.app" className="text-blue-600 underline">
                privacy@servicefinder.app
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
