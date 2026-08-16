import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

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
				sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
				mono: ['JetBrains Mono', 'monospace'],
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
				// Risk Colors
				risk: {
					low: "hsl(var(--risk-low))",
					medium: "hsl(var(--risk-medium))",
					high: "hsl(var(--risk-high))",
					critical: "hsl(var(--risk-critical))",
				},
				// Data Visualization
				data: {
					teal: "hsl(var(--data-teal))",
					amber: "hsl(var(--data-amber))",
					rose: "hsl(var(--data-rose))",
					violet: "hsl(var(--data-violet))",
					emerald: "hsl(var(--data-emerald))",
				},
				// Alert Colors
				alert: {
					info: "hsl(var(--alert-info))",
					warning: "hsl(var(--alert-warning))",
					danger: "hsl(var(--alert-danger))",
					severe: "hsl(var(--alert-severe))",
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
				"accordion-down": {
					from: { height: "0" },
					to: { height: "var(--radix-accordion-content-height)" },
				},
				"accordion-up": {
					from: { height: "var(--radix-accordion-content-height)" },
					to: { height: "0" },
				},
				"pulse-glow": {
					"0%, 100%": {
						boxShadow: "0 0 20px hsl(38 92% 50% / 0.3), 0 0 40px hsl(38 92% 50% / 0.1)",
					},
					"50%": {
						boxShadow: "0 0 30px hsl(38 92% 50% / 0.5), 0 0 60px hsl(38 92% 50% / 0.2)",
					},
				},
				"float": {
					"0%, 100%": { transform: "translateY(0)" },
					"50%": { transform: "translateY(-8px)" },
				},
				"shimmer": {
					"0%": { backgroundPosition: "-200% 0" },
					"100%": { backgroundPosition: "200% 0" },
				},
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
				"pulse-glow": "pulse-glow 2s ease-in-out infinite",
				"float": "float 3s ease-in-out infinite",
				"shimmer": "shimmer 2s linear infinite",
			},
			backgroundImage: {
				"gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
				"gradient-hero": "linear-gradient(135deg, hsl(220 16% 5%), hsl(220 16% 10%), hsl(220 14% 12%))",
			},
			boxShadow: {
				"glow-accent": "0 0 40px hsl(168 76% 42% / 0.2)",
				"glow-primary": "0 0 40px hsl(38 92% 50% / 0.2)",
				"glow-danger": "0 0 40px hsl(4 90% 58% / 0.2)",
				"card": "0 8px 32px hsl(0 0% 0% / 0.4)",
				"elevated": "0 12px 40px hsl(0 0% 0% / 0.5)",
			},
		},
	},
	plugins: [tailwindcssAnimate],
} satisfies Config;
