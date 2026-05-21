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
        nomeAluno: body.nomeAluno || "",
        telefone: body.telefone || "",
        data: body.data || "",
        horario: body.horario || "",
        modalidade: body.modalidade || "MUSCULAÇÃO",
        colaboradora: body.colaboradora || "",
        observacoes: body.observacoes || "",
        status: body.status || "AGENDADA",
        veio: Boolean(body.veio),
        faltou: Boolean(body.faltou),
        remarcou: Boolean(body.remarcou),
        posAulaRealizado: Boolean(body.posAulaRealizado),
        vendaEfetivada: Boolean(body.vendaEfetivada),
        codigoMatricula: body.codigoMatricula || "",
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
        id: Number(body.id),
      },
      data: {
        nomeAluno: body.nomeAluno || "",
        telefone: body.telefone || "",
        data: body.data || "",
        horario: body.horario || "",
        modalidade: body.modalidade || "MUSCULAÇÃO",
        colaboradora: body.colaboradora || "",
        observacoes: body.observacoes || "",
        status: body.status || "AGENDADA",
        veio: Boolean(body.veio),
        faltou: Boolean(body.faltou),
        remarcou: Boolean(body.remarcou),
        posAulaRealizado: Boolean(body.posAulaRealizado),
        vendaEfetivada: Boolean(body.vendaEfetivada),
        codigoMatricula: body.codigoMatricula || "",
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
    const body = await req.json();

    await prisma.aula.delete({
      where: {
        id: Number(body.id),
      },
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.log(error);

    return Response.json(
      { error: "Erro ao excluir aula" },
      { status: 500 }
    );
  }
}