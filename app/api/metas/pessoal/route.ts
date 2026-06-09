import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getUnidadeId(req: Request, body?: any) {
  const { searchParams } = new URL(req.url);
  const id = body?.unidadeId || searchParams.get("unidadeId");
  return id ? Number(id) : null;
}

function mesAtual() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");

  return `${ano}-${mes}`;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const unidadeId = getUnidadeId(req);
    const usuarioId = searchParams.get("usuarioId");
    const usuarioNome = searchParams.get("usuarioNome") || "";
    const mes = searchParams.get("mes") || mesAtual();

    if (!unidadeId) {
      return Response.json(
        { error: "Unidade não informada" },
        { status: 400 }
      );
    }

    let metaPessoal = await prisma.metaPessoal.findFirst({
      where: {
        unidadeId,
        mes,
        OR: [
          usuarioId ? { usuarioId: Number(usuarioId) } : {},
          { usuarioNome },
        ],
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    if (!metaPessoal) {
      metaPessoal = await prisma.metaPessoal.create({
        data: {
          unidadeId,
          usuarioId: usuarioId ? Number(usuarioId) : null,
          usuarioNome: usuarioNome || "NÃO IDENTIFICADO",
          mes,
          meta: 40,
        },
      });
    }

    return Response.json(metaPessoal);
  } catch (error) {
    console.log(error);

    return Response.json(
      { error: "Erro ao buscar meta pessoal" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();

    const unidadeId = getUnidadeId(req, body);
    const usuarioId = body.usuarioId ? Number(body.usuarioId) : null;
    const usuarioNome = body.usuarioNome || "NÃO IDENTIFICADO";
    const mes = body.mes || mesAtual();
    const meta = Number(body.meta || 40);

    if (!unidadeId) {
      return Response.json(
        { error: "Unidade não informada" },
        { status: 400 }
      );
    }

    const metaAtual = await prisma.metaPessoal.findFirst({
      where: {
        unidadeId,
        mes,
        OR: [
          usuarioId ? { usuarioId } : {},
          { usuarioNome },
        ],
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    let metaPessoal;

    if (metaAtual) {
      metaPessoal = await prisma.metaPessoal.update({
        where: {
          id: metaAtual.id,
        },
        data: {
          meta,
          usuarioId,
          usuarioNome,
          mes,
          unidadeId,
        },
      });
    } else {
      metaPessoal = await prisma.metaPessoal.create({
        data: {
          unidadeId,
          usuarioId,
          usuarioNome,
          mes,
          meta,
        },
      });
    }

    return Response.json(metaPessoal);
  } catch (error) {
    console.log(error);

    return Response.json(
      { error: "Erro ao salvar meta pessoal" },
      { status: 500 }
    );
  }
}