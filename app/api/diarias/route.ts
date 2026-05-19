import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const diarias = await prisma.diaria.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json(diarias);
  } catch (error) {
    console.log(error);

    return Response.json(
      { error: "Erro ao buscar diárias" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const diaria = await prisma.diaria.create({
      data: {
        nome: body.nome,
        telefone: body.telefone,
        cpf: body.cpf,
        dataInicio: body.dataInicio,
        quantidadeDias: body.quantidadeDias,
        dataFinal: body.dataFinal,
        observacoes: body.observacoes,
        colaboradora: body.colaboradora,
      },
    });

    return Response.json(diaria);
  } catch (error) {
    console.log(error);

    return Response.json(
      { error: "Erro ao salvar diária" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();

    const diaria = await prisma.diaria.update({
      where: {
        id: body.id,
      },
      data: {
        nome: body.nome,
        telefone: body.telefone,
        cpf: body.cpf,
        dataInicio: body.dataInicio,
        quantidadeDias: body.quantidadeDias,
        dataFinal: body.dataFinal,
        observacoes: body.observacoes,
        colaboradora: body.colaboradora,
      },
    });

    return Response.json(diaria);
  } catch (error) {
    console.log(error);

    return Response.json(
      { error: "Erro ao editar diária" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    await prisma.diaria.delete({
      where: {
        id,
      },
    });

    return Response.json({
      message: "Diária excluída",
    });
  } catch (error) {
    console.log(error);

    return Response.json(
      { error: "Erro ao excluir diária" },
      { status: 500 }
    );
  }
}