"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";

export default function AulasPage() {
  const router = useRouter();

  const [aulas, setAulas] = useState<any[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [busca, setBusca] = useState("");
  const [dataInicialFiltro, setDataInicialFiltro] = useState("");
  const [dataFinalFiltro, setDataFinalFiltro] = useState("");
  const [filtroColaboradora, setFiltroColaboradora] = useState("");

  const [nomeAluno, setNomeAluno] = useState("");
  const [telefone, setTelefone] = useState("");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [dataOriginal, setDataOriginal] = useState("");
  const [dataRemarcada, setDataRemarcada] = useState("");
  const [remarcadoPor, setRemarcadoPor] = useState("");
  const [modalidade, setModalidade] = useState("MUSCULAÇÃO");
  const [colaboradora, setColaboradora] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [veio, setVeio] = useState(false);
  const [faltou, setFaltou] = useState(false);
  const [remarcou, setRemarcou] = useState(false);
  const [cancelou, setCancelou] = useState(false);
  const [posAulaRealizado, setPosAulaRealizado] = useState(false);
  const [vendaEfetivada, setVendaEfetivada] = useState(false);
  const [codigoMatricula, setCodigoMatricula] = useState("");

  const [planoFechado, setPlanoFechado] = useState("");
  const [vendedora, setVendedora] = useState("");
  const [dataConversao, setDataConversao] = useState("");
  const [tipoAluno, setTipoAluno] = useState("NOVO");

  const [configuracao, setConfiguracao] = useState<any>(null);

  useEffect(() => {
    const usuario = localStorage.getItem("usuario");

    if (!usuario) {
      router.push("/login");
      return;
    }

    carregarAulas();
    carregarConfiguracoes();
  }, [router]);

  async function carregarAulas() {
    const unidadeId = localStorage.getItem("unidadeSelecionadaId");

    if (!unidadeId) {
      alert("Selecione uma unidade no Dashboard");
      router.push("/");
      return;
    }

    const response = await fetch(`/api/aulas?unidadeId=${unidadeId}`, {
      cache: "no-store",
    });

    const data = await response.json();
    setAulas(Array.isArray(data) ? data : []);
  }

  async function carregarConfiguracoes() {
    const usuarioLogado = JSON.parse(localStorage.getItem("usuario") || "{}");
    const unidadeId =
      usuarioLogado.cargo === "ADMIN_GERAL"
        ? localStorage.getItem("unidadeSelecionadaId")
        : String(usuarioLogado.unidadeId || localStorage.getItem("unidadeSelecionadaId") || "");

    if (!unidadeId) return;

    try {
      const response = await fetch(`/api/configuracoes?unidadeId=${unidadeId}`, {
        cache: "no-store",
      });

      const dataConfig = await response.json();

      if (!dataConfig?.error) {
        setConfiguracao(dataConfig);
      }
    } catch (error) {
      console.log("Erro ao carregar mensagens configuradas:", error);
    }
  }


  function somenteNumeros(valor: string) {
    return valor.replace(/\D/g, "");
  }

  function formatarTelefone(valor: string) {
    const numeros = somenteNumeros(valor).slice(0, 11);

    if (numeros.length <= 2) return numeros;
    if (numeros.length <= 7) {
      return `(${numeros.slice(0, 2)})${numeros.slice(2)}`;
    }

    return `(${numeros.slice(0, 2)})${numeros.slice(2, 7)}-${numeros.slice(7)}`;
  }

  function telefoneValido(valor: string) {
    const numeros = somenteNumeros(valor);
    return numeros.length === 10 || numeros.length === 11;
  }

  function normalizarNome(nome: string) {
    return nome
      .trim()
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ");
  }

  function verificarAulaDuplicada() {
    const telefoneAtual = somenteNumeros(telefone);
    const nomeAtual = normalizarNome(nomeAluno);

    if (!telefoneAtual && !nomeAtual) return null;

    return aulas.find((aula) => {
      if (editandoId && aula.id === editandoId) return false;

      const telefoneAula = somenteNumeros(aula.telefone || "");
      const nomeAula = normalizarNome(aula.nomeAluno || "");

      const mesmoTelefone =
        telefoneAtual.length >= 10 &&
        telefoneAula.length >= 10 &&
        telefoneAula === telefoneAtual;

      const mesmoNome =
        nomeAtual.length >= 5 &&
        nomeAula.length >= 5 &&
        nomeAula === nomeAtual;

      return mesmoTelefone || mesmoNome;
    });
  }

  function limparFormulario() {
    setEditandoId(null);
    setNomeAluno("");
    setTelefone("");
    setData("");
    setHorario("");
    setDataOriginal("");
    setDataRemarcada("");
    setRemarcadoPor("");
    setModalidade("MUSCULAÇÃO");
    setColaboradora("");
    setObservacoes("");
    setVeio(false);
    setFaltou(false);
    setRemarcou(false);
    setCancelou(false);
    setPosAulaRealizado(false);
    setVendaEfetivada(false);
    setCodigoMatricula("");
    setPlanoFechado("");
    setVendedora("");
    setDataConversao("");
    setTipoAluno("NOVO");
    setSalvando(false);
  }

  function statusAtual() {
    if (vendaEfetivada) return "VENDA EFETIVADA";
    if (veio) return "COMPARECEU";
    if (faltou) return "FALTOU";
    if (cancelou) return "CANCELOU";
    if (remarcou) return "REMARCADO";
    return "AGENDADA";
  }

  function corStatus(status: string) {
    const s = (status || "AGENDADA").toUpperCase();

    if (s === "VENDA EFETIVADA") return "#16a34a";
    if (s === "COMPARECEU") return "#2563eb";
    if (s === "FALTOU") return "#dc2626";
    if (s === "CANCELOU") return "#9333ea";
    if (s === "REMARCOU" || s === "REMARCADO") return "#dc2626";

    return "#d97706";
  }

  async function salvarAula() {
    if (salvando) return;

    const unidadeId = localStorage.getItem("unidadeSelecionadaId");

    if (!unidadeId) {
      alert("Selecione uma unidade no Dashboard");
      return;
    }

    if (!telefoneValido(telefone)) {
      alert("Telefone inválido. Preencha no formato (XX)XXXXX-XXXX.");
      return;
    }

    const aulaDuplicada = verificarAulaDuplicada();

    if (aulaDuplicada) {
      const continuar = confirm(
        `Atenção!\n\nEste aluno já possui uma aula experimental cadastrada:\n\n` +
          `Nome: ${aulaDuplicada.nomeAluno || "-"}\n` +
          `Data: ${formatarData(aulaDuplicada.data)}\n` +
          `Modalidade: ${aulaDuplicada.modalidade || "-"}\n` +
          `Status: ${aulaDuplicada.status || "AGENDADA"}\n\n` +
          `Deseja continuar mesmo assim?`
      );

      if (!continuar) return;
    }

    setSalvando(true);

    try {
      const usuarioLogado = JSON.parse(
  localStorage.getItem("usuario") || "{}"
);
      const novaDataRemarcada = remarcou ? dataRemarcada : "";
      const dataAnteriorRemarcacao = remarcou ? (dataOriginal || data) : "";
      const dados = {
  usuarioId: usuarioLogado.id,
  usuarioNome: usuarioLogado.nome,
  usuarioCargo: usuarioLogado.cargo,

  id: editandoId,
  unidadeId: Number(unidadeId),

  nomeAluno: nomeAluno.trim().toUpperCase(),
  telefone: formatarTelefone(telefone.trim()),
  data: novaDataRemarcada || data,
  horario,
  dataOriginal: dataAnteriorRemarcacao,
  dataRemarcada: novaDataRemarcada,
  remarcadoPor: remarcou ? remarcadoPor.trim().toUpperCase() : "",
  modalidade,
  colaboradora: colaboradora.trim().toUpperCase(),
  observacoes: observacoes.trim().toUpperCase(),

  veio,
  faltou,
  remarcou,
  cancelou,
  posAulaRealizado,
  vendaEfetivada,

  codigoMatricula: codigoMatricula.trim(),

  status: statusAtual(),

  planoFechado,
  vendedora: vendedora.trim().toUpperCase(),
  dataConversao,
  tipoAluno,
};

      const response = await fetch("/api/aulas", {
        method: editandoId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dados),
      });

      if (!response.ok) {
        alert("Erro ao salvar aula");
        setSalvando(false);
        return;
      }

      await carregarAulas();
      limparFormulario();
      setMostrarFormulario(false);
    } catch (error) {
      alert("Erro ao salvar aula");
      setSalvando(false);
    }
  }

  function editarAula(aula: any) {
    setEditandoId(aula.id);
    setNomeAluno(aula.nomeAluno || "");
    setTelefone(formatarTelefone(aula.telefone || ""));
    setData(aula.data || "");
    setHorario(aula.horario || "");
    setDataOriginal(aula.dataOriginal || "");
    setDataRemarcada(aula.dataRemarcada || "");
    setRemarcadoPor(aula.remarcadoPor || "");
    setModalidade(aula.modalidade || "MUSCULAÇÃO");
    setColaboradora(aula.colaboradora || "");
    setObservacoes(aula.observacoes || "");
    setVeio(Boolean(aula.veio));
    setFaltou(Boolean(aula.faltou));
    setRemarcou(Boolean(aula.remarcou));
    setCancelou(Boolean(aula.cancelou) || String(aula.status || "").toUpperCase() === "CANCELOU");
    setPosAulaRealizado(Boolean(aula.posAulaRealizado));
    setVendaEfetivada(Boolean(aula.vendaEfetivada));
    setCodigoMatricula(aula.codigoMatricula || "");
    setPlanoFechado(aula.planoFechado || "");
    setVendedora(aula.vendedora || "");
    setDataConversao(aula.dataConversao || "");
    setTipoAluno(aula.tipoAluno || "NOVO");
    setMostrarFormulario(true);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function excluirAula(id: number) {
  if (!confirm("Deseja excluir esta aula?")) return;

  const usuarioLogado = JSON.parse(
    localStorage.getItem("usuario") || "{}"
  );

  await fetch("/api/aulas", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id,

      usuarioId: usuarioLogado.id,
      usuarioNome: usuarioLogado.nome,
      usuarioCargo: usuarioLogado.cargo,
    }),
  });

  await carregarAulas();
}

  function primeiroNome(nome: string) {
    if (!nome) return "";
    const primeiro = nome.trim().split(" ")[0].toLowerCase();
    return primeiro.charAt(0).toUpperCase() + primeiro.slice(1);
  }

  function formatarData(dataISO: string) {
    if (!dataISO) return "";
    if (dataISO.includes("/")) return dataISO;

    const partes = dataISO.split("-");
    if (partes.length !== 3) return dataISO;

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }


  function aplicarModeloMensagem(modelo: string, dadosExtras: any = {}) {
    const academia = configuracao?.nomeAcademia || "PRIX ACADEMIA";
    const enderecoAcademia =
      configuracao?.endereco || "Avenida Irmãos Pereira, 251 - Esquina com o posto Flex";

    const variaveis: any = {
      aluno: primeiroNome(nomeAluno),
      colaboradora: primeiroNome(colaboradora),
      vendedora: primeiroNome(vendedora),
      data: formatarData(data),
      horario,
      modalidade,
      academia,
      endereco: enderecoAcademia,
      telefone,
      plano: planoFechado,
      matricula: codigoMatricula,
      ...dadosExtras,
    };

    let mensagem = modelo || "";

    Object.entries(variaveis).forEach(([chave, valor]) => {
      mensagem = mensagem.replace(
        new RegExp(`{${chave}}`, "g"),
        String(valor || "")
      );
    });

    return mensagem;
  }

  function mensagemPadraoAula(tipo: string) {
    if (tipo === "confirmacao") {
      return `Oie {aluno}, tudo bem?

Sua aula experimental foi agendada pela atendente *{colaboradora}*.

Data: *{data}*
Horário: *{horario}*
Modalidade: *{modalidade}*

Te esperamos por aqui!

*{academia}*
{endereco}`;
    }

    if (tipo === "lembrete") {
      return `Oie {aluno}, tudo bem?

Passando para te lembrar que sua aula experimental é *Hoje*.

Horário: *{horario}*
Modalidade: *{modalidade}*

Estamos te esperando! Venha com roupa confortável, tênis e sua garrafinha de água para aproveitar ao máximo seu treino experimental!

*{colaboradora}*

*{academia}*
{endereco}`;
    }

    if (tipo === "pos") {
      return `Oie {aluno}, tudo bem?

Aqui é a {colaboradora} da {academia}.

Queria saber se gostou da sua aula experimental 😊

Montamos uma ficha de treino personalizada para te ajudar a alcançar seus objetivos da melhor forma!

Aproveita para começar ainda essa semana com a gente 🚀
Qualquer dúvida, estou por aqui 😊`;
    }

    if (tipo === "nao") {
      return `Oie {aluno}

Aqui é a {colaboradora} da {academia}.

Ficamos te esperando para sua aula experimental, mas você não compareceu.

Queremos remarcar para você conhecer a academia e já deixar um treino personalizado preparado para seus objetivos 😊

Vamos agendar ainda essa semana?`;
    }

    if (tipo === "cancelou") {
      return `Olá, {aluno}! Tudo bem?

Aqui é a {colaboradora} da Prix.

Vi que você cancelou sua aula experimental que estava agendada. Que tal remarcarmos para hoje no mesmo horário? Será um prazer receber você!

Aguardo sua resposta.`;
    }

    return "";
  }

  function mensagemConfiguradaAula(tipo: string) {
    const mapa: any = {
      confirmacao: "mensagemConfirmacao",
      lembrete: "mensagemLembrete",
      pos: "mensagemPosAula",
      nao: "mensagemNaoCompareceu",
      cancelou: "mensagemCancelou",
    };

    const campo = mapa[tipo];
    return configuracao?.[campo] || mensagemPadraoAula(tipo);
  }

  function abrirWhatsApp(tipo: string) {
    const numero = telefone.replace(/\D/g, "");

    if (!telefoneValido(telefone)) {
      alert("Preencha um telefone válido antes de abrir o WhatsApp");
      return;
    }

    const modelo = mensagemConfiguradaAula(tipo);
    const mensagem = aplicarModeloMensagem(modelo);

    window.open(
      `https://wa.me/55${numero}?text=${encodeURIComponent(mensagem)}`,
      "_blank"
    );
  }

  const colaboradorasUnicas = Array.from(
    new Set(
      aulas
        .map((aula) => aula.colaboradora)
        .filter(Boolean)
        .map((nome) => String(nome).toUpperCase())
    )
  ).sort();

  const aulasFiltradas = aulas.filter((aula) => {
    const termo = busca.toUpperCase();

    const bateBusca =
      aula.nomeAluno?.toUpperCase().includes(termo) ||
      aula.telefone?.includes(busca) ||
      aula.modalidade?.toUpperCase().includes(termo) ||
      aula.status?.toUpperCase().includes(termo) ||
      aula.colaboradora?.toUpperCase().includes(termo) ||
      aula.vendedora?.toUpperCase().includes(termo) ||
      aula.planoFechado?.toUpperCase().includes(termo) ||
      aula.tipoAluno?.toUpperCase().includes(termo);

    const bateColaboradora =
      !filtroColaboradora ||
      aula.colaboradora?.toUpperCase() === filtroColaboradora.toUpperCase();

    const bateDataInicial =
      !dataInicialFiltro || aula.data >= dataInicialFiltro;

    const bateDataFinal = !dataFinalFiltro || aula.data <= dataFinalFiltro;

    return bateBusca && bateColaboradora && bateDataInicial && bateDataFinal;
  }).sort((aulaA, aulaB) => {
    const dataA = `${aulaA.data || ""} ${aulaA.horario || "00:00"}`;
    const dataB = `${aulaB.data || ""} ${aulaB.horario || "00:00"}`;

    return dataB.localeCompare(dataA);
  });

  return (
    <main className="min-h-screen flex bg-gray-100">
      <Sidebar />

      <section className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Aulas Agendadas
          </h1>

          <button
            onClick={() => {
              limparFormulario();
              setMostrarFormulario(true);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="bg-blue-900 text-white px-5 py-3 rounded-xl font-bold"
          >
            AGENDAR
          </button>
        </div>

        {mostrarFormulario && (
          <div className="bg-white p-5 rounded-2xl shadow mb-6">
            <h2 className="text-2xl font-bold mb-5">
              {editandoId ? "Editar Aula" : "Cadastrar Aula"}
            </h2>

            <div className="flex gap-3 mb-6 flex-wrap">
              <button type="button" onClick={() => abrirWhatsApp("confirmacao")} className="border-4 border-blue-600 text-blue-600 px-4 py-2 rounded-xl font-bold">
                CONFIRMAÇÃO
              </button>

              <button type="button" onClick={() => abrirWhatsApp("lembrete")} className="border-4 border-yellow-500 text-yellow-500 px-4 py-2 rounded-xl font-bold">
                LEMBRETE
              </button>

              <button type="button" onClick={() => abrirWhatsApp("pos")} className="border-4 border-green-600 text-green-600 px-4 py-2 rounded-xl font-bold">
                PÓS AULA
              </button>

              <button type="button" onClick={() => abrirWhatsApp("nao")} className="border-4 border-red-600 text-red-600 px-4 py-2 rounded-xl font-bold">
                NÃO COMPARECEU
              </button>

              <button type="button" onClick={() => abrirWhatsApp("cancelou")} className="border-4 border-purple-600 text-purple-600 px-4 py-2 rounded-xl font-bold">
                CANCELOU
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input label="Nome do aluno" value={nomeAluno} setValue={setNomeAluno} />

              <div>
                <label className="block mb-2">Telefone</label>
                <input
                  type="text"
                  value={telefone}
                  maxLength={14}
                  onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                  placeholder="(44)99999-9999"
                  className="w-full border rounded-xl p-3"
                />
              </div>

              <Input label="Data da aula" value={data} setValue={setData} type="date" />
              <Input label="Horário" value={horario} setValue={setHorario} type="time" />

              <Select label="Modalidade" value={modalidade} setValue={setModalidade}>
                <option value="MUSCULAÇÃO">MUSCULAÇÃO</option>
                <option value="PUMP">PUMP</option>
                <option value="GAP">GAP</option>
                <option value="BOXE">BOXE</option>
                <option value="JIU-JITSU">JIU-JITSU</option>
                <option value="FUNCIONAL">FUNCIONAL</option>
                <option value="RITMOS">RITMOS</option>
                <option value="P-COMBAT">P-COMBAT</option>
              </Select>

              <Input label="Colaboradora" value={colaboradora} setValue={setColaboradora} />

              <Select label="Plano fechado" value={planoFechado} setValue={setPlanoFechado}>
                <option value="">Selecione</option>
                <option value="MENSAL">MENSAL</option>
                <option value="TRIMESTRAL">TRIMESTRAL</option>
                <option value="SEMESTRAL">SEMESTRAL</option>
                <option value="ANUAL">ANUAL</option>
                <option value="OUTRO">OUTRO</option>
              </Select>

              <Input label="Vendedora" value={vendedora} setValue={setVendedora} />

              <Input
                label="Data de conversão"
                value={dataConversao}
                setValue={setDataConversao}
                type="date"
              />

              <Select label="Tipo do aluno" value={tipoAluno} setValue={setTipoAluno}>
                <option value="NOVO">NOVO</option>
                <option value="RETORNO">RETORNO</option>
                <option value="RENOVAÇÃO">RENOVAÇÃO</option>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mt-5">
              <Check label="Veio" checked={veio} setChecked={setVeio} />
              <Check label="Faltou" checked={faltou} setChecked={setFaltou} />
              <Check label="Cancelou" checked={cancelou} setChecked={setCancelou} />
              <Check label="Remarcou" checked={remarcou} setChecked={setRemarcou} />
              <Check label="Contato pós aula" checked={posAulaRealizado} setChecked={setPosAulaRealizado} />
              <Check label="Venda efetivada" checked={vendaEfetivada} setChecked={setVendaEfetivada} />
            </div>

            {remarcou && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
                <h3 className="mb-3 text-lg font-black text-red-700">Dados da remarcação</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Data anterior"
                    value={dataOriginal || data}
                    setValue={setDataOriginal}
                    type="date"
                  />

                  <Input
                    label="Nova data da aula"
                    value={dataRemarcada}
                    setValue={setDataRemarcada}
                    type="date"
                  />

                  <Input
                    label="Quem remarcou"
                    value={remarcadoPor}
                    setValue={setRemarcadoPor}
                  />
                </div>

                <p className="mt-3 text-sm font-semibold text-red-700">
                  Ao salvar, a aula ficará agendada para a nova data e a data anterior ficará registrada no histórico da linha.
                </p>
              </div>
            )}

            <div className="mt-5">
              <label className="block mb-2 font-semibold">
                Código da Matrícula
              </label>

              <input
                type="text"
                maxLength={8}
                value={codigoMatricula}
                onChange={(e) => setCodigoMatricula(e.target.value)}
                className="w-48 border rounded-xl p-3"
              />
            </div>

            <div className="mt-5">
              <label className="block mb-2">Observações</label>

              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="w-full border rounded-xl p-3 h-28"
              />
            </div>

            <div className="flex gap-4 mt-5">
              <button
                onClick={salvarAula}
                disabled={salvando}
                className={`px-6 py-3 rounded-xl font-bold text-white ${
                  salvando ? "bg-gray-400 cursor-not-allowed" : "bg-blue-900"
                }`}
              >
                {salvando
                  ? "Salvando..."
                  : editandoId
                  ? "Salvar Edição"
                  : "Salvar Aula"}
              </button>

              <button
                onClick={() => {
                  limparFormulario();
                  setMostrarFormulario(false);
                }}
                disabled={salvando}
                className="bg-gray-500 text-white px-6 py-3 rounded-xl font-bold"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="bg-white p-5 rounded-2xl shadow mb-8">
          <div className="flex flex-wrap justify-between items-end gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-3">Aulas Agendadas</h2>

              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por aluno, telefone, modalidade, status, plano, vendedora..."
                className="border rounded-xl p-3 w-96 max-w-full"
              />
            </div>

            <div className="flex gap-3 flex-wrap">
              <div>
                <label className="block mb-1 font-semibold">Colaboradora</label>
                <select
                  value={filtroColaboradora}
                  onChange={(e) => setFiltroColaboradora(e.target.value)}
                  className="border rounded-xl p-3"
                >
                  <option value="">Todas</option>
                  {colaboradorasUnicas.map((nome) => (
                    <option key={nome} value={nome}>
                      {nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 font-semibold">Data início</label>
                <input
                  type="date"
                  value={dataInicialFiltro}
                  onChange={(e) => setDataInicialFiltro(e.target.value)}
                  className="border rounded-xl p-3"
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold">Data fim</label>
                <input
                  type="date"
                  value={dataFinalFiltro}
                  onChange={(e) => setDataFinalFiltro(e.target.value)}
                  className="border rounded-xl p-3"
                />
              </div>

              <button
                onClick={() => {
                  setBusca("");
                  setFiltroColaboradora("");
                  setDataInicialFiltro("");
                  setDataFinalFiltro("");
                }}
                className="bg-gray-500 text-white px-5 py-3 rounded-xl font-bold self-end"
              >
                Limpar
              </button>
            </div>
          </div>

          <div className="overflow-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left">Aluno</th>
                  <th className="p-3 text-left">Data</th>
                  <th className="p-3 text-left">Horário</th>
                  <th className="p-3 text-left">Modalidade</th>
                  <th className="p-3 text-left">Colaboradora</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Ações</th>
                </tr>
              </thead>

              <tbody>
                {aulasFiltradas.map((aula) => (
                  <tr key={aula.id} className="border-b">
                    <td className="p-3">{aula.nomeAluno}</td>
                    <td className="p-3">
                      <div className="font-semibold">{formatarData(aula.data)}</div>

                      {(aula.dataOriginal || aula.dataRemarcada || aula.remarcadoPor) && (
                        <div className="mt-1 rounded-lg bg-red-50 p-2 text-xs font-semibold text-red-700">
                          {aula.dataOriginal && (
                            <div>Data anterior: {formatarData(aula.dataOriginal)}</div>
                          )}
                          {aula.dataRemarcada && (
                            <div>Nova data: {formatarData(aula.dataRemarcada)}</div>
                          )}
                          {aula.remarcadoPor && <div>Remarcado por: {aula.remarcadoPor}</div>}
                        </div>
                      )}
                    </td>
                    <td className="p-3">{aula.horario}</td>
                    <td className="p-3">{aula.modalidade}</td>
                    <td className="p-3">{aula.colaboradora || "-"}</td>
                    <td
                      className="p-3 font-bold"
                      style={{ color: corStatus(aula.status) }}
                    >
                      {aula.status || "AGENDADA"}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => editarAula(aula)}
                          className="bg-yellow-500 text-white px-3 py-2 rounded-lg text-sm"
                        >
                          Editar
                        </button>

                        <button
                          onClick={() => excluirAula(aula.id)}
                          className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {aulasFiltradas.length === 0 && (
                  <tr>
                    <td className="p-4 text-gray-500" colSpan={7}>
                      Nenhuma aula encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}

function Input({ label, value, setValue, type = "text" }: any) {
  return (
    <div>
      <label className="block mb-2">{label}</label>

      <input
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full border rounded-xl p-3"
      />
    </div>
  );
}

function Select({ label, value, setValue, children }: any) {
  return (
    <div>
      <label className="block mb-2">{label}</label>

      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full border rounded-xl p-3"
      >
        {children}
      </select>
    </div>
  );
}

function Check({ label, checked, setChecked }: any) {
  return (
    <label className="flex items-center gap-3 bg-gray-100 p-3 rounded-xl font-bold">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
      />

      {label}
    </label>
  );
}