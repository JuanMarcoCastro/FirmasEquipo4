const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

console.log("🚀 Configurando Casa Monarca App...\n")

// Check if .env.local exists
const envPath = path.join(process.cwd(), ".env.local")
if (!fs.existsSync(envPath)) {
  console.log("📝 Creando archivo .env.local...")
  const envExample = path.join(process.cwd(), ".env.example")
  if (fs.existsSync(envExample)) {
    fs.copyFileSync(envExample, envPath)
    console.log("✅ Archivo .env.local creado desde .env.example")
    console.log("⚠️  IMPORTANTE: Edita .env.local con tus configuraciones de Supabase\n")
  } else {
    console.log("❌ No se encontró .env.example")
  }
}

// Check Node.js version
const nodeVersion = process.version
const majorVersion = Number.parseInt(nodeVersion.slice(1).split(".")[0])
if (majorVersion < 18) {
  console.log("❌ Node.js 18+ es requerido. Versión actual:", nodeVersion)
  process.exit(1)
}
console.log("✅ Node.js version:", nodeVersion)

// Install dependencies if node_modules doesn't exist
if (!fs.existsSync(path.join(process.cwd(), "node_modules"))) {
  console.log("📦 Instalando dependencias...")
  try {
    execSync("npm install", { stdio: "inherit" })
    console.log("✅ Dependencias instaladas")
  } catch (error) {
    console.log("❌ Error instalando dependencias:", error.message)
    process.exit(1)
  }
} else {
  console.log("✅ Dependencias ya instaladas")
}

console.log("\n🎉 Setup completado!")
console.log("\n📋 Próximos pasos:")
console.log("1. Edita .env.local con tus configuraciones de Supabase")
console.log("2. Ejecuta los scripts SQL en Supabase Dashboard")
console.log("3. Configura Storage buckets en Supabase")
console.log("4. Ejecuta: npm run dev")
console.log("\n📚 Ver README.md para instrucciones detalladas")
