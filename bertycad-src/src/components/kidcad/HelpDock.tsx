import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Box,
  Check,
  Copy,
  Cylinder,
  HelpCircle,
  Languages,
  Library,
  Maximize2,
  Move,
  RotateCw,
  Save,
  Sparkles,
  Undo2,
  X,
  AlignHorizontalJustifyStart,
  Circle,
  MousePointer2,
} from "lucide-react";
import {
  CURRICULUM_QUIZ,
  HELP_GALLERY_FAMILIES,
  HELP_TIP_EN,
  HELP_TIP_ES,
  HOME_TILES,
  QUIZ_PASS,
  TOOL_CARDS,
  TRY_CARDS,
  WORD_CARDS,
  quizPassed,
} from "@/lib/kidcad/help";
import { useT } from "@/lib/kidcad/i18n";
import { useKid } from "@/lib/kidcad/store";
import { IsoThumb, galleryKind } from "./IsoThumb";

const TAP = "inline-flex min-h-11 min-w-11 items-center justify-center";

export function HelpDock({ compact = false }: { compact?: boolean }) {
  const tab = useKid((s) => s.helpTab);
  const es = useKid((s) => s.esTips);
  const setHelpOpen = useKid((s) => s.setHelpOpen);
  const setHelpTab = useKid((s) => s.setHelpTab);
  const setEsTips = useKid((s) => s.setEsTips);
  const tipSeen = useKid((s) => s.helpTipSeen);
  const highContrast = useKid((s) => s.highContrast);
  const bigType = useKid((s) => s.bigType);

  return (
    <aside
      className={`flex h-full min-h-0 flex-col border-line bg-paper text-ink ${compact ? "border-t" : "border-l"}`}
      data-testid="help-dock"
      aria-label="Help"
    >
      <div className="flex flex-wrap items-center gap-1 border-b border-line px-2 py-1.5">
        <HelpCircle className="size-5 shrink-0 text-cerulean" aria-hidden />
        <div className="min-w-0 flex-1 text-sm font-semibold text-ink">Help</div>
        <button
          type="button"
          className={`${TAP} rounded-lg px-2 text-xs font-semibold ${es ? "bg-teal text-paper" : "border border-line bg-paper-2 text-ink"}`}
          onClick={() => setEsTips(!es)}
          data-testid="es-tips"
          aria-pressed={es}
        >
          <Languages className="size-4" aria-hidden />
          ES
        </button>
        <button
          type="button"
          className={`${TAP} rounded-lg px-2 text-xs font-semibold ${bigType ? "bg-ok text-paper" : "border border-line bg-paper-2 text-ink"}`}
          onClick={() => useKid.getState().setBigType(!bigType)}
          aria-pressed={bigType}
        >
          Big
        </button>
        <button
          type="button"
          className={`${TAP} rounded-lg px-2 text-xs font-semibold ${highContrast ? "bg-ok text-paper" : "border border-line bg-paper-2 text-ink"}`}
          onClick={() => useKid.getState().setHighContrast(!highContrast)}
          aria-pressed={highContrast}
        >
          Contrast
        </button>
        {tab !== "home" ? (
          <button
            type="button"
            className={`${TAP} gap-1 rounded-lg border border-line bg-paper-2 px-2 text-xs font-semibold text-ink`}
            onClick={() => setHelpTab("home")}
            data-testid="help-back"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back
          </button>
        ) : null}
        <button
          type="button"
          className={`${TAP} gap-1 rounded-lg border border-line bg-paper-2 px-2 text-xs font-semibold text-ink`}
          onClick={() => setHelpOpen(false)}
          data-testid="help-close"
        >
          <X className="size-4" aria-hidden />
          Close
        </button>
      </div>
      {!tipSeen ? <FirstOpenTip compact={compact} /> : null}
      <div className={`min-h-0 flex-1 overflow-auto ${compact ? "p-1" : "p-3"}`}>
        {tab === "home" ? <HomePanel compact={compact} /> : null}
        {tab === "tools" ? <ToolsPanel /> : null}
        {tab === "words" ? <WordsPanel /> : null}
        {tab === "try" ? <TryPanel /> : null}
        {tab === "gallery" ? <GalleryHelpPanel /> : null}
        {tab === "quiz" ? <QuizPanel /> : null}
      </div>
    </aside>
  );
}

