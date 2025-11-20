/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Shadcn/UI base colors (mantener compatibilidad)
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

        // Shopify Design System Colors - Paleta oficial Shopify 2024
        shopify: {
          // Primary/Brand - Verde Shopify
          primary: {
            DEFAULT: "#008060", // Verde principal
            hover: "#006e52",
            pressed: "#005c46",
            subdued: "#e3f5f1", // Background claro
          },
          // Interactive - Azul para links y acciones
          interactive: {
            DEFAULT: "#2c6ecb",
            hover: "#1f5199",
            pressed: "#103262",
            disabled: "#c9cccf",
          },
          // Success (mismo que primary green)
          success: {
            surface: "#aee9d1", // Background claro
            border: "#00a47c",
            text: "#008060",
            icon: "#008060",
          },
          // Warning
          warning: {
            surface: "#ffea8a", // Background claro
            border: "#ffc453",
            text: "#916a00", // Marrón texto
            icon: "#ffc453",
          },
          // Critical/Error
          critical: {
            surface: "#ffc0b3", // Background claro
            border: "#d82c0d",
            text: "#d72c0d",
            icon: "#d82c0d",
          },
          // Info
          info: {
            surface: "#b3e3ff", // Background claro
            border: "#0074d4",
            text: "#003d7a", // Azul oscuro
            icon: "#0074d4",
          },
          // Text colors
          text: {
            DEFAULT: "#202223", // Casi negro
            subdued: "#6d7175", // Gris secundario
            disabled: "#8c9196",
            onPrimary: "#ffffff", // Blanco sobre verde
          },
          // Surface/Background colors
          surface: {
            DEFAULT: "#ffffff", // Blanco puro para cards
            neutral: "#f6f6f7", // Gris muy claro
            subdued: "#f1f2f4", // Gris claro
            disabled: "#fafbfb",
            hovered: "#f6f6f7",
            pressed: "#f1f2f4",
            selected: "#f2f7fe", // Azul claro seleccionado
          },
          // Background (page background)
          background: {
            DEFAULT: "#f1f2f4", // Gris claro page background
            hover: "#e4e5e7",
            pressed: "#d2d3d5",
            selected: "#cce0f6",
          },
          // Borders
          border: {
            DEFAULT: "#c9cccf", // Border normal
            subdued: "#f1f2f4", // Muy sutil
            neutral: "#e1e3e5", // Sutil
            strong: "#8c9196", // Fuerte
          },
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "1" }],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
        inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
        none: "none",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in",
        "slide-in": "slideIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
}
