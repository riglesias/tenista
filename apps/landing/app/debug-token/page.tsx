'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function DebugTokenPage() {
  const [tokenHash, setTokenHash] = useState('');
  const [result, setResult] = useState<{
    success: boolean;
    error?: string;
    details?: unknown;
    data?: unknown;
    session?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleVerify = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('Verifying token:', tokenHash);
      
      const { data, error } = await supabase.auth.verifyOtp({
        type: 'recovery',
        token_hash: tokenHash,
      });

      if (error) {
        setResult({
          success: false,
          error: error.message,
          details: error,
        });
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        setResult({
          success: true,
          data,
          session: session ? 'Session created' : 'No session',
        });
      }
    } catch (error) {
      setResult({
        success: false,
        error: String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Debug Token Verification</h1>
        
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Instructions:</h2>
          <ol className="list-decimal list-inside text-gray-300 space-y-2">
            <li>Request a password reset email</li>
            <li>In the email, find the reset link</li>
            <li>Extract the token_hash parameter from the URL</li>
            <li>Paste it below and click Verify</li>
          </ol>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Token Hash
          </label>
          <textarea
            value={tokenHash}
            onChange={(e) => setTokenHash(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#84FE0C] font-mono text-sm"
            rows={3}
            placeholder="Paste the token_hash value here..."
          />
          
          <button
            onClick={handleVerify}
            disabled={loading || !tokenHash}
            className="mt-4 bg-[#84FE0C] text-black px-6 py-2 rounded-lg font-semibold hover:bg-[#7AE60B] transition-colors disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify Token'}
          </button>

          {result && (
            <div className={`mt-6 p-4 rounded-lg ${result.success ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              <h3 className={`font-semibold mb-2 ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                {result.success ? '✅ Success' : '❌ Failed'}
              </h3>
              <pre className="text-xs text-gray-300 overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="mt-6 bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-2">Common Issues:</h3>
          <ul className="list-disc list-inside text-gray-300 space-y-1">
            <li>Token expired (valid for 1 hour)</li>
            <li>Token already used (single use only)</li>
            <li>Invalid token format</li>
            <li>Wrong token type (should be recovery)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}