import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function usuarioSeguro(usuario: any) {
  if (!usuario) return null;

  const copia = { ...usuario };

  delete copia.senha;

  const pin = copia.pinMetas;
  delete copia.pinMetas;

  return {
    ...copia,
    temPinMetas: Boolean(pin),
    fotoUrl: copia.fotoUrl || "",
    temaNome: copia.temaNome || "AZUL",
    temaCor: copia.temaCor || "#1e3a8a",
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const email = String(body.email || "").trim().toLowerCase();
    const senha = String(body.senha || "");

    if (!email || !senha) {
      return Response.json(
        { error: "Informe usuário e senha" },
        { status: 400 }
      );
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email },
      include: { unidade: true },
    });

    if (!usuario) {
      return Response.json(
        { error: "Usuário ou senha inválidos" },
        { status: 401 }
      );
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta) {
      return Response.json(
        { error: "Usuário ou senha inválidos" },
        { status: 401 }
      );
    }

    return Response.json(usuarioSeguro(usuario));
  } catch (error) {
    console.log(error);
    return Response.json(
      { error: "Erro ao fazer login" },
      { status: 500 }
    );
  }
}
