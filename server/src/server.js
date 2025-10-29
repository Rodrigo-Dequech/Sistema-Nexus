import app, { initDatabase } from './app.js';

const port = process.env.PORT || 5000;

async function start() {
  try {
    console.log("Iniciando servidor HomeCare...");
    await initDatabase();
    console.log("Banco conectado com sucesso.");
    app.listen(port, () => {
      console.log(`Servidor iniciado na porta ${port}`);
    });
  } catch (error) {
    console.error("Erro ao iniciar servidor:", error);
    process.exit(1);
  }
}

start();
