# Alvo: App mobile (React Native / Expo / nativo)

**Ferramentas, em ordem de preferência:**
1. **Maestro** (`maestro test flow.yaml`) — gera flows YAML por agente, ótimo para RN/Expo
2. **Appium** + emulador Android / simulador iOS
3. **Expo Web** (`npx expo start --web`) + Playwright com viewport mobile — mais barato, mas
   não pega gestos nativos, permissões nem teclado; marque o relatório como "aproximação"
4. Computer use sobre o emulador — último recurso (lento)

## Setup por agente
- Reinstalar/limpar dados do app entre agentes (`adb shell pm clear <pkg>`)
- `device`: `android_low` (720×1600, animações lentas) · `android_mid` · `iphone`
- Rede: `adb emu network speed edge` para low-tech
- `motor` → toques com desvio; `low_vision` → `adb shell settings put system font_scale 1.5`

## Específico de mobile a simular
- **Permissões** (câmera, notificação, localização): personas com N alto negam
- **Interrupções**: 10% dos agentes recebem "app em background" no meio do fluxo
- **Teclado** cobrindo botão, rotação de tela, botão voltar do Android
- Gestos: swipe, long-press, pull-to-refresh

## Ações válidas no trace
`tap, type, swipe, long_press, back, background, deny_permission, allow_permission, abandon, done`
