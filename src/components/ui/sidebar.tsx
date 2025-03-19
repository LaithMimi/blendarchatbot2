
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Create a dummy hook to replace use-mobile
const useMobile = () => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  return { isMobile };
};

// Sidebar Variant props
const sidebarVariants = cva(
  "flex h-screen flex-col overflow-hidden bg-sidebar-background text-sidebar-foreground transition-all",
  {
    variants: {
      variant: {
        default: "border-r border-sidebar-border",
        outline: "border-r border-sidebar-border bg-transparent",
        ghost: "border-r border-transparent",
      },
      size: {
        default: "w-64",
        sm: "w-52",
        lg: "w-72",
      },
      expanded: {
        true: "",
        false: "w-16 items-center",
      },
      mobile: {
        true: "fixed inset-y-0 left-0 z-40",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      expanded: true,
      mobile: false,
    },
  }
)

// Types
export interface SidebarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sidebarVariants> {
  navigationChildren?: React.ReactNode,
  footerChildren?: React.ReactNode,
  lockScreen?: boolean,
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ 
    className, 
    children, 
    mobile,
    variant, 
    size, 
    expanded,
    navigationChildren, 
    footerChildren,
    lockScreen,
    ...props 
  }, ref) => {
    // Use our new hook
    const { isMobile } = useMobile();

    React.useEffect(() => {
      if (lockScreen && isMobile) {
        document.documentElement.classList.add("overflow-hidden");
      } else {
        document.documentElement.classList.remove("overflow-hidden");
      }
    }, [lockScreen, isMobile]);

    return (
      <>
        {(mobile && isMobile && lockScreen) && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30" />
        )}
        <div
          ref={ref}
          className={cn(
            sidebarVariants({ variant, size, expanded, mobile }),
            className
          )}
          {...props}
        >
          <div className="p-6 flex flex-row items-center justify-between">
            {children && children}
          </div>
          {navigationChildren && (
            <div className="flex-1 overflow-auto py-2">
              {navigationChildren}
            </div>
          )}
          {footerChildren && (
            <div className="mt-auto p-6">
              {footerChildren}
            </div>
          )}
        </div>
      </>
    )
  }
)
Sidebar.displayName = "Sidebar"

// Navigation
export interface SidebarNavigationProps extends React.HTMLAttributes<HTMLDivElement> {}

const SidebarNavigation = React.forwardRef<HTMLDivElement, SidebarNavigationProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col gap-1", className)}
      {...props}
    />
  )
)
SidebarNavigation.displayName = "SidebarNavigation"

// Link
export interface SidebarLinkProps extends React.HTMLAttributes<HTMLAnchorElement> {
  active?: boolean
  icon?: React.ReactNode
  hideLabel?: boolean
}

const SidebarLink = React.forwardRef<HTMLAnchorElement, SidebarLinkProps>(
  ({ className, children, active, icon, hideLabel, ...props }, ref) => (
    <a
      ref={ref}
      className={cn(
        "group flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        active && "bg-sidebar-accent text-sidebar-accent-foreground",
        className
      )}
      {...props}
    >
      {icon && (
        <span className="w-6 h-6 flex items-center justify-center text-current shrink-0">
          {icon}
        </span>
      )}
      {((!hideLabel) || (hideLabel && !icon)) && (
        <span className="truncate">{children}</span>
      )}
    </a>
  )
)
SidebarLink.displayName = "SidebarLink"

export { Sidebar, SidebarNavigation, SidebarLink }
