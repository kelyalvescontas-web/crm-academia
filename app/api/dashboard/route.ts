import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function hojeISO() {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const ano = partes.find((p) => p.type === "year")?.value || "";
  const mes = partes.find((p) => p.type === "month")?.value || "";
  const dia = partes.find((p) => p.type === "day")?.value || "";

  return `${ano}-${mes}-${dia}`;
}

function getMesAtual() {
  return hojeISO().slice(0, 7);
}

function dataParaISO(data: any) {
  const valor = String(data || "").trim();
  if (!valor) return "";

  if (/^\d{4}-\d{2}-\d{2}/.test(valor)) {
    return valor.slice(0, 10);
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(valor)) {
    const [dia, mes, ano] = valor.split("/");
    return `${ano}-${mes}-${dia}`;
  }

  return valor;
}

function pertenceAoMes(data: string, mesReferencia: string) {
  const iso = dataParaISO(data);
  if (!iso) return false;
  return iso.startsWith(mesReferencia);
}

function mesmaData(data: string, dataISO: string) {
  return dataParaISO(data) === dataISO;
}

function normalizar(texto: any) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

function nomeBonito(texto: any) {
  const base = normalizar(texto);
  if (!base || base === "NAO INFORMADO") return "NÃO INFORMADO";
  return base
    .toLowerCase()
    .split(" ")
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
    .join(" ");
}

function diariaAtivaNoMes(diaria: any, mesReferencia: string) {
  const inicioMes = `${mesReferencia}-01`;
  const [ano, mes] = mesReferencia.split("-").map(Number);
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const fimMes = `${mesReferencia}-${String(ultimoDia).padStart(2, "0")}`;

  return dataParaISO(diaria.dataInicio) <= fimMes && dataParaISO(diaria.dataFinal) >= inicioMes;
}

function tipoVendaContrato(contrato: any) {
  const base = normalizar(contrato.tipoVenda || contrato.tipoAluno || contrato.tipoContrato || contrato.plano || "");

  if (base.includes("RENOV")) return "renovacao";
  if (base.includes("RETOR")) return "retorno";
  return "novo";
}

function permanenciaContrato(contrato: any) {
  const base = normalizar(`${contrato.permanencia || ""} ${contrato.plano || ""} ${contrato.tipoContrato || ""}`);

  if (base.includes("ANUAL")) return "ANUAL";
  if (base.includes("SEMEST")) return "SEMESTRAL";
  if (base.includes("TRIMEST")) return "TRIMESTRAL";
  if (base.includes("MENSAL")) return "MENSAL";
  return normalizar(contrato.permanencia || contrato.plano || "OUTROS") || "OUTROS";
}

function vazioTipos() {
  return { novo: 0, retorno: 0, renovacao: 0, total: 0 };
}

function contarTipos(contratos: any[], unidadeId?: number | null) {
  const resultado = vazioTipos();

  contratos
    .filter((contrato) => contaNaMetaGeral(contrato, unidadeId))
    .forEach((contrato) => {
      const tipo = tipoVendaContrato(contrato) as "novo" | "retorno" | "renovacao";
      resultado[tipo] += 1;
      resultado.total += 1;
    });

  return resultado;
}

function adicionarRankingContrato(
  ranking: any,
  nome: string,
  contrato: any,
  peso: number,
  unidadeAtualId?: number | null
) {
  const chave = normalizar(nome || "NÃO INFORMADO") || "NÃO INFORMADO";

  if (!ranking[chave]) {
    ranking[chave] = {
      vendedora: nomeBonito(chave),
      meiosTotais: 0,
      meiosValidos: 0,
      contratosTotaisBase: 0,
      contratosValidosBase: 0,
    };
  }

  const contaTotal = contaNaMetaGeral(contrato, unidadeAtualId);
  const contaValido = contaNaComissao(contrato, unidadeAtualId);

  if (!contaTotal) return;

  if (peso === 0.5) {
    // Meio mensal entra apenas como meio total/pendente, mas NUNCA como meio válido.
    // Meio de transferência/troca/cancelado também não entra nos válidos.
    ranking[chave].meiosTotais += 1;

    if (contaValido) {
      ranking[chave].meiosValidos += 1;
    }

    return;
  }

  ranking[chave].contratosTotaisBase += 1;

  if (contaValido) {
    ranking[chave].contratosValidosBase += 1;
  }
}


