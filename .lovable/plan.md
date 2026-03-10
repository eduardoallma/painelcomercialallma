

## Plano: Mesclar histórico no Roleplay + excluir sessões

### O que será feito

1. Mover o histórico de sessões para dentro da página Roleplay, exibido abaixo do chat
2. Adicionar botão de excluir sessão (com confirmação) em cada card do histórico
3. Remover a rota e página separada de RoleplayHistory
4. Remover o link "Histórico" da sidebar

### Mudanças

**1. `src/pages/Roleplay.tsx`**
- Adicionar state para `sessions`, `loading`, `selected` (sessão do histórico sendo visualizada)
- Ao carregar, buscar sessões do banco (mesma query do RoleplayHistory)
- Após o bloco de chat/input, renderizar seção "Histórico" com a lista de sessões em cards
- Cada card terá um botão de lixeira com `AlertDialog` de confirmação para excluir
- Excluir chama `supabase.from("roleplay_sessions").delete().eq("id", id)` e remove do state
- Clicar no card abre a conversa inline (substituir o chat atual pelo conteúdo da sessão, com botão voltar)
- Recarregar lista de sessões ao salvar/avaliar uma sessão nova

**2. `src/components/layout/SidebarNav.tsx`**
- Remover o link `{ to: "/roleplay/history", label: "Histórico" }`

**3. `src/App.tsx`**
- Remover a rota `/roleplay/history` e o import de `RoleplayHistory`

**4. `src/pages/RoleplayHistory.tsx`**
- Pode ser removido (não mais utilizado)

### Arquivos alterados

| Arquivo | Ação |
|---|---|
| `src/pages/Roleplay.tsx` | Integrar histórico + exclusão abaixo do chat |
| `src/components/layout/SidebarNav.tsx` | Remover link "Histórico" |
| `src/App.tsx` | Remover rota /roleplay/history |
| `src/pages/RoleplayHistory.tsx` | Deletar |

