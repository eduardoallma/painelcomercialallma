

## Plano: Título automático com nome do prospect, empresa, metodologia e nota

### Problema
O perfil do prospect é escolhido aleatoriamente no edge function (`getRandomProfile`), mas o cliente nunca recebe essa informação. Precisamos que o edge function informe qual perfil foi selecionado para que o título seja gerado corretamente.

### Abordagem

**1. Edge function (`roleplay-chat/index.ts`)**
- Extrair `buildSystemPrompt` para também retornar o perfil selecionado (refatorar `getRandomProfile` + `buildSystemPrompt` para retornar `{ systemPrompt, profile }`)
- Antes de iniciar o stream, enviar um evento SSE especial com metadados do perfil:
  ```
  data: {"meta":{"prospect_name":"Ricardo Mendes","prospect_company":"FitLife Academia"}}
  ```
- Depois continuar o stream normalmente com os chunks de conteúdo

**2. Cliente (`Roleplay.tsx`)**
- Adicionar estado `prospectInfo` (`{ name, company }`)
- No parser de SSE, detectar o evento `meta` (antes dos chunks de conteúdo) e extrair `prospect_name` e `prospect_company`
- Alterar `saveSession` para gerar o título no formato:
  ```
  Ricardo Mendes (FitLife Academia) · BANT · —
  ```
- Quando a avaliação (`evaluateSession`) retornar a nota, atualizar o título da sessão no banco com a nota real (ex: `· 8/10`)
- Resetar `prospectInfo` em `startNewSession`

**3. Histórico (`RoleplayHistory.tsx`)**
- Nenhuma mudança necessária — o título já vem do banco e será exibido automaticamente no formato novo

### Arquivos alterados

| Arquivo | Ação |
|---|---|
| `supabase/functions/roleplay-chat/index.ts` | Refatorar para retornar perfil; enviar evento `meta` no stream |
| `src/pages/Roleplay.tsx` | Capturar meta do stream, gerar título formatado, atualizar título após avaliação |

