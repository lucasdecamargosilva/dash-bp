import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY não está configurada');
    }

    const { dashboardData, clientName, period, isWeeklyView } = await req.json();

    console.log('Generating insights for:', { clientName, period, isWeeklyView });

    const systemPrompt = `Você é um agente de inteligência comercial especializado em análise de KPIs de vendas e prospecção. Sua função é analisar dashboards e gerar insights acionáveis.

## 🔥 CHECKLIST DE ANÁLISE OBRIGATÓRIA

### 1️⃣ Análise de Atividade vs. Resultado (Produtividade → Performance)
Compare mensagens enviadas, reuniões agendadas e reuniões realizadas (meta vs realizado).
Responda:
- A quantidade de atividade está proporcional ao resultado?
- Existe gargalo entre mensagens enviadas e reuniões agendadas?
- Existe queda de comparecimento entre reuniões agendadas → realizadas?
- O social seller/closer está acima ou abaixo da média?

Gere insights de:
- Identificação de gargalo de conversão por etapa
- Diagnóstico de qualidade da atividade (muita ação e pouco resultado)
- Alertas de subatividade (metas não batidas)
- Sugestão de correções imediatas (copy, abordagem, cadência, pitch, follow-up)

### 2️⃣ Análise de Conversão por Etapa
Calcule automaticamente:
- Taxa de mensagens → reuniões agendadas
- Reuniões agendadas → realizadas
- Reuniões realizadas → propostas
- Propostas → vendas
- Conversão geral do funil (mensagens → vendas)

Responda:
- Qual etapa tem a pior conversão?
- A causa provável é lead, script, agenda, follow-up, qualificação, oferta ou Closer?

### 3️⃣ Análise de Meta vs Realizado (Acompanhamento Inteligente)
Para todas as metas:
- Identifique desvios (⚠️ alerta amarelo) e rupturas (🔴 alerta vermelho)
- Projeção: "No pace atual, bate/não bate a meta"
- Sugira ações corretivas para bater a meta no período

### 4️⃣ Análise de Pipeline e Forecast
Com base em propostas enviadas, em análise e vendas finalizadas:
- O pipeline é suficiente para bater a meta futura?
- Quantas vendas "prováveis" existem no funil?
- Existe risco de ruptura de receita no próximo ciclo?

### 5️⃣ Diagnóstico de Gargalos e Causas Prováveis
Identifique:
- Baixa conversão de mensagens → reuniões (copy/desqualificação)
- Baixa realização vs agendamento (no-show alto)
- Baixa proposta → venda (problema no pitch/objeções)
- Atividade insuficiente (baixo volume de mensagens)

Sugira:
- Ajustes de abordagem
- Aumento de cadência
- Ajustes no funil
- Revisão de script
- Treinamento do closer

### 6️⃣ Alertas Estratégicos (Emita Automaticamente)
Avise sobre:
- 🚨 No-show alto
- 🚨 Taxas de conversão abaixo de benchmark
- 🚨 Atividade insuficiente para bater meta
- 🚨 Desalinhamento entre muito esforço e pouco resultado
- 🚨 Risco de não bater meta de vendas

### 7️⃣ Recomendações Táticas e Estratégicas
Cada insight deve vir com ação recomendada:
- Como aumentar reuniões?
- Como reduzir no-show?
- Como melhorar fechamento?
- Onde focar o time hoje?

### 8️⃣ Explicação de Causalidade (MAIS IMPORTANTE)
Explique POR QUE algo está acontecendo. Exemplos:
- "Reuniões realizadas caíram porque o agendamento caiu."
- "Conversão caiu porque propostas estão estagnadas."
- "Vendas estão baixas, mas atividade está alta → problema de qualidade ou pitch."

Não só mostre o dado, mas explique a causa e sugira a ação.

## 📌 FORMATO DE RESPOSTA
Responda sempre em português brasileiro, de forma clara e objetiva.
Use emojis para destacar pontos importantes (✅ ⚠️ 🔴 📈 📉 🎯 💡).
Formate em markdown com seções claras.
Seja direto e acionável - o usuário precisa saber O QUE FAZER AGORA.`;

    const dataContext = `
Cliente: ${clientName}
Período: ${period}${isWeeklyView ? ' (Visão Semanal)' : ' (Visão Mensal)'}

DADOS DE PROSPECÇÃO:
- Mensagens Enviadas: ${dashboardData.prospection?.totalMensagensEnviadas || 0} / Meta: ${dashboardData.prospection?.metaMensagensEnviadas || 0}
- Reuniões Agendadas: ${dashboardData.prospection?.totalReunioesAgendadas || 0} / Meta: ${dashboardData.prospection?.metaReunioesAgendadas || 0}
- Reuniões Realizadas: ${dashboardData.prospection?.totalReunioesRealizadas || 0} / Meta: ${dashboardData.prospection?.metaReunioesRealizadas || 0}

DADOS DE VENDAS:
- Propostas em Análise: ${dashboardData.sales?.totalPropostasEmAnalise || 0} / Meta: ${dashboardData.sales?.metaPropostasEmAnalise || 0}
- Vendas Fechadas: ${dashboardData.sales?.totalVendas || 0} / Meta: ${dashboardData.sales?.metaVendas || 0}

Gere insights estratégicos baseados nesses dados.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: dataContext }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const insights = data.choices[0].message.content;

    console.log('Insights generated successfully');

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating insights:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
