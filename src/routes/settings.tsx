import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  useSettings,
  DEFAULT_SECONDARY_LOGO,
  type BrandDisplay,
} from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, RotateCcw, LogOut, Check, Users } from "lucide-react";
import { ClientOnly } from "@/components/ClientOnly";
import { ArabicField } from "@/components/ArabicField";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useSettingsHydrated } from "@/lib/settings";

async function validateLogoTransparency(
  file: File,
): Promise<{ isValid: boolean; error?: string }> {
  if (file.type === "image/svg+xml") {
    const text = await file.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "image/svg+xml");
    const rects = doc.querySelectorAll("rect");
    for (let i = 0; i < rects.length; i++) {
      const rect = rects[i];
      const width = rect.getAttribute("width");
      const height = rect.getAttribute("height");
      const fill = rect.getAttribute("fill") || rect.style.fill;
      if (
        (width === "100%" && height === "100%") ||
        (rect.hasAttribute("width") &&
          rect.hasAttribute("height") &&
          !rect.hasAttribute("rx"))
      ) {
        if (fill && fill !== "none" && fill !== "transparent") {
          if (width === "100%" && height === "100%") {
            return {
              isValid: false,
              error:
                "الشعار يحتوي على خلفية صلبة غير شفافة (SVG). يرجى إزالة الخلفية.",
            };
          }
        }
      }
    }
    const svg = doc.querySelector("svg");
    if (svg) {
      const bg = svg.style.background || svg.style.backgroundColor;
      if (bg && bg !== "none" && bg !== "transparent") {
        return {
          isValid: false,
          error:
            "الشعار يحتوي على خلفية صلبة غير شفافة (SVG). يرجى إزالة الخلفية.",
        };
      }
    }
    return { isValid: true };
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_DIM = 200;
        let w = img.width,
          h = img.height;
        if (w > MAX_DIM || h > MAX_DIM) {
          const ratio = Math.min(MAX_DIM / w, MAX_DIM / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return resolve({ isValid: true });
        ctx.drawImage(img, 0, 0, w, h);
        try {
          const imageData = ctx.getImageData(0, 0, w, h).data;
          let hasTransparent = false;
          for (let i = 3; i < imageData.length; i += 4) {
            if (imageData[i] < 250) {
              hasTransparent = true;
              break;
            }
          }
          if (hasTransparent) resolve({ isValid: true });
          else
            resolve({
              isValid: false,
              error:
                "الشعار لا يحتوي على أي خلفية شفافة. يرجى استخدام صورة مفرغة حقاً بدون خلفية بيضاء أو سوداء.",
            });
        } catch (err) {
          resolve({ isValid: true });
        }
      };
      img.onerror = () =>
        resolve({ isValid: false, error: "تعذر قراءة الصورة." });
      img.src = e.target?.result as string;
    };
    reader.onerror = () =>
      resolve({ isValid: false, error: "تعذر قراءة الملف." });
    reader.readAsDataURL(file);
  });
}

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "الإعدادات · ELQOR4N" },
      { name: "description", content: "الهوية والإعدادات المخصصة لكل مولّد." },
      { property: "og:title", content: "الإعدادات · ELQOR4N" },
      {
        property: "og:description",
        content: "الهوية والإعدادات المخصصة لكل مولّد.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
      <SettingsGate />
    </ClientOnly>
  ),
});

function SettingsGate() {
  const ready = useSettingsHydrated();
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        جارٍ التحميل…
      </div>
    );
  }
  return <SettingsPage />;
}

const TABS = [
  { id: "account", label: "الحساب" },
  { id: "branding", label: "الهوية" },
  { id: "collaboration", label: "التعاون" },
  { id: "appearance", label: "المظهر" },
] as const;

/** Semantic section wrapper for consistent spacing / typography. */
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card/40 p-5 sm:p-6 space-y-4">
      <header className="space-y-1">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

type AppUser = {
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
};

