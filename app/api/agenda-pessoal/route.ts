import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function normalizarCargo(cargo: any) {
  return String(cargo || "").toUpperCase().trim().replace(/\s+/g, "_");
}

function dadosUsuario(body: any) {
  return {
    usuarioId: body.usuarioId ? Number(body.usuarioId) : null,
    usuarioNome: body.usuarioNome || "NÃO IDENTIFICADO",
    usuarioCargo: body.usuarioCargo || "",
  };
}

function podeVerTodos(cargo: any) {
  const c = normalizarCargo(cargo);
  return c === "ADMIN_GERAL" || c === "ADMIN";
}

async function registrarHistorico({
  body,
  acao,
  tela,
  registroId,
  registroNome,
  unidadeId,
  dadosAntes,
  dadosDepois,
}: any) {
  try {
    const usuarioLogado = dadosUsuario(body);

    await prisma.historico.create({
      data: {
        usuarioId: usuarioLogado.usuarioId,
        usuarioNome: usuarioLogado.usuarioNome,
        usuarioCargo: usuarioLogado.usuarioCargo,
        acao,
        tela,
        registroId,
        registroNome,
        descricao: `${acao} em ${tela}: ${registroNome || ""}`,
        dadosAntes: dadosAntes ? JSON.stringify(dadosAntes) : "",
        dadosDepois: dadosDepois ? JSON.stringify(dadosDepois) : "",
        unidadeId,
      },
    });
  } catch (error) {
    console.log("Erro ao registrar histórico da agenda pessoal:", error);
  }
}

async function criarNotificacao(
  usuarioId: number,
  titulo: string,
  mensagem: string,
  agendaId?: number
) {
  if (!usuarioId) return;

  await prisma.agendaPessoalNotificacao.create({
    data: {
      usuarioId,
      titulo,
      mensagem,
      agendaId: agendaId || null,
      lida: false,
    },
  });
}

function listaIds(valor: any) {
  if (Array.isArray(valor)) return valor.map(Number).filter(Boolean);

  return String(valor || "")
    .split(",")
    .map((x) => Number(x.trim()))
    .filter(Boolean);
}

