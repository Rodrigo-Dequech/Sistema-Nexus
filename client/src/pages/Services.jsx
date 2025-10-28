import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useApi } from '../services/api.js';
import './Services.css';

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
  const [error, setError] = useState('');

  const serviceForm = useForm({ defaultValues: { name: '' } });
  const typeForm = useForm({ defaultValues: { id: '', name: '', averageValue: '' } });

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
      setError(err.response?.data?.message || 'Erro ao salvar serviço.');
    },
  });

  const typeMutation = useMutation({
    mutationFn: async (payload) => {
      if (!payload.serviceId) throw new Error('Selecione um serviço.');
      if (payload.serviceTypeId) {
        return api.put(`/services/types/${payload.serviceTypeId}`, payload.body);
      }
      return api.post(`/services/${payload.serviceId}/types`, payload.body);
    },
    onMutate: () => setError(''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      typeForm.reset({ id: '', name: '', averageValue: '' });
      setEditingType(null);
      setError('');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Erro ao salvar tipo de serviço.');
    },
  });

  function submitService(data) {
    serviceMutation.mutate(data);
  }

  function submitType(data) {
    if (!selectedService) {
      setError('Selecione um serviço na lista para adicionar tipos.');
      return;
    }
    typeMutation.mutate({
      serviceId: selectedService.id,
      body: { name: data.name, averageValue: data.averageValue },
      serviceTypeId: data.id,
    });
  }

  const [editingType, setEditingType] = useState(null);

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
    typeForm.reset({ id: type.id, name: type.name, averageValue: type.averageValue });
  }

  function cancelTypeEdit() {
    setEditingType(null);
    typeForm.reset({ id: '', name: '', averageValue: '' });
  }

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
      setError(err.response?.data?.message || 'Erro ao remover serviço.');
    },
  });

  const deleteTypeMutation = useMutation({
    mutationFn: (id) => api.delete(`/services/types/${id}`),
    onMutate: () => setError(''),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      if (editingType?.id === id) {
        setEditingType(null);
        typeForm.reset({ id: '', name: '', averageValue: '' });
      }
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Erro ao remover tipo.');
    },
  });

  return (
    <div className="services-page">
      <section className="service-form">
        <h2>{selectedService ? 'Editar serviço' : 'Cadastrar serviço'}</h2>
        <form onSubmit={serviceForm.handleSubmit(submitService)}>
          <label>
            Nome
            <input {...serviceForm.register('name', { required: 'Informe o nome.' })} />
            {serviceForm.formState.errors.name && (
              <span className="field-error">{serviceForm.formState.errors.name.message}</span>
            )}
          </label>
          {error && <p className="form-error">{error}</p>}
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
      <section className="service-list">
        <h2>Serviços e tipos cadastrados</h2>
        {isLoading ? (
          <p>Carregando...</p>
        ) : (
          <div className="service-items">
            {services.map((service) => (
              <article key={service.id} className="service-item">
                <header>
                  <div>
                    <h3>{service.name}</h3>
                    <p>{service.ServiceTypes?.length || 0} tipos cadastrados</p>
                  </div>
                  <div className="item-actions">
                    <button type="button" onClick={() => startEditService(service)}>
                      Editar serviço
                    </button>
                    <button type="button" onClick={() => {
                      setSelectedService(service);
                      setEditingType(null);
                      typeForm.reset({ id: '', name: '', averageValue: '' });
                    }}>
                      Adicionar tipo
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => deleteServiceMutation.mutate(service.id)}
                    >
                      Excluir
                    </button>
                  </div>
                </header>
                <ul>
                  {service.ServiceTypes?.map((type) => (
                    <li key={type.id}>
                      <div>
                        <strong>{type.name}</strong>
                        <span>Valor médio: R$ {Number(type.averageValue).toFixed(2)}</span>
                      </div>
                      <div className="item-actions">
                        <button type="button" onClick={() => startEditType(service, type)}>
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
                  {service.ServiceTypes?.length === 0 && <li>Sem tipos cadastrados.</li>}
                </ul>
              </article>
            ))}
          </div>
        )}
      </section>
      <section className="type-form">
        <h2>{editingType ? 'Editar tipo de serviço' : 'Adicionar tipo de serviço'}</h2>
        <p className="helper-text">
          Serviço selecionado:{' '}
          <strong>{selectedService ? selectedService.name : 'nenhum selecionado'}</strong>
        </p>
        <form onSubmit={typeForm.handleSubmit(submitType)}>
          <input type="hidden" {...typeForm.register('id')} />
          <label>
            Nome do tipo
            <input {...typeForm.register('name', { required: 'Informe o nome.' })} />
            {typeForm.formState.errors.name && (
              <span className="field-error">{typeForm.formState.errors.name.message}</span>
            )}
          </label>
          <label>
            Valor médio
            <input
              type="number"
              step="0.01"
              {...typeForm.register('averageValue', { required: 'Informe o valor.' })}
            />
            {typeForm.formState.errors.averageValue && (
              <span className="field-error">{typeForm.formState.errors.averageValue.message}</span>
            )}
          </label>
          {error && <p className="form-error">{error}</p>}
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
  );
}
