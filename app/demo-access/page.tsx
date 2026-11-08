import { redirect } from "next/navigation";
import { getDemoUser } from "../demo-auth";
import AccessForm from "./form";

export const runtime = "nodejs";

export default async function DemoAccessPage() {
  if (await getDemoUser()) redirect("/");
  return (
    <main className="access-page">
      <section className="access-card">
        <a className="wordmark" href="/">breanna<span>events &amp; bar</span></a>
        <span className="small-label">Private interactive concept</span>
        <h1>Step inside<br />the celebration.</h1>
        <p>Enter the demo access code to explore the event planner, sample booking flow and owner studio.</p>
        <AccessForm />
      </section>
    </main>
  );
}
