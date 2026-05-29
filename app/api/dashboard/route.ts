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
      pertenceAoMes(diaria.dataInicio, mesReferencia)
    );

    const aulasHoje = aulasDoMes.filter((aula) => aula.data === hoje);

    const totalCompareceu = aulasDoMes.filter(
      (aula) => aula.veio === true || aula.status === "COMPARECEU"
    ).length;

    const totalFaltou = aulasDoMes.filter(
      (aula) => aula.faltou === true || aula.status === "FALTOU"
    ).length;

    const vendasEfetivadas = aulasDoMes.filter(
      (aula) =>
        aula.vendaEfetivada === true || aula.status === "VENDA EFETIVADA"
    ).length;

    const taxaComparecimento =
      aulasDoMes.length > 0
        ? Math.round((totalCompareceu / aulasDoMes.length) * 100)
        : 0;

    const totalDiarias = diariasDoMes.length;

    const diariasAtivas = diariasDoMes.filter(
      (diaria) => diaria.dataFinal >= hoje
    ).length;

    const diariasVencendoHoje = diariasDoMes.filter(
      (diaria) => diaria.dataFinal === hoje
    );

    const modalidades: any = {};

    aulasDoMes.forEach((aula) => {
      const modalidade = aula.modalidade || "OUTROS";

      if (!modalidades[modalidade]) {
        modalidades[modalidade] = 0;
      }

      modalidades[modalidade]++;
    });

    return Response.json({
      mesReferencia,
      aulasHoje: aulasHoje.length,
      totalAulas: aulasDoMes.length,
      totalCompareceu,
      totalFaltou,
      vendasEfetivadas,
      taxaComparecimento,
      totalDiarias,
      diariasAtivas,
      diariasVencendoHoje,
      modalidades,
    });
  } catch (error) {
    console.log(error);

    return Response.json(
      {
        mesReferencia: getMesAtual(),
        aulasHoje: 0,
        totalAulas: 0,
        totalCompareceu: 0,
        totalFaltou: 0,
        vendasEfetivadas: 0,
        taxaComparecimento: 0,
        totalDiarias: 0,
        diariasAtivas: 0,
        diariasVencendoHoje: [],
        modalidades: {},
      },
      { status: 200 }
    );
  }
}