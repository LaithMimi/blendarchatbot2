import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: "2rem",
			screens: {
				"2xl": "1400px",
			},
		},
		extend: {
			fontFamily: {
				sans: ["Heebo", "sans-serif"],
				alef: ["Alef", "sans-serif"],
				arabic: ["Noto Sans Arabic", "sans-serif"],
			},
			colors: {
				border: "hsl(var(--border))",
				input: "hsl(var(--input))",
				ring: "hsl(var(--ring))",
				background: "hsl(var(--background))",
				foreground: "hsl(var(--foreground))",
				primary: {
					DEFAULT: "hsl(var(--primary))",
					foreground: "hsl(var(--primary-foreground))",
				},
				secondary: {
					DEFAULT: "hsl(var(--secondary))",
					foreground: "hsl(var(--secondary-foreground))",
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive))",
					foreground: "hsl(var(--destructive-foreground))",
				},
				muted: {
					DEFAULT: "hsl(var(--muted))",
					foreground: "hsl(var(--muted-foreground))",
				},
				accent: {
					DEFAULT: "hsl(var(--accent))",
					foreground: "hsl(var(--accent-foreground))",
				},
				popover: {
					DEFAULT: "hsl(var(--popover))",
					foreground: "hsl(var(--popover-foreground))",
				},
				card: {
					DEFAULT: "hsl(var(--card))",
					foreground: "hsl(var(--card-foreground))",
				},
				// Brand colors
				brand: {
					yellow: "#FBD449",
					bordeaux: "#811E2F",
					darkGray: "#353131",
					background: "#F1EDE0",
				},
				sidebar: {
					DEFAULT: "hsl(var(--sidebar-background))",
					foreground: "hsl(var(--sidebar-foreground))",
					primary: "hsl(var(--sidebar-primary))",
					"primary-foreground": "hsl(var(--sidebar-primary-foreground))",
					accent: "hsl(var(--sidebar-accent))",
					"accent-foreground": "hsl(var(--sidebar-accent-foreground))",
					border: "hsl(var(--sidebar-border))",
					ring: "hsl(var(--sidebar-ring))",
				},
			},
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},
			keyframes: {
				// Smooth expanding accordion
				"accordion-down": {
					from: { height: "0" },
					to: { height: "var(--radix-accordion-content-height)" },
				},
				"accordion-up": {
					from: { height: "var(--radix-accordion-content-height)" },
					to: { height: "0" },
				},
				// Smooth fade-in and fade-out
				"fade-in": {
					"0%": { opacity: "0", transform: "translateY(10px)" },
					"100%": { opacity: "1", transform: "translateY(0)" },
				},
				"fade-out": {
					"0%": { opacity: "1", transform: "translateY(0)" },
					"100%": { opacity: "0", transform: "translateY(10px)" },
				},
				// Sliding animations
				"slide-in-right": {
					"0%": { transform: "translateX(100%)" },
					"100%": { transform: "translateX(0)" },
				},
				"slide-in-left": {
					"0%": { transform: "translateX(-100%)" },
					"100%": { transform: "translateX(0)" },
				},
				"slide-in-bottom": {
					"0%": { transform: "translateY(20px)", opacity: "0" },
					"100%": { transform: "translateY(0)", opacity: "1" },
				},
				// Pulse effect (medium speed pulsing)
				pulse: {
					"0%, 100%": { opacity: "1" },
					"50%": { opacity: "0.85" },
				},
				// Floating animations for elements (5-8s duration)
				float: {
					"0%, 100%": { transform: "translateY(0)" },
					"50%": { transform: "translateY(-5px)" },
				},
				"float-slow": {
					"0%, 100%": { transform: "translateY(0) translateX(0)" },
					"50%": { transform: "translateY(-5px) translateX(3px)" },
				},
				"float-slower": {
					"0%, 100%": { transform: "translateY(0) translateX(0)" },
					"50%": { transform: "translateY(-7px) translateX(4px)" },
				},
				"rotate-slow": {
					"0%": { transform: "rotate(0deg)" },
					"50%": { transform: "rotate(2deg)" },
					"100%": { transform: "rotate(0deg)" },
				},
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
				"fade-in": "fade-in 0.2s ease-out",
				"fade-out": "fade-out 0.2s ease-out",
				"slide-in-right": "slide-in-right 0.7s ease-out",
				"slide-in-left": "slide-in-left 0.7s ease-out",
				"slide-in-bottom": "slide-in-bottom 0.7s ease-out",
				"pulse-medium": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
				"float-slow": "float-slow 3s ease-in-out infinite",
				"float-slower": "float-slower 3s ease-in-out infinite",
				"rotate-slow": "rotate-slow 3s ease-in-out infinite",
			},
		},
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
