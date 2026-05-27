import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function hojeISO() {
  const hoje = new Date();
  return hoje.toISOString().split("T")[0];
}

function mesAtual(data: string) {
  const hoje = new Date();

  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const ano = hoje.getFullYear();

  return data.startsWith(`${ano}-${mes}`);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const unidadeIdParam = searchParams.get("unidadeId");
    const unidadeId = unidadeIdParam ? Number(unidadeIdParam) : null;

    const hoje = hojeISO();

    const aulas = await prisma.aula.findMany({
      where: unidadeId
        ? {
            unidadeId,
          }
        : {},
    });

    const diarias = await prisma.diaria.findMany({
      where: unidadeId
        ? {
            unidadeId,
          }
        : {},
    });

    const aulasMesAtual = aulas.filter((aula) =>
      mesAtual(aula.data)
    );

    const diariasMesAtual = diarias.filter((diaria) =>
      mesAtual(diaria.dataInicio)
    );

    const aulasHoje = aulasMesAtual.filter(
      (aula) => aula.data === hoje
    );

    const totalCompareceu = aulasMesAtual.filter(
      (aula) => aula.veio === true
    ).length;

    const totalFaltou = aulasMesAtual.filter(
      (aula) => aula.faltou === true
    ).length;

    const vendasEfetivadas = aulasMesAtual.filter(
      (aula) => aula.vendaEfetivada === true
    ).length;

    const taxaComparecimento =
      aulasMesAtual.length > 0
        ? Math.round((totalCompareceu / aulasMesAtual.length) * 100)
        : 0;

    const totalDiarias = diariasMesAtual.length;

    const diariasAtivas = diariasMesAtual.filter(
      (diaria) => diaria.dataFinal >= hoje
    ).length;

    const diariasVencendoHoje = diariasMesAtual.filter(
      (diaria) => diaria.dataFinal === hoje
    );

    const modalidades: any = {};

    aulasMesAtual.forEach((aula) => {
      const modalidade = aula.modalidade || "OUTROS";

      if (!modalidades[modalidade]) {
        modalidades[modalidade] = 0;
      }

      modalidades[modalidade]++;
    });

    return Response.json({
      aulasHoje: aulasHoje.length,
      totalAulas: aulasMesAtual.length,
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