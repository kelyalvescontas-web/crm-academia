import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function hojeISO() {
  const hoje = new Date();
  return hoje.toISOString().split("T")[0];
}

export async function GET() {
  try {
    const hoje = hojeISO();

    const aulas = await prisma.aula.findMany();
    const diarias = await prisma.diaria.findMany();

    const aulasHoje = aulas.filter((aula) => aula.data === hoje);

    const diariasEncerrandoHoje = diarias.filter(
      (diaria) => diaria.dataFinal === hoje
    );

    const diariasAtivas = diarias.filter(
      (diaria) => diaria.dataFinal >= hoje
    );

    const totalCompareceu = aulas.filter(
      (aula) => aula.status === "COMPARECEU"
    ).length;

    const totalFaltou = aulas.filter(
      (aula) => aula.status === "FALTOU"
    ).length;

    const totalConfirmada = aulas.filter(
      (aula) => aula.status === "CONFIRMADA"
    ).length;

    const taxaComparecimento =
      aulas.length > 0
        ? Math.round((totalCompareceu / aulas.length) * 100)
        : 0;

    const modalidades: Record<string, number> = {};

    aulas.forEach((aula) => {
      modalidades[aula.modalidade] =
        (modalidades[aula.modalidade] || 0) + 1;
    });

    const modalidadeMaisProcurada =
      Object.entries(modalidades).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      "Nenhuma";

    return Response.json({
      totalAulas: aulas.length,
      aulasHoje: aulasHoje.length,
      totalDiariasAtivas: diariasAtivas.length,
      diariasEncerrandoHoje,
      totalCompareceu,
      totalFaltou,
      totalConfirmada,
      taxaComparecimento,
      modalidadeMaisProcurada,
    });
  } catch (error) {
    console.log(error);

    return Response.json(
      { error: "Erro ao carregar dashboard" },
      { status: 500 }
    );
  }
}