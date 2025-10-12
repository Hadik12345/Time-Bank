import React, { createContext, useContext, useState } from 'react';
import { cn } from '../../lib/utils';
import { Slot } from '@radix-ui/react-slot';

const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => useContext(SidebarContext);

export const Sidebar = ({ className, children }) => {
  const { isOpen } = useSidebar();
  return (
    <aside className={cn("h-screen md:w-64 flex-col md:flex fixed md:relative inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out", 
      isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      className
    )}>
      <div className="flex flex-col h-full">{children}</div>
    </aside>
  );
};

export const SidebarHeader = ({ className, children }) => (
  <div className={cn("p-4", className)}>{children}</div>
);

export const SidebarContent = ({ className, children }) => (
  <div className={cn("flex-1 overflow-y-auto", className)}>{children}</div>
);

export const SidebarFooter = ({ className, children }) => (
  <div className={cn("p-4", className)}>{children}</div>
);

export const SidebarGroup = ({ className, children }) => (
    <div className={cn("px-3", className)}>{children}</div>
);

export const SidebarGroupContent = ({ className, children }) => (
    <div className={cn("", className)}>{children}</div>
);

export const SidebarMenu = ({ children }) => (
  <nav>
    <ul>{children}</ul>
  </nav>
);

export const SidebarMenuItem = ({ children }) => (
  <li>{children}</li>
);

export const SidebarMenuButton = ({ className, children, asChild = false, ...props }) => {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp className={cn("w-full text-left", className)} {...props}>
      {children}
    </Comp>
  );
};

export const SidebarTrigger = ({ className, ...props }) => {
  const { setIsOpen } = useSidebar();
  return (
    <button onClick={() => setIsOpen(o => !o)} className={cn("md:hidden", className)} {...props}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
    </button>
  )
}

