import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const horariosPadrao = [
  "07:30",
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "18:15",
  "18:45",
  "19:15",
  "19:45",
  "20:15",
  "20:45",
];

async function garantirColunasBloqueio() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "AgendaNutricionistaBloqueio"
    ADD COLUMN IF NOT EXISTS "tipo" TEXT DEFAULT 'Feriado',
    ADD COLUMN IF NOT EXISTS "horariosLiberados" TEXT
  `);
}

function getUnidadeId(req: Request, body?: any) {
  const { searchParams } = new URL(req.url);
  const id = body?.unidadeId || searchParams.get("unidadeId");
  return id ? Number(id) : null;
}

function parseHorariosLiberados(valor: any) {
  if (!valor) return [];
  if (Array.isArray(valor)) return valor;

  try {
    return JSON.parse(String(valor));
  } catch {
    return String(valor)
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }
}

async function configCompleta(unidadeId: number | null) {
  const whereUnidade = unidadeId ? { unidadeId } : { unidadeId: null };

  const horariosBanco = await prisma.agendaNutricionistaHorario.findMany({
    where: { ...whereUnidade, ativo: true },
    orderBy: { horario: "asc" },
  });

  if (horariosBanco.length === 0) {
    await prisma.agendaNutricionistaHorario.createMany({
      data: horariosPadrao.map((horario) => ({
        horario,
        ativo: true,
        unidadeId,
      })),
      skipDuplicates: true,
    });
  }

  const [horarios, bloqueios, aviso] = await Promise.all([
    prisma.agendaNutricionistaHorario.findMany({
      where: { ...whereUnidade, ativo: true },
      orderBy: { horario: "asc" },
    }),
    prisma.agendaNutricionistaBloqueio.findMany({
      where: whereUnidade,
      orderBy: { data: "asc" },
    }),
    prisma.agendaNutricionistaAviso.findFirst({
      where: { ...whereUnidade, ativo: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return {
    horarios: horarios.map((h) => h.horario),
    aviso:
      aviso?.mensagem ||
      "30/05 (Sexta-feira) é feriado de Corpus Christi.\nAs consultas deste dia serão reagendadas.",
    bloqueios: bloqueios.map((b: any) => ({
      id: String(b.id),
      data: b.data,
      tipo: b.tipo || (b.diaTodo ? "Feriado" : "Horário especial"),
      motivo: b.motivo,
      horariosLiberados: parseHorariosLiberados(b.horariosLiberados),
    })),
  };
}

export async function GET(req: Request) {
  try {
    await garantirColunasBloqueio();

    const unidadeId = getUnidadeId(req);
    const config = await configCompleta(unidadeId);

    return Response.json(config);
  } catch (error) {
    console.log("ERRO GET CONFIG NUTRI:", error);
    return Response.json({ error: "Erro ao buscar configurações da agenda nutricionista" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await garantirColunasBloqueio();

    const body = await req.json();
    const unidadeId = getUnidadeId(req, body);

    const horarios = Array.isArray(body.horarios) ? body.horarios : horariosPadrao;
    const bloqueios = Array.isArray(body.bloqueios) ? body.bloqueios : [];
    const aviso = body.aviso || "";

    const whereUnidade = unidadeId ? { unidadeId } : { unidadeId: null };

    await prisma.agendaNutricionistaHorario.deleteMany({ where: whereUnidade });
    await prisma.agendaNutricionistaHorario.createMany({
      data: [...new Set(horarios)].sort().map((horario: any) => ({
        horario: String(horario),
        ativo: true,
        unidadeId,
      })),
    });

    await prisma.agendaNutricionistaBloqueio.deleteMany({ where: whereUnidade });
    if (bloqueios.length > 0) {
      await prisma.agendaNutricionistaBloqueio.createMany({
        data: bloqueios.map((b: any) => ({
          data: b.data,
          tipo: b.tipo || "Feriado",
          motivo: b.motivo || "",
          diaTodo: b.tipo !== "Horário especial",
          horariosLiberados: JSON.stringify(b.horariosLiberados || []),
          unidadeId,
        })),
      });
    }

    await prisma.agendaNutricionistaAviso.deleteMany({ where: whereUnidade });
    await prisma.agendaNutricionistaAviso.create({
      data: {
        titulo: "Aviso da Nutricionista",
        mensagem: aviso,
        ativo: true,
        publicadoPor: body.usuarioNome || "",
        unidadeId,
      },
    });

    return Response.json(await configCompleta(unidadeId));
  } catch (error) {
    console.log("ERRO PUT CONFIG NUTRI:", error);
    return Response.json({ error: "Erro ao salvar configurações da agenda nutricionista" }, { status: 500 });
  }
}
