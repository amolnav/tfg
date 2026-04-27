
import { useEffect, useState, useCallback } from 'react';
import { getBookings, updateBookingStatus, createBackofficeBooking } from '../../services/api';
import { useSocket } from '../../context/useSocket';
import type { Booking, BookingStatus, NewReservationEventPayload } from '../../types';
import CustomerDetailsModal from '../../components/admin/CustomerDetailsModal';
import { ALL_STATUSES, STATUS_BADGE_CLASS, STATUS_LABELS } from '../../constants/reservationStatus';
import '../../styles/pages/admin/AdminPages.css';

export default function ReservasPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState<BookingStatus | ''>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newBooking, setNewBooking] = useState({
    date: '',
    time: '',
    pax: 2,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialRequests: '',
    allergens: '',
  });
  const [incomingReservation, setIncomingReservation] = useState<NewReservationEventPayload | null>(null);
  const { socket } = useSocket();

  const fetchBookings = useCallback(() => {
    setLoading(true);
    getBookings({
      date: filterDate || undefined,
      status: filterStatus || undefined,
      limit: 100,
    })
      .then((res) => {
        // API may return data as array or { bookings } object
        if (Array.isArray(res)) {
          setBookings(res as unknown as Booking[]);
        } else {
          setBookings(res.bookings ?? []);
        }
      })
      .catch(() => setError('Error al cargar reservas.'))
      .finally(() => setLoading(false));
  }, [filterDate, filterStatus]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  useEffect(() => {
    if (!socket) return undefined;

    const handleNewReservation = (payload: NewReservationEventPayload) => {
      setIncomingReservation(payload);
      fetchBookings();
    };

    socket.on('new_reservation', handleNewReservation);
    return () => {
      socket.off('new_reservation', handleNewReservation);
    };
  }, [socket, fetchBookings]);

  const handleStatusChange = async (id: string, newStatus: BookingStatus) => {
    setUpdatingId(id);
    try {
      await updateBookingStatus(id, newStatus);
      setBookings((prev) =>
        prev.map((b) => b.id === id ? { ...b, status: newStatus } : b)
      );
    } catch {
      alert('No se pudo actualizar el estado. Inténtalo de nuevo.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createBackofficeBooking({
        date: newBooking.date,
        time: newBooking.time,
        pax: newBooking.pax,
        customer: {
          firstName: newBooking.firstName,
          lastName: newBooking.lastName,
          email: newBooking.email,
          phone: newBooking.phone,
          allergens: newBooking.allergens.split(',').map(a => a.trim()).filter(a => a),
        },
        specialRequests: newBooking.specialRequests,
        source: 'BACKOFFICE'
      });
      setIsModalOpen(false);
      setNewBooking({ date: '', time: '', pax: 2, firstName: '', lastName: '', email: '', phone: '', specialRequests: '', allergens: '' });
      fetchBookings();
    } catch {
      alert('Error al crear la reserva. Verifica los datos o disponibilidad.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Reservas</h1>
          <p>Gestión y seguimiento de todas las reservas</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          + Añadir Reserva
        </button>
      </div>

      {incomingReservation && (
        <div className="section-card section-card--alert" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <div>
              <strong>Nueva reserva recibida:</strong> {incomingReservation.customerName} • {incomingReservation.pax} pax • mesa {incomingReservation.tableName ?? 'por asignar'}
            </div>
            <button
              className="btn btn-ghost"
              onClick={() => setIncomingReservation(null)}
              style={{ fontSize: '0.85rem', padding: '0.4rem 0.75rem' }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      <div className="section-card">
        <div className="section-card__header">
          <h2 className="section-card__title">Listado de reservas</h2>
          <div className="filters-bar">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              title="Filtrar por fecha"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as BookingStatus | '')}
            >
              <option value="">Todos los estados</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
            {(filterDate || filterStatus) && (
              <button
                className="btn btn-ghost"
                style={{ background: 'var(--bg-light)', color: 'var(--text-muted)', border: '1.5px solid var(--border)', padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
                onClick={() => { setFilterDate(''); setFilterStatus(''); }}
              >
                ✕ Limpiar
              </button>
            )}
          </div>
        </div>

        {loading && (
          <div className="state-loading">
            <span className="spinner">⏳</span> Cargando reservas...
          </div>
        )}

        {error && <div className="state-error"><span>⚠️</span>{error}</div>}

        {!loading && !error && bookings.length === 0 && (
          <div className="state-empty">
            <span style={{ fontSize: '2rem' }}>🔍</span>
            No se encontraron reservas con los filtros actuales
          </div>
        )}

        {!loading && bookings.length > 0 && (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Cliente</th>
                  <th>Comensales</th>
                  <th>Mesa</th>
                  <th>Origen</th>
                  <th>Peticiones / Alergias</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => {
                  const dt = new Date(b.date);
                  
                  // Helper for row class
                  let rowClass = '';
                  if (b.customer.isBlacklisted) rowClass = 'customer-row--blacklisted';
                  else if (b.customer.isVip) rowClass = 'customer-row--vip';

                  return (
                    <tr key={b.id} className={rowClass}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {dt.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        {dt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <div
                            className="customer-name"
                            onClick={() => setSelectedCustomerId(b.customer.id)}
                            style={{
                              cursor: 'pointer',
                              color: 'var(--primary)',
                              textDecoration: 'underline',
                              fontWeight: 600,
                              whiteSpace: 'nowrap'
                            }}
                            title="Ver ficha del cliente"
                          >
                            {b.customer.firstName} {b.customer.lastName}
                          </div>
                          <div className="customer-badges" style={{ display: 'flex', gap: '0.25rem' }}>
                            {b.customer.isVip && (
                              <span className="customer-badge customer-badge--vip" title="Cliente VIP" style={{ padding: '0.1rem 0.35rem' }}>⭐</span>
                            )}
                            {b.customer.isBlacklisted && (
                              <span className="customer-badge customer-badge--blacklist" title="Blacklist" style={{ padding: '0.1rem 0.35rem' }}>🚫</span>
                            )}
                            {b.customer.tags?.filter(t => t !== 'VIP' && t !== 'BLACKLIST').map(tag => (
                              <span 
                                key={tag} 
                                className="customer-badge customer-badge--tag" 
                                style={{ padding: '0.1rem 0.4rem', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center' }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="customer-email">{b.customer.email}</div>
                      </td>
                      <td>{b.pax}</td>
                      <td>{b.table?.name ?? '—'}</td>
                      <td>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {b.source === 'WEB' ? '🌐 Web' : b.source === 'PHONE' ? '📞 Tel.' : b.source === 'WALK_IN' ? '🚶 Presencial' : '🖥️ Backoffice'}
                        </span>
                      </td>
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
                        <select
                          className={`status-select ${STATUS_BADGE_CLASS[b.status]}`}
                          value={b.status}
                          disabled={updatingId === b.id}
                          onChange={(e) => handleStatusChange(b.id, e.target.value as BookingStatus)}
                          title="Cambiar estado"
                        >
                          {ALL_STATUSES.map((s) => (
                            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reusable Customer Details Modal */}
      {selectedCustomerId && (
        <CustomerDetailsModal
          customerId={selectedCustomerId}
          onClose={() => setSelectedCustomerId(null)}
          onUpdate={fetchBookings}
        />
      )}

      {/* Modal para añadir reserva */}
      {isModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2>Nueva Reserva (Manual)</h2>
              <button className="admin-modal__close" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateBooking}>
              <div className="admin-modal__body">
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div className="admin-modal__form-group" style={{ flex: 1 }}>
                    <label>Fecha</label>
                    <input type="date" value={newBooking.date} onChange={e => setNewBooking({ ...newBooking, date: e.target.value })} />
                  </div>
                  <div className="admin-modal__form-group" style={{ flex: 1 }}>
                    <label>Hora</label>
                    <input type="time" value={newBooking.time} onChange={e => setNewBooking({ ...newBooking, time: e.target.value })} />
                  </div>
                  <div className="admin-modal__form-group" style={{ flex: 1 }}>
                    <label>Comensales</label>
                    <input type="number" min="1" max="20" value={newBooking.pax} onChange={e => setNewBooking({ ...newBooking, pax: parseInt(e.target.value) || 1 })} />
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div className="admin-modal__form-group" style={{ flex: 1 }}>
                    <label>Nombre</label>
                    <input type="text" value={newBooking.firstName} onChange={e => setNewBooking({ ...newBooking, firstName: e.target.value })} />
                  </div>
                  <div className="admin-modal__form-group" style={{ flex: 1 }}>
                    <label>Apellidos</label>
                    <input type="text" value={newBooking.lastName} onChange={e => setNewBooking({ ...newBooking, lastName: e.target.value })} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div className="admin-modal__form-group" style={{ flex: 1 }}>
                    <label>Email</label>
                    <input type="email" value={newBooking.email} onChange={e => setNewBooking({ ...newBooking, email: e.target.value })} />
                  </div>
                  <div className="admin-modal__form-group" style={{ flex: 1 }}>
                    <label>Teléfono</label>
                    <input type="tel" value={newBooking.phone} onChange={e => setNewBooking({ ...newBooking, phone: e.target.value })} />
                  </div>
                </div>

                <div className="admin-modal__form-group">
                  <label>Alergias / Intolerancias</label>
                  <input type="text" placeholder="Ej: Gluten, Lactosa" value={newBooking.allergens} onChange={e => setNewBooking({ ...newBooking, allergens: e.target.value })} />
                </div>

                <div className="admin-modal__form-group">
                  <label>Observaciones / Peticiones</label>
                  <textarea rows={2} value={newBooking.specialRequests} onChange={e => setNewBooking({ ...newBooking, specialRequests: e.target.value })}></textarea>
                </div>
              </div>
              <div className="admin-modal__footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : 'Crear Reserva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
