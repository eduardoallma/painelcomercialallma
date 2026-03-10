## Playbooks + Roleplay com IA

### Visão Geral

Criar um sistema onde o usuário faz upload de playbooks (PDF/DOCX/TXT), que ficam armazenados no backend. A página de Roleplay terá um chat com IA (Claude AI) que usa o conteúdo dos playbooks como contexto para simular clientes e avaliar vendedores.

### 1. Banco de Dados

Criar tabela `playbooks` para armazenar metadados e conteúdo extraído:

```sql
CREATE TABLE public.playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  extracted_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.playbooks ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados podem ver e gerenciar seus próprios playbooks
CREATE POLICY "Users manage own playbooks"
  ON public.playbooks FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());
```

### 2. Storage Bucket

Criar bucket `playbooks` para armazenar os arquivos originais:

```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('playbooks', 'playbooks', false);

-- Política: usuários autenticados podem fazer upload/leitura dos seus próprios arquivos
CREATE POLICY "Users manage own playbook files"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'playbooks' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'playbooks' AND (storage.foldername(name))[1] = auth.uid()::text);
```

### 3. Edge Function: `extract-playbook`

Recebe o file_path do storage, faz download, extrai texto (para PDF usa parsing básico, para TXT/MD lê direto) e salva o `extracted_text` na tabela `playbooks`.

### 4. Edge Function: `roleplay-chat`

- Recebe `messages[]` e `playbook_ids[]`
- Busca o `extracted_text` dos playbooks selecionados
- Monta system prompt com o conteúdo dos playbooks como contexto
- Chama Lovable AI (Gemini 3 Flash) com streaming
- Retorna SSE stream para o frontend

### 5. Página `/playbooks` (nova)

- Lista de playbooks do usuário com título e data
- Botão "Enviar Playbook" abre dialog com input de título + file upload (PDF, DOCX, TXT)
- Após upload, chama `extract-playbook` para processar o texto
- Botão de excluir playbook

### 6. Página `/roleplay` (nova)

- Seleção de playbooks a usar como contexto (multi-select)
- Interface de chat com streaming token-by-token
- Mensagens renderizadas com markdown
- Botão para limpar conversa

### 7. Sidebar

- "Simulação" já está como "Roleplay" (feito anteriormente)
- Placeholder de ambas as rotas será substituído pelos novos componentes

### 8. Roteamento

Atualizar `App.tsx` para usar os novos componentes `Playbooks` e `Roleplay` em vez de `Placeholder`.

### Arquivos a criar/editar


| Arquivo                                        | Ação                                 |
| ---------------------------------------------- | ------------------------------------ |
| Migration SQL                                  | Criar tabela + bucket + RLS          |
| `supabase/functions/extract-playbook/index.ts` | Extrair texto de arquivos            |
| `supabase/functions/roleplay-chat/index.ts`    | Chat com IA + contexto dos playbooks |
| `supabase/config.toml`                         | Registrar as 2 functions             |
| `src/pages/Playbooks.tsx`                      | Criar - Upload e gestão de playbooks |
| `src/pages/Roleplay.tsx`                       | Criar - Chat com IA                  |
| `src/App.tsx`                                  | Editar - Novas rotas                 |
