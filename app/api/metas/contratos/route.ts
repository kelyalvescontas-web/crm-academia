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

function normalizarCargo(cargo: any) {
  return String(cargo || "").toUpperCase().trim().replace(/\s+/g, "_");
}

function podeVerTodos(cargo: string) {
  // Regra principal: somente ADMIN_GERAL vê todos os contratos da unidade.
  return normalizarCargo(cargo) === "ADMIN_GERAL";
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
    const verificarDuplicado = searchParams.get("verificarDuplicado");

    if (!unidadeId) {
      return Response.json(
        { error: "Unidade não informada" },
        { status: 400 }
      );
    }

    if (verificarDuplicado === "1") {
      const matricula = String(searchParams.get("matricula") || "").trim();
      const nomeAluno = String(searchParams.get("nomeAluno") || "").trim();

      if (!matricula && !nomeAluno) {
        return Response.json({ duplicado: false, contrato: null });
      }

      const duplicado = await prisma.contratoMeta.findFirst({
        where: {
          unidadeId,
          OR: [
            matricula ? { matricula } : {},
            nomeAluno
              ? {
                  nomeAluno: {
                    equals: nomeAluno.toUpperCase(),
                    mode: "insensitive",
                  },
                }
              : {},
          ],
        },
        orderBy: [
          { dataVenda: "desc" },
          { createdAt: "desc" },
        ],
      });

      return Response.json({
        duplicado: Boolean(duplicado),
        contrato: duplicado,
      });
    }

    const where: any = {
      OR: [
        { unidadeId },
        {
          transferenciaUnidade: true,
          unidadeOrigemId: unidadeId,
        },
      ],
    };

    // ADMIN, COLABORADORA e demais cargos veem somente:
    // 1) contratos em que são vendedora
    // 2) contratos divididos com elas
    // Comparação insensível a maiúsculas/minúsculas para não esconder contratos próprios.
    if (!podeVerTodos(usuarioCargo)) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            {
              vendedora: {
                equals: usuarioNome,
                mode: "insensitive",
              },
            },
            {
              contratoDividido: true,
              divididoCom: {
                equals: usuarioNome,
                mode: "insensitive",
              },
            },
          ],
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
      where.vendedora = {
        equals: vendedora,
        mode: "insensitive",
      };
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
      orderBy: [
        { dataVenda: "desc" },
        { createdAt: "desc" },
      ],
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

    const matricula = String(body.matricula || "").trim();
    const nomeAluno = String(body.nomeAluno || "").trim().toUpperCase();
    const vendedora = String(body.vendedora || "").trim().toUpperCase();
    const dataVenda = body.dataVenda || "";

    if (!nomeAluno) {
      return Response.json(
        { error: "Informe o nome do aluno" },
        { status: 400 }
      );
    }

    // Proteção extra contra duplicidade por duplo clique:
    // se já existir um contrato igual criado nos últimos 2 minutos, devolve o existente.
    const doisMinutosAtras = new Date(Date.now() - 2 * 60 * 1000);

    const duplicado = await prisma.contratoMeta.findFirst({
      where: {
        unidadeId,
        matricula,
        nomeAluno,
        vendedora,
        dataVenda,
        plano: body.plano || "",
        tipoContrato: body.tipoContrato || "",
        permanencia: body.permanencia || "MENSAL",
        createdAt: {
          gte: doisMinutosAtras,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (duplicado) {
      return Response.json(duplicado);
    }

    const contrato = await prisma.contratoMeta.create({
      data: {
        matricula,
        nomeAluno,
        vendedora,

        plano: body.plano || "",
        tipoContrato: body.tipoContrato || "",
        permanencia: body.permanencia || "MENSAL",
        dataVenda,

        transferenciaUnidade: Boolean(body.transferenciaUnidade),
        unidadeOrigemId: body.unidadeOrigemId ? Number(body.unidadeOrigemId) : null,
        unidadeOrigemNome: body.unidadeOrigemNome || "",

        acrescimoModalidade: Boolean(body.acrescimoModalidade),
        modalidadeAnterior: body.modalidadeAnterior || "",

        trocaModalidade: Boolean(body.trocaModalidade),

        cancelado: Boolean(body.cancelado),
        canceladoEm: body.canceladoEm ? new Date(body.canceladoEm) : null,
        canceladoPor: body.canceladoPor || "",

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

        transferenciaUnidade: Boolean(body.transferenciaUnidade),
        unidadeOrigemId: body.unidadeOrigemId ? Number(body.unidadeOrigemId) : null,
        unidadeOrigemNome: body.unidadeOrigemNome || "",

        acrescimoModalidade: Boolean(body.acrescimoModalidade),
        modalidadeAnterior: body.modalidadeAnterior || "",

        trocaModalidade: Boolean(body.trocaModalidade),

        cancelado: Boolean(body.cancelado),
        canceladoEm: body.canceladoEm ? new Date(body.canceladoEm) : null,
        canceladoPor: body.canceladoPor || "",

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
