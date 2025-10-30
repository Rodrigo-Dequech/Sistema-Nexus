import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useApi } from '../services/api.js';
import './Patients.css';

function stripDigits(value = '') {
  return value.replace(/\D/g, '');
}

function formatCpf(value = '') {
  const digits = stripDigits(value).slice(0, 11);
  if (!digits) return '';
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export default function Patients() {
  const api = useApi();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(null);
  const [searchFilters, setSearchFilters] = useState(null);
  const [searchApplied, setSearchApplied] = useState(false);
  const [formError, setFormError] = useState('');
  const [searchError, setSearchError] = useState('');

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      cpf: '',
      insurance: '',
      cardNumber: '',
      address: '',
    },
  });

  const searchForm = useForm({
    defaultValues: {
      name: '',
      cpf: '',
      cardNumber: '',
    },
  });

  const {
    data: patients = [],
    isFetching: isSearching,
    refetch,
  } = useQuery({
    queryKey: ['patients', searchFilters],
    enabled: false,
    queryFn: async () => {
      const params = {};
      if (searchFilters?.name) params.name = searchFilters.name;
      if (searchFilters?.cpf) params.cpf = searchFilters.cpf;
      if (searchFilters?.cardNumber) params.cardNumber = searchFilters.cardNumber;
      const { data } = await api.get('/patients', { params });
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (payload) => {
      if (editing) {
        return api.put(`/patients/${editing.id}`, payload);
      }
      return api.post('/patients', payload);
    },
    onMutate: () => setFormError(''),
    onSuccess: () => {
      reset();
      setEditing(null);
      setFormError('');
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      if (searchApplied) {
        refetch();
      }
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Erro ao salvar paciente.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/patients/${id}`),
    onMutate: () => setFormError(''),
    onSuccess: () => {
      if (editing?.id) {
        setEditing(null);
        reset({ name: '', cpf: '', insurance: '', cardNumber: '', address: '' });
      }
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      if (searchApplied) {
        refetch();
      }
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Nao foi possivel remover o paciente.');
    },
  });

  const sortedPatients = useMemo(
    () =>
      (patients || []).slice().sort((a, b) => a.name.localeCompare(b.name)),
    [patients]
  );

  function startEdit(patient) {
    setEditing(patient);
    reset({
      ...patient,
      cpf: formatCpf(patient.cpf),
    });
  }

  function cancelEdit() {
    setEditing(null);
    reset({ name: '', cpf: '', insurance: '', cardNumber: '', address: '' });
    setFormError('');
  }

  function confirmDelete(id) {
    const shouldDelete = window.confirm('Deseja realmente excluir este paciente?');
    if (shouldDelete) {
      deleteMutation.mutate(id);
    }
  }

  async function onSubmit(data) {
    mutation.mutate({
      ...data,
      cpf: stripDigits(data.cpf),
      insurance: data.insurance.trim(),
      cardNumber: data.cardNumber.trim(),
      address: data.address.trim(),
    });
  }

  async function handleSearch(values) {
    setSearchError('');
    const filters = {
      name: values.name.trim(),
      cpf: stripDigits(values.cpf),
      cardNumber: values.cardNumber.trim(),
    };
    setSearchFilters(filters);
    setSearchApplied(true);
    try {
      await refetch({ throwOnError: true });
    } catch (error) {
      setSearchError(error.response?.data?.message || 'Erro ao buscar pacientes.');
    }
  }

  function handleResetSearch() {
    searchForm.reset({ name: '', cpf: '', cardNumber: '' });
    setSearchFilters({ name: '', cpf: '', cardNumber: '' });
    setSearchApplied(true);
    refetch();
  }

  return (
    <div className="patients-page">
      <section className="form-section">
        <h2>{editing ? 'Editar paciente' : 'Cadastrar paciente'}</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="fields-grid">
            <label>
              Nome
              <input {...register('name', { required: 'Informe o nome.' })} />
              {errors.name && <span className="field-error">{errors.name.message}</span>}
            </label>
            <label>
              CPF
              <Controller
                name="cpf"
                control={control}
                rules={{
                  required: 'Informe o CPF.',
                  validate: (value) => {
                    const digits = stripDigits(value);
                    return digits.length === 11 || 'CPF invalido.';
                  },
                }}
                render={({ field }) => {
                  const { value, onChange, ...rest } = field;
                  return (
                    <input
                      {...rest}
                      value={value ?? ''}
                      inputMode="numeric"
                      onChange={(event) => onChange(formatCpf(event.target.value))}
                    />
                  );
                }}
              />
              {errors.cpf && <span className="field-error">{errors.cpf.message}</span>}
            </label>
            <label>
              Convenio
              <input {...register('insurance')} />
            </label>
            <label>
              Numero da carteirinha
              <input {...register('cardNumber')} />
            </label>
            <label className="full-width">
              Endereco
              <input {...register('address')} />
            </label>
          </div>
          {formError && <p className="form-error">{formError}</p>}
          <div className="actions">
            {editing && (
              <button type="button" className="secondary" onClick={cancelEdit}>
                Cancelar
              </button>
            )}
            <button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando...' : editing ? 'Atualizar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </section>

      <section className="search-section">
        <div className="search-header">
          <h2>Buscar pacientes</h2>
          <form className="search-bar" onSubmit={searchForm.handleSubmit(handleSearch)}>
            <label>
              Nome
              <input {...searchForm.register('name')} placeholder="Digite o nome" />
            </label>
            <label>
              CPF
              <input
                {...searchForm.register('cpf')}
                placeholder="Digite o CPF"
                inputMode="numeric"
              />
            </label>
            <label>
              Carteirinha
              <input {...searchForm.register('cardNumber')} placeholder="Numero da carteirinha" />
            </label>
            <div className="search-actions">
              <button type="button" className="secondary" onClick={handleResetSearch}>
                Limpar
              </button>
              <button type="submit">Buscar</button>
            </div>
          </form>
        </div>
        {searchError && <p className="form-error">{searchError}</p>}
        {!searchApplied ? (
          <p className="placeholder">Realize uma busca para listar os pacientes.</p>
        ) : isSearching ? (
          <p>Carregando...</p>
        ) : sortedPatients.length === 0 ? (
          <p className="placeholder">Nenhum paciente encontrado.</p>
        ) : (
          <table className="results-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF</th>
                <th>Convenio</th>
                <th>Carteirinha</th>
                <th>Endereco</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sortedPatients.map((patient) => (
                <tr key={patient.id}>
                  <td>{patient.name}</td>
                  <td>{formatCpf(patient.cpf)}</td>
                  <td>{patient.insurance || '—'}</td>
                  <td>{patient.cardNumber || '—'}</td>
                  <td>{patient.address || '—'}</td>
                  <td className="actions-cell">
                    <button type="button" onClick={() => startEdit(patient)}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => confirmDelete(patient.id)}
                    >
                      Excluir
                    </button>
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
