"use client";

import { useActionState } from "react";
import { signIn, type FormState } from "@/app/actions";
import { postStatus, uploadFile } from "@/app/portal/actions";
import { SubmitButton } from "./SubmitButton";

function Notice({ state }: { state: FormState }) {
  if (!state) return null;
  if (state.error) return <p className="notice error" role="alert">{state.error}</p>;
  if (state.ok) return <p className="notice ok" role="status">{state.ok}</p>;
  return null;
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(signIn, undefined);
  return (
    <form action={action}>
      <Notice state={state} />
      <input type="hidden" name="next" value={next ?? ""} />
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <SubmitButton className="btn block" pending="Signing in…">Sign in</SubmitButton>
    </form>
  );
}

type ProjectOption = { id: string; name: string; client: string };

function ProjectSelect({ projects }: { projects: ProjectOption[] }) {
  return (
    <select name="project_id" required defaultValue="">
      <option value="" disabled>Choose a project…</option>
      {projects.map((p) => (
        <option key={p.id} value={p.id}>{p.client} · {p.name}</option>
      ))}
    </select>
  );
}

export function StatusForm({ projects }: { projects: ProjectOption[] }) {
  const [state, action] = useActionState(postStatus, undefined);
  return (
    <form action={action}>
      <Notice state={state} />
      <div className="field">
        <label htmlFor="status-project">Project</label>
        <div id="status-project"><ProjectSelect projects={projects} /></div>
      </div>
      <div className="field">
        <label htmlFor="status-body">Update</label>
        <textarea id="status-body" name="body" maxLength={1000} required placeholder="What changed, what's next, anything you need from the client." />
      </div>
      <SubmitButton pending="Posting…">Post update</SubmitButton>
    </form>
  );
}

export function UploadForm({ projects }: { projects: ProjectOption[] }) {
  const [state, action] = useActionState(uploadFile, undefined);
  return (
    <form action={action}>
      <Notice state={state} />
      <div className="field">
        <label htmlFor="upload-project">Project</label>
        <div id="upload-project"><ProjectSelect projects={projects} /></div>
      </div>
      <div className="field">
        <label htmlFor="upload-file">File (PDF, PNG, JPEG, TXT or CSV, up to 4 MB)</label>
        <input id="upload-file" name="file" type="file" required accept=".pdf,.png,.jpg,.jpeg,.txt,.csv" />
      </div>
      <SubmitButton pending="Uploading…">Upload to client</SubmitButton>
    </form>
  );
}
