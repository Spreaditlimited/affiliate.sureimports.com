import BrandFooter from '@/components/BrandFooter';
import FooterNewsletterForm from '@/components/FooterNewsletterForm';

export function SiteFooter() {
  return <BrandFooter home="https://www.sureimports.com" mainSite="https://www.sureimports.com" logo="/images/svg-logo-white.svg" newsletter={<FooterNewsletterForm />} />;
}
