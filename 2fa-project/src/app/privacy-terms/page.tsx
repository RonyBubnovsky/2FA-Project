import Link from 'next/link'

export default function PrivacyTermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-secondary-900 dark:text-white mb-4">
          Privacy Policy & Terms of Service
        </h1>
        <p className="text-lg text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto">
          Your privacy and security are our top priorities. Please review our policies and terms of use.
        </p>
        <p className="text-sm text-secondary-500 dark:text-secondary-500 mt-4">
          Last updated: June 21, 2025
        </p>
      </div>

      <div className="space-y-12">
        {/* Privacy Policy Section */}
        <section className="bg-white dark:bg-secondary-900 rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-secondary-900 dark:text-white mb-6 flex items-center">
            <svg className="w-8 h-8 text-primary-600 dark:text-primary-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Privacy Policy
          </h2>

          <div className="space-y-6 text-secondary-700 dark:text-secondary-300">
            <div>
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-3">Information We Collect</h3>
              <p className="mb-4">We collect only the information necessary to provide our two-factor authentication services:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Account Information:</strong> Email address, encrypted password, and optional profile information</li>
                <li><strong>Authentication Data:</strong> Two-factor authentication secrets (encrypted), recovery codes, and login timestamps</li>
                <li><strong>Security Logs:</strong> Login attempts, IP addresses (for security purposes), and device information</li>
                <li><strong>Communication:</strong> Messages sent through our contact form</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-3">How We Use Your Information</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide and maintain our two-factor authentication services</li>
                <li>Secure your account and prevent unauthorized access</li>
                <li>Send important security notifications and service updates</li>
                <li>Respond to your support requests and communications</li>
                <li>Improve our security features and user experience</li>
                <li>Comply with legal obligations and protect against fraud</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-3">Data Security & Encryption</h3>
              <p className="mb-4">We implement industry-standard security measures:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>All sensitive data is encrypted using AES-256 encryption</li>
                <li>Passwords are hashed using bcrypt with salt</li>
                <li>2FA secrets are encrypted and never stored in plain text</li>
                <li>Secure HTTPS connections for all data transmission</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Limited access to data on a need-to-know basis</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-3">Data Sharing & Third Parties</h3>
              <p className="mb-4">We do not sell, trade, or rent your personal information. We may share data only in these limited circumstances:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>With your explicit consent</li>
                <li>To comply with legal requirements or court orders</li>
                <li>To protect our rights, safety, or the safety of others</li>
                <li>With trusted service providers who help us operate our platform (under strict confidentiality agreements)</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-3">Your Privacy Rights</h3>
              <p className="mb-4">You have the following rights regarding your personal data:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                <li><strong>Portability:</strong> Export your data in a common format</li>
                <li><strong>Withdrawal:</strong> Withdraw consent for data processing</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-3">Cookies & Tracking</h3>
              <p className="mb-4">We use minimal cookies and tracking technologies:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Essential cookies for authentication and security</li>
                <li>Session cookies to maintain login state</li>
                <li>Security cookies to prevent CSRF attacks</li>
                <li>We do not use advertising or social media tracking pixels</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Terms of Service Section */}
        <section className="bg-white dark:bg-secondary-900 rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-secondary-900 dark:text-white mb-6 flex items-center">
            <svg className="w-8 h-8 text-primary-600 dark:text-primary-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Terms of Service
          </h2>

          <div className="space-y-6 text-secondary-700 dark:text-secondary-300">
            <div>
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-3">Acceptance of Terms</h3>
              <p>By accessing and using My2FAApp, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree with these terms, please discontinue use of our service immediately.</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-3">Service Description</h3>
              <p className="mb-4">My2FAApp provides two-factor authentication services including:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Time-based One-Time Password (TOTP) generation and verification</li>
                <li>Recovery code generation and management</li>
                <li>Secure account management and authentication</li>
                <li>Security monitoring and notifications</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-3">User Responsibilities</h3>
              <p className="mb-4">As a user of our service, you agree to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide accurate and current information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Keep your recovery codes in a secure location</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Use the service in compliance with applicable laws</li>
                <li>Not attempt to circumvent our security measures</li>
                <li>Not use the service for any illegal or unauthorized purposes</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-3">Service Availability</h3>            <p className="mb-4">While we strive to provide reliable service, we cannot guarantee:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>100% uptime or uninterrupted service</li>
              <li>Error-free operation at all times</li>
              <li>Compatibility with all devices and software</li>
              <li>That our service will meet all your specific requirements</li>
            </ul>
              <p className="mt-4">We reserve the right to modify, suspend, or discontinue our service with reasonable notice.</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-3">Limitation of Liability</h3>            <p className="mb-4">To the maximum extent permitted by law:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Our service is provided &quot;as is&quot; without warranties of any kind</li>
              <li>We are not liable for any indirect, incidental, or consequential damages</li>
              <li>Our total liability shall not exceed the amount paid for our services</li>
              <li>We are not responsible for data loss due to user error or device failure</li>
              <li>Users are responsible for maintaining their own backups of recovery codes</li>
            </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-3">Account Termination</h3>
              <p className="mb-4">We may terminate or suspend your account if:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>You violate these terms of service</li>
                <li>You engage in fraudulent or illegal activities</li>
                <li>Your account remains inactive for an extended period</li>
                <li>We are required to do so by law</li>
              </ul>
              <p className="mt-4">You may delete your account at any time through your account settings.</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-3">Intellectual Property</h3>
              <p>All content, features, and functionality of My2FAApp are owned by us and are protected by copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, or create derivative works without our express permission.</p>
            </div>
          </div>
        </section>

        {/* Accessibility Statement */}
        <section className="bg-white dark:bg-secondary-900 rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-secondary-900 dark:text-white mb-6 flex items-center">
            <svg className="w-8 h-8 text-primary-600 dark:text-primary-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            Accessibility Commitment
          </h2>

          <div className="space-y-6 text-secondary-700 dark:text-secondary-300">
            <div>
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-3">Our Commitment</h3>
              <p>My2FAApp is committed to providing an accessible experience for all users. We strive to comply with the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards and other applicable accessibility standards.</p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-3">Accessibility Features</h3>
              <p className="mb-4">Our platform includes the following accessibility features:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Keyboard navigation support for all interactive elements</li>
                <li>Screen reader compatible markup and ARIA labels</li>
                <li>High contrast color schemes and dark mode support</li>
                <li>Scalable text and responsive design for various devices</li>
                <li>Alternative text for images and visual content</li>
                <li>Clear focus indicators and logical tab order</li>
                <li>Semantic HTML structure for better navigation</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-3">Ongoing Efforts</h3>
              <p className="mb-4">We continuously work to improve accessibility by:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Regular accessibility audits and testing</li>
                <li>User feedback incorporation and testing</li>
                <li>Staff training on accessibility best practices</li>
                <li>Staying updated with the latest accessibility standards</li>
                <li>Working with accessibility experts and consultants</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-3">Feedback & Support</h3>
              <p>If you encounter any accessibility barriers while using our service, please contact us. We are committed to addressing accessibility issues promptly and will work with you to find suitable solutions.</p>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-6 h-6 text-amber-600 dark:text-amber-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">Disclaimer</h4>              <p className="text-amber-700 dark:text-amber-300 text-sm">
                While we make every effort to ensure our platform meets accessibility standards, we acknowledge that achieving perfect accessibility is an ongoing process. We welcome feedback and are committed to making continuous improvements to better serve all users.
              </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section className="bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 rounded-xl shadow-lg p-8 text-white">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Questions or Concerns?</h2>            <p className="mb-6 text-primary-100">
              If you have any questions about our privacy policy, terms of service, or accessibility, 
              we&apos;re here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/contact" 
                className="bg-white text-primary-600 hover:bg-primary-50 font-semibold py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600"
              >
                Contact Us
              </Link>
              <Link 
                href="/" 
                className="border border-white text-white hover:bg-white hover:text-primary-600 font-semibold py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
