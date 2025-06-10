import Hero from "@/components/Hero"
import VerseOfTheDay from "@/components/VerseOfTheDay"
import About from "@/components/About"

export default function Home() {
  return (
    <div className="min-h-screen">
      <Hero />
      <VerseOfTheDay />
      <About />
    </div>
  )
}
