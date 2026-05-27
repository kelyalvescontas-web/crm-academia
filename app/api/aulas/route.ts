import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getUnidadeId(req: Request, body?: any) {
  const { searchParams } = new URL(req.url);
  const id = body?.unidadeId || searchParams.get("unidadeId");
  return id ? Number(id) : null;
}

export async function GET(req: Request) {
  const unidadeId = getUnidadeId(req);

  const aulas = await prisma.aula.findMany({
    where: { unidadeId },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(aulas);
}

export async function POST(req: Request) {
  const body = await req.json();
  const unidadeId = getUnidadeId(req, body);

  if (!unidadeId) {
    return Response.json({ error: "Unidade não informada" }, { status: 400 });
  }

  const aula = await prisma.aula.create({
    data: {
      nomeAluno: body.nomeAluno,
      telefone: body.telefone,
      data: body.data,
      horario: body.horario,
      modalidade: body.modalidade,
      colaboradora: body.colaboradora,
      observacoes: body.observacoes || "",
      status: body.status || "AGENDADA",
      veio: Boolean(body.veio),
      faltou: Boolean(body.faltou),
      remarcou: Boolean(body.remarcou),
      posAulaRealizado: Boolean(body.posAulaRealizado),
      vendaEfetivada: Boolean(body.vendaEfetivada),
      codigoMatricula: body.codigoMatricula || "",
      unidadeId,
    },
  });

  return Response.json(aula);
}

export async function PUT(req: Request) {
  const body = await req.json();
  const unidadeId = getUnidadeId(req, body);

  const aula = await prisma.aula.update({
    where: { id: Number(body.id) },
    data: {
      nomeAluno: body.nomeAluno,
      telefone: body.telefone,
      data: body.data,
      horario: body.horario,
      modalidade: body.modalidade,
      colaboradora: body.colaboradora,
      observacoes: body.observacoes || "",
      status: body.status || "AGENDADA",
      veio: Boolean(body.veio),
      faltou: Boolean(body.faltou),
      remarcou: Boolean(body.remarcou),
      posAulaRealizado: Boolean(body.posAulaRealizado),
      vendaEfetivada: Boolean(body.vendaEfetivada),
      codigoMatricula: body.codigoMatricula || "",
      unidadeId,
    },
  });

  return Response.json(aula);
}

export async function DELETE(req: Request) {
  const body = await req.json();

  await prisma.aula.delete({
    where: { id: Number(body.id) },
  });

  return Response.json({ ok: true });
}