import type { TextStyle } from 'react-native';

/**
 * Poppins faces for the Self Kiosk UI.
 *
 * On iOS use these PostScript names as fontFamily.
 * Do not set fontWeight together with them — pick the face instead:
 *   fontFamily: fonts.extraBold  // not fontWeight: '800'
 */
export const fonts = {
  regular: 'Poppins-Regular',
  medium: 'Poppins-Medium',
  semiBold: 'Poppins-SemiBold',
  bold: 'Poppins-Bold',
  extraBold: 'Poppins-ExtraBold',
} as const;

export function fontForWeight(
  weight?: TextStyle['fontWeight'],
): string {
  switch (weight) {
    case '100':
    case '200':
    case '300':
    case '400':
    case 'normal':
      return fonts.regular;
    case '500':
      return fonts.medium;
    case '600':
      return fonts.semiBold;
    case '700':
    case 'bold':
      return fonts.bold;
    case '800':
    case '900':
      return fonts.extraBold;
    default:
      return fonts.regular;
  }
}
