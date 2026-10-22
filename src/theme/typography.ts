import { fonts } from './fonts';

export const typography = {
  screenTitle: {
    fontFamily: fonts.bold,
    fontSize: 30,
    lineHeight: 40,
  },
  heroTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 48,
    lineHeight: 56,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  label: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 16,
  },
  caption: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  button: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
  },
} as const;

/** Map numeric/CSS weights onto Poppins files (do not also set fontWeight). */
export const fontWeight = {
  regular: { fontFamily: fonts.regular },
  medium: { fontFamily: fonts.medium },
  semiBold: { fontFamily: fonts.semiBold },
  bold: { fontFamily: fonts.bold },
  extraBold: { fontFamily: fonts.extraBold },
} as const;
