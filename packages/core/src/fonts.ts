export const DEFAULT_GOOGLE_FONT_FAMILY = "Montserrat";
export const MAX_GOOGLE_FONT_FAMILY_LENGTH = 80;

export const GOOGLE_FONT_FAMILIES = [
  "Montserrat",
  "Abril Fatface",
  "Anton",
  "Archivo",
  "Arimo",
  "Bangers",
  "Barlow",
  "Bebas Neue",
  "Bitter",
  "Bree Serif",
  "Cabin",
  "Cairo",
  "Catamaran",
  "Cinzel",
  "Comfortaa",
  "Cormorant Garamond",
  "Crimson Text",
  "Dancing Script",
  "DM Sans",
  "Domine",
  "Exo 2",
  "Fira Sans",
  "Fjalla One",
  "Fredoka",
  "Great Vibes",
  "Heebo",
  "Hind",
  "IBM Plex Sans",
  "Inconsolata",
  "Inter",
  "Josefin Sans",
  "Kanit",
  "Karla",
  "Lato",
  "Libre Baskerville",
  "Libre Franklin",
  "Lilita One",
  "Lobster",
  "Lora",
  "Manrope",
  "Merriweather",
  "Merriweather Sans",
  "Mukta",
  "Mulish",
  "Nanum Gothic",
  "Noto Sans",
  "Noto Serif",
  "Nunito",
  "Nunito Sans",
  "Open Sans",
  "Orbitron",
  "Oswald",
  "Outfit",
  "Pacifico",
  "Passion One",
  "Permanent Marker",
  "Play",
  "Playfair Display",
  "Plus Jakarta Sans",
  "Poppins",
  "Prompt",
  "PT Sans",
  "PT Serif",
  "Quattrocento",
  "Quicksand",
  "Raleway",
  "Roboto",
  "Roboto Condensed",
  "Roboto Mono",
  "Roboto Slab",
  "Rokkitt",
  "Rubik",
  "Russo One",
  "Satisfy",
  "Shadows Into Light",
  "Signika Negative",
  "Slabo 27px",
  "Source Code Pro",
  "Source Sans 3",
  "Source Serif 4",
  "Space Grotesk",
  "Space Mono",
  "Spectral",
  "Titillium Web",
  "Ubuntu",
  "Urbanist",
  "Varela Round",
  "Vollkorn",
  "Work Sans",
  "Yanone Kaffeesatz",
  "Yellowtail",
  "Zilla Slab",
  "Alegreya",
  "Alegreya Sans",
  "Amatic SC",
  "Assistant",
  "Chivo",
  "Lexend",
  "Maven Pro",
  "Noto Sans JP"
] as const;

const UNSAFE_GOOGLE_FONT_FAMILY_PATTERN = /[\u0000-\u001f\u007f"'`,;:{}()[\]<>\\|/@#$%^&*=!?~]/;

export function normalizeGoogleFontFamilyName(value: unknown): string {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

export function validateGoogleFontFamilyName(value: unknown): string {
  const normalized = normalizeGoogleFontFamilyName(value);
  if (!normalized) {
    throw new Error("Google Font family is required.");
  }
  if (normalized.length > MAX_GOOGLE_FONT_FAMILY_LENGTH) {
    throw new Error(`Google Font family must be ${MAX_GOOGLE_FONT_FAMILY_LENGTH} characters or less.`);
  }
  if (/https?:/i.test(normalized) || UNSAFE_GOOGLE_FONT_FAMILY_PATTERN.test(normalized)) {
    throw new Error(`"${normalized}" is not a safe Google Font family name.`);
  }
  if (!/[a-z0-9]/i.test(normalized)) {
    throw new Error(`"${normalized}" is not a safe Google Font family name.`);
  }
  return normalized;
}

export function encodeGoogleFontFamilyForCss2(family: string): string {
  return validateGoogleFontFamilyName(family).replace(/ /g, "+");
}
