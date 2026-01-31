# 🚀 Guia Completo de Deploy - Sistema de Suporte NexaEscala

## 📦 O que foi implementado

Este guia cobre o deploy completo do Sistema de Suporte, incluindo:

1. ✅ Página de Suporte do Usuário (`/suporte`)
2. ✅ Página Admin de Suporte (`/suporte-admin`)
3. ✅ Banco de Dados (Migration Supabase)
4. ✅ Edge Function para envio de emails automáticos

---

## 🗄️ Passo 1: Banco de Dados (Já Aplicado ✅)

A migration já foi aplicada com sucesso! A tabela `support_messages` está criada com:

- RLS habilitado
- Políticas de segurança configuradas
- Triggers automáticos

**Não é necessário ação adicional.**

---

## 📧 Passo 2: Configurar Resend (Serviço de Email)

### 2.1. Criar conta no Resend

1. Acesse: <https://resend.com>
2. Clique em "Sign Up"
3. Crie uma conta gratuita (3.000 emails/mês grátis)

### 2.2. Obter API Key

1. Após login, vá em **"API Keys"** no menu lateral
2. Clique em **"Create API Key"**
3. Dê um nome (ex: "NexaEscala Support")
4. Copie a chave gerada (ela só aparece uma vez!)

### 2.3. Configurar domínio (Opcional - Recomendado)

**Sem domínio personalizado:**

- Emails virão de: `onboarding@resend.dev`
- Funciona perfeitamente para testes

**Com domínio personalizado:**

1. No Resend, vá em **"Domains"**
2. Clique em **"Add Domain"**
3. Digite seu domínio (ex: `nexaescala.com`)
4. Configure os registros DNS conforme instruções:
   - SPF
   - DKIM
   - DMARC
5. Aguarde verificação (pode levar até 48h)
6. Atualize o `from:` na Edge Function para: `suporte@nexaescala.com`

---

## ⚙️ Passo 3: Configurar Variáveis no Supabase

### 3.1. Acessar configurações

1. Acesse: <https://app.supabase.com/project/smztsayzldjmkzmufqcz/settings/functions>
2. Clique em **"Edge Functions"** → **"Secrets"**

### 3.2. Adicionar variáveis

Adicione as seguintes variáveis de ambiente:

| Nome | Valor | Descrição |
|------|-------|-----------|
| `RESEND_API_KEY` | `re_xxxxx...` | API Key do Resend (obtida no passo 2.2) |
| `PUBLIC_SITE_URL` | `https://nexaescala.com` | URL do seu site (ou localhost para testes) |

**Clique em "Save" após adicionar cada variável.**

---

## 🚀 Passo 4: Deploy da Edge Function

### 4.1. Instalar Supabase CLI

**macOS (Homebrew):**

```bash
brew install supabase/tap/supabase
```

**Ou via npm (todas as plataformas):**

```bash
npm install -g supabase
```

**Verificar instalação:**

```bash
supabase --version
```

### 4.2. Login no Supabase

```bash
supabase login
```

Isso abrirá seu navegador para autenticação. Faça login com sua conta Supabase.

### 4.3. Linkar projeto

```bash
cd /Users/italomendescangussu/Projetos/nexaescala
supabase link --project-ref smztsayzldjmkzmufqcz
```

### 4.4. Deploy da função

```bash
supabase functions deploy send-support-email --no-verify-jwt
```

**Nota:** Usamos `--no-verify-jwt` porque a verificação é feita via RLS no Supabase.

### 4.5. Verificar deploy

```bash
supabase functions list
```

Você deve ver a função `send-support-email` listada.

---

## 🧪 Passo 5: Testar o Sistema

### 5.1. Testar formulário de suporte

1. Acesse: `http://localhost:5173/suporte` (ou sua URL de produção)
2. Preencha todos os campos
3. Envie a mensagem
4. Você deve ver: "Mensagem Enviada com Sucesso! 🎉"

