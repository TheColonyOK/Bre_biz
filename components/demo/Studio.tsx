"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Check,
  ClipboardList,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import type {
  DemoState,
  Highlight,
  Inquiry,
  InquiryStatus,
  Post,
} from "@/lib/demo-types";

type StudioTab = "Overview" | "Inquiries" | "Journal" | "Highlights";
type StudioProps = {
  state: DemoState;
  mutate: (action: string, payload: unknown) => Promise<DemoState>;
  busy: boolean;
  ready: boolean;
  onNotice: (message: string) => void;
  openPlanner: (id: string) => void;
};

const tabs: StudioTab[] = ["Overview", "Inquiries", "Journal", "Highlights"];
const statuses: InquiryStatus[] = ["new", "contacted", "confirmed", "declined"];
const images = [
  { path: "/images/celebration.webp", label: "Celebration" },
  { path: "/images/cocktails.webp", label: "Cocktails" },
  { path: "/images/details.webp", label: "Details" },
];
const highlightCategories: Highlight["category"][] = [
  "Weddings",
  "Private parties",
  "Corporate",
];

function dateLabel(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function blankPost(): Omit<Post, "id"> {
  return {
    title: "",
    category: "Planning tips",
    excerpt: "",
    body: "",
    image: "/images/details.webp",
    published: false,
    readTime: "3 min read",
  };
}

function blankHighlight(): Omit<Highlight, "id"> {
  return {
    title: "",
    category: "Weddings",
    description: "",
    image: "/images/celebration.webp",
    guests: 1,
  };
}

function csvCell(value: string | number) {
  let text = String(value);
  if (/^[\s\u0000-\u001f]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function exportInquiries(inquiries: Inquiry[]) {
  const rows = [
    ["Name", "Email", "Phone", "Event", "Service", "Date", "Time", "Guests", "Location", "Budget", "Status"],
    ...inquiries.map((item) => [
      item.name,
      item.email,
      item.phone,
      item.type,
      item.service,
      item.date,
      item.time,
      item.guests,
      item.location,
      item.budget,
      item.status,
    ]),
  ];
  const blob = new Blob([rows.map((row) => row.map(csvCell).join(",")).join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = "breanna-demo-inquiries.csv";
  link.click();
  URL.revokeObjectURL(href);
}

export function Studio({ state, mutate, busy, ready, onNotice, openPlanner }: StudioProps) {
  const [tab, setTab] = useState<StudioTab>("Overview");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInquiryId, setSelectedInquiryId] = useState("");
  const [statusDraft, setStatusDraft] = useState<InquiryStatus>("new");
  const [inquiryError, setInquiryError] = useState("");
  const [postDraft, setPostDraft] = useState<(Omit<Post, "id"> & { id?: string }) | null>(null);
  const [highlightDraft, setHighlightDraft] = useState<(Omit<Highlight, "id"> & { id?: string }) | null>(null);
  const [postError, setPostError] = useState("");
  const [highlightError, setHighlightError] = useState("");

  const selectedInquiry = state.inquiries.find((item) => item.id === selectedInquiryId);

  const filteredInquiries = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return state.inquiries
      .filter((item) => statusFilter === "all" || item.status === statusFilter)
      .filter((item) => !needle || [item.name, item.email, item.type, item.service, item.location]
        .some((value) => value.toLowerCase().includes(needle)))
      .sort((left, right) => left.date.localeCompare(right.date));
  }, [state.inquiries, search, statusFilter]);

  async function saveInquiryStatus() {
    if (!selectedInquiry) return;
    setInquiryError("");
    try {
      await mutate("updateInquiry", { id: selectedInquiry.id, status: statusDraft });
      onNotice("Inquiry status saved.");
    } catch (error) {
      setInquiryError(error instanceof Error ? error.message : "Could not save this inquiry.");
    }
  }

  function editPost(post: Post) {
    setPostError("");
    setPostDraft({ ...post });
  }

  async function savePost(published: boolean) {
    if (!postDraft) return;
    setPostError("");
    const payload = { ...postDraft, published };
    try {
      await mutate("savePost", payload);
      setPostDraft(null);
      onNotice(published ? "Article published." : "Draft saved.");
    } catch (error) {
      setPostError(error instanceof Error ? error.message : "Could not save this article.");
    }
  }

  async function deletePost() {
    if (!postDraft?.id) return;
    if (!window.confirm("Delete this article from the demo journal? This cannot be undone.")) return;
    setPostError("");
    try {
      await mutate("deletePost", { id: postDraft.id });
      setPostDraft(null);
      onNotice("Article deleted.");
    } catch (error) {
      setPostError(error instanceof Error ? error.message : "Could not delete this article.");
    }
  }

  function editHighlight(highlight: Highlight) {
    setHighlightError("");
    setHighlightDraft({ ...highlight });
  }

  async function saveHighlight() {
    if (!highlightDraft) return;
    setHighlightError("");
    try {
      await mutate("saveHighlight", highlightDraft);
      setHighlightDraft(null);
      onNotice("Highlight saved.");
    } catch (error) {
      setHighlightError(error instanceof Error ? error.message : "Could not save this highlight.");
    }
  }

  async function deleteHighlight() {
    if (!highlightDraft?.id) return;
    if (!window.confirm("Delete this highlight from the demo gallery? This cannot be undone.")) return;
    setHighlightError("");
    try {
      await mutate("deleteHighlight", { id: highlightDraft.id });
      setHighlightDraft(null);
      onNotice("Highlight deleted.");
    } catch (error) {
      setHighlightError(error instanceof Error ? error.message : "Could not delete this highlight.");
    }
  }

  return (
    <section className="workspace" aria-labelledby="studio-title">
      <header className="workspace-header">
        <div>
          <span className="small-label">Private demo workspace</span>
          <h1 id="studio-title">Owner studio</h1>
          <p className="muted">Manage sample inquiries and the content shown in this concept.</p>
        </div>
        <a className="button secondary" href="#home"><ArrowLeft size={16} /> View the site</a>
      </header>

      {!ready && <div className="form-error" role="alert">Sign in to ChatGPT to load your private demo workspace.</div>}
      {!ready && <p className="muted">Your changes are saved to your own demo workspace after it loads.</p>}

      <nav className="filter-tabs" aria-label="Studio sections">
        {tabs.map((item) => (
          <button key={item} type="button" className={tab === item ? "active" : ""} aria-pressed={tab === item} onClick={() => setTab(item)}>
            {item}
          </button>
        ))}
      </nav>

      {(tab === "Overview" || tab === "Inquiries") && <>
        <div className="stats-grid" aria-label="Workspace summary">
          <Stat label="Inquiries" value={state.inquiries.length} />
          <Stat label="New" value={state.inquiries.filter((item) => item.status === "new").length} />
          <Stat label="Confirmed" value={state.inquiries.filter((item) => item.status === "confirmed").length} />
          <Stat label="Events" value={state.events.length} />
        </div>

        {tab === "Overview" && <div className="panel overview-callout">
          <div><ClipboardList aria-hidden="true" /><div><strong>Inquiry inbox</strong><p className="muted">Review details, change status, or jump to an event plan.</p></div></div>
          <button className="button secondary" type="button" onClick={() => setTab("Inquiries")}>Open inquiries <ArrowUpRight size={16} /></button>
        </div>}

        <section className="panel" aria-labelledby="inquiries-heading">
          <div className="panel-heading">
            <div><span className="small-label">Requests and follow-up</span><h2 id="inquiries-heading">{tab === "Overview" ? "Recent inquiries" : "Inquiry inbox"}</h2></div>
            <button className="button secondary" type="button" onClick={() => exportInquiries(filteredInquiries)} disabled={!filteredInquiries.length}>
              <ArrowDownToLine size={16} /> Export CSV
            </button>
          </div>
          <div className="inquiry-filters">
            <label className="field"><span>Search inquiries</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, service, or location" /></label>
            <label className="field"><span>Filter by status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All statuses</option>{statuses.map((item) => <option key={item} value={item}>{capitalize(item)}</option>)}</select></label>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th scope="col">Name / event</th><th scope="col">Service</th><th scope="col">Date / guests</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Details</span></th></tr></thead>
              <tbody>
                {filteredInquiries.map((item) => <tr key={item.id} className={selectedInquiryId === item.id ? "selected-row" : ""}>
                  <td><button className="inquiry-name" type="button" onClick={() => { setSelectedInquiryId(item.id); setStatusDraft(item.status); setInquiryError(""); }}>{item.name}<small>{item.type}</small></button></td>
                  <td>{item.service}</td>
                  <td>{dateLabel(item.date)}<small>{item.guests} guests · {item.time}</small></td>
                  <td><span className={`status-pill ${item.status}`}>{capitalize(item.status)}</span></td>
                  <td>{item.eventId && <button className="text-link" type="button" onClick={() => openPlanner(item.eventId!)}>Open plan <ArrowUpRight size={14} /></button>}</td>
                </tr>)}
              </tbody>
            </table>
            {!filteredInquiries.length && <div className="empty-state">No inquiries match these filters.</div>}
          </div>
        </section>

        {selectedInquiry && <InquiryDetails inquiry={selectedInquiry} statusDraft={statusDraft} setStatusDraft={setStatusDraft} error={inquiryError} busy={busy} ready={ready} onSave={saveInquiryStatus} openPlanner={openPlanner} />}
      </>}

      {tab === "Journal" && <section className="panel content-panel" aria-labelledby="journal-heading">
        <div className="panel-heading"><div><span className="small-label">Editorial content</span><h2 id="journal-heading">Journal</h2></div><button type="button" className="button primary" onClick={() => { setPostError(""); setPostDraft(blankPost()); }} disabled={!ready || busy}><Plus size={16} /> New article</button></div>
        <div className="studio-split">
          <div className="content-list" aria-label="Journal articles">
            {state.posts.map((post) => <button key={post.id} type="button" className={`content-row ${postDraft?.id === post.id ? "selected" : ""}`} onClick={() => editPost(post)}>
              <span className="content-thumb"><img src={post.image} alt="" /></span><span><strong>{post.title}</strong><small>{post.category} · {post.readTime}</small></span><span className={`status-pill ${post.published ? "published" : "draft"}`}>{post.published ? "Published" : "Draft"}</span>
            </button>)}
            {!state.posts.length && <div className="empty-state">No journal articles yet. Create one to get started.</div>}
          </div>
          {postDraft ? <div className="editor-panel">
            <div className="editor-heading"><div><span className="small-label">{postDraft.id ? "Edit article" : "New article"}</span><h3>{postDraft.title || "Untitled article"}</h3></div><button className="icon-button" type="button" aria-label="Close article editor" onClick={() => { setPostDraft(null); setPostError(""); }}>×</button></div>
            <PostFields value={postDraft} onChange={setPostDraft} />
            {postError && <div className="form-error" role="alert">{postError}</div>}
            <div className="form-actions">
              {postDraft.id && <button type="button" className="button danger" onClick={deletePost} disabled={busy}><Trash2 size={16} /> Delete</button>}
              <button type="button" className="button secondary" onClick={() => savePost(false)} disabled={busy || !ready}><Save size={16} /> Save draft</button>
              <button type="button" className="button primary" onClick={() => savePost(true)} disabled={busy || !ready}><BookOpen size={16} /> Publish</button>
            </div>
          </div> : <div className="editor-panel editor-placeholder"><BookOpen aria-hidden="true" /><h3>Choose an article</h3><p className="muted">Select a story to edit it, or start a new article.</p></div>}
        </div>
      </section>}

      {tab === "Highlights" && <section className="panel content-panel" aria-labelledby="highlights-heading">
        <div className="panel-heading"><div><span className="small-label">Concept gallery</span><h2 id="highlights-heading">Highlights</h2></div><button type="button" className="button primary" onClick={() => { setHighlightError(""); setHighlightDraft(blankHighlight()); }} disabled={!ready || busy}><Plus size={16} /> New highlight</button></div>
        <div className="studio-split">
          <div className="content-list" aria-label="Gallery highlights">
            {state.highlights.map((highlight) => <button key={highlight.id} type="button" className={`content-row ${highlightDraft?.id === highlight.id ? "selected" : ""}`} onClick={() => editHighlight(highlight)}>
              <span className="content-thumb"><img src={highlight.image} alt="" /></span><span><strong>{highlight.title}</strong><small>{highlight.category} · {highlight.guests} guests</small></span><ArrowUpRight size={15} aria-hidden="true" />
            </button>)}
            {!state.highlights.length && <div className="empty-state">No gallery concepts yet. Add one when you are ready.</div>}
          </div>
          {highlightDraft ? <div className="editor-panel">
            <div className="editor-heading"><div><span className="small-label">{highlightDraft.id ? "Edit highlight" : "New highlight"}</span><h3>{highlightDraft.title || "Untitled highlight"}</h3></div><button className="icon-button" type="button" aria-label="Close highlight editor" onClick={() => { setHighlightDraft(null); setHighlightError(""); }}>×</button></div>
            <HighlightFields value={highlightDraft} onChange={setHighlightDraft} />
            {highlightError && <div className="form-error" role="alert">{highlightError}</div>}
            <div className="form-actions">
              {highlightDraft.id && <button type="button" className="button danger" onClick={deleteHighlight} disabled={busy}><Trash2 size={16} /> Delete</button>}
              <button type="button" className="button primary" onClick={saveHighlight} disabled={busy || !ready}><Save size={16} /> Save highlight</button>
            </div>
          </div> : <div className="editor-panel editor-placeholder"><Check aria-hidden="true" /><h3>Choose a highlight</h3><p className="muted">Select a concept to edit it, or create a new gallery item.</p></div>}
        </div>
      </section>}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="stat-card"><span className="small-label">{label}</span><strong>{value}</strong></div>;
}

function InquiryDetails({
  inquiry,
  statusDraft,
  setStatusDraft,
  error,
  busy,
  ready,
  onSave,
  openPlanner,
}: {
  inquiry: Inquiry;
  statusDraft: InquiryStatus;
  setStatusDraft: (status: InquiryStatus) => void;
  error: string;
  busy: boolean;
  ready: boolean;
  onSave: () => void;
  openPlanner: (id: string) => void;
}) {
  return <section className="panel inquiry-detail" aria-labelledby="inquiry-detail-title">
    <div className="panel-heading"><div><span className="small-label">Inquiry details</span><h2 id="inquiry-detail-title">{inquiry.name}</h2></div><span className={`status-pill ${inquiry.status}`}>{capitalize(inquiry.status)}</span></div>
    <div className="form-grid detail-grid">
      <Detail label="Event" value={inquiry.type} /><Detail label="Service" value={inquiry.service} />
      <Detail label="Date and time" value={`${dateLabel(inquiry.date)} · ${inquiry.time}`} /><Detail label="Guests" value={String(inquiry.guests)} />
      <Detail label="Email" value={inquiry.email} /><Detail label="Phone" value={inquiry.phone || "Not provided"} />
      <Detail label="Location" value={inquiry.location} /><Detail label="Budget" value={inquiry.budget || "Not provided"} />
      <div className="detail-note full-width"><span className="small-label">Notes</span><p>{inquiry.notes || "No additional notes."}</p></div>
    </div>
    <div className="status-edit">
      <label className="field"><span>Inquiry status</span><select value={statusDraft} onChange={(event) => setStatusDraft(event.target.value as InquiryStatus)}>{statuses.map((item) => <option key={item} value={item}>{capitalize(item)}</option>)}</select></label>
      <div className="form-actions"><button type="button" className="button primary" onClick={onSave} disabled={busy || !ready}><Save size={16} /> Save status</button>{inquiry.eventId && <button type="button" className="button secondary" onClick={() => openPlanner(inquiry.eventId!)}>Open event plan <ArrowUpRight size={16} /></button>}</div>
    </div>
    {error && <div className="form-error" role="alert">{error}</div>}
  </section>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="detail-item"><span className="small-label">{label}</span><strong>{value}</strong></div>;
}

function PostFields({ value, onChange }: { value: Omit<Post, "id"> & { id?: string }; onChange: (post: Omit<Post, "id"> & { id?: string }) => void }) {
  const set = <K extends keyof Post>(key: K, next: Post[K]) => onChange({ ...value, [key]: next });
  return <div className="form-grid">
    <label className="field full-width"><span>Title</span><input value={value.title} maxLength={180} onChange={(event) => set("title", event.target.value)} required /></label>
    <label className="field"><span>Category</span><input value={value.category} maxLength={60} onChange={(event) => set("category", event.target.value)} required /></label>
    <label className="field"><span>Read time</span><input value={value.readTime} maxLength={40} onChange={(event) => set("readTime", event.target.value)} required /></label>
    <label className="field full-width"><span>Excerpt</span><textarea value={value.excerpt} maxLength={500} rows={3} onChange={(event) => set("excerpt", event.target.value)} required /></label>
    <label className="field full-width"><span>Article body</span><textarea value={value.body} maxLength={20000} rows={12} onChange={(event) => set("body", event.target.value)} required /><small>{value.body.length.toLocaleString()} / 20,000 characters</small></label>
    <ImageSelect value={value.image} onChange={(image) => set("image", image)} />
  </div>;
}

function HighlightFields({ value, onChange }: { value: Omit<Highlight, "id"> & { id?: string }; onChange: (highlight: Omit<Highlight, "id"> & { id?: string }) => void }) {
  const set = <K extends keyof Highlight>(key: K, next: Highlight[K]) => onChange({ ...value, [key]: next });
  return <div className="form-grid">
    <label className="field full-width"><span>Title</span><input value={value.title} maxLength={180} onChange={(event) => set("title", event.target.value)} required /></label>
    <label className="field"><span>Category</span><select value={value.category} onChange={(event) => set("category", event.target.value as Highlight["category"])}>{highlightCategories.map((category) => <option key={category}>{category}</option>)}</select></label>
    <label className="field"><span>Guest count</span><input type="number" min={1} max={10000} value={value.guests} onChange={(event) => set("guests", Number(event.target.value))} required /></label>
    <label className="field full-width"><span>Description</span><textarea value={value.description} maxLength={1000} rows={4} onChange={(event) => set("description", event.target.value)} required /></label>
    <ImageSelect value={value.image} onChange={(image) => set("image", image)} />
  </div>;
}

function ImageSelect({ value, onChange }: { value: string; onChange: (image: string) => void }) {
  return <label className="field"><span>Image</span><select value={value} onChange={(event) => onChange(event.target.value)}>{images.map((image) => <option key={image.path} value={image.path}>{image.label}</option>)}</select></label>;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
