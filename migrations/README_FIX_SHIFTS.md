# Migração: Correção de Tags de Turno e RLS

## Problema

1. **Tags incorretas nos cards**: Cards mostrando "DT" em vez de "M" e "T"
2. **Erro ao atualizar turnos**: "Erro ao atualizar turnos. Tente novamente."

## Causa Raiz

1. Tabela `shifts` não tinha coluna `code`
2. Função `generateShiftsForGroup()` não inseria o código do preset
3. Tabela `shift_presets` não tinha políticas RLS configuradas

## Solução

### 1. Migração SQL

**Arquivo**: `migrations/fix_shifts_code_and_presets_rls.sql`

Esta migração:
- ✅ Adiciona coluna `code` à tabela `shifts`
- ✅ Popula códigos existentes baseado em matching de horários
- ✅ Habilita RLS para `shift_presets`
- ✅ Adiciona políticas de visualização e edição

### 2. Mudanças no Código

**`src/services/api.ts`**:
- ✅ `generateShiftsForGroup()` agora insere `code: preset.code`

**`src/components/ScaleEditorView.tsx`**:
- ✅ Simplificado para usar `s.code || 'N/A'` (sem fallback DT/NT)
- ✅ Adicionado `quantity_needed` ao slot para renderização correta

## Como Aplicar

### Passo 1: Aplicar Migração no Supabase

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Abra o arquivo `migrations/fix_shifts_code_and_presets_rls.sql`
4. Copie todo o conteúdo
5. Cole no SQL Editor
6. Clique em **Run**

### Passo 2: Verificar Migração

Execute estas queries para verificar:

```sql
-- Verificar coluna code foi adicionada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'shifts' AND column_name = 'code';

-- Verificar políticas RLS
SELECT * FROM pg_policies WHERE tablename = 'shift_presets';

-- Verificar shifts têm códigos
SELECT id, code, start_time, end_time 
FROM shifts 
WHERE code IS NOT NULL 
LIMIT 10;
```

**Resultado Esperado**:
- ✅ Coluna `code` existe em `shifts`
- ✅ 2 políticas para `shift_presets`
- ✅ Shifts existentes têm códigos populados

### Passo 3: Testar Aplicação

1. **Logout e Login** para garantir sessão atualizada
2. **Abrir ScaleEditorView** de um serviço existente
3. **Verificar tags**: Devem mostrar "M", "T", etc. (não "DT")
4. **Clicar "Gerenciar Turnos"**
5. **Adicionar novo turno** (ex: "SOB 19-07h")
6. **Salvar Alterações**
7. **Verificar**: Não deve aparecer erro
8. **Verificar**: Cards "SOB" devem aparecer

## Rollback (Se Necessário)

Se algo der errado, execute:

```sql
-- Remover coluna code
ALTER TABLE public.shifts DROP COLUMN IF EXISTS code;

-- Remover policies
DROP POLICY IF EXISTS "View presets of my groups" ON public.shift_presets;
DROP POLICY IF EXISTS "Presets editable by owner" ON public.shift_presets;

-- Desabilitar RLS
ALTER TABLE public.shift_presets DISABLE ROW LEVEL SECURITY;
```

Depois reverta as mudanças no código:
```bash
git checkout src/services/api.ts
git checkout src/components/ScaleEditorView.tsx
```

## Notas Importantes

- ⚠️ **Backup**: Faça backup do banco antes de aplicar
- ⚠️ **Produção**: Teste em ambiente de desenvolvimento primeiro
- ⚠️ **Dados**: A migração popula códigos existentes automaticamente
- ✅ **Segurança**: RLS garante que apenas owners podem modificar presets

## Suporte

Se encontrar problemas:
1. Verifique logs do Supabase
2. Confirme que migração foi aplicada completamente
3. Verifique se usuário é owner do grupo
4. Teste com novo serviço (sem dados antigos)
