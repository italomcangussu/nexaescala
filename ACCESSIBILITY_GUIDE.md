# 🎯 Guia de Acessibilidade - NexaEscala

## ✅ Implementações Realizadas

Este documento descreve todas as melhorias de acessibilidade implementadas no NexaEscala para garantir conformidade com as diretrizes da Apple App Store, WCAG 2.1 (AA/AAA) e melhores práticas de inclusão digital.

---

## 📋 **Índice**

1. [Hook de Acessibilidade](#1-hook-de-acessibilidade)
2. [CSS Global de Acessibilidade](#2-css-global-de-acessibilidade)
3. [Componentes de Acessibilidade](#3-componentes-de-acessibilidade)
4. [Melhorias de Navegação](#4-melhorias-de-navegação)
5. [Checklist de Conformidade](#5-checklist-de-conformidade)
6. [Testes Recomendados](#6-testes-recomendados)

---

## 1. Hook de Acessibilidade

**Arquivo:** `/src/hooks/useAccessibility.ts`

### Funcionalidades

#### `useAccessibility()`

Hook React que detecta preferências de acessibilidade do sistema em tempo real:

- ✅ **Redução de Movimento** (`prefers-reduced-motion`)
- ✅ **Alto Contraste** (`prefers-contrast: high`)
- ✅ **Modo Escuro** (`prefers-color-scheme: dark`)
- ✅ **Tamanho de Fonte** (detecção de preferência)

**Uso:**

```tsx
import { useAccessibility } from '../hooks/useAccessibility';

const MyComponent = () => {
  const { prefersReducedMotion, prefersHighContrast } = useAccessibility();

  return (
    <div className={prefersReducedMotion ? 'no-animations' : 'with-animations'}>
      {/* seu conteúdo */}
    </div>
  );
};
```

#### `announceToScreenReader()`

Função para anunciar mensagens a leitores de tela (VoiceOver, TalkBack):

**Uso:**

```tsx
import { announceToScreenReader } from '../hooks/useAccessibility';

const handleSave = () => {
  // ... lógica de salvamento
  announceToScreenReader('Plantão salvo com sucesso', 'polite');
};
```

#### `useFocusManagement()`

Hook para gerenciar foco em modais e componentes complexos:

**Uso:**

```tsx
import { useFocusManagement } from '../hooks/useAccessibility';

const Modal = () => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { trapFocus, focusFirst } = useFocusManagement();

  useEffect(() => {
    focusFirst(modalRef); // Foca no primeiro elemento ao abrir
    return trapFocus(modalRef); // Mantém foco dentro do modal
  }, []);

  return <div ref={modalRef}>{/* conteúdo */}</div>;
};
```

---

## 2. CSS Global de Acessibilidade

**Arquivo:** `/src/index.css`

### Implementações

#### **2.1. Screen Reader Only (`.sr-only`)**

Classe para ocultar elementos visualmente, mas mantê-los acessíveis a leitores de tela:

```html
<label class="sr-only" for="search">Buscar plantões</label>
<input id="search" placeholder="Buscar..." />
```

#### **2.2. Focus Visible Aprimorado**

Outline de 3px em emerald quando elemento está em foco (teclado):

- Aplicado automaticamente a todos os elementos interativos
- Suporta `:focus-visible` (não exibe outline quando clicado com mouse)

#### **2.3. Suporte a Redução de Movimento**

Desabilita animações automaticamente para usuários que preferem:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

#### **2.4. Modo de Alto Contraste**

Ajustes automáticos quando usuário ativa alto contraste:

- Bordas mais escuras
- Texto com sublinhado em links
- Cores de fundo mais contrastantes

#### **2.5. Áreas Tocáveis Mínimas (44x44pt)**

Todos os botões e links têm tamanho mínimo de 44x44 pixels (padrão Apple):

```css
button, a, [role="button"] {
  min-width: 44px;
  min-height: 44px;
}
```

#### **2.6. Skip to Main Content**

Link oculto que aparece ao pressionar Tab, permitindo pular navegação:

```css
.skip-to-main {
  position: fixed;
  top: -100px; /* Oculto por padrão */
}

.skip-to-main:focus {
  top: 16px; /* Visível quando focado */
}
```

---

## 3. Componentes de Acessibilidade

### `<SkipToMain />`

**Arquivo:** `/src/components/SkipToMain.tsx`

Componente que adiciona link "Pular para o conteúdo principal" no topo da página.

**Uso:**

```tsx
<SkipToMain />
```

**Como funciona:**

1. Invisível até que usuário pressione `Tab`
2. Aparece no topo da página quando focado
3. Ao clicar, leva direto ao `#main-content`
4. Essencial para navegação por teclado

---

## 4. Melhorias de Navegação

### Layout Principal (`/src/components/Layout.tsx`)

**Adições:**

- ✅ Componente `<SkipToMain />` no topo
- ✅ `<header role="banner">` com `aria-label`
- ✅ `<main id="main-content" role="main" tabIndex={-1}>` para foco programático
- ✅ `<nav role="navigation" aria-label="Navegação principal">`

**Benefícios:**

- Leitores de tela anunciam corretamente cada seção
- Navegação por teclado mais eficiente
- Estrutura semântica clara para tecnologias assistivas

---

## 5. Checklist de Conformidade

### ✅ WCAG 2.1 Nível AA

- [x] **1.1.1** Conteúdo não textual tem alternativa (alt text)
- [x] **1.3.1** Estrutura semântica HTML correta
- [x] **1.4.3** Contraste mínimo de 4.5:1 para texto
- [x] **2.1.1** Funcionalidade via teclado
- [x] **2.1.2** Sem armadilhas de teclado (focus trap em modais)
- [x] **2.4.1** Mecanismo para pular blocos (skip link)
- [x] **2.4.3** Ordem de foco lógica
- [x] **2.4.7** Indicador de foco visível
- [x] **2.5.5** Tamanho de alvo mínimo (44x44pt)
- [x] **3.2.4** Identificação consistente de componentes
- [x] **4.1.2** Nome, função e valor de elementos UI (ARIA)

### ✅ Apple App Store Requirements

- [x] **VoiceOver Support:** ARIA labels e roles em todos os elementos interativos
- [x] **Dynamic Type:** Layout suporta fontes maiores (até 200%)
- [x] **Reduced Motion:** Animações removidas quando preferência ativa
- [x] **Minimum Touch Targets:** 44x44pt em todos os botões
- [x] **Keyboard Navigation:** Navegação completa via teclado/switch control
- [x] **Focus Management:** Foco gerenciado corretamente em modais

---

## 6. Testes Recomendados

### **Testes Manuais:**

#### **6.1. Navegação por Teclado**

1. Abra o app e pressione `Tab`
2. Verifique se "Pular para o conteúdo principal" aparece
3. Continue pressionando `Tab` - todos os elementos interativos devem ser alcançáveis
4. Verifique se o outline `verde emerald` aparece claramente em cada elemento focado
5. Pressione `Enter` ou `Space` em botões para ativá-los

#### **6.2. VoiceOver (iOS/macOS)**

1. Ative o VoiceOver:
   - **iOS:** Configurações → Acessibilidade → VoiceOver
   - **macOS:** System Preferences → Accessibility → VoiceOver (Cmd+F5)
2. Navegue pelo app e verifique se:
   - Todos os botões têm labels descritivos
   - Ações são anunciadas corretamente
   - Imagens têm descrições (alt text)
   - Mudanças de estado são anunciadas

#### **6.3. Redução de Movimento**

1. Ative a preferência:
   - **iOS:** Configurações → Acessibilidade → Movimento → Reduzir Movimento
   - **macOS:** System Preferences → Accessibility → Display → Reduce motion
2. Recarregue o app
3. Verifique se animações foram removidas/reduzidas

#### **6.4. Alto Contraste**

1. Ative alto contraste:
   - **iOS:** Configurações → Acessibilidade → Tela e Tamanho do Texto → Aumentar Contraste
   - **macOS:** System Preferences → Accessibility → Display → Increase contrast
2. Verifique se texto e elementos permanece legíveis
3. Verifique se cores têm contraste adequado

#### **6.5. Dynamic Type (Tamanho de Fonte)**

1. Ajuste o tamanho da fonte:
   - **iOS:** Configurações → Acessibilidade → Tela e Tamanho do Texto → Texto Maior
2. Aumente o texto para 150%-200%
3. Verifique se layout não quebra
4. Verifique se todo texto pode crescer

### **Testes Automatizados:**

#### **6.6. Lighthouse Accessibility Audit**

```bash
# No Chrome DevTools
1. Abra DevTools (F12)
2. Vá para aba "Lighthouse"
3. Selecione "Accessibility"
4. Clique "Generate report"
5. Meta: Score > 95
```

#### **6.7. axe DevTools**

```bash
# Instale a extensão axe DevTools
# Execute a análise automática
# Corrija quaisquer issues encontrados
```

---

## 📊 **Resultados Esperados**

### Lighthouse Accessibility Score

**Meta:** ≥ 95/100

### WCAG Compliance

**Meta:** WCAG 2.1 Level AA (100%)

### Apple Accessibility Checklist

**Meta:** Todos os itens marcados ✅

---

## 🚀 **Implementações Futuras (Opcionais)**

### Alta Prioridade

- [ ] Adicionar ARIA live regions para atualizações dinâmicas de escalas
- [ ] Implementar atalhos de teclado customizados (ex: `Ctrl+N` para novo plantão)
- [ ] Criar página de Configurações de Acessibilidade no app

### Média Prioridade

- [ ] Suporte a gestos alternativos (para usuários com limitações motoras)
- [ ] Feedback háptico para ações importantes
- [ ] Modo de leitura simplificada

### Baixa Prioridade

- [ ] Closed captions em tutoriais em vídeo (se houver)
- [ ] Tradução automática de conteúdo (internacionalização)

---

## 📝 **Notas Importantes**

1. **Sempre teste com usuários reais:** Acessibilidade não é apenas conformidade técnica, é sobre experiência real de pessoas com diferentes habilidades.

2. **Mantenha a acessibilidade em novos recursos:** Ao adicionar novas funcionalidades, sempre considere:
   - Labels ARIA adequados
   - Navegação por teclado
   - Contraste de cores
   - Tamanhos de toque
   - Anúncios a leitores de tela

3. **Documentação contínua:** Atualize este documento sempre que implementar novas funcionalidades de acessibilidade.

---

## 📧 **Contato**

Para dúvidas ou sugestões sobre acessibilidade:

- **E-mail:** <acessibilidade@nexaescala.com>
- **Suporte:** <suporte@nexaescala.com>

---

**NexaEscala** - Comprometido com inclusão digital e acessibilidade para todos. 🌟
