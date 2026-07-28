import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useSettings, formatHandle } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Download, Loader2 } from "lucide-react";
import { ClientOnly } from "@/components/ClientOnly";
import { captureNodeToBlob, triggerDownloadBlob } from "@/lib/export";
import { ShareMenu } from "@/components/ShareMenu";
import { TweetCard, TWEET_SIZE } from "@/components/tweet/TweetCard";
import { ScaledSlide } from "@/components/ScaledSlide";

export const Route = createFileRoute("/tweet")({
  head: () => ({
    meta: [
      { title: "تَغْرِيدَة · ELQOR4N" },
      { name: "description", content: "مولد منشورات تويتر الكلاسيكية." },
    ],
  }),
  component: () => (
    <ClientOnly fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">جارٍ التحميل…</div>}>
      <TweetPage />
    </ClientOnly>
  ),
});

const NODE_ID = "tweet-export";

function TweetPage() {
  const s = useSettings();
  const [text, setText] = useState(
    "قَالَ رَسُولُ اللَّهِ ﷺ:\n«إِنَّ اللَّهَ لَا يَنْظُرُ إِلَى صُوَرِكُمْ وَأَمْوَالِكُمْ، وَلَكِنْ يَنْظُرُ إِلَى قُلُوبِكُمْ وَأَعْمَالِكُمْ»",
  );
  const [saving, setSaving] = useState(false);
  const [collabBrand, setCollabBrand] = useState<"primary" | "secondary">("primary");

  // Which brand's identity fills the header when Collaboration is on.
  const primaryHandle = formatHandle(s.username, "@elqor4n");
  const secondaryHandle = formatHandle(s.secondaryUsername, "@fajr_al_tilawa");
  const activeHandle = s.collaboration && collabBrand === "secondary" ? secondaryHandle : primaryHandle;
  const activeName = s.collaboration && collabBrand === "secondary"
    ? "فجر التلاوة"
    : (s.tweet.displayName || "القرآن");

  const handleDownload = async () => {
    setSaving(true);
    try {
      const blob = await captureNodeToBlob(NODE_ID, {
        width: TWEET_SIZE,
        height: TWEET_SIZE,
        backgroundColor: s.tweet.theme === "light" ? "#ffffff" : s.tweet.theme === "dim" ? "#15202b" : "#000000",
      });
      triggerDownloadBlob(blob, `tweet-${Date.now()}.png`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col lg:grid lg:grid-cols-[320px_minmax(0,1fr)] gap-8">
        <aside className="space-y-5">
          <div>
            <Label>نص التغريدة</Label>
            <Textarea
              dir="rtl"
              rows={10}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="warsh-text text-lg"
            />
            <p className="text-xs text-muted-foreground mt-1">
              المؤلف والصورة الرمزية والمعرّف تُؤخذ من الإعدادات ← العلامة.
              السمة والتاريخ/الوقت في الإعدادات ← التغريدة.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card/40 p-4 space-y-3">
            <p className="text-xs font-medium text-foreground">نمط التغريدة</p>
            <div className="space-y-1.5">
              <Label className="text-xs">السمة</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={s.tweet.theme}
                onChange={(e) => s.setTweet("theme", e.target.value as "light" | "dim" | "dark")}
              >
                <option value="light">فاتح (كلاسيكي)</option>
                <option value="dim">مُعتِم</option>
                <option value="dark">داكن</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={s.tweet.showTimestamp}
                onChange={(e) => s.setTweet("showTimestamp", e.target.checked)}
              />
              إظهار التاريخ والوقت
            </label>
          </div>
          {s.collaboration && (
            <div className="rounded-lg border border-border bg-card/40 p-4 space-y-2">
              <p className="text-xs font-medium text-foreground">التعاون — أي حساب ينشر؟</p>
              <div className="grid grid-cols-2 gap-2">
                {(["primary", "secondary"] as const).map((b) => (
                  <button
                    key={b}
                    onClick={() => setCollabBrand(b)}
                    className={`px-3 py-2 text-xs rounded-md border truncate ${
                      collabBrand === b
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {b === "primary" ? primaryHandle : secondaryHandle}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                يُعرض حساب واحد فقط في البطاقة.
              </p>
            </div>
          )}
          <Button onClick={handleDownload} disabled={saving} className="w-full">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            تنزيل PNG
          </Button>
          <ShareMenu
            className="w-full"
            title="تغريدة"
            text={text.slice(0, 180)}
            getFile={async () => {
              const blob = await captureNodeToBlob(NODE_ID, {
                width: TWEET_SIZE,
                height: TWEET_SIZE,
                backgroundColor:
                  s.tweet.theme === "light" ? "#ffffff" : s.tweet.theme === "dim" ? "#15202b" : "#000000",
              });
              return new File([blob], `tweet-${Date.now()}.png`, { type: "image/png" });
            }}
          />
        </aside>

        <section className="w-full min-w-0">
          <div className="w-full max-w-md mx-auto">
            <ScaledSlide>
              <div style={{ width: 1080, height: 1080 }}>
                <div
                  style={{
                    width: TWEET_SIZE,
                    height: TWEET_SIZE,
                    transform: `scale(${1080 / TWEET_SIZE})`,
                    transformOrigin: "top left",
                  }}
                >
                  <TweetCard
                    id="tweet-preview"
                    text={text}
                    displayName={activeName}
                    handle={activeHandle.replace(/^@/, "")}
                    theme={s.tweet.theme}
                    showTimestamp={s.tweet.showTimestamp}
                    avatarUrl={s.logoUrl}
                    collabBrand={collabBrand}
                  />
                </div>
              </div>
            </ScaledSlide>
          </div>
        </section>
        </div>
      </main>

      <div aria-hidden style={{ position: "fixed", top: 0, left: -3000, pointerEvents: "none" }}>
        <TweetCard
          id={NODE_ID}
          text={text}
          displayName={activeName}
          handle={activeHandle.replace(/^@/, "")}
          theme={s.tweet.theme}
          showTimestamp={s.tweet.showTimestamp}
          avatarUrl={s.logoUrl}
          collabBrand={collabBrand}
        />
      </div>
    </div>
  );
}
