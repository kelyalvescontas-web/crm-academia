import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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

function removerSenha(usuario: any) {
  if (!usuario) return usuario;

  const copia = { ...usuario };
  delete copia.senha;

  return copia;
}

export async function GET() {
  try {
    const usuarios = await prisma.usuario.findMany({
      orderBy: { createdAt: "desc" },
      include: { unidade: true },
    });

    return Response.json(usuarios);
  } catch (error) {
    console.log(error);
    return Response.json({ error: "Erro ao buscar usuários" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const existe = await prisma.usuario.findUnique({
      where: { email: body.email },
    });

    if (existe) {
      return Response.json({ error: "Usuário já existe" }, { status: 400 });
    }

    const senhaHash = await bcrypt.hash(body.senha, 10);

    const usuario = await prisma.usuario.create({
      data: {
        nome: body.nome,
        email: body.email,
        senha: senhaHash,
        cargo: body.cargo,
        unidadeId: Number(body.unidadeId),
      },
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
      dadosDepois: removerSenha(usuario),
    });

    return Response.json(usuario);
  } catch (error) {
    console.log(error);
    return Response.json({ error: "Erro ao criar usuário" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();

    const usuarioAntes = await prisma.usuario.findUnique({
      where: { id: Number(body.id) },
      include: { unidade: true },
    });

    const data: any = {
      nome: body.nome,
      email: body.email,
      cargo: body.cargo,
      unidadeId: Number(body.unidadeId),
    };

    if (body.senha) {
      data.senha = await bcrypt.hash(body.senha, 10);
    }

    const usuario = await prisma.usuario.update({
      where: { id: Number(body.id) },
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
      dadosAntes: removerSenha(usuarioAntes),
      dadosDepois: removerSenha(usuario),
    });

    return Response.json(usuario);
  } catch (error) {
    console.log(error);
    return Response.json({ error: "Erro ao editar usuário" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();

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
      dadosAntes: removerSenha(usuarioAntes),
      dadosDepois: null,
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.log(error);
    return Response.json({ error: "Erro ao excluir usuário" }, { status: 500 });
  }
}