function isTransferenciaUnidade(contrato: any) {
  return contrato?.transferenciaUnidade === true || String(contrato?.transferenciaUnidade || "").toLowerCase() === "true";
}

function isAcrescimoModalidade(contrato: any) {
  return contrato?.acrescimoModalidade === true || String(contrato?.acrescimoModalidade || "").toLowerCase() === "true";
}

function isTrocaModalidade(contrato: any) {
  return contrato?.trocaModalidade === true || String(contrato?.trocaModalidade || "").toLowerCase() === "true";
}

function contaNaMetaGeral(contrato: any, unidadeAtualId?: number | null) {
  if (contrato?.cancelado) return false;
  if (isTrocaModalidade(contrato)) return false;

  if (isTransferenciaUnidade(contrato) && unidadeAtualId) {
    return Number(contrato.unidadeId) === Number(unidadeAtualId);
  }

  return true;
}

function contaNaComissao(contrato: any, unidadeAtualId?: number | null) {
  if (!contaNaMetaGeral(contrato, unidadeAtualId)) return false;
  if (permanenciaContrato(contrato) === "MENSAL") return false;
  if (isTransferenciaUnidade(contrato)) return false;
  if (isTrocaModalidade(contrato)) return false;

  return true;
}


function montarRankingContratos(contratos: any[], unidadeAtualId?: number | null) {
  const ranking: any = {};

  contratos.forEach((contrato) => {
    const dividido = Boolean(
      contrato.contratoDividido ||
        Number(contrato.quantidadeMeios || 0) > 0 ||
        contrato.divididoCom
    );

    if (dividido && contrato.divididoCom) {
      adicionarRankingContrato(ranking, contrato.vendedora, contrato, 0.5, unidadeAtualId);
      adicionarRankingContrato(ranking, contrato.divididoCom, contrato, 0.5, unidadeAtualId);
    } else {
      adicionarRankingContrato(ranking, contrato.vendedora, contrato, 1, unidadeAtualId);
    }
  });

  return Object.values(ranking)
    .map((item: any) => {
      const contratosInteirosDosMeiosTotais = Math.floor(Number(item.meiosTotais || 0) / 2);
      const contratosInteirosDosMeiosValidos = Math.floor(Number(item.meiosValidos || 0) / 2);
      const meiosPendentes = Number(item.meiosValidos || 0) % 2;

      return {
        vendedora: item.vendedora,
        meiosPendentes,
        contratosTotais: Number(item.contratosTotaisBase || 0) + contratosInteirosDosMeiosTotais,
        contratosValidos: Number(item.contratosValidosBase || 0) + contratosInteirosDosMeiosValidos,
      };
    })
    .sort((a: any, b: any) => Number(b.contratosTotais) - Number(a.contratosTotais));
}


function diariaConvertida(diaria: any) {
  const converteuVendaTexto = String(
    diaria.converteuVenda ?? diaria.convertidaEmVenda ?? ""
  )
    .trim()
    .toLowerCase();

  return (
    diaria.converteuVenda === true ||
    diaria.convertidaEmVenda === true ||
    converteuVendaTexto === "true" ||
    converteuVendaTexto === "1" ||
    converteuVendaTexto === "sim" ||
    String(diaria.planoConvertido || "").trim() !== "" ||
    String(diaria.dataConversao || "").trim() !== "" ||
    String(diaria.vendedoraConversao || "").trim() !== ""
  );
}

function nomeVendedoraDiaria(diaria: any) {
  return nomeBonito(diaria.vendedoraConversao || diaria.vendedora || diaria.colaboradora || "NÃO INFORMADO");
}

function calcularConversaoDiarias(diariasDoMes: any[]) {
  const convertidas = diariasDoMes.filter(diariaConvertida);
  const ranking: any = {};

  convertidas.forEach((diaria) => {
    const nome = nomeVendedoraDiaria(diaria);
    ranking[nome] = (ranking[nome] || 0) + 1;
  });

  return {
    diariasMes: diariasDoMes.length,
    convertidasMes: convertidas.length,
    taxaConversaoMes: diariasDoMes.length > 0 ? Math.round((convertidas.length / diariasDoMes.length) * 100) : 0,
    rankingConversao: ranking,
  };
}

