# 🚀 Migração: CocoaPods → Swift Package Manager (SPM)

## Por que migrar?

- ✅ **Nativo do Xcode** - sem problemas de compatibilidade
- ✅ **Mais rápido** - integração direta
- ✅ **Sem Ruby** - não depende de gems
- ✅ **Melhor suporte** - Apple mantém oficialmente
- ✅ **Capacitor 8+** tem suporte completo a SPM

## 📋 Passo a Passo para Migração

### 1️⃣ Remover CocoaPods

```bash
# No diretório do projeto
cd ios/App

# Desintegrar CocoaPods
pod deintegrate

# Remover arquivos do CocoaPods
rm -rf Pods
rm Podfile
rm Podfile.lock

# Remover workspace (será recriado)
rm -rf App.xcworkspace
```

### 2️⃣ Configurar Capacitor para usar SPM

Edite `capacitor.config.ts` na **raiz do projeto**:

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nexaescala.app',
  appName: 'NexaEscala',
  webDir: 'dist',
  ios: {
    // Força SPM em vez de CocoaPods
    packageManager: 'SPM'
  }
};

export default config;
```

### 3️⃣ Sincronizar com SPM

```bash
# Voltar para raiz do projeto
cd ../..

# Sincronizar (vai usar SPM automaticamente)
npx cap sync ios
```

### 4️⃣ Abrir no Xcode e Adicionar Pacotes

```bash
# Abrir o projeto (não workspace, pois não existe mais)
npx cap open ios
```

**No Xcode:**

1. **File > Add Package Dependencies...**

2. **Adicionar os pacotes Capacitor:**

   **Capacitor Core:**

   ```
   https://github.com/ionic-team/capacitor-swift-pm.git
   ```

   - Versão: `8.0.0` (Exact)
   - Adicione: `Capacitor`, `Cordova`

   **Push Notifications:**

   ```
   https://github.com/ionic-team/capacitor-push-notifications.git
   ```

   - Versão: `8.0.0`
   - Adicione: `CapacitorPushNotifications`

   **Apple Sign In:**

   ```
   https://github.com/capacitor-community/apple-sign-in.git
   ```

   - Versão: `7.1.0`
   - Adicione: `CapacitorCommunityAppleSignIn`

3. **Para cada pacote:**
   - Cole a URL
   - Clique "Add Package"
   - Selecione o target `com.nexaescala.app`
   - Clique "Add Package"

### 5️⃣ Configurar Build Settings (Manual)

Como não temos mais o `post_install` do Podfile, configure manualmente no Xcode:

**Build Settings > All > Combined:**

1. **iOS Deployment Target:** `15.0`
2. **Quoted Include In Framework Header:** `No`
3. **Strip Installed Product:** `No`
4. **Copy Phase Strip:** `No`
5. **Enable Bitcode:** `No`

### 6️⃣ Testar a Compilação

No Xcode:

```
Product > Clean Build Folder (⇧⌘K)
Product > Build (⌘+B)
```

## ✅ Verificação Pós-Migração

### Checklist

- [ ] Removi todos os arquivos do CocoaPods
- [ ] Configurei `capacitor.config.ts` com SPM
- [ ] Rodei `npx cap sync ios`
- [ ] Adicionei pacotes Swift no Xcode
- [ ] Configurei Build Settings manualmente
- [ ] Build passou sem erros
- [ ] App roda no simulador/device

### Estrutura Final

```
ios/
├── App/
│   ├── App.xcodeproj          ← Projeto Xcode (não workspace)
│   ├── App/                    ← Código do app
│   └── App.xcodeproj/
│       └── project.xcworkspace/
│           └── xcshareddata/
│               └── swiftpm/     ← Pacotes SPM
└── capacitor-cordova-ios-plugins/
```

## 🎯 Vantagens Imediatas

- ✅ Sem erro "object version 70"
- ✅ Sem dependência de Ruby/CocoaPods
- ✅ Atualizações mais fáceis
- ✅ Compilação mais rápida
- ✅ Integração nativa com Xcode

## ⚠️ Observações

1. **Primeira vez pode demorar:** SPM precisa baixar e compilar os pacotes
2. **Sem `Podfile`:** Todas dependências são gerenciadas pelo Xcode
3. **Workspace:** Xcode cria automaticamente quando há SPM

## 🆘 Troubleshooting

**Erro ao adicionar pacote?**

- Verifique se a URL do repositório está correta
- Tente com "Up to Next Major Version" em vez de "Exact"

**Build falha?**

- Clean Build Folder (⇧⌘K)
- Deletar DerivedData: `rm -rf ~/Library/Developer/Xcode/DerivedData`
- Reabrir Xcode

**Capacitor não encontra plugins?**

- Rode `npx cap sync ios` novamente
- Verifique se os pacotes estão em "Package Dependencies" no projeto

---

**Próximo passo:** Execute os passos na ordem para migrar! 🚀
