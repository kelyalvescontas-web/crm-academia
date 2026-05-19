import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const aulas = await prisma.aula.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json(aulas);
  } catch (error) {
    console.log(error);

    return Response.json(
      { error: "Erro ao buscar aulas" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const aula = await prisma.aula.create({
      data: {
        nomeAluno: body.nomeAluno,
        telefone: body.telefone,
        data: body.data,
        horario: body.horario,
        modalidade: body.modalidade,
        colaboradora: body.colaboradora,
        observacoes: body.observacoes,
      },
    });

    return Response.json(aula);
  } catch (error) {
    console.log(error);

    return Response.json(
      { error: "Erro ao salvar aula" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();

    const aula = await prisma.aula.update({
      where: {
        id: body.id,
      },
      data: {
        nomeAluno: body.nomeAluno,
        telefone: body.telefone,
        data: body.data,
        horario: body.horario,
        modalidade: body.modalidade,
        colaboradora: body.colaboradora,
        observacoes: body.observacoes,
      },
    });

    return Response.json(aula);
  } catch (error) {
    console.log(error);

    return Response.json(
      { error: "Erro ao editar aula" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    await prisma.aula.delete({
      where: {
        id,
      },
    });

    return Response.json({
      message: "Aula excluída",
    });
  } catch (error) {
    console.log(error);

    return Response.json(
      { error: "Erro ao excluir aula" },
      { status: 500 }
    );
  }
}