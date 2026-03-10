'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from "next/image";
import Link from "next/link";
import { createClient } from '@/lib/supabase/client'; // Import the Supabase client

type ConfirmationState = 'loading' | 'success' | 'error';

function EmailConfirmationContent() {
  const supabase = createClient();
  const [state, setState] = useState<ConfirmationState>('loading');
  const searchParams = useSearchParams();
  const error = searchParams.get('error_description');

  useEffect(() => {
    // Supabase handles the session verification automatically when the user lands on the page
    // from the confirmation link. We just need to listen for the auth event.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // The SIGNED_IN event fires after a successful email confirmation
      if (event === 'SIGNED_IN' && session) {
        setState('success');
        if (subscription) {
          subscription.unsubscribe();
        }
      }
    });

    // If the URL contains an error from Supabase, the link was invalid.
    if (error) {
      setState('error');
    }

    // Set a timeout to handle cases where the auth event doesn't fire
    const timer = setTimeout(() => {
      if (state === 'loading') {
        // If there's no session after a few seconds, assume error.
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session) {
            setState('error');
          }
        });
      }
    }, 5000);

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
      clearTimeout(timer);
    };
  }, [supabase.auth, error, state]);

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
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="py-20 sm:py-24 lg:py-32">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-gray-700">
            {state === 'loading' && (
              <div className="bg-gradient-to-br from-[#84FE0C] to-[#5CB209] p-8 sm:p-10 text-center text-black">
                <h1 className="text-2xl sm:text-3xl font-bold">Confirming Your Email...</h1>
              </div>
            )}
            
            {state === 'success' && (
              <div className="bg-gradient-to-br from-[#84FE0C] to-[#5CB209] p-8 sm:p-10 text-center text-black">
                <h1 className="text-2xl sm:text-3xl font-bold flex items-center justify-center gap-2">
                  <span>✅</span>
                  Email Confirmed Successfully!
                </h1>
              </div>
            )}
            
            {state === 'error' && (
              <div className="bg-gradient-to-br from-gray-600 to-gray-700 p-8 sm:p-10 text-center text-white">
                <h1 className="text-2xl sm:text-3xl font-bold flex items-center justify-center gap-2">
                  <span className="text-red-500">❌</span>
                  Confirmation Failed
                </h1>
              </div>
            )}
            
            <div className="p-8 sm:p-10 text-center">
              {state === 'loading' && (
                <div>
                  <div className="w-8 h-8 border-3 border-gray-600 border-t-[#84FE0C] rounded-full animate-spin mx-auto mb-6"></div>
                  <p className="text-gray-300">Please wait while we verify your account.</p>
                </div>
              )}
              
              {state === 'success' && (
                <div>
                  <p className="text-gray-300 mb-12">
                    Your email has been verified and your account is now active. Continue your onboarding in the app.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                    <a 
                      href="tenistaapp://email-confirmed" // <-- THE DEEP LINK
                      className="bg-[#84FE0C] text-black px-6 py-3 rounded-xl font-semibold hover:bg-[#7AE60B] transition-colors shadow-lg flex items-center justify-center"
                    >
                      Open Tenista App
                    </a>
                  </div>
                  
                  <div className="bg-gray-700/50 p-6 rounded-xl border border-gray-600">
                    <h4 className="font-bold text-white mb-4">Don&apos;t have the app?</h4>
                    <p className="text-gray-300 mb-4">Get the full Tenista experience on your mobile device:</p>
                    <div className="flex gap-3 justify-center">
                      <a 
                        href="https://apps.apple.com/us/app/tenista/id6747273398" 
                        className="bg-white text-black px-4 py-2 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors shadow-lg flex items-center justify-center"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        iOS App Store
                      </a>
                      <a 
                        href="https://play.google.com/store/apps/details?id=com.tenista" 
                        className="bg-white text-black px-4 py-2 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors shadow-lg flex items-center justify-center"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Google Play Store
                      </a>
                    </div>
                  </div>
                </div>
              )}
              
              {state === 'error' && (
                <div>
                  <p className="text-gray-300 mb-4">We couldn&apos;t confirm your email address. This might be because the link has expired or has already been used.</p>
                  
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
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EmailConfirmedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-gray-600 border-t-[#84FE0C] rounded-full animate-spin"></div>
      </div>
    }>
      <EmailConfirmationContent />
    </Suspense>
  );
}