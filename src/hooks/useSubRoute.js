import { useLocation } from 'react-router-dom';

const SUB_ROUTE_PATTERNS = [
  { tab: '/', pattern: /^\/playlist\// },
  { tab: '/', pattern: /^\/album\// },
  { tab: '/', pattern: /^\/artist\// },
  { tab: '/', pattern: /^\/chart\// },
  { tab: '/', pattern: /^\/song\// },
  { tab: '/library', pattern: /^\/playlist\// },
];

export function useSubRoute() {
  const location = useLocation();
  for (const sr of SUB_ROUTE_PATTERNS) {
    if (sr.pattern.test(location.pathname)) return sr;
  }
  return null;
}
