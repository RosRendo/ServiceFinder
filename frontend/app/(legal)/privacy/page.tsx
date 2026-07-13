import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | ServiceFinder",
  description: "Understand how ServiceFinder collects, uses, and protects your personal data.",
};

const SECTIONS = [
  {
    title: "1. Who We Are",
    body: `ServiceFinder ("we", "us", "our") is a mobile and web marketplace platform connecting customers with home and commercial service providers in Cambodia. Our registered office is located in Phnom Penh, Cambodia. For privacy inquiries, contact: privacy@servicefinder.app`,
  },
  {
    title: "2. Information We Collect",
    body: `We collect the following categories of data:
• Identity Data: Full name, email address, phone number, profile photo.
• Location Data: Address entered during booking, device GPS (if you consent) for the map feature.
• Payment Data: Payment details are processed securely by our payment partners. We never store raw card numbers. For crypto payments, your public wallet address may be stored.
• Booking Data: Services booked, dates, provider details, booking status, and completion records.
• Communication Data: Messages sent between customers and providers through the in-app chat.
• Technical Data: IP address, browser type, device identifiers, and session cookies.
• Usage Data: Pages visited, features used, and click patterns (anonymised analytics only).`,
  },
  {
    title: "3. How We Use Your Data",
    body: `We use your data to:
• Fulfil your bookings and process payments.
• Match you with suitable service providers based on your location and preferences.
• Send booking confirmations, reminders, and receipts.
• Improve platform features using anonymised usage analytics.
• Prevent fraud, abuse, and unauthorised access.
• Comply with legal obligations.
We do NOT sell your personal data to third parties.`,
  },
  {
    title: "4. Payment Data",
    body: `All payments are processed securely by our certified payment processors. Data is transmitted directly via an encrypted connection. ServiceFinder receives only a tokenised reference for display purposes.`,
  },
  {
    title: "5. Cryptocurrency Payments (Cryptmus)",
    body: `For crypto payments, we integrate with Cryptmus. Your public wallet address is used to process the transaction. Blockchain transactions are immutable and publicly visible by nature. We store the transaction hash and amount for accounting purposes. Cryptmus's privacy policy governs the payment processing layer.`,
  },
  {
    title: "6. Location Data",
    body: `Location is used solely to: (a) display relevant providers near you on the map, and (b) route service providers to your address during a booking. Location data is NOT shared with third-party advertisers. GPS access on mobile is opt-in and can be revoked at any time in your device settings.`,
  },
  {
    title: "7. Data Sharing",
    body: `We share data only with:
• The service provider company you book with (name, address, booking details).
• Payment processing partners.
• AWS for secure cloud storage and hosting.
• Mapbox for map rendering (anonymised coordinates only).
• Legal authorities when required by law.`,
  },
  {
    title: "8. Data Retention",
    body: `We retain account data for as long as your account is active. After deletion, we may retain booking records for up to 7 years for tax and legal compliance. Payment records are retained as required by financial regulations. You may request deletion of all other personal data.`,
  },
  {
    title: "9. Your Rights",
    body: `You have the right to:
• Access a copy of your personal data.
• Correct inaccurate data.
• Request deletion of your account and associated data.
• Withdraw consent for marketing communications at any time.
• Lodge a complaint with a data protection authority.
To exercise these rights, email: privacy@servicefinder.app`,
  },
  {
    title: "10. Cookies",
    body: `We use essential cookies to maintain your session and authentication. We use analytics cookies (anonymised) to understand feature usage. You can disable non-essential cookies in your browser settings. We do not use advertising or tracking cookies.`,
  },
  {
    title: "11. Children's Privacy",
    body: `The Platform is not intended for users under 18 years of age. We do not knowingly collect data from minors. If you believe a minor has created an account, contact privacy@servicefinder.app.`,
  },
  {
    title: "12. Changes to This Policy",
    body: `We may update this Privacy Policy periodically. We will notify registered users via email for material changes. Continued use of the Platform after changes constitutes acceptance of the updated policy. Last updated: April 14, 2026.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-slate-400 text-sm font-semibold uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Privacy Policy</h1>
          <p className="text-slate-300 text-lg">Last updated: April 14, 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="prose prose-slate max-w-none">
          <p className="text-slate-600 text-lg leading-relaxed mb-12">
            Your privacy matters to us. This policy explains exactly what data we collect,
            why we collect it, and how it is protected — including how we handle payments
            credit card data, Cryptmus wallet information, and your device location.
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
            <h3 className="text-lg font-bold text-slate-900 mb-2">Privacy Questions?</h3>
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
