import { useSettings, useResolvedBranding } from "@/lib/settings";
import { AutoFitText } from "@/components/AutoFitText";
import { HijriBadge } from "@/components/HijriBadge";
import { BrandGroup, useBrandHandles } from "@/components/BrandGroup";
import { hadithTitleAr, type NawawiHadith } from "@/lib/nawawi";
import type { ReactNode } from "react";

function Frame({ id, children }: { id: string; children: ReactNode }) {
  return (
    <div
      id={id}
      className="slide-canvas"
      style={{
        background:
          "radial-gradient(circle at 50% 0%, #0f3a2e 0%, #082018 70%)",
        color: "#f4ecd6",
      }}
    >
      <div
        className="absolute inset-6 rounded-md pointer-events-none"
        style={{ border: "1px solid rgba(214,180,99,0.45)" }}
      />
      <div
        className="absolute inset-10 rounded-sm pointer-events-none"
        style={{ border: "1px solid rgba(244,236,214,0.08)" }}
      />
      {children}
    </div>
  );
}

interface ContentProps {
  hadith: NawawiHadith;
  pageText: string;
  pageNumber: number;
  totalPages: number;
  slideId: string;
}

export function NawawiContentSlide({
  hadith,
  pageText,
  pageNumber,
  totalPages,
  slideId,
}: ContentProps) {
  const isFirst = pageNumber === 1;
  const { line: footerHandles } = useBrandHandles();
  return (
    <Frame id={slideId}>
      <header className="absolute top-16 left-0 right-0 flex items-center justify-between px-24">
        <span
          className="text-[28px] font-semibold tracking-wider"
          style={{ color: "#d6b463" }}
        >
          {pageNumber} / {totalPages}
        </span>
        {isFirst ? (
          <HijriBadge color="rgba(244,236,214,0.85)" accent="#d6b463" fontSize={26} />
        ) : (
          <span className="warsh-text text-[44px]" style={{ color: "#f4ecd6" }}>
            {hadithTitleAr(hadith.index)}
          </span>
        )}
      </header>

      <div
        className="absolute left-0 right-0"
        style={{ top: 200, bottom: 140, paddingLeft: 96, paddingRight: 96 }}
      >
        <AutoFitText
          min={24}
          max={62}
          deps={`${hadith.index}-${pageNumber}-${pageText.length}`}
        >
          <div
            style={{ color: "#f4ecd6", lineHeight: 2, direction: 'rtl', textAlign: 'center' }}
          >
            {isFirst && (
              <div
                className="warsh-text text-center mb-8"
                style={{ color: "#d6b463", fontSize: "0.85em", fontWeight: 700 }}
              >
                — {hadithTitleAr(hadith.index)} —
              </div>
            )}
            <div style={{ fontFamily: '"mobtakar", sans-serif' }}>{pageText}</div>
            {pageNumber === totalPages && hadith.narrator && (
              <div
                className="text-center mt-8"
                style={{ color: "#d6b463", fontSize: "0.78em", fontFamily: '"mobtakar", sans-serif' }}
              >
                {hadith.narrator}
              </div>
            )}
          </div>
        </AutoFitText>
      </div>

      <footer
        className="absolute bottom-12 left-0 right-0 text-center text-[24px] tracking-[0.3em]"
        style={{ color: "rgba(244,236,214,0.55)" }}
      >
        <span dir="ltr" style={{ unicodeBidi: "isolate", display: "inline-block" }}>{footerHandles}</span> · الأربعون النووية
      </footer>
    </Frame>
  );
}

export function NawawiClosingSlide({ slideId }: { slideId: string }) {
  const { nawawi, collaboration } = useSettings();
  // Global branding source of truth: empty when the user chose "username only".
  const { logoUrl } = useResolvedBranding();
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
            style={{ filter: "brightness(0) invert(1) sepia(0.4) saturate(3) hue-rotate(5deg)" }}
          />
        )}
        <div
          className="warsh-text text-[60px]"
          style={{ color: "#f4ecd6", lineHeight: 1.7 }}
        >
          {nawawi.closingDua}
        </div>
        <div className="space-y-6">
          <div
            className="warsh-text text-[30px] tracking-[0.15em]"
            style={{ color: "#d6b463" }}
          >
            تابعنا · إنستغرام · تيك توك · فيسبوك
          </div>
          <BrandGroup
            size={72}
            fontSize={42}
            logoFilter="brightness(0) invert(1) sepia(0.4) saturate(3) hue-rotate(5deg)"
            color="#f4ecd6"
          />
        </div>
      </div>
    </Frame>
  );
}

