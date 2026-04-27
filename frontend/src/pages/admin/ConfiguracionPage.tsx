
import { useState, useEffect } from 'react';
import '../../styles/pages/admin/AdminPages.css';
import { getShifts, updateShift, getSystemConfig, updateSystemConfig } from '../../services/api';
import { DEFAULT_PUBLIC_CONFIG } from '../../constants/publicConfig';
import type { Shift, SystemConfig } from '../../types';

export default function ConfiguracionPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({});
  const [loading, setLoading] = useState(true);
  
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [editingConfig, setEditingConfig] = useState<boolean>(false);
  const [configForm, setConfigForm] = useState<SystemConfig>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [shiftsData, configData] = await Promise.all([
        getShifts(),
        getSystemConfig()
      ]);
      setShifts(shiftsData);
      setSystemConfig(configData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditShiftClick = (shift: Shift) => {
    setEditingShift({ ...shift });
  };

  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShift) return;
    try {
      await updateShift(editingShift.id, {
        startTime: editingShift.startTime,
        endTime: editingShift.endTime,
        slotInterval: editingShift.slotInterval,
        isActive: editingShift.isActive,
      });
      setEditingShift(null);
      loadData();
    } catch (err) {
      console.error(err);
      alert('Error al actualizar el turno');
    }
  };

  const handleEditConfigClick = () => {
    setConfigForm({
      restaurant_name: systemConfig.restaurant_name || DEFAULT_PUBLIC_CONFIG.restaurant_name,
      restaurant_address: systemConfig.restaurant_address || DEFAULT_PUBLIC_CONFIG.restaurant_address,
      restaurant_phone: systemConfig.restaurant_phone || DEFAULT_PUBLIC_CONFIG.restaurant_phone,
      restaurant_email: systemConfig.restaurant_email || DEFAULT_PUBLIC_CONFIG.restaurant_email,
      opening_days: systemConfig.opening_days || '1,2,3,4,5,6,0',
    });
    setEditingConfig(true);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSystemConfig(configForm);
      setEditingConfig(false);
      loadData();
    } catch (err) {
      console.error(err);
      alert('Error al actualizar la configuración');
    }
  };

  const STATIC_SECTIONS = [
    {
      title: '🪑 Capacidad',
      rows: [
        { label: 'Aforo máximo', value: `${systemConfig.dynamic_max_capacity || '—'} comensales` },
        { label: 'Mesas activas', value: `${systemConfig.dynamic_active_tables || '—'} mesas` },
        { label: 'Duración media reserva', value: '90–120 min' },
      ],
    },
    {
      title: '🔧 Sistema',
      rows: [
        { label: 'Versión API', value: '2.4.0' },
        { label: 'Entorno', value: import.meta.env.MODE },
        { label: 'Zona horaria', value: 'Europe/Madrid (CET/CEST)' },
      ],
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Configuración</h1>
        <p>Datos generales del restaurante y parámetros del sistema</p>
      </div>

      <div className="config-grid">
        
        {/* Restaurante Config */}
        <div className="config-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                <h3 style={{ margin: 0, border: 'none', padding: 0 }}>🍽️ Información del Restaurante</h3>
            </div>
            
            {loading ? (
                <div className="state-loading"><span className="spinner">⌛</span></div>
            ) : (
                <>
                    <div className="config-row">
                        <span className="config-row__label">Nombre</span>
                        <span className="config-row__value">{systemConfig.restaurant_name || DEFAULT_PUBLIC_CONFIG.restaurant_name}</span>
                    </div>
                    <div className="config-row">
                        <span className="config-row__label">Dirección</span>
                        <span className="config-row__value">{systemConfig.restaurant_address || DEFAULT_PUBLIC_CONFIG.restaurant_address}</span>
                    </div>
                    <div className="config-row">
                        <span className="config-row__label">Teléfono</span>
                        <span className="config-row__value">{systemConfig.restaurant_phone || DEFAULT_PUBLIC_CONFIG.restaurant_phone}</span>
                    </div>
                    <div className="config-row">
                        <span className="config-row__label">Email de contacto</span>
                        <span className="config-row__value">{systemConfig.restaurant_email || DEFAULT_PUBLIC_CONFIG.restaurant_email}</span>
                    </div>
                    
                    <button 
                        onClick={handleEditConfigClick} 
                        style={{ marginTop: '1rem', width: '100%', cursor: 'pointer', padding: '0.6rem 0.75rem', background: 'var(--bg-light)', color: 'var(--primary)', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600 }}
                    >
                        ✏️ Editar Información
                    </button>
                </>
            )}
        </div>


        {/* Turnos */}
        <div className="config-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                <h3 style={{ margin: 0, border: 'none', padding: 0 }}>📅 Horario de apertura (Turnos)</h3>
            </div>
            
            {loading ? (
                <div className="state-loading"><span className="spinner">⌛</span></div>
            ) : (
                <>
                    <div className="config-row" style={{ backgroundColor: 'var(--bg-light)', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
                        <div>
                            <div className="config-row__label">📅 Días de apertura semanal</div>
                            <div className="config-row__value" style={{ marginTop: '0.5rem', fontWeight: 600, color: 'var(--primary)', fontSize: '1rem' }}>
                                {systemConfig.opening_days 
                                    ? systemConfig.opening_days.split(',').sort((a, b) => {
                                        const order = [1, 2, 3, 4, 5, 6, 0];
                                        return order.indexOf(parseInt(a)) - order.indexOf(parseInt(b));
                                    }).map((d) => ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'][parseInt(d)]).join(', ')
                                    : 'Todos los días'}
                            </div>
                        </div>
                        <button 
                            onClick={handleEditConfigClick} 
                            style={{ cursor: 'pointer', padding: '0.4rem 0.75rem', background: 'var(--bg-light)', color: 'var(--primary)', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}
                        >
                            Cambiar
                        </button>
                    </div>

                    {shifts.length === 0 ? (
                        <div className="state-empty">No hay turnos configurados.</div>
                    ) : (
                        shifts.map((shift) => (
                            <div className="config-row" key={shift.id} style={{ alignItems: 'flex-start' }}>
                                <div>
                                    <div className="config-row__label">{shift.name} {shift.isActive ? '' : '(Inactivo)'}</div>
                                    <div className="config-row__value" style={{ marginTop: '0.25rem' }}>{shift.startTime} – {shift.endTime} (Intervalo: {shift.slotInterval} min)</div>
                                </div>
                                <button 
                                  onClick={() => handleEditShiftClick(shift)} 
                                  style={{ cursor: 'pointer', padding: '0.4rem 0.75rem', background: 'var(--accent-action)', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}
                                >
                                    Editar
                                </button>
                            </div>
                        ))
                    )}
                </>
            )}
        </div>

        {/* Static Sections */}
        {STATIC_SECTIONS.map((section) => (
          <div className="config-section" key={section.title}>
            <h3>{section.title}</h3>
            {section.rows.map((row) => (
              <div className="config-row" key={row.label}>
                <span className="config-row__label">{row.label}</span>
                <span className="config-row__value">{row.value}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Modal Shift */}
      {editingShift && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal__header">
              <h2>Editar {editingShift.name}</h2>
              <button className="admin-modal__close" type="button" onClick={() => setEditingShift(null)}>×</button>
            </div>
            <div className="admin-modal__body">
              <form id="shift-form" onSubmit={handleSaveShift} className="admin-modal__form-group" style={{ gap: '1.25rem' }}>
                <div className="admin-modal__form-group">
                  <label>Hora Inicio (HH:MM)</label>
                  <input
                    type="time"
                    required
                    value={editingShift.startTime}
                    onChange={(e) => setEditingShift({...editingShift, startTime: e.target.value})}
                  />
                </div>
                <div className="admin-modal__form-group">
                  <label>Hora Fin (HH:MM)</label>
                  <input
                    type="time"
                    required
                    value={editingShift.endTime}
                    onChange={(e) => setEditingShift({...editingShift, endTime: e.target.value})}
                  />
                </div>
                <div className="admin-modal__form-group">
                  <label>Intervalo de reservas (minutos)</label>
                  <input
                    type="number"
                    required
                    min="15"
                    step="15"
                    value={editingShift.slotInterval}
                    onChange={(e) => setEditingShift({...editingShift, slotInterval: Number(e.target.value)})}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={editingShift.isActive}
                    onChange={(e) => setEditingShift({...editingShift, isActive: e.target.checked})}
                    id="isActiveCheck"
                    style={{ width: 'auto' }}
                  />
                  <label htmlFor="isActiveCheck" style={{ margin: 0, cursor: 'pointer' }}>Turno activo (Permitir reservas)</label>
                </div>
              </form>
            </div>
            <div className="admin-modal__footer">
              <button
                type="button"
                onClick={() => setEditingShift(null)}
                style={{ padding: '0.5rem 1.25rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="shift-form"
                style={{ padding: '0.5rem 1.25rem', background: 'var(--accent-action)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Config */}
      {editingConfig && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal__header">
              <h2>Editar Información</h2>
              <button className="admin-modal__close" type="button" onClick={() => setEditingConfig(false)}>×</button>
            </div>
            <div className="admin-modal__body">
              <form id="config-form" onSubmit={handleSaveConfig} className="admin-modal__form-group" style={{ gap: '1.25rem' }}>
                <div className="admin-modal__form-group">
                  <label>Nombre del Restaurante</label>
                  <input
                    type="text"
                    required
                    value={configForm.restaurant_name}
                    onChange={(e) => setConfigForm({...configForm, restaurant_name: e.target.value})}
                  />
                </div>
                <div className="admin-modal__form-group">
                  <label>Dirección</label>
                  <input
                    type="text"
                    required
                    value={configForm.restaurant_address}
                    onChange={(e) => setConfigForm({...configForm, restaurant_address: e.target.value})}
                  />
                </div>
                <div className="admin-modal__form-group">
                  <label>Teléfono</label>
                  <input
                    type="text"
                    required
                    value={configForm.restaurant_phone}
                    onChange={(e) => setConfigForm({...configForm, restaurant_phone: e.target.value})}
                  />
                </div>
                <div className="admin-modal__form-group">
                  <label>Email de contacto</label>
                  <input
                    type="email"
                    required
                    value={configForm.restaurant_email}
                    onChange={(e) => setConfigForm({...configForm, restaurant_email: e.target.value})}
                  />
                </div>
                <div className="admin-modal__form-group">
                  <label>Días de apertura semanal</label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                    {[
                      { id: 1, label: 'L' },
                      { id: 2, label: 'M' },
                      { id: 3, label: 'X' },
                      { id: 4, label: 'J' },
                      { id: 5, label: 'V' },
                      { id: 6, label: 'S' },
                      { id: 0, label: 'D' },
                    ].map((day) => {
                      const days = configForm.opening_days ? configForm.opening_days.split(',') : [];
                      const isSelected = days.includes(day.id.toString());
                      return (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() => {
                            let newDays;
                            if (isSelected) {
                              newDays = days.filter((d: string) => d !== day.id.toString());
                            } else {
                              newDays = [...days, day.id.toString()];
                            }
                            setConfigForm({ ...configForm, opening_days: newDays.join(',') });
                          }}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            border: '1px solid var(--border)',
                            background: isSelected ? 'var(--accent-action)' : 'transparent',
                            color: isSelected ? 'white' : 'inherit',
                            fontWeight: 600,
                            transition: 'all 0.2s'
                          }}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </form>
            </div>
            <div className="admin-modal__footer">
              <button
                type="button"
                onClick={() => setEditingConfig(false)}
                style={{ padding: '0.5rem 1.25rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="config-form"
                style={{ padding: '0.5rem 1.25rem', background: 'var(--accent-action)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
