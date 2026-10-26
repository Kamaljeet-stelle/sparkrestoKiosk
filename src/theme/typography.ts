import { fonts } from './fonts';

export const typography = {
  label: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 16,
  },
  button: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
  },
} as const;
