import axios from "axios";
import * as cheerio from "cheerio";

// Armazena as páginas visitadas --> { "conteudoPagina": html, "links": [linksEncontrados], "referencias": 0 }
export const paginas = {};
// Armazena os sites visitados para evitar loops infinitos, o Set é mais eficiente que um array para isso. Ele não permite duplicatas.
export const sitesVisitados = new Set();

/**
 * @description Função que faz o crawling (rastreador) de uma página web, visitando todos os links internos.
 * @param {string} urlAtual - URL da página atual a ser visitada.
 * @param {string} urlBase - URL base do site para construir URLs absolutas.
 * @note A função é assíncrona e utiliza axios para fazer requisições HTTP e cheerio para manipular o HTML,
 *       onde a função armazena o conteúdo da página, os links encontrados e o número de referências em um objeto.
 *        A função utiliza recursão para visitar todos os links internos encontrados na página.
 */
export async function crawler(urlAtual, urlBase) {
  if (sitesVisitados.has(urlAtual)) return;             // Se a URL já foi visitada, não faz nada
  sitesVisitados.add(urlAtual);                         // Adiciona a URL ao conjunto de sites visitados

  console.log(`Visitando: ${urlAtual}`);

  const respostaHTTP = await axios.get(urlAtual);       // Faz a requisição HTTP para obter o HTML da página
  let html = respostaHTTP.data;                         // Obtém o HTML da página

  const $ = cheerio.load(html);                         // Carrega o HTML no cheerio para manipulação
  const linksEncontrados = [];                          // Array para armazenar os links encontrados na página

  $("a").each((i, link) => {                            // Para cada link encontrado na página
    const href = $(link).attr("href");                  // Obtém o atributo href do link

    if (href && href.endsWith(".html")) {                           // Se o link é válido e termina com .html
      const urlAbsolutaDoLink = new URL(href, urlBase).toString();  // Converte o link para uma URL absoluta

      if (urlAbsolutaDoLink.startsWith(urlBase)) {      // Verifica se o link é interno                 
        linksEncontrados.push(urlAbsolutaDoLink);       // Adiciona o link ao array de links encontrados
      }
    }
  });

  paginas[urlAtual] = {                                 // Armazena as informações da página visitada 
    conteudoPagina: html,                               // HTML da página
    links: linksEncontrados,                            // Links encontrados na página
    referencias: 0,                                     // Contador de referências (inicializado em 0)
  };

  for (const proxUrlAbsoluta of linksEncontrados) {     // Para cada link encontrado na url atual
    await crawler(proxUrlAbsoluta, urlBase);            // Chama a função crawler recursivamente para visitar o próximo link
  }
}