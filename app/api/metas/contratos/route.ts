import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getUnidadeId(req: Request, body?: any) {
  const { searchParams } = new URL(req.url);
  const id = body?.unidadeId || searchParams.get("unidadeId");
  return id ? Number(id) : null;
}

function usuarioLogado(body: any = {}) {
  return {
    usuarioId: body.usuarioId ? Number(body.usuarioId) : null,
    usuarioNome: body.usuarioNome || "NÃO IDENTIFICADO",
    usuarioCargo: body.usuarioCargo || "",
  };
}

function podeVerTodos(cargo: string) {
  const c = String(cargo || "").toUpperCase();

  return (
    c === "ADMIN" ||
    c === "ADMIN_GERAL" ||
    c === "COMERCIAL" ||
    c === "GERENTE" ||
    c === "GERENCIAL"
  );
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const unidadeId = getUnidadeId(req);
    const usuarioNome = searchParams.get("usuarioNome") || "";
    const usuarioCargo = searchParams.get("usuarioCargo") || "";

    const dataInicial = searchParams.get("dataInicial");
    const dataFinal = searchParams.get("dataFinal");
    const vendedora = searchParams.get("vendedora");
    const plano = searchParams.get("plano");
    const permanencia = searchParams.get("permanencia");
    const tipoContrato = searchParams.get("tipoContrato");

    if (!unidadeId) {
      return Response.json(
        { error: "Unidade não informada" },
        { status: 400 }
      );
    }

    const where: any = {
      unidadeId,
    };

   if (!podeVerTodos(usuarioCargo)) {
  where.OR = [
    {
      vendedora: usuarioNome,
    },
    {
      contratoDividido: true,
      divididoCom: usuarioNome,
    },
  ];
}

    if (dataInicial || dataFinal) {
      where.dataVenda = {};

      if (dataInicial) {
        where.dataVenda.gte = dataInicial;
      }

      if (dataFinal) {
        where.dataVenda.lte = dataFinal;
      }
    }

    if (vendedora && vendedora !== "TODAS") {
      where.vendedora = vendedora;
    }

    if (plano && plano !== "TODOS") {
      where.plano = plano;
    }

    if (permanencia && permanencia !== "TODAS") {
      where.permanencia = permanencia;
    }

    if (tipoContrato && tipoContrato !== "TODOS") {
      where.tipoContrato = tipoContrato;
    }

    const contratos = await prisma.contratoMeta.findMany({
      where,
      include: {
        unidade: true,
      },
      orderBy: {
        dataVenda: "desc",
      },
    });

    return Response.json(contratos);
  } catch (error) {
    console.log(error);

    return Response.json(
      { error: "Erro ao buscar contratos de metas" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const unidadeId = getUnidadeId(req, body);
    const usuario = usuarioLogado(body);

    if (!unidadeId) {
      return Response.json(
        { error: "Unidade não informada" },
        { status: 400 }
      );
    }

    const contrato = await prisma.contratoMeta.create({
      data: {
        matricula: body.matricula || "",
        nomeAluno: String(body.nomeAluno || "").trim().toUpperCase(),
        vendedora: String(body.vendedora || "").trim().toUpperCase(),

        plano: body.plano || "",
        tipoContrato: body.tipoContrato || "",
        permanencia: body.permanencia || "MENSAL",
        dataVenda: body.dataVenda || "",

        valorPrimeiraParcela:
          body.valorPrimeiraParcela !== "" &&
          body.valorPrimeiraParcela !== null &&
          body.valorPrimeiraParcela !== undefined
            ? Number(body.valorPrimeiraParcela)
            : null,

        convenio: Boolean(body.convenio),
        nomeConvenio: body.nomeConvenio || "",

        contratoDividido: Boolean(body.contratoDividido),
        quantidadeMeios: body.quantidadeMeios
          ? Number(body.quantidadeMeios)
          : 0,
        divididoCom: body.divididoCom || "",

        observacao: body.observacao || "",

        criadoPorId: usuario.usuarioId,
        criadoPorNome: usuario.usuarioNome,
        alteradoPorId: usuario.usuarioId,
        alteradoPorNome: usuario.usuarioNome,
        atualizadoEm: new Date(),

        unidadeId,
      },
    });

    return Response.json(contrato);
  } catch (error) {
    console.log(error);

    return Response.json(
      { error: "Erro ao criar contrato de meta" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const unidadeId = getUnidadeId(req, body);
    const usuario = usuarioLogado(body);

    const contrato = await prisma.contratoMeta.update({
      where: {
        id: Number(body.id),
      },
      data: {
        matricula: body.matricula || "",
        nomeAluno: String(body.nomeAluno || "").trim().toUpperCase(),
        vendedora: String(body.vendedora || "").trim().toUpperCase(),

        plano: body.plano || "",
        tipoContrato: body.tipoContrato || "",
        permanencia: body.permanencia || "MENSAL",
        dataVenda: body.dataVenda || "",

        valorPrimeiraParcela:
          body.valorPrimeiraParcela !== "" &&
          body.valorPrimeiraParcela !== null &&
          body.valorPrimeiraParcela !== undefined
            ? Number(body.valorPrimeiraParcela)
            : null,

        convenio: Boolean(body.convenio),
        nomeConvenio: body.nomeConvenio || "",

        contratoDividido: Boolean(body.contratoDividido),
        quantidadeMeios: body.quantidadeMeios
          ? Number(body.quantidadeMeios)
          : 0,
        divididoCom: body.divididoCom || "",

        observacao: body.observacao || "",

        alteradoPorId: usuario.usuarioId,
        alteradoPorNome: usuario.usuarioNome,
        atualizadoEm: new Date(),

        unidadeId,
      },
    });

    return Response.json(contrato);
  } catch (error) {
    console.log(error);

    return Response.json(
      { error: "Erro ao editar contrato de meta" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();

    await prisma.contratoMeta.delete({
      where: {
        id: Number(body.id),
      },
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.log(error);

    return Response.json(
      { error: "Erro ao excluir contrato de meta" },
      { status: 500 }
    );
  }
}