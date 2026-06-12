"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";

function pegarUnidadeAtual() {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

  if (usuario.cargo === "ADMIN_GERAL") {
    return localStorage.getItem("unidadeSelecionadaId");
  }

  return String(usuario.unidadeId || "");
}

const mensagensPadrao: any = {
  mensagemConfirmacao:
    "Oie {aluno}, tudo bem?\n\nSua aula experimental foi agendada pela atendente *{colaboradora}*.\n\nData: *{data}*\nHorário: *{horario}*\nModalidade: *{modalidade}*\n\nTe esperamos por aqui!\n\n*{academia}*\n{endereco}",
  mensagemLembrete:
    "Oie {aluno}, tudo bem?\n\nPassando para te lembrar que sua aula experimental é *Hoje*.\n\nHorário: *{horario}*\nModalidade: *{modalidade}*\n\nEstamos te esperando! Venha com roupa confortável, tênis e sua garrafinha de água para aproveitar ao máximo seu treino experimental!\n\n*{colaboradora}*\n\n*{academia}*\n{endereco}",
  mensagemPosAula:
    "Oie {aluno}, tudo bem?\n\nAqui é a {colaboradora} da {academia}.\n\nQueria saber se gostou da sua aula experimental 😊\n\nMontamos uma ficha de treino personalizada para te ajudar a alcançar seus objetivos da melhor forma!\n\nAproveita para começar ainda essa semana com a gente 🚀\nQualquer dúvida, estou por aqui 😊",
  mensagemNaoCompareceu:
    "Oie {aluno}\n\nAqui é a {colaboradora} da {academia}.\n\nFicamos te esperando para sua aula experimental, mas você não compareceu.\n\nQueremos remarcar para você conhecer a academia e já deixar um treino personalizado preparado para seus objetivos 😊\n\nVamos agendar ainda essa semana?",
  mensagemCancelou:
    "Olá, {aluno}! Tudo bem?\n\nAqui é a {colaboradora} da Prix.\n\nVi que você cancelou sua aula experimental que estava agendada. Que tal remarcarmos para hoje no mesmo horário? Será um prazer receber você!\n\nAguardo sua resposta.",
  mensagemDiaria:
    "Olá, {aluno}! Tudo bem?\n\nSua diária na {academia} está liberada para o dia *{data}*.\n\nQualquer dúvida, estamos à disposição.",
  mensagemDiariaUltimoDia:
    "Olá, {aluno}! Tudo bem?\n\nHoje é o último dia da sua diária na {academia}. Que tal conhecer nossos planos e continuar treinando com a gente?",
  mensagemDiariaConversao:
    "Olá, {aluno}! Tudo bem?\n\nVi que você fez diária conosco. Temos uma condição especial para você continuar treinando na {academia}.",
  mensagemNutriConfirmacao:
    "Olá, {aluno}! Tudo bem?\nPosso confirmar sua consulta com nossa nutricionista, dia *{data}* às *{horario}hs*?\n\nLembrando que a *tolerância de atraso é 10 minutos*, caso não consiga comparecer pedimos que avise com no mínimo 3 horas de antecedência, caso contrário a consulta será dada como feita.\n\n*Não é recomendado fazer exercícios físicos antes da consulta!*",
  mensagemNutriLembrete:
    "Olá, {aluno}! Tudo bem?\n\nPassando para lembrar da sua consulta com a nutricionista hoje às *{horario}hs*.\n\nNão recomendamos fazer exercícios físicos antes da consulta.",
  mensagemNutriCardapio:
    "Olá, {aluno}! Tudo bem?\nEstou te enviando o seu *cardápio* referente à consulta realizada em *{data}*.\n\nLembre-se: cada pequena escolha feita hoje é um passo em direção aos seus objetivos. Mantenha o foco, confie no processo e conte conosco nessa jornada de transformação!\n\nQualquer dúvida, estou à disposição para ajudar.\nAtenciosamente,\n{academia}",
  mensagemNutriBio:
    "Olá, {aluno}!\nSegue em anexo sua *Avaliação de Bioimpedância* referente ao atendimento do dia *{data}*.\n\nContinue firme nos seus objetivos! A consistência de hoje é o resultado de amanhã.\nQualquer dúvida, conte conosco.\n{academia}",
  mensagemNutriCardapioBio:
    "Olá, {aluno}! Tudo bem?\nSegue em anexo seu *cardápio* e sua *Avaliação de Bioimpedância* referentes ao atendimento do dia *{data}*.\n\nContinue firme nos seus objetivos! A consistência de hoje é o resultado de amanhã.\nQualquer dúvida, conte conosco.\n{academia}",
  mensagemNutriRetorno:
    "Olá, {aluno}! Tudo bem?\n\nSeu retorno com a nutricionista está previsto para *{data}* às *{horario}hs*.\n\nConte conosco!",
};