### 5.2. Verificar no banco de dados

1. Acesse: <https://app.supabase.com/project/smztsayzldjmkzmufqcz/editor>
2. Abra a tabela `support_messages`
3. Verifique se a mensagem foi salva

### 5.3. Testar painel admin

1. Acesse: `http://localhost:5173/suporte-admin`
2. Faça login com o email de admin: `italomcangussu@icloud.com`
3. Você deve ver a mensagem de teste
4. Clique em "Ver Detalhes"
5. Digite uma resposta
6. Clique em "Enviar Resposta"

### 5.4. Verificar email

1. Verifique a caixa de entrada do email usado no formulário
2. Você deve receber um email com:
   - ✅ Design profissional
   - ✅ Gradiente emerald/teal
   - ✅ Mensagem original
   - ✅ Resposta do admin

---

## 🔍 Passo 6: Monitoramento e Logs

### 6.1. Ver logs da Edge Function

```bash
supabase functions logs send-support-email
```

### 6.2. Ver logs do Resend

1. Acesse: <https://resend.com/logs>
2. Veja todos os emails enviados
3. Status de entrega
4. Possíveis erros

---

## 🎯 Checklist Final

Antes de ir para produção, verifique:

- [ ] Banco de dados criado e funcionando
- [ ] Conta Resend criada
- [ ] API Key do Resend configurada no Supabase
- [ ] Edge Function deployed com sucesso
- [ ] Teste de envio de mensagem funcionando
- [ ] Teste de resposta admin funcionando
- [ ] Email sendo recebido corretamente
- [ ] (Opcional) Domínio personalizado configurado
- [ ] (Opcional) DNS configurado e verificado

---

## 🆘 Troubleshooting

### Problema: Email não está sendo enviado

**Possíveis causas:**

1. API Key do Resend incorreta ou não configurada
2. Edge Function não deployed
3. Variáveis de ambiente não configuradas

**Solução:**

```bash
# Verificar variáveis
supabase secrets list

# Re-deploy da função
supabase functions deploy send-support-email --no-verify-jwt

# Ver logs de erro
supabase functions logs send-support-email
```

### Problema: "Unauthorized" ao acessar /suporte-admin

**Solução:**

- Certifique-se de estar logado com o email: `italomcangussu@icloud.com`
- Para adicionar mais admins, edite a linha 74 do arquivo `SupportAdminPage.tsx`

### Problema: Edge Function retorna erro 500

**Solução:**

```bash
# Ver logs detalhados
supabase functions logs send-support-email --tail

# Testar localmente
supabase functions serve send-support-email
```

---

## 📊 Limites e Custos

### Resend - Plano Gratuito

- ✅ 3.000 emails/mês
- ✅ 100 emails/dia
- ✅ 1 domínio personalizado
- ✅ API completa

### Resend - Plano Pro ($20/mês)

- ✅ 50.000 emails/mês
- ✅ Sem limite diário
- ✅ Domínios ilimitados
- ✅ Suporte prioritário

### Supabase Edge Functions

- ✅ 500.000 invocações/mês (gratuito)
- ✅ 2 GB de largura de banda (gratuito)

**Para a maioria dos casos, o plano gratuito é mais que suficiente!**

---

## 🎉 Próximos Passos Sugeridos

Agora que o sistema básico está funcionando, você pode:

1. **Adicionar notificações push** quando chegar nova mensagem
2. **Criar dashboard de analytics** com gráficos
3. **Implementar sistema de tickets** com IDs únicos
4. **Adicionar chat ao vivo** para suporte em tempo real
5. **Exportar relatórios** em PDF ou Excel

---

## 📞 Suporte

Se tiver dúvidas ou problemas:

- 📧 Email: <italomcangussu@icloud.com>
- 📚 Docs Supabase: <https://supabase.com/docs>
- 📧 Docs Resend: <https://resend.com/docs>

---

**Feito com 💚 para NexaEscala**
