'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function TestResetPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://www.tenista.app/api/auth/callback?type=recovery',
      });

      if (error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage(`✅ Reset email sent to ${email}. Check your inbox!`);
      }
    } catch (error) {
      setMessage(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-6">Test Password Reset</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#84FE0C]"
              placeholder="test@example.com"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#84FE0C] text-black py-2 px-4 rounded-lg font-semibold hover:bg-[#7AE60B] transition-colors disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Reset Email'}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-3 rounded-lg ${message.includes('Error') ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
            {message}
          </div>
        )}

        <div className="mt-6 text-sm text-gray-400">
          <p className="mb-2">Test Flow:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Enter your email above</li>
            <li>Check your inbox for the reset email</li>
            <li>Click the reset button in the email</li>
            <li>You&apos;ll be redirected to /reset-password</li>
            <li>Enter your new password</li>
          </ol>
        </div>
      </div>
    </div>
  );
}