import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useApi } from '../services/api.js';
import './Dashboard.css';

export default function Dashboard() {
  const api = useApi();
  const { data: quotations = [] } = useQuery({
    queryKey: ['quotations'],
    queryFn: async () => {
      const { data } = await api.get('/quotations');
      return data;
    },
  });

  const statusCount = quotations.reduce((acc, quotation) => {
    acc[quotation.status] = (acc[quotation.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="dashboard">
      <section className="cards">
        {['em_cotacao', 'em_analise', 'negada', 'autorizado'].map((status) => (
          <article key={status} className={`card card-${status}`}>
            <h3>{status.replace('_', ' ')}</h3>
            <p>{statusCount[status] || 0}</p>
          </article>
        ))}
      </section>
      <section className="recent">
        <h2>Cotações recentes</h2>
        <table>
          <thead>
            <tr>
              <th>Número</th>
              <th>Status</th>
              <th>Data</th>
              <th>Fornecedores</th>
            </tr>
          </thead>
          <tbody>
            {quotations.slice(0, 5).map((quotation) => (
              <tr key={quotation.id}>
                <td>{quotation.number}</td>
                <td>{quotation.status.replace('_', ' ')}</td>
                <td>{format(new Date(quotation.createdAt), 'dd/MM/yyyy')}</td>
                <td>{quotation.suppliers.map((supplier) => supplier.name).join(', ')}</td>
              </tr>
            ))}
            {quotations.length === 0 && (
              <tr>
                <td colSpan={4} className="empty">
                  Nenhuma cotação cadastrada até o momento.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
