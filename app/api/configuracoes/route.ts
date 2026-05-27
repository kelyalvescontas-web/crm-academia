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

    if (!unidadeId) {
      return Response.json(
        { error: "Unidade não informada" },
        { status: 400 }
      );
    }

    let configuracao = await prisma.configuracao.findFirst({
      where: { unidadeId },
    });

    if (!configuracao) {
      configuracao = await prisma.configuracao.create({
        data: {
          nomeAcademia: "CRM Academia",
          telefone: "",
          endereco: "",
          metaMensal: 0,
          corSistema: "#1e3a8a",
          logo: "",

          mensagemConfirmacao: "",
          mensagemLembrete: "",
          mensagemPosAula: "",
          mensagemNaoCompareceu: "",
          mensagemDiaria: "",

          unidadeId,
        },
      });
    }

    return Response.json(configuracao);
  } catch (error) {
    console.log("ERRO GET CONFIG:", error);

    return Response.json(
      { error: "Erro ao buscar configurações" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const unidadeId = getUnidadeId(req, body);

    if (!unidadeId) {
      return Response.json(
        { error: "Unidade não informada" },
        { status: 400 }
      );
    }

    let configuracao = await prisma.configuracao.findFirst({
      where: { unidadeId },
    });

    const dados = {
      nomeAcademia: body.nomeAcademia || "CRM Academia",
      telefone: body.telefone || "",
      endereco: body.endereco || "",
      metaMensal: Number(body.metaMensal || 0),
      corSistema: body.corSistema || "#1e3a8a",
      logo: body.logo || "",

      mensagemConfirmacao: body.mensagemConfirmacao || "",
      mensagemLembrete: body.mensagemLembrete || "",
      mensagemPosAula: body.mensagemPosAula || "",
      mensagemNaoCompareceu: body.mensagemNaoCompareceu || "",
      mensagemDiaria: body.mensagemDiaria || "",

      unidadeId,
    };

    if (!configuracao) {
      configuracao = await prisma.configuracao.create({
        data: dados,
      });

      return Response.json(configuracao);
    }

    const atualizado = await prisma.configuracao.update({
      where: { id: configuracao.id },
      data: dados,
    });

    return Response.json(atualizado);
  } catch (error) {
    console.log("ERRO PUT CONFIG:", error);

    return Response.json(
      { error: "Erro ao salvar configurações" },
      { status: 500 }
    );
  }
}