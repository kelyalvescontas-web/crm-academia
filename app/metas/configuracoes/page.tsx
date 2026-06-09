"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../../components/Sidebar";

function mesAtualSistema() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  return `${ano}-${mes}`;
}

export default function ConfiguracoesMetasPage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<any>(null);
  const [mesReferencia, setMesReferencia] = useState(mesAtualSistema());

  const [metaEmpresa, setMetaEmpresa] = useState(60);

  const [meta1Qtd, setMeta1Qtd] = useState(30);
  const [meta1Valor, setMeta1Valor] = useState(300);

  const [meta2Qtd, setMeta2Qtd] = useState(40);
  const [meta2Valor, setMeta2Valor] = useState(500);

  const [meta3Qtd, setMeta3Qtd] = useState(50);
  const [meta3Valor, setMeta3Valor] = useState(800);

  const [meta4Qtd, setMeta4Qtd] = useState(60);
  const [meta4Valor, setMeta4Valor] = useState(1200);

  const [mensagemMotivacional, setMensagemMotivacional] = useState("");
  const [mensagemCrista, setMensagemCrista] = useState("");

  const [campanhaAtiva, setCampanhaAtiva] = useState(true);
  const [campanhaTitulo, setCampanhaTitulo] = useState("Desafio Indicação Premiada");
  const [campanhaRegra, setCampanhaRegra] = useState("Meta: 2 indicações fechadas");
  const [campanhaPremio, setCampanhaPremio] = useState("Vale R$50,00");
  const [campanhaProgresso, setCampanhaProgresso] = useState(1);
  const [campanhaObjetivo, setCampanhaObjetivo] = useState(2);
  const [campanhaUnidade, setCampanhaUnidade] = useState("indicações fechadas");
  const [campanhaFuncionarias, setCampanhaFuncionarias] = useState("");

  const [comunicado1Titulo, setComunicado1Titulo] = useState("Reunião Comercial");
  const [comunicado1Mensagem, setComunicado1Mensagem] = useState("Sexta-feira às 08:00 na sala da gerência.");
  const [comunicado2Titulo, setComunicado2Titulo] = useState("Nova Campanha");
  const [comunicado2Mensagem, setComunicado2Mensagem] = useState("Indique 2 amigos e ganhe um vale R$50!");

  const [lancamentoTitulo, setLancamentoTitulo] = useState("Novo Plano");
  const [lancamentoMensagem, setLancamentoMensagem] = useState("Conheça nosso novo plano Musculação + Ritmos.");

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem("usuario");

    if (!usuarioSalvo) {
      router.push("/login");
      return;
    }

    const user = JSON.parse(usuarioSalvo);
    setUsuario(user);

    const cargo = String(user.cargo || "").toUpperCase();

    if (
      cargo !== "ADMIN" &&
      cargo !== "ADMIN_GERAL" &&
      cargo !== "GERENTE" &&
      cargo !== "GERENCIAL"
    ) {
      alert("Você não tem permissão para acessar esta tela.");
      router.push("/metas");
      return;
    }

    carregarConfiguracoes(user, mesAtualSistema());
  }, []);

  function unidadeAtual(userParam?: any) {
    const user = userParam || usuario;

    return user?.cargo === "ADMIN_GERAL"
      ? localStorage.getItem("unidadeSelecionadaId")
      : String(user?.unidadeId || "");
  }

  async function carregarConfiguracoes(userParam?: any, mesParam?: string) {
    const unidadeId = unidadeAtual(userParam);

    if (!unidadeId) {
      alert("Selecione uma unidade no Dashboard");
      router.push("/");
      return;
    }

    const mes = mesParam || mesReferencia;

    const response = await fetch(
      `/api/metas/configuracoes?unidadeId=${unidadeId}&mes=${mes}`,
      { cache: "no-store" }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Erro ao carregar configurações");
      return;
    }

    setMesReferencia(data.mes || mes);

    setMetaEmpresa(Number(data.metaEmpresa || data.meta4Qtd || 60));

    setMeta1Qtd(Number(data.meta1Qtd || 30));
    setMeta1Valor(Number(data.meta1Valor || 300));

    setMeta2Qtd(Number(data.meta2Qtd || 40));
    setMeta2Valor(Number(data.meta2Valor || 500));

    setMeta3Qtd(Number(data.meta3Qtd || 50));
    setMeta3Valor(Number(data.meta3Valor || 800));

    setMeta4Qtd(Number(data.meta4Qtd || 60));
    setMeta4Valor(Number(data.meta4Valor || 1200));

    setMensagemMotivacional(
      data.mensagemMotivacional ||
        "Você é capaz de mais do que imagina! Cada contrato é um passo para sua vitória."
    );

    setMensagemCrista(
      data.mensagemCrista ||
        "Tudo posso naquele que me fortalece. Filipenses 4:13"
    );

    setCampanhaAtiva(data.campanhaAtiva ?? true);
    setCampanhaTitulo(data.campanhaTitulo ?? "Desafio Indicação Premiada");
    setCampanhaRegra(data.campanhaRegra ?? "Meta: 2 indicações fechadas");
    setCampanhaPremio(data.campanhaPremio ?? "Vale R$50,00");
    setCampanhaProgresso(Number(data.campanhaProgresso ?? 1));
    setCampanhaObjetivo(Number(data.campanhaObjetivo ?? 2));
    setCampanhaUnidade(data.campanhaUnidade ?? "indicações fechadas");
    setCampanhaFuncionarias(data.campanhaFuncionarias ?? "");

    setComunicado1Titulo(data.comunicado1Titulo ?? "Reunião Comercial");
    setComunicado1Mensagem(data.comunicado1Mensagem ?? "Sexta-feira às 08:00 na sala da gerência.");
    setComunicado2Titulo(data.comunicado2Titulo ?? "Nova Campanha");
    setComunicado2Mensagem(data.comunicado2Mensagem ?? "Indique 2 amigos e ganhe um vale R$50!");

    setLancamentoTitulo(data.lancamentoTitulo ?? "Novo Plano");
    setLancamentoMensagem(data.lancamentoMensagem ?? "Conheça nosso novo plano Musculação + Ritmos.");
  }

  async function trocarMes(mes: string) {
    setMesReferencia(mes);
    await carregarConfiguracoes(usuario, mes);
  }

  async function salvarConfiguracoes() {
    const unidadeId = unidadeAtual();

    if (!unidadeId) {
      alert("Selecione uma unidade no Dashboard");
      return;
    }

    const response = await fetch("/api/metas/configuracoes", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        unidadeId,
        mes: mesReferencia,

        metaEmpresa,

        meta1Qtd,
        meta1Valor,
        meta2Qtd,
        meta2Valor,
        meta3Qtd,
        meta3Valor,
        meta4Qtd,
        meta4Valor,

        mensagemMotivacional,
        mensagemCrista,

        campanhaAtiva,
        campanhaTitulo,
        campanhaRegra,
        campanhaPremio,
        campanhaProgresso,
        campanhaObjetivo,
        campanhaUnidade,
        campanhaFuncionarias,

        comunicado1Titulo,
        comunicado1Mensagem,
        comunicado2Titulo,
        comunicado2Mensagem,

        lancamentoTitulo,
        lancamentoMensagem,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Erro ao salvar configurações");
      return;
    }

    alert("Configurações salvas com sucesso!");
    router.push("/metas");
  }

  return (
    <main className="min-h-screen flex bg-gray-100">
      <Sidebar />

      <section className="flex-1 p-8">
        <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-black text-gray-900">
              ⚙️ Configurações de Metas
            </h1>

            <p className="text-gray-600 mt-2">
              Defina meta coletiva, premiações, campanhas, comunicados e lançamentos do painel.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <input
              type="month"
              value={mesReferencia}
              onChange={(e) => trocarMes(e.target.value)}
              className="bg-white border rounded-xl px-4 py-3 font-bold shadow-sm"
            />

            <button
              onClick={() => router.push("/metas")}
              className="bg-gray-800 text-white px-5 py-3 rounded-xl font-bold shadow"
            >
              Voltar para Metas
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl shadow border p-6">
              <h2 className="text-2xl font-black mb-2">
                🎯 Meta Coletiva da Unidade
              </h2>

              <p className="text-gray-500 mb-5">
                Essa é a meta principal que aparece para o ADMIN_GERAL no painel da unidade.
              </p>

              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                <label className="block font-black mb-2 text-blue-800">
                  Meta coletiva da unidade
                </label>

                <input
                  type="number"
                  value={metaEmpresa}
                  onChange={(e) => setMetaEmpresa(Number(e.target.value))}
                  className="w-full border rounded-xl p-3 font-bold"
                />
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow border p-6">
              <h2 className="text-2xl font-black mb-2">
                🏢 Premiações da Empresa
              </h2>

              <p className="text-gray-500 mb-6">
                Essas metas são usadas para premiação das colaboradoras. Não são acumulativas.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <MetaCard titulo="Meta 1" quantidade={meta1Qtd} setQuantidade={setMeta1Qtd} valor={meta1Valor} setValor={setMeta1Valor} icone="🥉" />
                <MetaCard titulo="Meta 2" quantidade={meta2Qtd} setQuantidade={setMeta2Qtd} valor={meta2Valor} setValor={setMeta2Valor} icone="🥈" />
                <MetaCard titulo="Meta 3" quantidade={meta3Qtd} setQuantidade={setMeta3Qtd} valor={meta3Valor} setValor={setMeta3Valor} icone="🥇" />
                <MetaCard titulo="Meta 4" quantidade={meta4Qtd} setQuantidade={setMeta4Qtd} valor={meta4Valor} setValor={setMeta4Valor} icone="💎" />
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow border p-6">
              <h2 className="text-2xl font-black mb-4">
                🚀 Campanha Extra
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CampoTexto label="Título da campanha" valor={campanhaTitulo} setValor={setCampanhaTitulo} />
                <CampoTexto label="Prêmio" valor={campanhaPremio} setValor={setCampanhaPremio} />
                <CampoTexto label="Regra/meta da campanha" valor={campanhaRegra} setValor={setCampanhaRegra} />
                <CampoTexto label="Unidade de progresso" valor={campanhaUnidade} setValor={setCampanhaUnidade} />

                <CampoNumero label="Progresso atual" valor={campanhaProgresso} setValor={setCampanhaProgresso} />
                <CampoNumero label="Objetivo" valor={campanhaObjetivo} setValor={setCampanhaObjetivo} />

                <label className="flex items-center gap-3 font-black bg-purple-50 border border-purple-100 rounded-xl p-4">
                  <input
                    type="checkbox"
                    checked={campanhaAtiva}
                    onChange={(e) => setCampanhaAtiva(e.target.checked)}
                  />
                  Campanha ativa no painel
                </label>

                <div className="md:col-span-2 bg-green-50 border border-green-100 rounded-2xl p-4">
                  <CampoArea
                    label="Funcionárias que completaram a meta extra"
                    valor={campanhaFuncionarias}
                    setValor={setCampanhaFuncionarias}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Exemplo: Kely, Bruna e Paola. Esse campo ficará salvo na campanha extra.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow border p-6">
              <h2 className="text-2xl font-black mb-4">
                📣 Comunicados e Reuniões
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                  <h3 className="font-black text-blue-700 mb-3">Comunicado / Reunião 1</h3>
                  <CampoTexto label="Título" valor={comunicado1Titulo} setValor={setComunicado1Titulo} />
                  <CampoArea label="Mensagem" valor={comunicado1Mensagem} setValor={setComunicado1Mensagem} />
                </div>

                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
                  <h3 className="font-black text-orange-600 mb-3">Comunicado / Reunião 2</h3>
                  <CampoTexto label="Título" valor={comunicado2Titulo} setValor={setComunicado2Titulo} />
                  <CampoArea label="Mensagem" valor={comunicado2Mensagem} setValor={setComunicado2Mensagem} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow border p-6">
              <h2 className="text-2xl font-black mb-4">
                🆕 Lançamentos / Novidades
              </h2>

              <CampoTexto label="Título do lançamento" valor={lancamentoTitulo} setValor={setLancamentoTitulo} />
              <CampoArea label="Descrição" valor={lancamentoMensagem} setValor={setLancamentoMensagem} />
            </div>

            <div className="bg-white rounded-3xl shadow border p-6">
              <h2 className="text-2xl font-black mb-4">
                💬 Mensagem Motivacional
              </h2>

              <CampoArea
                label="Mensagem do painel"
                valor={mensagemMotivacional}
                setValor={setMensagemMotivacional}
              />

              <div className="mt-4">
                <CampoArea
                  label="Frase cristã / motivacional"
                  valor={mensagemCrista}
                  setValor={setMensagemCrista}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-700 to-blue-950 text-white rounded-3xl shadow p-6">
              <h2 className="text-2xl font-black mb-4">
                Prévia da Campanha
              </h2>

              <div className="mb-5 bg-white/10 rounded-2xl p-4">
                <p className="text-sm opacity-90">Meta coletiva da unidade</p>
                <p className="text-4xl font-black mt-1">
                  {metaEmpresa} contratos
                </p>
              </div>

              <div className="space-y-3">
                <PreviewPremio icone="🥉" quantidade={meta1Qtd} valor={meta1Valor} />
                <PreviewPremio icone="🥈" quantidade={meta2Qtd} valor={meta2Valor} />
                <PreviewPremio icone="🥇" quantidade={meta3Qtd} valor={meta3Valor} />
                <PreviewPremio icone="💎" quantidade={meta4Qtd} valor={meta4Valor} />
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-100 via-white to-purple-50 rounded-3xl shadow border border-purple-100 p-6">
              <h2 className="text-2xl font-black mb-3">
                🚀 Prévia da Campanha Extra
              </h2>

              <p className="font-black text-purple-700">{campanhaTitulo}</p>
              <p className="mt-2">{campanhaRegra}</p>
              <p className="font-bold mt-2">{campanhaPremio}</p>
              <p className="text-3xl font-black text-purple-700 mt-4">
                {campanhaProgresso} / {campanhaObjetivo}
              </p>
              <p className="text-sm text-gray-600">{campanhaUnidade}</p>

              {campanhaFuncionarias.trim() && (
                <div className="bg-green-50 border border-green-100 rounded-xl p-3 mt-3">
                  <p className="text-xs font-black text-green-700">Meta extra concluída por:</p>
                  <p className="text-sm text-green-800">{campanhaFuncionarias}</p>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-r from-rose-100 via-orange-50 to-yellow-50 rounded-3xl shadow border border-rose-100 p-6">
              <h2 className="text-2xl font-black mb-3">
                🏆 Prévia da Mensagem
              </h2>

              <p className="text-gray-800 font-semibold">
                {mensagemMotivacional}
              </p>

              <div className="mt-4 bg-white/80 rounded-2xl px-4 py-3 border border-white">
                <p className="text-purple-700 font-bold text-sm">
                  ✨ {mensagemCrista}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow border p-6">
              <h2 className="text-2xl font-black mb-3">
                📣 Prévia dos Comunicados
              </h2>

              <PreviewComunicado titulo={comunicado1Titulo} mensagem={comunicado1Mensagem} />
              <PreviewComunicado titulo={comunicado2Titulo} mensagem={comunicado2Mensagem} />
              <PreviewComunicado titulo={lancamentoTitulo} mensagem={lancamentoMensagem} />
            </div>

            <button
              onClick={salvarConfiguracoes}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-2xl font-bold text-lg shadow"
            >
              Salvar Configurações
            </button>

            <button
              onClick={() => router.push("/metas")}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-2xl font-bold text-lg shadow"
            >
              Cancelar
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function CampoTexto({ label, valor, setValor }: any) {
  return (
    <div>
      <label className="block font-black mb-2">{label}</label>
      <input
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        className="w-full border rounded-xl p-3"
      />
    </div>
  );
}

function CampoNumero({ label, valor, setValor }: any) {
  return (
    <div>
      <label className="block font-black mb-2">{label}</label>
      <input
        type="number"
        value={valor}
        onChange={(e) => setValor(Number(e.target.value))}
        className="w-full border rounded-xl p-3"
      />
    </div>
  );
}

function CampoArea({ label, valor, setValor }: any) {
  return (
    <div>
      <label className="block font-black mb-2">{label}</label>
      <textarea
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        className="w-full border rounded-xl p-4 h-24"
      />
    </div>
  );
}

function MetaCard({
  titulo,
  quantidade,
  setQuantidade,
  valor,
  setValor,
  icone,
}: any) {
  return (
    <div className="bg-gray-50 border rounded-2xl p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-black">{titulo}</h3>
        <div className="text-4xl">{icone}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CampoNumero label="Quantidade" valor={quantidade} setValor={setQuantidade} />
        <CampoNumero label="Valor R$" valor={valor} setValor={setValor} />
      </div>
    </div>
  );
}

function PreviewPremio({ icone, quantidade, valor }: any) {
  return (
    <div className="bg-white/10 rounded-2xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="text-3xl">{icone}</div>

        <div>
          <p className="font-bold">{quantidade} contratos</p>
          <p className="text-sm opacity-80">Premiação não acumulativa</p>
        </div>
      </div>

      <p className="font-bold">
        {Number(valor || 0).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })}
      </p>
    </div>
  );
}

function PreviewComunicado({ titulo, mensagem }: any) {
  return (
    <div className="border-b border-slate-100 py-3 last:border-b-0">
      <p className="font-black">{titulo}</p>
      <p className="text-sm text-gray-600">{mensagem}</p>
    </div>
  );
}
