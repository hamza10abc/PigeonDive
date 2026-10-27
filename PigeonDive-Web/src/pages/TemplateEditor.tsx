import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { ArrowLeft } from "lucide-react";
import { api, ApiError } from "../api";
import { EmailPreview } from "../components/EmailPreview";
import { TemplateThumb } from "../components/TemplateThumb";
import { useToast } from "../components/Toast";
import { Button, Dots, ErrorNote, Eyebrow, PageHeader, Segmented, Tag } from "../components/ui";
import { SNIPPETS, STARTERS, type Starter } from "../lib/starters";
import type { Template, TemplateFormat } from "../types";

export function TemplateEditorPage() {
  const { id } = useParams<{ id: string }>();
  const existing = useQuery({ queryKey: ["templates", id], queryFn: () => api<Template>(`/templates/${id}`), enabled: !!id });
  const [starter, setStarter] = useState<Starter | null>(null);

  if (id) {
    if (existing.isLoading || !existing.data) {
      return (
        <div className="flex justify-center py-24 text-ink-3">
          <Dots />
        </div>
      );
    }
    return <Editor key={existing.data.id} initial={{ name: existing.data.name, subject: existing.data.subject, format: existing.data.format, body: existing.data.body }} id={id} />;
  }

  if (!starter) return <StarterChooser onPick={setStarter} />;
  return <Editor initial={{ name: "", subject: "", format: starter.format, body: starter.body }} />;
}

