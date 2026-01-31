# 📧 Edge Function: Send Support Email

Esta Edge Function é responsável por enviar emails de resposta do suporte aos usuários.

## 🚀 Deploy da Função

### 1. Instalar Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Ou via npm
npm install -g supabase
```

### 2. Login no Supabase

```bash
supabase login
```

### 3. Linkar com seu projeto

```bash
supabase link --project-ref smztsayzldjmkzmufqcz
```

### 4. Configurar variáveis de ambiente

Você precisa configurar a chave da API Resend no Supabase:

1. Acesse: <https://app.supabase.com/project/smztsayzldjmkzmufqcz/settings/functions>
2. Vá em "Edge Function Secrets"
3. Adicione as seguintes variáveis:
   - `RESEND_API_KEY`: Sua chave da API do Resend (obtenha em <https://resend.com>)
   - `PUBLIC_SITE_URL`: URL do seu site (ex: <https://nexaescala.com>)

### 5. Deploy da função

```bash
supabase functions deploy send-support-email
```

## 🔑 Obter API Key do Resend

1. Acesse: <https://resend.com>
2. Crie uma conta gratuita
3. Vá em "API Keys"
4. Crie uma nova API Key
5. Copie e adicione no Supabase como `RESEND_API_KEY`

### Configurar domínio no Resend (Opcional)

Para usar seu próprio domínio (ex: <suporte@nexaescala.com>):

1. No Resend, vá em "Domains"
2. Adicione seu domínio
3. Configure os registros DNS conforme instruções
4. Atualize o `from:` na Edge Function

## 🧪 Testar a função

```bash
# Testar localmente
supabase functions serve send-support-email

# Fazer uma requisição de teste
curl -i --location --request POST 'http://localhost:54321/functions/v1/send-support-email' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "to": "test@example.com",
    "subject": "Teste",
    "userName": "João",
    "userMessage": "Mensagem de teste",
    "adminResponse": "Resposta de teste",
    "messageType": "support"
  }'
```

## 📝 Estrutura da Requisição

```typescript
{
  to: string;           // Email do destinatário
  subject: string;      // Assunto do email
  userName: string;     // Nome do usuário
  userMessage: string;  // Mensagem original do usuário
  adminResponse: string; // Resposta do admin
  messageType: string;  // Tipo: suggestion|support|error|compliment|complaint
}
```

## ✅ Verificar Status

Após o deploy, você pode verificar os logs:

```bash
supabase functions logs send-support-email
```

## 🔒 Segurança

A função já está configurada com:

- ✅ CORS headers
- ✅ Autenticação via Bearer token
- ✅ Validação de campos obrigatórios
- ✅ Template HTML profissional

## 📧 Plano Gratuito do Resend

- 3.000 emails/mês grátis
- 100 emails/dia
- Perfeito para começar!

## 🎨 Template do Email

O template inclui:

- ✅ Design responsivo
- ✅ Gradiente emerald/teal do NexaEscala
- ✅ Badges de tipo de mensagem
- ✅ Formatação profissional
- ✅ Dark mode friendly

---

**Após configurar tudo acima, o sistema de email automático estará funcionando! 🎉**
