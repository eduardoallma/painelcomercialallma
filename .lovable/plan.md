

## Bug: Leads trocados no meio da qualificação

### Causa raiz

Na função `getRandomProfile` (linha 273-278 de `roleplay-chat/index.ts`):

```javascript
function getRandomProfile(messages: any[]): typeof CLIENT_PROFILES[0] {
  const idx = messages.length <= 1
    ? Math.floor(Math.random() * CLIENT_PROFILES.length)  // RANDOM na 1ª msg
    : Math.abs(JSON.stringify(messages[0]).length) % CLIENT_PROFILES.length; // HASH nas demais
  return CLIENT_PROFILES[idx];
}
```

- **1ª mensagem** (`messages.length === 1`): escolhe um perfil **aleatório** (ex: índice 3 → Patrícia)
- **2ª mensagem em diante** (`messages.length === 3`): usa um **hash determinístico** baseado no tamanho do JSON da primeira mensagem, que resulta em um índice **diferente** (ex: índice 7 → Ana Carolina)

Resultado: o lead muda a cada troca de mensagem.

### Correção

Usar o **mesmo método determinístico** em todas as chamadas. Gerar um hash simples a partir do **conteúdo da primeira mensagem do usuário**, garantindo consistência:

```javascript
function getRandomProfile(messages: any[]): typeof CLIENT_PROFILES[0] {
  const firstUserMsg = messages.find(m => m.role === "user")?.content || "";
  let hash = 0;
  for (let i = 0; i < firstUserMsg.length; i++) {
    hash = ((hash << 5) - hash + firstUserMsg.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % CLIENT_PROFILES.length;
  return CLIENT_PROFILES[idx];
}
```

Isso garante que, enquanto a primeira mensagem do usuário for a mesma (e ela sempre é, pois está no array), o perfil será sempre o mesmo.

### Arquivo alterado

| Arquivo | Ação |
|---|---|
| `supabase/functions/roleplay-chat/index.ts` | Corrigir `getRandomProfile` para usar hash determinístico |

