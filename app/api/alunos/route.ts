import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const alunos = await prisma.aluno.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json(alunos);
  } catch (error) {
    return Response.json(
      {
        error: "Erro ao buscar alunos",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const aluno = await prisma.aluno.create({
      data: {
        nome: body.nome,
        telefone: body.telefone,
        cpf: body.cpf,
        modalidade: body.modalidade,
        plano: body.plano,
        vencimento: body.vencimento,
        observacoes: body.observacoes,
        colaboradora: body.colaboradora,
      },
    });

    return Response.json(aluno);
  } catch (error) {
    return Response.json(
      {
        error: "Erro ao criar aluno",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();

    const aluno = await prisma.aluno.update({
      where: {
        id: body.id,
      },
      data: {
        nome: body.nome,
        telefone: body.telefone,
        cpf: body.cpf,
        modalidade: body.modalidade,
        plano: body.plano,
        vencimento: body.vencimento,
        observacoes: body.observacoes,
        colaboradora: body.colaboradora,
      },
    });

    return Response.json(aluno);
  } catch (error) {
    return Response.json(
      {
        error: "Erro ao editar aluno",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();

    await prisma.aluno.delete({
      where: {
        id: body.id,
      },
    });

    return Response.json({
      success: true,
    });
  } catch (error) {
    return Response.json(
      {
        error: "Erro ao excluir aluno",
      },
      {
        status: 500,
      }
    );
  }
}