import { create } from "zustand";
import { persist } from "zustand/middleware";
import defaultLogoUrl from "@/assets/elqor4n-logo.png";
import fajrLogoUrl from "@/assets/fajr-al-tilawa-logo.png";

// Bundled brand marks. Kept as real imported assets (not remote asset URLs) so
// they always resolve — remote asset URLs from the source project 404 after a
// remix, which is what previously made the collaboration logos disappear.
const defaultLogo = { url: defaultLogoUrl };
const fajrLogo = { url: fajrLogoUrl };

/** Bundled default mark for the collaboration (second) brand. */
export const DEFAULT_SECONDARY_LOGO = fajrLogoUrl;


/**
 * Settings architecture:
 * - `shared`: logo + username used across ALL generators by default.
 * - Per-generator namespaces (quran, nawawi, hisn, tweet, reelCover, ...).
 *   Each generator reads its own settings; can override the shared logo
 *   or username in the future by adding fields to its namespace.
 *
 * Adding a new module = add a new field to `PerGenerator` and provide defaults.
 * No existing module is affected.
 */

export interface QuranSettings {
  narration: string;
  isticadhah: string;
  closingDua: string;
}

export interface NawawiSettings {
  closingDua: string;
}

export interface HisnSettings {
  closingDua: string;
}

export interface TweetSettings {
  displayName: string;
  handle: string;
  theme: "light" | "dim" | "dark";
  showTimestamp: boolean;
}

export interface ReelCoverSettings {
  template: "minimal" | "gradient" | "quran";
  accent: string;
  showAccentBars: boolean;
  backgroundUrl: string | null;
  backgroundDim: number; // 0..1 overlay strength when background image is used
}

/**
 * A branding profile tied to a Google account email.
 * When the user signs in, the app swaps the live shared/collab fields
 * to values stored in this profile. Anonymous users use the "default"
 * profile which is what ships out of the box.
 */
/** Which brand elements render for a brand block. */
export type BrandDisplay = "both" | "logo" | "name";

export interface BrandingProfile {
  logoUrl: string;
  username: string;
  brandDisplay: BrandDisplay;
  collaboration: boolean;
  secondaryLogoUrl: string;
  secondaryUsername: string;
  secondaryDisplay: BrandDisplay;
}

export interface CurrentUser {
  email: string;
  displayName: string | null;
  photoURL: string | null;
}

interface PerGenerator {
  quran: QuranSettings;
  nawawi: NawawiSettings;
  hisn: HisnSettings;
  tweet: TweetSettings;
  reelCover: ReelCoverSettings;
}

export interface PageState {
  selectedHizb: number;
  selectedHadith: number;
  selectedHisnChapter: number;
  tweetText: string;
  reelCoverTitle: string;
  reelCoverSubtitle: string;
}

interface Shared {
  logoUrl: string;
  username: string;
  brandDisplay: BrandDisplay;
  collaboration: boolean;
  secondaryLogoUrl: string;
  secondaryUsername: string;
  secondaryDisplay: BrandDisplay;
  currentUser: CurrentUser | null;
  profiles: Record<string, BrandingProfile>;
}

interface Store extends Shared, PerGenerator {
  setLogo: (url: string) => void;
  resetLogo: () => void;
  setUsername: (u: string) => void;
  setSecondaryLogo: (url: string) => void;
  setSecondaryUsername: (u: string) => void;
  setBrandDisplay: (d: BrandDisplay) => void;
  setSecondaryDisplay: (d: BrandDisplay) => void;
  setCollaboration: (enabled: boolean) => void;
  signInProfile: (user: CurrentUser) => void;
  signOutProfile: () => void;
  setQuran: <K extends keyof QuranSettings>(k: K, v: QuranSettings[K]) => void;
  setNawawi: <K extends keyof NawawiSettings>(k: K, v: NawawiSettings[K]) => void;
  setHisn: <K extends keyof HisnSettings>(k: K, v: HisnSettings[K]) => void;
  setTweet: <K extends keyof TweetSettings>(k: K, v: TweetSettings[K]) => void;
  setReelCover: <K extends keyof ReelCoverSettings>(k: K, v: ReelCoverSettings[K]) => void;
  pageState: PageState;
  setPageState: <K extends keyof PageState>(k: K, v: PageState[K]) => void;
}

