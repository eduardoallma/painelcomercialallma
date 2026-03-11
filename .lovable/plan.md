

## Plano: Avaliar sessões do histórico + scroll na conversa

### Problemas identificados

1. **Sem botão de avaliar no histórico**: Sessões salvas sem nota não têm como ser avaliadas depois.
2. **Conversa do histórico sem scroll**: Quando uma sessão selecionada tem muitas mensagens, não há como rolar — o conteúdo fica cortado.

### Mudanças

**1. `src/components/roleplay/SessionHistory.tsx`**

- Adicionar prop `onEvaluate: (session: HistorySession) => void` para disparar avaliação de uma sessão
- No card da lista: adicionar botão "Avaliar" (ícone Star) ao lado do lixo, visível quando `s.score === null`
- Na visualização da sessão selecionada: envolver o conteúdo (avaliação + mensagens) em um container com `overflow-y-auto` e altura flexível para permitir scroll completo
- Adicionar botão "Avaliar" no topo da sessão selecionada quando não houver nota

**2. `src/pages/Roleplay.tsx`**

- Criar função `evaluateHistorySession(session)` que chama o edge function `evaluate-roleplay` com o `session_id` e depois recarrega o histórico
- Passar essa função como prop `onEvaluate` para o `SessionHistory`
- Ajustar o container do histórico para ter altura limitada com scroll

### Arquivos alterados

| Arquivo | Ação |
|---|---|
| `src/components/roleplay/SessionHistory.tsx` | Botão avaliar + scroll na conversa |
| `src/pages/Roleplay.tsx` | Função evaluateHistorySession + passar prop |

