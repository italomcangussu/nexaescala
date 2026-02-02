# Correção: iOS Deployment Target para iOS 15+

## 🎯 Problema

O build do iOS estava apresentando warnings de depreciação no `CapacitorPushNotifications` porque alguns pods estavam compilando com deployment target inferior a iOS 15.0.

## ✅ Solução Implementada

### 1. **Atualização do Podfile**

Adicionamos configurações no `post_install` hook para **forçar** todos os pods a usar iOS 15.0 como deployment target mínimo:

```ruby
post_install do |installer|
  assertDeploymentTarget(installer)
  
  # 1. Apply to the entire Pods project
  installer.pods_project.build_configurations.each do |config|
    config.build_settings['DEBUG_INFORMATION_FORMAT'] = 'dwarf-with-dsym'
    config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.0'  # ← NOVO
  end

  # 2. Apply to each target specifically
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      # ... outras configurações ...
      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.0'  # ← NOVO
    end
  end
end
```

### 2. **O que foi ajustado:**

- ✅ Deployment target global do projeto Pods: iOS 15.0
- ✅ Deployment target de cada pod individualmente: iOS 15.0
- ✅ Compatível com CapacitorPushNotifications e outras dependências

## 📋 Próximos Passos

### Para aplicar as mudanças, você precisa executar

```bash
# Opção 1: Limpar e reinstalar (RECOMENDADO)
cd ios/App
rm -rf Pods Podfile.lock
pod install

# Opção 2: Apenas reinstalar
cd ios/App
pod install
```

**Nota:** Você está enfrentando um erro de permissões temporário (`TMPDIR is not writable`). Isso pode ser resolvido:

1. Reiniciando o terminal
2. Ou executando: `sudo chown -R $(whoami) /var/folders/9p/3lk_f21j0f96l7vky1n76bg40000gn/T`

### Depois de reinstalar os pods

1. **Abra o projeto no Xcode:**

   ```bash
   open ios/App/App.xcworkspace
   ```

2. **Verifique o deployment target:**
   - Selecione o target "com.nexaescala.app"
   - Vá em "Build Settings"
   - Procure por "iOS Deployment Target"
   - Deve estar em **iOS 15.0**

3. **Compile novamente:**
   - O warning `'alert' was deprecated in iOS 14.0` deve desaparecer
   - Todos os pods compilarão com iOS 15.0 como target

## ℹ️ Informações Adicionais

- **Plataforma mínima:** iOS 15.0 (já estava definida)
- **Motivo do warning:** CapacitorPushNotifications usa APIs que foram depreciadas em iOS 14, mas ainda funcionam em iOS 15+
- **Impacto:** Nenhum impacto negativo, apenas melhora a compatibilidade

## 🔍 Verificação

Após aplicar as mudanças, o build deve compilar sem o warning:

```
✅ Build target CapacitorPushNotifications of project Pods with configuration Release
```

---

**Status:** ✅ Podfile atualizado e pronto para uso
**Ação requerida:** Executar `pod install` quando o problema de permissões for resolvido
