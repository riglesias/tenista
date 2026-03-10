'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setError('');

    // This is the correct way to trigger the password reset flow
    // that matches your email template and API route.
    const origin = window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password`,
    });

    setIsSubmitting(false);

    if (error) {
      setError(`Error: ${error.message}`);
    } else {
      setMessage('Password reset link sent! Please check your email.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-2xl border border-gray-700">
        <h1 className="text-2xl font-bold text-center text-[#84FE0C]">Forgot Password</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#84FE0C]"
              placeholder="you@example.com"
              required
              disabled={isSubmitting}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#84FE0C] text-black px-6 py-3 rounded-xl font-semibold hover:bg-[#7AE60B] transition-colors shadow-lg disabled:opacity-50"
          >
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        {message && <p className="text-green-400 text-center">{message}</p>}
        {error && <p className="text-red-400 text-center">{error}</p>}
        <div className="text-center">
          <Link href="/" className="text-sm text-gray-400 hover:text-[#84FE0C]">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
