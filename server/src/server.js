import app, { initDatabase } from './app.js';

const port = process.env.PORT || 4000;

async function start() {
  try {
    await initDatabase();
    app.listen(port, () => {
      console.log(`Servidor iniciado na porta ${port}`);
    });
  } catch (error) {
    console.error('Erro ao iniciar servidor', error);
    process.exit(1);
  }
}

start();
