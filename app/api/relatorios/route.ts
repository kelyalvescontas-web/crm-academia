import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const unidadeId = Number(searchParams.get("unidadeId"));
  const dataInicial = searchParams.get("dataInicial");
  const dataFinal = searchParams.get("dataFinal");
  const modalidade = searchParams.get("modalidade");

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
    modalidades[aula.modalidade] = (modalidades[aula.modalidade] || 0) + 1;
  });

  const totalCompareceu = aulas.filter((aula) => aula.veio === true).length;
  const totalFaltou = aulas.filter((aula) => aula.faltou === true).length;
  const vendasEfetivadas = aulas.filter((aula) => aula.vendaEfetivada === true).length;

  return Response.json({
    totalAulas: aulas.length,
    totalDiarias: diarias.length,
    totalCompareceu,
    totalFaltou,
    vendasEfetivadas,
    modalidades,
    aulas,
    diarias,
  });
}