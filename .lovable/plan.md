

## Plano: Substituir o código do roleplay-chat

Substituir o conteúdo completo de `supabase/functions/roleplay-chat/index.ts` pelo código fornecido pelo usuário.

### Principais diferenças vs. versão atual

- **Personalidade** adicionada a cada perfil (ex: "Direto, impaciente", "Cautelosa, analítica")
- **Budget** como objeto com `range` e `willingness`
- **Authority** como campo textual separado
- **System prompt reescrito**: regras globais mais rígidas (respostas curtas, sem narração de cena, revelação progressiva de informação)
- **Instruções de metodologia** mais detalhadas com comportamento específico por eixo
- **Playbooks** com instrução de não citar na conversa

### Arquivo alterado

| Arquivo | Ação |
|---|---|
| `supabase/functions/roleplay-chat/index.ts` | Substituição completa pelo código fornecido |

