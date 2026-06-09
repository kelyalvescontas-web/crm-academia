import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function mesAtual() {
  const hoje = new Date();

  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);

  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");

  return {
    inicio,
    fim,
    mesReferencia: `${ano}-${mes}`,
  };
}

function calcularPercentual(valor: number, meta: number) {
  if (!meta || meta <= 0) return 0;
  const percentual = Math.round((valor / meta) * 100);
  return percentual > 100 ? 100 : percentual;
}

function calcularPremiacao(total: number, configuracao: any) {
  const metas = [
    {
      ordem: 1,
      quantidade: Number(configuracao?.meta1Qtd || 30),
      valor: Number(configuracao?.meta1Valor || 300),
    },
    {
      ordem: 2,
      quantidade: Number(configuracao?.meta2Qtd || 40),
      valor: Number(configuracao?.meta2Valor || 500),
    },
    {
      ordem: 3,
      quantidade: Number(configuracao?.meta3Qtd || 50),
      valor: Number(configuracao?.meta3Valor || 800),
    },
    {
      ordem: 4,
      quantidade: Number(configuracao?.meta4Qtd || 60),
      valor: Number(configuracao?.meta4Valor || 1200),
    },
  ].sort((a, b) => a.quantidade - b.quantidade);

  let atual = {
    ordem: 0,
    quantidade: 0,
    valor: 0,
  };

  metas.forEach((meta) => {
    if (total >= meta.quantidade) {
      atual = meta;
    }
  });

  const proxima = metas.find((meta) => total < meta.quantidade) || null;

  return {
    metas,
    atual,
    proxima,
  };
}

function normalizarNome(valor: any) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

function nomeBonito(valor: any) {
  const nome = String(valor || "NÃO INFORMADO")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

  return nome.replace(/(^|\s)\S/g, (letra) => letra.toUpperCase());
}

function valorTexto(...valores: any[]) {
  for (const valor of valores) {
    const texto = String(valor ?? "").trim();
    if (texto) return texto;
  }
  return "";
}

