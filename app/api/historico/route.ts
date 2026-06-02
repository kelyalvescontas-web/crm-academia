import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const unidadeId = searchParams.get("unidadeId");
    const acao = searchParams.get("acao");
    const tela = searchParams.get("tela");
    const usuario = searchParams.get("usuario");
    const dataInicial = searchParams.get("dataInicial");
    const dataFinal = searchParams.get("dataFinal");

    const where: any = {};

    if (unidadeId && unidadeId !== "TODAS") {
      where.unidadeId = Number(unidadeId);
    }

    if (acao && acao !== "TODAS") {
      where.acao = acao;
    }

    if (tela && tela !== "TODAS") {
      where.tela = tela;
    }

    if (usuario) {
      where.usuarioNome = {
        contains: usuario,
        mode: "insensitive",
      };
    }

    if (dataInicial || dataFinal) {
      where.createdAt = {};

      if (dataInicial) {
        where.createdAt.gte = new Date(`${dataInicial}T00:00:00`);
      }

      if (dataFinal) {
        where.createdAt.lte = new Date(`${dataFinal}T23:59:59`);
      }
    }

    const historicos = await prisma.historico.findMany({
      where,
      include: {
        unidade: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 300,
    });

    return Response.json(historicos);
  } catch (error) {
    console.log(error);
    return Response.json(
      { error: "Erro ao buscar histórico" },
      { status: 500 }
    );
  }
}