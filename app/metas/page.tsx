"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  FaEye,
  FaEdit,
  FaTrash,
  FaCog,
  FaBullseye,
  FaBuilding,
  FaMoneyBillWave,
  FaRocket,
  FaBullhorn,
  FaTrophy,
  FaMedal,
  FaGem,
  FaCheckCircle,
  FaLock,
  FaSearch,
  FaEraser,
  FaCalendarAlt,
  FaFileContract,
  FaUserPlus,
  FaSyncAlt,
  FaRedoAlt,
  FaRegFileAlt,
  FaCross,
} from "react-icons/fa";

import {
  MdOutlineTrendingUp,
  MdOutlineAssignment,
} from "react-icons/md";

export default function MetasPage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<any>(null);
  const [dados, setDados] = useState<any>(null);
  const [dashboardMetas, setDashboardMetas] = useState<any>({
    totalAulas: 0,
    aulasHoje: 0,
    totalCompareceu: 0,
    totalFaltou: 0,
    taxaComparecimento: 0,
    taxaConversao: 0,
    vendasEfetivadas: 0,
    diariasAtivas: 0,
    totalDiarias: 0,
    modalidades: {},
    aulasPorColaboradora: {},
    vendasPorVendedora: {},
    conversaoAgendouVendeu: [],
  });
  const [metaPessoal, setMetaPessoal] = useState(40);
  const [abrirMetaPessoal, setAbrirMetaPessoal] = useState(false);
  const [contratoVisualizar, setContratoVisualizar] = useState<any>(null);

  const [mesFiltro, setMesFiltro] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const [filtroDividido, setFiltroDividido] = useState("TODOS");
  const [filtroDivididoCom, setFiltroDivididoCom] = useState("TODOS");
  const [filtroVendedora, setFiltroVendedora] = useState("TODAS");
  const [pesquisaContrato, setPesquisaContrato] = useState("");
  const [filtroDataInicialContrato, setFiltroDataInicialContrato] = useState("");
  const [filtroDataFinalContrato, setFiltroDataFinalContrato] = useState("");
  const [dataInicialContratoTemp, setDataInicialContratoTemp] = useState("");
  const [dataFinalContratoTemp, setDataFinalContratoTemp] = useState("");

  const [pinLiberado, setPinLiberado] = useState(false);
  const [mostrarPin, setMostrarPin] = useState(false);
  const [pinValor, setPinValor] = useState("");
  const [validandoPin, setValidandoPin] = useState(false);
  const [mostrarSenhaPin, setMostrarSenhaPin] = useState(false);

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem("usuario");

    if (!usuarioSalvo) {
      router.push("/login");
      return;
    }

    const user = JSON.parse(usuarioSalvo);
    const cargo = String(user?.cargo || "").toUpperCase();

    setUsuario(user);

    if (cargo === "ADMIN_GERAL") {
      setPinLiberado(true);
      carregarMetas(user, mesFiltro);
      return;
    }

    const validade = Number(localStorage.getItem(`metasPinLiberado_${user.id}`) || 0);

    if (validade && Date.now() < validade) {
      setPinLiberado(true);
      carregarMetas(user, mesFiltro);
      return;
    }

    localStorage.removeItem(`metasPinLiberado_${user.id}`);
    setMostrarPin(true);
  }, []);

  function unidadeAtual(userParam?: any) {
    const user = userParam || usuario;

    return user?.cargo === "ADMIN_GERAL"
      ? localStorage.getItem("unidadeSelecionadaId")
      : String(user?.unidadeId || "");
  }

  function podeGerenciar() {
    const cargo = String(usuario?.cargo || "").toUpperCase();

    return cargo === "ADMIN_GERAL";
  }

  function datasDoMes(mesReferencia: string) {
    const [ano, mes] = mesReferencia.split("-");
    const ultimoDia = new Date(Number(ano), Number(mes), 0).getDate();

    return {
      inicio: `${ano}-${mes}-01`,
      fim: `${ano}-${mes}-${String(ultimoDia).padStart(2, "0")}`,
    };
  }

  async function confirmarPinMetas() {
    if (!usuario) return;

    const pin = String(pinValor || "").trim();

    if (!/^\d{4}$/.test(pin)) {
      alert("Digite o PIN com 4 números.");
      return;
    }

    try {
      setValidandoPin(true);

      const response = await fetch("/api/metas/validar-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuarioId: usuario.id,
          pin,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        alert(data.error || "PIN incorreto.");
        return;
      }

      const quatroHoras = 4 * 60 * 60 * 1000;
      localStorage.setItem(
        `metasPinLiberado_${usuario.id}`,
        String(Date.now() + quatroHoras)
      );

      setPinValor("");
      setMostrarPin(false);
      setPinLiberado(true);
      carregarMetas(usuario, mesFiltro);
    } catch (error) {
      console.log(error);
      alert("Erro ao validar PIN das metas.");
    } finally {
      setValidandoPin(false);
    }
  }


  async function carregarMetas(userParam?: any, mesParam?: string) {
    const user = userParam || usuario;
    const unidadeId = unidadeAtual(user);

    if (!unidadeId) {
      alert("Selecione uma unidade no Dashboard");
      router.push("/");
      return;
    }

    const datas = datasDoMes(mesParam || mesFiltro);

    const params = new URLSearchParams();
    params.append("unidadeId", unidadeId);
    params.append("usuarioId", String(user?.id || ""));
    params.append("usuarioNome", user?.nome || "");
    params.append("usuarioCargo", String(user?.cargo || ""));
    params.append("dataInicial", datas.inicio);
    params.append("dataFinal", datas.fim);

    const response = await fetch(`/api/metas?${params.toString()}`, {
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Erro ao carregar metas");
      return;
    }

    setDados(data);
    setMetaPessoal(Number(data.metaPessoal || 40));

    // Carrega os mesmos dados do Dashboard Comercial
    // para preencher Aulas Experimentais, Comparecimento, Faltas e Conversão
    if (String(user?.cargo || "").toUpperCase() === "ADMIN_GERAL") {
      try {
        const dashResponse = await fetch(
          `/api/dashboard?unidadeId=${unidadeId}&mes=${mesParam || mesFiltro}`,
          { cache: "no-store" }
        );

        const dashData = await dashResponse.json();

        setDashboardMetas({
          totalAulas: dashData.totalAulas || 0,
          aulasHoje: dashData.aulasHoje || 0,
          totalCompareceu: dashData.totalCompareceu || 0,
          totalFaltou: dashData.totalFaltou || 0,
          taxaComparecimento: dashData.taxaComparecimento || 0,
          taxaConversao: dashData.taxaConversao || 0,
          vendasEfetivadas: dashData.vendasEfetivadas || 0,
          diariasAtivas: dashData.diariasAtivas || 0,
          totalDiarias: dashData.totalDiarias || 0,
          modalidades: dashData.modalidades || {},
          aulasPorColaboradora: dashData.aulasPorColaboradora || {},
          vendasPorVendedora: dashData.vendasPorVendedora || {},
          conversaoAgendouVendeu: dashData.conversaoAgendouVendeu || [],
        });
      } catch (error) {
        console.log("Erro ao carregar dados do dashboard comercial:", error);
      }
    }
  }

  async function salvarMetaPessoal(novaMeta: number) {
    const unidadeId = unidadeAtual();

    const response = await fetch("/api/metas/pessoal", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        unidadeId,
        usuarioId: usuario?.id,
        usuarioNome: usuario?.nome,
        meta: novaMeta,
      }),
    });

    if (!response.ok) {
      alert("Erro ao salvar meta pessoal");
      return;
    }

    setMetaPessoal(Number(novaMeta));
    setAbrirMetaPessoal(false);

    alert("Meta pessoal salva com sucesso!");
    carregarMetas();
  }

  async function excluirContrato(id: number) {
    if (!confirm("Deseja excluir este contrato?")) return;

    const response = await fetch("/api/metas/contratos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      alert("Erro ao excluir contrato");
      return;
    }

    carregarMetas();
  }

  function editarContrato(contrato: any) {
    localStorage.setItem("contratoEditar", JSON.stringify(contrato));
    router.push("/metas/contratos");
  }

  function formatarData(data: string) {
    if (!data) return "-";

    const partes = data.split("-");
    if (partes.length !== 3) return data;

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  function dataContratoISO(data: any) {
    const texto = String(data || "").trim();

    if (!texto) return "";

    // Já está no formato correto do input date
    if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto;

    // Caso esteja salvo/mostrado como dd/mm/aaaa
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
      const [dia, mes, ano] = texto.split("/");
      return `${ano}-${mes}-${dia}`;
    }

    // Caso venha com horário junto
    if (/^\d{4}-\d{2}-\d{2}/.test(texto)) return texto.slice(0, 10);

    return texto;
  }


  function formatarDinheiro(valor: any) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function calcularPercentual(valor: number, meta: number) {
    if (!meta || meta <= 0) return 0;

    return Math.min(
      Math.round((Number(valor || 0) / Number(meta)) * 100),
      100
    );
  }

  function aplicarFiltroPeriodoContratos() {
    setFiltroDataInicialContrato(dataInicialContratoTemp);
    setFiltroDataFinalContrato(dataFinalContratoTemp);
  }

  function limparFiltros() {
    setPesquisaContrato("");
    setFiltroDividido("TODOS");
    setFiltroDivididoCom("TODOS");
    setFiltroVendedora("TODAS");
    setFiltroDataInicialContrato("");
    setFiltroDataFinalContrato("");
    setDataInicialContratoTemp("");
    setDataFinalContratoTemp("");
  }

  const totalPessoal = Number(dados?.meuResumo?.total || 0);
  const totalPessoalSemMensal = Number(dados?.meuResumo?.totalSemMensal || 0);
  const metaPessoalAtual = Number(dados?.metaPessoal || metaPessoal || 0);

  const percentualPessoal =
    dados?.percentualPessoal ?? calcularPercentual(totalPessoal, metaPessoalAtual);

  const totalEmpresa = Number(dados?.contratosTotais || 0);
  const metaEmpresa = Number(dados?.metaEmpresa || 60);

  const percentualEmpresa =
    dados?.percentualEmpresa ?? calcularPercentual(totalEmpresa, metaEmpresa);

  const faltamPessoal = Math.max(metaPessoalAtual - totalPessoal, 0);
  const faltamEmpresa = Math.max(metaEmpresa - totalEmpresa, 0);

  const posicaoUsuario = dados?.meuResumo?.posicao || 1;

  const primeiraMetaPremiacao = Number(
    dados?.premiacaoEmpresa?.metas?.[0]?.quantidade || 30
  );

  const faltamProximaPosicao = Math.max(
    primeiraMetaPremiacao - totalPessoalSemMensal,
    0
  );

  // Premiação individual: só mostra valor quando a própria vendedora completa uma meta.
  // Não usa a premiação da empresa como fallback, para não aparecer ganho sem a meta pessoal concluída.
  const premiacaoAtualValor = Number(dados?.premiacaoPessoal?.atual?.valor || 0);

  const campanhaExtraProgresso = Number(dados?.campanhaExtra?.progresso || 0);
  const campanhaExtraObjetivo = Number(dados?.campanhaExtra?.objetivo || 0);

  // Campanha extra só entra nos ganhos quando o objetivo da campanha foi concluído.
  const campanhaExtraValor =
    dados?.campanhaExtra?.ativa === true &&
    campanhaExtraObjetivo > 0 &&
    campanhaExtraProgresso >= campanhaExtraObjetivo
      ? Number(dados?.campanhaExtra?.premioValor || dados?.campanhaExtra?.valor || 0)
      : 0;

  const totalGanhos = premiacaoAtualValor + campanhaExtraValor;

  const mensagemMotivacional =
    dados?.mensagens?.motivacional ||
    "Continue firme! Deus está no controle e grandes vitórias são construídas todos os dias.";

  const mensagemCrista =
    dados?.mensagens?.crista ||
    "Tudo posso naquele que me fortalece. Filipenses 4:13";

  const campanhaExtra = dados?.campanhaExtra || { ativa: false };

  const comunicados = Array.isArray(dados?.comunicados)
    ? dados.comunicados
    : [];