function SettingsPage() {
  const s = useSettings();
  const fileRef = useRef<HTMLInputElement>(null);
  const secondaryFileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("account");
  // Cloud sign-in is not wired up yet; identity is stored locally on this device.
  const [user] = useState<AppUser | null>(null);
  const logout = () => {};

  const readAsDataURL = async (f: File, cb: (v: string) => void) => {
    const validation = await validateLogoTransparency(f);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => cb(String(reader.result));
    reader.readAsDataURL(f);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        {/* Balanced horizontal row: 4 tabs share the full width equally on
            all screen sizes. Overflow no longer scrolls because every tab
            can shrink to its share of the row. */}
        <nav className="grid grid-cols-4 gap-1.5 border-b border-border pb-3">
          {TABS.map((tabDef) => (
            <button
              key={tabDef.id}
              onClick={() => setTab(tabDef.id)}
              className={`min-w-0 px-2 py-1.5 text-sm rounded-md truncate transition text-center ${
                tab === tabDef.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {tabDef.label}
            </button>
          ))}
        </nav>

        {tab === "account" && (
          <Section
            title="حساب Google"
            description="سجّل الدخول بحساب Google لحفظ هويتك عبر أجهزتك. سيتم استعادة الشعار واسم المستخدم وتفضيلات التعاون تلقائيًا عند تسجيل الدخول لاحقًا."
          >
            {user ? (
              <div className="flex items-center gap-4">
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="h-14 w-14 rounded-full border border-border"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {user.displayName ?? user.email}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
                <Button variant="ghost" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" /> تسجيل الخروج
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center gap-3 py-2">
                <Button disabled className="cursor-not-allowed opacity-70">
                  <GoogleGlyph /> تسجيل الدخول عبر Google
                  <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    قريبًا
                  </span>
                </Button>
                <p className="text-xs text-muted-foreground max-w-sm">
                  تسجيل الدخول عبر Google معطّل مؤقتًا حتى اكتمال التكامل. تُحفظ
                  هويتك حاليًا على هذا الجهاز.
                </p>
              </div>
            )}
          </Section>
        )}

        {tab === "branding" && (
          <div className="space-y-5">
            <Section
              title="الشعار"
              description="أضف شعاراً بخلفية شفافة (PNG / SVG) لتجنب ظهوره كمربع مصمت."
            >
              <div className="flex items-center gap-6 flex-wrap">
                <div className="h-28 w-28 bg-card border border-border rounded-md flex items-center justify-center overflow-hidden">
                  <img
                    src={s.logoUrl}
                    alt="الشعار الحالي"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) readAsDataURL(f, s.setLogo);
                    }}
                  />
                  <Button onClick={() => fileRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    رفع شعار
                  </Button>
                  <Button variant="ghost" onClick={s.resetLogo}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    استعادة الافتراضي
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={!s.username.replace(/@/g, "").trim()}
                    onClick={() => {
                      if (!s.username.replace(/@/g, "").trim()) return;
                      s.setLogo("");
                      s.setBrandDisplay("name");
                    }}
                  >
                    إزالة الشعار (الاسم فقط)
                  </Button>
                </div>
              </div>
            </Section>

            <Section
              title="الهوية"
              description="تظهر في أغلفة المنشورات والخواتم والعلامات المائية وأغلفة الريلز."
            >
              <div className="space-y-2">
                <Label htmlFor="u">اسم المستخدم / المعرّف</Label>
                <Input
                  id="u"
                  value={s.username}
                  onChange={(e) => s.setUsername(e.target.value)}
                />
              </div>

              <DisplayPicker
                value={s.brandDisplay}
                onChange={s.setBrandDisplay}
                label="ما الذي يظهر في المنشورات؟"
                hasLogo={!!s.logoUrl.trim()}
                hasName={!!s.username.replace(/@/g, "").trim()}
              />
            </Section>

            {user && (
              <p className="text-xs text-muted-foreground">
                محفوظ في حساب Google الخاص بك: <strong>{user.email}</strong>
              </p>
            )}
          </div>
        )}

        {tab === "collaboration" && (
          <div className="space-y-5">
            <Section
              title="وضع التعاون"
              description="عند تفعيله، يظهر في كل مولّد شعارك ومعرّفك بجانب شعار ومعرّف الطرف الثاني مفصولين بعلامة ×."
            >
              <button
                type="button"
                role="switch"
                aria-checked={s.collaboration}
                onClick={() => s.setCollaboration(!s.collaboration)}
                className={`group w-full flex items-center gap-4 rounded-xl border p-4 text-start transition-colors ${
                  s.collaboration
                    ? "border-primary/60 bg-primary/5"
                    : "border-border bg-card/40 hover:bg-muted/40"
                }`}
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg transition-colors ${
                    s.collaboration
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Users className="h-5 w-5" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium">
                    {s.collaboration
                      ? "وضع التعاون مُفعّل"
                      : "وضع التعاون معطّل"}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    عرض علامتين جنبًا إلى جنب في كل المخرجات.
                  </span>
                </span>
                <span
                  aria-hidden
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    s.collaboration ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-all ${
                      s.collaboration ? "start-[1.375rem]" : "start-0.5"
                    }`}
                  />
                </span>
              </button>
            </Section>

            <Section
              title="العلامة الثانية"
              description="أضف شعاراً بخلفية شفافة (PNG / SVG) لتجنب ظهوره كمربع مصمت."
            >
              <div className="flex items-center gap-6 flex-wrap">
                <div className="h-24 w-24 bg-card border border-border rounded-md flex items-center justify-center overflow-hidden">
                  <img
                    src={s.secondaryLogoUrl}
                    alt=""
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    ref={secondaryFileRef}
                    type="file"
                    accept="image/png,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) readAsDataURL(f, s.setSecondaryLogo);
                    }}
                  />
                  <Button onClick={() => secondaryFileRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    رفع الشعار الثاني
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => s.setSecondaryLogo(DEFAULT_SECONDARY_LOGO)}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    استعادة الافتراضي
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={!s.secondaryUsername.replace(/@/g, "").trim()}
                    onClick={() => {
                      if (!s.secondaryUsername.replace(/@/g, "").trim()) return;
                      s.setSecondaryLogo("");
                      s.setSecondaryDisplay("name");
                    }}
                  >
                    إزالة الشعار (الاسم فقط)
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>اسم المستخدم الثاني / المعرّف</Label>
                <Input
                  value={s.secondaryUsername}
                  onChange={(e) => s.setSecondaryUsername(e.target.value)}
                />
              </div>
              <DisplayPicker
                value={s.secondaryDisplay}
                onChange={s.setSecondaryDisplay}
                label="ما الذي يظهر للعلامة الثانية؟"
                hasLogo={!!s.secondaryLogoUrl.trim()}
                hasName={!!s.secondaryUsername.replace(/@/g, "").trim()}
              />

              <div className="rounded-md border border-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground mb-2">معاينة</p>
                <div className="flex items-center justify-center gap-4">
                  <BrandPreview
                    logo={s.logoUrl}
                    name={s.username}
                    display={s.brandDisplay}
                  />
                  <span className="text-muted-foreground text-lg">×</span>
                  <BrandPreview
                    logo={s.secondaryLogoUrl}
                    name={s.secondaryUsername}
                    display={s.secondaryDisplay}
                  />
                </div>
              </div>
            </Section>
          </div>
        )}

        {tab === "appearance" && (
          <Section
            title="المظهر"
            description="التبديل بين المظهر الفاتح والداكن."
          >
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <span className="text-sm text-muted-foreground">
                اضغط للتبديل بين الفاتح / الداكن.
              </span>
            </div>
            <div className="pt-4 border-t border-border mt-4">
              <Button
                variant="destructive"
                onClick={() => {
                  if (
                    confirm(
                      "هل أنت متأكد من مسح جميع البيانات؟ سيؤدي ذلك إلى إعادة التطبيق لحالته الأصلية.",
                    )
                  ) {
                    s.clearAllData();
                  }
                }}
              >
                مسح جميع البيانات
              </Button>
            </div>
          </Section>
        )}
      </main>
    </div>
  );
}

