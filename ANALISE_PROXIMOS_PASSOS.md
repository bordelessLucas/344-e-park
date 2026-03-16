# Análise do Projeto e Próximos Passos

Data da análise: 16/03/2026

## 1. Resumo executivo

O projeto está em um estágio funcional de produto inicial (MVP), com boa cobertura de telas e proposta clara de valor para serviços automotivos e estacionamento. A base atual permite evoluir rápido, mas há sinais de dívida técnica que precisam ser tratados para sustentar crescimento.

Principais pontos:
- Pontos fortes: variedade de funcionalidades, integração com autenticação Firebase, tipagem TypeScript habilitada em modo estrito, boa base de componentes e serviços.
- Principais riscos: arquitetura de navegação inconsistente, estrutura de pastas confusa, configurações duplicadas de Firebase e dados sensíveis hardcoded, ausência de testes e pipeline de qualidade.
- Próximo objetivo recomendado: consolidar arquitetura e qualidade antes de ampliar escopo funcional.

## 2. Diagnóstico do estado atual

### 2.1 Arquitetura e organização

Observações:
- O componente principal do app está em src/types/App.tsx, o que mistura responsabilidade de tipagem com tela/fluxo.
- Existe sistema de rotas em src/routes/AppRoutes.tsx, porém a entrada principal do app usa diretamente src/types/App.tsx.
- O arquivo src/types/main.tsx está vazio.
- A pasta src/types contém arquivos de tipagem e também arquivos de execução/estilo (App.tsx, App.css, main.tsx, index.css).

Impacto:
- Aumenta custo de manutenção e onboarding.
- Facilita regressões por duplicidade de fluxo (navegação por estado manual e navegação por stack).

### 2.2 Navegação e fluxo de autenticação

Observações:
- Há uso de react-navigation e ProtectedRoutes, mas o fluxo principal em App.tsx aparenta controlar telas também por estado local.
- Há risco de comportamento divergente entre duas abordagens de roteamento.

Impacto:
- Maior complexidade para evoluir menus, deep links, histórico de navegação e controle de sessão.

### 2.3 Dados e serviços

Observações:
- Serviços com boa separação por domínio (tickets, combustível, auth, etc.).
- Muitos fluxos usam simulação/mocks locais (exemplo: parkingTicketService e vehicleInfoService).
- Alguns dados de negócio extensos estão hardcoded, o que é aceitável em protótipo, mas limita atualização por backoffice e escalabilidade.

Impacto:
- Difícil validar comportamento real em produção.
- Risco de divergência entre regras mockadas e regras reais de parceiros/APIs.

### 2.4 Segurança e configuração

Observações:
- Configuração Firebase aparece duplicada em src/lib/firebase.ts e src/firebase/config.ts.
- app.json também carrega outra configuração Firebase em expo.extra.
- Chaves e dados de configuração estão versionados diretamente no repositório.

Impacto:
- Risco de segurança e inconsistência de ambiente (dev/homolog/prod).
- Possibilidade de app apontar para projetos Firebase diferentes sem clareza.

### 2.5 Qualidade, testes e operação

Observações:
- Não há suíte de testes automatizados detectada.
- Não há configuração de lint/format padronizada detectada.
- README está praticamente vazio.

Impacto:
- Evolução com maior chance de regressão.
- Dificulta colaboração e padronização entre desenvolvedores.

## 3. Prioridades recomendadas

### Prioridade alta (iniciar imediatamente)

1. Consolidar arquitetura de entrada e navegação
- Definir um único fluxo principal baseado em react-navigation.
- Migrar lógica de troca de telas do App.tsx para rotas formais.
- Reorganizar estrutura para separar tipagem, UI e bootstrap.

2. Unificar configuração Firebase e ambientes
- Manter uma única fonte de configuração.
- Padronizar variáveis por ambiente (dev, staging, prod).
- Remover segredos hardcoded e usar mecanismo seguro de configuração do Expo.

3. Implantar baseline de qualidade
- Adicionar ESLint e Prettier.
- Adicionar scripts de verificação no package.json.
- Incluir checagem no fluxo de PR/CI.

### Prioridade média (curto prazo)

4. Criar estratégia de dados reais por domínio
- Definir contrato para cada serviço (auth, tickets, combustível, multas/IPVA, etc.).
- Encapsular integração com APIs externas por camada adaptadora.
- Manter mocks somente para fallback e desenvolvimento offline.

5. Cobertura mínima de testes
- Testes unitários para serviços críticos.
- Testes de fluxo para autenticação e navegação protegida.

6. Observabilidade e tratamento de erros
- Padronizar logging e mensagens de erro para usuário.
- Introduzir telemetria de falhas (exemplo: Sentry).

### Prioridade evolutiva (médio prazo)

7. Productização
- Definir métricas de uso por funcionalidade.
- Criar feature flags para liberar recursos gradualmente.
- Melhorar experiência offline e cache por domínio relevante.

8. Governança de UI
- Extrair design tokens (cores, espaçamentos, tipografia).
- Reduzir duplicação de estilos entre telas.

## 4. Roadmap sugerido (90 dias)

### Fase 1: Fundação técnica (semanas 1 a 3)
- Reorganizar estrutura de pastas.
- Eleger único entrypoint de navegação.
- Unificar Firebase e ambiente.
- Configurar lint, format e scripts de validação.

Critério de sucesso:
- App funcionando com um único fluxo de navegação.
- Build local sem warnings críticos.
- Time com padrão de código definido.

### Fase 2: Confiabilidade (semanas 4 a 7)
- Testes unitários dos serviços principais.
- Testes de autenticação e rotas protegidas.
- Padronização de erros e telemetria.

Critério de sucesso:
- Cobertura mínima em fluxos críticos.
- Redução de bugs de navegação/autenticação.

### Fase 3: Escala funcional (semanas 8 a 12)
- Priorização de integrações reais (começando pelos fluxos com maior uso).
- Migração gradual de mocks para dados reais.
- Painel simples de indicadores de produto e estabilidade.

Critério de sucesso:
- Funcionalidades críticas operando com dados reais.
- Indicadores objetivos para tomada de decisão.

## 5. Backlog inicial objetivo

Sprint A:
- Normalizar estrutura src (app, navigation, features, shared, services, types).
- Mover App.tsx para pasta apropriada e limpar pasta types.
- Remover duplicidades de configuração Firebase.

Sprint B:
- Implementar ESLint, Prettier e scripts: lint, typecheck, test.
- Criar template de pull request com checklist de qualidade.
- Escrever README técnico completo (setup, execução, build, arquitetura).

Sprint C:
- Testes de auth e rotas.
- Contratos de API para serviços com fallback controlado.
- Primeira integração real priorizada por impacto no usuário.

## 6. Riscos se nada for ajustado

- Aumento de custo para incluir novas funcionalidades.
- Regressões frequentes em navegação e autenticação.
- Dificuldade para escalar equipe e manter previsibilidade.
- Risco de segurança e inconsistência entre ambientes.

## 7. Conclusão

O projeto já demonstra valor de produto e boa base funcional para MVP. O próximo passo mais inteligente é fortalecer a fundação técnica (arquitetura, configuração, qualidade e testes) antes de expandir funcionalidades em larga escala. Isso reduz risco, melhora velocidade de entrega e prepara o app para operar com dados reais de forma estável.