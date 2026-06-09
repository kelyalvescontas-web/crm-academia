import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

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
}

function usuarioSeguro(usuario: any) {
  if (!usuario) return usuario;

  const copia = { ...usuario };

  delete copia.senha;

  const pin = copia.pinMetas;
  delete copia.pinMetas;

  return {
    ...copia,
    temPinMetas: Boolean(pin),
  };
}

function podeGerenciarUsuarios(cargo: string) {
  const c = normalizarCargo(cargo);
  return c === "ADMIN_GERAL" || c === "ADMIN";
}

function validarPin(pin: any) {
  const texto = String(pin || "").trim();

  if (!texto) return true;

  return /^\d{4}$/.test(texto);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const usuarioId = searchParams.get("usuarioId");
    const usuarioCargo = searchParams.get("usuarioCargo");

    const cargo = normalizarCargo(usuarioCargo);

    const where =
      usuarioId && !podeGerenciarUsuarios(cargo)
        ? { id: Number(usuarioId) }
        : {};

    const usuarios = await prisma.usuario.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { unidade: true },
    });

    return Response.json(usuarios.map(usuarioSeguro));
  } catch (error) {
    console.log(error);
    return Response.json({ error: "Erro ao buscar usuários" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!podeGerenciarUsuarios(body.usuarioCargo)) {
      return Response.json(
        { error: "Você não tem permissão para criar usuários" },
        { status: 403 }
      );
    }

    if (!body.nome || !body.email || !body.senha || !body.unidadeId) {
      return Response.json(
        { error: "Preencha nome, email, senha e unidade" },
        { status: 400 }
      );
    }

    if (!validarPin(body.pinMetas)) {
      return Response.json(
        { error: "O PIN das Metas deve ter exatamente 4 números" },
        { status: 400 }
      );
    }

    const existe = await prisma.usuario.findUnique({
      where: { email: body.email },
    });

    if (existe) {
      return Response.json({ error: "Usuário já existe" }, { status: 400 });
    }

    const senhaHash = await bcrypt.hash(body.senha, 10);

    const data: any = {
      nome: body.nome,
      email: body.email,
      senha: senhaHash,
      cargo: body.cargo,
      unidadeId: Number(body.unidadeId),
      fotoUrl: body.fotoUrl || "",
      temaNome: body.temaNome || "AZUL",
      temaCor: body.temaCor || "#1e3a8a",
    };

    if (body.pinMetas) {
      data.pinMetas = await bcrypt.hash(String(body.pinMetas), 10);
    }

    const usuario = await prisma.usuario.create({
      data,
      include: { unidade: true },
    });

    await registrarHistorico({
      body,
      acao: "CRIOU",
      tela: "USUARIOS",
      registroId: usuario.id,
      registroNome: usuario.nome,
      unidadeId: usuario.unidadeId,
      dadosAntes: null,
      dadosDepois: usuarioSeguro(usuario),
    });

    return Response.json(usuarioSeguro(usuario));
  } catch (error) {
    console.log(error);
    return Response.json({ error: "Erro ao criar usuário" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();

    const cargoLogado = normalizarCargo(body.usuarioCargo);
    const usuarioIdLogado = body.usuarioId ? Number(body.usuarioId) : null;
    const editandoId = Number(body.id);
    const editandoProprio = Boolean(usuarioIdLogado && editandoId === usuarioIdLogado);
    const adminPodeGerenciar = podeGerenciarUsuarios(cargoLogado);

    if (!adminPodeGerenciar && !editandoProprio) {
      return Response.json(
        { error: "Você só pode editar o seu próprio usuário" },
        { status: 403 }
      );
    }

    if (!validarPin(body.pinMetas)) {
      return Response.json(
        { error: "O PIN das Metas deve ter exatamente 4 números" },
        { status: 400 }
      );
    }

    const usuarioAntes = await prisma.usuario.findUnique({
      where: { id: editandoId },
      include: { unidade: true },
    });

    if (!usuarioAntes) {
      return Response.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Colaboradora/usuário comum pode alterar dados pessoais, mas não cargo nem unidade.
    const data: any = {
      nome: body.nome || usuarioAntes.nome,
      email: body.email || usuarioAntes.email,
      cargo: adminPodeGerenciar ? body.cargo : usuarioAntes.cargo,
      unidadeId: adminPodeGerenciar
        ? Number(body.unidadeId || usuarioAntes.unidadeId)
        : usuarioAntes.unidadeId,
      fotoUrl:
        body.fotoUrl !== undefined && body.fotoUrl !== null
          ? body.fotoUrl
          : usuarioAntes.fotoUrl || "",
      temaNome: body.temaNome || usuarioAntes.temaNome || "AZUL",
      temaCor: body.temaCor || usuarioAntes.temaCor || "#1e3a8a",
    };

    if (body.senha) {
      data.senha = await bcrypt.hash(body.senha, 10);
    }

    if (body.pinMetas) {
      data.pinMetas = await bcrypt.hash(String(body.pinMetas), 10);
    }

    const usuario = await prisma.usuario.update({
      where: { id: editandoId },
      data,
      include: { unidade: true },
    });

    await registrarHistorico({
      body,
      acao: "EDITOU",
      tela: "USUARIOS",
      registroId: usuario.id,
      registroNome: usuario.nome,
      unidadeId: usuario.unidadeId,
      dadosAntes: usuarioSeguro(usuarioAntes),
      dadosDepois: usuarioSeguro(usuario),
    });

    return Response.json(usuarioSeguro(usuario));
  } catch (error) {
    console.log(error);
    return Response.json({ error: "Erro ao editar usuário" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();

    if (normalizarCargo(body.usuarioCargo) !== "ADMIN_GERAL") {
      return Response.json(
        { error: "Somente ADMIN_GERAL pode excluir usuários" },
        { status: 403 }
      );
    }

    const usuarioAntes = await prisma.usuario.findUnique({
      where: { id: Number(body.id) },
      include: { unidade: true },
    });

    await prisma.usuario.delete({
      where: { id: Number(body.id) },
    });

    await registrarHistorico({
      body,
      acao: "EXCLUIU",
      tela: "USUARIOS",
      registroId: Number(body.id),
      registroNome: usuarioAntes?.nome || "",
      unidadeId: usuarioAntes?.unidadeId || null,
      dadosAntes: usuarioSeguro(usuarioAntes),
      dadosDepois: null,
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.log(error);
    return Response.json({ error: "Erro ao excluir usuário" }, { status: 500 });
  }
}
