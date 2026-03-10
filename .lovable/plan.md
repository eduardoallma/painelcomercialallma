

## Plano: Mostrar usuário executor em cada card de sessão

### Análise

A query atual já filtra por `owner_id = user.id`, então todas as sessões pertencem ao usuário logado. Basta exibir o `displayName` (nome do perfil ou email) em cada card de sessão.

### Mudança

**`src/pages/RoleplayHistory.tsx`** — Adicionar o nome/email do usuário em cada card, abaixo da data:

```
olá
10/03/2026 · 6 mensagens · eduardo@allmamarketing.com.br
```

Usar a variável `displayName` que já existe no componente.

### Arquivo alterado

| Arquivo | Ação |
|---|---|
| `src/pages/RoleplayHistory.tsx` | Adicionar `displayName` na linha de metadata de cada card |

