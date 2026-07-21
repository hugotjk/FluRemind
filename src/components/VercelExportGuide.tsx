import React, { useState } from 'react';
import { Copy, Check, FileText, Code2, Server, Key, ExternalLink, Sparkles, Terminal, ShieldAlert } from 'lucide-react';

export const VercelExportGuide: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const vercelJsonCode = `{
  "crons": [
    {
      "path": "/api/cron/reminders",
      "schedule": "0 11 * * *"
    }
  ]
}`;

  const nextApiCronCode = `// app/api/cron/reminders/route.ts (Next.js App Router)
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const cronSecret = process.env.CRON_SECRET;

    // 1. Validação opcional de segurança do Vercel Cron Secret
    if (cronSecret) {
      const authHeader = request.headers.get('authorization');
      if (authHeader !== \`Bearer \${cronSecret}\`) {
        return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 401 });
      }
    }

    if (!token || !chatId) {
      return NextResponse.json({
        error: 'Variáveis TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID não estão configuradas na Vercel.'
      }, { status: 400 });
    }

    // 2. Data de hoje (Formato YYYY-MM-DD)
    const todayStr = new Date().toISOString().split('T')[0];

    // TODO: Buscar jogos do banco de dados (ex: Supabase, Vercel Postgres, ou Vercel KV)
    // Exemplo de formato do jogo do dia:
    const mockTodayMatch = {
      opponent: 'Flamengo',
      competition: 'Brasileirão',
      time: '16:00',
      location: 'Maracanã, Rio de Janeiro',
      tasks: [
        { text: 'Separar camisa tricolor 🇭🇺', completed: true },
        { text: 'Comprar ingresso / check-in sócio', completed: true },
        { text: 'Chegar às 13:30 no Maracanã', completed: false }
      ]
    };

    // 3. Montagem da mensagem formatada com emojis do Fluminense 🇭🇺
    let message = \`🇭🇺 *HOJE TEM FLUMINENSE!* ⚽\\n\\n\`;
    message += \`🛡️ *Fluminense vs \${mockTodayMatch.opponent}*\\n\`;
    message += \`🏆 *Competição:* \${mockTodayMatch.competition}\\n\`;
    message += \`⏰ *Horário:* \${mockTodayMatch.time}\\n\`;
    message += \`📍 *Local:* \${mockTodayMatch.location}\\n\\n\`;
    message += \`📋 *TAREFAS DO JOGO:*\\n\`;

    mockTodayMatch.tasks.forEach(t => {
      message += \`\${t.completed ? '✅' : '⏳'} \${t.text}\\n\`;
    });

    message += \`\\n🔥 *VAMOS, TRICOLOR! VENCER OU VENCER!* 🇭🇺\`;

    // 4. Disparo para a API do Telegram
    const telegramRes = await fetch(\`https://api.telegram.org/bot\${token}/sendMessage\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    const telegramData = await telegramRes.json();

    if (!telegramRes.ok || !telegramData.ok) {
      return NextResponse.json({
        error: telegramData.description || 'Falha ao enviar mensagem ao Telegram'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Lembrete do Fluminense enviado com sucesso!',
      telegramData
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}`;

  const envLocalCode = `# .env.local (Variáveis de Ambiente para Next.js / Vercel)
TELEGRAM_BOT_TOKEN="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
TELEGRAM_CHAT_ID="987654321"
CRON_SECRET="fluminense_secret_2026"
`;

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-stone-900 to-[#5a0c1a] text-white p-6 rounded-2xl border border-stone-800 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-6 h-6 text-[#e6b800]" />
          <h2 className="text-xl font-bold font-serif">Guia de Hospedagem Vercel & Código Next.js</h2>
        </div>
        <p className="text-xs text-stone-300 max-w-3xl leading-relaxed">
          Sua aplicação já está pronta para rodar nesta interface interativa! Abaixo, fornecemos os arquivos e o passo a passo completo para exportar este projeto para Next.js (App Router) e hospedá-lo na <strong>Vercel</strong> com automação diária do <strong>Vercel Cron Jobs</strong>.
        </p>
      </div>

      {/* Grid: Instructions & Setup */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Step 1: Telegram BotFather & Chat ID */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-sky-700 font-bold text-sm">
            <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center text-xs font-black">1</span>
            <h3>Obter TOKEN e CHAT_ID no Telegram</h3>
          </div>

          <div className="space-y-2 text-xs text-stone-700">
            <p className="font-semibold text-stone-900">Passo a passo para criar o Bot:</p>
            <ol className="list-decimal list-inside space-y-1 text-stone-600 pl-1">
              <li>No Telegram, pesquise por <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-sky-600 font-bold hover:underline inline-flex items-center gap-0.5">@BotFather <ExternalLink className="w-2.5 h-2.5" /></a>.</li>
              <li>Envie o comando <code className="bg-stone-100 text-rose-700 font-mono px-1 rounded">/newbot</code>.</li>
              <li>Escolha o nome (ex: <code>Fluminense Lembretes</code>) e o username (ex: <code>flu_remind_bot</code>).</li>
              <li>O BotFather responderá com o <strong>TELEGRAM_BOT_TOKEN</strong> (ex: <span className="font-mono text-stone-800">712345678:AA...</span>).</li>
              <li><strong>IMPORTANTE:</strong> Abra a conversa com seu bot recém-criado e clique em <strong>START / INICIAR</strong>.</li>
            </ol>

            <p className="font-semibold text-stone-900 pt-2">Passo a passo para obter seu CHAT_ID:</p>
            <ol className="list-decimal list-inside space-y-1 text-stone-600 pl-1">
              <li>Pesquise no Telegram por <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="text-sky-600 font-bold hover:underline inline-flex items-center gap-0.5">@userinfobot <ExternalLink className="w-2.5 h-2.5" /></a>.</li>
              <li>Envie qualquer mensagem. O robô responderá com seu <strong>Id</strong> numérico (ex: <span className="font-mono text-stone-800">123456789</span>).</li>
            </ol>
          </div>
        </div>

        {/* Step 2: Vercel Environment Variables */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">2</span>
            <h3>Configurar Variáveis na Vercel</h3>
          </div>

          <div className="space-y-2 text-xs text-stone-700">
            <p>Após criar ou importar o repositório na Vercel:</p>
            <ol className="list-decimal list-inside space-y-1 text-stone-600 pl-1">
              <li>Acesse o projeto no painel da Vercel (<span className="font-mono text-stone-800">vercel.com</span>).</li>
              <li>Vá para <strong>Settings &gt; Environment Variables</strong>.</li>
              <li>Adicione as seguintes chaves e valores:</li>
            </ol>

            <div className="bg-stone-900 text-stone-200 p-3 rounded-xl font-mono text-[11px] space-y-1 mt-2">
              <div className="text-emerald-400">TELEGRAM_BOT_TOKEN=seu_token_do_botfather</div>
              <div className="text-emerald-400">TELEGRAM_CHAT_ID=seu_chat_id_numerico</div>
              <div className="text-amber-400">CRON_SECRET=sua_chave_secreta_opcional</div>
            </div>
          </div>
        </div>

      </div>

      {/* File 1: vercel.json */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="bg-stone-900 p-4 text-white flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#e6b800]" />
            <span className="font-mono text-xs font-bold">vercel.json (Configuração Vercel Cron Jobs)</span>
          </div>

          <button
            onClick={() => copyToClipboard(vercelJsonCode, 'vercel.json')}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-stone-200 transition-colors flex items-center gap-1.5"
          >
            {copiedSection === 'vercel.json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSection === 'vercel.json' ? 'Copiado!' : 'Copiar'}</span>
          </button>
        </div>

        <div className="p-4 bg-stone-950 text-stone-100 font-mono text-xs overflow-x-auto">
          <pre>{vercelJsonCode}</pre>
        </div>

        <div className="p-3 bg-stone-50 border-t border-stone-200 text-xs text-stone-600">
          💡 O parâmetro <code className="font-bold text-stone-800">"0 11 * * *"</code> agenda a rota <code className="font-bold text-stone-800">/api/cron/reminders</code> para rodar diariamente às <strong>11:00 UTC (08:00 no horário de Brasília)</strong>.
        </div>
      </div>

      {/* File 2: Next.js API Route */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="bg-stone-900 p-4 text-white flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-sky-400" />
            <span className="font-mono text-xs font-bold">app/api/cron/reminders/route.ts (Next.js App Router API)</span>
          </div>

          <button
            onClick={() => copyToClipboard(nextApiCronCode, 'next-cron-route')}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-stone-200 transition-colors flex items-center gap-1.5"
          >
            {copiedSection === 'next-cron-route' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSection === 'next-cron-route' ? 'Copiado!' : 'Copiar Rota'}</span>
          </button>
        </div>

        <div className="p-4 bg-stone-950 text-emerald-300 font-mono text-xs overflow-x-auto max-h-96">
          <pre>{nextApiCronCode}</pre>
        </div>
      </div>

      {/* File 3: .env.local Template */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="bg-stone-900 p-4 text-white flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-400" />
            <span className="font-mono text-xs font-bold">.env.local (Template de Variáveis Locais)</span>
          </div>

          <button
            onClick={() => copyToClipboard(envLocalCode, 'env-local')}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-stone-200 transition-colors flex items-center gap-1.5"
          >
            {copiedSection === 'env-local' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSection === 'env-local' ? 'Copiado!' : 'Copiar'}</span>
          </button>
        </div>

        <div className="p-4 bg-stone-950 text-amber-200 font-mono text-xs overflow-x-auto">
          <pre>{envLocalCode}</pre>
        </div>
      </div>

    </div>
  );
};
