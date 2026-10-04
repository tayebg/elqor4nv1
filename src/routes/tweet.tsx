import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useSettings, formatHandle } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Download, Loader2, Upload, RotateCcw } from "lucide-react";
import { ClientOnly } from "@/components/ClientOnly";
import { captureNodeToBlob, triggerDownloadBlob } from "@/lib/export";
import { ShareMenu } from "@/components/ShareMenu";
import { TweetCard, TWEET_SIZE } from "@/components/tweet/TweetCard";
import { ScaledSlide } from "@/components/ScaledSlide";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { startDownload } from "@/lib/download-manager";

export const Route = createFileRoute("/tweet")({
  head: () => ({
    meta: [
      { title: "تَغْرِيدَة · ELQOR4N" },
      { name: "description", content: "مولد منشورات تويتر الكلاسيكية." },
    ],
  }),
  component: () => (
    <ClientOnly
      fallback={
        <div className="min-h-screen flex items-center justify-center text-muted-foreground">
          جارٍ التحميل…
        </div>
      }
    >
      <TweetPage />
    </ClientOnly>
  ),
});

const NODE_ID = "tweet-export";

function TweetPage() {
  const s = useSettings();
  const [text, setTextState] = useState(s.pageState.tweetText);
  const [saving, setSaving] = useState(false);
  const [collabBrand, setCollabBrand] = useState<"primary" | "secondary">(
    "primary",
  );
  const [textZoom, setTextZoomState] = useState(s.pageState.tweetZoom ?? 100);
  const [tweetImage, setTweetImageState] = useState<string | null>(
    s.pageState.tweetImage ?? null,
  );

  const setText = (v: string) => {
    setTextState(v);
    s.setPageState("tweetText", v);
  };
  const setTextZoom = (v: number) => {
    setTextZoomState(v);
    s.setPageState("tweetZoom", v);
  };
  const setTweetImage = (v: string | null) => {
    setTweetImageState(v);
    s.setPageState("tweetImage", v);
  };

  // Which brand's identity fills the header when Collaboration is on.
  const primaryHandle = formatHandle(s.username, "@elqor4n");
  const secondaryHandle = formatHandle(s.secondaryUsername, "@fajr_al_tilawa");
  const activeHandle =
    s.collaboration && collabBrand === "secondary"
      ? secondaryHandle
      : primaryHandle;
  const activeName =
    s.collaboration && collabBrand === "secondary"
      ? "فجر التلاوة"
      : s.tweet.displayName || "القرآن";

  const downloadRef = useRef<any>(null);

  const handleDownload = () => {
    downloadRef.current = startDownload({
      id: "tweet-export",
      label: "تنزيل التغريدة",
      filename: `tweet-${Date.now()}.png`,
      generateBlob: async (onProgress, signal) => {
        setSaving(true);
        try {
          const blob = await captureNodeToBlob(NODE_ID, {
            width: TWEET_SIZE,
            height: TWEET_SIZE,
            backgroundColor:
              s.tweet.theme === "light"
                ? "#ffffff"
                : s.tweet.theme === "dim"
                  ? "#15202b"
                  : "#000000",
          });
          return blob;
        } finally {
          setSaving(false);
        }
      },
    });
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
            <div className="space-y-1.5">
              <Label className="text-xs">حجم النص: {textZoom}%</Label>
              <input
                type="range"
                min={60}
                max={140}
                step={5}
                value={textZoom}
                onChange={(e) => setTextZoom(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">صورة التغريدة</Label>
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 rounded-md border border-border bg-card overflow-hidden grid place-items-center text-[10px] text-muted-foreground shrink-0">
                  {tweetImage ? (
                    <img
                      src={tweetImage}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    "لا توجد"
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <input
                    id="tweet-img"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const reader = new FileReader();
                      reader.onload = () =>
                        setTweetImage(String(reader.result));
                      reader.readAsDataURL(f);
                    }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      document.getElementById("tweet-img")?.click()
                    }
                  >
                    <Upload className="h-3.5 w-3.5 mr-2" />
                    رفع
                  </Button>
                  {tweetImage && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setTweetImage(null)}
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-2" />
                      إزالة
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card/40 p-4 space-y-3">
              <p className="text-xs font-medium text-foreground">
                نمط التغريدة
              </p>
              <div className="space-y-1.5">
                <Label className="text-xs">السمة</Label>
                <Select
                  value={String(s.tweet.theme)}
                  onValueChange={(v) =>
                    s.setTweet("theme", v as "light" | "dim" | "dark")
                  }
                >
                  <SelectTrigger className="w-full bg-background" dir="rtl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="light" dir="rtl">
                      فاتح (كلاسيكي)
                    </SelectItem>
                    <SelectItem value="dim" dir="rtl">
                      مُعتِم
                    </SelectItem>
                    <SelectItem value="dark" dir="rtl">
                      داكن
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={s.tweet.showTimestamp}
                  onChange={(e) =>
                    s.setTweet("showTimestamp", e.target.checked)
                  }
                />
                إظهار التاريخ والوقت
              </label>
            </div>
            {s.collaboration && (
              <div className="rounded-lg border border-border bg-card/40 p-4 space-y-2">
                <p className="text-xs font-medium text-foreground">
                  التعاون — أي حساب ينشر؟
                </p>
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
            <Button
              onClick={() => {
                if (saving && downloadRef.current) {
                  downloadRef.current.cancel();
                  downloadRef.current = null;
                } else {
                  handleDownload();
                }
              }}
              disabled={!downloadRef.current && saving}
              className="w-full"
              variant={saving ? "destructive" : "default"}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {saving ? "إلغاء التحميل (0%)" : "تنزيل PNG"}
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
                    s.tweet.theme === "light"
                      ? "#ffffff"
                      : s.tweet.theme === "dim"
                        ? "#15202b"
                        : "#000000",
                });
                return new File([blob], `tweet-${Date.now()}.png`, {
                  type: "image/png",
                });
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
                      textZoom={textZoom}
                      imageUrl={tweetImage}
                    />
                  </div>
                </div>
              </ScaledSlide>
            </div>
          </section>
        </div>
      </main>

      <div
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: -3000,
          pointerEvents: "none",
        }}
      >
        <TweetCard
          id={NODE_ID}
          text={text}
          displayName={activeName}
          handle={activeHandle.replace(/^@/, "")}
          theme={s.tweet.theme}
          showTimestamp={s.tweet.showTimestamp}
          avatarUrl={s.logoUrl}
          collabBrand={collabBrand}
          textZoom={textZoom}
          imageUrl={tweetImage}
        />
      </div>
    </div>
  );
}
