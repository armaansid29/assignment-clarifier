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
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Assignment Clarifier</h1>
          <p className="text-slate-600">
            Paste an assignment prompt → get a clear explanation, extracted requirements, and a submission checklist.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {/* LEFT */}
          <section className="rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Input</h2>
              <button
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50"
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

            <label className="mt-4 block text-sm font-medium text-slate-700">Assignment prompt</label>
            <textarea
              className="mt-2 h-64 w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              placeholder="Paste your assignment instructions here..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Grade level</label>
                <select
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-2 text-sm"
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
                <label className="block text-sm font-medium text-slate-700">Language / subject</label>
                <select
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-2 text-sm"
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

            <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 p-3">
              <div>
                <div className="text-sm font-medium">Teacher-safe mode</div>
                <div className="text-xs text-slate-600">
                  Clarifies requirements and planning — avoids writing full solutions.
                </div>
              </div>
              <input
                type="checkbox"
                className="h-5 w-5"
                checked={teacherSafe}
                onChange={(e) => setTeacherSafe(e.target.checked)}
              />
            </div>

            <button
              className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              disabled={!canGenerate || loading}
              onClick={onGenerate}
              type="button"
            >
              {loading ? "Generating..." : "Generate"}
            </button>

            {err && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {err}
              </div>
            )}

            <div className="mt-4 text-xs text-slate-500">
              Note: Always double-check the original prompt/rubric — this tool may miss hidden requirements.
            </div>
          </section>

          {/* RIGHT */}
          <section className="rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Output</h2>
              <button
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
                onClick={copyChecklist}
                disabled={!data?.checklist?.length}
                type="button"
              >
                Copy checklist
              </button>
            </div>

            {!data && (
              <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-600">
                Paste an assignment and click <span className="font-medium">Generate</span>.
              </div>
            )}

            {data && (
              <div className="mt-4 space-y-5 text-sm">
                {data.policy_flags?.length ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
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
                  <div className="rounded-xl border border-slate-200 p-3">
                    <div className="font-medium">Rubric suggestion</div>
                    <div className="mt-2 space-y-2">
                      {data.rubric_suggestion.map((r, i) => (
                        <div key={i} className="rounded-lg border border-slate-100 p-2">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{r.criterion}</div>
                            <div className="text-xs text-slate-600">{r.points} pts</div>
                          </div>
                          <div className="mt-1 text-slate-700">{r.what_good_looks_like}</div>
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
          Built as a quick prototype: clarifies prompts, extracts requirements, and helps students plan responsibly.
        </footer>
      </div>
    </main>
  );
}

function Block({ title, items }: { title: string; items: string[] }) {
  const filtered = (items ?? []).map((x) => x.trim()).filter(Boolean);
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="font-medium">{title}</div>
      {filtered.length === 1 ? (
        <div className="mt-2 text-slate-700">{filtered[0]}</div>
      ) : (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
          {filtered.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      )}
    </div>
  );
}