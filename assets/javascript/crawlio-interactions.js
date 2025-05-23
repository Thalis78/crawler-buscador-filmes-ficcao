// Função para exibir os resultados de forma formatada no HTML
function exibirResultadosHTML(resultados) {
  const resultadoBuscaDiv = document.getElementById("resultado-busca");
  resultadoBuscaDiv.innerHTML = "";

  // Verifica se resultados é composto apenas pela frase "Nenhum resultado encontrado para 'termo'."
  if (
    resultados.length === 1 &&
    typeof resultados[0] === "string" &&
    resultados[0].startsWith("Nenhum resultado encontrado para")
  ) {
    let mensagem = resultados[0];
    resultadoBuscaDiv.innerHTML = `<p style="color: red; font-weight: bold; text-align: center;">${mensagem}</p>`;
    return;
  }

  // Filtra os resultados com mais de uma ocorrência e monta um array de objetos literais com os dados de cada resultado
  const resultadosParaExibicao = resultados
    .filter((r) => r.Ocorrências !== 0)
    .map((r) => ({
      pagina: r.Página,
      ocorrencias: `${r.Ocorrências} * 5 = ${r.Ocorrências * 5}`,
      linksRecebidos: `${r.Referências} * 10 = ${r.Referências * 10}`,
      autoReferencia: r.AutoReferência > 0 ? "-15" : "0", 
      pontos: r.Pontos,
    }));

  // Verifica se existem resultados no array e monta a tabela de resultados no HTML
  if (resultadosParaExibicao.length > 0) {
    // Monta o cabeçalho da tabela
    let tabelaHTML = `
            <table>
                <thead>
                <tr>
                    <th>Página</th>
                    <th>Ocorrências</th>
                    <th>Links Recebidos</th>
                    <th>Auto-referência</th>
                    <th>Pontos</th>
                </tr>
                </thead>
                <tbody>
        `;

    // Percorre cada resultado do array e monta cada linha da tabela com os dados de cada resultado
    resultadosParaExibicao.forEach((item) => {
      tabelaHTML += `
                <tr>
                <td>${item.pagina}</td>
                <td>${item.ocorrencias}</td>
                <td>${item.linksRecebidos}</td>
                <td>${item.autoReferencia}</td>
                <td><span class="item-ponto">${item.pontos}</span></td>
                </tr>
            `;
    });

    // Finaliza o corpo da tabela
    tabelaHTML += `
                </tbody>
            </table>
        `;

    // Exibe a tabela no HTML
    resultadoBuscaDiv.innerHTML = tabelaHTML;
  } else {
    resultadoBuscaDiv.innerHTML = `<p style="color: #555; font-weight: bold; text-align: center;">Nenhuma página encontrada com este termo.</p>`;
  }
}

document
  .getElementById("search-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const termo = document.getElementById("input-buscador").value.trim();
    const resultadoBuscaDiv = document.getElementById("resultado-busca");

    if (!termo) {
      resultadoBuscaDiv.innerHTML = `<p style="color: red; font-weight: bold; text-align: center;">Por favor, digite um termo para buscar.</p>`;
      return;
    }

    resultadoBuscaDiv.innerHTML = `<p style="color: #333; font-weight: bold; text-align: center;">Buscando...</p>`;

    try {
      const response = await fetch(
        `/buscar?inputBuscador=${encodeURIComponent(termo)}`
      );
      const data = await response.json();

      exibirResultadosHTML(data.resultados);
    } catch (error) {
      console.error("Erro ao buscar:", error);
      resultadoBuscaDiv.innerHTML = `<p style="color: red; font-weight: bold; text-align: center;">Ocorreu um erro ao buscar: ${error.message}</p>`;
    }
  });

document
  .getElementById("save-json")
  .addEventListener("click", async function () {
    const resultadoBuscaDiv = document.getElementById("resultado-busca");
    resultadoBuscaDiv.innerHTML = `<p style="color: #333; font-weight: bold; text-align: center;">Salvando dados...</p>`;

    try {
      const response = await fetch("/salvar-json", { method: "POST" });
      const data = await response.json();

      if (data.success) {
        console.log("Dados salvos com sucesso!");
        resultadoBuscaDiv.innerHTML = `<p style="color: green; font-weight: bold; text-align: center;">Dados salvos com sucesso!</p>`;
      } else {
        console.log("Falha ao salvar os dados.");
        resultadoBuscaDiv.innerHTML = `<p style="color: red; font-weight: bold; text-align: center;">Falha ao salvar os dados: ${
          data.message || "Erro não especificado."
        }</p>`;
      }
    } catch (error) {
      console.error("Erro ao salvar os dados:", error);
      resultadoBuscaDiv.innerHTML = `<p style="color: red; font-weight: bold; text-align: center;">Erro ao salvar os dados: ${error.message}</p>`;
    }
  });
