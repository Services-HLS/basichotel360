// components/ConditionalFooter.tsx
import { useLocation } from 'react-router-dom';
import Footer from './Footer';

const ConditionalFooter = () => {
  const location = useLocation();
  
  // Hide footer on these pages
  const hideFooterPaths = ['/login', '/register', '/forgot-password'];
  
  if (hideFooterPaths.includes(location.pathname)) {
    return null;
  }

  return <Footer />;
};

export default ConditionalFooter;