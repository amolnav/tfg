
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard } from '../../services/api';
import { useSocket } from '../../context/useSocket';
import type { DashboardData, BookingStatus, NewReservationEventPayload } from '../../types';
import { STATUS_BADGE_CLASS, STATUS_COLORS, STATUS_LABELS } from '../../constants/reservationStatus';
import '../../styles/pages/admin/AdminPages.css';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const { socket } = useSocket();

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const dashboard = await getDashboard();
      setData(dashboard);
      setError('');
    } catch {
      setError('No se pudo cargar el panel. Verifica la conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    if (!socket) return undefined;

    const handleNewReservation = (payload: NewReservationEventPayload) => {
      const zoneLabel = payload.zoneName ? ` en ${payload.zoneName}` : '';
      setNotification(`Nueva reserva de ${payload.customerName} (${payload.pax} pax)${zoneLabel}. Actualizando panel...`);
      fetchDashboard();
    };

    socket.on('new_reservation', handleNewReservation);
    return () => {
      socket.off('new_reservation', handleNewReservation);
    };
  }, [socket, fetchDashboard]);

  if (loading) return (
    <div className="state-loading">
      <span className="spinner">⏳</span>
      Cargando panel...
    </div>
  );

  if (error) return (
    <div className="state-error">
      <span style={{ fontSize: '2rem' }}>⚠️</span>
      {error}
    </div>
  );

  if (!data) return null;

  const { summary, statusCounts, bookings } = data;

  return (
    <div>
      <div className="page-header">
        <h1>Panel de Control</h1>
        <p>Resumen del día para Mesón Marinero</p>
      </div>

      {notification && (
        <div className="section-card section-card--alert" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <div>
              <strong>Notificación en vivo:</strong> {notification}
            </div>
            <button
              className="btn btn-ghost"
              onClick={() => setNotification(null)}
              style={{ fontSize: '0.85rem', padding: '0.4rem 0.75rem' }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Widgets */}
      <div className="widgets-grid">
        <div className="widget-card accent-decor">
          <div className="widget-card__icon">📅</div>
          <div className="widget-card__label">Reservas hoy</div>
          <div className="widget-card__value">{summary.totalBookings}</div>
          <div className="widget-card__sub">{summary.activeBookings} activas</div>
        </div>

        <div className="widget-card accent-primary">
          <div className="widget-card__icon">👥</div>
          <div className="widget-card__label">Comensales previstos</div>
          <div className="widget-card__value">{summary.totalPaxExpected}</div>
          <div className="widget-card__sub">personas esperadas hoy</div>
        </div>

        <div className="widget-card accent-green">
          <div className="widget-card__icon">🍽️</div>
          <div className="widget-card__label">Capacidad actual</div>
          <div className="widget-card__value">{summary.occupancyRate}%</div>
          <div className="widget-card__sub">{summary.activeBookings} / {summary.totalTables} mesas</div>
          <div className="occupancy-bar">
            <div className="occupancy-bar__fill" style={{ width: `${summary.occupancyRate}%` }} />
          </div>
        </div>

        <div className="widget-card accent-action">
          <div className="widget-card__icon">📆</div>
          <div className="widget-card__label">Próximos 7 días</div>
          <div className="widget-card__value">{summary.upcomingNext7Days}</div>
          <div className="widget-card__sub">reservas pendientes</div>
        </div>
      </div>

      {/* Status breakdown */}
      {Object.keys(statusCounts).length > 0 && (
        <div className="section-card" style={{ marginBottom: '1.5rem' }}>
          <div className="section-card__header">
            <h2 className="section-card__title">Estado de reservas de hoy</h2>
          </div>
          <div className="section-card__body">
            <div className="status-pills">
              {(Object.entries(statusCounts) as [BookingStatus, number][]).map(([status, count]) => (
                <div className="status-pill" key={status}>
                  <div className="dot" style={{ background: STATUS_COLORS[status] }} />
                  <span>{STATUS_LABELS[status]}: <strong>{count}</strong></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Today's bookings table */}
      <div className="section-card">
        <div className="section-card__header">
          <h2 className="section-card__title">Reservas de hoy</h2>
          <Link to="/admin/reservas" className="btn btn-outline" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>
            Ver todas →
          </Link>
        </div>
        {bookings.length === 0 ? (
          <div className="state-empty">
            <span style={{ fontSize: '2rem' }}>🌊</span>
            No hay reservas para hoy
          </div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Cliente</th>
                  <th>Comensales</th>
                  <th>Mesa</th>
                  <th>Peticiones / Alergias</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {bookings.slice(0, 10).map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 700 }}>
                      {new Date(b.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      <div className="customer-name">{b.customer.firstName} {b.customer.lastName}</div>
                      <div className="customer-email">{b.customer.email}</div>
                    </td>
                    <td>{b.pax} 👤</td>
                    <td>{b.table?.name ?? '—'}</td>
                    <td>
                      <div className="booking-requests-cell">
                        {b.customer.allergens && b.customer.allergens.length > 0 && (
                          <div className="request-item request-item--allergy" title={b.customer.allergens.join(', ')}>
                            <span className="request-icon">🚨</span>
                            <span className="request-text">{b.customer.allergens.join(', ')}</span>
                          </div>
                        )}
                        {b.specialRequests && (
                          <div className="request-item" title={b.specialRequests}>
                            <span className="request-icon">💬</span>
                            <span className="request-text">{b.specialRequests}</span>
                          </div>
                        )}
                        {!b.specialRequests && (!b.customer.allergens || b.customer.allergens.length === 0) && (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={STATUS_BADGE_CLASS[b.status]}>
                        {STATUS_LABELS[b.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