export default function ConfiguracoesPage() {
  const router = useRouter();

  const [usuarioLogado, setUsuarioLogado] = useState<any>(null);

  const [nomeAcademia, setNomeAcademia] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [metaMensal, setMetaMensal] = useState("");
  const [corSistema, setCorSistema] = useState("#1e3a8a");
  const [logo, setLogo] = useState("");

  const [mensagens, setMensagens] = useState<any>(mensagensPadrao);

  const adminGeral = usuarioLogado?.cargo === "ADMIN_GERAL";

  useEffect(() => {
    const usuario = localStorage.getItem("usuario");

    if (!usuario) {
      router.push("/login");
      return;
    }

    setUsuarioLogado(JSON.parse(usuario));
    carregarConfiguracoes();
  }, [router]);

  async function carregarConfiguracoes() {
    const unidadeId = pegarUnidadeAtual();

    if (!unidadeId) {
      alert("Selecione uma unidade no Dashboard");
      return;
    }

    const response = await fetch(`/api/configuracoes?unidadeId=${unidadeId}`, {
      cache: "no-store",
    });

    const data = await response.json();

    if (data.error) {
      alert(data.error);
      return;
    }

    setNomeAcademia(data.nomeAcademia || "");
    setTelefone(data.telefone || "");
    setEndereco(data.endereco || "");
    setMetaMensal(String(data.metaMensal || ""));
    setCorSistema(data.corSistema || "#1e3a8a");
    setLogo(data.logo || "");

    setMensagens({
      ...mensagensPadrao,
      mensagemConfirmacao: data.mensagemConfirmacao || mensagensPadrao.mensagemConfirmacao,
      mensagemLembrete: data.mensagemLembrete || mensagensPadrao.mensagemLembrete,
      mensagemPosAula: data.mensagemPosAula || mensagensPadrao.mensagemPosAula,
      mensagemNaoCompareceu: data.mensagemNaoCompareceu || mensagensPadrao.mensagemNaoCompareceu,
      mensagemCancelou: data.mensagemCancelou || mensagensPadrao.mensagemCancelou,
      mensagemDiaria: data.mensagemDiaria || mensagensPadrao.mensagemDiaria,
      mensagemDiariaUltimoDia: data.mensagemDiariaUltimoDia || mensagensPadrao.mensagemDiariaUltimoDia,
      mensagemDiariaConversao: data.mensagemDiariaConversao || mensagensPadrao.mensagemDiariaConversao,
      mensagemNutriConfirmacao: data.mensagemNutriConfirmacao || mensagensPadrao.mensagemNutriConfirmacao,
      mensagemNutriLembrete: data.mensagemNutriLembrete || mensagensPadrao.mensagemNutriLembrete,
      mensagemNutriCardapio: data.mensagemNutriCardapio || mensagensPadrao.mensagemNutriCardapio,
      mensagemNutriBio: data.mensagemNutriBio || mensagensPadrao.mensagemNutriBio,
      mensagemNutriCardapioBio: data.mensagemNutriCardapioBio || mensagensPadrao.mensagemNutriCardapioBio,
      mensagemNutriRetorno: data.mensagemNutriRetorno || mensagensPadrao.mensagemNutriRetorno,
    });
  }

  function atualizarMensagem(campo: string, valor: string) {
    setMensagens((atual: any) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  function restaurarPadrao(campo: string) {
    atualizarMensagem(campo, mensagensPadrao[campo] || "");
  }

  function escolherLogo(event: any) {
    const arquivo = event.target.files?.[0];

    if (!arquivo) return;

    const leitor = new FileReader();

    leitor.onloadend = () => {
      setLogo(String(leitor.result));
    };

    leitor.readAsDataURL(arquivo);
  }

  async function salvar() {
    const unidadeId = pegarUnidadeAtual();

    if (!unidadeId) {
      alert("Selecione uma unidade no Dashboard");
      return;
    }

    const response = await fetch("/api/configuracoes", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        unidadeId: Number(unidadeId),
        nomeAcademia,
        telefone,
        endereco,
        metaMensal,
        corSistema,
        logo,
        ...mensagens,
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      alert(data.error || "Erro ao salvar configurações");
      return;
    }

    alert("Configurações salvas!");
    window.dispatchEvent(new Event("unidadeAlterada"));
  }

  return (
    <main style={{ display: "flex", background: "#f3f4f6", minHeight: "100vh" }}>
      <Sidebar />

      <section style={{ flex: 1, padding: "40px" }}>
        <h1 style={{ fontSize: "55px", fontWeight: "bold", marginBottom: "30px" }}>
          Configurações
        </h1>

        <div style={{ background: "white", padding: "40px", borderRadius: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", maxWidth: "1100px" }}>
          <Campo label="Nome da Academia" value={nomeAcademia} setValue={setNomeAcademia} />
          <Campo label="Telefone" value={telefone} setValue={setTelefone} />
          <Campo label="Endereço" value={endereco} setValue={setEndereco} />
          <Campo label="Meta mensal de vendas" value={metaMensal} setValue={setMetaMensal} type="number" />

          <div style={{ marginBottom: "25px" }}>
            <label>Logo da Empresa</label>
            <input type="file" accept="image/*" onChange={escolherLogo} style={{ display: "block", marginTop: "10px" }} />

            {logo && (
              <div style={{ marginTop: "15px" }}>
                <img src={logo} alt="Logo" style={{ maxWidth: "220px", maxHeight: "140px", border: "1px solid #ddd", borderRadius: "10px", padding: "10px" }} />
              </div>
            )}
          </div>

          <div style={{ marginBottom: "30px" }}>
            <label>Cor do Sistema</label>
            <input type="color" value={corSistema} onChange={(e) => setCorSistema(e.target.value)} style={{ width: "100px", height: "50px", border: "none", marginTop: "10px", display: "block" }} />
          </div>

          {adminGeral && (
            <div style={{ marginTop: "35px", borderTop: "1px solid #e5e7eb", paddingTop: "30px" }}>
              <h2 style={{ fontSize: "30px", fontWeight: "bold", marginBottom: "10px" }}>
                Mensagens automáticas do WhatsApp
              </h2>

              <p style={{ color: "#6b7280", marginBottom: "25px" }}>
                Variáveis disponíveis: {"{aluno}"}, {"{colaboradora}"}, {"{vendedora}"}, {"{data}"}, {"{horario}"}, {"{modalidade}"}, {"{academia}"}, {"{endereco}"}, {"{telefone}"}, {"{plano}"}, {"{matricula}"}.
              </p>

              <SecaoMensagens titulo="Aulas Agendadas">
                <Mensagem label="Confirmação da aula" campo="mensagemConfirmacao" mensagens={mensagens} atualizarMensagem={atualizarMensagem} restaurarPadrao={restaurarPadrao} />
                <Mensagem label="Lembrete da aula" campo="mensagemLembrete" mensagens={mensagens} atualizarMensagem={atualizarMensagem} restaurarPadrao={restaurarPadrao} />
                <Mensagem label="Pós aula" campo="mensagemPosAula" mensagens={mensagens} atualizarMensagem={atualizarMensagem} restaurarPadrao={restaurarPadrao} />
                <Mensagem label="Não compareceu" campo="mensagemNaoCompareceu" mensagens={mensagens} atualizarMensagem={atualizarMensagem} restaurarPadrao={restaurarPadrao} />
                <Mensagem label="Cancelou" campo="mensagemCancelou" mensagens={mensagens} atualizarMensagem={atualizarMensagem} restaurarPadrao={restaurarPadrao} />
              </SecaoMensagens>

              <SecaoMensagens titulo="Diárias">
                <Mensagem label="Mensagem da diária" campo="mensagemDiaria" mensagens={mensagens} atualizarMensagem={atualizarMensagem} restaurarPadrao={restaurarPadrao} />
                <Mensagem label="Último dia da diária" campo="mensagemDiariaUltimoDia" mensagens={mensagens} atualizarMensagem={atualizarMensagem} restaurarPadrao={restaurarPadrao} />
                <Mensagem label="Conversão da diária" campo="mensagemDiariaConversao" mensagens={mensagens} atualizarMensagem={atualizarMensagem} restaurarPadrao={restaurarPadrao} />
              </SecaoMensagens>

              <SecaoMensagens titulo="Agenda Nutricionista">
                <Mensagem label="Confirmação da consulta" campo="mensagemNutriConfirmacao" mensagens={mensagens} atualizarMensagem={atualizarMensagem} restaurarPadrao={restaurarPadrao} />
                <Mensagem label="Lembrete da consulta" campo="mensagemNutriLembrete" mensagens={mensagens} atualizarMensagem={atualizarMensagem} restaurarPadrao={restaurarPadrao} />
                <Mensagem label="Envio de cardápio" campo="mensagemNutriCardapio" mensagens={mensagens} atualizarMensagem={atualizarMensagem} restaurarPadrao={restaurarPadrao} />
                <Mensagem label="Envio de bioimpedância" campo="mensagemNutriBio" mensagens={mensagens} atualizarMensagem={atualizarMensagem} restaurarPadrao={restaurarPadrao} />
                <Mensagem label="Cardápio + Bioimpedância" campo="mensagemNutriCardapioBio" mensagens={mensagens} atualizarMensagem={atualizarMensagem} restaurarPadrao={restaurarPadrao} />
                <Mensagem label="Retorno nutricionista" campo="mensagemNutriRetorno" mensagens={mensagens} atualizarMensagem={atualizarMensagem} restaurarPadrao={restaurarPadrao} />
              </SecaoMensagens>
            </div>
          )}

          <button onClick={salvar} style={{ background: "#16a34a", color: "white", border: "none", padding: "15px 30px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", fontSize: "18px", marginTop: "20px" }}>
            Salvar Configurações
          </button>
        </div>
      </section>
    </main>
  );
}

function Campo({ label, value, setValue, type = "text" }: any) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <label>{label}</label>
      <input type={type} value={value} onChange={(e) => setValue(e.target.value)} style={input} />
    </div>
  );
}

function SecaoMensagens({ titulo, children }: any) {
  return (
    <div style={{ marginBottom: "35px", border: "1px solid #e5e7eb", borderRadius: "18px", padding: "22px", background: "#fafafa" }}>
      <h3 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px" }}>{titulo}</h3>
      {children}
    </div>
  );
}

function Mensagem({ label, campo, mensagens, atualizarMensagem, restaurarPadrao }: any) {
  return (
    <div style={{ marginBottom: "25px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "15px", marginBottom: "8px" }}>
        <label style={{ display: "block", fontWeight: "bold" }}>{label}</label>
        <button type="button" onClick={() => restaurarPadrao(campo)} style={{ border: "1px solid #d1d5db", background: "white", borderRadius: "8px", padding: "7px 10px", fontWeight: "bold", cursor: "pointer" }}>
          Restaurar padrão
        </button>
      </div>

      <textarea value={mensagens[campo] || ""} onChange={(e) => atualizarMensagem(campo, e.target.value)} style={{ width: "100%", height: "140px", borderRadius: "10px", border: "1px solid #d1d5db", padding: "15px", fontSize: "15px", whiteSpace: "pre-wrap" }} />
    </div>
  );
}

const input = {
  width: "100%",
  padding: "15px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  marginTop: "10px",
  fontSize: "16px",
};
