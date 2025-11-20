/**
 * Generate Favicons and Logo Variants
 *
 * Generates all necessary sizes for:
 * - Favicons (16x16, 32x32, 48x48)
 * - Apple Touch Icon (180x180)
 * - PWA Icons (192x192, 512x512)
 * - Optimized versions for web
 */

import sharp from "sharp"
import fs from "fs/promises"
import path from "path"

const INPUT_DIR = path.join(process.cwd(), "public/images")
const OUTPUT_DIR = path.join(process.cwd(), "public")

const SIZES = [
  { name: "favicon-16x16.png", size: 16, input: "isotipo" },
  { name: "favicon-32x32.png", size: 32, input: "isotipo" },
  { name: "favicon-48x48.png", size: 48, input: "isotipo" },
  { name: "apple-touch-icon.png", size: 180, input: "isotipo" },
  { name: "logo-192.png", size: 192, input: "isotipo" },
  { name: "logo-512.png", size: 512, input: "isotipo" },
]

async function generateFavicons() {
  console.log("🎨 Generando favicons y logos optimizados...\n")

  try {
    // Generate different sizes
    for (const config of SIZES) {
      const inputFile = path.join(INPUT_DIR, `${config.input}-importacion.png`)
      const outputFile = path.join(OUTPUT_DIR, config.name)

      console.log(`📐 Generando ${config.name} (${config.size}x${config.size})...`)

      await sharp(inputFile)
        .resize(config.size, config.size, {
          fit: "contain",
          background: { r: 255, g: 255, b: 255, alpha: 0 },
        })
        .png({ quality: 90, compressionLevel: 9 })
        .toFile(outputFile)

      const stats = await fs.stat(outputFile)
      console.log(`  ✅ Creado: ${(stats.size / 1024).toFixed(2)} KB\n`)
    }

    // Optimize logotipo for web
    console.log("🖼️  Optimizando logotipo para web...")
    const logoInput = path.join(INPUT_DIR, "logotipo-importacion.png")
    const logoOutput = path.join(OUTPUT_DIR, "images", "logo.png")

    await sharp(logoInput)
      .resize(300, null, { fit: "inside" }) // Max width 300px
      .png({ quality: 85, compressionLevel: 9 })
      .toFile(logoOutput)

    const logoStats = await fs.stat(logoOutput)
    console.log(`  ✅ Logo optimizado: ${(logoStats.size / 1024).toFixed(2)} KB\n`)

    // Optimize isotipo for web
    console.log("🔷 Optimizando isotipo para web...")
    const isotipoInput = path.join(INPUT_DIR, "isotipo-importacion.png")
    const isotipoOutput = path.join(OUTPUT_DIR, "images", "isotipo.png")

    await sharp(isotipoInput)
      .resize(80, 80, { fit: "contain" }) // 80x80 for navbar
      .png({ quality: 90, compressionLevel: 9 })
      .toFile(isotipoOutput)

    const isotipoStats = await fs.stat(isotipoOutput)
    console.log(`  ✅ Isotipo optimizado: ${(isotipoStats.size / 1024).toFixed(2)} KB\n`)

    console.log("✅ Todos los favicons y logos generados exitosamente!")
    console.log("\n📦 Archivos generados:")
    console.log("  - /public/favicon-16x16.png")
    console.log("  - /public/favicon-32x32.png")
    console.log("  - /public/favicon-48x48.png")
    console.log("  - /public/apple-touch-icon.png")
    console.log("  - /public/logo-192.png")
    console.log("  - /public/logo-512.png")
    console.log("  - /public/images/logo.png (optimized)")
    console.log("  - /public/images/isotipo.png (optimized)")
  } catch (error) {
    console.error("❌ Error generando favicons:", error)
    process.exit(1)
  }
}

generateFavicons()
