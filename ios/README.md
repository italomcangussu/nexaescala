# 📱 NexaEscala iOS - Guia de Desenvolvimento com SPM

## ✅ Configuração Concluída

O projeto iOS agora usa **Swift Package Manager (SPM)** em vez de CocoaPods!

## 🚀 Comandos de Desenvolvimento

### Comandos Novos (Use Estes)

```bash
# Compilar web app
npm run ios:build

# Copiar assets para iOS (sem pod install)
npm run ios:copy

# Abrir Xcode
npm run ios:open

# Fazer tudo (build + copy)
npm run ios:sync
```

### ⚠️ NÃO Use Mais

```bash
# ❌ Não funciona mais (tenta usar CocoaPods)
npx cap sync ios
npx cap open ios

# ✅ Use em vez disso:
npm run ios:sync
npm run ios:open
```

## 📂 Estrutura do Projeto

```
ios/
├── App/
│   ├── App.xcodeproj          ← ABRA ESTE (não workspace)
│   ├── App/                    ← Código do app
│   └── .spm                    ← Indica uso de SPM
└── capacitor-cordova-ios-plugins/
```

## 🔨 No Xcode

### Abrir Projeto

```bash
npm run ios:open
```

Ou manualmente:

```bash
open ios/App/App.xcodeproj
```

**Importante:** Sempre abra o `.xcodeproj`, NÃO o `.xcworkspace` (não existe mais!)

### Build e Run

- **Build:** ⌘+B
- **Run:** ⌘+R  
- **Clean:** ⇧⌘K
- **Archive:** Product > Archive

## 📦 Gerenciar Pacotes SPM

### Ver Pacotes Instalados

No Xcode:

1. File > Packages > View Package Dependencies
2. Ou expanda "Package Dependencies" no Project Navigator

### Atualizar Pacotes

```
File > Packages > Update to Latest Package Versions
```

### Adicionar Novo Pacote

```
File > Add Package Dependencies...
```

## 🔄 Workflow de Desenvolvimento

### 1. Fazer alterações no código web

```bash
# Editar src/...
```

### 2. Sincronizar com iOS

```bash
npm run ios:sync
```

### 3. Abrir no Xcode

```bash
npm run ios:open
```

### 4. Compilar e rodar

No Xcode: ⌘+R

## 🆘 Troubleshooting

### Erro: "Workspace does not exist"

✅ **Normal!** Com SPM não existe workspace do CocoaPods.

Use:

```bash
npm run ios:open
```

Ou:

```bash
open ios/App/App.xcodeproj
```

### Build falha no Xcode

1. Clean Build Folder: ⇧⌘K
2. Delete DerivedData:

   ```bash
   rm -rf ~/Library/Developer/Xcode/DerivedData
   ```

3. Reabrir Xcode

### Pacote SPM não carrega

1. File > Packages > Reset Package Caches
2. File > Packages > Resolve Package Versions
3. Reiniciar Xcode

### Assets web não atualizam

```bash
npm run ios:sync
```

Depois no Xcode: ⇧⌘K e ⌘+B

## 📊 Comparação: Antes vs Agora

| Tarefa | Antes (CocoaPods) | Agora (SPM) |
|--------|-------------------|-------------|
| Sincronizar | `npx cap sync ios` | `npm run ios:sync` |
| Abrir Xcode | `npx cap open ios` | `npm run ios:open` |
| Arquivo a abrir | `App.xcworkspace` | `App.xcodeproj` |
| Gerenciar deps | `pod install` | Xcode > Packages |
| Atualizar deps | `pod update` | File > Packages > Update |

## 🎯 Comandos Rápidos

### Desenvolvimento Diário

```bash
# 1. Fazer alterações no código
# 2. Sincronizar:
npm run ios:sync

# 3. Abrir Xcode:
npm run ios:open

# 4. No Xcode: ⌘+R
```

### Apenas abrir Xcode

```bash
npm run ios:open
```

### Apenas copiar assets

```bash
npm run ios:copy
```

### Build completo do zero

```bash
npm run build
npm run ios:copy
npm run ios:open
# No Xcode: ⇧⌘K depois ⌘+B
```

## 📚 Links Úteis

- [Capacitor iOS Docs](https://capacitorjs.com/docs/ios)
- [Swift Package Manager Guide](https://developer.apple.com/documentation/xcode/swift-packages)
- [Xcode Shortcuts](https://developer.apple.com/documentation/xcode/keyboard-shortcuts)

## ✅ Checklist de Verificação

- [ ] `ios/App/App.xcodeproj` existe
- [ ] Não existe `Podfile` em `ios/App/`
- [ ] Arquivo `.spm` existe em `ios/App/`
- [ ] `npm run ios:open` abre o Xcode
- [ ] `npm run ios:sync` funciona sem erros
- [ ] Xcode mostra 3 pacotes em "Package Dependencies"
- [ ] Build passa no Xcode (⌘+B)

---

**Status:** ✅ Projeto configurado com SPM  
**Última atualização:** 02/02/2026  
**Versão Capacitor:** 8.0.1
