import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getUnidadeId(req: Request, body?: any) {
  const { searchParams } = new URL(req.url);
  const id = body?.unidadeId || searchParams.get("unidadeId");
  return id ? Number(id) : null;
}

function calcularDataFinal(dataInicio: string, quantidadeDias: number) {
  if (!dataInicio) return "";

  const data = new Date(dataInicio + "T00:00:00");
  data.setDate(data.getDate() + quantidadeDias - 1);

  return data.toISOString().split("T")[0];
}

function calcularStatus(dataFinal: string) {
  if (!dataFinal) return "ATIVA";

  const hoje = new Date().toISOString().split("T")[0];

  return dataFinal >= hoje ? "ATIVA" : "FINALIZADA";
}

export async function GET(req: Request) {
  const unidadeId = getUnidadeId(req);

  const diarias = await prisma.diaria.findMany({
    where: { unidadeId },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(diarias);
}

export async function POST(req: Request) {
  const body = await req.json();

  const unidadeId = getUnidadeId(req, body);

  if (!unidadeId) {
    return Response.json({ error: "Unidade não informada" }, { status: 400 });
  }

  const quantidadeDias = Number(body.quantidadeDias || 1);
  const dataFinal = calcularDataFinal(body.dataInicio, quantidadeDias);
  const status = body.status || calcularStatus(dataFinal);

  const diaria = await prisma.diaria.create({
    data: {
      nome: body.nome || "",
      telefone: body.telefone || "",
      cpf: body.cpf || "",
      dataInicio: body.dataInicio || "",
      dataFinal,
      quantidadeDias,
      colaboradora: body.colaboradora || "",
      observacoes: body.observacoes || "",

      status,
      tipoDiaria: body.tipoDiaria || "PAGA",

      unidadeId,
    },
  });

  return Response.json(diaria);
}

export async function PUT(req: Request) {
  const body = await req.json();

  const unidadeId = getUnidadeId(req, body);

  const quantidadeDias = Number(body.quantidadeDias || 1);
  const dataFinal = calcularDataFinal(body.dataInicio, quantidadeDias);
  const status = body.status || calcularStatus(dataFinal);

  const diaria = await prisma.diaria.update({
    where: { id: Number(body.id) },
    data: {
      nome: body.nome || "",
      telefone: body.telefone || "",
      cpf: body.cpf || "",
      dataInicio: body.dataInicio || "",
      dataFinal,
      quantidadeDias,
      colaboradora: body.colaboradora || "",
      observacoes: body.observacoes || "",

      status,
      tipoDiaria: body.tipoDiaria || "PAGA",

      unidadeId,
    },
  });

  return Response.json(diaria);
}

export async function DELETE(req: Request) {
  const body = await req.json();

  await prisma.diaria.delete({
    where: { id: Number(body.id) },
  });

  return Response.json({ ok: true });
}