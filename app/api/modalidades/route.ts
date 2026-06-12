import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getUnidadeId(req: Request, body?: any) {
  const { searchParams } = new URL(req.url);
  const id = body?.unidadeId || searchParams.get("unidadeId");
  return id ? Number(id) : null;
}

export async function GET(req: Request) {
  try {
    const unidadeId = getUnidadeId(req);

    const modalidades = await prisma.modalidade.findMany({
      where: unidadeId ? { OR: [{ unidadeId }, { unidadeId: null }] } : {},
      orderBy: { nome: "asc" },
    });

    return Response.json(modalidades);
  } catch (error) {
    console.log(error);
    return Response.json({ error: "Erro ao buscar modalidades" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const unidadeId = getUnidadeId(req, body);
    const nome = String(body.nome || "").trim().toUpperCase();

    if (!nome) {
      return Response.json({ error: "Informe o nome da modalidade" }, { status: 400 });
    }

    const existente = await prisma.modalidade.findFirst({
      where: {
        nome: { equals: nome, mode: "insensitive" },
        unidadeId: unidadeId || null,
      },
    });

    if (existente) {
      return Response.json(existente);
    }

    const modalidade = await prisma.modalidade.create({
      data: {
        nome,
        unidadeId,
      },
    });

    return Response.json(modalidade);
  } catch (error) {
    console.log(error);
    return Response.json({ error: "Erro ao criar modalidade" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const nome = String(body.nome || "").trim().toUpperCase();

    if (!body.id || !nome) {
      return Response.json({ error: "Informe ID e nome" }, { status: 400 });
    }

    const modalidade = await prisma.modalidade.update({
      where: { id: Number(body.id) },
      data: { nome },
    });

    return Response.json(modalidade);
  } catch (error) {
    console.log(error);
    return Response.json({ error: "Erro ao editar modalidade" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();

    if (!body.id) {
      return Response.json({ error: "Informe o ID" }, { status: 400 });
    }

    await prisma.modalidade.delete({
      where: { id: Number(body.id) },
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.log(error);
    return Response.json({ error: "Erro ao excluir modalidade" }, { status: 500 });
  }
}
