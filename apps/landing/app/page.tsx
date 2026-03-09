import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-gray-900/90 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-[1088px] mx-auto flex items-center justify-between px-6 py-4 lg:px-8">
          <Image
            src="/logo-tenista.svg"
            alt="Tenista"
            width={120}
            height={40}
            className="h-10 w-auto"
          />
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-300 hover:text-[#84FE0C] transition-colors font-medium">Features</a>
            <a href="#download" className="text-gray-300 hover:text-[#84FE0C] transition-colors font-medium">Download</a>
            <button className="bg-[#84FE0C] text-black px-4 py-2 rounded-full hover:bg-[#7AE60B] transition-colors font-semibold ml-4 text-sm">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-b-[60px] overflow-hidden">
        <div className="max-w-[1088px] mx-auto px-4 py-8 sm:px-6 lg:px-8 sm:py-12 lg:py-16">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="text-left order-2 lg:order-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 lg:mb-4 leading-tight">
                Find Your Perfect
                <span className="text-[#84FE0C]"> Tennis</span> Match
              </h1>
              <p className="text-base sm:text-lg text-gray-300 mb-8 lg:mb-10 max-w-lg leading-relaxed">
                Connect with tennis players, join flex leagues, and compete in tournaments. 
                The modern way to elevate your tennis game.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
                <a href="https://apps.apple.com/us/app/tenista/id6747273398" target="_blank" rel="noopener noreferrer" className="bg-[#84FE0C] text-black px-6 sm:px-8 py-2 sm:py-3 rounded-xl text-sm sm:text-base font-semibold hover:bg-[#7AE60B] transition-colors shadow-lg flex items-center justify-center gap-2 flex-1 sm:flex-none sm:min-w-[180px]">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  Download for iOS
                </a>
                <button className="border-2 border-gray-600 text-gray-300 px-6 sm:px-8 py-2 sm:py-3 rounded-xl text-sm sm:text-base font-semibold hover:border-[#84FE0C] hover:text-[#84FE0C] transition-colors flex items-center justify-center gap-2 flex-1 sm:flex-none sm:min-w-[180px] cursor-not-allowed opacity-75">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                  Coming Soon
                </button>
              </div>
            </div>
            <div className="relative flex justify-center items-center order-1 lg:order-2 min-h-[400px] sm:min-h-[450px] lg:min-h-[500px] xl:min-h-[550px]">
              {/* Phone 1 */}
              <div className="relative z-20 -ml-4 sm:-ml-6 lg:-ml-8">
                <div className="bg-gray-800 rounded-[1.5rem] sm:rounded-[2rem] lg:rounded-[2.5rem] p-1 sm:p-2 shadow-2xl border border-gray-700 transform -rotate-3 sm:-rotate-6 hover:rotate-0 transition-transform duration-300">
                  <div className="bg-black rounded-[1.25rem] sm:rounded-[1.5rem] lg:rounded-[2rem] p-0.5 sm:p-1">
                    <Image
                      src="/find-a-tennis-partner.png"
                      alt="Tenista app screen - Find a tennis partner"
                      width={1206}
                      height={2622}
                      className="rounded-[1rem] sm:rounded-[1.25rem] lg:rounded-[1.5rem] w-48 h-[25.9rem] sm:w-52 sm:h-[28.1rem] lg:w-56 lg:h-[30.2rem] xl:w-60 xl:h-[32.4rem] object-contain"
                    />
                  </div>
                </div>
              </div>
              
              {/* Phone 2 - Positioned behind and to the right, moved more to the left */}
              <div className="absolute z-10 top-6 sm:top-8 lg:top-10 right-2 sm:right-4 lg:right-8 xl:right-12 hidden sm:block">
                <div className="bg-gray-800 rounded-[1.5rem] sm:rounded-[2rem] lg:rounded-[2.5rem] p-1 sm:p-2 shadow-2xl border border-gray-700 transform rotate-3 sm:rotate-6 hover:rotate-0 transition-transform duration-300">
                  <div className="bg-black rounded-[1.25rem] sm:rounded-[1.5rem] lg:rounded-[2rem] p-0.5 sm:p-1">
                    <Image
                      src="/tennis-league.png"
                      alt="Tenista app screen - Tennis league"
                      width={1206}
                      height={2622}
                      className="rounded-[1rem] sm:rounded-[1.25rem] lg:rounded-[1.5rem] w-44 h-[23.8rem] sm:w-48 sm:h-[25.9rem] lg:w-52 lg:h-[28.1rem] xl:w-56 xl:h-[30.2rem] object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-24 lg:py-32 bg-[#84FE0C]">
        <div className="max-w-[1088px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black mb-3 sm:mb-4">
              Play More Tennis with Tenista
            </h2>
            <p className="text-base sm:text-lg text-black/80 max-w-2xl mx-auto px-4 leading-relaxed">
              Discover, connect, and compete with our comprehensive tennis platform designed for players of all levels.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-8 gap-4 sm:gap-6">
            {/* Feature 1 - Find Partners (Large) */}
            <div className="md:col-span-5">
              <div className="bg-[#111827] rounded-2xl sm:rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-white/20 h-full flex flex-col">
                <div className="relative h-64">
                  <Image
                    src="/find-a-player.png"
                    alt="Find tennis players"
                    fill
                    className="object-cover object-top"
                  />
                </div>
                <div className="p-4 sm:p-6 h-28 flex flex-col justify-between">
                  <h3 className="text-lg font-bold text-white mb-1">Find Partners</h3>
                  <p className="text-white/70 leading-snug text-xs sm:text-sm">
                    Connect with players of your skill level nearby. Filter by location, rating, and availability to find your perfect match.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 2 - Play Tennis Now (Small) */}
            <div className="md:col-span-3">
              <div className="bg-[#111827] rounded-2xl sm:rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-white/20 h-full flex flex-col">
                <div className="relative h-64">
                  <Image
                    src="/play-tennis-now.png"
                    alt="Play tennis now"
                    fill
                    className="object-cover object-top"
                  />
                </div>
                <div className="p-4 sm:p-6 h-28 flex flex-col justify-between">
                  <h3 className="text-lg font-bold text-white mb-1">Play Now</h3>
                  <p className="text-white/70 leading-snug text-xs sm:text-sm">
                    Find instant matches and games happening right now in your area.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 3 - Tennis Leagues (Small) */}
            <div className="md:col-span-3">
              <div className="bg-[#111827] rounded-2xl sm:rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-white/20 h-full flex flex-col">
                <div className="relative h-64">
                  <Image
                    src="/tennis-league.png"
                    alt="Tennis league competition"
                    fill
                    className="object-cover object-top"
                  />
                </div>
                <div className="p-4 sm:p-6 h-28 flex flex-col justify-between">
                  <h3 className="text-lg font-bold text-white mb-1">Flex Leagues</h3>
                  <p className="text-white/70 leading-snug text-xs sm:text-sm">
                    Join flexible leagues that adapt to your schedule and skill level.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 4 - Results (Large) */}
            <div className="md:col-span-5">
              <div className="bg-[#111827] rounded-2xl sm:rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-white/20 h-full flex flex-col">
                <div className="relative h-64">
                  <Image
                    src="/results.png"
                    alt="Tennis match results and statistics"
                    fill
                    className="object-cover object-top"
                  />
                </div>
                <div className="p-4 sm:p-6 h-28 flex flex-col justify-between">
                  <h3 className="text-lg font-bold text-white mb-1">Track Results</h3>
                  <p className="text-white/70 leading-snug text-xs sm:text-sm">
                    Monitor your progress with detailed match statistics and performance analytics.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 sm:py-24 lg:py-32 bg-gray-900">
        <div className="max-w-[1088px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
              What Players Are Saying
            </h2>
            <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto px-4 leading-relaxed">
              Join thousands of tennis players who have transformed their game with Tenista.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Testimonial 1 */}
            <div className="bg-gray-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-gray-700">
              <div className="flex items-center mb-4">
                <div className="flex text-[#84FE0C] mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <blockquote className="text-gray-300 mb-6 leading-relaxed">
                &ldquo;Finally found consistent playing partners! The skill matching is spot-on and I&apos;ve improved my game significantly since joining.&rdquo;
              </blockquote>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-[#84FE0C] rounded-full flex items-center justify-center text-black font-bold text-sm">
                  MJ
                </div>
                <div className="ml-3">
                  <div className="text-white font-semibold">Maria J.</div>
                  <div className="text-gray-400 text-sm">NTRP 4.0 Player</div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-gray-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-gray-700">
              <div className="flex items-center mb-4">
                <div className="flex text-[#84FE0C] mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <blockquote className="text-gray-300 mb-6 leading-relaxed">
                &ldquo;The flex leagues are perfect for my busy schedule. I can play competitive tennis without the rigid commitment of traditional leagues.&rdquo;
              </blockquote>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-[#84FE0C] rounded-full flex items-center justify-center text-black font-bold text-sm">
                  DK
                </div>
                <div className="ml-3">
                  <div className="text-white font-semibold">David K.</div>
                  <div className="text-gray-400 text-sm">League Champion</div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-gray-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-gray-700">
              <div className="flex items-center mb-4">
                <div className="flex text-[#84FE0C] mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <blockquote className="text-gray-300 mb-6 leading-relaxed">
                &ldquo;Love the tournament features! Easy to find and register for local competitions. The app keeps track of everything perfectly.&rdquo;
              </blockquote>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-[#84FE0C] rounded-full flex items-center justify-center text-black font-bold text-sm">
                  SC
                </div>
                <div className="ml-3">
                  <div className="text-white font-semibold">Sarah C.</div>
                  <div className="text-gray-400 text-sm">Tournament Player</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Available Cities Section */}
      <section className="py-20 sm:py-24 lg:py-32 bg-gray-800">
        <div className="max-w-[1088px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
              Available in These Cities
            </h2>
            <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto px-4 leading-relaxed">
              Join the growing tennis community in your city. More locations coming soon!
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Santiago, Chile */}
            <div className="relative group overflow-hidden rounded-2xl sm:rounded-3xl hover:shadow-xl transition-all duration-300">
              <div className="relative h-64 sm:h-80">
                <Image
                  src="/santiago.webp"
                  alt="Santiago, Chile skyline"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">Santiago</h3>
                  <p className="text-gray-200 text-xs sm:text-sm">Chile</p>
                  <div className="mt-3 flex items-center text-[#84FE0C] text-sm font-semibold">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Available Now
                  </div>
                </div>
              </div>
            </div>

            {/* Denver, Colorado */}
            <div className="relative group overflow-hidden rounded-2xl sm:rounded-3xl hover:shadow-xl transition-all duration-300">
              <div className="relative h-64 sm:h-80">
                <Image
                  src="/denver.jpeg"
                  alt="Denver, Colorado skyline"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">Denver</h3>
                  <p className="text-gray-200 text-xs sm:text-sm">Colorado, USA</p>
                  <div className="mt-3 flex items-center text-[#84FE0C] text-sm font-semibold">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Available Now
                  </div>
                </div>
              </div>
            </div>

            {/* Miami, Florida */}
            <div className="relative group overflow-hidden rounded-2xl sm:rounded-3xl hover:shadow-xl transition-all duration-300">
              <div className="relative h-64 sm:h-80">
                <Image
                  src="/miami.avif"
                  alt="Miami, Florida skyline"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">Miami</h3>
                  <p className="text-gray-200 text-xs sm:text-sm">Florida, USA</p>
                  <div className="mt-3 flex items-center text-[#84FE0C] text-sm font-semibold">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Available Now
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section id="download" className="py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-[#84FE0C] to-[#5CB209] rounded-t-[40px] sm:rounded-t-[60px] -mt-[40px] sm:-mt-[60px] relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black mb-3 sm:mb-4">
            Ready to Elevate Your Tennis Game?
          </h2>
          <p className="text-base sm:text-lg text-black/80 mb-4 sm:mb-6 max-w-xl mx-auto px-4 leading-relaxed">
            Join thousands of tennis players who are already using Tenista to find partners, 
            compete in leagues, and dominate tournaments.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <a href="https://apps.apple.com/us/app/tenista/id6747273398" target="_blank" rel="noopener noreferrer" className="bg-black text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-sm sm:text-base font-semibold hover:bg-gray-800 transition-colors shadow-lg flex items-center justify-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              Download for iOS
            </a>
            <button className="bg-black text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-sm sm:text-base font-semibold hover:bg-gray-800 transition-colors shadow-lg flex items-center justify-center gap-2 cursor-not-allowed opacity-75">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
              </svg>
              Coming Soon
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-20 sm:py-24 lg:py-32">
        <div className="max-w-[1088px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-8 lg:gap-12">
            <div className="lg:max-w-md">
              <Image
                src="/logo-tenista.svg"
                alt="Tenista"
                width={120}
                height={40}
                className="h-6 sm:h-8 w-auto mb-3 sm:mb-4"
              />
              <p className="text-gray-400 leading-relaxed text-sm sm:text-base">
                The modern tennis app for finding partners, joining leagues, and competing in tournaments.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-8 sm:gap-12">
              <div>
                <h4 className="font-semibold mb-3 sm:mb-4 text-white text-sm sm:text-base">Support</h4>
                <ul className="space-y-1 sm:space-y-2 text-gray-400 text-xs sm:text-sm">
                  <li className="hover:text-[#84FE0C] transition-colors cursor-pointer">Help Center</li>
                  <li className="hover:text-[#84FE0C] transition-colors cursor-pointer">Contact Us</li>
                  <li><a href="/terms#privacy-policy" className="hover:text-[#84FE0C] transition-colors">Privacy Policy</a></li>
                  <li><a href="/terms#terms-conditions" className="hover:text-[#84FE0C] transition-colors">Terms of Service</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 sm:mb-4 text-white text-sm sm:text-base">Connect</h4>
                <ul className="space-y-1 sm:space-y-2 text-gray-400 text-xs sm:text-sm">
                  <li className="hover:text-[#84FE0C] transition-colors cursor-pointer">Twitter</li>
                  <li className="hover:text-[#84FE0C] transition-colors cursor-pointer">Instagram</li>
                  <li className="hover:text-[#84FE0C] transition-colors cursor-pointer">Facebook</li>
                  <li className="hover:text-[#84FE0C] transition-colors cursor-pointer">LinkedIn</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 sm:pt-8 mt-6 sm:mt-8 flex flex-col sm:flex-row justify-between items-center text-gray-400 gap-4">
            <p className="text-xs sm:text-sm">Built with ❤️ by <a href="https://www.riglesias.com/" target="_blank" rel="noopener noreferrer" className="text-[#84FE0C] hover:text-[#7AE60B] transition-colors">riglesias.com</a></p>
            <p className="text-xs sm:text-sm">&copy; 2025 Tenista. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}