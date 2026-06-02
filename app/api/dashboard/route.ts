import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function hojeISO() {
  const hoje = new Date();
  return hoje.toISOString().split("T")[0];
}

function getMesAtual() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  return `${ano}-${mes}`;
}

function pertenceAoMes(data: string, mesReferencia: string) {
  if (!data) return false;
  return data.startsWith(mesReferencia);
}

function diariaAtivaNoMes(diaria: any, mesReferencia: string) {
  const inicioMes = `${mesReferencia}-01`;
  const [ano, mes] = mesReferencia.split("-").map(Number);
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const fimMes = `${mesReferencia}-${String(ultimoDia).padStart(2, "0")}`;

  return diaria.dataInicio <= fimMes && diaria.dataFinal >= inicioMes;
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

    const diarias = await prisma.diaria.findMany({
      where: unidadeId ? { unidadeId } : {},
    });

    const aulasDoMes = aulas.filter((aula) =>
      pertenceAoMes(aula.data, mesReferencia)
    );

    const diariasDoMes = diarias.filter((diaria) =>
      diariaAtivaNoMes(diaria, mesReferencia)
    );

    const aulasHoje = aulasDoMes.filter((aula) => aula.data === hoje);

    const totalCompareceu = aulasDoMes.filter(
      (aula) => aula.veio === true || aula.status === "COMPARECEU"
    ).length;

    const totalFaltou = aulasDoMes.filter(
      (aula) => aula.faltou === true || aula.status === "FALTOU"
    ).length;

    const vendasDoMes = aulasDoMes.filter(
      (aula) =>
        aula.vendaEfetivada === true || aula.status === "VENDA EFETIVADA"
    );

    const vendasEfetivadas = vendasDoMes.length;

    const taxaComparecimento =
      aulasDoMes.length > 0
        ? Math.round((totalCompareceu / aulasDoMes.length) * 100)
        : 0;

    const taxaConversao =
      aulasDoMes.length > 0
        ? Math.round((vendasEfetivadas / aulasDoMes.length) * 100)
        : 0;

    const totalDiarias = diariasDoMes.length;

    const diariasAtivas = diariasDoMes.filter(
      (diaria) => diaria.dataInicio <= hoje && diaria.dataFinal >= hoje
    ).length;

    const diariasVencendoHoje = diariasDoMes.filter(
      (diaria) => diaria.dataFinal === hoje
    );

    const modalidades: any = {};
    const aulasPorColaboradora: any = {};
    const vendasPorVendedora: any = {};
    const conversaoAgendouVendeu: any[] = [];

    aulasDoMes.forEach((aula) => {
      const modalidade = aula.modalidade || "OUTROS";
      modalidades[modalidade] = (modalidades[modalidade] || 0) + 1;

      const colaboradora = aula.colaboradora || "NÃO INFORMADO";
      aulasPorColaboradora[colaboradora] =
        (aulasPorColaboradora[colaboradora] || 0) + 1;
    });

    vendasDoMes.forEach((aula) => {
      const vendedora = aula.vendedora || "NÃO INFORMADO";
      const colaboradora = aula.colaboradora || "NÃO INFORMADO";

      vendasPorVendedora[vendedora] =
        (vendasPorVendedora[vendedora] || 0) + 1;

      const existente = conversaoAgendouVendeu.find(
        (item) =>
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
    });

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
    });
  }
}