const DISPLAY_OPTIONS: { id: BrandDisplay; label: string }[] = [
  { id: "both", label: "الشعار + الاسم" },
  { id: "logo", label: "الشعار فقط" },
  { id: "name", label: "الاسم فقط" },
];

/**
 * Segmented control for choosing which brand elements render.
 * The store guarantees a block is never fully blank — if the chosen
 * element is missing, the logo is rendered as the safe fallback.
 */
function DisplayPicker({
  value,
  onChange,
  label,
  hasLogo,
  hasName,
}: {
  value: BrandDisplay;
  onChange: (v: BrandDisplay) => void;
  label: string;
  hasLogo?: boolean;
  hasName?: boolean;
}) {
  // At least one element must stay visible: block a mode whose only element
  // is missing (e.g. "logo only" with no logo uploaded).
  const blocked = (id: BrandDisplay) =>
    (id === "logo" && hasLogo === false) ||
    (id === "name" && hasName === false);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="grid grid-cols-1 gap-2 rounded-xl border border-border bg-muted/30 p-2 sm:grid-cols-3">
        {DISPLAY_OPTIONS.map((opt) => {
          const active = value === opt.id;
          const disabled = blocked(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                if (disabled) return;
                onChange(opt.id);
              }}
              aria-pressed={active}
              disabled={disabled}
              className={`flex w-full min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : disabled
                    ? "cursor-not-allowed text-muted-foreground/50"
                    : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {active && <Check className="h-4 w-4 shrink-0" />}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground">
        لا يمكن إخفاء الشعار والاسم معًا — يبقى عنصر واحد ظاهرًا دائمًا.
      </p>
    </div>
  );
}

function BrandPreview({
  logo,
  name,
  display,
}: {
  logo: string;
  name: string;
  display: BrandDisplay;
}) {
  const showName = display !== "logo" && !!name.replace(/@/g, "").trim();
  const showLogo = (display !== "name" && !!logo) || !showName;
  return (
    <div className="flex items-center gap-2">
      {showLogo && (
        <span className="h-8 w-8 rounded-md bg-card border border-border grid place-items-center overflow-hidden">
          <img src={logo} alt="" className="max-h-5 max-w-5 object-contain" />
        </span>
      )}
      {showName && (
        <span className="text-xs font-medium truncate max-w-[110px]">
          {name}
        </span>
      )}
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
