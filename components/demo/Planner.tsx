"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, ChevronDown, Clock3, Plus, Printer, Save, Trash2, Users, Wallet } from "lucide-react";
import type { DemoState, Event, EventBudgetItem, EventTask, EventTimelineItem } from "@/lib/demo-types";

type Tab = "Overview" | "Checklist" | "Timeline" | "Budget" | "Bar menu";
const tabs: Tab[] = ["Overview", "Checklist", "Timeline", "Budget", "Bar menu"];
const clone = (event: Event): Event => JSON.parse(JSON.stringify(event)) as Event;
const newId = () => typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `demo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const currency = (value: number) => new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0);

export function Planner({ state, mutate, busy, ready, selectedId, onSelect, onNotice, book }: {
  state: DemoState;
  mutate: (action: string, payload: unknown) => Promise<DemoState>;
  busy: boolean;
  ready: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
  onNotice: (message: string) => void;
  book: () => void;
}) {
  const selectedEvent = state.events.find((event) => event.id === selectedId) ?? state.events[0];
  const [draft, setDraft] = useState<Event | null>(() => selectedEvent ? clone(selectedEvent) : null);
  const [savedSnapshot, setSavedSnapshot] = useState(() => selectedEvent ? JSON.stringify(selectedEvent) : "");
  const [tab, setTab] = useState<Tab>("Overview");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [timelineTitle, setTimelineTitle] = useState("");
  const [timelineTime, setTimelineTime] = useState("17:00");
  const [budgetName, setBudgetName] = useState("");
  const [drinkName, setDrinkName] = useState("");
  const dirty = !!draft && JSON.stringify(draft) !== savedSnapshot;

  // Adopt refreshed server data only after local work is clean; otherwise the draft remains intact.
  useEffect(() => {
    if (!selectedEvent) { setDraft(null); setSavedSnapshot(""); return; }
    if (!dirty || draft?.id !== selectedEvent.id) {
      setDraft(clone(selectedEvent));
      setSavedSnapshot(JSON.stringify(selectedEvent));
      setError("");
    }
  }, [selectedEvent, selectedEvent?.id, dirty, draft?.id]);

  const completedCount = draft?.tasks.filter((task) => task.done).length ?? 0;
  const estimated = useMemo(() => draft?.budgetItems.reduce((sum, item) => sum + (Number(item.estimated) || 0), 0) ?? 0, [draft?.budgetItems]);
  const actual = useMemo(() => draft?.budgetItems.reduce((sum, item) => sum + (Number(item.actual) || 0), 0) ?? 0, [draft?.budgetItems]);

  function edit(change: (event: Event) => Event) {
    setDraft((current) => current ? change(current) : current);
    setError("");
  }

  async function save(): Promise<boolean> {
    if (!draft || !dirty || busy || !ready) return !dirty;
    setError("");
    try {
      await mutate("updateEvent", draft);
      setSavedSnapshot(JSON.stringify(draft));
      onNotice("Plan saved to this demo workspace.");
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The plan could not be saved. Your edits are still here.");
      return false;
    }
  }

  function requestSwitch(id: string) {
    if (id === draft?.id || id === selectedId) return;
    if (dirty) setPendingId(id);
    else { setPendingId(null); onSelect(id); setTab("Overview"); }
  }

  async function saveAndSwitch() {
    if (!pendingId || !(await save())) return;
    const id = pendingId;
    setPendingId(null); onSelect(id); setTab("Overview");
  }
  function discardAndSwitch() {
    if (!pendingId) return;
    const id = pendingId;
    const target = state.events.find((event) => event.id === id);
    if (target) { setDraft(clone(target)); setSavedSnapshot(JSON.stringify(target)); }
    setPendingId(null); setError(""); onSelect(id); setTab("Overview");
  }

  if (!draft) return <section className="section">
    <div className="page-intro"><p className="small-label">Your planning workspace</p><h1>Plan a celebration, one detail at a time.</h1><p>Create a demo inquiry to start a new event plan.</p><button className="button primary" type="button" onClick={book}>Start an inquiry</button></div>
    <div className="empty-state"><CalendarDays aria-hidden="true" /><p>No event plans in this demo workspace yet.</p></div>
  </section>;

  const taskProgress = draft.tasks.length ? Math.round(completedCount / draft.tasks.length * 100) : 0;
  return <section className="section planner-section" aria-labelledby="planner-title">
    <div className="planner-interactive print-hide">
    <header className="workspace-header">
      <div><p className="small-label">{ready ? "Your private demo workspace" : "Sample preview"}</p><h1 id="planner-title">Event planner</h1><p>{ready ? "Organize the details in one place. Changes are saved only when you choose Save plan." : "Preview this sample event plan. Sign in to save edits to your demo workspace."}</p></div>
      <div className="workspace-header-actions">
        <label className="field event-select-label"><span className="visually-hidden">Choose an event plan</span><select aria-label="Choose an event plan" value={draft.id} onChange={(event) => requestSwitch(event.target.value)}>
          {state.events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}
        </select><ChevronDown size={15} aria-hidden="true" /></label>
        <button className="button secondary print-hide" type="button" onClick={() => window.print()}><Printer size={16} aria-hidden="true" /> Print plan</button>
      </div>
    </header>

    {pendingId && <div className="panel unsaved-confirm" role="alertdialog" aria-labelledby="unsaved-title" aria-describedby="unsaved-desc">
      <div><strong id="unsaved-title">You have unsaved edits</strong><p id="unsaved-desc">Save this plan before switching events, discard these edits, or keep working here.</p></div>
      <div className="form-actions"><button className="button primary" type="button" onClick={saveAndSwitch} disabled={busy}>Save and switch</button><button className="button secondary" type="button" onClick={discardAndSwitch} disabled={busy}>Discard edits</button><button className="text-link" type="button" onClick={() => setPendingId(null)}>Keep editing</button></div>
    </div>}

    <div className="stats-grid planner-stats">
      <div className="stat-card"><span>Event date</span><strong>{dateLabel(draft.date)}</strong><CalendarDays size={18} aria-hidden="true" /></div>
      <div className="stat-card"><span>Guest count</span><strong>{draft.guests}</strong><Users size={18} aria-hidden="true" /></div>
      <div className="stat-card"><span>Checklist</span><strong>{completedCount} of {draft.tasks.length} complete</strong><span className="progress-track" aria-label={`${taskProgress}% of tasks complete`}><span style={{ width: `${taskProgress}%` }} /></span></div>
      <div className="stat-card"><span>Estimated spend</span><strong>{currency(estimated)}</strong><Wallet size={18} aria-hidden="true" /></div>
    </div>

    <div className="planner-workspace">
      <nav className="planner-tabs filter-tabs" aria-label="Event plan sections">
        {tabs.map((item) => <button type="button" key={item} className={tab === item ? "active" : ""} aria-current={tab === item ? "page" : undefined} onClick={() => setTab(item)}>{item}</button>)}
      </nav>
      <div className="planner-panel">
        {tab === "Overview" && <div className="planner-content">
          <div className="panel-heading"><div><p className="small-label">Event details</p><h2>Shape the plan</h2></div><span className="status-pill">Demo plan</span></div>
          <div className="form-grid">
            <label className="field full-width">Event title<input required maxLength={160} value={draft.title} onChange={(e) => edit((event) => ({ ...event, title: e.target.value }))} /></label>
            <label className="field">Event date<input required type="date" value={draft.date} onChange={(e) => edit((event) => ({ ...event, date: e.target.value }))} /></label>
            <label className="field">Guest count<input required type="number" min="1" max="10000" value={draft.guests} onChange={(e) => edit((event) => ({ ...event, guests: Number(e.target.value) }))} /></label>
            <label className="field full-width">Venue or location<input required maxLength={240} value={draft.venue} onChange={(e) => edit((event) => ({ ...event, venue: e.target.value }))} /></label>
            <label className="field full-width">Planning notes<textarea rows={5} maxLength={3000} value={draft.notes} onChange={(e) => edit((event) => ({ ...event, notes: e.target.value }))} /></label>
          </div>
        </div>}

        {tab === "Checklist" && <div className="planner-content">
          <div className="panel-heading"><div><p className="small-label">Keep the details moving</p><h2>Planning checklist</h2></div><span className="status-pill">{completedCount}/{draft.tasks.length} done</span></div>
          <form className="inline-add" onSubmit={(e) => { e.preventDefault(); const title = taskTitle.trim(); if (!title) return; edit((event) => ({ ...event, tasks: [...event.tasks, { id: newId(), title, done: false }] })); setTaskTitle(""); }}>
            <label className="field"><span className="visually-hidden">New checklist task</span><input required maxLength={180} value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Add a planning task" /></label><button className="button secondary" type="submit"><Plus size={16} aria-hidden="true" /> Add task</button>
          </form>
          {draft.tasks.length ? <ul className="task-list">{draft.tasks.map((task) => <li className="task-row" key={task.id}>
            <label className="task-check"><input type="checkbox" checked={task.done} onChange={() => edit((event) => ({ ...event, tasks: event.tasks.map((item) => item.id === task.id ? { ...item, done: !item.done } : item) }))} /><span className="checkmark"><Check size={14} aria-hidden="true" /></span><span className={task.done ? "task-done" : ""}>{task.title}</span></label>
            <button className="icon-button" type="button" aria-label={`Remove ${task.title}`} onClick={() => edit((event) => ({ ...event, tasks: event.tasks.filter((item) => item.id !== task.id) }))}><Trash2 size={16} aria-hidden="true" /></button>
          </li>)}</ul> : <div className="empty-state">No tasks yet. Add a first planning task above.</div>}
        </div>}

        {tab === "Timeline" && <div className="planner-content">
          <div className="panel-heading"><div><p className="small-label">A day with room to breathe</p><h2>Event timeline</h2></div><Clock3 size={20} aria-hidden="true" /></div>
          <form className="inline-add timeline-add" onSubmit={(e) => { e.preventDefault(); const title = timelineTitle.trim(); if (!title) return; const item: EventTimelineItem = { id: newId(), time: timelineTime, title }; edit((event) => ({ ...event, timeline: [...event.timeline, item].sort((a, b) => a.time.localeCompare(b.time)) })); setTimelineTitle(""); }}>
            <label className="field">Time<input required type="time" value={timelineTime} onChange={(e) => setTimelineTime(e.target.value)} /></label><label className="field">Moment<input required maxLength={180} value={timelineTitle} onChange={(e) => setTimelineTitle(e.target.value)} placeholder="Guest arrival, dinner, toast…" /></label><button className="button secondary" type="submit"><Plus size={16} aria-hidden="true" /> Add</button>
          </form>
          {draft.timeline.length ? <ol className="timeline-list">{[...draft.timeline].sort((a, b) => a.time.localeCompare(b.time)).map((item) => <li key={item.id} className="timeline-row">
            <label className="field"><span className="visually-hidden">Time for {item.title}</span><input required type="time" value={item.time} onChange={(e) => edit((event) => ({ ...event, timeline: event.timeline.map((row) => row.id === item.id ? { ...row, time: e.target.value } : row) }))} /></label>
            <label className="field"><span className="visually-hidden">Timeline moment</span><input required maxLength={180} value={item.title} onChange={(e) => edit((event) => ({ ...event, timeline: event.timeline.map((row) => row.id === item.id ? { ...row, title: e.target.value } : row) }))} /></label>
            <button className="icon-button" type="button" aria-label={`Remove ${item.title}`} onClick={() => edit((event) => ({ ...event, timeline: event.timeline.filter((row) => row.id !== item.id) }))}><Trash2 size={16} aria-hidden="true" /></button>
          </li>)}</ol> : <div className="empty-state">No moments on the timeline yet. Add one above.</div>}
        </div>}

        {tab === "Budget" && <div className="planner-content">
          <div className="panel-heading"><div><p className="small-label">Track estimates and spending</p><h2>Budget</h2></div><Wallet size={20} aria-hidden="true" /></div>
          <div className="budget-summary"><div><span>Estimated total</span><strong>{currency(estimated)}</strong></div><div><span>Actual total</span><strong>{currency(actual)}</strong></div><div><span>Remaining estimate</span><strong>{currency(estimated - actual)}</strong></div></div>
          <form className="inline-add budget-add" onSubmit={(e) => { e.preventDefault(); const name = budgetName.trim(); if (!name) return; const item: EventBudgetItem = { id: newId(), name, estimated: 0, actual: 0 }; edit((event) => ({ ...event, budgetItems: [...event.budgetItems, item] })); setBudgetName(""); }}>
            <label className="field"><span className="visually-hidden">New budget item</span><input required maxLength={120} value={budgetName} onChange={(e) => setBudgetName(e.target.value)} placeholder="Add a budget item" /></label><button className="button secondary" type="submit"><Plus size={16} aria-hidden="true" /> Add item</button>
          </form>
          {draft.budgetItems.length ? <div className="table-wrap"><table><thead><tr><th scope="col">Item</th><th scope="col">Estimated</th><th scope="col">Actual</th><th scope="col"><span className="visually-hidden">Actions</span></th></tr></thead>
            <tbody>{draft.budgetItems.map((item) => <tr key={item.id}><td><label className="field"><span className="visually-hidden">Budget item name</span><input required maxLength={120} value={item.name} onChange={(e) => edit((event) => ({ ...event, budgetItems: event.budgetItems.map((row) => row.id === item.id ? { ...row, name: e.target.value } : row) }))} /></label></td>
              <td><label className="field money-field"><span className="visually-hidden">Estimated amount in dollars</span><span>$</span><input required type="number" min="0" step="0.01" value={item.estimated} onChange={(e) => edit((event) => ({ ...event, budgetItems: event.budgetItems.map((row) => row.id === item.id ? { ...row, estimated: Number(e.target.value) } : row) }))} /></label></td>
              <td><label className="field money-field"><span className="visually-hidden">Actual amount in dollars</span><span>$</span><input required type="number" min="0" step="0.01" value={item.actual} onChange={(e) => edit((event) => ({ ...event, budgetItems: event.budgetItems.map((row) => row.id === item.id ? { ...row, actual: Number(e.target.value) } : row) }))} /></label></td>
              <td><button className="icon-button" type="button" aria-label={`Remove ${item.name}`} onClick={() => edit((event) => ({ ...event, budgetItems: event.budgetItems.filter((row) => row.id !== item.id) }))}><Trash2 size={16} aria-hidden="true" /></button></td></tr>)}</tbody></table></div> : <div className="empty-state">No budget items yet. Add your first estimate above.</div>}
          <p className="muted">Amounts are planning estimates in US dollars. Actual costs are entered by you.</p>
        </div>}

        {tab === "Bar menu" && <div className="planner-content">
          <div className="panel-heading"><div><p className="small-label">A thoughtful menu</p><h2>Bar and drink menu</h2></div><span className="status-pill">Alcohol-free choices welcome</span></div>
          <p className="muted">List proposed drinks and zero-proof options. This is a planning tool, not a service order.</p>
          <form className="inline-add" onSubmit={(e) => { e.preventDefault(); const drink = drinkName.trim(); if (!drink) return; edit((event) => ({ ...event, drinks: [...event.drinks, drink] })); setDrinkName(""); }}>
            <label className="field"><span className="visually-hidden">Drink name or menu option</span><input required maxLength={120} value={drinkName} onChange={(e) => setDrinkName(e.target.value)} placeholder="Add a signature drink or zero-proof option" /></label><button className="button secondary" type="submit"><Plus size={16} aria-hidden="true" /> Add drink</button>
          </form>
          {draft.drinks.length ? <ul className="drink-list">{draft.drinks.map((drink, index) => <li key={`${index}-${drink}`}><span><span className="drink-dot" aria-hidden="true" />{drink}</span><button className="icon-button" type="button" aria-label={`Remove ${drink}`} onClick={() => edit((event) => ({ ...event, drinks: event.drinks.filter((_, itemIndex) => itemIndex !== index) }))}><Trash2 size={16} aria-hidden="true" /></button></li>)}</ul> : <div className="empty-state">Your menu is open. Add a first drink idea above.</div>}
          <div className="panel menu-reminder"><strong>Menu reminder</strong><p>Confirm ingredients, allergies, venue rules, licensing, and service details with the responsible professionals before an actual event.</p></div>
        </div>}
      </div>
    </div>

    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="save-bar print-hide">
      <div><strong>{!ready ? "Sample preview" : dirty ? "Unsaved changes" : "All changes saved"}</strong><span>{!ready ? "Sign in to save changes to a demo workspace." : dirty ? "Your draft stays here until you save." : "Edits persist in this demo workspace."}</span></div>
      <button className="button primary" type="button" onClick={save} disabled={!dirty || busy || !ready}><Save size={16} aria-hidden="true" /> {busy ? "Saving…" : "Save plan"}</button>
    </div>
    </div>

    <article className="print-only printable-plan" aria-label={`Printable event plan: ${draft.title}`}>
      <p className="small-label">Breanna Events &amp; Bar · Demo plan</p>
      <h1>{draft.title}</h1>
      <p>This is a sample planning document. It is not a reservation or service order.</p>
      <section aria-labelledby="print-details-title">
        <h2 id="print-details-title">Event details</h2>
        <dl className="print-details">
          <div><dt>Date</dt><dd>{dateLabel(draft.date)}</dd></div>
          <div><dt>Venue or location</dt><dd>{draft.venue || "Not set"}</dd></div>
          <div><dt>Guest count</dt><dd>{draft.guests}</dd></div>
        </dl>
        <h3>Planning notes</h3><p>{draft.notes || "No planning notes added."}</p>
      </section>
      <section aria-labelledby="print-checklist-title">
        <h2 id="print-checklist-title">Checklist</h2>
        {draft.tasks.length ? <ul>{draft.tasks.map((task: EventTask) => <li key={task.id}>{task.done ? "Complete" : "To do"} · {task.title}</li>)}</ul> : <p>No checklist tasks.</p>}
      </section>
      <section aria-labelledby="print-timeline-title">
        <h2 id="print-timeline-title">Timeline</h2>
        {draft.timeline.length ? <ol>{[...draft.timeline].sort((a, b) => a.time.localeCompare(b.time)).map((item: EventTimelineItem) => <li key={item.id}><time>{timeLabel(item.time)}</time> · {item.title}</li>)}</ol> : <p>No timeline moments.</p>}
      </section>
      <section aria-labelledby="print-budget-title">
        <h2 id="print-budget-title">Budget</h2>
        {draft.budgetItems.length ? <table><thead><tr><th scope="col">Item</th><th scope="col">Estimated</th><th scope="col">Actual</th></tr></thead><tbody>{draft.budgetItems.map((item: EventBudgetItem) => <tr key={item.id}><td>{item.name}</td><td>{currency(item.estimated)}</td><td>{currency(item.actual)}</td></tr>)}</tbody><tfoot><tr><th scope="row">Total</th><td>{currency(estimated)}</td><td>{currency(actual)}</td></tr></tfoot></table> : <p>No budget items. Estimated and actual totals are both {currency(0)}.</p>}
      </section>
      <section aria-labelledby="print-drinks-title">
        <h2 id="print-drinks-title">Bar and drink menu</h2>
        {draft.drinks.length ? <ul>{draft.drinks.map((drink, index) => <li key={`${index}-${drink}`}>{drink}</li>)}</ul> : <p>No drink ideas added.</p>}
      </section>
    </article>
  </section>;
}

function dateLabel(date: string) {
  if (!date) return "Choose a date";
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function timeLabel(time: string) {
  const [hourText, minute] = time.split(":");
  const hour = Number(hourText);
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? "PM" : "AM"}`;
}