const DEFAULT_QURAN: QuranSettings = {
  narration: "بِرِوَايَةِ وَرْشٍ عَنْ نَافِعٍ مِنْ طَرِيقِ الْأَزْرَقِ",
  isticadhah: "أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ",
  closingDua:
    "سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ، أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا أَنْتَ، أَسْتَغْفِرُكَ وَأَتُوبُ إِلَيْكَ",
};
const DEFAULT_NAWAWI: NawawiSettings = {
  closingDua: "صلَّى اللهُ على نبيِّنا محمَّدٍ وعلى آلهِ وصَحبِه وسلَّم",
};
const DEFAULT_HISN: HisnSettings = {
  closingDua: "اللَّهُمَّ أَعِنَّا عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ",
};
const DEFAULT_TWEET: TweetSettings = {
  displayName: "القرآن",
  handle: "elqor4n",
  theme: "light",
  showTimestamp: false,
};
const DEFAULT_REEL_COVER: ReelCoverSettings = {
  template: "minimal",
  accent: "#c9a24a",
  showAccentBars: true,
  backgroundUrl: null,
  backgroundDim: 0.45,
};

const DEFAULT_PAGE_STATE: PageState = {
  selectedHizb: 1,
  selectedHadith: 1,
  selectedHisnChapter: 1,
  tweetText: "قَالَ رَسُولُ اللَّهِ ﷺ:\n«إِنَّ اللَّهَ لَا يَنْظُرُ إِلَى صُوَرِكُمْ وَأَمْوَالِكُمْ، وَلَكِنْ يَنْظُرُ إِلَى قُلُوبِكُمْ وَأَعْمَالِكُمْ»",
  reelCoverTitle: "مِنْ أَحَبِّ الْأَعْمَالِ إِلَى اللَّهِ",
  reelCoverSubtitle: "",
};

const DEFAULT_BRANDING: BrandingProfile = {
  logoUrl: defaultLogo.url,
  username: "@elqor4n",
  brandDisplay: "both",
  collaboration: false,
  secondaryLogoUrl: fajrLogo.url,
  secondaryUsername: "@fajr_al_tilawa",
  secondaryDisplay: "both",
};

/** Sync the live shared branding fields into the current user's profile. */
function syncActiveProfile(state: Store): Partial<BrandingProfile> {
  return {
    logoUrl: state.logoUrl,
    username: state.username,
    brandDisplay: state.brandDisplay,
    collaboration: state.collaboration,
    secondaryLogoUrl: state.secondaryLogoUrl,
    secondaryUsername: state.secondaryUsername,
    secondaryDisplay: state.secondaryDisplay,
  };
}

