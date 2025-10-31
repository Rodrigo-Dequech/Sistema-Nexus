import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../services/api.js';
import { formatQuotationNumber } from '../utils/formatting.js';
import './Dashboard.css';

const STATUS_LABELS = {
  em_cotacao: 'Em cotacao',
  em_analise: 'Em analise',
  negada: 'Nao autorizada',
  autorizado: 'Autorizada',
};

const STATUS_COLORS = {
  em_cotacao: 'info',
  em_analise: 'warning',
  negada: 'danger',
  autorizado: 'success',
};

function formatCurrency(value) {
  const number = Number(value) || 0;
  return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function Dashboard() {
  const api = useApi();
  const queryClient = useQueryClient();
  const { token } = useAuth();

  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ['quotations'],
    queryFn: async () => {
      const { data } = await api.get('/quotations');
      return data;
    },
  });

  const [detailId, setDetailId] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [detailError, setDetailError] = useState('');

  const {
    data: quotationDetail,
    isFetching: isDetailLoading,
  } = useQuery({
    queryKey: ['quotation', detailId],
    queryFn: async () => {
      const { data } = await api.get(`/quotations/${detailId}`);
      return data;
    },
    enabled: Boolean(detailId),
  });

  useEffect(() => {
    if (quotationDetail) {
      setSelectedSupplier(quotationDetail.authorizedSupplier?.id ?? '');
      setDetailError('');
    }
  }, [quotationDetail]);

  const authorizeMutation = useMutation({
    mutationFn: ({ id, supplierId }) => api.post(`/quotations/${id}/authorize`, { supplierId }),
    onMutate: () => setDetailError(''),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotation', variables.id] });
      setDetailId(null);
      setSelectedSupplier('');
    },
    onError: (err) => {
      setDetailError(err.response?.data?.message || 'Nao foi possivel autorizar a cotacao.');
    },
  });

  const statusCount = useMemo(
    () =>
      quotations.reduce((acc, quotation) => {
        acc[quotation.status] = (acc[quotation.status] || 0) + 1;
        return acc;
      }, {}),
    [quotations]
  );

  function openDetail(id) {
    setDetailId(id);
  }

  function closeDetail() {
    setDetailId(null);
    setSelectedSupplier('');
    setDetailError('');
  }

  function toggleSupplierSelection(id) {
    if (!quotationDetail || quotationDetail.status === 'autorizado') {
      return;
    }
    setSelectedSupplier((prev) => (prev === id ? '' : id));
  }

  function handleAuthorize() {
    if (!detailId || !selectedSupplier) {
      setDetailError('Selecione um fornecedor para autorizar a cotacao.');
      return;
    }
    authorizeMutation.mutate({ id: detailId, supplierId: selectedSupplier });
  }

  async function handleGeneratePdf() {
    if (!detailId || !authorized) {
      return;
    }
    try {
      const response = await api.get(`/quotations/${detailId}/budget`, {
        responseType: 'blob',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener');
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 60_000);
    } catch (err) {
      setDetailError(err.response?.data?.message || 'Nao foi possivel gerar o PDF.');
    }
  }

  const authorized = quotationDetail?.status === 'autorizado';
  const suppliersWithTotals = useMemo(() => {
    if (!quotationDetail) {
      return [];
    }
    const items = quotationDetail.serviceTypes ?? [];
    const total = items.reduce((sum, item) => sum + Number(item.averageValue || 0), 0);
    return (quotationDetail.suppliers || []).map((supplier) => ({
      ...supplier,
      items,
      total,
    }));
  }, [quotationDetail]);

  return (
    <div className="dashboard">
      <section className="cards">
        {['em_cotacao', 'em_analise', 'negada', 'autorizado'].map((status) => (
          <article key={status} className={`card card-${status}`}>
            <h3>{STATUS_LABELS[status]}</h3>
            <p>{statusCount[status] || 0}</p>
          </article>
        ))}
      </section>

      <section className="quotations-section">
        <div className="section-header">
          <h2>Cotacoes</h2>
        </div>
        {isLoading ? (
          <p>Carregando...</p>
        ) : quotations.length === 0 ? (
          <p className="empty">Nenhuma cotacao cadastrada ate o momento.</p>
        ) : (
          <table className="quotations-table">
            <thead>
              <tr>
                <th>No Cotacao</th>
                <th>Paciente</th>
                <th>Status</th>
                <th>Criada em</th>
                <th>Fornecedores</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {quotations.map((quotation) => (
                <tr key={quotation.id}>
                  <td>{formatQuotationNumber(quotation.number)}</td>
                  <td>
                    <span className="ellipsis" title={quotation.patient?.name || 'Nao informado'}>
                      {quotation.patient?.name || 'Nao informado'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${STATUS_COLORS[quotation.status]}`}>
                      {STATUS_LABELS[quotation.status] || quotation.status}
                    </span>
                  </td>
                  <td>{format(new Date(quotation.createdAt), 'dd/MM/yyyy HH:mm')}</td>
                  <td>{quotation.suppliers.map((supplier) => supplier.name).join(', ')}</td>
                  <td className="actions-cell">
                    <button type="button" onClick={() => openDetail(quotation.id)}>
                      Ver detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {detailId && (
        <div className="detail-overlay">
          <div className="detail-modal">
            <header className="detail-header">
              <div>
                <h3>Cotacao No {quotationDetail?.number}</h3>
                <p>
                  Paciente:{' '}
                  <strong>{quotationDetail?.patient?.name || 'Nao informado'}</strong>
                </p>
                <p>
                  Status:{' '}
                  <span className={`status-badge status-${STATUS_COLORS[quotationDetail?.status || 'em_cotacao']}`}>
                    {STATUS_LABELS[quotationDetail?.status || 'em_cotacao']}
                  </span>
                </p>
              </div>
              <button type="button" className="close" onClick={closeDetail}>
                X
              </button>
            </header>

            {isDetailLoading ? (
              <p>Carregando detalhes...</p>
            ) : (
              <>
                <section className="detail-table-wrapper">
                  <table className="detail-table">
                    <thead>
                      <tr>
                        <th>Fornecedor</th>
                        <th>Itens cotados</th>
                        <th>Valor unitario</th>
                        <th>Total estimado</th>
                        <th>Selecionar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suppliersWithTotals.map((supplier) => (
                        <tr key={supplier.id}>
                          <td>
                            <strong>{supplier.name}</strong>
                            <div className="supplier-contact">
                              {supplier.phone && <span>{supplier.phone}</span>}
                              {supplier.email && <span>{supplier.email}</span>}
                              {supplier.document && <span>{supplier.document}</span>}
                            </div>
                          </td>
                          <td>
                            <ul className="items-list">
                              {(supplier.items || []).map((item) => (
                                <li key={item.id}>
                                  <strong>{item.name}</strong>
                                  {item.service?.name ? <span>{item.service.name}</span> : null}
                                </li>
                              ))}
                            </ul>
                          </td>
                          <td>
                            <ul className="items-list">
                              {(supplier.items || []).map((item) => (
                                <li key={item.id}>{formatCurrency(item.averageValue)}</li>
                              ))}
                            </ul>
                          </td>
                          <td>{formatCurrency(supplier.total)}</td>
                          <td>
                            <label className={`select-option ${authorized ? 'disabled' : ''}`}>
                              <input
                                type="checkbox"
                                checked={selectedSupplier === supplier.id}
                                onChange={() => toggleSupplierSelection(supplier.id)}
                                disabled={authorized}
                              />
                              <span>Selecionar</span>
                            </label>
                          </td>
                        </tr>
                      ))}
                      {suppliersWithTotals.length === 0 && (
                        <tr>
                          <td colSpan={5} className="empty">
                            Nenhum fornecedor vinculado a esta cotacao.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </section>

                {authorized && quotationDetail?.authorizedSupplier && (
                  <div className="authorized-banner">
                    Cotacao autorizada para{' '}
                    <strong>{quotationDetail.authorizedSupplier.name}</strong>.
                  </div>
                )}

                {detailError && <p className="detail-error">{detailError}</p>}

                <footer className="detail-footer">
                  <button type="button" className="secondary" onClick={closeDetail}>
                    Fechar
                  </button>
                  <button
                    type="button"
                    className="pdf"
                    onClick={handleGeneratePdf}
                    disabled={!authorized}
                  >
                    Gerar Orcamento (PDF)
                  </button>
                  <button
                    type="button"
                    className="authorize"
                    onClick={handleAuthorize}
                    disabled={authorized || !selectedSupplier || authorizeMutation.isPending}
                  >
                    {authorizeMutation.isPending ? 'Autorizando...' : 'Autorizar'}
                  </button>
                </footer>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
