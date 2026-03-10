

## Problema: Carregamento Infinito

**Causa raiz:** Na linha 42, o callback do `onAuthStateChange` usa `async/await` para chamar `fetchProfile`. O evento `INITIAL_SESSION` é disparado dentro do `onAuthStateChange` **antes** que `getSession()` (linha 55) consiga resolver. Como o callback aguarda (`await`) uma operação assíncrona que também precisa do lock interno do Supabase, ocorre um **deadlock** — `loading` nunca vira `false`.

## Correção

**Arquivo:** `src/contexts/AuthProvider.tsx`

Refatorar o `useEffect` para:
1. Chamar `getSession()` primeiro para restaurar a sessão e definir `loading = false`
2. Configurar `onAuthStateChange` **sem** `async/await` — usar padrão "fire and forget" para `fetchProfile`
3. Remover o timeout de 5 segundos (não é mais necessário)

```typescript
useEffect(() => {
  // 1. Restaura sessão primeiro
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
    setUser(session?.user ?? null);
    if (session?.user) {
      fetchProfile(session.user.id); // fire-and-forget, sem await
    }
    setLoading(false);
  });

  // 2. Escuta mudanças subsequentes (SEM async/await)
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id); // fire-and-forget
      } else {
        setProfile(null);
      }
    }
  );

  return () => subscription.unsubscribe();
}, []);
```

**Resumo da mudança:**
- Remover `async` e `await` do callback do `onAuthStateChange` (linhas 42-47)
- Remover o `setTimeout` de fallback (linha 39)
- Manter `getSession()` como responsável único por definir `loading = false`