export const useSettings = create<Store>()(
  persist(
    (set, get) => ({
      logoUrl: defaultLogo.url,
      username: "@elqor4n",
      brandDisplay: DEFAULT_BRANDING.brandDisplay,
      collaboration: DEFAULT_BRANDING.collaboration,
      secondaryLogoUrl: DEFAULT_BRANDING.secondaryLogoUrl,
      secondaryUsername: DEFAULT_BRANDING.secondaryUsername,
      secondaryDisplay: DEFAULT_BRANDING.secondaryDisplay,
      currentUser: null,
      profiles: {},
      quran: DEFAULT_QURAN,
      nawawi: DEFAULT_NAWAWI,
      hisn: DEFAULT_HISN,
      tweet: DEFAULT_TWEET,
      reelCover: DEFAULT_REEL_COVER,
      pageState: DEFAULT_PAGE_STATE,
      setLogo: (url) => set((s) => persistToProfile(s, { logoUrl: url })),
      resetLogo: () => set((s) => persistToProfile(s, { logoUrl: defaultLogo.url })),
      setUsername: (u) => set((s) => persistToProfile(s, { username: u })),
      setSecondaryLogo: (url) => set((s) => persistToProfile(s, { secondaryLogoUrl: url })),
      setSecondaryUsername: (u) => set((s) => persistToProfile(s, { secondaryUsername: u })),
      setBrandDisplay: (d) => set((s) => persistToProfile(s, { brandDisplay: d })),
      setSecondaryDisplay: (d) => set((s) => persistToProfile(s, { secondaryDisplay: d })),
      setCollaboration: (enabled) => set((s) => persistToProfile(s, { collaboration: enabled })),
      signInProfile: (user) => {
        const state = get();
        const existing = state.profiles[user.email];
        if (existing) {
          set({
            currentUser: user,
            logoUrl: existing.logoUrl,
            username: existing.username,
            brandDisplay: existing.brandDisplay ?? "both",
            collaboration: existing.collaboration,
            secondaryLogoUrl: existing.secondaryLogoUrl,
            secondaryUsername: existing.secondaryUsername,
            secondaryDisplay: existing.secondaryDisplay ?? "both",
          });
        } else {
          const snapshot: BrandingProfile = {
            logoUrl: state.logoUrl,
            username: state.username,
            brandDisplay: state.brandDisplay,
            collaboration: state.collaboration,
            secondaryLogoUrl: state.secondaryLogoUrl,
            secondaryUsername: state.secondaryUsername,
            secondaryDisplay: state.secondaryDisplay,
          };
          set({
            currentUser: user,
            profiles: { ...state.profiles, [user.email]: snapshot },
          });
        }
      },
      signOutProfile: () => {
        // Only reset branding if there was actually a signed-in user whose
        // profile branding we swapped in. When called from `onAuthStateChanged`
        // on every mount for an anonymous session, this would otherwise wipe
        // the user's saved local branding (including the collaboration flag)
        // every time the Settings page mounts.
        const state = get();
        if (!state.currentUser) return;
        set({
          currentUser: null,
          logoUrl: DEFAULT_BRANDING.logoUrl,
          username: DEFAULT_BRANDING.username,
          brandDisplay: DEFAULT_BRANDING.brandDisplay,
          secondaryDisplay: DEFAULT_BRANDING.secondaryDisplay,
          collaboration: DEFAULT_BRANDING.collaboration,
          secondaryLogoUrl: DEFAULT_BRANDING.secondaryLogoUrl,
          secondaryUsername: DEFAULT_BRANDING.secondaryUsername,
        });
      },
      setQuran: (k, v) => set((s) => ({ quran: { ...s.quran, [k]: v } })),
      setNawawi: (k, v) => set((s) => ({ nawawi: { ...s.nawawi, [k]: v } })),
      setHisn: (k, v) => set((s) => ({ hisn: { ...s.hisn, [k]: v } })),
      setTweet: (k, v) => set((s) => ({ tweet: { ...s.tweet, [k]: v } })),
      setReelCover: (k, v) => set((s) => ({ reelCover: { ...s.reelCover, [k]: v } })),
      setPageState: (k, v) => set((s) => ({ pageState: { ...s.pageState, [k]: v } })),
    }),
    {
      name: "elqor4n-settings",
      version: 9,
      migrate: (persisted: unknown, version) => {
        if (!persisted || typeof persisted !== "object") return persisted as never;
        const p = persisted as Record<string, unknown>;
        // v6 → v7: brand marks moved from remote asset URLs (which 404 after a
        // deploy) to bundled imports. Any stored URL that still points at the
        // old remote asset host is repaired here; uploaded data: URLs are kept.
        const isStale = (v: unknown) =>
          typeof v !== "string" || v === "" || v.startsWith("/__l5e/");
        // v7 -> v8: per-block display mode (logo / name / both).
        const withDisplay = (o: Record<string, unknown>) => {
          if (o.brandDisplay !== "logo" && o.brandDisplay !== "name") o.brandDisplay = "both";
          if (o.secondaryDisplay !== "logo" && o.secondaryDisplay !== "name") o.secondaryDisplay = "both";
        };
        withDisplay(p);
        if (version >= 5 && version < 9) {
          if (isStale(p.logoUrl)) p.logoUrl = defaultLogo.url;
          if (isStale(p.secondaryLogoUrl)) p.secondaryLogoUrl = fajrLogo.url;
          const profiles = p.profiles as Record<string, Record<string, unknown>> | undefined;
          if (profiles) {
            for (const key of Object.keys(profiles)) {
              const prof = profiles[key];
              if (isStale(prof.logoUrl)) prof.logoUrl = defaultLogo.url;
              if (isStale(prof.secondaryLogoUrl)) prof.secondaryLogoUrl = fajrLogo.url;
              withDisplay(prof);
            }
          }
          if (version < 9) {
            p.pageState = { ...DEFAULT_PAGE_STATE, ...(p.pageState as Partial<PageState> || {}) };
          }
          return p as never;
        }

        const quran: QuranSettings = {
          narration: (p.narration as string) ?? DEFAULT_QURAN.narration,
          isticadhah: (p.isticadhah as string) ?? DEFAULT_QURAN.isticadhah,
          closingDua: (p.closingDua as string) ?? DEFAULT_QURAN.closingDua,
        };
        const prevReel = (p.reelCover as Partial<ReelCoverSettings>) ?? {};
        return {
          logoUrl: (p.logoUrl as string) ?? defaultLogo.url,
          username: (p.username as string) ?? "@elqor4n",
          collaboration: false,
          brandDisplay: "both",
          secondaryLogoUrl: DEFAULT_BRANDING.secondaryLogoUrl,
          secondaryUsername: DEFAULT_BRANDING.secondaryUsername,
          secondaryDisplay: "both",
          currentUser: null,
          profiles: {},
          quran,
          nawawi: (p.nawawi as NawawiSettings) ?? DEFAULT_NAWAWI,
          hisn: (p.hisn as HisnSettings) ?? DEFAULT_HISN,
          tweet: (p.tweet as TweetSettings) ?? DEFAULT_TWEET,
          reelCover: { ...DEFAULT_REEL_COVER, ...prevReel },
          pageState: (p.pageState as PageState) ?? DEFAULT_PAGE_STATE,
        } as never;
      },
    },
  ),
);

