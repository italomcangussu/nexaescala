# ✅ Migração para SPM - Próximos Passos

## Status Atual

✅ **Concluído:**

- CocoaPods removido completamente
- Podfile deletado
- Arquivos web copiados para iOS
- Plugins Capacitor atualizados

⚠️ **Pendente:**

- Adicionar pacotes Swift no Xcode

## 🎯 Próximo Passo: Adicionar Pacotes no Xcode

### 1. Abrir o Projeto

```bash
open ios/App/App.xcodeproj
```

**Importante:** Abra o `.xcodeproj` (não workspace, pois não existe mais!)

### 2. Adicionar Capacitor Core

No Xcode:

1. **File > Add Package Dependencies...**

2. **Cole esta URL:**

   ```
   https://github.com/ionic-team/capacitor-swift-pm.git
   ```

3. **Dependency Rule:** `Exact Version` → `8.0.1`

4. **Click "Add Package"**

5. **Selecione os produtos:**
   - ✅ `Capacitor`
   - ✅ `Cordova`

6. **Target:** `com.nexaescala.app`

7. **Click "Add Package"**

### 3. Adicionar Push Notifications

1. **File > Add Package Dependencies...** novamente

2. **Cole esta URL:**

   ```
   https://github.com/ionic-team/capacitor-push-notifications.git
   ```

3. **Dependency Rule:** `Exact Version` → `8.0.0`

4. **Selecione:** `CapacitorPushNotifications`

5. **Target:** `com.nexaescala.app`

### 4. Adicionar Apple Sign In

1. **File > Add Package Dependencies...** mais uma vez

2. **Cole esta URL:**

   ```
   https://github.com/capacitor-community/apple-sign-in.git
   ```

3. **Dependency Rule:** `Up to Next Major Version` → `7.0.0 < 8.0.0`

4. **Selecione:** `CapacitorCommunityAppleSignIn`

5. **Target:** `com.nexaescala.app`

## ⚙️ Configurar Build Settings

Como não temos mais o `post_install` do Podfile, configure manualmente:

1. **Selecione o projeto `App`** (ícone azul)

2. **Build Settings > All**

3. **Configure:**
   - `iOS Deployment Target` → **15.0**
   - `Quoted Include In Framework Header` → **No**

## ✅ Verificar Instalação

1. **No Project Navigator:**
   - Expanda "Package Dependencies"
   - Deve mostrar 3 pacotes

2. **Testar Build:**

   ```
   Product > Clean Build Folder (⇧⌘K)
   Product > Build (⌘+B)
   ```

## 📦 Pacotes a Serem Adicionados

| Pacote | URL | Versão |
|--------|-----|--------|
| Capacitor Core | <https://github.com/ionic-team/capacitor-swift-pm.git> | 8.0.1 |
| Push Notifications | <https://github.com/ionic-team/capacitor-push-notifications.git> | 8.0.0 |
| Apple Sign In | <https://github.com/capacitor-community/apple-sign-in.git> | 7.1.0 |

## 🎉 Após Adicionar Tudo

Você terá:

- ✅ Projeto iOS sem CocoaPods
- ✅ Dependências gerenciadas pelo SPM nativo
- ✅ Sem problemas de compatibilidade com Xcode
- ✅ Builds mais rápidos

---

**Agora:** Abra o Xcode e adicione os 3 pacotes acima! 🚀
