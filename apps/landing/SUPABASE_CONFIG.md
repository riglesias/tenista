# Supabase Configuration Instructions

## Password Reset Email Template

Update your Supabase password reset email template to use the following redirect URL:

```
https://tenista.app/reset-password#access_token={{ .Token }}&type=recovery
```

### Important Notes:
1. The URL uses a hash fragment (#) not query parameters (?)
2. The token parameter is named `access_token` not `token`
3. The type must be `recovery`

### Steps to Update in Supabase Dashboard:
1. Go to your Supabase Dashboard
2. Navigate to Authentication → Email Templates
3. Select "Reset Password" template
4. Update the redirect URL in the template
5. Save changes

### Email Template Example:
```html
<div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
  <!-- Header -->
  <div style="background: #111111; padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
    <img src="https://www.tenista.app/logo-tenista.png" alt="Tenista" style="height: 50px; width: auto; margin-bottom: 20px;">
    <h1 style="color: #84FE0C; margin: 0; font-size: 28px;">Password Reset Request</h1>
  </div>
  
  <!-- Content -->
  <div style="background: white; padding: 40px 20px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 24px;">Reset Your Password</h2>
    <p style="color: #4b5563; margin: 0 0 30px; line-height: 1.6;">
      We received a request to reset your password. Click the button below to create a new password for your Tenista account.
    </p>
    
    <!-- Reset Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://tenista.app/reset-password#access_token={{ .Token }}&type=recovery" 
         style="background: #84FE0C; color: black; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 2px 4px rgba(132, 254, 12, 0.3);">
Reset Password
      </a>
    </div>
    
    <!-- Security Notice -->
    <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #f59e0b;">
      <h3 style="color: #92400e; margin: 0 0 10px; font-size: 16px;">⚠️ Security Notice</h3>
      <ul style="color: #92400e; margin: 0; padding-left: 20px; line-height: 1.6;">
        <li>This link expires in 1 hour</li>
        <li>If you didn't request this reset, please ignore this email</li>
        <li>Your password won't change until you create a new one</li>
      </ul>
    </div>
    
    <!-- Fallback Link -->
    <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0; text-align: center;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <span style="word-break: break-all; color: #84FE0C;">
        https://tenista.app/reset-password#access_token={{ .Token }}&type=recovery
      </span>
    </p>
  </div>
  
  <!-- Footer -->
  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0 0 10px;">This password reset was requested for {{ .Email }}</p>
    <p style="margin: 0;">If you didn't request this password reset, you can safely ignore this email and your password will remain unchanged.</p>
  </div>
</div>
```