/** Merge partial branding into shared state AND, if signed in, into the profile. */
function persistToProfile(state: Store, patch: Partial<BrandingProfile>): Partial<Store> {
  const next: Partial<Store> = { ...patch };
  const user = state.currentUser;
  if (user) {
    const current = state.profiles[user.email] ?? {
      logoUrl: state.logoUrl,
      username: state.username,
      brandDisplay: state.brandDisplay,
      collaboration: state.collaboration,
      secondaryLogoUrl: state.secondaryLogoUrl,
      secondaryUsername: state.secondaryUsername,
      secondaryDisplay: state.secondaryDisplay,
    };
    next.profiles = { ...state.profiles, [user.email]: { ...current, ...patch } };
  }
  return next;
}

// Back-compat shims for older component code. Prefer the namespaced fields.
export function useQuranSettings() {
  const s = useSettings();
  return { ...s.quran, logoUrl: s.logoUrl, username: s.username };
}

/**
 * Branding resolved through the per-block display mode.
 * Hidden elements come back as empty strings; the invariant
 * "logo AND name both empty" is enforced by re-showing the logo.
 */
export function useResolvedBranding() {
  const s = useSettings();
  const pick = (display: BrandDisplay, logo: string, name: string) => {
    const hasLogo = !!(logo && logo.trim());
    const hasName = !!(name && name.replace(/@/g, "").trim());
    let showLogo = display !== "name" && hasLogo;
    let showName = display !== "logo" && hasName;
    if (!showLogo && !showName) showLogo = true;
    return { logoUrl: showLogo ? logo : "", username: showName ? name : "" };
  };
  const primary = pick(s.brandDisplay, s.logoUrl, s.username);
  const secondary = pick(s.secondaryDisplay, s.secondaryLogoUrl, s.secondaryUsername);
  return {
    logoUrl: primary.logoUrl,
    username: primary.username,
    collaboration: s.collaboration,
    secondaryLogoUrl: secondary.logoUrl,
    secondaryUsername: secondary.username,
  };
}

/** Convenience selector for anywhere that renders the current brand pair. */
export function useBranding() {
  const s = useSettings();
  return {
    logoUrl: s.logoUrl,
    username: s.username,
    brandDisplay: s.brandDisplay,
    collaboration: s.collaboration,
    secondaryLogoUrl: s.secondaryLogoUrl,
    secondaryUsername: s.secondaryUsername,
    secondaryDisplay: s.secondaryDisplay,
  };
}

/**
 * Normalize a username so it always renders as `@handle` — leading @, never
 * trailing, never `@@handle`, never bare. Empty input → fallback (also
 * normalized to leading-@ form).
 *
 * Legacy stored values in the shape `handle@` are transparently upgraded
 * to `@handle`.
 */
export function formatHandle(input: string | null | undefined, fallback = "@elqor4n"): string {
  const normalize = (v: string) => {
    const s = v.replace(/^@+/, "").replace(/@+$/, "");
    return s ? `@${s}` : "";
  };
  const raw = (input ?? "").trim();
  const out = normalize(raw);
  if (out) return out;
  const fb = normalize(fallback);
  return fb || "@elqor4n";
}

/**
 * Zustand v5's persist middleware hydrates asynchronously after module init,
 * so the first render of any component using `useSettings` sees defaults —
 * not the persisted values. Components that MUST reflect the saved state on
 * their very first paint (e.g. the collaboration toggle on the Settings page)
 * should gate rendering on this hook.
 */
import { useEffect, useState } from "react";
export function useSettingsHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => useSettings.persist.hasHydrated());
  useEffect(() => {
    const unsubFinish = useSettings.persist.onFinishHydration(() => setHydrated(true));
    if (useSettings.persist.hasHydrated()) setHydrated(true);
    return () => {
      unsubFinish();
    };
  }, []);
  return hydrated;
}
