import { redirect } from "next/navigation";
import { getDemoUser } from "./demo-auth";
import DemoApp from "./demo-app";

export const runtime = "nodejs";

export default async function Page() {
  if (!(await getDemoUser())) redirect("/demo-access");
  return <DemoApp />;
}
