import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const dataInicial = searchParams.get("dataInicial");
    const dataFinal = searchParams.get("dataFinal");
    const modalidade = searchParams.get("modalidade");

    let aulas = await prisma.aula.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    let diarias = await prisma.diaria.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    if (dataInicial) {
      aulas = aulas.filter((aula) => aula.data >= dataInicial);
      diarias = diarias.filter((diaria) => diaria.dataInicio >= dataInicial);
    }

    if (dataFinal) {
      aulas = aulas.filter((aula) => aula.data <= dataFinal);
      diarias = diarias.filter((diaria) => diaria.dataFinal <= dataFinal);
    }

    if (modalidade && modalidade !== "TODAS") {
      aulas = aulas.filter((aula) => aula.modalidade === modalidade);
    }

    const modalidades: any = {};

    aulas.forEach((aula) => {
      if (!modalidades[aula.modalidade]) {
        modalidades[aula.modalidade] = 0;
      }

      modalidades[aula.modalidade]++;
    });

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

    return Response.json({
      totalAulas: aulas.length,
      totalDiarias: diarias.length,
      totalCompareceu,
      totalFaltou,
      totalConfirmada,
      taxaComparecimento,
      modalidades,
      aulas,
      diarias,
    });
  } catch (error) {
    console.log(error);

    return Response.json(
      {
        error: "Erro ao gerar relatório",
      },
      {
        status: 500,
      }
    );
  }
}