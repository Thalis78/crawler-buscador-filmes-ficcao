import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { crawler, sitesVisitados, paginas } from "./crawler.js";
import { contarReferencias, buscarTermo } from "./search.js";
import { saveJson } from "./saveJson.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use("/pages", express.static(path.join(__dirname, "pages"))); // Servindo arquivos HTML
app.use(express.json());

console.log("\nContando referências...");
let referencias = contarReferencias();

let buscasRealizadas = {};

async function iniciarCrawling() {
  const baseUrl = `http://localhost:${PORT}/pages/`;
  const paginaInicialRelativa = "blade_runner.html";
  const urlInicialCompleta = baseUrl + paginaInicialRelativa;

  console.log("Iniciando o crawling...");
  // A função crawler agora é async, então usamos await
  await crawler(urlInicialCompleta, baseUrl);
  console.log("\nCrawling concluído. Páginas visitadas:", sitesVisitados.size);
  console.log("\nContando referências...");
  contarReferencias(); 
  console.log("\nReferências contadas.");
}

app.get("/buscar", (req, res) => {
  const termo = req.query.inputBuscador?.trim().toLowerCase();

  if (!termo) {
    return res.json({ termo, resultados: [] });
  }

  const resultadosDaBusca = buscarTermo(termo);

  buscasRealizadas[termo] =
    resultadosDaBusca.length > 0
      ? resultadosDaBusca
      : [`Nenhum resultado encontrado para "${termo}".`];

  console.log(`Busca realizada: ${termo}`);

  res.json({
    termo,
    resultados: buscasRealizadas[termo],
  });
});

app.post("/salvar-json", (req, res) => {
  console.log("Recebida requisição para salvar JSON.");
  try {
    const dados = {
      paginasVisitadas: Array.from(sitesVisitados),
      referencias,
      buscas: buscasRealizadas,
    };
    saveJson(dados);
    res.json({ success: true });
  } catch (err) {
    console.error("Erro ao salvar os dados:", err);
    res.json({ success: false });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Inicia o servidor e DEPOIS o crawling
app.listen(PORT, async () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  await iniciarCrawling(); // Chama o crawling após o servidor estar pronto
});