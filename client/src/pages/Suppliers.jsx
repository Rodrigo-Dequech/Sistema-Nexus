import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useApi } from '../services/api.js';
import './Suppliers.css';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function stripDigits(value = '') {
  return value.replace(/\D/g, '');
}

function formatCpfCnpj(raw = '') {
  const digits = stripDigits(raw).slice(0, 14);
  if (!digits) {
    return '';
  }

  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\/\d{4})(\d)/, '$1-$2');
}

function formatPhone(raw = '') {
  const digits = stripDigits(raw).slice(0, 11);
  if (!digits) {
    return '';
  }

  if (digits.length <= 2) {
    return `(${digits}${digits.length === 2 ? ')' : ''}`;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

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
    control,
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
      setError(err.response?.data?.message || 'Nao foi possivel remover o fornecedor.');
    },
  });

  const sortedSuppliers = useMemo(
    () =>
      suppliers
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((supplier) => ({
          ...supplier,
          documentFormatted: formatCpfCnpj(supplier.document),
          phoneFormatted: formatPhone(supplier.phone),
        })),
    [suppliers]
  );

  function startEdit(supplier) {
    setEditing(supplier);
    reset({
      ...supplier,
      document: formatCpfCnpj(supplier.document),
      phone: formatPhone(supplier.phone),
    });
  }

  function cancelEdit() {
    setEditing(null);
    reset({ name: '', document: '', address: '', phone: '', email: '' });
  }

  function confirmDelete(id) {
    const shouldDelete = window.confirm('Deseja realmente excluir este fornecedor?');
    if (shouldDelete) {
      deleteMutation.mutate(id);
    }
  }

  return (
    <div className="suppliers">
      <section className="form-section">
        <h2>{editing ? 'Editar fornecedor' : 'Cadastrar fornecedor'}</h2>
        <form
          onSubmit={handleSubmit((data) =>
            mutation.mutate({
              ...data,
              document: stripDigits(data.document),
              phone: stripDigits(data.phone),
              email: data.email.trim(),
            })
          )}
        >
          <div className="fields">
            <label>
              Nome / Razao social
              <input {...register('name', { required: 'Informe o nome.' })} />
              {errors.name && <span className="field-error">{errors.name.message}</span>}
            </label>
            <label>
              CPF / CNPJ
              <Controller
                name="document"
                control={control}
                rules={{
                  required: 'Informe o documento.',
                  validate: (value) => {
                    const digits = stripDigits(value);
                    if (digits.length === 11 || digits.length === 14) {
                      return true;
                    }
                    return 'Informe um CPF ou CNPJ valido.';
                  },
                }}
                render={({ field }) => {
                  const { onChange, value, ...rest } = field;
                  return (
                    <input
                      {...rest}
                      value={value ?? ''}
                      inputMode="numeric"
                      onChange={(event) => {
                        const formatted = formatCpfCnpj(event.target.value);
                        onChange(formatted);
                      }}
                    />
                  );
                }}
              />
              {errors.document && <span className="field-error">{errors.document.message}</span>}
            </label>
            <label>
              Endereco
              <input {...register('address', { required: 'Informe o endereco.' })} />
              {errors.address && <span className="field-error">{errors.address.message}</span>}
            </label>
            <label>
              Telefone
              <Controller
                name="phone"
                control={control}
                rules={{
                  required: 'Informe o telefone.',
                  validate: (value) => {
                    const digits = stripDigits(value);
                    if (digits.length === 10 || digits.length === 11) {
                      return true;
                    }
                    return 'Informe um telefone valido com DDD.';
                  },
                }}
                render={({ field }) => {
                  const { onChange, value, ...rest } = field;
                  return (
                    <input
                      {...rest}
                      value={value ?? ''}
                      inputMode="numeric"
                      onChange={(event) => {
                        const formatted = formatPhone(event.target.value);
                        onChange(formatted);
                      }}
                    />
                  );
                }}
              />
              {errors.phone && <span className="field-error">{errors.phone.message}</span>}
            </label>
            <label>
              E-mail
              <input
                type="email"
                {...register('email', {
                  required: 'Informe o e-mail.',
                  pattern: {
                    value: EMAIL_PATTERN,
                    message: 'Informe um e-mail valido.',
                  },
                })}
              />
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
                  <td>{supplier.documentFormatted}</td>
                  <td>{supplier.phoneFormatted}</td>
                  <td>{supplier.email}</td>
                  <td className="actions-cell">
                    <button type="button" onClick={() => startEdit(supplier)}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => confirmDelete(supplier.id)}
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