function isConsultaFreeOuParticular(consulta: any) {
  const tipo = normalizar(consulta.tipoConsulta);
  const pagamento = normalizar(consulta.statusPagamento);

  return tipo.includes("FREE") || tipo.includes("PARTICULAR") || pagamento.includes("FREE");
}

function isConsultaConvertida(consulta: any) {
  return (
    consulta.converteuPlano === true ||
    consulta.convertidoEmPlano === true ||
    Boolean(consulta.planoConvertido) ||
    Boolean(consulta.dataConversao) ||
    Boolean(consulta.vendedoraConversao)
  );
}

function nomeVendedoraNutri(consulta: any) {
  return nomeBonito(consulta.vendedoraConversao || consulta.nomeVendedoraConversao || consulta.vendedora || "NÃO INFORMADO");
}

async function carregarConsultasNutricionista(mesReferencia: string, unidadeId: number | null) {
  const tabelas = ["NutritionAppointment", "AgendaNutricionista", "NutricionistaAgendamento"];

  for (const tabela of tabelas) {
    try {
      const whereUnidade = unidadeId ? `AND "unidadeId" = ${Number(unidadeId)}` : "";
      const consultas: any[] = await prisma.$queryRawUnsafe(
        `SELECT * FROM "${tabela}" WHERE "dataConsulta" LIKE '${mesReferencia}%' ${whereUnidade}`
      );

      if (Array.isArray(consultas)) return consultas;
    } catch (error) {
      // tenta o próximo nome de tabela
    }
  }

  return [];
}


