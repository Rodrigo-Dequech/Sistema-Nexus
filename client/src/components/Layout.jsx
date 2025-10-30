import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './Layout.css';

export default function Layout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <Link to="/">HomeCare Cotações</Link>
        </div>
        <nav>
          <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            Dashboard
          </NavLink>
          <NavLink to="/pacientes" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            Pacientes
          </NavLink>
          <NavLink to="/fornecedores" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            Fornecedores
          </NavLink>
          <NavLink to="/servicos" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            Serviços
          </NavLink>
          <NavLink to="/cotacoes" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            Cotações
          </NavLink>
        </nav>
      </aside>
      <div className="content">
        <header className="topbar">
          <span>Olá, {user?.name}</span>
          <button type="button" onClick={handleLogout} className="logout-button">
            Sair
          </button>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
