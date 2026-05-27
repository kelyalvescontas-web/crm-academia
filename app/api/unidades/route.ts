import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const nomes = [
      "Prix Academia - Matriz",
      "Prix Academia - Estação Prix",
      "Prix Academia - CT Prix",
      "Prix Academia - Corumbataí",
      "Prix Academia - Barbosa Ferraz",
    ];

    for (const nome of nomes) {
      const existe = await prisma.unidade.findFirst({
        where: { nome },
      });

      if (!existe) {
        await prisma.unidade.create({
          data: { nome },
        });
      }
    }

    const unidades = await prisma.unidade.findMany({
      orderBy: { nome: "asc" },
    });

    return Response.json(unidades);
  } catch (error) {
    console.log(error);
    return Response.json(
      { error: "Erro ao buscar unidades" },
      { status: 500 }
    );
  }
}