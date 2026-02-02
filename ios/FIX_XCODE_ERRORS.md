# Como Corrigir os Erros "double-quoted include" no Xcode

## 🔴 Problema

Erros de compilação no Xcode 15+ com Cordova:

```
double-quoted include "CDVViewController.h" in framework header, 
expected angle-bracketed instead
```

## ✅ Solução: Configurar no Xcode

### Passo a Passo

1. **No Xcode, selecione o projeto `App`** (ícone azul no topo)

2. **Vá para Build Settings**

3. **Procure por:** `QUOTED INCLUDE` ou `CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER`

4. **Para TODOS os targets (App e Pods):**
   - Mude de `Yes` para **`No`**

### Método Rápido

1. **Clique no projeto `App`** (ícone azul)
2. **Build Settings** tab
3. **Filtro**: Digite `quoted` na barra de busca
4. **Localize**: `Quoted Include in Framework Header`
5. **Configure para**: **`No`** (para Debug E Release)

### Alternativa via Terminal (se preferir)

Se o problema de permissões for resolvido, você pode executar:

```bash
cd ios/App
pod install
```

E os pods serão atualizados com a configuração correta do Podfile.

## 🎯 Verificação

Após fazer a mudança:

1. **Product > Clean Build Folder** (⇧⌘K)
2. **Product > Build** (⌘+B)
3. ✅ Os erros devem desaparecer!

## 📝 Notas

- Esta configuração já está no **Podfile** (linha 30 e 35)
- Mas o **projeto App principal** também precisa desta configuração
- É um problema de compatibilidade do Cordova com Xcode 15+

---

**Status:** Aguardando configuração manual no Xcode
