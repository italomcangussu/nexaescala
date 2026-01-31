// @ts-nocheck
// Supabase Edge Function - Deno Runtime
// Os erros do TypeScript no VSCode são esperados e não afetam a funcionalidade.
// Esta função roda no Deno runtime do Supabase, não no Node.js.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

interface EmailRequest {
    to: string
    subject: string
    userName: string
    userMessage: string
    adminResponse: string
    messageType: string
}

const messageTypeLabels: Record<string, string> = {
    suggestion: 'Sugestão',
    support: 'Suporte Técnico',
    error: 'Erro Reportado',
    compliment: 'Elogio',
    complaint: 'Reclamação'
}

serve(async (req) => {
    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { to, subject, userName, userMessage, adminResponse, messageType }: EmailRequest = await req.json()

        // Validate required fields
        if (!to || !userName || !userMessage || !adminResponse) {
            throw new Error('Missing required fields')
        }

        // Create HTML email template
        const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Resposta do Suporte NexaEscala</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #334155;
              background-color: #f8fafc;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%);
              padding: 32px 24px;
              text-align: center;
            }
            .header h1 {
              color: #ffffff;
              margin: 0;
              font-size: 28px;
              font-weight: 700;
            }
            .header p {
              color: #d1fae5;
              margin: 8px 0 0 0;
              font-size: 14px;
            }
            .content {
              padding: 32px 24px;
            }
            .greeting {
              font-size: 16px;
              color: #1e293b;
              margin-bottom: 16px;
            }
            .info-box {
              background-color: #f1f5f9;
              border-left: 4px solid #10b981;
              padding: 16px;
              margin: 16px 0;
              border-radius: 6px;
            }
            .info-box strong {
              color: #0f766e;
              display: block;
              margin-bottom: 8px;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .info-box p {
              margin: 0;
              color: #475569;
            }
            .response-box {
              background-color: #ecfdf5;
              border: 2px solid #10b981;
              padding: 20px;
              margin: 24px 0;
              border-radius: 8px;
            }
            .response-box strong {
              color: #065f46;
              display: block;
              margin-bottom: 12px;
              font-size: 16px;
            }
            .response-box p {
              margin: 0;
              color: #064e3b;
              white-space: pre-wrap;
              line-height: 1.7;
            }
            .footer {
              background-color: #f8fafc;
              padding: 24px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
            }
            .footer p {
              margin: 8px 0;
              font-size: 14px;
              color: #64748b;
            }
            .footer a {
              color: #10b981;
              text-decoration: none;
              font-weight: 600;
            }
            .footer a:hover {
              text-decoration: underline;
            }
            .badge {
              display: inline-block;
              padding: 4px 12px;
              background-color: #dbeafe;
              color: #1e40af;
              border-radius: 12px;
              font-size: 12px;
              font-weight: 600;
              margin-bottom: 8px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="header">
              <h1>✅ NexaEscala</h1>
              <p>Resposta do Suporte</p>
            </div>

            <!-- Content -->
            <div class="content">
              <p class="greeting">Olá, <strong>${userName}</strong>! 👋</p>
              
              <p>Recebemos sua mensagem e temos uma resposta para você:</p>

              <!-- Message Type Badge -->
              <div style="margin: 16px 0;">
                <span class="badge">${messageTypeLabels[messageType] || messageType}</span>
              </div>

              <!-- Original Message -->
              <div class="info-box">
                <strong>📝 Sua Mensagem Original:</strong>
                <p>${userMessage}</p>
              </div>

              <!-- Admin Response -->
              <div class="response-box">
                <strong>💬 Nossa Resposta:</strong>
                <p>${adminResponse}</p>
              </div>

              <p style="margin-top: 24px; color: #475569;">
                Se você tiver mais dúvidas ou precisar de ajuda adicional, não hesite em nos contatar novamente através do nosso 
                <a href="${Deno.env.get('PUBLIC_SITE_URL') || 'https://nexaescala.com'}/suporte" style="color: #10b981; font-weight: 600;">formulário de suporte</a>.
              </p>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p>📧 <strong>Equipe NexaEscala</strong></p>
              <p>Gestão inteligente para sua equipe</p>
              <p style="margin-top: 16px; font-size: 12px; color: #94a3b8;">
                Este é um email automático. Por favor, não responda diretamente a este email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `

        // Send email using Resend
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: 'NexaEscala Suporte <suporte@nexaescala.com>',
                to: [to],
                subject: subject || 'Resposta do Suporte NexaEscala',
                html: htmlContent,
            }),
        })

        if (res.ok) {
            const data = await res.json()
            return new Response(JSON.stringify({ success: true, data }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        } else {
            const error = await res.text()
            throw new Error(`Resend API error: ${error}`)
        }

    } catch (error) {
        console.error('Error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