const contratosVisiveis = useMemo(() => {
    const lista = dados?.ultimosContratos || [];

    let filtrados = podeGerenciar()
      ? lista
      : lista.filter((contrato: any) => {
          const nomeUsuario = String(usuario?.nome || "").toUpperCase();
          const vendedora = String(contrato.vendedora || "").toUpperCase();
          const divididoCom = String(contrato.divididoCom || "").toUpperCase();

          return (
            vendedora === nomeUsuario ||
            (contrato.contratoDividido && divididoCom === nomeUsuario)
          );
        });

    if (filtroDividido === "SIM") {
      filtrados = filtrados.filter(
        (contrato: any) => contrato.contratoDividido
      );
    }

    if (filtroDividido === "NAO") {
      filtrados = filtrados.filter(
        (contrato: any) => !contrato.contratoDividido
      );
    }

    if (filtroDivididoCom !== "TODOS") {
      filtrados = filtrados.filter(
        (contrato: any) =>
          String(contrato.divididoCom || "").toUpperCase() ===
          filtroDivididoCom.toUpperCase()
      );
    }

    if (filtroVendedora !== "TODAS") {
      filtrados = filtrados.filter(
        (contrato: any) =>
          String(contrato.vendedora || "").toUpperCase() ===
          filtroVendedora.toUpperCase()
      );
    }

    if (filtroDataInicialContrato) {
      filtrados = filtrados.filter((contrato: any) => {
        const dataContrato = dataContratoISO(contrato.dataVenda || contrato.createdAt);
        return dataContrato >= filtroDataInicialContrato;
      });
    }

    if (filtroDataFinalContrato) {
      filtrados = filtrados.filter((contrato: any) => {
        const dataContrato = dataContratoISO(contrato.dataVenda || contrato.createdAt);
        return dataContrato <= filtroDataFinalContrato;
      });
    }

    if (pesquisaContrato.trim()) {
      const termo = pesquisaContrato.trim().toUpperCase();

      filtrados = filtrados.filter((contrato: any) => {
        const texto = [
          contrato.matricula,
          contrato.nomeAluno,
          contrato.vendedora,
          contrato.plano,
          contrato.tipoContrato,
          contrato.permanencia,
          contrato.dataVenda,
          contrato.divididoCom,
          contrato.nomeConvenio,
          contrato.observacao,
          contrato.unidadeOrigemNome,
          contrato.modalidadeAnterior,
          contrato.transferenciaUnidade ? "TRANSFERÊNCIA DE UNIDADE" : "",
          contrato.acrescimoModalidade ? "ACRÉSCIMO DE MODALIDADE" : "",
          contrato.trocaModalidade ? "TROCA DE MODALIDADE" : "",
        ]
          .join(" ")
          .toUpperCase();

        return texto.includes(termo);
      });
    }

    return filtrados.sort((a: any, b: any) => {
      const dataA = `${a.dataVenda || ""} ${a.createdAt || ""}`;
      const dataB = `${b.dataVenda || ""} ${b.createdAt || ""}`;

      return dataB.localeCompare(dataA);
    });
  }, [
    dados,
    usuario,
    filtroDividido,
    filtroDivididoCom,
    filtroVendedora,
    pesquisaContrato,
    filtroDataInicialContrato,
    filtroDataFinalContrato,
  ]);

  const nomesDivididos = useMemo(() => {
    const lista = dados?.ultimosContratos || [];

    return Array.from(
      new Set(
        lista
          .filter((contrato: any) => contrato.divididoCom)
          .map((contrato: any) => String(contrato.divididoCom).toUpperCase())
      )
    ).sort();
  }, [dados]);

  const nomesVendedoras = useMemo(() => {
    const lista = dados?.ultimosContratos || [];

    return Array.from(
      new Set(
        lista
          .filter((contrato: any) => contrato.vendedora)
          .map((contrato: any) => String(contrato.vendedora).toUpperCase())
      )
    ).sort();
  }, [dados]);

  const resumoPessoalPlanos = {
    anual: dados?.meuResumo?.anual ?? dados?.planos?.anual ?? 0,
    semestral: dados?.meuResumo?.semestral ?? dados?.planos?.semestral ?? 0,
    trimestral: dados?.meuResumo?.trimestral ?? dados?.planos?.trimestral ?? 0,
    mensal: dados?.meuResumo?.mensal ?? dados?.planos?.mensal ?? 0,
  };

  const resumoPessoalTipos = {
    novos: dados?.meuResumo?.novos ?? dados?.tipos?.novos ?? 0,
    retornos: dados?.meuResumo?.retornos ?? dados?.tipos?.retornos ?? 0,
    renovacoes: dados?.meuResumo?.renovacoes ?? dados?.tipos?.renovacoes ?? 0,
  };

  const isAdminGeral =
    String(usuario?.cargo || "").toUpperCase() === "ADMIN_GERAL";

  async function exportarPDFContratos() {
    const doc = new jsPDF("landscape", "mm", "a4");

    const contratosPDF = [...contratosVisiveis].sort((a: any, b: any) => {
      const dataA = `${a.dataVenda || ""} ${a.createdAt || ""}`;
      const dataB = `${b.dataVenda || ""} ${b.createdAt || ""}`;

      return dataB.localeCompare(dataA);
    });

    const mesFormatado = mesFiltro.split("-").reverse().join("/");
    const totalContratos = contratosPDF.length;
    const totalDivididos = contratosPDF.filter((c: any) => c.contratoDividido).length;
    const contratosPremiacao = contratosPDF.filter(
      (c: any) => String(c.permanencia || "").toUpperCase() !== "MENSAL"
    ).length;

    const totalAnual = contratosPDF.filter((c: any) => String(c.permanencia || "").toUpperCase() === "ANUAL").length;
    const totalSemestral = contratosPDF.filter((c: any) => String(c.permanencia || "").toUpperCase() === "SEMESTRAL").length;
    const totalTrimestral = contratosPDF.filter((c: any) => String(c.permanencia || "").toUpperCase() === "TRIMESTRAL").length;
    const totalMensal = contratosPDF.filter((c: any) => String(c.permanencia || "").toUpperCase() === "MENSAL").length;

    const totalNovos = contratosPDF.filter((c: any) => String(c.tipoContrato || "").toUpperCase() === "NOVO").length;
    const totalRetornos = contratosPDF.filter((c: any) => String(c.tipoContrato || "").toUpperCase() === "RETORNO").length;
    const totalRenovacoes = contratosPDF.filter((c: any) => String(c.tipoContrato || "").toUpperCase() === "RENOVAÇÃO").length;

    const totalValor = contratosPDF.reduce(
      (soma: number, contrato: any) => soma + Number(contrato.valorPrimeiraParcela || 0),
      0
    );

    const vendedorRelatorio =
      filtroVendedora !== "TODAS"
        ? filtroVendedora
        : isAdminGeral
        ? "Todas as vendedoras"
        : usuario?.nome || "-";

    const unidadeNome =
      dados?.configuracao?.nomeAcademia ||
      dados?.configuracao?.unidade?.nome ||
      usuario?.unidade?.nome ||
      "Prix Academia";

    const logoEmbutidaPrix = "data:image/png;base64,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";
    const logoConfiguracao = logoEmbutidaPrix || "/logo-prix-matriz.png";

    const rankingPDF = Array.isArray(dados?.ranking) ? dados.ranking.slice(0, 8) : [];

    const taxaConversao = Number(dashboardMetas?.taxaConversao || 0);
    const totalAulas = Number(dashboardMetas?.totalAulas || 0);
    const totalCompareceu = Number(dashboardMetas?.totalCompareceu || 0);
    const totalFaltou = Number(dashboardMetas?.totalFaltou || 0);
    const vendasEfetivadas = Number(dashboardMetas?.vendasEfetivadas || 0);
    const aulasHoje = Number(dashboardMetas?.aulasHoje || 0);

    function progresso(valor: number, meta: number) {
      if (!meta) return 0;
      return Math.min(Math.round((valor / meta) * 100), 100);
    }

    function textoLimitado(valor: any, tamanho = 30) {
      const texto = String(valor || "-");
      return texto.length > tamanho ? `${texto.slice(0, tamanho - 3)}...` : texto;
    }

    function normalizar(valor: any) {
      return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .replace(/\s+/g, " ")
        .toUpperCase();
    }

    async function carregarImagemComoBase64(src: string) {
      if (!src) return "";

      if (src.startsWith("data:image")) return src;

      return await new Promise<string>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
              resolve("");
              return;
            }

            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
          } catch {
            resolve("");
          }
        };

        img.onerror = () => resolve("");
        img.src = src;
      });
    }

    const logoBase64 = logoEmbutidaPrix || (await carregarImagemComoBase64(logoConfiguracao));

    const conversaoPorPessoaMap: any = {};

    function garantirPessoa(nome: any) {
      const chave = normalizar(nome) || "NÃO INFORMADO";

      if (!conversaoPorPessoaMap[chave]) {
        conversaoPorPessoaMap[chave] = {
          nome: String(nome || "Não informado")
            .trim()
            .replace(/\s+/g, " ")
            .toLowerCase()
            .replace(/(^|\s)\S/g, (l) => l.toUpperCase()),
          agendadas: 0,
          convertidas: 0,
        };
      }

      return conversaoPorPessoaMap[chave];
    }

    const aulasLista =
      dashboardMetas?.aulas ||
      dashboardMetas?.aulasAgendadas ||
      dashboardMetas?.listaAulas ||
      dados?.aulas ||
      [];

    const rankingAgendamentos =
      dashboardMetas?.topAgendamentos ||
      dashboardMetas?.rankingAgendamentos ||
      dashboardMetas?.agendamentosPorColaboradora ||
      dashboardMetas?.colaboradorasAgendamentos ||
      [];

    const rankingVendas =
      dashboardMetas?.topVendas ||
      dashboardMetas?.rankingVendas ||
      dashboardMetas?.vendasPorVendedora ||
      dashboardMetas?.vendedorasVendas ||
      [];

    if (Array.isArray(rankingAgendamentos) && rankingAgendamentos.length) {
      rankingAgendamentos.forEach((item: any) => {
        const nome = item.nome || item.colaboradora || item.usuarioNome || item.vendedora || "Não informado";
        const pessoa = garantirPessoa(nome);
        pessoa.agendadas = Number(item.aulas || item.total || item.quantidade || item.agendadas || 0);
      });
    }

    if (Array.isArray(rankingVendas) && rankingVendas.length) {
      rankingVendas.forEach((item: any) => {
        const nome = item.nome || item.vendedora || item.usuarioNome || item.colaboradora || "Não informado";
        const pessoa = garantirPessoa(nome);
        pessoa.convertidas = Number(item.vendas || item.total || item.quantidade || item.convertidas || 0);
      });
    }

    if (!Object.keys(conversaoPorPessoaMap).length && Array.isArray(aulasLista) && aulasLista.length) {
      aulasLista.forEach((aula: any) => {
        const colaboradora = aula.colaboradora || aula.criadoPorNome || aula.usuarioNome || "Não informado";
        const pessoaAgendou = garantirPessoa(colaboradora);
        pessoaAgendou.agendadas += 1;

        if (aula.vendaEfetivada || aula.dataConversao || aula.vendedora) {
          const vendedora = aula.vendedora || colaboradora;
          const pessoaConverteu = garantirPessoa(vendedora);
          pessoaConverteu.convertidas += 1;
        }
      });
    }

    if (!Object.keys(conversaoPorPessoaMap).length) {
      rankingPDF.forEach((item: any) => {
        const pessoa = garantirPessoa(item.nome);
        pessoa.convertidas = Number(item.total || 0);
        pessoa.agendadas = Number(item.agendadas || 0);
      });

      if (!rankingPDF.length && totalAulas > 0) {
        const pessoa = garantirPessoa(vendedorRelatorio);
        pessoa.agendadas = totalAulas;
        pessoa.convertidas = vendasEfetivadas;
      }
    }

    const conversaoPorPessoa = Object.values(conversaoPorPessoaMap)
      .map((item: any) => ({
        ...item,
        taxa: item.agendadas > 0 ? Math.round((item.convertidas / item.agendadas) * 100) : 0,
      }))
      .sort((a: any, b: any) => Number(b.convertidas || 0) - Number(a.convertidas || 0));


    function montarRankingContratos() {
      const mapa: any = {};

      function garantirVendedora(nome: any) {
        const nomeFormatado = String(nome || "Não informado").trim() || "Não informado";
        const chave = normalizar(nomeFormatado);

        if (!mapa[chave]) {
          mapa[chave] = {
            nome: nomeFormatado,
            totalContratos: 0,
            contratosValidos: 0,
          };
        }

        return mapa[chave];
      }

      // Primeiro usa o ranking da tela, para não sumir vendedora com 1 contrato.
      rankingPDF.forEach((item: any) => {
        const pessoa = garantirVendedora(item.nome);
        pessoa.contratosValidos = Number(item.total || item.contratosValidos || pessoa.contratosValidos || 0);
      });

      // Depois calcula pelos contratos do relatório.
      contratosPDF.forEach((contrato: any) => {
        const pessoa = garantirVendedora(contrato.vendedora);

        // Total de contratos conta TODOS, inclusive mensais.
        pessoa.totalContratos += 1;

        // Contratos válidos NÃO contam mensal.
        if (String(contrato.permanencia || "").toUpperCase() !== "MENSAL") {
          pessoa.contratosValidosCalculados = Number(pessoa.contratosValidosCalculados || 0) + 1;
        }
      });

      Object.values(mapa).forEach((item: any) => {
        // Se conseguir calcular pelos contratos, usa o cálculo.
        // Se não conseguir, mantém o valor do ranking da tela.
        if (Number(item.contratosValidosCalculados || 0) > 0) {
          item.contratosValidos = Number(item.contratosValidosCalculados || 0);
        }

        // Se a pessoa veio do ranking mas não apareceu nos contratos filtrados,
        // mantém pelo menos o total igual aos válidos para ela não sumir.
        if (Number(item.totalContratos || 0) === 0) {
          item.totalContratos = Number(item.contratosValidos || 0);
        }

        delete item.contratosValidosCalculados;
      });

      return Object.values(mapa).sort((a: any, b: any) => {
        if (Number(b.contratosValidos || 0) !== Number(a.contratosValidos || 0)) {
          return Number(b.contratosValidos || 0) - Number(a.contratosValidos || 0);
        }

        return Number(b.totalContratos || 0) - Number(a.totalContratos || 0);
      });
    }

    const rankingContratosPDF = montarRankingContratos();

    function desenharLogo(x: number, y: number, w: number, h: number, escura = true) {
      if (logoBase64) {
        try {
          const tipo = logoBase64.includes("image/jpeg") || logoBase64.includes("image/jpg") ? "JPEG" : "PNG";
          doc.addImage(logoBase64, tipo, x, y, w, h);
          return;
        } catch {}
      }

      doc.setTextColor(escura ? 255 : 32, escura ? 255 : 54, escura ? 255 : 121);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("PRIX", x, y + 12);
    }

    function cabecalho(titulo: string, subtitulo = "") {
      doc.setFillColor(248, 250, 252);
      doc.rect(0, 0, 297, 210, "F");

      doc.setFillColor(30, 58, 138);
      doc.rect(0, 0, 297, 34, "F");

      doc.setFillColor(37, 99, 235);
      doc.rect(0, 30, 297, 4, "F");

      desenharLogo(14, 7, 38, 18, true);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(titulo, 60, 14);

      doc.setTextColor(219, 234, 254);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(subtitulo || `${unidadeNome} • ${vendedorRelatorio} • ${mesFormatado}`, 60, 22);
    }

    function card(
      x: number,
      y: number,
      w: number,
      h: number,
      titulo: string,
      valor: string,
      subtitulo: string,
      cor: [number, number, number]
    ) {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, y, w, h, 3, 3, "FD");

      doc.setTextColor(cor[0], cor[1], cor[2]);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.text(titulo, x + 4, y + 8);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(15);
      doc.text(valor, x + 4, y + 18);

      doc.setTextColor(100, 116, 139);
      doc.setFontSize(6.8);
      doc.setFont("helvetica", "normal");
      doc.text(subtitulo, x + 4, y + 25);
    }

    function barra(x: number, y: number, w: number, pct: number, cor: [number, number, number]) {
      const largura = Math.max(0, Math.min(w, (w * pct) / 100));

      doc.setFillColor(226, 232, 240);
      doc.roundedRect(x, y, w, 4, 2, 2, "F");
      doc.setFillColor(cor[0], cor[1], cor[2]);
      doc.roundedRect(x, y, largura, 4, 2, 2, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(cor[0], cor[1], cor[2]);
      doc.text(`${pct}%`, x + w + 3, y + 3.5);
    }

    function donut(cx: number, cy: number, r: number, valores: any[], titulo: string) {
      const total = valores.reduce((soma: number, item: any) => soma + Number(item.valor || 0), 0) || 1;
      let inicio = -90;

      valores.forEach((item: any) => {
        const angulo = (Number(item.valor || 0) / total) * 360;
        const fim = inicio + angulo;

        doc.setFillColor(item.cor[0], item.cor[1], item.cor[2]);

        for (let a = inicio; a < fim; a += 6) {
          const a1 = (a * Math.PI) / 180;
          const a2 = (Math.min(a + 6, fim) * Math.PI) / 180;

          doc.triangle(
            cx,
            cy,
            cx + Math.cos(a1) * r,
            cy + Math.sin(a1) * r,
            cx + Math.cos(a2) * r,
            cy + Math.sin(a2) * r,
            "F"
          );
        }

        inicio = fim;
      });

      doc.setFillColor(255, 255, 255);
      doc.circle(cx, cy, r * 0.52, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(titulo, cx - 16, cy - r - 5);

      let y = cy - r + 4;
      valores.forEach((item: any) => {
        const pct = total > 0 ? Math.round((Number(item.valor || 0) / total) * 100) : 0;
        doc.setFillColor(item.cor[0], item.cor[1], item.cor[2]);
        doc.rect(cx + r + 8, y - 3, 3, 3, "F");
        doc.setTextColor(51, 65, 85);
        doc.setFontSize(7);
        doc.text(`${item.label}: ${item.valor} (${pct}%)`, cx + r + 13, y);
        y += 6;
      });
    }

    function rodape() {
      const pageCount = doc.getNumberOfPages();

      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 200, 297, 10, "F");
        doc.setTextColor(226, 232, 240);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text(
          `Kedial Performance • Gestão Comercial para Academias • Desenvolvido por KeDiAl Tecnologia`,
          14,
          206
        );
        doc.text(`Página ${i} de ${pageCount}`, 270, 206);
      }
    }

    cabecalho(
      "RELATÓRIO DE METAS E CONTRATOS",
      `${unidadeNome} • ${vendedorRelatorio} • ${mesFormatado}`
    );

    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(`Gerado por: ${usuario?.nome || "-"}`, 14, 45);
    doc.text(`Data/Hora: ${new Date().toLocaleString("pt-BR")}`, 75, 45);
    doc.text(`Unidade: ${unidadeNome}`, 150, 45);
    doc.text(`Filtro: ${vendedorRelatorio}`, 225, 45);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("RESUMO EXECUTIVO", 14, 58);

    card(14, 64, 42, 28, "META UNIDADE", `${totalEmpresa} / ${metaEmpresa}`, `${percentualEmpresa}% da meta`, [124, 58, 237]);
    card(61, 64, 42, 28, "CONTRATOS", String(totalContratos), "lançados no filtro", [37, 99, 235]);
    card(108, 64, 42, 28, "NOVOS", String(totalNovos), "contratos novos", [22, 163, 74]);
    card(155, 64, 42, 28, "RETORNOS", String(totalRetornos), "contratos retorno", [124, 58, 237]);
    card(202, 64, 42, 28, "RENOVAÇÕES", String(totalRenovacoes), "renovações", [234, 88, 12]);
    card(249, 64, 34, 28, "DIVIDIDOS", String(totalDivididos), "contratos", [14, 165, 233]);

    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("DADOS DO DASHBOARD COMERCIAL", 14, 106);

    card(14, 112, 42, 28, "AGENDADAS", String(totalAulas), "aulas no mês", [22, 163, 74]);
    card(61, 112, 42, 28, "COMPARECERAM", String(totalCompareceu), `${dashboardMetas?.taxaComparecimento || 0}%`, [22, 163, 74]);
    card(108, 112, 42, 28, "CONVERTIDAS", String(vendasEfetivadas), "vendas geradas", [124, 58, 237]);
    card(155, 112, 42, 28, "PERDIDAS", String(totalFaltou), "não compareceram", [220, 38, 38]);
    card(202, 112, 42, 28, "CONVERSÃO", `${taxaConversao}%`, "aulas → vendas", [22, 163, 74]);
    card(249, 112, 34, 28, "AULAS HOJE", String(aulasHoje), "agenda", [37, 99, 235]);

    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("OBSERVAÇÃO DO RELATÓRIO", 14, 160);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 166, 269, 24, 3, 3, "FD");
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.setFont("helvetica", "normal");
    doc.text("Este relatório considera somente os dados da unidade selecionada e do período filtrado.", 22, 176);
    doc.text("O ranking completo, os gráficos, a conversão por colaboradora e a lista de contratos estão nas próximas páginas.", 22, 184);

    doc.addPage("landscape");

    cabecalho(
      "RANKING DA UNIDADE",
      `${unidadeNome} • ${vendedorRelatorio} • ${mesFormatado}`
    );

    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(
      "Total de contratos: inclui mensais. Contratos válidos: não inclui mensais.",
      30,
      40
    );

    autoTable(doc, {
      startY: 48,
      head: [[
        "Posição",
        "Vendedora",
        "Total de contratos",
        "Contratos válidos",
      ]],
      body: rankingContratosPDF.map((item: any, index: number) => [
        `${index + 1}º`,
        item.nome || "-",
        item.totalContratos || 0,
        item.contratosValidos || 0,
      ]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 90 },
        2: { cellWidth: 55 },
        3: { cellWidth: 55 },
      },
      margin: { left: 30, right: 30 },
    });

    const rankingFinalY = (doc as any).lastAutoTable?.finalY || 60;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("PROGRESSO DA UNIDADE", 30, rankingFinalY + 18);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(30, rankingFinalY + 26, 230, 30, 4, 4, "FD");
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    doc.text(`${percentualEmpresa}%`, 42, rankingFinalY + 44);
    barra(75, rankingFinalY + 38, 120, percentualEmpresa, [37, 99, 235]);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`${totalEmpresa} / ${metaEmpresa} contratos lançados na unidade`, 42, rankingFinalY + 52);

    doc.addPage("landscape");

    cabecalho(
      "GRÁFICOS E DISTRIBUIÇÃO DOS CONTRATOS",
      `${unidadeNome} • ${vendedorRelatorio} • ${mesFormatado}`
    );

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("DISTRIBUIÇÃO DOS PLANOS", 20, 52);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(20, 60, 118, 85, 4, 4, "FD");
    donut(58, 103, 24, [
      { label: "Anual", valor: totalAnual, cor: [37, 99, 235] },
      { label: "Semestral", valor: totalSemestral, cor: [22, 163, 74] },
      { label: "Trimestral", valor: totalTrimestral, cor: [245, 158, 11] },
      { label: "Mensal", valor: totalMensal, cor: [147, 51, 234] },
    ], "Planos");

    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("TIPOS DE CONTRATO", 158, 52);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(158, 60, 118, 85, 4, 4, "FD");
    donut(196, 103, 24, [
      { label: "Novos", valor: totalNovos, cor: [37, 99, 235] },
      { label: "Retornos", valor: totalRetornos, cor: [22, 163, 74] },
      { label: "Renovações", valor: totalRenovacoes, cor: [245, 158, 11] },
    ], "Tipos");

    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("INDICADORES GERAIS", 20, 160);

    card(20, 166, 55, 24, "CONTRATOS VÁLIDOS", String(contratosPremiacao), "sem mensais", [124, 58, 237]);
    card(82, 166, 55, 24, "CONTRATOS DIVIDIDOS", String(totalDivididos), "compartilhados", [14, 165, 233]);
    card(144, 166, 55, 24, "VALOR INFORMADO", formatarDinheiro(totalValor), "primeiras parcelas", [22, 163, 74]);
    card(206, 166, 55, 24, "CONVERSÃO", `${taxaConversao}%`, "aulas → vendas", [245, 158, 11]);

    doc.addPage("landscape");

    cabecalho(
      "LISTA COMPLETA DE CONTRATOS",
      `${unidadeNome} • ${vendedorRelatorio} • ${mesFormatado}`
    );

    autoTable(doc, {
      startY: 46,
      head: [[
        "#",
        "Data",
        "Matrícula",
        "Aluno",
        "Plano",
        "Tipo",
        "Permanência",
        "Vendedora",
        "Dividido",
        "Com quem",
        "Transferência",
        "Unidade origem",
        "Acréscimo",
        "Troca",
        "Modalidade anterior",
        "Observação",
      ]],
      body: contratosPDF.map((contrato: any, index: number) => [
        index + 1,
        formatarData(contrato.dataVenda),
        contrato.matricula || "-",
        contrato.nomeAluno || "-",
        contrato.plano || "-",
        contrato.tipoContrato || "-",
        contrato.permanencia || "-",
        contrato.vendedora || "-",
        contrato.contratoDividido ? "Sim" : "Não",
        contrato.contratoDividido ? contrato.divididoCom || "-" : "-",
        contrato.transferenciaUnidade ? "Sim" : "Não",
        contrato.unidadeOrigemNome || "-",
        contrato.acrescimoModalidade ? "Sim" : "Não",
        contrato.trocaModalidade ? "Sim" : "Não",
        contrato.modalidadeAnterior || "-",
        contrato.observacao || "-",
      ]),
      styles: { fontSize: 7, cellPadding: 2, overflow: "linebreak" },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 9 },
        1: { cellWidth: 18 },
        2: { cellWidth: 20 },
        3: { cellWidth: 38 },
        10: { cellWidth: 44 },
      },
      margin: { left: 14, right: 14 },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 170;

    if (finalY < 185) {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(14, finalY + 8, 269, 15, 3, 3, "F");
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8);
      doc.text(`Total de contratos: ${totalContratos}`, 22, finalY + 17);
      doc.text(`Contratos válidos para premiação: ${contratosPremiacao}`, 75, finalY + 17);
      doc.text(`Contratos divididos: ${totalDivididos}`, 150, finalY + 17);
      doc.text(`Valor total informado: ${formatarDinheiro(totalValor)}`, 210, finalY + 17);
    }

    rodape();

    const nomeArquivoVendedora =
      filtroVendedora !== "TODAS"
        ? filtroVendedora.toLowerCase().replace(/\s+/g, "-")
        : "geral";

    doc.save(`relatorio-metas-${nomeArquivoVendedora}-${mesFiltro}.pdf`);
  }

  return (
    <main className="min-h-screen flex bg-[#f6f8fc]">
      <Sidebar />

      <section className="flex-1 p-6">
        <div className="flex flex-wrap justify-between items-start gap-4 mb-5">
          <div>
            <h1 className="text-3xl font-black text-slate-900">
              Olá, {usuario?.nome?.split(" ")[0] || "Kely"}!
            </h1>

            <p className="text-slate-500 mt-1">
              Acompanhe suas metas, resultados e conquistas.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
              <input
                type="month"
                value={mesFiltro}
                onChange={(e) => setMesFiltro(e.target.value)}
                className="outline-none font-bold text-slate-800 bg-transparent"
              />
              <FaCalendarAlt className="text-slate-500" />
            </div>

            <button
              onClick={() => carregarMetas()}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 px-5 py-3 rounded-2xl font-bold shadow-sm flex items-center gap-2"
            >
              <FaSyncAlt className="text-blue-700" />
              Atualizar
            </button>

            <button
              onClick={() => router.push("/metas/contratos")}
              className="bg-gradient-to-r from-purple-700 to-blue-700 hover:from-purple-800 hover:to-blue-800 text-white px-5 py-3 rounded-2xl font-bold shadow-lg"
            >
              + Novo Contrato
            </button>

            <button
              onClick={exportarPDFContratos}
              className="bg-white border border-purple-200 hover:bg-purple-50 text-purple-700 px-5 py-3 rounded-2xl font-bold shadow-sm"
            >
              Exportar PDF
            </button>

            {podeGerenciar() && (
              <button
                onClick={() => router.push("/metas/configuracoes")}
                className="bg-slate-900 hover:bg-slate-950 text-white px-5 py-3 rounded-2xl font-bold shadow-lg"
              >
                Configurações
              </button>
            )}
          </div>
        </div>

        {mostrarPin && (
          <ModalPinMetas
            pinValor={pinValor}
            setPinValor={setPinValor}
            mostrarSenhaPin={mostrarSenhaPin}
            setMostrarSenhaPin={setMostrarSenhaPin}
            validandoPin={validandoPin}
            confirmar={confirmarPinMetas}
            cancelar={() => router.push("/")}
          />
        )}

        {pinLiberado && dados && (
          isAdminGeral ? (
            <PainelAdminGeral
              dados={dados}
              dashboard={dashboardMetas}
              usuario={usuario}
              totalEmpresa={totalEmpresa}
              metaEmpresa={metaEmpresa}
              percentualEmpresa={percentualEmpresa}
              faltamEmpresa={faltamEmpresa}
              contratos={contratosVisiveis}
              ranking={dados?.ranking || []}
              planos={dados?.planos || {}}
              tipos={dados?.tipos || {}}
              pesquisaContrato={pesquisaContrato}
              setPesquisaContrato={setPesquisaContrato}
              filtroDividido={filtroDividido}
              setFiltroDividido={setFiltroDividido}
              filtroDivididoCom={filtroDivididoCom}
              setFiltroDivididoCom={setFiltroDivididoCom}
              filtroVendedora={filtroVendedora}
              setFiltroVendedora={setFiltroVendedora}
              filtroDataInicialContrato={filtroDataInicialContrato}
              setFiltroDataInicialContrato={setFiltroDataInicialContrato}
              filtroDataFinalContrato={filtroDataFinalContrato}
              setFiltroDataFinalContrato={setFiltroDataFinalContrato}
              dataInicialContratoTemp={dataInicialContratoTemp}
              setDataInicialContratoTemp={setDataInicialContratoTemp}
              dataFinalContratoTemp={dataFinalContratoTemp}
              setDataFinalContratoTemp={setDataFinalContratoTemp}
              aplicarFiltroPeriodoContratos={aplicarFiltroPeriodoContratos}
              nomesDivididos={nomesDivididos}
              nomesVendedoras={nomesVendedoras}
              limparFiltros={limparFiltros}
              formatarData={formatarData}
              formatarDinheiro={formatarDinheiro}
              setContratoVisualizar={setContratoVisualizar}
              editarContrato={editarContrato}
              excluirContrato={excluirContrato}
              campanhaExtra={campanhaExtra}
              comunicados={comunicados}
              onConfigurarMetas={() => router.push("/metas/configuracoes")}
              onExportarPDF={exportarPDFContratos}
            />
          ) : (
          <>
            <MensagemDia
              mensagemCrista={mensagemCrista}
              mensagemMotivacional={mensagemMotivacional}
            />

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 mt-4">
              <CardMetaCircular
                titulo="Minha Meta Pessoal"
                icone={<FaBullseye />}
                cor="purple"
                percentual={percentualPessoal}
                valor={`${totalPessoal} / ${metaPessoalAtual}`}
                subtitulo="contratos realizados"
                destaque={`Faltam ${faltamPessoal} contratos`}
                descricao="para atingir sua meta"
                onEditarMeta={() => setAbrirMetaPessoal(true)}
              />

              <CardMetaCircular
                titulo="Meta da Empresa (Coletiva)"
                icone={<FaBuilding />}
                cor="blue"
                percentual={percentualEmpresa}
                valor={`${totalEmpresa} / ${metaEmpresa}`}
                subtitulo="contratos da unidade"
                destaque="Meta coletiva de todas as vendedoras"
                descricao={
                  faltamEmpresa === 0
                    ? "A equipe atingiu a meta da unidade"
                    : `Faltam ${faltamEmpresa} contratos para a equipe atingir a meta`
                }
              />

              <CardPosicao
                posicao={posicaoUsuario}
                faltam={faltamProximaPosicao}
              />

              <CardGanhos
                premiacaoAtualValor={premiacaoAtualValor}
                campanhaExtraValor={campanhaExtraValor}
                totalGanhos={totalGanhos}
                formatarDinheiro={formatarDinheiro}
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 mt-4">
              <div className="xl:col-span-6">
                <MetasPremiacao
                  metas={dados.premiacaoEmpresa?.metas || []}
                  realizado={totalPessoalSemMensal}
                  formatarDinheiro={formatarDinheiro}
                />
              </div>

              {campanhaExtra?.ativa && (
                <div className="xl:col-span-3">
                  <CampanhaExtraCard campanha={campanhaExtra} />
                </div>
              )}

              <div className={campanhaExtra?.ativa ? "xl:col-span-3" : "xl:col-span-6"}>
                <ComunicadosCard comunicados={comunicados} />
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 mt-4">
              <div className="xl:col-span-3">
                <ResumoContratos planos={resumoPessoalPlanos} />
              </div>

              <div className="xl:col-span-3">
                <TiposContrato tipos={resumoPessoalTipos} />
              </div>

              <div className="xl:col-span-6">
                <ConquistasCard
                  total={totalPessoalSemMensal}
                  totalComMensal={totalPessoal}
                  metaPessoal={metaPessoalAtual}
                />
              </div>
            </div>

            <ContratosTabela
              contratos={contratosVisiveis}
              usuario={usuario}
              pesquisaContrato={pesquisaContrato}
              setPesquisaContrato={setPesquisaContrato}
              filtroDividido={filtroDividido}
              setFiltroDividido={setFiltroDividido}
              filtroDivididoCom={filtroDivididoCom}
              setFiltroDivididoCom={setFiltroDivididoCom}
              filtroVendedora={filtroVendedora}
              setFiltroVendedora={setFiltroVendedora}
              filtroDataInicialContrato={filtroDataInicialContrato}
              setFiltroDataInicialContrato={setFiltroDataInicialContrato}
              filtroDataFinalContrato={filtroDataFinalContrato}
              setFiltroDataFinalContrato={setFiltroDataFinalContrato}
              dataInicialContratoTemp={dataInicialContratoTemp}
              setDataInicialContratoTemp={setDataInicialContratoTemp}
              dataFinalContratoTemp={dataFinalContratoTemp}
              setDataFinalContratoTemp={setDataFinalContratoTemp}
              aplicarFiltroPeriodoContratos={aplicarFiltroPeriodoContratos}
              nomesDivididos={nomesDivididos}
              nomesVendedoras={nomesVendedoras}
              limparFiltros={limparFiltros}
              formatarData={formatarData}
              setContratoVisualizar={setContratoVisualizar}
              editarContrato={editarContrato}
              excluirContrato={excluirContrato}
            />

            {contratoVisualizar && (
              <ModalContrato
                contrato={contratoVisualizar}
                fechar={() => setContratoVisualizar(null)}
                editarContrato={editarContrato}
                formatarData={formatarData}
                formatarDinheiro={formatarDinheiro}
              />
            )}

            {abrirMetaPessoal && (
              <ModalMetaPessoal
                metaAtual={metaPessoalAtual}
                fechar={() => setAbrirMetaPessoal(false)}
                salvar={salvarMetaPessoal}
              />
            )}
          </>
          )
        )}
      </section>
    </main>
  );
}

