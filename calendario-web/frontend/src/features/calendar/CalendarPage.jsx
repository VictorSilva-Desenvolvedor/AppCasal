import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMediaQuery } from '../../hooks/useMediaQuery.js';
import { useCalendarData } from '../../hooks/useCalendarData.js';
import { CalendarToolbar } from './CalendarToolbar.jsx';
import { MonthView } from './MonthView.jsx';
import { WeekView } from './WeekView.jsx';
import { DayView } from './DayView.jsx';
import { AgendaView } from './AgendaView.jsx';
import { MobileMonthList } from './MobileMonthList.jsx';
import { EventModal } from './EventModal.jsx';
import { toDateKey } from './calendarUtils.js';

const MOBILE_QUERY = '(max-width: 768px)';

export function CalendarPage() {
  const { filters } = useCalendarData();
  const isMobile = useMediaQuery(MOBILE_QUERY);

  const [viewDate, setViewDate] = useState(new Date());
  const [calendarViewMode, setCalendarViewMode] = useState('month');
  const [mobileListActive, setMobileListActive] = useState(isMobile);
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [modalMode, setModalMode] = useState('list');
  const [editingEventId, setEditingEventId] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  // Cruza o breakpoint mobile em qualquer direção -> mostra lista de meses no
  // mobile, grid no desktop (mesmo comportamento do listener de matchMedia legado).
  useEffect(() => {
    setMobileListActive(isMobile);
  }, [isMobile]);

  // Sidebar (Novo evento / Próximos eventos) e a busca global (Topbar) vivem em
  // AppShell, fora desta rota — navegam para cá passando o que fazer via router
  // state. location.key muda a cada navegação (mesmo para o mesmo pathname), o
  // que garante que clicar de novo enquanto já se está em /app/calendario funcione.
  useEffect(() => {
    const navState = location.state;
    if (!navState) return;

    if (navState.quickNewEvent) {
      openNewEventForm(toDateKey(new Date()));
    } else if (navState.openDateKey) {
      openDayModal(navState.openDateKey);
    }

    navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  function openDayModal(dateKey) {
    setSelectedDateKey(dateKey);
    setModalMode('list');
    setEditingEventId(null);
    setDayModalOpen(true);
  }

  function openNewEventForm(dateKey) {
    setSelectedDateKey(dateKey);
    setEditingEventId(null);
    setModalMode('form');
    setDayModalOpen(true);
  }

  function openEditEventForm(event) {
    setSelectedDateKey(toDateKey(new Date(event.date)));
    setEditingEventId(event._id);
    setModalMode('form');
    setDayModalOpen(true);
  }

  function closeModal() {
    setDayModalOpen(false);
    setEditingEventId(null);
  }

  function backToList() {
    setModalMode('list');
    setEditingEventId(null);
  }

  function handleSelectMonth(monthDate) {
    setViewDate(monthDate);
    setMobileListActive(false);
  }

  return (
    <section id="view-calendar" className="view">
      {mobileListActive ? (
        <MobileMonthList onSelectMonth={handleSelectMonth} />
      ) : (
        <div className="calendar-grid-view">
          {isMobile && (
            <button
              type="button"
              className="calendar-back-btn btn btn-secondary"
              onClick={() => setMobileListActive(true)}
            >
              &larr; Meses
            </button>
          )}

          <CalendarToolbar
            mode={calendarViewMode}
            onChangeMode={setCalendarViewMode}
            viewDate={viewDate}
            onChangeViewDate={setViewDate}
          />

          {calendarViewMode === 'month' && (
            <MonthView viewDate={viewDate} filters={filters} onSelectDay={openDayModal} />
          )}
          {calendarViewMode === 'week' && (
            <WeekView viewDate={viewDate} filters={filters} onSelectDay={openDayModal} />
          )}
          {calendarViewMode === 'day' && (
            <DayView viewDate={viewDate} filters={filters} onEdit={openEditEventForm} onNew={openNewEventForm} />
          )}
          {calendarViewMode === 'agenda' && <AgendaView filters={filters} onEdit={openEditEventForm} />}
        </div>
      )}

      <EventModal
        open={dayModalOpen}
        mode={modalMode}
        dateKey={selectedDateKey}
        editingEventId={editingEventId}
        onClose={closeModal}
        onRequestNew={() => openNewEventForm(selectedDateKey)}
        onRequestEdit={openEditEventForm}
        onSaved={backToList}
        onDeleted={backToList}
        onCancelForm={backToList}
      />
    </section>
  );
}
