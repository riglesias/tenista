import Link from "next/link";
import Image from "next/image";

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-gray-900">
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
        </div>
      </nav>

      <div className="py-20 sm:py-24 lg:py-32">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-gray-700">
            <div className="bg-gradient-to-br from-gray-600 to-gray-700 p-8 sm:p-10 text-center text-white">
              <h1 className="text-2xl sm:text-3xl font-bold">
                Authentication Error
              </h1>
            </div>

            <div className="p-8 sm:p-10 text-center">
              <p className="text-gray-300 mb-4">
                Something went wrong during authentication. The link may have
                expired or already been used.
              </p>
              <ul className="text-left text-gray-300 space-y-1 max-w-md mx-auto mb-8 leading-relaxed">
                <li>- Links expire after 1 hour</li>
                <li>- Each link can only be used once</li>
                <li>- Try requesting a new link from the app</li>
              </ul>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="mailto:support@tenista.app"
                  className="bg-[#84FE0C] text-black px-6 py-3 rounded-xl font-semibold hover:bg-[#7AE60B] transition-colors shadow-lg flex items-center justify-center"
                >
                  Contact Support
                </a>
                <Link
                  href="/"
                  className="border-2 border-gray-600 text-gray-300 px-6 py-3 rounded-xl font-semibold hover:border-[#84FE0C] hover:text-[#84FE0C] transition-colors flex items-center justify-center"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
