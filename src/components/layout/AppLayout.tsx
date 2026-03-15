import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { PageBackdrop } from './PageBackdrop';

interface AppLayoutProps {
  title?: string;
}

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

const pageTransition = { type: 'tween', duration: 0.25, ease: [0.16, 1, 0.3, 1] };

export function AppLayout({ title }: AppLayoutProps) {
  const location = useLocation();

  return (
    <SidebarProvider>
      <div className="relative flex min-h-screen w-full">
        <PageBackdrop />
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <AppHeader title={title} />
          <main className="app-main flex-1 overflow-auto px-4 py-6 md:px-6">
            <div className="mx-auto w-full max-w-[1280px]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={location.pathname}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={pageVariants}
                  transition={pageTransition}
                  className="w-full"
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
