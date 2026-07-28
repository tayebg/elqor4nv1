import { SlideFrame } from "./SlideFrame";
import { useSettings, useResolvedBranding } from "@/lib/settings";
import { hizbTitleAr } from "@/lib/hizb-map";
import { HijriBadge } from "@/components/HijriBadge";
import { BrandGroup, useBrandHandles } from "@/components/BrandGroup";
import { AutoFitText } from "@/components/AutoFitText";

interface Props {
  hizb: number;
  slideId: string;
}

export function CoverSlide({ hizb, slideId }: Props) {
  const { quran, collaboration } = useSettings();
  // Global branding source of truth: empty when the user chose "username only".
  const { logoUrl } = useResolvedBranding();
  const { line: handleLine } = useBrandHandles();
  const { narration, isticadhah } = quran;
  return (
    <SlideFrame id={slideId}>
      <div className="absolute inset-0 flex flex-col items-center justify-between px-24 py-32 text-center">
        {/* In collaboration mode the personal logo is hidden — only the shared
            BrandGroup at the bottom represents the collab pair. */}
        <div className="flex flex-col items-center gap-6">
          {!collaboration && logoUrl && (
            <img
              src={logoUrl}
              alt=""
              className="h-48 w-48 object-contain"
              crossOrigin="anonymous"
              style={{ filter: "brightness(0) saturate(100%)" }}
            />
          )}
          <HijriBadge color="var(--ink)" accent="var(--gold)" fontSize={30} />
        </div>
        <div className="space-y-10">
          <div className="warsh-text text-[42px] tracking-[0.15em] text-[color:var(--emerald)]">
            حِزْبٌ كُلَّ يَوْم
          </div>
          {/* Title fits on a SINGLE line for every hizb (some — like
              "الحزب الحادي عشر" — are three words long). AutoFitText shrinks
              the font from 140 down until the whole title fits the 940px
              inner width without wrapping. */}
          <div style={{ width: 940, margin: "0 auto", height: 180 }}>
            <AutoFitText min={72} max={140} deps={`hizb-title-${hizb}`}>
              <div
                className="warsh-text text-[color:var(--ink)]"
                style={{ lineHeight: 1.15, whiteSpace: "nowrap", textAlign: "center" }}
              >
                {hizbTitleAr(hizb)}
              </div>
            </AutoFitText>
          </div>
          <div className="text-[36px] text-[color:var(--ink)]/70 warsh-text" style={{ lineHeight: 1.6 }}>
            {narration}
          </div>
          <div className="warsh-text text-[44px] text-[color:var(--gold)]" style={{ lineHeight: 1.5 }}>
            {isticadhah}
          </div>
        </div>
        {collaboration ? (
          <BrandGroup
            size={70}
            fontSize={38}
            logoFilter="brightness(0) saturate(100%)"
            color="var(--ink)"
          />
        ) : (
          <div
            className="text-[38px] tracking-[0.25em] text-[color:var(--ink)]"
            style={{ fontWeight: 600, direction: "ltr" }}
            dir="ltr"
          >
            {handleLine}
          </div>
        )}
      </div>
    </SlideFrame>
  );
}


