import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const matriz = await prisma.unidade.findFirst({
      where: {
        nome: "Prix Academia - Matriz",
      },
    });

    if (!matriz) {
      return Response.json(
        { error: "Unidade Matriz não encontrada" },
        { status: 404 }
      );
    }

    await prisma.aula.updateMany({
      where: { unidadeId: null },
      data: { unidadeId: matriz.id },
    });

    await prisma.diaria.updateMany({
      where: { unidadeId: null },
      data: { unidadeId: matriz.id },
    });

    await prisma.configuracao.updateMany({
      where: { unidadeId: null },
      data: { unidadeId: matriz.id },
    });

    await prisma.usuario.updateMany({
      where: { unidadeId: null },
      data: { unidadeId: matriz.id },
    });

    return Response.json({
      ok: true,
      mensagem: "Registros antigos vinculados à Matriz.",
      unidadeId: matriz.id,
    });
  } catch (error) {
    console.log(error);

    return Response.json(
      { error: "Erro ao corrigir unidades" },
      { status: 500 }
    );
  }
}