function ModalPinMetas({
  pinValor,
  setPinValor,
  mostrarSenhaPin,
  setMostrarSenhaPin,
  validandoPin,
  confirmar,
  cancelar,
}: any) {
  return (
    <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-xl">
            <FaLock />
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900">
              Acesso às Metas
            </h2>
            <p className="text-sm text-slate-500">
              Digite seu PIN de 4 números para continuar.
            </p>
          </div>
        </div>

        <label className="block font-bold text-slate-800 mb-2">
          PIN das Metas
        </label>

        <div className="relative">
          <input
            type={mostrarSenhaPin ? "text" : "password"}
            value={pinValor}
            onChange={(e) => setPinValor(e.target.value.replace(/\D/g, "").slice(0, 4))}
            onKeyDown={(e) => {
              if (e.key === "Enter") confirmar();
            }}
            autoFocus
            inputMode="numeric"
            maxLength={4}
            className="w-full border rounded-2xl p-4 pr-14 text-2xl font-black tracking-[0.5em] outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-600"
          />

          <button
            type="button"
            onClick={() => setMostrarSenhaPin(!mostrarSenhaPin)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 font-bold"
          >
            {mostrarSenhaPin ? "Ocultar" : "Ver"}
          </button>
        </div>

        <p className="text-xs text-slate-500 mt-3">
          Depois de liberar, o acesso fica ativo por 4 horas neste computador.
        </p>

        <div className="flex gap-3 mt-6">
          <button
            onClick={confirmar}
            disabled={validandoPin}
            className="flex-1 bg-purple-700 hover:bg-purple-800 disabled:opacity-60 text-white rounded-2xl py-3 font-black"
          >
            {validandoPin ? "Validando..." : "Entrar"}
          </button>

          <button
            onClick={cancelar}
            className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-2xl py-3 font-black"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function PainelAdminGeral({
  dados,
  dashboard,
  usuario,
  totalEmpresa,
  metaEmpresa,
  percentualEmpresa,
  faltamEmpresa,
  contratos,
  planos,
  tipos,
  pesquisaContrato,
  setPesquisaContrato,
  filtroDividido,
  setFiltroDividido,
  filtroDivididoCom,
  setFiltroDivididoCom,
  filtroVendedora,
  setFiltroVendedora,
  filtroDataInicialContrato,
  setFiltroDataInicialContrato,
  filtroDataFinalContrato,
  setFiltroDataFinalContrato,
  dataInicialContratoTemp,
  setDataInicialContratoTemp,
  dataFinalContratoTemp,
  setDataFinalContratoTemp,
  aplicarFiltroPeriodoContratos,
  nomesDivididos,
  nomesVendedoras,
  limparFiltros,
  formatarData,
  setContratoVisualizar,
  editarContrato,
  excluirContrato,
  comunicados,
  onConfigurarMetas,
  onExportarPDF,
}: any) {
  const contratosUnidade = Array.isArray(contratos) ? contratos : [];

  function normalizarNome(valor: any) {
    return String(valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .replace(/\s+/g, " ")
      .toUpperCase();
  }

  function nomeBonito(valor: any) {
    const nome = String(valor || "NÃO INFORMADO").trim().replace(/\s+/g, " ").toLowerCase();
    return nome.replace(/(^|\s)\S/g, (letra) => letra.toUpperCase());
  }

  function garantirRanking(mapa: any, nomeOriginal: any) {
    const chave = normalizarNome(nomeOriginal) || "NÃO INFORMADO";

    if (!mapa[chave]) {
      mapa[chave] = {
        chave,
        nome: nomeBonito(nomeOriginal),
        proprios: 0,
        meios: 0,
        meiosPendentes: 0,
        total: 0,
      };
    }

    return mapa[chave];
  }

  function calcularRankingGerencial(lista: any[]) {
    const mapa: any = {};

    lista
      .filter((contrato: any) => String(contrato.permanencia || "").toUpperCase() !== "MENSAL")
      .forEach((contrato: any) => {
        const vendedoraOriginal = contrato.vendedora || "NÃO INFORMADO";
        const divididoComOriginal = contrato.divididoCom || "";
        const divididoComKey = normalizarNome(divididoComOriginal);

        if (contrato.contratoDividido && divididoComKey) {
          // REGRA NOVA:
          // todos os meios se somam, independente de com quem foi dividido.
          garantirRanking(mapa, vendedoraOriginal).meios += 1;
          garantirRanking(mapa, divididoComOriginal).meios += 1;
        } else {
          garantirRanking(mapa, vendedoraOriginal).proprios += 1;
        }
      });

    return Object.values(mapa)
      .map((item: any) => {
        const creditosDivididos = Math.floor(Number(item.meios || 0) / 2);
        const meiosPendentes = Number(item.meios || 0) % 2;

        return {
          ...item,
          divididosCreditados: creditosDivididos,
          meiosPendentes,
          total: Number(item.proprios || 0) + creditosDivididos,
        };
      })
      .filter((item: any) => Number(item.total || 0) > 0 || Number(item.meiosPendentes || 0) > 0)
      .sort((a: any, b: any) => {
        const total = Number(b.total || 0) - Number(a.total || 0);
        if (total !== 0) return total;
        return Number(b.meiosPendentes || 0) - Number(a.meiosPendentes || 0);
      })
      .map((item: any, index) => ({ ...item, posicao: index + 1 }));
  }

  const rankingGerencial = calcularRankingGerencial(contratosUnidade);

  const aulasExperimentais = Number(dashboard?.totalAulas || 0);
  const aulasHoje = Number(dashboard?.aulasHoje || 0);
  const aulasCompareceram = Number(dashboard?.totalCompareceu || 0);
  const aulasFaltaram = Number(dashboard?.totalFaltou || 0);
  const aulasConvertidas = Number(dashboard?.vendasEfetivadas || 0);
  const conversaoAulas = Number(dashboard?.taxaConversao || 0);
  const taxaComparecimento = Number(dashboard?.taxaComparecimento || 0);
  const diariasAtivas = Number(dashboard?.diariasAtivas || 0);

  const contratosSemMensal = contratosUnidade.filter(
    (contrato: any) => String(contrato.permanencia || "").toUpperCase() !== "MENSAL"
  ).length;

  const contratosDivididos = contratosUnidade.filter(
    (contrato: any) => contrato.contratoDividido
  ).length;

  const planosUnidade = {
    anual: contratosUnidade.filter((c: any) => String(c.permanencia || "").toUpperCase() === "ANUAL").length,
    semestral: contratosUnidade.filter((c: any) => String(c.permanencia || "").toUpperCase() === "SEMESTRAL").length,
    trimestral: contratosUnidade.filter((c: any) => String(c.permanencia || "").toUpperCase() === "TRIMESTRAL").length,
    mensal: contratosUnidade.filter((c: any) => String(c.permanencia || "").toUpperCase() === "MENSAL").length,
  };

  const tiposUnidade = {
    novos: contratosUnidade.filter((c: any) => contratoContaMetaGeralTela(c) && String(c.tipoContrato || "").toUpperCase() === "NOVO").length,
    retornos: contratosUnidade.filter((c: any) => contratoContaMetaGeralTela(c) && String(c.tipoContrato || "").toUpperCase() === "RETORNO").length,
    renovacoes: contratosUnidade.filter((c: any) => contratoContaMetaGeralTela(c) && String(c.tipoContrato || "").toUpperCase() === "RENOVAÇÃO").length,
    transferenciasUnidade: contratosUnidade.filter((c: any) => contratoContaMetaGeralTela(c) && c.transferenciaUnidade).length,
    trocasModalidade: contratosUnidade.filter((c: any) => c.trocaModalidade).length,
    acrescimosModalidade: contratosUnidade.filter((c: any) => contratoContaMetaGeralTela(c) && c.acrescimoModalidade).length,
  };

  return (
    <>
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 rounded-3xl p-6 text-white shadow-lg">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <p className="text-sm font-black uppercase text-blue-200">
              Painel Gerencial
            </p>

            <h2 className="text-3xl font-black mt-1">
              Visão Geral da Unidade
            </h2>

            <p className="text-blue-100 mt-1">
              Olá, {usuario?.nome?.split(" ")[0] || "Admin"}! Acompanhe metas,
              ranking e desempenho da equipe.
            </p>
          </div>

          <div className="bg-white/10 border border-white/20 rounded-2xl px-5 py-3">
            <p className="text-xs text-blue-100 font-bold">Meta da Unidade</p>
            <p className="text-2xl font-black">
              {totalEmpresa} / {metaEmpresa}
            </p>
            <p className="text-xs text-blue-100">
              {faltamEmpresa > 0
                ? `Faltam ${faltamEmpresa} contratos`
                : "Meta atingida"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 mt-4">
        <CardGerencialDetalhado
          titulo="Meta da Unidade (Coletiva)"
          valor={`${totalEmpresa} / ${metaEmpresa}`}
          subtitulo="contratos"
          percentual={percentualEmpresa}
          destaque={faltamEmpresa > 0 ? `Faltam ${faltamEmpresa} contratos` : "Meta atingida"}
          descricao="para a unidade atingir a meta"
          cor="purple"
          icone={<FaBuilding />}
        />

        <CardGerencialNumeros
          titulo="Total de Contratos"
          valor={totalEmpresa}
          subtitulo="contratos"
          cor="blue"
          icone={<FaFileContract />}
          itens={[
            { label: "Novos", valor: tiposUnidade.novos, cor: "text-green-700" },
            { label: "Retornos", valor: tiposUnidade.retornos, cor: "text-purple-700" },
            { label: "Renovações", valor: tiposUnidade.renovacoes, cor: "text-orange-600" },
            { label: "Transferências", valor: tiposUnidade.transferenciasUnidade, cor: "text-blue-700" },
            { label: "Trocas", valor: tiposUnidade.trocasModalidade, cor: "text-red-600" },
            { label: "Acréscimos", valor: tiposUnidade.acrescimosModalidade, cor: "text-emerald-700" },
          ]}
        />

        <CardGerencialNumeros
          titulo="Aulas Experimentais"
          valor={aulasExperimentais}
          subtitulo="agendadas"
          cor="green"
          icone={<FaCalendarAlt />}
          itens={[
            { label: "Compareceram", valor: aulasCompareceram, cor: "text-green-700" },
            { label: "Convertidas", valor: aulasConvertidas, cor: "text-purple-700" },
            { label: "Perdidas", valor: aulasFaltaram, cor: "text-red-600" },
          ]}
        />

        <CardGerencialDetalhado
          titulo="Conversão de Aulas"
          valor={`${conversaoAulas}%`}
          subtitulo="taxa de conversão"
          percentual={conversaoAulas}
          destaque={`${aulasConvertidas} vendas geradas`}
          descricao={`${taxaComparecimento}% de comparecimento • ${aulasHoje} aulas hoje`}
          cor="green"
          icone={<MdOutlineTrendingUp />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 mt-4">
        <div className="xl:col-span-5">
          <RankingGerencial ranking={rankingGerencial} />
        </div>

        <div className="xl:col-span-4">
          <ProgressoUnidade
            percentualEmpresa={percentualEmpresa}
            totalEmpresa={totalEmpresa}
            metaEmpresa={metaEmpresa}
            contratosDivididos={contratosDivididos}
          />
        </div>

        <div className="xl:col-span-3">
          <AcessosRapidosGerencial
            onConfigurarMetas={onConfigurarMetas}
            onExportarPDF={onExportarPDF}
            onConferirCompartilhamentos={() => {
              setFiltroDividido("SIM");
              setTimeout(() => {
                document
                  .getElementById("ultimos-contratos")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }, 100);
            }}
            onComunicados={() => {
              document
                .getElementById("comunicados-equipe")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 mt-4">
        <div className="xl:col-span-3">
          <ResumoContratos planos={planosUnidade} />
        </div>

        <div className="xl:col-span-3">
          <TiposContrato tipos={tiposUnidade} />
        </div>

        <div className="xl:col-span-3">
          <ResumoDashboardGerencial dashboard={dashboard} />
        </div>

        <div className="xl:col-span-3">
          <MiniIndicadoresGerencial
            contratosSemMensal={contratosSemMensal}
            contratosDivididos={contratosDivididos}
            diariasAtivas={diariasAtivas}
            aulasHoje={aulasHoje}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 mt-4">
        <div className="xl:col-span-12">
          <ComunicadosCard comunicados={comunicados} />
        </div>
      </div>

      <ContratosTabela
        contratos={contratosUnidade}
        usuario={usuario}
        pesquisaContrato={pesquisaContrato}
        setPesquisaContrato={setPesquisaContrato}
        filtroDividido={filtroDividido}
        setFiltroDividido={setFiltroDividido}
        filtroDivididoCom={filtroDivididoCom}
        setFiltroDivididoCom={setFiltroDivididoCom}
        filtroVendedora={filtroVendedora}
        setFiltroVendedora={setFiltroVendedora}
        filtroDataInicialContrato={filtroDataInicialContrato}
        setFiltroDataInicialContrato={setFiltroDataInicialContrato}
        filtroDataFinalContrato={filtroDataFinalContrato}
        setFiltroDataFinalContrato={setFiltroDataFinalContrato}
        dataInicialContratoTemp={dataInicialContratoTemp}
        setDataInicialContratoTemp={setDataInicialContratoTemp}
        dataFinalContratoTemp={dataFinalContratoTemp}
        setDataFinalContratoTemp={setDataFinalContratoTemp}
        aplicarFiltroPeriodoContratos={aplicarFiltroPeriodoContratos}
        nomesDivididos={nomesDivididos}
        nomesVendedoras={nomesVendedoras}
        limparFiltros={limparFiltros}
        formatarData={formatarData}
        setContratoVisualizar={setContratoVisualizar}
        editarContrato={editarContrato}
        excluirContrato={excluirContrato}
      />
    </>
  );
}


function CardGerencialDetalhado({
  titulo,
  valor,
  subtitulo,
  percentual,
  destaque,
  descricao,
  cor,
  icone,
}: any) {
  const estilos: any = {
    purple: {
      box: "from-purple-50 to-white border-purple-100",
      text: "text-purple-700",
      icon: "bg-purple-100 text-purple-700",
      bar: "bg-purple-700",
      destaque: "bg-purple-50 text-purple-700",
    },
    green: {
      box: "from-green-50 to-white border-green-100",
      text: "text-green-700",
      icon: "bg-green-100 text-green-700",
      bar: "bg-green-600",
      destaque: "bg-green-50 text-green-700",
    },
  };

  const estilo = estilos[cor] || estilos.purple;
  const pct = Math.min(Number(percentual || 0), 100);

  return (
    <div className={`bg-gradient-to-br ${estilo.box} rounded-3xl border shadow-sm p-5 h-full`}>
      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 rounded-full ${estilo.icon} flex items-center justify-center text-2xl`}>
          {icone}
        </div>

        <div className="flex-1">
          <h3 className={`font-black ${estilo.text}`}>{titulo}</h3>
          <p className="text-4xl font-black text-slate-900 mt-2">{valor}</p>
          <p className="text-sm text-slate-700">{subtitulo}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <div className="h-3 bg-slate-200 rounded-full overflow-hidden flex-1">
          <div className={`h-full ${estilo.bar} rounded-full`} style={{ width: `${pct}%` }} />
        </div>
        <span className={`font-black text-sm ${estilo.text}`}>{pct}%</span>
      </div>

      <div className={`rounded-2xl p-4 mt-4 ${estilo.destaque}`}>
        <p className="font-black">{destaque}</p>
        <p className="text-slate-700 text-sm">{descricao}</p>
      </div>
    </div>
  );
}

function CardGerencialNumeros({ titulo, valor, subtitulo, cor, icone, itens }: any) {
  const estilos: any = {
    blue: {
      box: "from-blue-50 to-white border-blue-100",
      text: "text-blue-700",
      icon: "bg-blue-100 text-blue-700",
    },
    green: {
      box: "from-green-50 to-white border-green-100",
      text: "text-green-700",
      icon: "bg-green-100 text-green-700",
    },
  };

  const estilo = estilos[cor] || estilos.blue;

  return (
    <div className={`bg-gradient-to-br ${estilo.box} rounded-3xl border shadow-sm p-5 h-full`}>
      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 rounded-full ${estilo.icon} flex items-center justify-center text-2xl`}>
          {icone}
        </div>

        <div>
          <h3 className={`font-black ${estilo.text}`}>{titulo}</h3>
          <p className="text-4xl font-black text-slate-900 mt-2">{valor}</p>
          <p className="text-sm text-slate-700">{subtitulo}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-slate-200 mt-5 pt-4">
        {(itens || []).map((item: any) => (
          <div key={item.label} className="text-center border-r border-slate-200 last:border-r-0">
            <p className={`text-xs font-black ${item.cor}`}>{item.label}</p>
            <p className={`text-2xl font-black mt-1 ${item.cor}`}>{item.valor}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniIndicadoresGerencial({ contratosSemMensal, contratosDivididos, diariasAtivas, aulasHoje }: any) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 h-full">
      <h2 className="font-black text-purple-700 mb-4 flex items-center gap-2">
        <FaBullseye />
        Indicadores da Unidade
      </h2>

      <div className="space-y-2">
        <div className="flex justify-between items-center bg-purple-50 text-purple-700 rounded-xl p-3">
          <strong>Contratos válidos</strong>
          <strong>{contratosSemMensal}</strong>
        </div>

        <div className="flex justify-between items-center bg-orange-50 text-orange-600 rounded-xl p-3">
          <strong>Contratos divididos</strong>
          <strong>{contratosDivididos}</strong>
        </div>

        <div className="flex justify-between items-center bg-blue-50 text-blue-700 rounded-xl p-3">
          <strong>Aulas hoje</strong>
          <strong>{aulasHoje}</strong>
        </div>

        <div className="flex justify-between items-center bg-green-50 text-green-700 rounded-xl p-3">
          <strong>Diárias ativas</strong>
          <strong>{diariasAtivas}</strong>
        </div>
      </div>
    </div>
  );
}

function ResumoDashboardGerencial({ dashboard }: any) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 h-full">
      <h2 className="font-black text-green-700 mb-4 flex items-center gap-2">
        <FaCalendarAlt />
        Dados do Dashboard Comercial
      </h2>

      <div className="space-y-2">
        <div className="flex justify-between items-center bg-blue-50 text-blue-700 rounded-xl p-3">
          <strong>Total de aulas</strong>
          <strong>{dashboard?.totalAulas || 0}</strong>
        </div>

        <div className="flex justify-between items-center bg-green-50 text-green-700 rounded-xl p-3">
          <strong>Compareceram</strong>
          <strong>{dashboard?.totalCompareceu || 0}</strong>
        </div>

        <div className="flex justify-between items-center bg-red-50 text-red-600 rounded-xl p-3">
          <strong>Faltaram</strong>
          <strong>{dashboard?.totalFaltou || 0}</strong>
        </div>

        <div className="flex justify-between items-center bg-purple-50 text-purple-700 rounded-xl p-3">
          <strong>Conversão</strong>
          <strong>{dashboard?.taxaConversao || 0}%</strong>
        </div>

        <div className="flex justify-between items-center border border-slate-200 rounded-xl p-3">
          <strong>Vendas por aula</strong>
          <strong>{dashboard?.vendasEfetivadas || 0}</strong>
        </div>
      </div>
    </div>
  );
}

function CardGerencial({ titulo, valor, descricao, cor, icone }: any) {
  const estilos: any = {
    blue: "from-blue-50 to-white border-blue-100 text-blue-700",
    purple: "from-purple-50 to-white border-purple-100 text-purple-700",
    orange: "from-orange-50 to-white border-orange-100 text-orange-600",
    green: "from-green-50 to-white border-green-100 text-green-700",
  };

  return (
    <div className={`bg-gradient-to-br ${estilos[cor]} rounded-3xl border shadow-sm p-5`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="font-black">{titulo}</p>
          <p className="text-4xl font-black text-slate-900 mt-3">{valor}</p>
          <p className="text-sm text-slate-600 mt-2">{descricao}</p>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-2xl">
          {icone}
        </div>
      </div>
    </div>
  );
}

function RankingGerencial({ ranking }: any) {
  const lista = Array.isArray(ranking) ? ranking : [];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-black text-orange-600 flex items-center gap-2">
          <FaTrophy />
          Ranking da Unidade
        </h2>

        <span className="text-xs font-black bg-orange-50 text-orange-600 px-3 py-1 rounded-full">
          Sem mensal
        </span>
      </div>

      <div className="space-y-3">
        {lista.slice(0, 6).map((item: any, index: number) => (
          <div
            key={`${item.nome}-${index}`}
            className="flex items-center justify-between bg-orange-50/60 border border-orange-100 rounded-2xl p-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white text-orange-600 flex items-center justify-center font-black border border-orange-100">
                {item.posicao || index + 1}º
              </div>

              <div>
                <p className="font-black text-slate-900">{item.nome}</p>
                <p className="text-xs text-slate-500">Contratos válidos</p>
              </div>
            </div>

            <p className="font-black text-orange-700 text-xl">{item.total}</p>
          </div>
        ))}

        {lista.length === 0 && (
          <p className="text-slate-500 text-sm">Nenhum ranking disponível.</p>
        )}
      </div>
    </div>
  );
}

function ProgressoUnidade({
  percentualEmpresa,
  totalEmpresa,
  metaEmpresa,
  contratosDivididos,
}: any) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 h-full">
      <h2 className="font-black text-blue-700 flex items-center gap-2 mb-4">
        <MdOutlineTrendingUp />
        Progresso da Unidade
      </h2>

      <div className="flex items-center gap-5">
        <div
          className="relative w-32 h-32 rounded-full flex items-center justify-center"
          style={{
            background: `conic-gradient(#2563eb ${Number(percentualEmpresa || 0) * 3.6}deg, #e5e7eb 0deg)`,
          }}
        >
          <div className="absolute inset-4 rounded-full bg-white" />
          <span className="relative text-3xl font-black text-slate-900">
            {percentualEmpresa}%
          </span>
        </div>

        <div>
          <p className="text-3xl font-black text-slate-900">
            {totalEmpresa} / {metaEmpresa}
          </p>
          <p className="text-sm text-slate-600 mt-1">
            contratos lançados na unidade
          </p>
          <p className="text-sm text-purple-700 font-black mt-4">
            {contratosDivididos} contrato(s) dividido(s)
          </p>
        </div>
      </div>

      <div className="h-3 bg-slate-200 rounded-full overflow-hidden mt-5">
        <div
          className="h-full bg-blue-600 rounded-full"
          style={{ width: `${percentualEmpresa}%` }}
        />
      </div>
    </div>
  );
}

function AcessosRapidosGerencial({
  onConfigurarMetas,
  onExportarPDF,
  onConferirCompartilhamentos,
  onComunicados,
}: any) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 h-full">
      <h2 className="font-black text-purple-700 mb-4">
        Acessos Rápidos
      </h2>

      <div className="space-y-3">
        <button
          type="button"
          onClick={onConfigurarMetas}
          className="w-full text-left bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-2xl p-3 font-black transition"
        >
          Configurar metas da unidade
        </button>

        <button
          type="button"
          onClick={onExportarPDF}
          className="w-full text-left bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-2xl p-3 font-black transition"
        >
          Exportar relatório gerencial
        </button>

        <button
          type="button"
          onClick={onConferirCompartilhamentos}
          className="w-full text-left bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-2xl p-3 font-black transition"
        >
          Conferir compartilhamentos
        </button>

        <button
          type="button"
          onClick={onComunicados}
          className="w-full text-left bg-green-50 hover:bg-green-100 text-green-700 rounded-2xl p-3 font-black transition"
        >
          Comunicados da equipe
        </button>
      </div>
    </div>
  );
}


function MensagemDia({
  mensagemCrista,
  mensagemMotivacional,
}: any) {
  return (
    <div className="bg-white border border-purple-100 rounded-3xl shadow-sm p-3 max-w-[760px]">
      <div className="grid md:grid-cols-[56px_1fr_1fr] gap-3 items-center">
        <div className="w-12 h-12 rounded-full bg-gradient-to-b from-purple-500 to-purple-700 text-white flex items-center justify-center text-3xl font-black shadow-md">
          ✝
        </div>

        <div>
          <p className="text-[11px] font-black text-purple-600 uppercase leading-none">
            Mensagem do Dia
          </p>

          <h2 className="text-xl font-black text-purple-700 leading-tight">
            "{mensagemCrista}"
          </h2>
        </div>

        <p className="font-semibold text-slate-700 text-sm leading-snug border-l border-purple-100 pl-4">
          {mensagemMotivacional}
        </p>
      </div>
    </div>
  );
}

function CardMetaCircular({
  titulo,
  icone,
  cor,
  percentual,
  valor,
  subtitulo,
  destaque,
  descricao,
  onEditarMeta,
}: any) {
  const cores: any = {
    purple: {
      titulo: "text-purple-700",
      barra: "bg-purple-600",
      card: "bg-purple-50",
    },
    blue: {
      titulo: "text-blue-700",
      barra: "bg-blue-600",
      card: "bg-blue-50",
    },
  };

  const estilo = cores[cor];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">

      <div className="flex items-center justify-between mb-4">

        <div className={`flex items-center gap-2 font-black ${estilo.titulo}`}>
          {icone}
          <h2>{titulo}</h2>
        </div>

        {onEditarMeta && (
          <button
            onClick={onEditarMeta}
            className="w-9 h-9 rounded-full bg-purple-100 hover:bg-purple-200 flex items-center justify-center"
          >
            <FaCog className="text-purple-700" />
          </button>
        )}
      </div>

      <div className="flex gap-4 items-center">

        <div className="relative w-28 h-28">
          <svg className="w-28 h-28 -rotate-90">
            <circle
              cx="56"
              cy="56"
              r="45"
              stroke="#e5e7eb"
              strokeWidth="10"
              fill="none"
            />

            <circle
              cx="56"
              cy="56"
              r="45"
              stroke={cor === "purple" ? "#9333ea" : "#2563eb"}
              strokeWidth="10"
              fill="none"
              strokeDasharray={`${(percentual * 283) / 100} 283`}
            />
          </svg>

          <div className="absolute inset-0 flex items-center justify-center text-xl font-black">
            {percentual}%
          </div>
        </div>

        <div className="flex-1">
          <div className="text-5xl font-black text-slate-900">
            {valor}
          </div>

          <p className="text-slate-500">
            {subtitulo}
          </p>

          <div className="w-full h-3 bg-slate-200 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full ${estilo.barra}`}
              style={{ width: `${percentual}%` }}
            />
          </div>
        </div>
      </div>

      <div className={`${estilo.card} rounded-2xl p-4 mt-4`}>
        <p className={`font-black text-xl ${estilo.titulo}`}>
          {destaque}
        </p>

        <p className="text-slate-700">
          {descricao}
        </p>
      </div>
    </div>
  );
}


function contratoContaMetaGeralTela(contrato: any) {
  if (contrato?.cancelado) return false;
  if (contrato?.trocaModalidade) return false;
  return true;
}

function contratoContaComissaoTela(contrato: any) {
  if (!contratoContaMetaGeralTela(contrato)) return false;
  if (contrato?.transferenciaUnidade) return false;
  if (String(contrato?.permanencia || "").toUpperCase() === "MENSAL") return false;
  return true;
}


function CardPosicao({
  posicao,
  faltam,
}: any) {

  const pertoDaMeta =
    Number(faltam || 0) <= 10 &&
    Number(faltam || 0) > 0;

  return (
    <div className="bg-orange-50 border border-orange-100 rounded-3xl shadow-sm p-5">

      <div className="flex justify-between items-center mb-4">

        <div className="flex items-center gap-2 font-black text-orange-600">
          <FaTrophy />
          Minha Posição
        </div>

        <div className="w-11 h-11 rounded-full border border-orange-200 flex items-center justify-center">
          <MdOutlineTrendingUp className="text-orange-500 text-xl" />
        </div>
      </div>

      <div className="bg-white border border-orange-100 rounded-3xl p-5 text-center">

        <div className="text-6xl font-black text-orange-800">
          {posicao}º Lugar
        </div>

        <h3 className="font-black text-xl mt-3">
          {pertoDaMeta ? "Está bem perto!" : "Continue firme!"}
        </h3>

        <p className="text-slate-700 mt-3">
          {faltam > 0 ? (
            pertoDaMeta ? (
              <>
                Falta apenas <strong>{faltam}</strong> contrato(s)
                para atingir a próxima meta.
              </>
            ) : (
              <>
                Faltam apenas <strong>{faltam}</strong> contratos
                para atingir sua primeira meta.
              </>
            )
          ) : (
            <>
              Você já atingiu esta meta.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
function CardGanhos({ premiacaoAtualValor, campanhaExtraValor, totalGanhos, formatarDinheiro }: any) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center gap-2 font-black text-green-700 mb-4">
        <FaMoneyBillWave />
        Meus Ganhos
      </div>

      <p className="text-slate-500">Premiação atual</p>
      <p className="text-xl font-black text-green-700">{formatarDinheiro(premiacaoAtualValor)}</p>

      <p className="text-slate-500 mt-4">Campanha extra</p>
      <p className="text-xl font-black text-green-700">{formatarDinheiro(campanhaExtraValor)}</p>

      <hr className="my-4" />

      <p className="text-slate-500">Total</p>
      <p className="text-4xl font-black text-green-700">{formatarDinheiro(totalGanhos)}</p>
    </div>
  );
}

function MetasPremiacao({ metas, realizado, formatarDinheiro }: any) {
  const lista = metas.length
    ? metas
    : [
        { quantidade: 30, valor: 300 },
        { quantidade: 40, valor: 500 },
        { quantidade: 50, valor: 800 },
        { quantidade: 60, valor: 1200 },
      ];

  const estilos = [
    {
      box: "bg-orange-50 border-orange-200",
      texto: "text-orange-700",
      barra: "bg-orange-500",
      badge: "border-orange-300 text-orange-600 bg-white",
    },
    {
      box: "bg-blue-50 border-blue-200",
      texto: "text-blue-700",
      barra: "bg-blue-600",
      badge: "border-blue-300 text-blue-600 bg-white",
    },
    {
      box: "bg-amber-50 border-amber-200",
      texto: "text-orange-600",
      barra: "bg-orange-500",
      badge: "border-orange-300 text-orange-600 bg-white",
    },
    {
      box: "bg-purple-50 border-purple-200",
      texto: "text-purple-700",
      barra: "bg-purple-700",
      badge: "border-purple-300 text-purple-700 bg-white",
    },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 h-full">
      <div className="flex items-center gap-2 mb-4">
        <FaTrophy className="text-orange-500 text-xl" />
        <h2 className="font-black text-purple-700">
          Metas com Premiação
        </h2>
        <span className="text-xs text-slate-500">
          Premiação estabelecida pela empresa
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {lista.map((meta: any, index: number) => {
          const quantidade = Number(meta.quantidade || 0);
          const valor = Number(meta.valor || 0);
          const pct =
            quantidade > 0
              ? Math.min(Math.round((Number(realizado || 0) / quantidade) * 100), 100)
              : 0;

          const estilo = estilos[index] || estilos[0];

          return (
            <div
              key={index}
              className={`border rounded-2xl p-4 ${estilo.box}`}
            >
              <div className="flex justify-between items-start">
                <div className={`text-3xl ${estilo.texto}`}>
                  {index === 3 ? <FaGem /> : <FaMedal />}
                </div>

                <span className={`text-xs font-black ${estilo.texto}`}>
                  META {index + 1}
                </span>
              </div>

              <p className="text-4xl font-black text-slate-900 mt-3">
                {quantidade}
              </p>
              <p className="text-slate-700">contratos</p>

              <div className="mt-4">
                <p className="text-xs text-slate-600">Progresso</p>
                <p className="font-black text-slate-900">
                  {realizado} / {quantidade}
                </p>

                <div className="flex items-center gap-2 mt-1">
                  <div className="h-2 bg-slate-200 rounded-full flex-1 overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${estilo.barra}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <span className={`text-xs font-black border rounded-lg px-2 py-0.5 ${estilo.badge}`}>
                    {pct}%
                  </span>
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-600">Prêmio</p>
              <p className={`font-black text-lg ${estilo.texto}`}>
                {formatarDinheiro(valor)}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-3 bg-slate-50 border border-slate-100 rounded-xl p-2 text-xs text-slate-700">
        <strong>Observação:</strong> a premiação do mês não é acumulativa. Vale a maior meta atingida.
      </div>
    </div>
  );
}

function CampanhaExtraCard({ campanha }: any) {
  if (!campanha?.ativa) return null;

  const progresso = Number(campanha?.progresso || 0);
  const objetivo = Number(campanha?.objetivo || 1);
  const pct =
    objetivo > 0
      ? Math.min(Math.round((progresso / objetivo) * 100), 100)
      : 0;

  return (
    <div className="bg-gradient-to-br from-purple-50 to-white rounded-3xl border border-purple-100 shadow-sm p-5">
      <h2 className="font-black text-purple-700 mb-4 flex items-center gap-2">
        <span className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
          <FaRocket />
        </span>
        Campanha Extra Ativa
      </h2>

      <div className="bg-white border border-purple-100 rounded-2xl p-4">
        <h3 className="font-black text-slate-900">
          {campanha?.titulo}
        </h3>

        <p className="mt-3 text-slate-700 flex items-center gap-2">
          <FaBullseye className="text-purple-700" />
          <strong>{campanha?.regra}</strong>
        </p>

        <p className="mt-2 text-slate-700 flex items-center gap-2">
          <FaMoneyBillWave className="text-purple-700" />
          <strong>Prêmio:</strong> {campanha?.premio}
        </p>

        <p className="mt-4 font-black text-slate-900">
          Seu progresso
        </p>

        <p className="text-4xl font-black text-purple-700">
          {progresso} / {objetivo}
        </p>

        <p className="text-sm text-slate-500">
          {campanha?.unidade || "indicações fechadas"}
        </p>

        {campanha?.funcionarias && (
          <div className="bg-green-50 border border-green-100 rounded-xl p-3 mt-3">
            <p className="text-xs font-black text-green-700">
              Meta extra concluída por:
            </p>
            <p className="text-sm text-green-800">{campanha.funcionarias}</p>
          </div>
        )}

        <div className="h-3 bg-purple-100 rounded-full mt-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-fuchsia-500 rounded-full"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function ComunicadosCard({ comunicados }: any) {
  const [mostrarTodos, setMostrarTodos] = useState(false);

  const lista = Array.isArray(comunicados)
    ? comunicados.filter((item: any) => {
        const titulo = String(item?.titulo || item?.nome || "").trim();
        const texto = textoComunicado(item);
        return titulo || texto;
      })
    : [];

  function iconeComunicado(tipo: string) {
    const tipoNormalizado = String(tipo || "").toLowerCase();

    if (tipoNormalizado === "campanha") {
      return (
        <span className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
          <FaTrophy />
        </span>
      );
    }

    if (
      tipoNormalizado === "plano" ||
      tipoNormalizado === "lancamento" ||
      tipoNormalizado === "lançamento"
    ) {
      return (
        <span className="w-10 h-10 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center">
          <FaMoneyBillWave />
        </span>
      );
    }

    return (
      <span className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
        <FaBullhorn />
      </span>
    );
  }

  function textoComunicado(item: any) {
    const camposPossiveis = [
      item?.mensagem,
      item?.texto,
      item?.descricao,
      item?.descrição,
      item?.conteudo,
      item?.conteúdo,
      item?.subtitulo,
      item?.subtítulo,
      item?.comunicado1Mensagem,
      item?.comunicado1Texto,
      item?.comunicado2Mensagem,
      item?.comunicado2Texto,
      item?.comunicado3Mensagem,
      item?.comunicado3Texto,
      item?.lancamento1Mensagem,
      item?.lancamento1Texto,
      item?.lancamento1Descricao,
      item?.lancamento2Mensagem,
      item?.lancamento2Texto,
      item?.lancamento2Descricao,
    ];

    for (const campo of camposPossiveis) {
      const texto = String(campo || "").trim();
      if (texto) return texto;
    }

    return "";
  }

  const listaExibida = mostrarTodos ? lista : lista.slice(0, 3);

  return (
    <div id="comunicados-equipe" className="bg-gradient-to-br from-blue-50 to-white rounded-3xl border border-blue-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-black text-blue-700 flex items-center gap-2">
          <span className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <FaBullhorn />
          </span>
          Comunicados
        </h2>

        <button
          type="button"
          onClick={() => setMostrarTodos((valor) => !valor)}
          className="text-sm font-black text-blue-700 hover:underline"
        >
          {mostrarTodos ? "Ver menos" : "Ver todos"}
        </button>
      </div>

      <div className="bg-white border border-blue-100 rounded-2xl overflow-hidden">
        {lista.length === 0 && (
          <div className="p-4 text-slate-500 text-sm">
            Nenhum comunicado cadastrado para este mês.
          </div>
        )}

        {listaExibida.map((item: any, index: number) => {
          const titulo = String(item?.titulo || item?.nome || "Comunicado").trim();
          const texto = textoComunicado(item);

          return (
            <div
              key={index}
              className="flex gap-3 p-4 border-b border-slate-100 last:border-b-0"
            >
              {iconeComunicado(item?.tipo)}

              <div className="flex-1">
                <p className="font-black text-slate-900">
                  {titulo}
                </p>

                {texto ? (
                  <p className="text-slate-600 text-sm mt-1 whitespace-pre-line">
                    {texto}
                  </p>
                ) : (
                  <p className="text-red-500 text-xs mt-1">
                    Mensagem não chegou da API. Verificar rota app/api/metas/route.ts.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResumoContratos({ planos }: any) {
  return (
    <ResumoBox
      titulo="Resumo de Contratos"
      corTitulo="text-blue-700"
      linhas={[
        {
          nome: "Anuais",
          valor: planos?.anual || 0,
          estilo: "bg-blue-50 text-blue-700",
          icon: <FaFileContract />,
        },
        {
          nome: "Semestrais",
          valor: planos?.semestral || 0,
          estilo: "bg-green-50 text-green-700",
          icon: <FaCalendarAlt />,
        },
        {
          nome: "Trimestrais",
          valor: planos?.trimestral || 0,
          estilo: "bg-orange-50 text-orange-600",
          icon: <FaCalendarAlt />,
        },
        {
          nome: "Mensais",
          valor: planos?.mensal || 0,
          estilo: "bg-rose-50 text-rose-600",
          icon: <FaRegFileAlt />,
        },
      ]}
    />
  );
}

function TiposContrato({ tipos }: any) {
  return (
    <ResumoBox
      titulo="Por Tipo de Contrato"
      corTitulo="text-red-600"
      linhas={[
        {
          nome: "Novos",
          valor: tipos?.novos || 0,
          estilo: "bg-green-50 text-green-700",
          icon: <FaUserPlus />,
        },
        {
          nome: "Retornos",
          valor: tipos?.retornos || 0,
          estilo: "bg-purple-50 text-purple-700",
          icon: <FaSyncAlt />,
        },
        {
          nome: "Renovações",
          valor: tipos?.renovacoes || 0,
          estilo: "bg-orange-50 text-orange-600",
          icon: <FaRedoAlt />,
        },
      ]}
    />
  );
}

function ResumoBox({ titulo, linhas, corTitulo }: any) {
  const total = linhas.reduce(
    (acc: number, item: any) => acc + Number(item.valor || 0),
    0
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 h-full">
      <h2 className={`font-black mb-4 ${corTitulo || "text-purple-700"}`}>
        {titulo}
      </h2>

      <div className="space-y-2">
        {linhas.map((item: any) => (
          <div
            key={item.nome}
            className={`flex justify-between items-center rounded-xl p-3 ${item.estilo}`}
          >
            <div className="flex items-center gap-2 font-black">
              {item.icon}
              <span>{item.nome}</span>
            </div>

            <strong>{item.valor}</strong>
          </div>
        ))}

        <div className="flex justify-between border border-slate-200 rounded-xl p-3 mt-3">
          <strong>Total</strong>
          <strong>{total}</strong>
        </div>
      </div>
    </div>
  );
}

function ConquistasCard({ total, totalComMensal, metaPessoal }: any) {
  const conquistas = [
    {
      nome: "Primeira venda",
      feito: Number(totalComMensal || 0) >= 1,
      icon: <FaCheckCircle />,
    },
    {
      nome: "10 contratos",
      feito: Number(total || 0) >= 10,
      icon: <FaMedal />,
    },
    {
      nome: "25 contratos",
      feito: Number(total || 0) >= 25,
      icon: <FaMedal />,
    },
    {
      nome: "50 contratos",
      feito: Number(total || 0) >= 50,
      icon: <FaGem />,
    },
    {
      nome: "Meta pessoal",
      feito: Number(totalComMensal || 0) >= Number(metaPessoal || 0),
      icon: <FaBullseye />,
    },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 h-full">
      <h2 className="font-black text-purple-700 mb-4">
        <FaTrophy className="inline mr-2 text-orange-500" />
        Minhas Conquistas
      </h2>

      <div className="grid grid-cols-5 gap-3">
        {conquistas.map((item: any) => (
          <div key={item.nome} className="text-center">
            <div
              className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center border ${
                item.feito
                  ? "bg-purple-100 text-purple-700 border-purple-200"
                  : "bg-slate-100 text-slate-400 border-slate-200"
              }`}
            >
              <div className="text-2xl">
                {item.feito ? item.icon : <FaLock />}
              </div>
            </div>

            <div className="text-orange-500 mt-1">
              <FaTrophy className="mx-auto text-xs" />
            </div>

            <p className="text-xs font-bold mt-1 leading-tight">
              {item.nome}
            </p>
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-slate-600 mt-4">
        Continue assim! Cada conquista te leva ainda mais longe.
      </p>
    </div>
  );
}

function ModalMetaPessoal({ metaAtual, fechar, salvar }: any) {
  const [novaMeta, setNovaMeta] = useState(metaAtual);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md">
        <h2 className="text-xl font-black text-purple-700 mb-4">Editar Meta Pessoal</h2>

        <input
          type="number"
          value={novaMeta}
          onChange={(e) => setNovaMeta(Number(e.target.value))}
          className="w-full border rounded-xl p-3"
        />

        <div className="flex gap-3 mt-6">
          <button onClick={() => salvar(novaMeta)} className="flex-1 bg-purple-700 text-white rounded-xl py-3 font-bold">
            Salvar
          </button>
          <button onClick={fechar} className="flex-1 bg-slate-200 rounded-xl py-3 font-bold">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
function ContratosTabela({
  contratos,
  usuario,
  pesquisaContrato,
  setPesquisaContrato,
  filtroDividido,
  setFiltroDividido,
  filtroDivididoCom,
  setFiltroDivididoCom,
  filtroVendedora,
  setFiltroVendedora,
  filtroDataInicialContrato,
  setFiltroDataInicialContrato,
  filtroDataFinalContrato,
  setFiltroDataFinalContrato,
  dataInicialContratoTemp,
  setDataInicialContratoTemp,
  dataFinalContratoTemp,
  setDataFinalContratoTemp,
  aplicarFiltroPeriodoContratos,
  nomesDivididos,
  nomesVendedoras,
  limparFiltros,
  formatarData,
  setContratoVisualizar,
  editarContrato,
  excluirContrato,
}: any) {
  return (
    <div id="ultimos-contratos" className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 mt-4">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <h2 className="font-black text-purple-700">
          <MdOutlineAssignment className="inline mr-2" />
          Últimos Contratos
        </h2>

        <div className="flex flex-wrap gap-2">
          <input
            value={pesquisaContrato}
            onChange={(e) => setPesquisaContrato(e.target.value)}
            placeholder="Pesquisar contrato..."
            className="border rounded-xl px-3 py-2 text-sm w-72"
          />

          <input
            type="date"
            value={dataInicialContratoTemp}
            onChange={(e) => setDataInicialContratoTemp(e.target.value)}
            title="Data inicial"
            className="border rounded-xl px-3 py-2 text-sm"
          />

          <input
            type="date"
            value={dataFinalContratoTemp}
            onChange={(e) => setDataFinalContratoTemp(e.target.value)}
            title="Data final"
            className="border rounded-xl px-3 py-2 text-sm"
          />

          <button
            type="button"
            onClick={aplicarFiltroPeriodoContratos}
            className="border border-blue-600 bg-blue-600 text-white rounded-xl px-4 py-2 text-sm font-bold"
            title="Aplicar período"
          >
            Filtrar
          </button>

          <select
            value={filtroVendedora}
            onChange={(e) => setFiltroVendedora(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm"
          >
            <option value="TODAS">Todas as vendedoras</option>
            {(nomesVendedoras || []).map((nome: any) => (
              <option key={nome} value={nome}>
                {nome}
              </option>
            ))}
          </select>

          <select
            value={filtroDividido}
            onChange={(e) => setFiltroDividido(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm"
          >
            <option value="TODOS">Todos</option>
            <option value="SIM">Somente divididos</option>
            <option value="NAO">Não divididos</option>
          </select>

          <select
            value={filtroDivididoCom}
            onChange={(e) => setFiltroDivididoCom(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm"
          >
            <option value="TODOS">Dividido com todos</option>
            {nomesDivididos.map((nome: any) => (
              <option key={nome} value={nome}>
                {nome}
              </option>
            ))}
          </select>

          <button
            onClick={limparFiltros}
            className="border rounded-xl px-3 py-2 text-sm font-bold"
          >
            Limpar
          </button>
        </div>
      </div>

      <div className="overflow-auto">
        <table className="w-full min-w-[1150px] text-sm">
          <thead>
            <tr className="border-y">
              <th className="p-2 text-left">Data</th>
              <th className="p-2 text-left">Matrícula</th>
              <th className="p-2 text-left">Aluno</th>
              <th className="p-2 text-left">Plano</th>
              <th className="p-2 text-left">Tipo</th>
              <th className="p-2 text-left">Permanência</th>
              <th className="p-2 text-left">Origem</th>
<th className="p-2 text-left">Dividido</th>
<th className="p-2 text-left">Com quem</th>
              <th className="p-2 text-left">Observação</th>
              <th className="p-2 text-left">Ações</th>
            </tr>
          </thead>

          <tbody>
           {contratos.map((contrato: any) => {
  const nomeUsuario = String(usuario?.nome || "").toUpperCase();
  const vendedoraContrato = String(contrato.vendedora || "").toUpperCase();
  const divididoComContrato = String(contrato.divididoCom || "").toUpperCase();

  const compartilhadoComUsuario =
    contrato.contratoDividido &&
    divididoComContrato === nomeUsuario &&
    vendedoraContrato !== nomeUsuario;

  return (
    <tr key={contrato.id} className="border-b">
                <td className="p-2">{formatarData(contrato.dataVenda)}</td>
                <td className="p-2">{contrato.matricula || "-"}</td>
                <td className="p-2 font-black">{contrato.nomeAluno}</td>
                <td className="p-2">{contrato.plano}</td>
                <td className="p-2">{contrato.tipoContrato}</td>
                <td className="p-2">{contrato.permanencia}</td>
                <td className="p-2">
                  <div className="flex flex-col gap-1 text-xs font-black">
                    {contrato.transferenciaUnidade && (
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-700">
                        Transferência: {contrato.unidadeOrigemNome || "-"}
                      </span>
                    )}
                    {contrato.acrescimoModalidade && (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">
                        Acréscimo: {contrato.modalidadeAnterior || "-"} + {contrato.plano || "-"}
                      </span>
                    )}
                    {contrato.trocaModalidade && (
                      <span className="rounded-full bg-red-100 px-2 py-1 text-red-700">
                        Trocou {contrato.modalidadeAnterior || "-"} por {contrato.plano || "-"}
                      </span>
                    )}
                    {!contrato.transferenciaUnidade && !contrato.acrescimoModalidade && !contrato.trocaModalidade && "-"}
                  </div>
                </td>
                <td className="p-2">
  {contrato.contratoDividido &&
   String(contrato.divididoCom || "").toUpperCase() ===
   String(usuario?.nome || "").toUpperCase() &&
   String(contrato.vendedora || "").toUpperCase() !==
   String(usuario?.nome || "").toUpperCase() ? (
    <span className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-black text-xs">
      <FaSyncAlt />
      Compartilhado por {contrato.vendedora}
    </span>
  ) : (
    <span className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full font-black text-xs">
      Próprio
    </span>
  )}
</td>
                <td className="p-2">
                  {contrato.contratoDividido ? "Sim" : "Não"}
                </td>
                <td className="p-2">
                  {contrato.contratoDividido
                    ? contrato.divididoCom || "-"
                    : "-"}
                </td>
                <td className="p-2 max-w-[180px] truncate">
                  {contrato.observacao || "-"}
                </td>
                <td className="p-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setContratoVisualizar(contrato)}
                      className="bg-purple-50 text-purple-700 p-2 rounded-lg"
                      title="Visualizar"
                    >
                      <FaEye />
                    </button>

                    <button
                      onClick={() => editarContrato(contrato)}
                      className="bg-slate-100 text-slate-700 p-2 rounded-lg"
                      title="Editar"
                    >
                      <FaEdit />
                    </button>

                    <button
                      onClick={() => excluirContrato(contrato.id)}
                      className="bg-red-50 text-red-600 p-2 rounded-lg"
                      title="Excluir"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
                         </tr>
          );
        })}

            {contratos.length === 0 && (
              <tr>
                <td colSpan={11} className="p-5 text-slate-500">
                  Nenhum contrato encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ModalContrato({
  contrato,
  fechar,
  editarContrato,
  formatarData,
  formatarDinheiro,
}: any) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-3xl shadow-2xl">
        <div className="flex justify-between items-start mb-5">
          <div>
            <h2 className="text-xl font-black">
              Contrato #{contrato.matricula || contrato.id}
            </h2>
            <p className="text-slate-500">{contrato.nomeAluno}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => editarContrato(contrato)}
              className="bg-purple-700 text-white px-4 py-2 rounded-xl font-bold"
            >
              Editar
            </button>

            <button
              onClick={fechar}
              className="bg-slate-200 px-4 py-2 rounded-xl font-bold"
            >
              Fechar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <Info titulo="Matrícula" valor={contrato.matricula} />
          <Info titulo="Aluno" valor={contrato.nomeAluno} />
          <Info titulo="Vendedora" valor={contrato.vendedora} />
          <Info titulo="Plano" valor={contrato.plano} />
          <Info titulo="Tipo" valor={contrato.tipoContrato} />
          <Info titulo="Permanência" valor={contrato.permanencia} />
          <Info
            titulo="Data da venda"
            valor={formatarData(contrato.dataVenda)}
          />
          <Info
            titulo="1ª parcela"
            valor={formatarDinheiro(contrato.valorPrimeiraParcela)}
          />
          <Info
            titulo="Convênio"
            valor={contrato.convenio ? contrato.nomeConvenio || "Sim" : "Não"}
          />
          <Info
            titulo="Dividido"
            valor={contrato.contratoDividido ? "Sim" : "Não"}
          />
          <Info titulo="Dividido com" valor={contrato.divididoCom || "-"} />
          <Info
            titulo="Transferência de unidade"
            valor={contrato.transferenciaUnidade ? `Sim - origem: ${contrato.unidadeOrigemNome || "-"}` : "Não"}
          />
          <Info
            titulo="Acréscimo de modalidade"
            valor={contrato.acrescimoModalidade ? `${contrato.modalidadeAnterior || "-"} + ${contrato.plano || "-"}` : "Não"}
          />
          <Info
            titulo="Troca de modalidade"
            valor={contrato.trocaModalidade ? `Trocou ${contrato.modalidadeAnterior || "-"} por ${contrato.plano || "-"}` : "Não"}
          />
        </div>

        <div className="mt-5">
          <h3 className="font-black mb-2">Observação</h3>
          <p className="bg-slate-100 rounded-xl p-3">
            {contrato.observacao || "-"}
          </p>
        </div>
      </div>
    </div>
  );
}

function Info({ titulo, valor }: any) {
  return (
    <div className="bg-slate-100 rounded-xl p-3">
      <p className="text-slate-500 font-semibold">{titulo}</p>
      <p className="font-black">{valor || "-"}</p>
    </div>
  );
}