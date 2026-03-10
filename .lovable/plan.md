

## Plano: Renomear Calculadora e criar página de Calculadora de Comissão

### Mudanças

**1. Sidebar (`SidebarNav.tsx`)**
- Renomear "Calculadora" para "Calculadora de Funil"
- Adicionar novo link "Calculadora de Comissão" apontando para `/commission-calculator`

**2. Topbar da Calculadora existente (`Calculator.tsx`)**
- Atualizar título para "Calculadora de Funil"

**3. Nova página (`src/pages/CommissionCalculator.tsx`)**
- Página placeholder com Topbar e mensagem "Em breve" — aguardando a lógica que será fornecida em seguida

**4. Rotas (`App.tsx`)**
- Importar `CommissionCalculator` e adicionar rota `/commission-calculator`

### Arquivos

| Arquivo | Ação |
|---|---|
| `src/components/layout/SidebarNav.tsx` | Renomear label + novo link |
| `src/pages/Calculator.tsx` | Atualizar título no Topbar |
| `src/pages/CommissionCalculator.tsx` | Criar página placeholder |
| `src/App.tsx` | Adicionar rota |

