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

function metaAtingidaRanking(totalValidos: number, configuracao: any) {
  const premiacao = calcularPremiacao(Number(totalValidos || 0), configuracao);
  const atual = premiacao?.atual || { ordem: 0, quantidade: 0, valor: 0 };
  const proxima = premiacao?.proxima || null;

  if (Number(atual.valor || 0) > 0) {
    return {
      atingiu: true,
      meta: `Meta ${atual.ordem}`,
      ordem: atual.ordem,
      quantidade: Number(atual.quantidade || 0),
      valor: Number(atual.valor || 0),
      texto: `Meta ${atual.ordem} - R$ ${Number(atual.valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    };
  }

  return {
    atingiu: false,
    meta: "",
    ordem: 0,
    quantidade: 0,
    valor: 0,
    faltam: proxima ? Math.max(Number(proxima.quantidade || 0) - Number(totalValidos || 0), 0) : 0,
    proximaMeta: proxima ? `Meta ${proxima.ordem}` : "",
    proximaQuantidade: proxima ? Number(proxima.quantidade || 0) : 0,
    texto: proxima ? `Faltam ${Math.max(Number(proxima.quantidade || 0) - Number(totalValidos || 0), 0)} para Meta ${proxima.ordem}` : "-",
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


function permanenciaNormalizada(contrato: any) {
  return String(contrato?.permanencia || "").toUpperCase().trim();
}

function isMensal(contrato: any) {
  const texto = permanenciaNormalizada(contrato);
  return texto === "MENSAL" || texto.includes("MENSAL");
}

function isTransferenciaUnidade(contrato: any) {
  return contrato?.transferenciaUnidade === true || String(contrato?.transferenciaUnidade || "").toLowerCase() === "true";
}

function isAcrescimoModalidade(contrato: any) {
  return contrato?.acrescimoModalidade === true || String(contrato?.acrescimoModalidade || "").toLowerCase() === "true";
}

function isTrocaModalidade(contrato: any) {
  return contrato?.trocaModalidade === true || String(contrato?.trocaModalidade || "").toLowerCase() === "true";
}

function contaNaMetaGeral(contrato: any, unidadeAtualId?: number) {
  if (contrato?.cancelado) return false;
  if (isTrocaModalidade(contrato)) return false;

  // Transferência aparece nos relatórios das duas unidades,
  // mas só contabiliza meta na unidade destino, que é a unidadeId do contrato.
  if (isTransferenciaUnidade(contrato) && unidadeAtualId) {
    return Number(contrato.unidadeId) === Number(unidadeAtualId);
  }

  return true;
}

function contaNaComissao(contrato: any, unidadeAtualId?: number) {
  if (!contaNaMetaGeral(contrato, unidadeAtualId)) return false;
  if (isMensal(contrato)) return false;
  if (isTransferenciaUnidade(contrato)) return false;
  if (isTrocaModalidade(contrato)) return false;

  return true;
}


function contratosCreditadosParaUsuario(
  contratos: any[],
  usuarioNome: string,
  apenasValidos: boolean = false,
  unidadeAtualId?: number
) {
  const nomeUsuario = normalizarNome(usuarioNome);

  const contratosConsiderados = apenasValidos
    ? contratos.filter((contrato) => contaNaComissao(contrato, unidadeAtualId))
    : contratos.filter((contrato) => contaNaMetaGeral(contrato, unidadeAtualId));

  const proprios = contratosConsiderados.filter(
    (contrato) =>
      normalizarNome(contrato.vendedora) === nomeUsuario &&
      !contrato.contratoDividido
  );

  const meiosDivididos = contratosConsiderados.filter((contrato) => {
    if (!contrato.contratoDividido) return false;

    // Contrato mensal dividido nunca entra na soma dos meios.
    // Ex.: meio mensal + meio anual NÃO pode virar 1 contrato inteiro.
    if (isMensal(contrato)) return false;

    const vendedora = normalizarNome(contrato.vendedora);
    const divididoCom = normalizarNome(contrato.divididoCom);

    return vendedora === nomeUsuario || divididoCom === nomeUsuario;
  });

  const creditosDeMeios = Math.floor(meiosDivididos.length / 2);

  return [...proprios, ...meiosDivididos.slice(0, creditosDeMeios)];
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
        OR: [
          { unidadeId },
          {
            transferenciaUnidade: true,
            unidadeOrigemId: unidadeId,
          },
        ],
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

    const contratosMetaGeral = contratos.filter((contrato) =>
      contaNaMetaGeral(contrato, unidadeId)
    );

    const contratosComissao = contratos.filter((contrato) =>
      contaNaComissao(contrato, unidadeId)
    );

    const contratosTotais = contratosMetaGeral.length;

    const contratosSemMensal = contratosComissao.length;

    const anual = contratosMetaGeral.filter(
      (contrato) =>
        String(contrato.permanencia || "").toUpperCase() === "ANUAL"
    ).length;

    const semestral = contratosMetaGeral.filter(
      (contrato) =>
        String(contrato.permanencia || "").toUpperCase() === "SEMESTRAL"
    ).length;

    const trimestral = contratosMetaGeral.filter(
      (contrato) =>
        String(contrato.permanencia || "").toUpperCase() === "TRIMESTRAL"
    ).length;

    const mensal = contratosMetaGeral.filter(
      (contrato) =>
        String(contrato.permanencia || "").toUpperCase() === "MENSAL"
    ).length;

    const novos = contratosMetaGeral.filter(
      (contrato) =>
        String(contrato.tipoContrato || "").toUpperCase() === "NOVO"
    ).length;

    const retornos = contratosMetaGeral.filter(
      (contrato) =>
        String(contrato.tipoContrato || "").toUpperCase() === "RETORNO"
    ).length;

    const renovacoes = contratosMetaGeral.filter(
      (contrato) =>
        String(contrato.tipoContrato || "").toUpperCase() === "RENOVAÇÃO"
    ).length;

    const transferenciasUnidade = contratosMetaGeral.filter(isTransferenciaUnidade).length;
    const trocasModalidade = contratos.filter(isTrocaModalidade).length;
    const acrescimosModalidade = contratosMetaGeral.filter(isAcrescimoModalidade).length;

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
          meios: 0,
        };
      }

      return rankingMap[chave];
    }

    contratosComissao.forEach((contrato) => {
        const vendedora = contrato.vendedora || "NÃO INFORMADO";
        const divididoCom = contrato.divididoCom || "";

        if (contrato.contratoDividido && normalizarNome(divididoCom)) {
          garantirRanking(vendedora).meios += 1;
          garantirRanking(divididoCom).meios += 1;
        } else {
          garantirRanking(vendedora).proprios += 1;
        }
      });

    const ranking = Object.values(rankingMap)
      .map((item: any) => {
        const divididosCreditados = Math.floor(Number(item.meios || 0) / 2);
        const meiosPendentes = Number(item.meios || 0) % 2;
        const total = Number(item.proprios || 0) + divididosCreditados;

        return {
          ...item,
          total,
          divididosCreditados,
          meiosPendentes,
        };
      })
      .filter((item: any) => Number(item.total || 0) > 0 || Number(item.meiosPendentes || 0) > 0)
      .sort((a: any, b: any) => {
        const total = Number(b.total || 0) - Number(a.total || 0);
        if (total !== 0) return total;
        return Number(b.meiosPendentes || 0) - Number(a.meiosPendentes || 0);
      })
      .map((item: any, index) => ({
        posicao: index + 1,
        nome: item.nome,
        total: item.total,
        contratosValidos: item.total,
        proprios: item.proprios,
        divididosCreditados: item.divididosCreditados,
        meiosPendentes: item.meiosPendentes,
        metaAtingida: metaAtingidaRanking(item.total, configuracao),
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

    const meusContratos = contratosCreditadosParaUsuario(contratos, usuarioNome, false, unidadeId);

    // Para contratos válidos da meta, mensal continua sem contar.
    // Meio mensal também não entra na composição dos contratos válidos.
    const meusContratosSemMensal = contratosCreditadosParaUsuario(
      contratos,
      usuarioNome,
      true,
      unidadeId
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
        transferenciasUnidade,
        trocasModalidade,
        acrescimosModalidade,
      },

      extras: {
        convenios,
        contratosDivididos,
        transferenciasUnidade,
        trocasModalidade,
        acrescimosModalidade,
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
