

## Calculadora Comercial

### Criar `src/pages/Calculator.tsx`

Página com duas colunas responsivas (empilham em mobile):

**Coluna Esquerda — "Sua Simulação"**
- Inputs numéricos livres para cada etapa: Leads, MQLs, R1 Agendados, R1 Realizados, R2 Agendadas, R2 Realizadas, Contratos, Vendas, Ticket Médio (R$)
- O usuário digita qualquer valor que quiser

**Coluna Direita — "Referência Allma"**
- Valores calculados automaticamente a partir do Leads digitado na coluna esquerda, usando as taxas padrão:
  - Leads → MQLs: 40%
  - MQLs → R1 Agendados: 50%
  - R1 Agendados → R1 Realizados: 80%
  - R1 Realizados → R2 Agendadas: 75%
  - R2 Agendadas → R2 Realizadas: 95%
  - R2 Realizadas = Contratos (1:1)
  - Contratos → Vendas: 90%
  - Ticket Médio: R$ 3.000
- Somente leitura, estilo sutil

**Output — 3 cards destacados no final**

| Métrica | Sua Simulação | Referência |
|---|---|---|
| Clientes | = Vendas (input) | = Vendas (calculado) |
| MRR | Vendas × Ticket | Vendas × 3000 |
| Receita LTV | MRR × 6 | MRR × 6 |

### Atualizar `src/App.tsx`

Substituir `<Placeholder page="calculator" />` por `<Calculator />`.

### Sem alterações no banco de dados
100% client-side.

