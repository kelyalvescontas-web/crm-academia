import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function calcularTaxa(parte: number, total: number) {
  if (!total || total <= 0) return 0;
  return Math.round((parte / total) * 100);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const unidadeId = Number(searchParams.get("unidadeId"));
  const dataInicial = searchParams.get("dataInicial");
  const dataFinal = searchParams.get("dataFinal");
  const dataConversaoInicial = searchParams.get("dataConversaoInicial");
const dataConversaoFinal = searchParams.get("dataConversaoFinal");
  const modalidade = searchParams.get("modalidade");
  const colaboradoraFiltro = searchParams.get("colaboradora");
  const vendedoraFiltro = searchParams.get("vendedora");
  const planoFiltro = searchParams.get("plano");
  const tipoAlunoFiltro = searchParams.get("tipoAluno");

  let aulas = await prisma.aula.findMany({
    where: { unidadeId },
    orderBy: { createdAt: "desc" },
  });

  let diarias = await prisma.diaria.findMany({
    where: { unidadeId },
    orderBy: { createdAt: "desc" },
  });

  if (dataInicial) {
    aulas = aulas.filter((aula) => aula.data >= dataInicial);
    diarias = diarias.filter((diaria) => diaria.dataFinal >= dataInicial);
  }

  if (dataFinal) {
    aulas = aulas.filter((aula) => aula.data <= dataFinal);
    diarias = diarias.filter((diaria) => diaria.dataInicio <= dataFinal);
  }
if (dataConversaoInicial) {
  aulas = aulas.filter((aula) => {
    if (!aula.dataConversao) return false;
    return aula.dataConversao >= dataConversaoInicial;
  });
}

if (dataConversaoFinal) {
  aulas = aulas.filter((aula) => {
    if (!aula.dataConversao) return false;
    return aula.dataConversao <= dataConversaoFinal;
  });
}
  if (modalidade && modalidade !== "TODAS") {
    aulas = aulas.filter((aula) => aula.modalidade === modalidade);
  }

  if (colaboradoraFiltro && colaboradoraFiltro !== "TODAS") {
    aulas = aulas.filter(
      (aula) =>
        String(aula.colaboradora || "").toUpperCase() ===
        colaboradoraFiltro.toUpperCase()
    );
  }

  if (vendedoraFiltro && vendedoraFiltro !== "TODAS") {
    aulas = aulas.filter(
      (aula) =>
        String(aula.vendedora || "").toUpperCase() ===
        vendedoraFiltro.toUpperCase()
    );
  }

  if (planoFiltro && planoFiltro !== "TODOS") {
    aulas = aulas.filter(
      (aula) =>
        String(aula.planoFechado || "").toUpperCase() ===
        planoFiltro.toUpperCase()
    );
  }

  if (tipoAlunoFiltro && tipoAlunoFiltro !== "TODOS") {
    aulas = aulas.filter(
      (aula) =>
        String(aula.tipoAluno || "").toUpperCase() ===
        tipoAlunoFiltro.toUpperCase()
    );
  }

  const modalidades: any = {};
  const aulasPorColaboradora: any = {};
  const vendasPorVendedora: any = {};
  const conversaoAgendouVendeu: any[] = [];
  const planosVendidos: any = {};
  const tiposAluno: any = {};

  aulas.forEach((aula) => {
    const modalidadeNome = aula.modalidade || "OUTROS";
    modalidades[modalidadeNome] = (modalidades[modalidadeNome] || 0) + 1;

    const colaboradora = aula.colaboradora || "NÃO INFORMADO";

    if (!aulasPorColaboradora[colaboradora]) {
      aulasPorColaboradora[colaboradora] = {
        colaboradora,
        aulas: 0,
        conversoes: 0,
        taxaConversao: 0,
      };
    }

    aulasPorColaboradora[colaboradora].aulas += 1;
  });

  const vendas = aulas.filter(
    (aula) => aula.vendaEfetivada === true || aula.status === "VENDA EFETIVADA"
  );

  vendas.forEach((aula) => {
    const colaboradora = aula.colaboradora || "NÃO INFORMADO";
    const vendedora = aula.vendedora || "NÃO INFORMADO";
    const plano = aula.planoFechado || "NÃO INFORMADO";
    const tipoAluno = aula.tipoAluno || "NÃO INFORMADO";

    if (!vendasPorVendedora[vendedora]) {
      vendasPorVendedora[vendedora] = {
        vendedora,
        vendas: 0,
        taxaConversao: 0,
      };
    }

    vendasPorVendedora[vendedora].vendas += 1;

    if (aulasPorColaboradora[colaboradora]) {
      aulasPorColaboradora[colaboradora].conversoes += 1;
    }

    const existente = conversaoAgendouVendeu.find(
      (item: any) =>
        item.colaboradora === colaboradora && item.vendedora === vendedora
    );

    if (existente) {
      existente.quantidade += 1;
    } else {
      conversaoAgendouVendeu.push({
        colaboradora,
        vendedora,
        quantidade: 1,
      });
    }

    planosVendidos[plano] = (planosVendidos[plano] || 0) + 1;
    tiposAluno[tipoAluno] = (tiposAluno[tipoAluno] || 0) + 1;
  });

  Object.keys(aulasPorColaboradora).forEach((nome) => {
    const item = aulasPorColaboradora[nome];
    item.taxaConversao = calcularTaxa(item.conversoes, item.aulas);
  });

  Object.keys(vendasPorVendedora).forEach((nome) => {
    const item = vendasPorVendedora[nome];
    item.taxaConversao = calcularTaxa(item.vendas, aulas.length);
  });

  const totalCompareceu = aulas.filter(
    (aula) => aula.veio === true || aula.status === "COMPARECEU"
  ).length;

  const totalFaltou = aulas.filter(
    (aula) => aula.faltou === true || aula.status === "FALTOU"
  ).length;

  const vendasEfetivadas = vendas.length;

  const taxaConversao = calcularTaxa(vendasEfetivadas, aulas.length);

  return Response.json({
    totalAulas: aulas.length,
    totalDiarias: diarias.length,
    totalCompareceu,
    totalFaltou,
    vendasEfetivadas,
    taxaConversao,
    modalidades,
    aulasPorColaboradora: Object.values(aulasPorColaboradora),
    vendasPorVendedora: Object.values(vendasPorVendedora),
    conversaoAgendouVendeu,
    planosVendidos,
    tiposAluno,
    aulas,
    diarias,
  });
}