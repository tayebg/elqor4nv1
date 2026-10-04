import { SlideFrame } from "./SlideFrame";
import { useSettings, useResolvedBranding } from "@/lib/settings";
import { BrandGroup, useBrandHandles } from "@/components/BrandGroup";

interface Props {
  slideId: string;
}

export function ClosingSlide({ slideId }: Props) {
  const { quran, collaboration } = useSettings();
  // Global branding source of truth: empty when the user chose "username only".
  const { logoUrl } = useResolvedBranding();
  const { line: handleLine } = useBrandHandles();
  const closingDua = quran.closingDua;
  return (
    <SlideFrame id={slideId}>
      <div className="absolute inset-0 flex flex-col items-center justify-between px-24 py-32 text-center">
        {collaboration || !logoUrl ? (
          <div className="h-48" />
        ) : (
          <img
            src={logoUrl}
            alt="الشعار"
            className="h-48 w-48 object-contain"
            crossOrigin="anonymous"
            style={{ filter: "brightness(0) saturate(100%)" }}
          />
        )}
        <div
          className="warsh-text text-[64px] text-[color:var(--ink)]"
          style={{ lineHeight: 1.7 }}
        >
          {closingDua}
        </div>
        <div className="space-y-6">
          <div className="warsh-text text-[30px] tracking-[0.15em] text-[color:var(--emerald)]">
            تابعنا · إنستغرام · تيك توك · فيسبوك
          </div>
          {collaboration ? (
            <BrandGroup
              size={80}
              fontSize={44}
              logoFilter="brightness(0) saturate(100%)"
              color="var(--ink)"
            />
          ) : (
            <div
              className="text-[44px] tracking-[0.25em] text-[color:var(--ink)]"
              style={{ fontWeight: 600, direction: "ltr" }}
              dir="ltr"
            >
              {handleLine}
            </div>
          )}
        </div>
      </div>
    </SlideFrame>
  );
}
