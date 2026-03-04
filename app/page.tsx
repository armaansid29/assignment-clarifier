"use client";

import { useMemo, useState } from "react";

type ClarifyResult = {
  summary_plain: string;
  requirements: string[];
  deliverables: string[];
  constraints: string[];
  step_by_step_plan: string[];
  checklist: string[];
  questions_for_teacher: string[];
  common_pitfalls: string[];
  rubric_suggestion?: { criterion: string; points: number; what_good_looks_like: string }[];
  policy_flags?: string[];
};

const EXAMPLE_PROMPT = `AP Computer Science A Assignment: Library Book Tracker (Java)

Goal:
Build a small console program that helps a librarian track which books are checked out.

Requirements:
- Create a Book class with fields: title (String), author (String), isCheckedOut (boolean)
- Create a Library class that stores a collection of Book objects
- Implement these features:
  1) Add a new book
  2) Search for a book by title (case-insensitive)
  3) Check out a book (mark isCheckedOut = true)
  4) Return a book (mark isCheckedOut = false)
  5) Print all books, showing their checkout status

Constraints:
- Use ArrayList for the collection
- Do not use any external libraries beyond standard Java
- Your program must not crash on invalid input (e.g., non-numeric menu choice)

Deliverables:
- Submit Book.java and Library.java
- Submit Main.java that demonstrates all features
- Include a short reflection (6–10 sentences) describing:
  - one design decision you made
  - one edge case you handled
  - one improvement you would implement next`;

