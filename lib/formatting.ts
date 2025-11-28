import type { UserPlan } from "./userPlan";

export type FormatPreset = "quick" | "formal" | "firm_branded";
export type StickerPosition = "top-right" | "bottom-right" | "left-vertical";
export type CoverTemplate = "classic" | "modern" | "black-bar";

export type FormatOptions = {
  include_cover?: boolean;
  include_index?: boolean;
  show_caseready_branding?: boolean;
  sticker_position?: StickerPosition;
  cover_template?: CoverTemplate;
  include_contact_block?: boolean;
  contact_block_text?: string;
  court_name?: string;
  case_title?: string;
  footer_text?: string;
  watermark_text?: string;
  slip_sheets?: boolean;
  color_coded_stickers?: boolean;
  firm_logo_url?: string;
  optimized_pdf?: boolean;
};

const FORMAT_DEFAULTS: Record<FormatPreset, Required<FormatOptions>> = {
  quick: {
    include_cover: false,
    include_index: false,
    show_caseready_branding: true,
    sticker_position: "top-right",
    cover_template: "classic",
    include_contact_block: false,
    contact_block_text: "",
    court_name: "",
    case_title: "",
    footer_text: "",
    watermark_text: "",
    slip_sheets: false,
    color_coded_stickers: false,
    firm_logo_url: "",
    optimized_pdf: true,
  },
  formal: {
    include_cover: true,
    include_index: true,
    show_caseready_branding: true,
    sticker_position: "top-right",
    cover_template: "classic",
    include_contact_block: true,
    contact_block_text: "",
    court_name: "",
    case_title: "",
    footer_text: "",
    watermark_text: "",
    slip_sheets: false,
    color_coded_stickers: false,
    firm_logo_url: "",
    optimized_pdf: true,
  },
  firm_branded: {
    include_cover: true,
    include_index: true,
    show_caseready_branding: false,
    sticker_position: "top-right",
    cover_template: "modern",
    include_contact_block: true,
    contact_block_text: "",
    court_name: "",
    case_title: "",
    footer_text: "",
    watermark_text: "",
    slip_sheets: false,
    color_coded_stickers: true,
    firm_logo_url: "",
    optimized_pdf: true,
  },
};

export const normalizePreset = (value?: string | null): FormatPreset => {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "formal") return "formal";
  if (normalized === "firm_branded") return "firm_branded";
  return "quick";
};

export const getDefaultFormatOptions = (preset: FormatPreset) => ({
  ...FORMAT_DEFAULTS[preset],
});

const sanitizeStickerPosition = (
  value?: StickerPosition | string | null
): StickerPosition => {
  if (value === "bottom-right" || value === "left-vertical") return value;
  return "top-right";
};

export const mergeOptionsWithDefaults = (
  preset: FormatPreset,
  options?: Partial<FormatOptions> | null
): Required<FormatOptions> => {
  const defaults = FORMAT_DEFAULTS[preset];
  const merged = { ...defaults, ...(options ?? {}) };
  return {
    include_cover: Boolean(merged.include_cover),
    include_index: Boolean(merged.include_index),
    show_caseready_branding: merged.show_caseready_branding !== false,
    sticker_position: sanitizeStickerPosition(merged.sticker_position),
    cover_template:
      merged.cover_template === "modern" || merged.cover_template === "black-bar"
        ? merged.cover_template
        : "classic",
    include_contact_block: merged.include_contact_block !== false,
    contact_block_text: merged.contact_block_text || "",
    court_name: merged.court_name || "",
    case_title: merged.case_title || "",
    footer_text: merged.footer_text || "",
    watermark_text: merged.watermark_text || "",
    slip_sheets: Boolean(merged.slip_sheets),
    color_coded_stickers: Boolean(merged.color_coded_stickers),
    firm_logo_url: merged.firm_logo_url || "",
    optimized_pdf: merged.optimized_pdf !== false,
  };
};

const pickFormalOptions = (options: Required<FormatOptions>) => ({
  include_cover: options.include_cover,
  include_index: options.include_index,
  show_caseready_branding: options.show_caseready_branding,
  sticker_position: options.sticker_position,
  include_contact_block: options.include_contact_block,
  contact_block_text: options.contact_block_text,
  court_name: options.court_name,
  case_title: options.case_title,
  optimized_pdf: options.optimized_pdf,
});

export const resolveFormattingForPlan = (input: {
  preset?: string | null;
  options?: Partial<FormatOptions> | null;
  plan: UserPlan;
}) => {
  if (input.plan === "free") {
    return {
      preset: "quick" as const,
      options: {
        ...getDefaultFormatOptions("quick"),
        show_caseready_branding: true,
        sticker_position: "top-right",
        include_cover: false,
        include_index: false,
        watermark_text: "",
        footer_text: "",
        slip_sheets: false,
        color_coded_stickers: false,
      },
    };
  }

  const requestedPreset = normalizePreset(input.preset);
  const preset =
    input.plan === "solo" && requestedPreset === "firm_branded"
      ? "formal"
      : requestedPreset;
  const merged = mergeOptionsWithDefaults(preset, input.options);

  if (preset === "quick") {
    return {
      preset,
      options: {
        ...getDefaultFormatOptions("quick"),
        show_caseready_branding: true,
      },
    };
  }

  if (preset === "formal" && input.plan === "solo") {
    return {
      preset,
      options: pickFormalOptions(merged),
    };
  }

  // Firm preset (firm users) keeps all options
  return { preset, options: merged };
};
