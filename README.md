# 344-e-park

## Deploy no Vercel (Expo Web)

### 1. Build local para validar

```bash
npm run build:web
```

O build gera os arquivos estáticos em `dist/`.

### 2. Deploy via CLI

```bash
npm i -g vercel
vercel
```

No primeiro deploy, responda as perguntas do CLI. Para produção:

```bash
vercel --prod
```

### 3. Deploy via painel do Vercel

1. Importe o repositório no painel do Vercel.
2. O projeto já está configurado com `vercel.json`:
	- `buildCommand`: `npm run build:web`
	- `outputDirectory`: `dist`
3. Clique em Deploy.

### Observações

- Rotas SPA estão tratadas com rewrite para `index.html`.
- Se houver cache antigo, faça um novo deploy com clear cache no painel.