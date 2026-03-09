import Image from "next/image";
import Link from "next/link";

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-gray-900/90 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-[1088px] mx-auto flex items-center justify-between px-6 py-4 lg:px-8">
          <Link href="/" className="cursor-pointer hover:opacity-80 transition-opacity">
            <Image
              src="/logo-tenista.svg"
              alt="Tenista"
              width={120}
              height={40}
              className="h-10 w-auto"
            />
          </Link>
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/#features" className="text-gray-300 hover:text-[#84FE0C] transition-colors font-medium">Features</Link>
            <Link href="/#download" className="text-gray-300 hover:text-[#84FE0C] transition-colors font-medium">Download</Link>
            <button className="bg-[#84FE0C] text-black px-4 py-2 rounded-full hover:bg-[#7AE60B] transition-colors font-semibold ml-4 text-sm">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="py-20 sm:py-24 lg:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Terms & Privacy Policy
            </h1>
            <p className="text-gray-300 text-lg">
              Last updated: Sun Jul 13
            </p>
          </div>

          <div className="prose prose-invert prose-lg max-w-none">
            <div className="space-y-8 text-gray-300 leading-relaxed">
              {/* Terms and Conditions Section */}
              <div id="terms-conditions" className="border-b border-gray-700 pb-12">
                <h1 className="text-4xl font-bold text-white mb-8">Terms and Conditions</h1>
                
                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
                  <p>
                    By downloading, installing, or using the Tenista app, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our service.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">2. Description of Service</h2>
                  <p>
                    Tenista is a tennis league management and player ranking application that allows users to join leagues, track matches, and compete with other players. We provide a platform for organizing and participating in tennis competitions.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">3. User Accounts</h2>
                  <p>
                    You must create an account to use our services. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate and complete information when creating your account.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">4. User Conduct</h2>
                  <p>
                    You agree to use the app in accordance with all applicable laws and regulations. You will not use the service to harass, abuse, or harm other users. Fair play and sportsmanship are expected in all interactions and competitions.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">5. League Participation</h2>
                  <p>
                    By joining a league, you commit to participating in good faith. Match results should be reported accurately and promptly. Disputes should be resolved through the app&apos;s reporting mechanisms or league administrators.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">6. Privacy and Data Protection</h2>
                  <p>
                    Your privacy is important to us. Please review our Privacy Policy below to understand how we collect, use, and protect your personal information.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">7. Intellectual Property</h2>
                  <p>
                    The Tenista app and all its content, features, and functionality are owned by us and are protected by copyright, trademark, and other intellectual property laws.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">8. Limitation of Liability</h2>
                  <p>
                    We provide the service &quot;as is&quot; without warranties of any kind. We are not liable for any damages arising from your use of the app, including but not limited to injuries during tennis matches or disputes with other users.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">9. Termination</h2>
                  <p>
                    We may terminate or suspend your account at any time for violation of these terms. You may also terminate your account by contacting us or using the account deletion feature in the app.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">10. Changes to Terms</h2>
                  <p>
                    We reserve the right to modify these terms at any time. We will notify users of significant changes through the app or by email. Continued use of the service after changes constitutes acceptance of the new terms.
                  </p>
                </section>
              </div>

              {/* Privacy Policy Section */}
              <div id="privacy-policy" className="pt-12">
                <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
                
                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">Information We Collect</h2>
                  <p className="mb-4">
                    When you use Tenista, we collect only the information necessary to provide our core functionality:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mb-4">
                    <li>Account information (name, email, profile details)</li>
                    <li>Tennis activity data (matches, scores, league participation)</li>
                    <li>Optional information (gender, phone number – only if user chooses to provide)</li>
                    <li>Device and usage information (non-identifiable diagnostics)</li>
                  </ul>
                  <p className="mb-4">
                    We do not collect data for advertising purposes, nor do we track users across apps or websites.
                  </p>
                  <p>
                    We do not use third-party trackers, and we do not require AppTrackingTransparency (ATT) permission because we do not engage in cross-app tracking.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">How We Use Your Information</h2>
                  <p className="mb-4">
                    We use your information solely to:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Enable tennis league participation and rankings</li>
                    <li>Match users with compatible opponents</li>
                    <li>Facilitate communication between players</li>
                    <li>Send necessary updates and notifications</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">Information Sharing</h2>
                  <p className="mb-4">
                    We do not sell your personal information. We only share data as needed to support the app&apos;s core features:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>With other players in your league (e.g. name, skill level, match results)</li>
                    <li>With service providers who help us operate the app</li>
                    <li>With legal authorities if required by law</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">Data Security</h2>
                  <p>
                    We implement appropriate security measures to protect your information. No method of transmission is 100% secure, but we follow best practices to reduce risk.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">Your Rights</h2>
                  <p className="mb-4">
                    You can:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Access, update, or delete your data</li>
                    <li>Delete your account at any time from within the app</li>
                    <li>Request a copy of your data via email</li>
                  </ul>
                </section>
              </div>

              {/* Contact Section */}
              <section className="pt-8 border-t border-gray-700">
                <h2 className="text-2xl font-bold text-white mb-4">11. Contact Information</h2>
                <p>
                  If you have any questions about these Terms and Conditions or Privacy Policy, please contact us at:
                </p>
                <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                  <p><strong>Email:</strong> riglesias@portaloficina.com</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}