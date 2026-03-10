

## Plano: Hover card amarelo com informações do lead

### Mudanças em `src/pages/Roleplay.tsx`

1. **Substituir o Card fixo por um HoverCard** (do Radix via `@/components/ui/hover-card`)
   - O trigger será um badge/botão com o nome do lead (ex: "Ricardo Mendes · FitLife Academia") ao lado do badge de metodologia
   - Ao passar o mouse, abre o card com as informações completas do lead

2. **Estilo amarelo** para o card e trigger
   - Trigger: badge com borda/texto amarelo (`border-yellow-500/50 text-yellow-500`)
   - HoverCardContent: fundo escuro com borda amarela, ícones e labels em amarelo

3. **Expandir "Todas as opções acima"**
   - Quando `mainChallenge === "Todas as opções acima"`, exibir a lista completa:
     - Dependência de indicações para fechar novas vendas
     - Falta de previsibilidade
     - Receio de investir mais em Tráfego, sem segurança de resultados
     - Dificuldade em contratar e reter um Time de Marketing qualificado

### Arquivo alterado

| Arquivo | Ação |
|---|---|
| `src/pages/Roleplay.tsx` | Substituir Card fixo por HoverCard amarelo com expansão de desafios |

