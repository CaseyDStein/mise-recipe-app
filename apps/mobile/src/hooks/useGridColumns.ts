import { useWindowDimensions } from 'react-native';

const TABLET_BREAKPOINT = 768;

/** Returns 2 on tablets/large screens, 1 on phones. */
export function useGridColumns(): number {
  const { width } = useWindowDimensions();
  return width >= TABLET_BREAKPOINT ? 2 : 1;
}
