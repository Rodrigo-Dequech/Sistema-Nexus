import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useApi } from '../services/api.js';
import './Services.css';

const CATEGORY_LABELS = {
  professional: 'Atendimento Profissional / Diarias',
  equipment: 'Equipamentos / Taxas',
  medication: 'Medicamentos / Materiais',
};

export default function Services() {
  const api = useApi();
  const queryClient = useQueryClient();
  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data } = await api.get('/services');
      return data;
    },
  });

  const [selectedService, setSelectedService] = useState(null);
  const [editingType, setEditingType] = useState(null);
  const [error, setError] = useState('');
  const [searchFilters, setSearchFilters] = useState(null);
  const [searchApplied, setSearchApplied] = useState(false);

  const serviceForm = useForm({ defaultValues: { name: '' } });
  const typeForm = useForm({
    defaultValues: { id: '', serviceId: '', name: '', averageValue: '', category: 'professional' },
  });
  const searchForm = useForm({
    defaultValues: { serviceName: '', typeName: '' },
  });

  const serviceOptions = useMemo(
    () => services.map((service) => ({ id: service.id, name: service.name })),
    [services]
  );

  const serviceMutation = useMutation({
    mutationFn: async (payload) => {
      if (selectedService) {
        return api.put(`/services/${selectedService.id}`, payload);
      }
      return api.post('/services', payload);
    },
    onMutate: () => setError(''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      serviceForm.reset({ name: '' });
      setSelectedService(null);
      setError('');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Erro ao salvar servico.');
    },
  });

  const typeMutation = useMutation({
    mutationFn: async ({ serviceId, serviceTypeId, body }) => {
      if (!serviceId) {
        throw new Error('Selecione um servico.');
      }
      if (serviceTypeId) {
        return api.put(`/services/types/${serviceTypeId}`, body);
      }
      return api.post(`/services/${serviceId}/types`, body);
    },
    onMutate: () => setError(''),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      const nextServiceId = variables?.serviceId ?? '';
      typeForm.reset({ id: '', name: '', averageValue: '', serviceId: nextServiceId, category: 'professional' });
      setEditingType(null);
      setError('');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Erro ao salvar tipo de servico.');
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id) => api.delete(`/services/${id}`),
    onMutate: () => setError(''),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      if (selectedService?.id === id) {
        setSelectedService(null);
        serviceForm.reset({ name: '' });
      }
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Erro ao remover servico.');
    },
  });

  const deleteTypeMutation = useMutation({
    mutationFn: (id) => api.delete(`/services/types/${id}`),
    onMutate: () => setError(''),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      if (editingType?.id === id) {
        setEditingType(null);
        const currentServiceId = typeForm.getValues('serviceId');
        typeForm.reset({
          id: '',
          name: '',
          averageValue: '',
          serviceId: currentServiceId || '',
          category: 'professional',
        });
      }
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Erro ao remover tipo.');
    },
  });

  const selectedTypeServiceId = typeForm.watch('serviceId');
  const selectedTypeServiceName =
    serviceOptions.find((option) => option.id === selectedTypeServiceId)?.name || 'nenhum selecionado';

  function submitService(data) {
    serviceMutation.mutate({ name: data.name.trim() });
  }

  function submitType(data) {
    if (!data.serviceId) {
      setError('Selecione um servico para vincular o tipo.');
      return;
    }
    const averageValueNumber = Number(data.averageValue);
    if (Number.isNaN(averageValueNumber)) {
      setError('Informe um valor numerico.');
      return;
    }
    const category = data.category || 'professional';
    typeMutation.mutate({
      serviceId: data.serviceId,
      body: { name: data.name.trim(), averageValue: averageValueNumber, category },
      serviceTypeId: data.id,
    });
  }

  function startEditService(service) {
    setSelectedService(service);
      serviceForm.reset({ name: service.name });
  }

  function cancelServiceEdit() {
    setSelectedService(null);
    serviceForm.reset({ name: '' });
  }

  function startEditType(service, type) {
    setSelectedService(service);
    setEditingType(type);
    typeForm.reset({
      id: type.id,
      name: type.name,
      averageValue: type.averageValue,
      serviceId: service.id,
      category: type.category || 'professional',
    });
  }

  function cancelTypeEdit() {
    setEditingType(null);
    const currentServiceId = typeForm.getValues('serviceId');
    typeForm.reset({
      id: '',
      name: '',
      averageValue: '',
      serviceId: currentServiceId || '',
      category: 'professional',
    });
  }

  function prepareNewType(service) {
    setSelectedService(service);
    setEditingType(null);
                        typeForm.reset({
                          id: '',
                          name: '',
                          averageValue: '',
                          serviceId: service.id,
                          category: 'professional',
                        });
  }

  function handleSearch(values) {
    const normalized = {
      serviceName: values.serviceName.trim(),
      typeName: values.typeName.trim(),
    };
    setSearchFilters(normalized);
    setSearchApplied(true);
  }

  function handleResetSearch() {
    searchForm.reset({ serviceName: '', typeName: '' });
    setSearchFilters({ serviceName: '', typeName: '' });
    setSearchApplied(true);
  }

  const filteredServices = useMemo(() => {
    if (!searchApplied) {
      return [];
    }
    if (!searchFilters) {
      return services;
    }

    const serviceFilter = searchFilters.serviceName?.toLowerCase() ?? '';
    const typeFilter = searchFilters.typeName?.toLowerCase() ?? '';

    return services
      .map((service) => {
        const matchesService = serviceFilter
          ? service.name.toLowerCase().includes(serviceFilter)
          : true;

        const matchingTypes = (service.ServiceTypes ?? []).filter((type) => {
          if (!typeFilter) {
            return true;
          }
          return type.name.toLowerCase().includes(typeFilter);
        });

        const hasMatchingType = matchingTypes.length > 0;

        if (serviceFilter && !matchesService) {
          if (typeFilter && hasMatchingType) {
            return {
              ...service,
              ServiceTypes: matchingTypes,
            };
          }
          return null;
        }

        if (typeFilter && !hasMatchingType) {
          return null;
        }

        return {
          ...service,
          ServiceTypes: typeFilter ? matchingTypes : service.ServiceTypes,
        };
      })
      .filter(Boolean);
  }, [services, searchApplied, searchFilters]);

  return (
    <div className="services-page">
      <div className="form-grid">
        <section className="service-form">
          <h2>{selectedService ? 'Editar servico' : 'Cadastrar servico'}</h2>
          <form onSubmit={serviceForm.handleSubmit(submitService)}>
            <label>
              Nome
              <input {...serviceForm.register('name', { required: 'Informe o nome.' })} />
              {serviceForm.formState.errors.name && (
                <span className="field-error">{serviceForm.formState.errors.name.message}</span>
              )}
            </label>
            {selectedService && (
              <p className="helper-text">Editando: <strong>{selectedService.name}</strong></p>
            )}
            {error && !typeMutation.isPending && !serviceMutation.isPending && (
              <p className="form-error">{error}</p>
            )}
            <div className="actions">
              {selectedService && (
                <button type="button" className="secondary" onClick={cancelServiceEdit}>
                  Cancelar
                </button>
              )}
              <button type="submit" disabled={serviceMutation.isPending}>
                {serviceMutation.isPending ? 'Salvando...' : selectedService ? 'Atualizar' : 'Cadastrar'}
              </button>
            </div>
          </form>
        </section>
        <section className="type-form">
          <h2>{editingType ? 'Editar tipo de servico' : 'Adicionar tipo de servico'}</h2>
          <form onSubmit={typeForm.handleSubmit(submitType)}>
            <input type="hidden" {...typeForm.register('id')} />
            <label>
              Servico
              <select
                {...typeForm.register('serviceId', { required: 'Selecione um servico.' })}
                disabled={Boolean(editingType)}
              >
                <option value="">Selecione um servico</option>
                {serviceOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
              {typeForm.formState.errors.serviceId && (
                <span className="field-error">{typeForm.formState.errors.serviceId.message}</span>
              )}
            </label>
            <p className="helper-text">
              Servico selecionado: <strong>{selectedTypeServiceName}</strong>
            </p>
            <label>
              Nome do tipo
              <input {...typeForm.register('name', { required: 'Informe o nome.' })} />
              {typeForm.formState.errors.name && (
                <span className="field-error">{typeForm.formState.errors.name.message}</span>
              )}
            </label>
            <label>
              Categoria
              <select {...typeForm.register('category', { required: 'Selecione a categoria.' })}>
                <option value="professional">{CATEGORY_LABELS.professional}</option>
                <option value="equipment">{CATEGORY_LABELS.equipment}</option>
                <option value="medication">{CATEGORY_LABELS.medication}</option>
              </select>
              {typeForm.formState.errors.category && (
                <span className="field-error">{typeForm.formState.errors.category.message}</span>
              )}
            </label>
            <label>
              Valor medio
              <input
                type="number"
                step="0.01"
                {...typeForm.register('averageValue', { required: 'Informe o valor.' })}
              />
              {typeForm.formState.errors.averageValue && (
                <span className="field-error">{typeForm.formState.errors.averageValue.message}</span>
              )}
            </label>
            {error && (
              <p className="form-error">{error}</p>
            )}
            <div className="actions">
              {editingType && (
                <button type="button" className="secondary" onClick={cancelTypeEdit}>
                  Cancelar
                </button>
              )}
              <button type="submit" disabled={typeMutation.isPending}>
                {typeMutation.isPending ? 'Salvando...' : editingType ? 'Atualizar' : 'Adicionar'}
              </button>
            </div>
          </form>
        </section>
      </div>

      <section className="list-section">
        <div className="list-header">
          <h2>Servicos cadastrados</h2>
          <form className="search-bar" onSubmit={searchForm.handleSubmit(handleSearch)}>
            <label>
              Servico
              <input
                {...searchForm.register('serviceName')}
                placeholder="Digite o nome do servico"
              />
            </label>
            <label>
              Tipo de servico
              <input
                {...searchForm.register('typeName')}
                placeholder="Digite o nome do tipo de servico"
              />
            </label>
            <div className="search-actions">
              <button type="button" className="secondary" onClick={handleResetSearch}>
                Limpar
              </button>
              <button type="submit">Buscar</button>
            </div>
          </form>
        </div>

        {!searchApplied ? (
          <p className="placeholder">Realize uma busca para listar os servicos.</p>
        ) : isLoading ? (
          <p>Carregando...</p>
        ) : filteredServices.length === 0 ? (
          <p className="placeholder">Nenhum servico encontrado para os filtros informados.</p>
        ) : (
          <table className="results-table">
            <thead>
              <tr>
                <th>Servico</th>
                <th>Tipos de servico</th>
                <th>Valores medios</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map((service) => (
                <tr key={service.id}>
                  <td>
                    <strong>{service.name}</strong>
                    {service.document && (
                      <div className="document">Documento: {service.document}</div>
                    )}
                  </td>
                  <td>
                    {service.ServiceTypes?.length ? (
                      <ul className="type-list">
                        {service.ServiceTypes.map((type) => (
                          <li key={type.id}>
                            <span>{type.name}</span>
                            <span className="type-category">
                              {CATEGORY_LABELS[type.category] || CATEGORY_LABELS.professional}
                            </span>
                            <div className="type-row-actions">
                              <button type="button" className="edit" onClick={() => startEditType(service, type)}>
                                Editar
                              </button>
                              <button
                                type="button"
                                className="danger"
                                onClick={() => deleteTypeMutation.mutate(type.id)}
                              >
                                Excluir
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="placeholder">Sem tipos cadastrados.</span>
                    )}
                  </td>
                  <td>
                    {service.ServiceTypes?.length ? (
                      <ul className="value-list">
                        {service.ServiceTypes.map((type) => (
                          <li key={type.id}>R$ {Number(type.averageValue).toFixed(2)}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="placeholder">--</span>
                    )}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button type="button" className="edit" onClick={() => startEditService(service)}>
                        Editar servico
                      </button>
                      <button type="button" onClick={() => prepareNewType(service)}>
                        Adicionar tipo
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => deleteServiceMutation.mutate(service.id)}
                      >
                        Excluir servico
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
