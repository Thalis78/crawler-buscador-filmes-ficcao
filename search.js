import { paginas } from "./crawler.js";

/**
 * @description Função que normaliza o texto removendo acentuação e caracteres especiais.
 * @param {string} texto - Texto a ser normalizado.
 * @returns {string} - Texto normalizado.
 * @note A normalização é feita utilizando o método normalize do JavaScript,
 *      que transforma os caracteres acentuados em seus equivalentes não acentuados.
 *      
*/
function normalizarTexto(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * @description Função que conta as referências de cada página, ou seja, quantas vezes ela é referenciada por outras páginas.
 * 
 */
export function contarReferencias() {
  for (const info of Object.values(paginas)) {
    // Para cada página visitada
    info.links.forEach((destino) => {
      // Para cada link encontrado na página
      if (paginas[destino]) {
        // Verifica se o link é uma página válida
        paginas[destino].referencias++; // Incrementa o contador de referências da página de destino
      }
    });
  }
}

/**
 * @description Função que conta as ocorrências de um termo em um texto.
 * @param {string} texto - Texto onde o termo será buscado.
 * @param {string} termo - Termo a ser buscado.
 * @returns {number} - Número de ocorrências do termo no texto.
 * @note Antes é feito o escape dos caracteres especiais, e a busca é feita de forma global.
 *      OU seja, se o termo for "a", ele conta todas as ocorrências de "a" no texto.
 *      Se o termo for "temp", ele conta todas as ocorrências de "temp" no texto,
 *      independente de onde elas estejam. Exemeplo: "temp", "temporal", "temperatura" etc.
*/
function contarOcorrencias(texto, termo) {
  const termoEscapado = termo.replace(/[-\/\\^$.*+?()[\]{}|]/g, "\\$&");
  const regex = new RegExp(termoEscapado, "g");
  return (texto.match(regex) || []).length;
}

/**
 * @description Função que calcula a pontuação de uma página com base nas referências, ocorrências e auto-referências.
 * @param {number} referencias - Número de referências da página.
 * @param {number} ocorrencias - Número de ocorrências do termo na página.
 * @param {number} autoReferencia - Número de auto-referências da página.
 * @returns {number} - Pontuação calculada.
 * @note A pontuação é calculada da seguinte forma:
 * - Se a página não for uma auto-referência, a pontuação é: (referências * 10) + (ocorrências * 5)
 * - Se a página for uma auto-referência, a pontuação é: (referências * 0) + (ocorrências * 5) - (auto-referências * 15)
 *      Ou seja, se a página for uma auto-referência, ela perde 15 pontos e deixa de ganhar os pontos de referências.
 */
function calcularPontuacao(referencias, ocorrencias, autoReferencia) {
  if (autoReferencia == 0) {
    return referencias * 10 + ocorrencias * 5;
  } else {
    return referencias * 0 + ocorrencias * 5 - 15;
  }
}

/**
 * @description Função que processa uma página, contando as ocorrências do termo, referências e auto-referências.
 * @param {string} caminho - Caminho da página.
 * @param {object} info - Informações da página (conteúdo, links, referências).
 * @param {string} termo - Termo a ser buscado.
 * @returns {object} - Objeto com as informações processadas da página.
 * @note A função normaliza o texto da página antes de contar as ocorrências do termo.
 *       Isso garante que a busca seja feita de forma case-insensitive e sem acentuação.
 *       A função calcula a pontuação, chamando a função calcularPontuação.
 * @note A função retorna um objeto com as seguintes propriedades:
 *       - caminho: Caminho da página.
 *       - referencia: Número de referências da página.
 *       - ocorrencias: Número de ocorrências do termo na página.
 *       - autoReferencia: Número de auto-referências da página.
 *       - pontuacao: Pontuação calculada da página.
 */
function processarPagina(caminho, info, termo) {
  const textoBruto = info.conteudoPagina.toLowerCase();
  const textoNormalizado = normalizarTexto(textoBruto); // Normaliza o texto
  const ocorrencias = contarOcorrencias(textoNormalizado, termo); // Conta ocorrências do termo
  const autoReferencia = info.links.filter((link) => link === caminho).length; // Conta auto-referências
  const pontuacao = calcularPontuacao(
    info.referencias,
    ocorrencias,
    autoReferencia
  ); // Calcula pontuação

  return {
    caminho,
    referencia: info.referencias,
    ocorrencias,
    autoReferencia,
    pontuacao,
  };
}

/**
 * @description Função que ordena os resultados da busca com base em critérios de relevância.
 * @param {array} resultados - Array de objetos com os resultados da busca.
 * @returns {array} - Array de objetos ordenados com os resultados da busca.
 * @note A função ordena os resultados da seguinte forma:
 *    - Primeiro, pela pontuação (decrescente)
 *    - Depois, pela quantidade de referências (decrescente)
 *    - Depois, pela quantidade de ocorrências (crescente)
 *    - Depois, pela quantidade de auto-referências (crescente)
 *    - Por último, pelo caminho (alfabético)
 * @note A função retorna um array de objetos ordenados com os resultados da busca.
 */
function ordenarResultados(resultados) {
  return resultados.sort((a, b) => {
    if (b.pontuacao !== a.pontuacao) return b.pontuacao - a.pontuacao;
    if (b.referencia !== a.referencia) return b.referencia - a.referencia;
    if (b.ocorrencias !== a.ocorrencias) return a.ocorrencias - b.ocorrencias;
    if (a.autoReferencia !== b.autoReferencia)
      return a.autoReferencia - b.autoReferencia;
    return a.caminho.localeCompare(b.caminho); // Desempate alfabético
  });
}

/**
 * @description Função que exibe os resultados da busca no console em formato de tabela.
 * @param {string} termo - Termo buscado.
 * @param {array} resultados - Array de objetos com os resultados da busca.
 * @note A função filtra os resultados para mostrar apenas aqueles com ocorrências diferentes de zero.
 *      Em seguida, exibe os resultados em formato de tabela no console.
 *      Se não houver resultados, exibe uma mensagem informando que nenhum resultado foi encontrado.
 */
function exibirResultadosConsole(termo, resultados) {
  console.log(`\nResultados da busca por "${termo}":`);
  const resultadosParaExibicao = resultados
    .filter((r) => r.ocorrencias !== 0) // Mostra apenas se houve ocorrências
    .map((r) => ({
      Página: r.caminho,
      Ocorrências: `${r.ocorrencias} * 5 = ${r.ocorrencias * 5}`,
      "Links recebidos": `${r.referencia} * 10 = ${r.referencia * 10}`,
      "Auto-Referência": r.autoReferencia > 0 ? "-15" : "0",
      Pontos: r.pontuacao,
    }));

  if (resultadosParaExibicao.length > 0) {
    console.table(resultadosParaExibicao);
  } else {
    console.log(`Nenhum resultado encontrado para "${termo}".`);
  }
}

/**
 * @description Função que busca um termo em todas as páginas visitadas.
 * @param {string} termo - Termo a ser buscado.
 * @returns {array} - Array de objetos com os resultados da busca.
 * @note A função normaliza o termo para busca, processa todas as páginas e gera os resultados.
 *      Em seguida, ordena os resultados conforme critérios de relevância e exibe no console em formato de tabela.
 *     Por último, retorna os dados formatados para salvar em JSON, apenas os relevantes.
 */
export function buscarTermo(termo) {
  const termoNormalizado = normalizarTexto(termo.toLowerCase()); // Normaliza o termo para busca

  // Processa todas as páginas e gera os resultados
  let resultados = Object.entries(paginas).map(([caminho, info]) =>
    processarPagina(caminho, info, termoNormalizado)
  );

  // Ordena os resultados conforme critérios de relevância
  resultados = ordenarResultados(resultados);

  // Exibe no console em formato de tabela
  exibirResultadosConsole(termo, resultados);

  // Retorna os dados formatados para salvar em JSON, apenas os relevantes
  return resultados
    .filter((r) => r.ocorrencias !== 0)
    .map((r) => ({
      Página: r.caminho,
      Ocorrências: r.ocorrencias,
      Referências: r.referencia,
      AutoReferência: r.autoReferencia,
      Pontos: r.pontuacao,
    }));
}
