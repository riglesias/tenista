'use client';

import { useEffect, useState } from 'react';
import Image from "next/image";
import Link from "next/link";
import { createClient } from '@/lib/supabase/client';

type ResetState = 'loading' | 'form' | 'success' | 'error';

interface PasswordStrength {
  score: number;
  feedback: string[];
  color: string;
}


function checkPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score++;
  } else {
    feedback.push('At least 8 characters');
  }

  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push('One uppercase letter');
  }

  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push('One lowercase letter');
  }

  if (/[0-9]/.test(password)) {
    score++;
  } else {
    feedback.push('One number');
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score++;
  } else {
    feedback.push('One special character');
  }

  let color = 'bg-red-500';
  if (score === 5) color = 'bg-green-500';
  else if (score >= 3) color = 'bg-yellow-500';

  return { score, feedback, color };
}

export default function ResetPasswordForm() {
  const supabase = createClient();
  const [state, setState] = useState<ResetState>('loading');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordStrength = checkPasswordStrength(password);

  useEffect(() => {
    // Listen for password recovery event
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // User has clicked the recovery link and session is ready
        setState('form');
      } else if (event === 'USER_UPDATED') {
        // Password has been updated successfully
        setState('success');
      }
    });

    // Check initial session state
    const checkInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      // If we have a session with recovery_sent_at, show the form
      if (session?.user?.recovery_sent_at) {
        setState('form');
      } else {
        // Wait a bit for the auth state change event
        setTimeout(() => {
          if (state === 'loading') {
            setState('error');
            setErrorMessage('Invalid or expired reset link');
          }
        }, 3000);
      }
    };
    
    checkInitialSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth, state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    if (passwordStrength.score < 3) {
      setErrorMessage('Please choose a stronger password');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setErrorMessage(error.message || 'Failed to reset password');
      } else {
        setState('success');
        
        await supabase.auth.signOut();
      }
    } catch {
      setErrorMessage('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/#features" className="text-gray-300 hover:text-[#84FE0C] transition-colors font-medium">Features</Link>
            <Link href="/#download" className="text-gray-300 hover:text-[#84FE0C] transition-colors font-medium">Download</Link>
            <button className="bg-[#84FE0C] text-black px-4 py-2 rounded-full hover:bg-[#7AE60B] transition-colors font-semibold ml-4 text-sm">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <div className="py-20 sm:py-24 lg:py-32">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-gray-700">
            {state === 'loading' && (
              <div className="bg-gradient-to-br from-[#84FE0C] to-[#5CB209] p-8 sm:p-10 text-center text-black">
                <h1 className="text-2xl sm:text-3xl font-bold">Validating Reset Link...</h1>
              </div>
            )}
            
            {state === 'form' && (
              <div className="bg-gradient-to-br from-[#84FE0C] to-[#5CB209] p-8 sm:p-10 text-center text-black">
                <h1 className="text-2xl sm:text-3xl font-bold">Reset Your Password</h1>
              </div>
            )}
            
            {state === 'success' && (
              <div className="bg-gradient-to-br from-[#84FE0C] to-[#5CB209] p-8 sm:p-10 text-center text-black">
                <h1 className="text-2xl sm:text-3xl font-bold flex items-center justify-center gap-2">
                  <span>✅</span>
                  Password Reset Successfully!
                </h1>
              </div>
            )}
            
            {state === 'error' && (
              <div className="bg-gradient-to-br from-gray-600 to-gray-700 p-8 sm:p-10 text-center text-white">
                <h1 className="text-2xl sm:text-3xl font-bold flex items-center justify-center gap-2">
                  <span className="text-red-500">❌</span>
                  Reset Link Invalid
                </h1>
              </div>
            )}
            
            <div className="p-8 sm:p-10">
              {state === 'loading' && (
                <div className="text-center">
                  <div className="w-8 h-8 border-3 border-gray-600 border-t-[#84FE0C] rounded-full animate-spin mx-auto mb-6"></div>
                  <p className="text-gray-300">Please wait while we validate your reset link.</p>
                </div>
              )}
              
              {state === 'form' && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#84FE0C] focus:border-transparent"
                        placeholder="Enter your new password"
                        required
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                      >
                        {showPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                    
                    {password && (
                      <div className="mt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-1 bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${passwordStrength.color}`}
                              style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400">
                            {passwordStrength.score === 5 ? 'Strong' : passwordStrength.score >= 3 ? 'Medium' : 'Weak'}
                          </span>
                        </div>
                        {passwordStrength.feedback.length > 0 && (
                          <p className="text-xs text-gray-400">
                            Needs: {passwordStrength.feedback.join(', ')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#84FE0C] focus:border-transparent"
                        placeholder="Confirm your new password"
                        required
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                      >
                        {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                      <p className="text-sm text-red-400">{errorMessage}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || passwordStrength.score < 3}
                    className="w-full bg-[#84FE0C] text-black px-6 py-3 rounded-xl font-semibold hover:bg-[#7AE60B] transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
                  </button>
                </form>
              )}
              
              {state === 'success' && (
                <div className="text-center">
                  <p className="text-gray-300 mb-8">
                    Your password has been reset successfully. You can now log in to the Tenista app with your new password.
                  </p>
                  
                  <div className="mb-8">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-4">Download the Tenista App</h3>
                    <p className="text-gray-300 mb-6">Sign in with your new password:</p>
                    
                    <div className="flex gap-3 justify-center mb-8">
                      <a 
                        href="https://apps.apple.com/us/app/tenista/id6747273398" 
                        className="bg-[#84FE0C] text-black px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[#7AE60B] transition-colors shadow-lg flex items-center justify-center"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        iOS
                      </a>
                      <a 
                        href="https://play.google.com/store/apps/details?id=com.tenista" 
                        className="bg-[#84FE0C] text-black px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[#7AE60B] transition-colors shadow-lg flex items-center justify-center"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Android
                      </a>
                    </div>
                  </div>
                  
                  <div className="bg-gray-700/50 p-6 rounded-xl border border-gray-600">
                    <h4 className="font-bold text-white mb-4">What&apos;s Next?</h4>
                    <ol className="text-left text-gray-300 space-y-2 max-w-md mx-auto leading-relaxed">
                      <li>1. Open the Tenista app on your device</li>
                      <li>2. Sign in with your email and new password</li>
                      <li>3. Start connecting with tennis players!</li>
                    </ol>
                  </div>
                </div>
              )}
              
              {state === 'error' && (
                <div className="text-center">
                  <p className="text-gray-300 mb-4">This password reset link is invalid or has expired.</p>
                  {errorMessage && (
                    <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 mb-4">
                      <p className="text-sm text-red-400">Error: {errorMessage}</p>
                    </div>
                  )}
                  <ul className="text-left text-gray-300 space-y-1 max-w-md mx-auto mb-8 leading-relaxed">
                    <li>• Reset links expire after 1 hour</li>
                    <li>• Each link can only be used once</li>
                    <li>• Request a new reset link from the app</li>
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
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}