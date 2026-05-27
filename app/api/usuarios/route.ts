import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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

    return Response.json(usuario);
  } catch (error) {
    console.log(error);
    return Response.json({ error: "Erro ao criar usuário" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();

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

    return Response.json(usuario);
  } catch (error) {
    console.log(error);
    return Response.json({ error: "Erro ao editar usuário" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();

    await prisma.usuario.delete({
      where: { id: Number(body.id) },
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.log(error);
    return Response.json({ error: "Erro ao excluir usuário" }, { status: 500 });
  }
}