export default function Page() {
  const [prompt, setPrompt] = useState("");
  const [gradeLevel, setGradeLevel] = useState("High school");
  const [language, setLanguage] = useState("C / C++");
  const [teacherSafe, setTeacherSafe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<ClarifyResult | null>(null);

  const canGenerate = useMemo(() => prompt.trim().length >= 20, [prompt]);

  async function onGenerate() {
    setErr(null);
    setData(null);
    setLoading(true);
    try {
      const res = await fetch("/api/clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, gradeLevel, language, teacherSafe }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed: ${res.status}`);
      }
      const json = (await res.json()) as ClarifyResult;
      setData(json);
    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function copyChecklist() {
    if (!data?.checklist?.length) return;
    await navigator.clipboard.writeText(data.checklist.map((x) => `- ${x}`).join("\n"));
  }

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50 antialiased">
      {/* soft glow background */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_60%),radial-gradient(circle_at_bottom,_rgba(129,140,248,0.2),_transparent_55%)]" />

      <div className="relative mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/50 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-100 shadow-sm shadow-sky-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
              For students who want less stress and clearer assignments
            </div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Briefly
            </h1>
            <p className="max-w-2xl text-sm text-slate-300 md:text-base">
              Paste your assignment prompt and get a clean breakdown of what you actually have to do:
              a brief including requirements, deliverables, a game-plan, and a checklist you can follow.
            </p>
          </div>
          <div className="text-xs text-slate-400 md:text-right">
            <div className="font-medium text-slate-200">Study mode friendly</div>
            <div>No full solutions. Just clarity, planning, and structure.</div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          {/* LEFT */}
          <section className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-[0_22px_60px_rgba(15,23,42,0.85)] ring-1 ring-white/5 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-500/80">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Input</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Drop in the exact wording from your teacher or syllabus.
                </p>
              </div>
              <button
                className="rounded-full border border-slate-700/80 bg-slate-900/70 px-3.5 py-1.5 text-xs font-medium text-slate-200 shadow-sm transition hover:border-sky-400/80 hover:bg-slate-900 hover:text-sky-100"
                onClick={() => {
                  setPrompt(EXAMPLE_PROMPT);
                  setGradeLevel("AP / Advanced");
                  setLanguage("Java");
                }}
                type="button"
              >
                Try an example
              </button>
            </div>

            <label className="mt-4 block text-xs font-medium uppercase tracking-wide text-slate-300/90">
              Assignment prompt
            </label>
            <textarea
              className="mt-2 h-64 w-full resize-none rounded-2xl border border-slate-700/70 bg-slate-950/60 p-3 text-sm text-slate-50 outline-none shadow-inner shadow-slate-950/60 placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/60"
              placeholder="Paste your assignment instructions here…"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-300/90">
                  Grade level
                </label>
                <select
                  className="mt-2 w-full rounded-2xl border border-slate-700/70 bg-slate-950/60 p-2.5 text-sm text-slate-100 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                >
                  <option>Middle school</option>
                  <option>High school</option>
                  <option>AP / Advanced</option>
                  <option>College</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-300/90">
                  Language / subject
                </label>
                <select
                  className="mt-2 w-full rounded-2xl border border-slate-700/70 bg-slate-950/60 p-2.5 text-sm text-slate-100 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option>C / C++</option>
                  <option>Java</option>
                  <option>Python</option>
                  <option>JavaScript</option>
                  <option>Math</option>
                  <option>English / Writing</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-slate-700/70 bg-slate-950/60 p-3.5">
              <div>
                <div className="text-sm font-medium text-slate-100">Teacher-safe mode</div>
                <div className="text-xs text-slate-400">
                  Clarifies requirements and planning — avoids writing full solutions.
                </div>
              </div>
              <input
                type="checkbox"
                className="h-5 w-5 rounded-md border border-slate-500 bg-slate-900 text-sky-400 accent-sky-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500/60"
                checked={teacherSafe}
                onChange={(e) => setTeacherSafe(e.target.checked)}
              />
            </div>

            <button
              className="mt-5 w-full rounded-2xl bg-gradient-to-r from-sky-500 via-sky-400 to-indigo-400 px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_25px_rgba(56,189,248,0.65)] transition-all duration-300 hover:from-sky-400 hover:via-sky-300 hover:to-indigo-300 hover:shadow-[0_0_40px_rgba(56,189,248,0.9)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
              disabled={!canGenerate || loading}
              onClick={onGenerate}
              type="button"
            >
              {loading ? "Generating your breakdown…" : "Generate breakdown"}
            </button>

            {err && (
              <div className="mt-3 rounded-2xl border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-100 shadow-inner shadow-red-900/40">
                {err}
              </div>
            )}

            <div className="mt-4 text-xs text-slate-400">
              Always double-check the original prompt or rubric. This is a helper tool — your teacher&apos;s wording
              wins if there&apos;s a mismatch.
            </div>
          </section>

          {/* RIGHT */}
          <section className="rounded-3xl border border-slate-800/80 bg-slate-950/60 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.8)] ring-1 ring-white/5 backdrop-blur-md">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Output</h2>
                <p className="mt-1 text-xs text-slate-400">Everything you need to not miss points.</p>
              </div>
              <button
                className="rounded-full border border-slate-700/80 bg-slate-900/70 px-3.5 py-1.5 text-xs font-medium text-slate-200 shadow-sm transition hover:border-sky-400/80 hover:bg-slate-900 hover:text-sky-100 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-500"
                onClick={copyChecklist}
                disabled={!data?.checklist?.length}
                type="button"
              >
                Copy checklist
              </button>
            </div>

            {!data && (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-700/70 bg-slate-950/50 p-6 text-sm text-slate-400">
                Paste an assignment on the left and hit{" "}
                <span className="font-semibold text-sky-300">Generate breakdown</span>. Your summary, plan, and
                checklist will appear here.
              </div>
            )}

            {data && (
              <div className="mt-4 space-y-5 text-sm">
                {data.policy_flags?.length ? (
                  <div className="rounded-2xl border border-amber-400/60 bg-amber-500/10 p-3 text-amber-100 shadow-sm shadow-amber-500/30">
                    <div className="font-medium">Policy / instructions detected</div>
                    <ul className="mt-2 list-disc pl-5">
                      {data.policy_flags.map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <Block title="Plain-English summary" items={[data.summary_plain]} />

                <Block title="Requirements (extracted)" items={data.requirements} />
                <Block title="Deliverables" items={data.deliverables} />
                <Block title="Constraints" items={data.constraints} />
                <Block title="Step-by-step plan" items={data.step_by_step_plan} />
                <Block title="Checklist" items={data.checklist} />
                <Block title="Questions to ask your teacher" items={data.questions_for_teacher} />
                <Block title="Common pitfalls" items={data.common_pitfalls} />

                {data.rubric_suggestion?.length ? (
                  <div className="rounded-2xl border border-slate-700/70 bg-slate-950/70 p-3">
                    <div className="font-medium text-slate-100">Rubric suggestion</div>
                    <div className="mt-2 space-y-2">
                      {data.rubric_suggestion.map((r, i) => (
                        <div
                          key={i}
                          className="rounded-xl border border-slate-700/70 bg-slate-900/70 p-2.5 shadow-sm shadow-slate-900/80"
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-slate-50">{r.criterion}</div>
                            <div className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                              {r.points} pts
                            </div>
                          </div>
                          <div className="mt-1 text-slate-200">{r.what_good_looks_like}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </section>
        </div>

        <footer className="mt-10 text-xs text-slate-500">
          Built as a quick prototype to turn confusing assignment walls-of-text into clear steps you can actually act
          on.
        </footer>
      </div>
    </main>
  );
}

function Block({ title, items }: { title: string; items: string[] }) {
  const filtered = (items ?? []).map((x) => x.trim()).filter(Boolean);
  return (
    <div className="rounded-2xl border border-slate-700/70 bg-slate-950/70 p-3">
      <div className="font-medium text-slate-100">{title}</div>
      {filtered.length === 1 ? (
        <div className="mt-2 text-slate-100">{filtered[0]}</div>
      ) : (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-100">
          {filtered.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      )}
    </div>
  );
}