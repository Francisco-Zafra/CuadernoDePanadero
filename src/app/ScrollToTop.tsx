import { useEffect } from 'react';
import { useLocation } from 'react-router';

/** Each route change starts at the top of the page. */
export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
