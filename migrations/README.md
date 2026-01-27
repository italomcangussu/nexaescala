# Migração: Cores Personalizadas de Serviço

## Instruções para Aplicar a Migração

### 1. Acessar o Supabase Dashboard

1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. No menu lateral, clique em **SQL Editor**

### 2. Executar a Migração

1. Clique em **New Query**
2. Copie todo o conteúdo do arquivo `migrations/add_personal_color.sql`
3. Cole no editor SQL
4. Clique em **Run** (ou pressione Ctrl/Cmd + Enter)

### 3. Verificar a Migração

Execute a seguinte query para verificar se as colunas foram adicionadas:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'group_members'
AND column_name IN ('personal_color', 'has_seen_color_banner');
```

Você deve ver:
- `personal_color` | text | YES
- `has_seen_color_banner` | boolean | YES

### 4. Testar a Funcionalidade

Após aplicar a migração:

1. **Faça logout e login novamente** para garantir que os dados sejam recarregados
2. Abra um serviço que você já é membro
3. Você deve ver o banner "Defina a cor do seu novo serviço"
4. Selecione uma cor e clique em "Salvar"
5. Vá para a aba "Ajustes" e verifique se pode alterar a cor

## Comportamento Esperado

### Novos Membros
- Veem a cor padrão (verde esmeralda #10b981)
- Na primeira vez que acessam um serviço, veem o banner de seleção de cor
- Podem personalizar a cor a qualquer momento nas configurações

### Membros Existentes
- Após a migração, todos os serviços aparecerão com a cor padrão
- Na próxima vez que acessarem um serviço, verão o banner
- Podem personalizar as cores nas configurações

### Administradores
- A cor que escolheram ao criar o serviço fica armazenada em `groups.color`
- Mas eles também veem a cor padrão até personalizarem
- Podem ter cores diferentes para seus próprios serviços

## Rollback (Se Necessário)

Se precisar reverter a migração:

```sql
ALTER TABLE public.group_members 
DROP COLUMN IF EXISTS personal_color;

ALTER TABLE public.group_members 
DROP COLUMN IF EXISTS has_seen_color_banner;
```

## Notas Importantes

- ✅ A migração é **não-destrutiva** (apenas adiciona colunas)
- ✅ Não afeta dados existentes
- ✅ Usuários existentes continuarão funcionando normalmente
- ✅ A cor padrão garante que nada quebre visualmente
