// src/pages/Perfil.jsx
import React, { useState } from 'react';
import './Perfil.css'; // Asegúrate de que los estilos estén en un archivo separado

function initials(name = 'Admin') {
  return name
    .split(' ')
    .map((n) => n[0]?.toUpperCase())
    .join('')
    .slice(0, 2);
}

function Perfil({
  admin = { name: 'Administrador', email: 'admin@barberia.com' },
  onLogout = () => {},
  asCard = true,
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogoutClick = () => {
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    onLogout();
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  const ConfirmModal = () => (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-confirm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-confirm-icon-warning">
          <span className="warning-icon">!</span>
        </div>
        <h3 className="modal-confirm-title">Aviso</h3>
        <p className="modal-confirm-message">
          ¿Deseas cerrar sesión?
        </p>
        <div className="modal-confirm-actions">
          <button className="btn-cancel" onClick={handleCancel}>
            Cancelar
          </button>
          <button className="btn-confirm-logout" onClick={handleConfirm}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );

  if (asCard) {
    return (
      <>
        <div className="stat-card profile-panel">
          <div className="profile-panel-header">
            <div className="avatar large">{initials(admin.name)}</div>
            <div className="profile-panel-meta">
              <strong className="profile-panel-name">{admin.name}</strong>
              <span className="profile-panel-role">Administrador</span>
              <small className="profile-panel-email">{admin.email}</small>
            </div>
          </div>

          <div className="profile-panel-actions">
            <button className="btn-danger" onClick={handleLogoutClick}>
              Cerrar sesión
            </button>
          </div>
        </div>

        {showConfirm && <ConfirmModal />}
      </>
    );
  }

  return (
    <>
      <div className="profile-panel">
        <div className="profile-panel-header">
          <div className="avatar large">{initials(admin.name)}</div>
          <div className="profile-panel-meta">
            <strong className="profile-panel-name">{admin.name}</strong>
            <span className="profile-panel-role">Administrador</span>
            <small className="profile-panel-email">{admin.email}</small>
          </div>
        </div>

        <div className="profile-panel-actions">
          <button className="btn-danger" onClick={handleLogoutClick}>
            Cerrar sesión
          </button>
        </div>
      </div>

      {showConfirm && <ConfirmModal />}
    </>
  );
}

export default Perfil;