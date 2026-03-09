import { Resend } from "npm:resend@4.0.0"

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string)

interface EmailPayload {
  user: {
    email: string
  }
  email_data: {
    token: string
    token_hash: string
    redirect_to: string
    email_action_type: string
    site_url: string
    token_new: string
    token_hash_new: string
  }
}

function getSubject(emailActionType: string): string {
  switch (emailActionType) {
    case "signup":
      return "Verify Your Email - Tenista"
    case "recovery":
      return "Reset Your Password - Tenista"
    case "email_change":
      return "Confirm Email Change - Tenista"
    case "magic_link":
      return "Your Login Code - Tenista"
    default:
      return "Your Verification Code - Tenista"
  }
}

function getHeading(emailActionType: string): string {
  switch (emailActionType) {
    case "signup":
      return "Verify Your Email"
    case "recovery":
      return "Reset Your Password"
    case "email_change":
      return "Confirm Email Change"
    case "magic_link":
      return "Log In to Tenista"
    default:
      return "Your Verification Code"
  }
}

function getMessage(emailActionType: string): string {
  switch (emailActionType) {
    case "signup":
      return "Welcome to Tenista! Enter this code in the app to verify your email and get started."
    case "recovery":
      return "Enter this code in the app to reset your password."
    case "email_change":
      return "Enter this code in the app to confirm your new email address."
    case "magic_link":
      return "Enter this code in the app to log in."
    default:
      return "Enter this code in the app to continue."
  }
}

function buildHtml(token: string, emailActionType: string): string {
  const heading = getHeading(emailActionType)
  const message = getMessage(emailActionType)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f3f4f6; padding: 40px 0;">
  <div style="max-width: 600px; margin: 0 auto;">

    <!-- Header -->
    <div style="background: #111111; padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
      <img src="https://www.tenista.app/logo-tenista.png" alt="Tenista" style="height: 50px; width: auto;">
    </div>

    <!-- Main Content -->
    <div style="background: white; padding: 40px 20px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 24px;">${heading}</h2>
      <p style="color: #4b5563; margin: 0 0 30px; line-height: 1.6;">
        ${message}
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <div style="display: inline-block; background: #111111; border-radius: 8px; padding: 20px 36px;">
          <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #84FE0C; font-family: 'Courier New', monospace;">${token}</span>
        </div>
      </div>

      <p style="color: #6b7280; font-size: 14px; text-align: center;">
        This code expires in 10 minutes.
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
      <p>If you didn't request this, you can safely ignore this email.</p>
    </div>

  </div>
</body>
</html>`
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("not allowed", { status: 400 })
  }

  try {
    const {
      user,
      email_data: { token, email_action_type },
    } = await req.json() as EmailPayload

    const html = buildHtml(token, email_action_type)
    const subject = getSubject(email_action_type)

    const { error } = await resend.emails.send({
      from: "Tenista <hello@tenista.app>",
      to: [user.email],
      subject,
      html,
    })

    if (error) {
      throw error
    }
  } catch (error: unknown) {
    const err = error as { code?: number; message?: string }
    console.error("send-email hook error:", JSON.stringify(err), err.message)
    return new Response(
      JSON.stringify({
        error: {
          http_code: err.code ?? 500,
          message: err.message ?? "Internal error",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }

  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
})
