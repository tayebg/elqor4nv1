import { SlideFrame } from "./SlideFrame";
import { hizbTitleAr } from "@/lib/hizb-map";
import { RUB_HIZB, type ContentPage, type AyahRender } from "@/lib/quran";
import { surahHeaderAr, BASMALAH, hasBasmalah } from "@/lib/surah-names";
import { AutoFitText } from "@/components/AutoFitText";
import { useBrandHandles } from "@/components/BrandGroup";
import { Fragment } from "react";


interface Props {
  hizb: number;
  page: ContentPage;
  pageNumber: number;
  totalPages: number;
  slideId: string;
}

function renderAyahText(item: AyahRender) {
  const { ayah, endLabel, endLabelInline } = item;
  const text = ayah.aya_text;

  const labelSpanStyle = {
    fontSize: "0.82em",
    verticalAlign: "baseline",
    display: "inline-block",
    lineHeight: 1,
  } as const;

  if (endLabel && endLabelInline && text.includes(RUB_HIZB)) {
    const parts = text.split(RUB_HIZB);
    return (
      <Fragment>
        {parts.map((p, i) => (
          <Fragment key={i}>
            {p}
            {i < parts.length - 1 && (
              <span className="text-[color:var(--gold)] mx-2" style={labelSpanStyle}>
                ﴿ {endLabel} ﴾
              </span>
            )}
          </Fragment>
        ))}
      </Fragment>
    );
  }

  if (endLabel && !endLabelInline) {
    return (
      <Fragment>
        {text}
        <span className="text-[color:var(--gold)] mx-2" style={labelSpanStyle}>
          ﴿ {endLabel} ﴾
        </span>
      </Fragment>
    );
  }

  return <>{text}</>;
}

export function ContentSlide({ hizb, page, pageNumber, totalPages, slideId }: Props) {
  const fitKey = `${hizb}-${pageNumber}-${page.items.map((r) => r.ayah.id).join(",")}`;
  const { line: footerHandles } = useBrandHandles();


  return (
    <SlideFrame id={slideId}>
      <header className="absolute top-16 left-0 right-0 flex items-center justify-between px-24">
        <span className="text-[28px] text-[color:var(--emerald)] font-semibold tracking-wider">
          {pageNumber} / {totalPages}
        </span>
        <span className="warsh-text text-[44px] text-[color:var(--ink)]">
          {hizbTitleAr(hizb)}
        </span>
      </header>

      <div
        className="absolute left-0 right-0"
        style={{ top: 180, bottom: 120, paddingLeft: 96, paddingRight: 96 }}
      >
        <AutoFitText min={22} max={62} deps={fitKey}>
          <div className="warsh-text text-[color:var(--ink)]">
            {page.items.map((item) => (
              <Fragment key={item.ayah.id}>
                {item.startsSurah !== undefined && (
                  <div
                    className="text-center my-4"
                    style={{ lineHeight: 1.5 }}
                  >
                    <div
                      className="text-[color:var(--emerald)]"
                      style={{ fontSize: "1.05em", fontWeight: 700 }}
                    >
                      {surahHeaderAr(item.startsSurah)}
                    </div>
                    {hasBasmalah(item.startsSurah) && (
                      <div
                        className="text-[color:var(--gold)]"
                        style={{ fontSize: "0.95em" }}
                      >
                        {BASMALAH}
                      </div>
                    )}
                  </div>
                )}
                <span> {renderAyahText(item)} </span>
              </Fragment>
            ))}
          </div>
        </AutoFitText>
      </div>

      <footer className="absolute bottom-12 left-0 right-0 text-center text-[24px] text-[color:var(--ink)]/50 tracking-[0.3em]">
        <span dir="ltr" style={{ unicodeBidi: "isolate", display: "inline-block" }}>{footerHandles}</span> · حِزْبٌ كُلَّ يَوْم
      </footer>

    </SlideFrame>
  );
}