export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const unidadeIdParam = searchParams.get("unidadeId");
    const mesParam = searchParams.get("mes");

    const unidadeId = unidadeIdParam ? Number(unidadeIdParam) : null;
    const mesReferencia = mesParam || getMesAtual();
    const hoje = hojeISO();

    const aulas = await prisma.aula.findMany({
      where: unidadeId ? { unidadeId } : {},
    });

    const diarias: any[] = unidadeId
      ? await prisma.$queryRaw`
          SELECT *
          FROM "Diaria"
          WHERE "unidadeId" = ${unidadeId}
        `
      : await prisma.$queryRaw`
          SELECT *
          FROM "Diaria"
        `;

    const contratos = await prisma.contratoMeta.findMany({
      where: unidadeId
        ? {
            OR: [
              { unidadeId },
              {
                transferenciaUnidade: true,
                unidadeOrigemId: unidadeId,
              },
            ],
          }
        : {},
    });

    const aulasDoMes = aulas.filter((aula) => pertenceAoMes(aula.data, mesReferencia));
    const aulasHoje = aulasDoMes.filter((aula) => mesmaData(aula.data, hoje));

    const contratosDoMesRelatorio = contratos.filter((contrato) => pertenceAoMes(contrato.dataVenda, mesReferencia));
    const contratosDoMes = contratosDoMesRelatorio.filter((contrato) => contaNaMetaGeral(contrato, unidadeId));
    const contratosHoje = contratosDoMes.filter((contrato) => mesmaData(contrato.dataVenda, hoje));

    const diariasDoMes = diarias.filter((diaria) => diariaAtivaNoMes(diaria, mesReferencia));

    const totalCompareceu = aulasDoMes.filter(
      (aula) => aula.veio === true || aula.status === "COMPARECEU"
    ).length;

    const totalFaltou = aulasDoMes.filter(
      (aula) => aula.faltou === true || aula.status === "FALTOU"
    ).length;

    const vendasDoMes = aulasDoMes.filter(
      (aula) => aula.vendaEfetivada === true || aula.status === "VENDA EFETIVADA"
    );

    const vendasEfetivadas = vendasDoMes.length;

    const taxaComparecimento = aulasDoMes.length > 0 ? Math.round((totalCompareceu / aulasDoMes.length) * 100) : 0;
    const taxaConversao = aulasDoMes.length > 0 ? Math.round((vendasEfetivadas / aulasDoMes.length) * 100) : 0;

    const totalDiarias = diariasDoMes.length;

    const diariasAtivas = diariasDoMes.filter(
      (diaria) => dataParaISO(diaria.dataInicio) <= hoje && dataParaISO(diaria.dataFinal) >= hoje
    ).length;

    const diariasVencendoHoje = diariasDoMes.filter((diaria) => mesmaData(diaria.dataFinal, hoje));

    const modalidades: any = {};
    const aulasPorColaboradora: any = {};
    const vendasPorVendedora: any = {};
    const conversaoAgendouVendeu: any[] = [];

    aulasDoMes.forEach((aula) => {
      const modalidade = aula.modalidade || "OUTROS";
      modalidades[modalidade] = (modalidades[modalidade] || 0) + 1;

      const colaboradora = nomeBonito(aula.colaboradora || "NÃO INFORMADO");
      aulasPorColaboradora[colaboradora] = (aulasPorColaboradora[colaboradora] || 0) + 1;
    });

    vendasDoMes.forEach((aula) => {
      const vendedora = nomeBonito(aula.vendedora || "NÃO INFORMADO");
      const colaboradora = nomeBonito(aula.colaboradora || "NÃO INFORMADO");

      vendasPorVendedora[vendedora] = (vendasPorVendedora[vendedora] || 0) + 1;

      const existente = conversaoAgendouVendeu.find(
        (item) => item.colaboradora === colaboradora && item.vendedora === vendedora
      );

      if (existente) {
        existente.quantidade += 1;
      } else {
        conversaoAgendouVendeu.push({ colaboradora, vendedora, quantidade: 1 });
      }
    });

    const consultasNutriMes = await carregarConsultasNutricionista(mesReferencia, unidadeId);
    const consultasNutriBase = consultasNutriMes.filter(isConsultaFreeOuParticular);
    const consultasNutriConvertidas = consultasNutriBase.filter(isConsultaConvertida);
    const rankingConversaoNutri: any = {};

    consultasNutriConvertidas.forEach((consulta) => {
      const nome = nomeVendedoraNutri(consulta);
      rankingConversaoNutri[nome] = (rankingConversaoNutri[nome] || 0) + 1;
    });

    const diariasConversao = calcularConversaoDiarias(diariasDoMes);

    return Response.json({
      mesReferencia,
      aulasHoje: aulasHoje.length,
      totalAulas: aulasDoMes.length,
      totalCompareceu,
      totalFaltou,
      vendasEfetivadas,
      taxaComparecimento,
      taxaConversao,
      totalDiarias,
      diariasAtivas,
      diariasVencendoHoje,
      modalidades,
      aulasPorColaboradora,
      vendasPorVendedora,
      conversaoAgendouVendeu,
      contratosPorTipoDia: contarTipos(contratosHoje, unidadeId),
      contratosPorTipoMes: contarTipos(contratosDoMes, unidadeId),
      rankingContratosGeral: montarRankingContratos(contratosDoMesRelatorio, unidadeId),
      nutricionista: {
        consultasFreeParticularMes: consultasNutriBase.length,
        convertidosMes: consultasNutriConvertidas.length,
        taxaConversaoMes:
          consultasNutriBase.length > 0
            ? Math.round((consultasNutriConvertidas.length / consultasNutriBase.length) * 100)
            : 0,
        rankingConversao: rankingConversaoNutri,
      },
      diariasConversao,
    });
  } catch (error) {
    console.log(error);

    return Response.json({
      mesReferencia: getMesAtual(),
      aulasHoje: 0,
      totalAulas: 0,
      totalCompareceu: 0,
      totalFaltou: 0,
      vendasEfetivadas: 0,
      taxaComparecimento: 0,
      taxaConversao: 0,
      totalDiarias: 0,
      diariasAtivas: 0,
      diariasVencendoHoje: [],
      modalidades: {},
      aulasPorColaboradora: {},
      vendasPorVendedora: {},
      conversaoAgendouVendeu: [],
      contratosPorTipoDia: vazioTipos(),
      contratosPorTipoMes: vazioTipos(),
      rankingContratosGeral: [],
      nutricionista: {
        consultasFreeParticularMes: 0,
        convertidosMes: 0,
        taxaConversaoMes: 0,
        rankingConversao: {},
      },
      diariasConversao: {
        diariasMes: 0,
        convertidasMes: 0,
        taxaConversaoMes: 0,
        rankingConversao: {},
      },
    });
  }
}