async function buscarConfiguracaoCompleta(unidadeId: number, mesReferencia: string) {
  const configuracaoPrisma = await prisma.configuracaoMeta.findFirst({
    where: { unidadeId, mes: mesReferencia },
    orderBy: { updatedAt: "desc" },
  });

  let configuracaoRaw: any = null;

  try {
    const mesSeguro = String(mesReferencia).replace(/'/g, "''");

    const linhas: any[] = await prisma.$queryRawUnsafe(`
      SELECT *
      FROM "ConfiguracaoMeta"
      WHERE "unidadeId" = ${Number(unidadeId)}
      AND "mes" = '${mesSeguro}'
      ORDER BY "updatedAt" DESC
      LIMIT 1
    `);

    configuracaoRaw = linhas?.[0] || null;
  } catch (error) {
    console.log("Erro ao buscar configuração completa via SQL:", error);
  }

  if (configuracaoPrisma || configuracaoRaw) {
    return {
      ...(configuracaoPrisma || {}),
      ...(configuracaoRaw || {}),
    };
  }

  return await prisma.configuracaoMeta.create({
    data: {
      unidadeId,
      mes: mesReferencia,
      metaEmpresa: 60,
      meta1Qtd: 30,
      meta1Valor: 300,
      meta2Qtd: 40,
      meta2Valor: 500,
      meta3Qtd: 50,
      meta3Valor: 800,
      meta4Qtd: 60,
      meta4Valor: 1200,
      mensagemMotivacional:
        "Você é capaz de mais do que imagina! Cada contrato é um passo para sua vitória.",
      mensagemCrista:
        "Tudo posso naquele que me fortalece. Filipenses 4:13",
    },
  });
}

function adicionarComunicado(lista: any[], dados: any) {
  const tituloOriginal = valorTexto(dados.titulo, dados.nome);
  const mensagem = valorTexto(
    dados.mensagem,
    dados.texto,
    dados.descricao,
    dados.conteudo,
    dados.subtitulo
  );

  if (!tituloOriginal.trim() && !mensagem.trim()) return;

  const titulo = tituloOriginal || dados.tituloPadrao || "Comunicado";

  lista.push({
    titulo,
    mensagem,
    texto: mensagem,
    descricao: mensagem,
    conteudo: mensagem,
    subtitulo: mensagem,
    tipo: dados.tipo || "comunicado",
  });
}

function contratosCreditadosParaUsuario(contratos: any[], usuarioNome: string) {
  const nomeUsuario = normalizarNome(usuarioNome);

  const proprios = contratos.filter(
    (contrato) =>
      normalizarNome(contrato.vendedora) === nomeUsuario &&
      !contrato.contratoDividido
  );

  const divididos = contratos.filter((contrato) => {
    if (!contrato.contratoDividido) return false;

    const vendedora = normalizarNome(contrato.vendedora);
    const divididoCom = normalizarNome(contrato.divididoCom);

    return vendedora === nomeUsuario || divididoCom === nomeUsuario;
  });

  const grupos: any = {};

  divididos.forEach((contrato) => {
    const vendedora = normalizarNome(contrato.vendedora);
    const divididoCom = normalizarNome(contrato.divididoCom);
    const parceiro = vendedora === nomeUsuario ? divididoCom : vendedora;

    if (!parceiro) return;

    if (!grupos[parceiro]) grupos[parceiro] = [];
    grupos[parceiro].push(contrato);
  });

  const compartilhadosCreditados = Object.values(grupos).flatMap((lista: any) =>
    lista.slice(0, Math.floor(lista.length / 2))
  );

  return [...proprios, ...compartilhadosCreditados];
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const unidadeId = Number(searchParams.get("unidadeId"));
    const usuarioId = searchParams.get("usuarioId");
    const usuarioNome = searchParams.get("usuarioNome") || "";
    const usuarioCargo = String(searchParams.get("usuarioCargo") || "").toUpperCase().replace(/\s+/g, "_");
    const dataInicial = searchParams.get("dataInicial");
    const dataFinal = searchParams.get("dataFinal");

    if (!unidadeId) {
      return Response.json(
        { error: "Unidade não informada" },
        { status: 400 }
      );
    }

    const adminGeral =
      usuarioCargo === "ADMIN_GERAL" ||
      normalizarNome(usuarioNome) === "GERENCIAL" ||
      normalizarNome(usuarioNome) === "ADMIN_GERAL" ||
      normalizarNome(usuarioNome) === "ADMIN GERAL";

    const periodo = mesAtual();

    const inicio = dataInicial || periodo.inicio;
    const fim = dataFinal || periodo.fim;
    const mesReferencia =
      String(inicio || periodo.inicio).slice(0, 7) || periodo.mesReferencia;

    const configuracao = await buscarConfiguracaoCompleta(
      unidadeId,
      mesReferencia
    );

    const metaPessoalRegistro =
      (await prisma.metaPessoal.findFirst({
        where: {
          unidadeId,
          mes: mesReferencia,
          OR: [
            usuarioId ? { usuarioId: Number(usuarioId) } : {},
            { usuarioNome },
          ],
        },
        orderBy: { updatedAt: "desc" },
      })) ||
      (await prisma.metaPessoal.create({
        data: {
          unidadeId,
          usuarioId: usuarioId ? Number(usuarioId) : null,
          usuarioNome: usuarioNome || "NÃO IDENTIFICADO",
          mes: mesReferencia,
          meta: 40,
        },
      }));

    const contratos = await prisma.contratoMeta.findMany({
      where: {
        unidadeId,
        dataVenda: {
          gte: inicio,
          lte: fim,
        },
      },
      orderBy: [
        { dataVenda: "desc" },
        { createdAt: "desc" },
      ],
    });

    const contratosTotais = contratos.length;

    const contratosSemMensal = contratos.filter(
      (contrato) =>
        String(contrato.permanencia || "").toUpperCase() !== "MENSAL"
    ).length;

    const anual = contratos.filter(
      (contrato) =>
        String(contrato.permanencia || "").toUpperCase() === "ANUAL"
    ).length;

    const semestral = contratos.filter(
      (contrato) =>
        String(contrato.permanencia || "").toUpperCase() === "SEMESTRAL"
    ).length;

    const trimestral = contratos.filter(
      (contrato) =>
        String(contrato.permanencia || "").toUpperCase() === "TRIMESTRAL"
    ).length;

    const mensal = contratos.filter(
      (contrato) =>
        String(contrato.permanencia || "").toUpperCase() === "MENSAL"
    ).length;

    const novos = contratos.filter(
      (contrato) =>
        String(contrato.tipoContrato || "").toUpperCase() === "NOVO"
    ).length;

    const retornos = contratos.filter(
      (contrato) =>
        String(contrato.tipoContrato || "").toUpperCase() === "RETORNO"
    ).length;

    const renovacoes = contratos.filter(
      (contrato) =>
        String(contrato.tipoContrato || "").toUpperCase() === "RENOVAÇÃO"
    ).length;

    const convenios = contratos.filter((contrato) => contrato.convenio).length;

    const contratosDivididos = contratos.filter(
      (contrato) => contrato.contratoDividido
    ).length;

    const rankingMap: any = {};

    function garantirRanking(nomeOriginal: any) {
      const chave = normalizarNome(nomeOriginal) || "NÃO INFORMADO";

      if (!rankingMap[chave]) {
        rankingMap[chave] = {
          chave,
          nome: nomeBonito(nomeOriginal),
          proprios: 0,
          meiosPorParceiro: {},
          total: 0,
        };
      }

      return rankingMap[chave];
    }

    contratos
      .filter(
        (contrato) =>
          String(contrato.permanencia || "").toUpperCase() !== "MENSAL"
      )
      .forEach((contrato) => {
        const vendedoraOriginal = contrato.vendedora || "NÃO INFORMADO";
        const divididoComOriginal = contrato.divididoCom || "";
        const vendedoraKey =
          normalizarNome(vendedoraOriginal) || "NÃO INFORMADO";
        const divididoComKey = normalizarNome(divididoComOriginal);

        if (contrato.contratoDividido && divididoComKey) {
          const vendedora = garantirRanking(vendedoraOriginal);
          const parceira = garantirRanking(divididoComOriginal);

          vendedora.meiosPorParceiro[divididoComKey] =
            Number(vendedora.meiosPorParceiro[divididoComKey] || 0) + 1;

          parceira.meiosPorParceiro[vendedoraKey] =
            Number(parceira.meiosPorParceiro[vendedoraKey] || 0) + 1;
        } else {
          garantirRanking(vendedoraOriginal).proprios += 1;
        }
      });

    const ranking = Object.values(rankingMap)
      .map((item: any) => {
        const divididosCreditados = Object.values(
          item.meiosPorParceiro || {}
        ).reduce(
          (total: number, qtd: any) =>
            total + Math.floor(Number(qtd || 0) / 2),
          0
        );

        return {
          ...item,
          divididosCreditados,
          total: Number(item.proprios || 0) + divididosCreditados,
        };
      })
      .filter((item: any) => Number(item.total || 0) > 0)
      .sort((a: any, b: any) => Number(b.total || 0) - Number(a.total || 0))
      .map((item: any, index) => ({
        posicao: index + 1,
        nome: item.nome,
        total: item.total,
        proprios: item.proprios,
        divididosCreditados: item.divididosCreditados,
      }));

    const meusContratosVisiveis = contratos.filter((contrato) => {
      const nomeUsuario = normalizarNome(usuarioNome);

      const vendedora = normalizarNome(contrato.vendedora);
      const divididoCom = normalizarNome(contrato.divididoCom);

      return (
        vendedora === nomeUsuario ||
        (contrato.contratoDividido && divididoCom === nomeUsuario)
      );
    });

    const meusContratos = contratosCreditadosParaUsuario(contratos, usuarioNome);

    const meusContratosSemMensal = meusContratos.filter(
      (contrato) =>
        String(contrato.permanencia || "").toUpperCase() !== "MENSAL"
    );

    const meusAnual = meusContratos.filter(
      (contrato) =>
        String(contrato.permanencia || "").toUpperCase() === "ANUAL"
    ).length;

    const meusSemestral = meusContratos.filter(
      (contrato) =>
        String(contrato.permanencia || "").toUpperCase() === "SEMESTRAL"
    ).length;

    const meusTrimestral = meusContratos.filter(
      (contrato) =>
        String(contrato.permanencia || "").toUpperCase() === "TRIMESTRAL"
    ).length;

    const meusMensal = meusContratos.filter(
      (contrato) =>
        String(contrato.permanencia || "").toUpperCase() === "MENSAL"
    ).length;

    const meusNovos = meusContratos.filter(
      (contrato) => String(contrato.tipoContrato || "").toUpperCase() === "NOVO"
    ).length;

    const meusRetornos = meusContratos.filter(
      (contrato) =>
        String(contrato.tipoContrato || "").toUpperCase() === "RETORNO"
    ).length;

    const meusRenovacoes = meusContratos.filter(
      (contrato) =>
        String(contrato.tipoContrato || "").toUpperCase() === "RENOVAÇÃO"
    ).length;

    const minhaPosicao =
      ranking.find(
        (item: any) => normalizarNome(item.nome) === normalizarNome(usuarioNome)
      )?.posicao || null;

    const metaEmpresa = Number(
      (configuracao as any).metaEmpresa ?? configuracao.meta4Qtd ?? 60
    );
    const metaPessoal = Number(metaPessoalRegistro.meta || 40);

    const campanhaAtiva =
      (configuracao as any).campanhaAtiva === false ||
      (configuracao as any).campanhaAtiva === 0 ||
      (configuracao as any).campanhaAtiva === "false"
        ? false
        : true;

    const campanhaExtra = campanhaAtiva
      ? {
          ativa: true,
          titulo: valorTexto((configuracao as any).campanhaTitulo, "Campanha Extra"),
          regra: valorTexto((configuracao as any).campanhaRegra),
          premio: valorTexto((configuracao as any).campanhaPremio),
          progresso: Number((configuracao as any).campanhaProgresso ?? 0),
          objetivo: Number((configuracao as any).campanhaObjetivo ?? 2),
          unidade: valorTexto(
            (configuracao as any).campanhaUnidade,
            (configuracao as any).campanhaUnidadeProgresso,
            "indicações fechadas"
          ),
          funcionarias: valorTexto((configuracao as any).campanhaFuncionarias),
        }
      : { ativa: false };

    const comunicados: any[] = [];

    adicionarComunicado(comunicados, {
      titulo: (configuracao as any).comunicado1Titulo,
      mensagem: valorTexto(
        (configuracao as any).comunicado1Mensagem,
        (configuracao as any).comunicado1Texto,
        (configuracao as any).mensagemComunicado1,
        (configuracao as any).textoComunicado1
      ),
      tipo: "reuniao",
      tituloPadrao: "Comunicado",
    });

    adicionarComunicado(comunicados, {
      titulo: (configuracao as any).comunicado2Titulo,
      mensagem: valorTexto(
        (configuracao as any).comunicado2Mensagem,
        (configuracao as any).comunicado2Texto,
        (configuracao as any).mensagemComunicado2,
        (configuracao as any).textoComunicado2
      ),
      tipo: "campanha",
      tituloPadrao: "Comunicado",
    });

    adicionarComunicado(comunicados, {
      titulo: (configuracao as any).comunicado3Titulo,
      mensagem: valorTexto(
        (configuracao as any).comunicado3Mensagem,
        (configuracao as any).comunicado3Texto,
        (configuracao as any).mensagemComunicado3,
        (configuracao as any).textoComunicado3
      ),
      tipo: "plano",
      tituloPadrao: "Comunicado",
    });

    adicionarComunicado(comunicados, {
      titulo: valorTexto(
        (configuracao as any).lancamento1Titulo,
        (configuracao as any).lancamentoTitulo,
        (configuracao as any).tituloLancamento,
        (configuracao as any).tituloLancamento1
      ),
      mensagem: valorTexto(
        (configuracao as any).lancamento1Mensagem,
        (configuracao as any).lancamento1Texto,
        (configuracao as any).lancamento1Descricao,
        (configuracao as any).lancamentoMensagem,
        (configuracao as any).lancamentoTexto,
        (configuracao as any).lancamentoDescricao,
        (configuracao as any).descricaoLancamento,
        (configuracao as any).descricaoLancamento1,
        (configuracao as any).textoLancamento,
        (configuracao as any).textoLancamento1
      ),
      tipo: "lancamento",
      tituloPadrao: "Lançamento",
    });

    adicionarComunicado(comunicados, {
      titulo: valorTexto(
        (configuracao as any).lancamento2Titulo,
        (configuracao as any).tituloLancamento2
      ),
      mensagem: valorTexto(
        (configuracao as any).lancamento2Mensagem,
        (configuracao as any).lancamento2Texto,
        (configuracao as any).lancamento2Descricao,
        (configuracao as any).descricaoLancamento2,
        (configuracao as any).textoLancamento2
      ),
      tipo: "lancamento",
      tituloPadrao: "Lançamento",
    });

    const premiacaoEmpresa = calcularPremiacao(contratosSemMensal, configuracao);

    const premiacaoPessoal = calcularPremiacao(
      meusContratosSemMensal.length,
      configuracao
    );

    const contratosRetorno = adminGeral ? contratos : meusContratosVisiveis;

    return Response.json({
      periodo: {
        inicio,
        fim,
        mesReferencia,
      },

      configuracao,
      metaPessoalRegistro,

      mensagens: {
        motivacional:
          configuracao.mensagemMotivacional ||
          "Você é capaz de mais do que imagina!",
        crista:
          configuracao.mensagemCrista ||
          "Tudo posso naquele que me fortalece. Filipenses 4:13",
      },

      metaEmpresa,
      metaPessoal,

      contratosTotais,
      contratosSemMensal,

      percentualEmpresa: calcularPercentual(contratosTotais, metaEmpresa),
      percentualPessoal: calcularPercentual(
        meusContratosSemMensal.length,
        metaPessoal
      ),

      faltamEmpresa:
        metaEmpresa - contratosTotais > 0 ? metaEmpresa - contratosTotais : 0,

      faltamPessoal:
        metaPessoal - meusContratosSemMensal.length > 0
          ? metaPessoal - meusContratosSemMensal.length
          : 0,

      planos: {
        anual,
        semestral,
        trimestral,
        mensal,
      },

      tipos: {
        novos,
        retornos,
        renovacoes,
      },

      extras: {
        convenios,
        contratosDivididos,
      },

      premiacaoEmpresa,
      premiacaoPessoal,

      campanhaExtra,
      comunicados,

      ranking,

      meuResumo: {
        nome: usuarioNome,
        total: meusContratos.length,
        totalSemMensal: meusContratosSemMensal.length,
        posicao: minhaPosicao,
        metaPessoal,

        anual: meusAnual,
        semestral: meusSemestral,
        trimestral: meusTrimestral,
        mensal: meusMensal,

        novos: meusNovos,
        retornos: meusRetornos,
        renovacoes: meusRenovacoes,

        percentual: calcularPercentual(
          meusContratosSemMensal.length,
          metaPessoal
        ),
        faltam:
          metaPessoal - meusContratosSemMensal.length > 0
            ? metaPessoal - meusContratosSemMensal.length
            : 0,
      },

      ultimosContratos: contratosRetorno,
    });
  } catch (error) {
    console.log(error);

    return Response.json({ error: "Erro ao buscar metas" }, { status: 500 });
  }
}
