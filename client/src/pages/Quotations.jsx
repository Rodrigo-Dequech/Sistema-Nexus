import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useMemo, useState } from 'react';
import { useApi } from '../services/api.js';
import './Quotations.css';

const STATUS_LABELS = {
  em_cotacao: 'Em cotacao',
  em_analise: 'Em analise',
  negada: 'Negada',
  autorizado: 'Autorizado',
};

export default function Quotations() {
  const api = useApi();
  const queryClient = useQueryClient();

  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ['quotations'],
    queryFn: async () => {
      const { data } = await api.get('/quotations');
      return data;
    },
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data } = await api.get('/suppliers');
      return data;
    },
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data } = await api.get('/services');
      return data;
    },
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const { data } = await api.get('/patients');
      return data;
    },
  });

  const [showModal, setShowModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [selectedServiceTypes, setSelectedServiceTypes] = useState([]);
  const [error, setError] = useState('');

  const createQuotationMutation = useMutation({
    mutationFn: (payload) => api.post('/quotations', payload),
    onMutate: () => setError(''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      setShowModal(false);
      setSelectedPatient('');
      setSelectedSuppliers([]);
      setSelectedServiceTypes([]);
      setError('');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Erro ao criar cotacao.');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => api.put(`/quotations/${id}/status`, { status }),
    onMutate: () => setError(''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Nao foi possivel atualizar o status.');
    },
  });

  const availableSuppliers = useMemo(
    () => suppliers.filter((supplier) => !selectedSuppliers.includes(supplier.id)),
    [suppliers, selectedSuppliers]
  );

  function toggleSupplier(id) {
    setSelectedSuppliers((prev) =>
      prev.includes(id) ? prev.filter((supplierId) => supplierId !== id) : [...prev, id]
    );
  }

  function toggleServiceType(id) {
    setSelectedServiceTypes((prev) =>
      prev.includes(id) ? prev.filter((serviceTypeId) => serviceTypeId !== id) : [...prev, id]
    );
  }

  function handleCreateQuotation() {
    if (!selectedPatient) {
      setError('Selecione um paciente.');
      return;
    }
    if (selectedSuppliers.length === 0 || selectedServiceTypes.length === 0) {
      setError('Selecione ao menos um fornecedor e um tipo de servico.');
      return;
    }
    createQuotationMutation.mutate({
      patientId: selectedPatient,
      supplierIds: selectedSuppliers,
      serviceTypeIds: selectedServiceTypes,
    });
  }

  function closeModal() {
    setShowModal(false);
    setSelectedPatient('');
    setSelectedSuppliers([]);
    setSelectedServiceTypes([]);
    setError('');
  }

  return (
    <div className="quotations-page">
      <header className="header">
        <h2>Cotacoes</h2>
        <button type="button" onClick={() => setShowModal(true)}>
          Nova cotacao
        </button>
      </header>
      {error && !showModal && <p className="form-error">{error}</p>}
      {isLoading ? (
        <p>Carregando...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Numero</th>
              <th>Paciente</th>
              <th>Status</th>
              <th>Criada em</th>
              <th>Fornecedores</th>
              <th>Servicos</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {quotations.map((quotation) => (
              <tr key={quotation.id}>
                <td>{quotation.number}</td>
                <td>{quotation.patient?.name || 'Nao informado'}</td>
                <td>{STATUS_LABELS[quotation.status]}</td>
                <td>{format(new Date(quotation.createdAt), 'dd/MM/yyyy HH:mm')}</td>
                <td>{quotation.suppliers.map((supplier) => supplier.name).join(', ')}</td>
                <td>{quotation.serviceTypes.map((type) => type.name).join(', ')}</td>
                <td>
                  <select
                    value={quotation.status}
                    disabled={quotation.status === 'autorizado'}
                    onChange={(event) =>
                      updateStatusMutation.mutate({ id: quotation.id, status: event.target.value })
                    }
                  >
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value} disabled={value === 'autorizado'}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {quotations.length === 0 && (
              <tr>
                <td colSpan={7} className="empty">
                  Nenhuma cotacao registrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <header>
              <h3>Selecionar fornecedores e servicos</h3>
              <button type="button" onClick={closeModal} className="close">
                ×
              </button>
            </header>
            <div className="modal-content">
              <div className="modal-column">
                <h4>Paciente</h4>
                <select
                  value={selectedPatient}
                  onChange={(event) => setSelectedPatient(event.target.value)}
                >
                  <option value="">Selecione um paciente</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name} {patient.cpf ? `- ${patient.cpf}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-column">
                <h4>Fornecedores</h4>
                <ul>
                  {availableSuppliers.map((supplier) => (
                    <li key={supplier.id}>
                      <button type="button" onClick={() => toggleSupplier(supplier.id)}>
                        {supplier.name}
                      </button>
                    </li>
                  ))}
                  {availableSuppliers.length === 0 && <li>Todos os fornecedores selecionados.</li>}
                </ul>
                <div className="selected">
                  <strong>Selecionados:</strong>
                  <ul>
                    {selectedSuppliers.map((id) => {
                      const supplier = suppliers.find((item) => item.id === id);
                      return (
                        <li key={id}>
                          {supplier?.name}
                          <button type="button" onClick={() => toggleSupplier(id)}>
                            Remover
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
              <div className="modal-column">
                <h4>Tipos de servico</h4>
                <ul>
                  {services.flatMap((service) =>
                    (service.ServiceTypes || []).map((type) => (
                      <li key={type.id}>
                        <button type="button" onClick={() => toggleServiceType(type.id)}>
                          {service.name} - {type.name}
                        </button>
                      </li>
                    ))
                  )}
                  {services.every((service) => !service.ServiceTypes || service.ServiceTypes.length === 0) && (
                    <li>Nenhum tipo de servico cadastrado.</li>
                  )}
                </ul>
                <div className="selected">
                  <strong>Selecionados:</strong>
                  <ul>
                    {selectedServiceTypes.map((id) => {
                      const service = services.find((svc) =>
                        svc.ServiceTypes?.some((type) => type.id === id)
                      );
                      const type = service?.ServiceTypes?.find((item) => item.id === id);
                      return (
                        <li key={id}>
                          {service?.name} - {type?.name}
                          <button type="button" onClick={() => toggleServiceType(id)}>
                            Remover
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
            {error && <p className="form-error">{error}</p>}
            <footer>
              <button type="button" className="secondary" onClick={closeModal}>
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateQuotation}
                disabled={createQuotationMutation.isPending}
              >
                {createQuotationMutation.isPending ? 'Criando...' : 'Criar cotacao'}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