async function montarCompartilhados(
  agendaId: number,
  ids: number[],
  criadoPorNome: string,
  titulo: string
) {
  await prisma.agendaPessoalCompartilhamento.deleteMany({
    where: { agendaId },
  });

  const idsUnicos = Array.from(new Set(ids.map(Number).filter(Boolean)));

  if (!idsUnicos.length) return;

  const usuarios = await prisma.usuario.findMany({
    where: { id: { in: idsUnicos } },
  });

  for (const usuario of usuarios) {
    await prisma.agendaPessoalCompartilhamento.create({
      data: {
        agendaId,
        usuarioId: usuario.id,
        usuarioNome: usuario.nome,
        status: "PENDENTE",
      },
    });

    await criarNotificacao(
      usuario.id,
      "Novo item compartilhado",
      `${criadoPorNome} compartilhou com você: ${titulo}`,
      agendaId
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const usuarioId = Number(searchParams.get("usuarioId") || 0);
    const unidadeId = Number(searchParams.get("unidadeId") || 0);
    const data = searchParams.get("data") || "";
    const mes = searchParams.get("mes") || "";

    if (!usuarioId) {
      return Response.json({ error: "Usuário não informado" }, { status: 400 });
    }

    const and: any[] = [];

    if (unidadeId) {
      and.push({ unidadeId });
    }

    if (data) {
      and.push({
        OR: [{ dataInicio: data }, { dataFim: data }],
      });
    } else if (mes) {
      and.push({
        OR: [
          { dataInicio: { startsWith: mes } },
          { dataFim: { startsWith: mes } },
        ],
      });
    }

    and.push({
      OR: [
        { criadoPorId: usuarioId },
        { responsavelId: usuarioId },
        {
          compartilhamentos: {
            some: {
              usuarioId,
              status: { not: "RECUSADO" },
            },
          },
        },
      ],
    });

    const itens = await prisma.agendaPessoal.findMany({
      where: { AND: and },
      include: { compartilhamentos: true },
      orderBy: [
        { dataInicio: "asc" },
        { horaInicio: "asc" },
        { createdAt: "desc" },
      ],
    });

    const itensComStatusDoUsuario = itens.map((item: any) => {
      const compartilhamento = item.compartilhamentos?.find(
        (c: any) => Number(c.usuarioId) === Number(usuarioId)
      );

      if (
        compartilhamento &&
        Number(item.criadoPorId) !== Number(usuarioId) &&
        Number(item.responsavelId) !== Number(usuarioId)
      ) {
        return {
          ...item,
          status: compartilhamento.status || item.status,
        };
      }

      return item;
    });

    return Response.json(itensComStatusDoUsuario);
  } catch (error: any) {
    console.log("Erro ao buscar agenda pessoal:", error);

    return Response.json(
      {
        error: "Erro ao buscar agenda pessoal",
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const usuario = dadosUsuario(body);

    if (!usuario.usuarioId) {
      return Response.json({ error: "Usuário não informado" }, { status: 400 });
    }

    if (!body.titulo || !body.dataInicio) {
      return Response.json({ error: "Informe título e data" }, { status: 400 });
    }

    const responsavelId = body.responsavelId
      ? Number(body.responsavelId)
      : usuario.usuarioId;

    const compartilhadosIds = Array.from(
      new Set(
        listaIds(body.compartilhadosIds).filter(
          (id) => id !== usuario.usuarioId && id !== responsavelId
        )
      )
    );

    const vinteSegundosAtras = new Date(Date.now() - 20 * 1000);

    const duplicado = await prisma.agendaPessoal.findFirst({
      where: {
        criadoPorId: usuario.usuarioId,
        titulo: String(body.titulo || "").trim(),
        tipo: body.tipo || "EVENTO",
        dataInicio: body.dataInicio || "",
        horaInicio: body.horaInicio || "",
        createdAt: { gte: vinteSegundosAtras },
      },
      orderBy: { createdAt: "desc" },
    });

    if (duplicado) {
      return Response.json(duplicado);
    }

    const agenda = await prisma.agendaPessoal.create({
      data: {
        titulo: String(body.titulo || "").trim(),
        descricao: body.descricao || "",
        tipo: body.tipo || "EVENTO",
        dataInicio: body.dataInicio || "",
        horaInicio: body.horaInicio || "",
        dataFim: body.dataFim || body.dataInicio || "",
        horaFim: body.horaFim || "",
        diaInteiro: Boolean(body.diaInteiro),
        status: body.status || "PENDENTE",
        prioridade: body.prioridade || "NORMAL",

        criadoPorId: usuario.usuarioId,
        criadoPorNome: usuario.usuarioNome,

        responsavelId,
        responsavelNome: body.responsavelNome || usuario.usuarioNome,

        compartilhado: compartilhadosIds.length > 0,
        usuariosCompartilhados: compartilhadosIds.join(","),

        unidadeId: body.unidadeId ? Number(body.unidadeId) : null,
      },
    });

    await montarCompartilhados(
      agenda.id,
      compartilhadosIds,
      usuario.usuarioNome,
      agenda.titulo
    );

    if (agenda.responsavelId && agenda.responsavelId !== usuario.usuarioId) {
      await criarNotificacao(
        agenda.responsavelId,
        "Nova tarefa/agenda para você",
        `${usuario.usuarioNome} atribuiu para você: ${agenda.titulo}`,
        agenda.id
      );
    }

    await registrarHistorico({
      body,
      acao: "CRIOU",
      tela: "AGENDA_PESSOAL",
      registroId: agenda.id,
      registroNome: agenda.titulo,
      unidadeId: agenda.unidadeId,
      dadosAntes: null,
      dadosDepois: agenda,
    });

    return Response.json(agenda);
  } catch (error: any) {
    console.log("Erro ao criar agenda pessoal:", error);

    return Response.json(
      {
        error: "Erro ao criar agenda pessoal",
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const usuario = dadosUsuario(body);
    const id = Number(body.id);

    if (!id) {
      return Response.json({ error: "ID não informado" }, { status: 400 });
    }

    const antes = await prisma.agendaPessoal.findUnique({
      where: { id },
      include: { compartilhamentos: true },
    });

    if (!antes) {
      return Response.json({ error: "Item não encontrado" }, { status: 404 });
    }

    const compartilhamentoDoUsuario =
      await prisma.agendaPessoalCompartilhamento.findFirst({
        where: {
          agendaId: id,
          usuarioId: Number(usuario.usuarioId),
        },
      });

    const podeEditar =
      Number(antes.criadoPorId) === Number(usuario.usuarioId) ||
      Number(antes.responsavelId) === Number(usuario.usuarioId) ||
      Boolean(compartilhamentoDoUsuario) ||
      podeVerTodos(usuario.usuarioCargo);

    if (!podeEditar) {
      return Response.json(
        { error: "Você não tem permissão para editar este item" },
        { status: 403 }
      );
    }

    if (
      compartilhamentoDoUsuario &&
      Number(antes.criadoPorId) !== Number(usuario.usuarioId) &&
      Number(antes.responsavelId) !== Number(usuario.usuarioId) &&
      body.status &&
      ["ACEITO", "RECUSADO"].includes(String(body.status).toUpperCase())
    ) {
      const novoStatus = String(body.status).toUpperCase();

      await prisma.agendaPessoalCompartilhamento.update({
        where: { id: compartilhamentoDoUsuario.id },
        data: { status: novoStatus },
      });

      if (antes.criadoPorId) {
        await criarNotificacao(
          antes.criadoPorId,
          novoStatus === "ACEITO" ? "Agenda aceita" : "Agenda recusada",
          `${usuario.usuarioNome} ${
            novoStatus === "ACEITO" ? "aceitou" : "recusou"
          }: ${antes.titulo}`,
          antes.id
        );
      }

      return Response.json({
        ...antes,
        status: novoStatus,
      });
    }

    const compartilhadosIds =
      body.compartilhadosIds !== undefined
        ? Array.from(
            new Set(
              listaIds(body.compartilhadosIds).filter(
                (uid) =>
                  uid !== Number(usuario.usuarioId) &&
                  uid !== Number(body.responsavelId || antes.responsavelId)
              )
            )
          )
        : null;

    const agenda = await prisma.agendaPessoal.update({
      where: { id },
      data: {
        titulo:
          body.titulo !== undefined
            ? String(body.titulo || "").trim()
            : antes.titulo,
        descricao:
          body.descricao !== undefined ? body.descricao || "" : antes.descricao,
        tipo: body.tipo || antes.tipo,
        dataInicio: body.dataInicio || antes.dataInicio,
        horaInicio:
          body.horaInicio !== undefined ? body.horaInicio || "" : antes.horaInicio,
        dataFim: body.dataFim || antes.dataFim,
        horaFim: body.horaFim !== undefined ? body.horaFim || "" : antes.horaFim,
        diaInteiro:
          body.diaInteiro !== undefined
            ? Boolean(body.diaInteiro)
            : antes.diaInteiro,
        status: body.status || antes.status,
        prioridade: body.prioridade || antes.prioridade,

        responsavelId: body.responsavelId
          ? Number(body.responsavelId)
          : antes.responsavelId,
        responsavelNome: body.responsavelNome || antes.responsavelNome,

        compartilhado:
          compartilhadosIds !== null
            ? compartilhadosIds.length > 0
            : antes.compartilhado,
        usuariosCompartilhados:
          compartilhadosIds !== null
            ? compartilhadosIds.join(",")
            : antes.usuariosCompartilhados,

        unidadeId:
          body.unidadeId !== undefined
            ? body.unidadeId
              ? Number(body.unidadeId)
              : null
            : antes.unidadeId,
      },
    });

    if (compartilhadosIds !== null) {
      await montarCompartilhados(
        agenda.id,
        compartilhadosIds,
        usuario.usuarioNome,
        agenda.titulo
      );
    }

    if (
      agenda.status === "CONCLUIDO" &&
      antes.status !== "CONCLUIDO" &&
      antes.criadoPorId
    ) {
      await criarNotificacao(
        antes.criadoPorId,
        "Tarefa concluída",
        `${usuario.usuarioNome} concluiu: ${agenda.titulo}`,
        agenda.id
      );
    }

    if (
      agenda.status === "RECUSADO" &&
      antes.status !== "RECUSADO" &&
      antes.criadoPorId
    ) {
      await criarNotificacao(
        antes.criadoPorId,
        "Item recusado",
        `${usuario.usuarioNome} recusou: ${agenda.titulo}`,
        agenda.id
      );
    }

    await registrarHistorico({
      body,
      acao: "EDITOU",
      tela: "AGENDA_PESSOAL",
      registroId: agenda.id,
      registroNome: agenda.titulo,
      unidadeId: agenda.unidadeId,
      dadosAntes: antes,
      dadosDepois: agenda,
    });

    return Response.json(agenda);
  } catch (error: any) {
    console.log("Erro ao editar agenda pessoal:", error);

    return Response.json(
      {
        error: "Erro ao editar agenda pessoal",
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const usuario = dadosUsuario(body);
    const id = Number(body.id);

    const antes = await prisma.agendaPessoal.findUnique({
      where: { id },
    });

    if (!antes) {
      return Response.json({ error: "Item não encontrado" }, { status: 404 });
    }

    const podeExcluir =
      Number(antes.criadoPorId) === Number(usuario.usuarioId) ||
      podeVerTodos(usuario.usuarioCargo);

    if (!podeExcluir) {
      return Response.json(
        { error: "Você não tem permissão para excluir este item" },
        { status: 403 }
      );
    }

    await prisma.agendaPessoal.delete({
      where: { id },
    });

    await registrarHistorico({
      body,
      acao: "EXCLUIU",
      tela: "AGENDA_PESSOAL",
      registroId: id,
      registroNome: antes.titulo,
      unidadeId: antes.unidadeId,
      dadosAntes: antes,
      dadosDepois: null,
    });

    return Response.json({ ok: true });
  } catch (error: any) {
    console.log("Erro ao excluir agenda pessoal:", error);

    return Response.json(
      {
        error: "Erro ao excluir agenda pessoal",
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
