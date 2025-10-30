import { format } from 'date-fns';

export function buildNewQuotationEmail({ supplierName, quotationId, quotationDate, quotationLink }) {
  const date = quotationDate
    ? format(quotationDate, 'dd/MM/yyyy')
    : format(new Date(), 'dd/MM/yyyy');

  return `
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>Nova Cotacao Disponivel</title>
    <style>
      body {
        font-family: 'Segoe UI', Arial, sans-serif;
        background-color: #f7f7f7;
        color: #333;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 30px auto;
        background-color: #ffffff;
        border-radius: 8px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        padding: 20px 30px;
      }
      h2 {
        color: #005baa;
      }
      p {
        font-size: 15px;
        line-height: 1.6;
      }
      .highlight {
        background-color: #eef6ff;
        padding: 10px;
        border-left: 4px solid #005baa;
        border-radius: 4px;
      }
      .button {
        display: inline-block;
        background-color: #0078d7;
        color: #fff;
        text-decoration: none;
        padding: 10px 18px;
        border-radius: 6px;
        font-weight: bold;
        margin-top: 15px;
      }
      .footer {
        font-size: 13px;
        color: #666;
        text-align: center;
        margin-top: 25px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>Nova Cotacao Disponivel</h2>
      <p>Ola, <strong>${supplierName}</strong>,</p>
      <p>
        Informamos que uma nova <strong>cotacao</strong> foi gerada em nosso sistema e esta disponivel para sua analise e preenchimento.
      </p>
      <div class="highlight">
        <p><strong>ID da Cotacao:</strong> ${quotationId}</p>
        <p><strong>Data de Emissao:</strong> ${date}</p>
      </div>
      <p>
        Para visualizar os detalhes e enviar sua proposta, acesse o portal de cotacoes atraves do link abaixo:
      </p>
      <a href="${quotationLink}" class="button">Acessar Cotacao</a>
      <p>
        Caso ja tenha enviado sua proposta, desconsidere este aviso.
      </p>
      <div class="footer">
        <p>Atenciosamente,<br/>
        <strong>Equipe Portal de Cotacoes</strong><br/>
        Secretaria Executiva de Transformacao Digital</p>
      </div>
    </div>
  </body>
</html>
  `;
}