function FirstOpenTip({ compact }: { compact: boolean }) {
  const es = useKid((s) => s.esTips);
  const tip = es ? HELP_TIP_ES : HELP_TIP_EN;
  return (
    <div
      className="flex items-center gap-2 border-b border-line bg-paper-2 px-3 py-2"
      data-testid="help-first-tip"
    >
      <HelpCircle className="size-7 shrink-0 text-cerulean" aria-hidden />
      <p className={`min-w-0 flex-1 font-semibold text-ink ${compact ? "text-sm" : "text-base"}`}>{tip}</p>
      <button
        type="button"
        className={`${TAP} rounded-lg bg-navy px-3 text-xs font-semibold text-paper`}
        onClick={() => useKid.getState().dismissHelpTip()}
        data-testid="help-tip-dismiss"
      >
        Got it
      </button>
    </div>
  );
}

function HomePanel({ compact }: { compact: boolean }) {
  const es = useKid((s) => s.esTips);
  const setHelpTab = useKid((s) => s.setHelpTab);
  const setLeftTab = useKid((s) => s.setLeftTab);
  const t = useT();
  return (
    <div className={`kidcad-help-home grid ${compact ? "grid-cols-5 gap-1" : "grid-cols-2 gap-2"}`}>
      <p className="col-span-full text-xs font-semibold text-navy">
        {t("news")}
      </p>
      <p className="col-span-full text-xs text-ink">🎧 {es ? "Los lectores oyen la vista 3D." : "Screen readers hear the 3D view."}
      </p>
      {HOME_TILES.map((t) => (
        <button
          key={t.id}
          type="button"
          data-testid={`help-home-${t.id}`}
          className={`flex flex-col items-center justify-center rounded-2xl border border-line bg-paper-2 px-2 text-center ${compact ? "min-h-14 py-1" : "min-h-24 gap-1 py-4"}`}
          onClick={() => {
            useKid.getState().dismissHelpTip();
            setHelpTab(t.id);
            if (t.id === "gallery") setLeftTab("gallery");
          }}
        >
          <HomeGlyph id={t.id} />
          <span className="text-sm font-semibold text-ink">{t.en}</span>
          {compact ? null : <span className="text-xs text-muted">{es ? t.lineEs : t.lineEn}</span>}
        </button>
      ))}
    </div>
  );
}

function HomeGlyph({ id }: { id: string }) {
  const cls = "size-8 text-cerulean";
  if (id === "tools") return <Move className={cls} aria-hidden />;
  if (id === "words") return <BookOpen className={cls} aria-hidden />;
  if (id === "try") return <Sparkles className={cls} aria-hidden />;
  if (id === "gallery") return <Library className={cls} aria-hidden />;
  return <HelpCircle className={cls} aria-hidden />;
}

function ToolsPanel() {
  const es = useKid((s) => s.esTips);
  return (
    <div className="flex flex-col gap-2">
      {TOOL_CARDS.map((c) => (
        <article key={c.id} className="flex flex-col items-center rounded-2xl border border-line bg-paper-2 px-3 py-3">
          <ToolGlyph id={c.id} />
          <p className="mt-1 text-sm font-semibold text-ink">{c.en}</p>
          <p className="text-center text-sm text-ink">{c.lineEn}</p>
          {es ? <p className="text-center text-xs text-muted">{c.lineEs}</p> : null}
          <button
            type="button"
            className="mt-2 h-11 w-full rounded-lg bg-navy text-sm font-semibold text-paper"
            data-testid={`help-try-${c.id}`}
            onClick={() => useKid.getState().armHelp(c.arm)}
          >
            Try
          </button>
        </article>
      ))}
    </div>
  );
}

function WordsPanel() {
  const es = useKid((s) => s.esTips);
  return (
    <div className="flex flex-col gap-2">
      {WORD_CARDS.map((w) => (
        <article key={w.id} className="flex flex-col items-center rounded-2xl border border-line bg-paper-2 px-3 py-3">
          <WordGlyph id={w.id} />
          <p className="mt-1 text-sm font-semibold text-ink">{w.en}</p>
          <p className="text-center text-sm text-ink">{w.glossEn}</p>
          {es ? <p className="text-center text-xs text-muted">{w.tipEs}</p> : null}
        </article>
      ))}
    </div>
  );
}

