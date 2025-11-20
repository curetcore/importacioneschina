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

        // Shopify Polaris Design System 2025 - Paleta oficial actualizada (colores reales de Shopify)
        shopify: {
          // Primary/Brand - Gris oscuro (cambio en 2025, antes era verde)
          primary: {
            DEFAULT: "#202223", // Gris oscuro principal (Shopify real)
            hover: "#1a1a1a", // Negro en hover
            pressed: "#111213", // Negro profundo (navbar color)
            text: "#4a4a4a", // Gris medio para texto
          },
          // Interactive - Azul para links y acciones
          interactive: {
            DEFAULT: "#005bd3", // Azul link
            hover: "#004c9e",
            pressed: "#003d7a",
            disabled: "#b5b5b5",
          },
          // Success - Verde
          success: {
            fill: "#047b5d", // Verde principal
            surface: "#92fcac", // Background claro
            border: "#92fcac",
            text: "#014b40", // Verde oscuro para texto
            icon: "#047b5d",
          },
          // Warning - Amarillo
          warning: {
            fill: "#ffb800", // Amarillo principal
            surface: "#ffc879", // Background claro
            border: "#ffc879",
            text: "#5e4200", // Marrón texto
            icon: "#ffb800",
          },
          // Critical/Error - Rojo
          critical: {
            fill: "#c70a24", // Rojo principal
            surface: "#fec1c7", // Background claro
            border: "#fec1c7",
            text: "#8e0b21", // Rojo oscuro
            icon: "#c70a24",
          },
          // Info - Azul claro
          info: {
            fill: "#91d0ff", // Azul claro principal
            surface: "#a8d8ff", // Background claro
            border: "#a8d8ff",
            text: "#003a5a", // Azul oscuro
            icon: "#91d0ff",
          },
          // Magic (AI) - Morado
          magic: {
            fill: "#8051ff", // Morado principal
            surface: "#e4deff", // Background claro
            border: "#e4deff",
            text: "#5700d1", // Morado oscuro
            icon: "#8051ff",
          },
          // Text colors
          text: {
            DEFAULT: "#202223", // Gris oscuro casi negro (Shopify real)
            subdued: "#6B6C72", // Gris medio (Shopify)
            disabled: "#b5b5b5", // Gris claro
            link: "#005bd3", // Azul para links
            onPrimary: "#ffffff", // Blanco sobre primary
            inverse: "#ffffff", // Blanco para navbar oscuro
          },
          // Surface/Background colors
          surface: {
            DEFAULT: "#ffffff", // Blanco puro para cards
            neutral: "#F6F6F7", // Gris muy claro (sidebar Shopify)
            subdued: "#f1f1f1", // Gris claro
            disabled: "#fafafa",
            hovered: "#f6f6f6",
            pressed: "#f1f1f1",
            selected: "#e4e4e4", // Gris seleccionado
          },
          // Background (page background)
          background: {
            DEFAULT: "#F2F3F4", // Gris claro page background (Shopify real)
            hover: "#e4e4e4",
            pressed: "#d2d2d2",
            selected: "#d2d2d2",
          },
          // Borders
          border: {
            DEFAULT: "#D2D5D8", // Border normal (Shopify)
            subdued: "#E4E5E7", // Muy sutil (Shopify)
            neutral: "#E1E4E8", // Dividers (Shopify)
            strong: "#8c8c8c", // Fuerte
            card: "#D8D8D8", // KPI cards border (Shopify)
          },
          // Navbar (top bar oscuro)
          navbar: {
            DEFAULT: "#111213", // Negro con ligero tinte gris
            search: "#1C1C1C", // Barra de búsqueda
            text: "#ffffff", // Texto blanco
            icon: "#ffffff", // Iconos blancos
          },
          // Inverse (dark backgrounds)
          inverse: {
            DEFAULT: "#1a1a1a", // Negro para fondos invertidos
            text: "#ffffff", // Blanco para texto en fondos oscuros
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
