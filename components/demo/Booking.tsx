"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, CalendarDays, Clock3, ShieldCheck } from "lucide-react";
import type { DemoState, Inquiry } from "@/lib/demo-types";

type Service = Inquiry["service"];
type BookingValues = {
  service: Service;
  type: string;
  date: string;
  time: string;
  guests: string;
  location: string;
  budget: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
};

const services: Service[] = ["Event planning", "Mobile bartending", "Planning + bar"];
const times = ["14:00", "15:00", "16:00", "17:00", "17:30", "18:00", "18:30", "19:00"];
const initialValues = (service: string): BookingValues => ({
  service: services.includes(service as Service) ? service as Service : "Event planning",
  type: "", date: "", time: "", guests: "", location: "", budget: "",
  name: "", email: "", phone: "", notes: "",
});

function localDateString(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function Booking({ initialService, state, mutate, busy, ready, openPlanner }: {
  initialService: string;
  state: DemoState;
  mutate: (action: string, payload: unknown) => Promise<DemoState>;
  busy: boolean;
  ready: boolean;
  openPlanner: (id: string) => void;
}) {
  const [values, setValues] = useState<BookingValues>(() => initialValues(initialService));
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<Inquiry | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const minDate = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return localDateString(tomorrow);
  }, []);

  const set = (key: keyof BookingValues, value: string) => setValues((current) => ({ ...current, [key]: value }));
  const unavailable = useMemo(() => new Set(state.inquiries
    .filter((inquiry) => inquiry.status !== "declined" && inquiry.date === values.date)
    .map((inquiry) => inquiry.time)), [state.inquiries, values.date]);

  function next(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!formRef.current?.reportValidity()) return;
    if (step === 1 && unavailable.has(values.time)) {
      setError("That sample time is already reserved in this demo workspace. Choose another time.");
      return;
    }
    setStep((current) => Math.min(3, current + 1));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !ready || created) return;
    setError("");
    const priorIds = new Set(state.inquiries.map((inquiry) => inquiry.id));
    try {
      const updated = await mutate("createInquiry", {
        name: values.name.trim(), email: values.email.trim(), phone: values.phone.trim(),
        type: values.type.trim(), service: values.service, date: values.date, time: values.time,
        guests: Number(values.guests), location: values.location.trim(), budget: values.budget.trim(), notes: values.notes.trim(),
      });
      const inquiry = updated.inquiries.find((item) => !priorIds.has(item.id));
      if (!inquiry) throw new Error("The inquiry saved, but its confirmation could not be found. Refresh the workspace to check it.");
      setCreated(inquiry);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn't save this demo inquiry. Please try again.");
    }
  }

  if (created) {
    return <section className="booking-shell" aria-labelledby="booking-success-title">
      <div className="success-state">
        <span className="success-icon"><Check aria-hidden="true" /></span>
        <p className="small-label">Demo inquiry saved</p>
        <h1 id="booking-success-title">Your event is ready to plan.</h1>
        <p>This created a sample inquiry and a planning workspace in this demo. It is not a real reservation, and no email or message was sent.</p>
        <div className="panel booking-confirmation">
          <strong>{created.type}</strong><span>{created.date} · {created.time}</span>
          <span>{created.guests} guests · {created.location}</span>
        </div>
        {created.eventId && <button className="button primary" type="button" onClick={() => openPlanner(created.eventId!)}>Open event plan <ArrowRight size={17} aria-hidden="true" /></button>}
      </div>
    </section>;
  }

  const titles = ["Choose your service", "Tell us about the event", "Your contact details", "Review your inquiry"];
  const stepLabels = ["Service", "Event", "Contact", "Review"];
  return <div className="booking-shell">
    <aside className="booking-aside">
      <p className="small-label">Breanna Events &amp; Bar</p>
      <h1>Let’s make room for a good time.</h1>
      <p>Share a few details to create a planning inquiry in this private demo workspace.</p>
      <div className="booking-note"><ShieldCheck size={19} aria-hidden="true" /><span>Demo only. This form does not reserve a date or send messages.</span></div>
      <div className="booking-aside-meta"><CalendarDays size={17} aria-hidden="true" /> Sample availability is checked against this workspace</div>
    </aside>
    <div className="booking-main">
      {!ready && <p className="panel preview-notice" role="status">Sample preview · Sign in to save a demo inquiry and create an event plan.</p>}
      <ol className="stepper" aria-label="Booking form progress">
        {stepLabels.map((label, index) => <li key={label} className={index === step ? "active" : index < step ? "complete" : ""} aria-current={index === step ? "step" : undefined}>
          <span className="step-number">{index < step ? <Check size={14} aria-hidden="true" /> : index + 1}</span><span>{label}</span>
        </li>)}
      </ol>
      <form ref={formRef} onSubmit={step === 3 ? submit : next}>
        <div className="step-card">
          <p className="small-label">Step {step + 1} of 4</p>
          <h2>{titles[step]}</h2>
          {step === 0 && <fieldset className="service-options">
            <legend className="visually-hidden">Choose a service</legend>
            {services.map((service) => <label className={`service-option ${values.service === service ? "selected" : ""}`} key={service}>
              <input type="radio" name="service" value={service} checked={values.service === service} onChange={() => set("service", service)} />
              <span><strong>{service}</strong><small>{service === "Event planning" ? "A thoughtful plan, timeline, and day-of details." : service === "Mobile bartending" ? "A welcoming bar setup with a considered drink menu." : "Planning support and bar service in one inquiry."}</small></span>
            </label>)}
          </fieldset>}

          {step === 1 && <div className="form-grid">
            <label className="field full-width">What are you celebrating?<input required maxLength={100} value={values.type} onChange={(e) => set("type", e.target.value)} placeholder="Wedding reception, birthday, team gathering…" /></label>
            <label className="field">Event date<input required type="date" min={minDate} value={values.date} onChange={(e) => { set("date", e.target.value); set("time", ""); }} /></label>
            <label className="field">Sample start time<select required value={values.time} onChange={(e) => set("time", e.target.value)} disabled={!values.date}>
              <option value="">{values.date ? "Choose a time" : "Choose a date first"}</option>
              {times.map((time) => <option key={time} value={time} disabled={unavailable.has(time)}>{timeLabel(time)}{unavailable.has(time) ? " · unavailable" : ""}</option>)}
            </select><small className="muted"><Clock3 size={13} aria-hidden="true" /> Sample times only; no external calendar is checked.</small></label>
            <label className="field">Estimated guest count<input required type="number" min="1" max="10000" step="1" value={values.guests} onChange={(e) => set("guests", e.target.value)} placeholder="e.g. 60" /></label>
            <label className="field">Location or venue<input required maxLength={240} value={values.location} onChange={(e) => set("location", e.target.value)} placeholder="Venue name or city" /></label>
            <label className="field full-width">Approximate budget <span className="muted">(optional)</span><input maxLength={100} value={values.budget} onChange={(e) => set("budget", e.target.value)} placeholder="A range is helpful, if you have one" /></label>
          </div>}

          {step === 2 && <div className="form-grid">
            <label className="field full-width">Your name<input required autoComplete="name" maxLength={120} value={values.name} onChange={(e) => set("name", e.target.value)} /></label>
            <label className="field">Email address<input required type="email" autoComplete="email" maxLength={254} value={values.email} onChange={(e) => set("email", e.target.value)} /></label>
            <label className="field">Phone <span className="muted">(optional)</span><input type="tel" autoComplete="tel" maxLength={40} value={values.phone} onChange={(e) => set("phone", e.target.value)} /></label>
            <label className="field full-width">Anything else we should know? <span className="muted">(optional)</span><textarea rows={4} maxLength={3000} value={values.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Style, accessibility needs, a zero-proof menu, or other helpful details" /></label>
          </div>}

          {step === 3 && <div className="review-list">
            <div><span>Service</span><strong>{values.service}</strong></div>
            <div><span>Event</span><strong>{values.type}</strong></div>
            <div><span>Date and time</span><strong>{dateLabel(values.date)} · {timeLabel(values.time)}</strong></div>
            <div><span>Guests and location</span><strong>{values.guests} guests · {values.location}</strong></div>
            {values.budget && <div><span>Approximate budget</span><strong>{values.budget}</strong></div>}
            <div><span>Contact</span><strong>{values.name} · {values.email}{values.phone ? ` · ${values.phone}` : ""}</strong></div>
            {values.notes && <div><span>Notes</span><strong>{values.notes}</strong></div>}
            <p className="muted">Submitting creates a demo inquiry and editable event plan. It does not confirm or reserve this date.</p>
          </div>}
          {error && <p className="form-error" role="alert">{error}</p>}
        </div>
        <div className="form-actions">
          {step > 0 && <button className="button secondary" type="button" onClick={() => { setError(""); setStep((current) => current - 1); }} disabled={busy}><ArrowLeft size={16} aria-hidden="true" /> Back</button>}
          {step < 3 ? <button className="button primary" type="submit">Continue <ArrowRight size={16} aria-hidden="true" /></button>
            : <button className="button primary" type="submit" disabled={busy || !ready}>{busy ? "Saving inquiry…" : "Create demo inquiry"} <ArrowRight size={16} aria-hidden="true" /></button>}
        </div>
      </form>
    </div>
  </div>;
}

function timeLabel(time: string) {
  const [hourText, minute] = time.split(":");
  const hour = Number(hourText);
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? "PM" : "AM"}`;
}

function dateLabel(date: string) {
  if (!date) return "Date not selected";
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}