function StarterChooser({ onPick }: { onPick: (starter: Starter) => void }) {
  return (
    <div>
      <Link to="/templates" className="mb-6 inline-flex items-center gap-1.5 text-[14px] text-ink-2 hover:text-ink">
        <ArrowLeft size={15} /> Templates
      </Link>
      <PageHeader title={<>Start from <em className="italic">something</em></>} lead="Pick the closest one. You can change every word and design afterwards." />
      <div className="grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-4">
        {STARTERS.map((s) => (
          <button key={s.id} type="button" onClick={() => onPick(s)} className="group text-left">
            <span className="block overflow-hidden rounded-lg border border-line-2 transition duration-200 group-hover:-translate-y-0.5 group-hover:border-ink group-hover:shadow-float">
              <TemplateThumb format={s.format} body={s.body} className="aspect-[4/5]" />
            </span>
            <span className="mt-3 block text-[15px] font-medium">{s.name}</span>
            <span className="block text-[13px] leading-snug text-ink-3">{s.blurb}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Editor({ initial, id }: { initial: { name: string; subject: string; format: TemplateFormat; body: string }; id?: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [name, setName] = useState(initial.name);
  const [subject, setSubject] = useState(initial.subject);
  const [format, setFormat] = useState<TemplateFormat>(initial.format);
  const [body, setBody] = useState(initial.body);
  const [pane, setPane] = useState<"write" | "preview">("write");
  const view = useRef<EditorView | null>(null);

  const dirty = name !== initial.name || subject !== initial.subject || format !== initial.format || body !== initial.body;

  // Warn before closing the tab with unsaved work.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = useMutation({
    mutationFn: () =>
      api<Template>(id ? `/templates/${id}` : "/templates", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify({ name: name.trim() || "Untitled template", subject, format, body }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["templates"] });
      await queryClient.invalidateQueries({ queryKey: ["setup"] });
      toast.ok("Template saved");
      navigate("/templates");
    },
  });

  function changeFormat(next: TemplateFormat) {
    if (next === format) return;
    if (body.trim() && !window.confirm("Switching replaces what you've written with a fresh starter of the other kind. Continue?")) return;
    const replacement = STARTERS.find((s) => s.format === next)!;
    setFormat(next);
    setBody(replacement.body);
  }

  function insert(snippet: string) {
    const v = view.current;
    if (!v) return setBody((current) => `${current}\n${snippet}`);
    const { from, to } = v.state.selection.main;
    v.dispatch({ changes: { from, to, insert: snippet }, selection: { anchor: from + snippet.length } });
    v.focus();
  }

  const saveError = save.error instanceof ApiError ? save.error.message : save.error ? "Could not save" : null;

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Link to="/templates" className="mb-3 inline-flex items-center gap-1.5 text-[14px] text-ink-2 hover:text-ink">
            <ArrowLeft size={15} /> Templates
          </Link>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Untitled template"
            aria-label="Template name"
            className="block w-full bg-transparent font-display text-[32px] leading-tight tracking-tight outline-none placeholder:text-ink-3 md:text-[44px]"
          />
        </div>
        <div className="flex shrink-0 items-center gap-3 pt-7">
          {dirty ? <span className="hidden font-mono text-[12px] text-amber sm:inline">Unsaved</span> : null}
          <Button onClick={() => save.mutate()} loading={save.isPending} disabled={!body.trim()}>
            Save
          </Button>
        </div>
      </div>

      <ErrorNote>{saveError}</ErrorNote>

      <div className="mb-8 flex items-center gap-3 rounded-panel border border-line-2 bg-white px-4 focus-within:border-ink focus-within:ring-4 focus-within:ring-ink/[0.07]">
        <span className="w-[62px] shrink-0 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-3">Subject</span>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="The subject people will see" className="min-w-0 flex-1 bg-transparent py-4 outline-none placeholder:text-ink-3" />
      </div>

      <div className="mb-4 lg:hidden">
        <Segmented
          value={pane}
          onChange={setPane}
          className="w-full [&>button]:flex-1"
          options={[
            { value: "write", label: "Write" },
            { value: "preview", label: "Preview" },
          ]}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className={`min-w-0 ${pane === "write" ? "block" : "hidden lg:block"}`}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <Eyebrow>{format === "HTML" ? "Design" : "Message"}</Eyebrow>
            <Segmented
              value={format}
              onChange={changeFormat}
              options={[
                { value: "HTML", label: "Design" },
                { value: "TEXT", label: "Plain text" },
              ]}
            />
          </div>

          {format === "HTML" ? (
            <>
              <div className="no-scrollbar mb-3 flex items-center gap-2 overflow-x-auto">
                <span className="shrink-0 text-[13px] text-ink-3">Add:</span>
                {SNIPPETS.map((s) => (
                  <button key={s.label} type="button" onClick={() => insert(s.html)} className="shrink-0 rounded-full border border-line-2 bg-white px-3.5 py-1.5 text-[13px] font-medium text-ink-2 transition hover:border-ink hover:text-ink">
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="overflow-hidden rounded-panel border border-line-2">
                <CodeMirror
                  value={body}
                  height="480px"
                  extensions={[html(), EditorView.lineWrapping]}
                  onChange={setBody}
                  onCreateEditor={(v) => (view.current = v)}
                  basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: true }}
                />
              </div>
              <p className="mt-2 text-[13px] text-ink-3">Click “Add” to drop a block in where your cursor is. Anything between the tags is just your words.</p>
            </>
          ) : (
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={18}
              className="block w-full rounded-panel border border-line-2 bg-white p-5 font-mono text-[14px] leading-relaxed outline-none transition focus:border-ink focus:ring-4 focus:ring-ink/[0.07]"
            />
          )}
        </section>

        <section className={`min-w-0 ${pane === "preview" ? "block" : "hidden lg:block"}`}>
          <div className="mb-3 flex items-center justify-between">
            <Eyebrow>Live preview</Eyebrow>
            <Tag>{format === "HTML" ? "Design" : "Plain text"}</Tag>
          </div>
          <div className="overflow-hidden rounded-panel border border-line-2 bg-white">
            <div className="px-5 pb-4 pt-5">
              <p className="break-words font-display text-[20px] leading-snug tracking-tight">{subject || <span className="text-ink-3">No subject yet</span>}</p>
            </div>
            <div className="perforation" />
            <div className="p-3">
              <EmailPreview format={format} body={body} height={480} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
