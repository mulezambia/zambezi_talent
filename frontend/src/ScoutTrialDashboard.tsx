import { useMemo, useState } from 'react';
import './ScoutTrialDashboard.css';

export type ScoutTrialInvite = {
  id: number;
  scoutEmail: string;
  scoutName: string;
  talentEmail: string;
  talentName: string;
  trialDate: string;
  trialTime: string;
  location: string;
  message: string;
  status: string;
  createdAt: string;
};

type Props = {
  invites: ScoutTrialInvite[];
  onRefresh: () => void;
};

type TrialFilter = 'All' | 'Pending' | 'Accepted' | 'Declined' | 'Upcoming';
type DisplayMode = 'Calendar' | 'List';

const todayString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseLocalDate = (value: string) => {
  const [year, month, day] = (value || '').split('-').map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value: string) => {
  const date = parseLocalDate(value);
  return date
    ? date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    : value || 'Date not set';
};

const statusClass = (status: string) => {
  const value = (status || 'Pending').toLowerCase();
  if (value === 'accepted') return 'zt-status-accepted';
  if (value === 'declined') return 'zt-status-declined';
  return 'zt-status-pending';
};

const statusLabel = (status: string) => {
  const value = (status || 'Pending').toLowerCase();
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export default function ScoutTrialDashboard({ invites, onRefresh }: Props) {
  const [filter, setFilter] = useState<TrialFilter>('All');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('Calendar');
  const [search, setSearch] = useState('');
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(todayString());

  const today = todayString();
  const normalizedInvites = useMemo(
    () => invites.map((invite) => ({ ...invite, status: statusLabel(invite.status) })),
    [invites],
  );

  const filteredInvites = useMemo(() => {
    const query = search.trim().toLowerCase();
    return normalizedInvites
      .filter((invite) => {
        if (filter === 'Upcoming') {
          if (invite.trialDate < today || invite.status === 'Declined') return false;
        } else if (filter !== 'All' && invite.status !== filter) {
          return false;
        }

        if (!query) return true;
        return [invite.talentName, invite.talentEmail, invite.location, invite.message]
          .some((value) => (value || '').toLowerCase().includes(query));
      })
      .sort((a, b) => {
        const dateCompare = (a.trialDate || '').localeCompare(b.trialDate || '');
        return dateCompare || (a.trialTime || '').localeCompare(b.trialTime || '');
      });
  }, [normalizedInvites, filter, search, today]);

  const stats = useMemo(() => ({
    total: normalizedInvites.length,
    pending: normalizedInvites.filter((invite) => invite.status === 'Pending').length,
    accepted: normalizedInvites.filter((invite) => invite.status === 'Accepted').length,
    declined: normalizedInvites.filter((invite) => invite.status === 'Declined').length,
    upcoming: normalizedInvites.filter((invite) => invite.trialDate >= today && invite.status !== 'Declined').length,
  }), [normalizedInvites, today]);

  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const monthTitle = monthCursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const calendarCells: Array<number | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  const invitesForDate = (date: string) => filteredInvites.filter((invite) => invite.trialDate === date);
  const selectedDateInvites = invitesForDate(selectedDate);
  const selectedDateLabel = formatDate(selectedDate);

  const moveMonth = (direction: number) => {
    setMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
  };

  const renderInviteCard = (invite: ScoutTrialInvite, compact = false) => (
    <article className={`zt-trial-card ${compact ? 'zt-trial-card-compact' : ''}`} key={invite.id}>
      <div className="zt-trial-card-top">
        <div>
          <div className="zt-trial-talent">{invite.talentName || 'Talent'}</div>
          <div className="zt-trial-email">{invite.talentEmail}</div>
        </div>
        <span className={`zt-trial-status ${statusClass(invite.status)}`}>{statusLabel(invite.status)}</span>
      </div>
      <div className="zt-trial-details">
        <span>📅 {formatDate(invite.trialDate)}</span>
        <span>🕒 {invite.trialTime || 'Time not set'}</span>
        <span>📍 {invite.location || 'Venue not set'}</span>
      </div>
      {invite.message && <p className="zt-trial-message">{invite.message}</p>}
      {invite.status === 'Pending' && <div className="zt-trial-note">Waiting for the talent to respond.</div>}
      {invite.status === 'Accepted' && <div className="zt-trial-note zt-trial-note-success">The talent has accepted this trial.</div>}
      {invite.status === 'Declined' && <div className="zt-trial-note zt-trial-note-declined">The talent declined this invitation.</div>}
    </article>
  );

  return (
    <section className="zt-trial-dashboard">
      <div className="zt-trial-heading">
        <div>
          <p className="zt-trial-eyebrow">SCOUT WORKSPACE</p>
          <h2>📅 My Trial Management</h2>
          <p className="zt-trial-subtitle">Track invitations, check talent responses and keep upcoming trials organised.</p>
        </div>
        <button className="zt-trial-refresh" type="button" onClick={onRefresh}>↻ Refresh trials</button>
      </div>

      <div className="zt-trial-stats">
        <div className="zt-trial-stat"><span>Total invitations</span><strong>{stats.total}</strong></div>
        <div className="zt-trial-stat zt-stat-pending"><span>Awaiting response</span><strong>{stats.pending}</strong></div>
        <div className="zt-trial-stat zt-stat-accepted"><span>Accepted</span><strong>{stats.accepted}</strong></div>
        <div className="zt-trial-stat zt-stat-upcoming"><span>Upcoming trials</span><strong>{stats.upcoming}</strong></div>
      </div>

      <div className="zt-trial-toolbar">
        <div className="zt-trial-view-toggle" role="group" aria-label="Trial display mode">
          <button type="button" className={displayMode === 'Calendar' ? 'active' : ''} onClick={() => setDisplayMode('Calendar')}>▦ Calendar</button>
          <button type="button" className={displayMode === 'List' ? 'active' : ''} onClick={() => setDisplayMode('List')}>☷ List</button>
        </div>
        <select aria-label="Filter trials" value={filter} onChange={(event) => setFilter(event.target.value as TrialFilter)}>
          <option value="All">All statuses</option>
          <option value="Upcoming">Upcoming</option>
          <option value="Pending">Pending</option>
          <option value="Accepted">Accepted</option>
          <option value="Declined">Declined</option>
        </select>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search talent, venue or message..."
          aria-label="Search trial invitations"
        />
      </div>

      {normalizedInvites.length === 0 ? (
        <div className="zt-trial-empty">
          <div className="zt-trial-empty-icon">📅</div>
          <h3>No trial invitations yet</h3>
          <p>When you invite a talent to a trial, the invitation and its response will appear here.</p>
        </div>
      ) : filteredInvites.length === 0 ? (
        <div className="zt-trial-empty zt-trial-empty-small">
          <h3>No matching trials</h3>
          <p>Try changing the status filter or search phrase.</p>
        </div>
      ) : displayMode === 'List' ? (
        <div className="zt-trial-list">{filteredInvites.map((invite) => renderInviteCard(invite))}</div>
      ) : (
        <div className="zt-trial-calendar-layout">
          <div className="zt-trial-calendar">
            <div className="zt-calendar-header">
              <button type="button" aria-label="Previous month" onClick={() => moveMonth(-1)}>‹</button>
              <h3>{monthTitle}</h3>
              <button type="button" aria-label="Next month" onClick={() => moveMonth(1)}>›</button>
            </div>
            <div className="zt-calendar-grid zt-calendar-weekdays">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <div key={day}>{day}</div>)}
            </div>
            <div className="zt-calendar-grid">
              {calendarCells.map((day, index) => {
                if (!day) return <div className="zt-calendar-cell zt-calendar-blank" key={`blank-${index}`} />;
                const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayInvites = invitesForDate(date);
                const isSelected = date === selectedDate;
                const isToday = date === today;
                return (
                  <button
                    type="button"
                    key={date}
                    className={`zt-calendar-cell ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${dayInvites.length ? 'has-invites' : ''}`}
                    onClick={() => setSelectedDate(date)}
                    aria-label={`${date}, ${dayInvites.length} trial invitations`}
                  >
                    <span>{day}</span>
                    {dayInvites.length > 0 && <small>{dayInvites.length} {dayInvites.length === 1 ? 'trial' : 'trials'}</small>}
                    {dayInvites.length > 0 && (
                      <span className="zt-calendar-status-dots" aria-hidden="true">
                        {(['Pending', 'Accepted', 'Declined'] as const).filter((status) => dayInvites.some((invite) => invite.status === status)).map((status) => (
                          <i key={status} className={`zt-calendar-dot zt-dot-${status.toLowerCase()}`} />
                        ))}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="zt-calendar-legend">
              <span><i className="zt-legend-pending" /> Pending</span>
              <span><i className="zt-legend-accepted" /> Accepted</span>
              <span><i className="zt-legend-declined" /> Declined</span>
            </div>
          </div>

          <div className="zt-trial-day-panel">
            <div className="zt-trial-day-heading">
              <div>
                <p className="zt-trial-eyebrow">SELECTED DATE</p>
                <h3>{selectedDateLabel}</h3>
              </div>
              <span>{selectedDateInvites.length} {selectedDateInvites.length === 1 ? 'trial' : 'trials'}</span>
            </div>
            {selectedDateInvites.length > 0
              ? <div className="zt-trial-day-list">{selectedDateInvites.map((invite) => renderInviteCard(invite, true))}</div>
              : <div className="zt-trial-day-empty">No trials scheduled for this date. Select another day or use the List view to see all invitations.</div>}
          </div>
        </div>
      )}
    </section>
  );
}
