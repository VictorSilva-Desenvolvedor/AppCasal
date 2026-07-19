import { NavLink } from 'react-router-dom';
import { Icon } from '../ui/Icon.jsx';

export function SidebarNavItem({ to, icon, onClick, children }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) => `sidebar-nav-item no-underline${isActive ? ' is-active' : ''}`}
    >
      <Icon name={icon} />
      {children}
    </NavLink>
  );
}