function TryPanel() {
  const es = useKid((s) => s.esTips);
  const checks = useKid((s) => s.tryChecks);
  return (
    <div className="flex flex-col gap-2">
      {TRY_CARDS.map((t) => {
        const done = checks[t.id];
        return (
          <article key={t.id} className="flex flex-col items-center rounded-2xl border border-line bg-paper-2 px-3 py-3">
            <TryGlyph id={t.id} done={done} />
            <p className="mt-1 text-sm font-semibold text-ink">{t.en}</p>
            <p className="text-center text-sm text-ink">{t.doEn}</p>
            {es ? <p className="text-center text-xs text-muted">{t.doEs}</p> : null}
            {done ? (
              <p className="mt-2 flex h-11 w-full items-center justify-center rounded-lg bg-ok text-sm font-semibold text-paper">
                <Check className="mr-1 size-4" aria-hidden /> Check
              </p>
            ) : (
              <div className="mt-2 flex w-full gap-1">
                <button
                  type="button"
                  className="h-11 flex-1 rounded-lg bg-gold text-sm font-semibold text-ink"
                  data-testid={`try-${t.id}`}
                  onClick={() => useKid.getState().seedTry(t.id)}
                >
                  Try
                </button>
                <button
                  type="button"
                  className="h-11 flex-1 rounded-lg border border-line bg-paper text-sm font-semibold text-ink"
                  data-testid={`try-check-${t.id}`}
                  onClick={() => useKid.getState().checkTry(t.id)}
                >
                  Check
                </button>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

function GalleryHelpPanel() {
  const es = useKid((s) => s.esTips);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-ink">{es ? "Pon. Luego cambia mm." : "Remix first. Then change mm."}</p>
      {HELP_GALLERY_FAMILIES.map((f) => (
        <section key={f.id} className="rounded-2xl border border-line bg-paper-2 p-3">
          <p className="text-sm font-semibold text-ink">{f.en}</p>
          <div className="mt-2 flex flex-col gap-2">
            {f.items.map((item) => (
              <article key={item.id} className="flex flex-col items-center rounded-xl bg-paper px-2 py-3">
                <div role="img" aria-label={item.name}>
                  <IsoThumb kind={galleryKind(item.id)} />
                </div>
                <p className="mt-1 text-sm font-semibold text-ink">{item.name}</p>
                <p className="text-xs text-ink">Level {item.difficulty}</p>
                <div className="mt-2 flex w-full gap-1">
                  <button
                    type="button"
                    className="h-11 flex-1 rounded-lg bg-navy text-sm font-semibold text-paper"
                    data-testid={`help-gallery-use-${item.id}`}
                    onClick={() => useKid.getState().useGallery(item.id)}
                  >
                    Use
                  </button>
                  <button
                    type="button"
                    className="h-11 flex-1 rounded-lg border border-line bg-paper-2 text-sm font-semibold text-ink"
                    data-testid={`help-gallery-edit-${item.id}`}
                    onClick={() => useKid.getState().editGallery(item.id)}
                  >
                    Edit
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function QuizPanel() {
  const es = useKid((s) => s.esTips);
  const curric = useKid((s) => s.curric);
  const ever = useKid((s) => s.quizEverPassed);
  const q = CURRICULUM_QUIZ[curric.index];
  const score = curric.correct.filter(Boolean).length;
  const picked = curric.picks[curric.index];
  const passed = quizPassed(curric.correct);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        {curric.index + 1} / {CURRICULUM_QUIZ.length}
      </p>
      <div className="grid place-items-center rounded-2xl bg-paper-2 py-3" role="img" aria-label={q.pic}>
        <QuizIcon id={q.pic} />
      </div>
      <p className="text-base font-semibold leading-snug text-ink">{es ? q.es : q.en}</p>
      <div className="flex flex-col gap-2">
        {q.options.map((o) => {
          const show = picked === o.id;
          const cls = !show
            ? "border-line bg-paper-2 text-ink"
            : o.ok
              ? "border-ok bg-ok text-paper"
              : "border-coral bg-coral text-paper";
          return (
            <button
              key={o.id}
              type="button"
              data-testid={`quiz-opt-${o.id}`}
              className={`flex min-h-11 flex-col items-center justify-center rounded-2xl border px-3 py-2 ${cls}`}
              onClick={() => useKid.getState().pickCurriculum(o.id)}
            >
              <span className="text-sm font-semibold">{es ? o.es : o.en}</span>
            </button>
          );
        })}
      </div>
      {picked ? (
        <p className={`text-sm font-semibold ${curric.correct[curric.index] ? "text-ok" : "text-coral"}`}>
          {curric.correct[curric.index] ? "Yes." : "Not that one. Retry is free."}
        </p>
      ) : null}
      <p className="text-sm text-ink">
        {score} / {CURRICULUM_QUIZ.length} · pass {QUIZ_PASS}
      </p>
      {passed || ever ? <p className="rounded-lg bg-ok/15 px-3 py-2 text-sm font-semibold text-ok">Pass. Save your file.</p> : null}
      <div className="flex gap-2">
        <button
          type="button"
          className="h-11 flex-1 rounded-lg border border-line bg-paper-2 font-semibold text-ink"
          disabled={curric.index === 0}
          onClick={() => useKid.getState().setQuizIndex(Math.max(0, curric.index - 1))}
        >
          Back
        </button>
        <button
          type="button"
          className="h-11 flex-1 rounded-lg bg-navy font-semibold text-paper"
          data-testid="quiz-next"
          onClick={() => useKid.getState().setQuizIndex(Math.min(CURRICULUM_QUIZ.length - 1, curric.index + 1))}
        >
          Next
          <ArrowRight className="ml-1 inline size-4" aria-hidden />
        </button>
      </div>
      <button type="button" className="h-11 rounded-lg bg-gold font-semibold text-ink" onClick={() => useKid.getState().startQuiz()} data-testid="start-quiz">
        Retake
      </button>
    </div>
  );
}

function ToolGlyph({ id }: { id: string }) {
  const cls = "size-8 text-cerulean";
  if (id === "select") return <MousePointer2 className={cls} aria-hidden />;
  if (id === "move") return <Move className={cls} aria-hidden />;
  if (id === "rotate") return <RotateCw className={cls} aria-hidden />;
  if (id === "scale") return <Maximize2 className={cls} aria-hidden />;
  if (id === "box") return <Box className={cls} aria-hidden />;
  if (id === "cyl") return <Cylinder className={cls} aria-hidden />;
  if (id === "hole") return <Circle className={cls} aria-hidden />;
  if (id === "group") return <Sparkles className={cls} aria-hidden />;
  if (id === "align") return <AlignHorizontalJustifyStart className={cls} aria-hidden />;
  if (id === "duplicate") return <Copy className={cls} aria-hidden />;
  if (id === "undo") return <Undo2 className={cls} aria-hidden />;
  return <Save className={cls} aria-hidden />;
}

function WordGlyph({ id }: { id: string }) {
  return <ToolGlyph id={id === "workplane" ? "select" : id === "extrude" ? "scale" : id === "axis" ? "move" : id === "gallery" ? "box" : id} />;
}

function TryGlyph({ id, done }: { id: string; done: boolean }) {
  const cls = `size-8 ${done ? "text-ok" : "text-cerulean"}`;
  if (id === "taller") return <Maximize2 className={cls} aria-hidden />;
  if (id === "hole") return <Circle className={cls} aria-hidden />;
  if (id === "group") return <Sparkles className={cls} aria-hidden />;
  if (id === "align") return <AlignHorizontalJustifyStart className={cls} aria-hidden />;
  return <Copy className={cls} aria-hidden />;
}

function QuizIcon({ id }: { id: string }) {
  if (id === "move") {
    return (
      <svg viewBox="0 0 72 72" className="size-16" aria-hidden>
        <rect x="26" y="26" width="20" height="20" rx="3" fill="#c9a227" />
        <path d="M36 10 l6 10 h-12 z" fill="#0b3a66" />
        <path d="M36 62 l-6-10 h12 z" fill="#0b3a66" />
        <path d="M10 36 l10-6 v12 z" fill="#0b3a66" />
        <path d="M62 36 l-10 6 v-12 z" fill="#0b3a66" />
      </svg>
    );
  }
  return <ToolGlyph id={id === "gallery" ? "box" : id} />;
}
