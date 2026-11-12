# CLAUDE.md

Orientações para o Claude Code trabalhar neste repositório.

## Visão geral

**calcMEI** (https://calcmei.com.br) é um site estático que calcula se um MEI precisa declarar o IRPF (Imposto de Renda Pessoa Física). Todo o cálculo roda no navegador — sem backend, banco de dados ou login, de propósito (dados financeiros privados não saem do cliente). Começou como projeto final do CS50x. Existe um app iOS irmão em https://github.com/frehelfer/calcMEI.

Todo o conteúdo voltado ao usuário é em **português (pt-BR)**, e os identificadores do JS também usam nomes em português, inclusive com acentos (`serviços`, `lucroTributável`, `#conta-comércio`). Mantenha esse padrão.

## Stack e estrutura

- HTML + CSS + JavaScript puro (sem framework).
- Firebase Hosting (projeto `calc-mei`, ver `.firebaserc` / `firebase.json`); a pasta publicada é `public/`.
- Webpack só empacota o Firebase Analytics: `src/index.js` → `public/bundle.js`.

```
public/
  index.html            # Calculadora + resultado + tutorial (accordion)
  contato.html          # Formulário de contato via formsubmit.co
  privacidade.html, termos-de-uso.html, thanks.html
  scripts/calculator.js # Máscara BRL dos inputs + toda a lógica de cálculo
  scripts/accordion.js  # Abrir/fechar do accordion do tutorial
  styles/base.css, styles/calculator.css
  ads.txt               # Google AdSense
src/index.js            # Inicialização do Firebase App + Analytics (vira bundle.js)
```

`public/bundle.js` é um artefato gerado, mas **está versionado** porque o Firebase publica `public/` direto. Não edite à mão — altere `src/index.js` e rode o build.

## Comandos

```bash
npm install
npm run build          # webpack em modo development com watch: true (não encerra sozinho)
npx webpack --watch=false   # build único
firebase deploy --only hosting   # requer firebase-tools e login
```

Desenvolvimento local: sirva `public/` com qualquer servidor estático (ex.: Live Server do VS Code, ou `npx serve public`). Não há testes nem linter configurados.

## Regras de negócio (calculator.js)

A cada `input`, o valor é mascarado para BRL e todos os resultados são recalculados:

1. **Receita bruta** = serviços + comércio + transporte
2. **Lucro apurado** = receita bruta − despesas (exibe R$ 0,00 se negativo)
3. **Lucro isento** = serviços × 0,32 + comércio × 0,08 + transporte × 0,16
4. **Lucro tributável** = lucro apurado − lucro isento
5. Se lucro tributável > **R$ 35.584,00** (IRPF 2026) → declaração "OBRIGATÓRIA"; caso contrário, "Não Obrigatória".

Os elementos `#conta-*` mostram a "conta" (passo a passo) ao lado de cada resultado.

## Atualização anual (tarefa recorrente)

A cada novo exercício do IRPF, o limite e os anos precisam ser atualizados **em vários lugares** — não existe constante única:

- `public/scripts/calculator.js`: limite numérico no `if` e nos dois textos de resultado.
- `public/index.html`: "Ano-Calendário de AAAA - Exercício de AAAA+1", "Última atualização em …", referências ao ano-calendário no texto e o limite em reais (vários trechos).

Use `grep -rn "35.584\|35584" public` (troque pelo valor atual) para achar todas as ocorrências.

## Observações

- Todas as páginas carregam `bundle.js` (Analytics) e o script do AdSense (`ca-pub-9442959543814157`).
- A config do Firebase em `src/index.js` é a config pública do app web (normal no client-side), não um segredo.
- `firebase.json` reescreve todas as rotas para `/index.html`.
- Ignore `.DS_Store` e `.idea/` em commits.
