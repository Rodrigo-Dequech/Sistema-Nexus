import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useApi } from '../services/api.js';
import './Suppliers.css';

export default function Suppliers() {
  const api = useApi();
  const queryClient = useQueryClient();
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data } = await api.get('/suppliers');
      return data;
    },
  });

  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      document: '',
      address: '',
      phone: '',
      email: '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (payload) => {
      if (editing) {
        return api.put(`/suppliers/${editing.id}`, payload);
      }
      return api.post('/suppliers', payload);
    },
    onMutate: () => setError(''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      reset();
      setEditing(null);
      setError('');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Erro ao salvar fornecedor.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/suppliers/${id}`),
    onMutate: () => setError(''),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      if (editing?.id === id) {
        setEditing(null);
        reset({ name: '', document: '', address: '', phone: '', email: '' });
      }
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Não foi possível remover o fornecedor.');
    },
  });

  const sortedSuppliers = useMemo(
    () => suppliers.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [suppliers]
  );

  function startEdit(supplier) {
    setEditing(supplier);
    reset(supplier);
  }

  function cancelEdit() {
    setEditing(null);
    reset({ name: '', document: '', address: '', phone: '', email: '' });
  }

  return (
    <div className="suppliers">
      <section className="form-section">
        <h2>{editing ? 'Editar fornecedor' : 'Cadastrar fornecedor'}</h2>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
          <div className="fields">
            <label>
              Nome / Razão social
              <input {...register('name', { required: 'Informe o nome.' })} />
              {errors.name && <span className="field-error">{errors.name.message}</span>}
            </label>
            <label>
              CPF / CNPJ
              <input {...register('document', { required: 'Informe o documento.' })} />
              {errors.document && <span className="field-error">{errors.document.message}</span>}
            </label>
            <label>
              Endereço
              <input {...register('address', { required: 'Informe o endereço.' })} />
              {errors.address && <span className="field-error">{errors.address.message}</span>}
            </label>
            <label>
              Telefone
              <input {...register('phone', { required: 'Informe o telefone.' })} />
              {errors.phone && <span className="field-error">{errors.phone.message}</span>}
            </label>
            <label>
              E-mail
              <input type="email" {...register('email', { required: 'Informe o e-mail.' })} />
              {errors.email && <span className="field-error">{errors.email.message}</span>}
            </label>
          </div>
          {error && <p className="form-error">{error}</p>}
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
      <section className="list-section">
        <h2>Fornecedores cadastrados</h2>
        {isLoading ? (
          <p>Carregando...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Documento</th>
                <th>Contato</th>
                <th>E-mail</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sortedSuppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td>{supplier.name}</td>
                  <td>{supplier.document}</td>
                  <td>{supplier.phone}</td>
                  <td>{supplier.email}</td>
                  <td className="actions-cell">
                    <button type="button" onClick={() => startEdit(supplier)}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => deleteMutation.mutate(supplier.id)}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
              {sortedSuppliers.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty">
                    Nenhum fornecedor cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
