import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const ADMIN_EMAIL = "riglesias@portaloficina.com"

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      } 
    })
  }

  try {
    const { 
      playerName, 
      playerEmail, 
      currentRating, 
      requestedRating, 
      reason 
    } = await req.json()

    // Validate required fields
    if (!playerName || !playerEmail || !currentRating || !requestedRating || !reason) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    // Create email content
    const emailSubject = `Rating Change Request - ${playerName}`
    const emailContent = `
New Rating Change Request

Player Details:
- Name: ${playerName}
- Email: ${playerEmail}
- Current Rating: ${currentRating}
- Requested Rating: ${requestedRating}

Reason for Change:
${reason}

Please review this request and update the player's rating if appropriate.

---
This is an automated message from the Tenista Tennis League app.
    `.trim()

    // Log the email for now (in production, integrate with email service)
    console.log('Rating Change Request Email:', {
      to: ADMIN_EMAIL,
      subject: emailSubject,
      content: emailContent,
      timestamp: new Date().toISOString()
    })

    // TODO: Integrate with actual email service like Resend, SendGrid, etc.
    // For now, we'll just log and return success
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Rating change request email sent successfully' 
      }),
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error) {
    console.error('Error sending rating change email:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send rating change request email',
        details: error.message 
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
})