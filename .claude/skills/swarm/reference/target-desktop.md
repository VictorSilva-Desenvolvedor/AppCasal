# Alvo: Software desktop (.NET/WPF/WinForms, Electron, etc.)

**Ferramentas, em ordem de preferência:**
1. **FlaUI** (C#, UI Automation) ou **pywinauto** (`backend="uia"`) — lê a árvore de controles, barato
2. **WinAppDriver** / Appium Windows driver
3. **Electron** → Playwright (`_electron.launch`)
4. Computer use (screenshots) — para apps sem árvore de acessibilidade

## Setup por agente
- Resetar estado: apagar `%APPDATA%\<App>` / config de teste antes de cada agente
- Resolução: `1366x768` (notebook comum) e `1920x1080`; low_vision → escala 150% DPI
- `low_tech`: não conhece atalhos, usa só menu/mouse; `tech_literacy` alto usa Ctrl+atalhos

## Específico de desktop a simular
- Diálogos modais, "Salvar?" ao fechar, diálogo de arquivo (caminhos com acento/espaço)
- Tray icon / janela minimizada, múltiplos monitores
- Instalação/primeira execução (SmartScreen, UAC) quando a tarefa incluir onboarding
- Arquivos de entrada ruins (grande, vazio, formato errado) para personas C baixo

## Ações válidas no trace
`click, double_click, type, hotkey, menu, open_file, close_window, abandon, done`
