# 🔧 Xcode Cloud - Build Error Fix

## ❌ Problema

**Error:** `Command exited with non-zero exit-code: 65`

**Causa:** O xcodebuild falha porque:

1. O Xcode Cloud não tem os **assets web compilados** (dist/)
2. Os **assets não foram copiados** para `ios/App/App/public`
3. O app **depende** destes arquivos para funcionar

## ✅ Solução: Scripts CI Customizados

Criamos 2 scripts que o Xcode Cloud executará automaticamente:

### 1. `ci_post_clone.sh`

**Quando:** Logo após clonar o repositório  
**O que faz:**

- ✅ Instala dependências npm
- ✅ Compila o web app (`npm run build`)
- ✅ Copia assets para iOS (`npx cap copy ios`)
- ✅ Verifica estrutura do projeto

### 2. `ci_pre_xcodebuild.sh`

**Quando:** Antes de executar o xcodebuild  
**O que faz:**

- ✅ Valida que o build web existe
- ✅ Valida que os assets foram copiados
- ✅ Re-executa se necessário
- ✅ Mostra informações do ambiente

## 📂 Estrutura Criada

```
ios/
└── ci_scripts/
    ├── ci_post_clone.sh         ← Executa após clone
    └── ci_pre_xcodebuild.sh     ← Executa antes do build
```

## 🚀 Próximos Passos

### 1. Fazer Commit dos Scripts

```bash
git add ios/ci_scripts/
git commit -m "Add Xcode Cloud CI scripts for SPM workflow"
git push
```

### 2. Aguardar Próximo Build

O Xcode Cloud detectará automaticamente os scripts em `ios/ci_scripts/` e os executará.

### 3. Verificar Logs

Nos logs do Xcode Cloud, você verá:

```
✅ Post-Clone script not found at ci_scripts/ci_post_clone.sh
```

Mudará para:

```
✅ Running ci_post_clone.sh
🚀 NexaEscala - Xcode Cloud Post-Clone Script
📦 Installing Node.js dependencies...
🏗️ Building web application...
📱 Copying web assets to iOS...
✅ Post-clone script completed successfully!
```

## 📋 O Que os Scripts Fazem

### Workflow Completo

```
1. Clone Repository
   ↓
2. Run ci_post_clone.sh
   - npm ci                    ← Instala deps
   - npm run build             ← Compila web
   - npx cap copy ios          ← Copia assets
   ↓
3. Resolve Swift Packages
   - Download Capacitor SPM
   - Download Push Notifications
   - Download Apple Sign In
   ↓
4. Run ci_pre_xcodebuild.sh
   - Valida build/
   - Valida ios/App/App/public/
   ↓
5. Run xcodebuild
   ✅ SUCESSO!
```

## 🔍 Verificação Local

Antes de fazer commit, você pode testar os scripts localmente:

```bash
# Simular post-clone
cd /Users/italomendescangussu/Projetos/nexaescala
./ios/ci_scripts/ci_post_clone.sh

# Simular pre-xcodebuild
./ios/ci_scripts/ci_pre_xcodebuild.sh
```

## ⚠️ Requisitos do Xcode Cloud

### Environment Variables (se necessário)

No Xcode Cloud > Workflow > Environment:

```
NODE_VERSION=20
NPM_VERSION=latest
```

### Configurações Importantes

- ✅ **Project Path:** `ios/App/App.xcodeproj` (já correto!)
- ✅ **Scheme:** `com.nexaescala.app`
- ✅ **Platform:** iOS
- ✅ **Branch:** main (ou sua branch de produção)

## 🎯 Resultado Esperado

Após o commit e push:

**Before:**

```
❌ Run xcodebuild archive - FAILED (exit code 65)
```

**After:**

```
✅ Post-clone script completed
✅ Resolve package dependencies (53.1s)
✅ Pre-xcodebuild script completed  
✅ Run xcodebuild archive - SUCCESS
✅ Archive created successfully
```

## 📚 Documentação Apple

- [Xcode Cloud Build Scripts](https://developer.apple.com/documentation/xcode/writing-custom-build-scripts)
- [CI Scripts Location](https://developer.apple.com/documentation/xcode/making-dependencies-available-to-xcode-cloud)

## 🆘 Troubleshooting

### Se ainda falhar

1. **Verificar logs do post-clone**
   - Procure por erros no npm install ou build

2. **Verificar permissões dos scripts**

   ```bash
   chmod +x ios/ci_scripts/*.sh
   git add -u
   git commit -m "Fix script permissions"
   ```

3. **Adicionar debug**
   Edite os scripts e adicione mais `echo` para debug

4. **Verificar node_modules**
   O Xcode Cloud pode precisar de todas as dependências:

   ```bash
   # No ci_post_clone.sh, mude de:
   npm ci --prefer-offline --no-audit
   
   # Para:
   npm install --legacy-peer-deps
   ```

---

**Próxima Ação:** Fazer commit e push dos scripts! 🚀

```bash
git add ios/ci_scripts/
git commit -m "feat: Add Xcode Cloud CI scripts for SPM build"
git push origin main
```
