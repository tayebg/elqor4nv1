import { useSettings, useResolvedBranding } from "@/lib/settings";
import { AutoFitText } from "@/components/AutoFitText";
import { HijriBadge } from "@/components/HijriBadge";
import { BrandGroup, useBrandHandles } from "@/components/BrandGroup";
import type { HisnChapter } from "@/lib/hisn";
import type { ReactNode } from "react";

function Frame({ id, children }: { id: string; children: ReactNode }) {
  return (
    <div
      id={id}
      className="slide-canvas"
      style={{
        background:
          "linear-gradient(160deg, #0a1530 0%, #161f4a 55%, #0a1530 100%)",
        color: "#eaf0ff",
      }}
    >
      <div
        className="absolute inset-6 rounded-md pointer-events-none"
        style={{ border: "1px solid rgba(230,200,120,0.35)" }}
      />
      <div
        className="absolute inset-10 rounded-sm pointer-events-none"
        style={{ border: "1px solid rgba(234,240,255,0.08)" }}
      />
      {children}
    </div>
  );
}

interface CoverProps {
  chapter: HisnChapter;
  slideId: string;
}

export function HisnCoverSlide({ chapter, slideId }: CoverProps) {
  const { collaboration } = useSettings();
  // Global branding source of truth: empty when the user chose "username only".
  const { logoUrl } = useResolvedBranding();
  const { line: handleLine } = useBrandHandles();
  return (
    <Frame id={slideId}>
      <div className="absolute inset-0 flex flex-col items-center justify-between px-24 py-32 text-center">
        <div className="flex flex-col items-center gap-6">
          {!collaboration && logoUrl && (
          <img
            src={logoUrl}
            alt="الشعار"
            className="h-40 w-40 object-contain"
            crossOrigin="anonymous"
            style={{ filter: "brightness(0) invert(1)" }}
          />
          )}
          <HijriBadge color="rgba(234,240,255,0.85)" accent="#e6c878" fontSize={28} />
        </div>
        <div className="space-y-10">
          <div
            className="warsh-text text-[40px] tracking-[0.15em]"
            style={{ color: "#e6c878" }}
          >
            حِصْنُ الْيَوْم
          </div>
          <div
            className="warsh-text text-[88px]"
            style={{ color: "#eaf0ff", lineHeight: 1.3 }}
          >
            {chapter.title}
          </div>
          <div
            className="text-[34px]"
            style={{ color: "rgba(234,240,255,0.65)" }}
          >
            {chapter.items.length} {chapter.items.length === 1 ? "ذِكْر" : "أذكار"}
          </div>
        </div>
        {collaboration ? (
          <BrandGroup
            size={64}
            fontSize={36}
            logoFilter="brightness(0) invert(1)"
            color="rgba(234,240,255,0.9)"
          />
        ) : (
          <div
            className="text-[36px] tracking-[0.25em]"
            style={{ color: "rgba(234,240,255,0.9)", fontWeight: 600, direction: "ltr" }}
            dir="ltr"
          >
            {handleLine}
          </div>
        )}
      </div>
    </Frame>
  );
}


interface ItemProps {
  chapter: HisnChapter;
  itemIndex: number;
  slideId: string;
}

export function HisnItemSlide({ chapter, itemIndex, slideId }: ItemProps) {
  const item = chapter.items[itemIndex] as any;
  const { line: footerHandles } = useBrandHandles();
  return (
    <Frame id={slideId}>
      <header className="absolute top-16 left-0 right-0 flex items-center justify-between px-24">
        <span
          className="text-[28px] font-semibold tracking-wider"
          style={{ color: "#e6c878" }}
        >
          {itemIndex + 1} / {chapter.items.length}
        </span>
        <HijriBadge color="rgba(234,240,255,0.85)" accent="#e6c878" fontSize={26} />
      </header>

      {item.count && (
        <div className="absolute top-[130px] left-0 right-0 flex justify-center">
          <div className="bg-[#e6c878]/20 border border-[#e6c878]/40 text-[#e6c878] px-6 py-2 rounded-full font-bold text-2xl flex items-center gap-2" style={{ fontFamily: '"mobtakar", sans-serif', direction: 'rtl' }}>
            <span>التكرار:</span>
            <span>{item.count}</span>
          </div>
        </div>
      )}

      <div
        className="absolute left-0 right-0 flex flex-col justify-center"
        style={{ top: item.count ? 200 : 160, bottom: 100, paddingLeft: 120, paddingRight: 120 }}
      >
        <AutoFitText
          min={32}
          max={80}
          deps={`${chapter.index}-${itemIndex}-${item.text.length}`}
        >
          <div
            className="flex flex-col justify-center"
            style={{ 
              color: "#eaf0ff", 
              lineHeight: 2, 
              direction: 'rtl', 
              textAlign: 'center' 
            }}
          >
            <div
              className="warsh-text text-center mb-8"
              style={{ color: "#e6c878" }}
            >
              — {
                chapter.items.length === 1 
                  ? `ذِكْرٌ وَارِدٌ فِي ${chapter.title}`
                  : chapter.items.length === 2 
                      ? `ذِكْرَانِ وَارِدَانِ فِي ${chapter.title}`
                      : chapter.items.length <= 10 
                          ? `${chapter.items.length} أذْكَارٍ وَارِدَةٍ فِي ${chapter.title}`
                          : `${chapter.items.length} ذِكْرًا وَارِدًا فِي ${chapter.title}`
              } —
            </div>
            <div className="warsh-text">
              {item.text.replace(/[*_-]/g, '').trim()}
            </div>
          </div>
        </AutoFitText>
      </div>

      <footer
        className="absolute bottom-8 left-0 right-0 text-center text-[18px] tracking-[0.2em]"
        style={{ color: "rgba(234,240,255,0.45)" }}
      >
        <span dir="ltr" style={{ unicodeBidi: "isolate", display: "inline-block" }}>{footerHandles}</span> · حصن المسلم
      </footer>
    </Frame>
  );
}

export function HisnClosingSlide({ slideId }: { slideId: string }) {
  const { hisn, collaboration } = useSettings();
  // Global branding source of truth: empty when the user chose "username only".
  const { logoUrl } = useResolvedBranding();
  const { line: handleLine } = useBrandHandles();
  return (
    <Frame id={slideId}>
      <div className="absolute inset-0 flex flex-col items-center justify-between px-24 py-32 text-center">
        {collaboration || !logoUrl ? (
          <div className="h-44" />
        ) : (
          <img
            src={logoUrl}
            alt="الشعار"
            className="h-44 w-44 object-contain"
            crossOrigin="anonymous"
            style={{ filter: "brightness(0) invert(1)" }}
          />
        )}
        <div
          className="warsh-text text-[58px]"
          style={{ color: "#eaf0ff", lineHeight: 1.7 }}
        >
          {hisn.closingDua}
        </div>
        <div className="space-y-6">
          <div
            className="warsh-text text-[30px] tracking-[0.15em]"
            style={{ color: "#e6c878" }}
          >
            تابعنا · إنستغرام · تيك توك · فيسبوك
          </div>
          {collaboration ? (
            <BrandGroup
              size={72}
              fontSize={42}
              logoFilter="brightness(0) invert(1)"
              color="#eaf0ff"
            />
          ) : (
            <div
              className="text-[42px] tracking-[0.25em]"
              style={{ color: "#eaf0ff", fontWeight: 600, direction: "ltr" }}
              dir="ltr"
            >
              {handleLine}
            </div>
          )}
        </div>
      </div>
    </Frame>
  );
}

